import { useEffect, useState } from 'react';
import './App.css';

interface DllValue {
  path: string;
  funName: string;
  returnType: string;
  paramsType: string[];
  params: any[];
}

interface DllValueCom {
  source: string;
  funName: string;
  params: any[];
}

interface DllValueCom2 {
  source: string;
  eventName: string;
  instanceId: string;
}

interface ComPortValue {
  path: string;
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: string;
}

interface SendMessageComPortValue {
  path: string;
  message: string;
}

function App() {
  const [activeForm, setActiveForm] = useState<'dll' | 'comServer' | 'comPort'>('dll');

  const [comPortValue, setComPortValue] = useState<ComPortValue>({
    path: 'COM7',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1
  });

  const [sendMessageComPortValue, setSendMessageComPortValue] = useState<SendMessageComPortValue>({
    path: 'COM7',
    message: 'Hello, world!'
  });

  const [value, setValue] = useState<DllValue>({
    path: 'Dll1/x64/Debug/Dll1.dll',
    funName: 'addition',
    returnType: 'float',
    paramsType: ['int', 'float'],
    params: [1, 2.5]
  });

  const [valueCom, setValueCom] = useState<{ source: string, funName: string, params: any[] }>({
    source: 'Scripting.FileSystemObject',
    funName: 'GetSpecialFolder',
    params: [2]
  });

  const [valueCom2, setValueCom2] = useState<{ source: string, eventName: string, instanceId: string }>({
    source: 'Excel.Application',
    eventName: 'SheetChange',
    instanceId: 'excel-test'
  });

  const [result, setResult] = useState<number | undefined | string>(0);
  const [path, setPath] = useState<string | undefined>(undefined);
  const [resultCom, setResultCom] = useState<any | undefined>(undefined);
  const [resultCom2, setResultCom2] = useState<any | undefined>(undefined);
  const [resultComPort, setResultComPort] = useState<any | undefined>(undefined);
  const [resultSendMessageComPort, setResultSendMessageComPort] = useState<any | undefined>(undefined);

  const handleRunDll = async () => {
    const result = await window.api.callDll({ ...value, params: value.params.map(param => Number(param)) })
    if ('result' in result) {
      setResult(result.result);
      setPath(result.path);
    } else {
      setResult('error:' + result.error);
      setPath(undefined);
      console.log('path:' + result.path + '\nerror:' + result.error);
    }
  };

  const handleRunDllCom = async () => {
    const result = await window.api.callDllCom({ ...valueCom, params: valueCom.params.map(param => Number(param)) })
    if ('result' in result) {
      setResultCom(result.result);
    } else {
      setResultCom('error:' + result.error);
    }
  };

  const handleChange = (name: string, value: any) => {
    setValue(prev => ({ ...prev, [name]: value } as DllValue));
    setResult(undefined)
  };

  const dllForm = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '250px' }}>
        <h1>Call dll</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
          <div>path: {value.path}</div>
          <div>funName: {value.funName}</div>
          <div>returnType: {value.returnType}</div>
          <div>paramsType: {value.paramsType.join(', ')}</div>
          <div>params: {value.params.join(', ')}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          function:
          <select value={value.funName} onChange={(e) => handleChange('funName', e.target.value)}>
            <option value='addition'>addition</option>
            <option value='multiplication'>multiplication</option>
          </select>
          first param:
          <input type="text" placeholder='params1' value={value.params[0]} onChange={(e) => handleChange('params', [e.target.value, value.params[1]])} />
          second param:
          <input type="text" placeholder='params2' value={value.params[1]} onChange={(e) => handleChange('params', [value.params[0], e.target.value])} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={{ width: '100%', height: '50px' }} onClick={handleRunDll}>run dll</button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>Result: <span style={{ color: 'green' }}>{result}</span></div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>path: <span style={{ color: 'blue' }}>{path}</span></div>
          </div>
        </div>
      </div>
    )
  }

  const handleChangeCom = (name: string, value: any) => {
    setValueCom(prev => ({ ...prev, [name]: value } as DllValueCom));
    setResult(undefined)
  };

  const handleChangeCom2 = (name: string, value: any) => {
    setValueCom2(prev => ({ ...prev, [name]: value } as DllValueCom2));
    setResult(undefined)
  };

  const connectCom = () => {
    // 1. Подключаемся к COM‑событию
    window.api.connectCom({
      source: "Excel.Application",
      eventName: "SheetChange",
      instanceId: "excel-test"
    });

    // 2. Подписываемся на события
    window.api.onComEvent((data: any) => {
      setResultCom2(data);
    });
  }

  const disconnectCom = () => {
    window.api.disconnectCom({
      instanceId: "excel-test"
    });
    setResultCom2(undefined);
  }

  const comServerForm = () => {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '250px' }}>
          <h1>Call dll com server</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
            <div>source: {valueCom.source}</div>
            <div>funName: {valueCom.funName}</div>
            <div>params: {valueCom.params.join(', ')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            source:
            <input type="text" placeholder='source' value={valueCom.source} onChange={(e) => handleChangeCom('source', e.target.value)} />
            function:
            <input type="text" placeholder='function' value={valueCom.funName} onChange={(e) => handleChangeCom('funName', e.target.value)} />
            first param:
            <input type="text" placeholder='first param' value={valueCom.params[0]} onChange={(e) => handleChangeCom('params', valueCom.params[1] ? [e.target.value, valueCom.params[1]] : [e.target.value])} />
            second param:
            <input type="text" placeholder='params2' value={valueCom.params[1]} onChange={(e) => handleChangeCom('params', valueCom.params[0] ? [valueCom.params[0], e.target.value] : [e.target.value])} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={{ width: '100%', height: '50px' }} onClick={handleRunDllCom}>run dll com</button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>Result: <span style={{ color: resultCom?.startsWith('error:') ? 'red' : 'green' }}>{resultCom}</span></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '250px' }}>
          <h1>Connect dll com server listener</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
            <div>source: {valueCom2.source}</div>
            <div>eventName: {valueCom2.eventName}</div>
            <div>instanceId: {valueCom2.instanceId}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            source:
            <input type="text" placeholder='source' value={valueCom2.source} onChange={(e) => handleChangeCom2('source', e.target.value)} />
            eventName:
            <input type="text" placeholder='eventName' value={valueCom2.eventName} onChange={(e) => handleChangeCom2('eventName', e.target.value)} />
            instanceId:
            <input type="text" placeholder='instanceId' value={valueCom2.instanceId} onChange={(e) => handleChangeCom2('instanceId', e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={{ width: '100%', height: '50px' }} onClick={connectCom}>connect listener</button>
            <button style={{ width: '100%', height: '50px' }} onClick={disconnectCom}>disconnect listener</button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: '5px' }}>Result:
                <div>instanceId: <span >{resultCom2?.instanceId}</span></div>
                <div>eventName: <span >{resultCom2?.eventName}</span></div>
                <div>args: <span style={{ display: 'flex', maxHeight: '200px', overflowY: 'auto' }}>{resultCom2?.args?.join(', ')}</span></div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const handleChangeComPort = (name: string, value: any) => {
    setComPortValue(prev => ({ ...prev, [name]: value } as ComPortValue));
    setResult(undefined)
  };

  const connectComPort = async () => {
    const result = await window.api.connectComPort({ ...comPortValue });
    console.log('connectComPort result:', result);
    if ('result' in result) {
      setResultComPort(result.result);
      window.api.onComPortEvent((data: any) => {
        setResultComPort(data);
      });
    } else {
      setResultComPort(result.error);
    }
  }

  const disconnectComPort = async () => {
    const result = await window.api.disconnectComPort({ path: comPortValue.path });
    if ('result' in result) {
      setResultComPort(undefined);
    } else {
      setResultComPort(result.error);
    }
  }

  const handleChangeSendMessageComPort = (name: string, value: any) => {
    setSendMessageComPortValue(prev => ({ ...prev, [name]: value } as SendMessageComPortValue));
    setResult(undefined)
  }

  const sendMessageComPort = async () => {
    const result = await window.api.sendMessageComPort({ ...sendMessageComPortValue });
    if ('result' in result) {
      setResultSendMessageComPort(result.result);
    } else {
      setResultSendMessageComPort(result.error);
    }
  }

  const comPortForm = () => {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '250px' }}>
          <h1>Connect com port</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
            <div>path: {comPortValue.path}</div>
            <div>baudRate: {comPortValue.baudRate}</div>
            <div>dataBits: {comPortValue.dataBits}</div>
            <div>stopBits: {comPortValue.stopBits}</div>
            <div>parity: {comPortValue.parity}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            path:
            <input type="text" placeholder='path' value={comPortValue.path} onChange={(e) => handleChangeComPort('path', e.target.value)} />
            baudRate:
            <input type="text" placeholder='baudRate' value={comPortValue.baudRate} onChange={(e) => handleChangeComPort('baudRate', e.target.value)} />
            dataBits:
            <input type="text" placeholder='dataBits' value={comPortValue.dataBits} onChange={(e) => handleChangeComPort('dataBits', e.target.value)} />
            stopBits:
            <input type="text" placeholder='stopBits' value={comPortValue.stopBits} onChange={(e) => handleChangeComPort('stopBits', e.target.value)} />
            parity:
            <input type="text" placeholder='parity' value={comPortValue.parity} onChange={(e) => handleChangeComPort('parity', e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={{ width: '100%', height: '50px' }} onClick={connectComPort}>connect com port</button>
            <button style={{ width: '100%', height: '50px' }} onClick={disconnectComPort}>disconnect com port</button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>Result: <span>{JSON.stringify(resultComPort)}</span></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '250px' }}>
          <h1>Send message to com port</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
            <div>path: {sendMessageComPortValue.path}</div>
            <div>message: {sendMessageComPortValue.message}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            path:
            <input type="text" placeholder='path' value={sendMessageComPortValue.path} onChange={(e) => handleChangeSendMessageComPort('path', e.target.value)} />
            message:
            <input type="text" placeholder='message' value={sendMessageComPortValue.message} onChange={(e) => handleChangeSendMessageComPort('message', e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={{ width: '100%', height: '50px' }} onClick={sendMessageComPort}>send message to com port</button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>Result: <span>{JSON.stringify(resultSendMessageComPort)}</span></div>
            </div>
          </div>
        </div>

      </>
    )
  }

  return (
    <div className="App" style={{
      display: 'flex', flexDirection: 'column', gap: '10px', height: 'calc(100vh - 40px)',
      width: 'calc(100vw - 40px)', justifyContent: 'flex-start', alignItems: 'center', backgroundColor: '#282c34', color: 'white',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
        <button style={{ width: '100%', height: '50px', minWidth: '100px' }} onClick={() => setActiveForm('dll')}>dll</button>
        <button style={{ width: '100%', height: '50px', minWidth: '100px' }} onClick={() => setActiveForm('comServer')}>comServer</button>
        <button style={{ width: '100%', height: '50px', minWidth: '100px' }} onClick={() => setActiveForm('comPort')}>comPort</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '100px' }}>
        {activeForm === 'dll' && dllForm()}
        {activeForm === 'comServer' && comServerForm()}
        {activeForm === 'comPort' && comPortForm()}
      </div>
    </div >
  );
}

export default App;
