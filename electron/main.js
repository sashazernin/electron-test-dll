const koffi = require("koffi");
const { app, BrowserWindow } = require("electron");
const path = require("path");
const winax = require("winax");

const isDev = !app.isPackaged;

let mainWindow;

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

      const result = fso[`${funName}`](...params);

      return { result };
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
