const koffi = require("koffi");
const { app, BrowserWindow } = require("electron");
const path = require("path");
const winax = require("winax");
const { fork } = require("child_process");
const { SerialPort } = require("serialport");

const isDev = !app.isPackaged;

let mainWindow;
let comWorker = null;
let comRequestId = 1;
const comPending = new Map();
const connectedPorts = new Map();

function ensureComWorker() {
  if (comWorker && !comWorker.killed) {
    return;
  }

  const workerPath = path.join(__dirname, "com-worker.js");
  comWorker = fork(workerPath);

  comWorker.on("message", (msg) => {
    if (!msg) return;

    // Ответ на запрос
    if (msg.replyTo) {
      const pending = comPending.get(msg.replyTo);
      if (!pending) {
        return;
      }
      comPending.delete(msg.replyTo);

      if (msg.error) {
        pending.resolve({ error: msg.error });
      } else {
        pending.resolve(msg.result || { ok: true });
      }
      return;
    }

    // Событие от COM
    if (msg.type === "com-event" && mainWindow) {
      mainWindow.webContents.send("com-event", {
        instanceId: msg.instanceId,
        eventName: msg.eventName,
        args: msg.args,
      });
    }
  });

  comWorker.on("exit", () => {
    comWorker = null;
  });
}

function sendComCommand(type, payload) {
  return new Promise((resolve) => {
    ensureComWorker();

    if (!comWorker) {
      resolve({ error: "COM worker not started" });
      return;
    }

    const requestId = comRequestId++;
    comPending.set(requestId, { resolve });

    comWorker.send({
      requestId,
      type,
      payload,
    });

    // Простейший таймаут, чтобы не зависать навсегда
    setTimeout(() => {
      if (comPending.has(requestId)) {
        comPending.delete(requestId);
        resolve({ error: "COM worker timeout" });
      }
    }, 5000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    backgroundColor: "#000000",
  });

  const { ipcMain } = require("electron");

  ipcMain.handle(
    "dll-call",
    (event, { path: dllPath, funName, returnType, paramsType, params }) => {
      const dllPathLocal = path.join(
        isDev ? __dirname : process.resourcesPath,
        isDev ? ".." : "",
        "testdll",
        dllPath,
      );

      try {
        if (dllPath === 'eBridge') {
          const lib = koffi.load('C:/eBridge/eBridgeLauncher64.dll');

          const PerformCardOperation = lib.func('__stdcall', 'PerformCardOperation', 'void', ['string', 'void **']);

          const outPtrBuffer = Buffer.alloc(8);

          const xml = "<PerformCardOperation><OperationDataRq><OperationType>Sale</OperationType><Amount>200</Amount><Currency></Currency></OperationDataRq></PerformCardOperation>"

          PerformCardOperation(xml, outPtrBuffer);

          const rawAddr = outPtrBuffer.readBigUInt64LE(0);

          if (rawAddr === 0n) {
            return { path: '-', error: 'result path is null' };
          }

          try {
            const ptr = koffi.decode(outPtrBuffer, 'void *')
            const rawBytes = koffi.decode(ptr, 'uint8_t', 4096);

            const nullIndex = rawBytes.indexOf(0);
            const cleanBytes = nullIndex !== -1 ? rawBytes.subarray(0, nullIndex) : rawBytes;

            const decoder = new TextDecoder('windows-1251');
            const resultXml = decoder.decode(cleanBytes);
            return { path: "-", result: resultXml };
          } catch (err) {
            throw new Error(`Out parse error: ${err}`);
          } finally {
            const kernel32 = koffi.load('kernel32.dll');
            const LocalFree = kernel32.func('__stdcall', 'LocalFree', 'void *', ['void *']);
            const result = LocalFree(rawAddr);

            if (result !== null) {
              console.error('Memory free error', result);
            }
          }
        }
        const dll = koffi.load(dllPathLocal);
        const DoSomething = dll.func(funName, returnType, paramsType);
        return { path: dllPathLocal, result: DoSomething(...params) };
      } catch (error) {
        return { path: dllPathLocal, error: error.message };
      }
    },
  );

  ipcMain.handle("dll-call-com", (event, props) => {
    const { source, funName, params } = props;
    try {
      const fso = new winax.Object(source);

      if (!fso || !fso[`${funName}`]) {
        return { error: "Function not found" };
      }

      let result = fso[`${funName}`](...params);

      // Любые COM-объекты принудительно приводим к строке
      if (result && typeof result === "object") {
        // Для FileSystemObject.GetSpecialFolder сначала пробуем взять путь
        if (result.Path && typeof result.Path === "string") {
          result = result.Path;
        } else if (result.Path && typeof result.Path.toString === "function") {
          result = result.Path.toString();
        } else if (typeof result.toString === "function") {
          result = result.toString();
        } else {
          // На крайний случай – просто помечаем как [object]
          result = "[object COM]";
        }
      }

      // Гарантируем, что обратно в рендер уходит только примитив
      return { result: typeof result === "string" ? result : String(result) };
    } catch (error) {
      // В ошибке наружу отправляем только строку
      return { error: String(error && error.message ? error.message : error) };
    }
  });

  ipcMain.handle("connect-com", async (_event, req) => {
    const { source, eventName, instanceId } = req;

    const result = await sendComCommand("connect-com", {
      source,
      eventName,
      instanceId,
    });

    return result;
  });

  ipcMain.handle("disconnect-com", async (_event, req) => {
    const { instanceId } = req || {};

    const result = await sendComCommand("disconnect-com", {
      instanceId,
    });

    return result;
  });

  ipcMain.handle("connect-com-port", async (_event, req) => {
    try {
      const {
        path,
        baudRate,
        dataBits,
        stopBits,
        parity, // варианты: none, even, odd, mark, space,
      } = req;

      const port = new SerialPort({
        path,
        baudRate,
        dataBits,
        stopBits,
        parity,
        autoOpen: false,
      });

      await new Promise((resolve, reject) => {
        port.open((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (connectedPorts[path]) {
        return { error: "Port already connected" };
      }

      port.on("data", (chunk) => {
        mainWindow.webContents.send(`com-port-event`, { path, data: chunk });
      });

      connectedPorts[path] = port;

      return { result: true };
    } catch (error) {
      return { error: error.message };
    }
  });

  ipcMain.handle("send-message-com-port", async (_event, req) => {
    try {
      const { path, message } = req || {};

      if (!connectedPorts[path]) {
        return { error: "Port not connected" };
      }

      const request = Buffer.from([
        0x01, // slave id
        0x03, // function code (read holding registers)
        0x00,
        0x00, // start address
        0x00,
        0x01, // number of registers
        0x84,
        0x0a, // CRC16
      ]);

      connectedPorts[path].write(request);

      return { result: true };
    } catch (error) {
      return { error: error.message };
    }
  });

  ipcMain.handle("disconnect-com-port", async (_event, req) => {
    try {
      const { path } = req || {};

      if (!connectedPorts[path]) {
        return { error: "Port not connected" };
      }

      connectedPorts[path].close();
      delete connectedPorts[path];

      return { result: true };
    } catch (error) {
      return { error: error.message };
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL("http://localhost:3000");
  } else {
    const indexPath = path.join(process.resourcesPath, "build/index.html");

    mainWindow.loadFile(indexPath);
  }
}

app.whenReady().then(createWindow);
