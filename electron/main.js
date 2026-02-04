const { app, BrowserWindow } = require("electron");
const path = require("path");

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

  if (isDev) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL("http://localhost:3000");
  } else {
    const indexPath = path.join(process.resourcesPath, "build/index.html");

    mainWindow.loadFile(indexPath);
  }
}

app.whenReady().then(createWindow);
