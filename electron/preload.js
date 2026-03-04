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
  connectComPort: (value) => ipcRenderer.invoke("connect-com-port", value),
  onComPortEvent: (callback) =>
    ipcRenderer.on(`com-port-event`, (_, data) => callback(data)),
  disconnectComPort: (value) =>
    ipcRenderer.invoke("disconnect-com-port", value),
  sendMessageComPort: (value) =>
    ipcRenderer.invoke("send-message-com-port", value),
});
