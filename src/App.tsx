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

function App() {
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

  return (
    <div className="App" style={{
      display: 'flex', flexDirection: 'column', gap: '10px', height: '100vh',
      width: '100vw', justifyContent: 'center', alignItems: 'center', backgroundColor: '#282c34', color: 'white'
    }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '100px' }}>
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
      </div>
    </div >
  );
}

export default App;
