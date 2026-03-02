const koffi = require("koffi");
const { app, BrowserWindow } = require("electron");
const path = require("path");
const winax = require("winax");
const { fork } = require("child_process");

const isDev = !app.isPackaged;

let mainWindow;
let comWorker = null;
let comRequestId = 1;
const comPending = new Map();

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

    console.log("connect-com request", source, eventName, instanceId);

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

  if (isDev) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL("http://localhost:3000");
  } else {
    const indexPath = path.join(process.resourcesPath, "build/index.html");

    mainWindow.loadFile(indexPath);
  }
}

app.whenReady().then(createWindow);
