const { contextBridge } = require("electron");
const { ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  ping: () => "pong",
  callDll: (value) => ipcRenderer.invoke("dll-call", value),
  callDllCom: (value) => ipcRenderer.invoke("dll-call-com", value),
  connectCom: (value) => ipcRenderer.invoke("connect-com", value),
  onComEvent: (callback) =>
    ipcRenderer.on("com-event", (_, data) => callback(data)),
  disconnectCom: (value) => ipcRenderer.invoke("disconnect-com", value),
});
