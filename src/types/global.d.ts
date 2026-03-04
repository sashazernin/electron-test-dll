import { ApiInterface } from './../../electron/preload';
export { };

export interface ApiInterface {
  ping: () => string;
  callDll: (value: { path: string, funName: string, returnType: string, paramsType: string[], params: any[] }) => Promise<number>;
  callDllCom: (value: { path: string, funName: string, params: any[] }) => Promise<any>;
  connectCom: (value: { source: string, eventName: string, instanceId: string }) => Promise<any>;
  disconnectCom: (value: { instanceId: string }) => Promise<any>;
  onComEvent: (callback: (data: any) => void) => void;
  connectComPort: (value: { path: string, baudRate: number, dataBits: number, stopBits: number, parity: string }) => Promise<any>;
  disconnectComPort: (value: { path: string }) => Promise<any>;
  onComPortEvent: (callback: (data: any) => void) => void;
  sendMessageComPort: (value: { path: string, message: string }) => Promise<any>;
}

declare global {
  interface Window {
    api: ApiInterface
  }
}
