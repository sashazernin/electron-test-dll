import { useState } from 'react';
import './App.css';

interface DllValue {
  path: string;
  funName: string;
  returnType: string;
  paramsType: string[];
  params: any[];
}

function App() {
  const [value, setValue] = useState<DllValue>({
    path: 'Dll1/x64/Debug/Dll1.dll',
    funName: 'addition',
    returnType: 'float',
    paramsType: ['int', 'float'],
    params: [1, 2.5]
  });

  const [result, setResult] = useState<number | undefined>(0);
  const [path, setPath] = useState<string | undefined>(undefined);

  const handleRunDll = async () => {
    const result = await window.api.callDll({ ...value, params: value.params.map(param => Number(param)) })
    if ('result' in result) {
      setResult(result.result);
      setPath(result.path);
    } else {
      setResult(undefined);
      setPath(undefined);
      alert('path:' + result.path + '\nerror:' + result.error);
    }
  };

  const handleChange = (name: string, value: any) => {
    setValue(prev => ({ ...prev, [name]: value } as DllValue));
    setResult(undefined)
  };

  return (
    <div className="App" style={{
      display: 'flex', flexDirection: 'column', gap: '10px', height: '100vh',
      width: '100vw', justifyContent: 'center', alignItems: 'center', backgroundColor: '#282c34', color: 'white'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '250px' }}>
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
    </div >
  );
}

export default App;
