const { contextBridge } = require("electron");
const { ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  ping: () => "pong",
  callDll: (value) => ipcRenderer.invoke("dll-call", value),
  callDllCom: (value) => ipcRenderer.invoke("dll-call-com", value),
});
