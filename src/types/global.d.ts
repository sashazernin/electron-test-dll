import { ApiInterface } from './../../electron/preload';
export { };

export interface ApiInterface {
  ping: () => string;
  callDll: (value: { path: string, funName: string, returnType: string, paramsType: string[], params: any[] }) => Promise<number>;
}

declare global {
  interface Window {
    api: ApiInterface
  }
}
