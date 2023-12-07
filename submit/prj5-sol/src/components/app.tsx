import React, { useEffect } from 'react';

import { makeSensorsWs, SensorsWs } from '../lib/sensors-ws.js';

import Tab from './tab.js';

import SENSOR_FIELDS, { FieldDef } from './sensor-fields.js';


type AppProps = {
  wsUrl: string,
};

export default function App(props: AppProps) {
  const ws = makeSensorsWs(props.wsUrl);
  const [ selectedId, selectTab ] = React.useState('addSensorType');
  return (
    <div className="tabs">
      <Tab id="addSensorType" label="Add Sensor Type" 
           isSelected={selectedId === 'addSensorType'}
           select={selectTab}>
         {<AddComponent rootId={selectedId} sWS={ws}/>}
      </Tab>
      <Tab id="addSensor" label="Add Sensor" 
           isSelected={selectedId === 'addSensor'}
           select={selectTab}>
         {<AddComponent rootId={selectedId} sWS={ws}/>}
      </Tab>
      <Tab id="findSensorTypes" label="Find Sensor Types" 
           isSelected={selectedId === 'findSensorTypes'}
           select={selectTab}>
         {/* TODO Find Sensor Type Component */}
      </Tab>
      <Tab id="findSensors" label="Find Sensors" 
           isSelected={selectedId === 'findSensors'}
           select={selectTab}>
         {/* TODO Find Sensor Component */}
      </Tab>
    </div>
  );
}

export function AddComponent(props: {rootId: string, sWS: SensorsWs}) {
  const [sensorData, setSensorData] = React.useState<Record<string, string>>({})
  const [errorData, setErrorData] = React.useState<any>([])
  const [fetchData, setFetchData] = React.useState<any>([])
  const f = `${props.rootId}-form`
  async function formSubmit(data: {}) {
    const w = (props.rootId === 'addSensorType') ? await props.sWS.addSensorType(data) : await props.sWS.addSensor(data)
    return w
  }
  const onSend = async (e) => {
    e.preventDefault()
    setErrorData([])
    setFetchData([])
    setSensorData({})
    const form = e.target as HTMLFormElement
    const data = Object.fromEntries([...new FormData(form).entries()].map(([key, val]) => [key, val as string]).filter(([_, val]) => val.trim().length > 0))
    let w = await formSubmit(data)
    if (!w.isOk) {
      if (w.errors[0].message === 'Failed to fetch') setFetchData(w.errors)
      else setErrorData(w.errors)
    } else {
      setSensorData(w.val)
    }
  }
  return (
    <React.Fragment>
      <ErrComponent rootId={props.rootId} err={fetchData}/>
      <form id={f} name={f} className='grid-form' onSubmit={onSend}>
        <AddForm rootId={props.rootId} err={errorData}/>
        <button type='submit'>Add {props.rootId === 'addSensorType' ? 'Sensor Type' : 'Sensor'}</button>
      </form>
      <ResultsComponent rootId={props.rootId} data={sensorData}/>
    </React.Fragment>
  )
}

export function ErrComponent(props: {rootId: string, err: any[]}) {
  const e = `${props.rootId}-errors`
  return (
    <React.Fragment>
      <ul id={e} className={e}></ul>
    </React.Fragment>
  )
}
export function ResultsComponent(props: {rootId: string, data: Record<string, string>}) {
  let r = Object.entries(props.data).map(([k, v]) => <ResultItem key={`add-${props.data['Sensor Type ID']}-${k}`} rootId={props.rootId} data={[k, v]}/>)
  return (
    <React.Fragment>
      <div id={`${props.rootId}-results`} className='results'>
        <dl className='result'>
          {r}
        </dl>
      </div>
    </React.Fragment>
  )
}
export function ResultItem(props: {rootId: string, data: [string, string]}) {
  return (
    <React.Fragment>
      <dt>{props.data[0]}</dt> <dd>{props.data[1]}</dd>
    </React.Fragment>
  )
}

export function AddForm(props: {rootId: string, err: any[]}) {
  let f
  if (props.rootId === 'addSensorType') f = SENSOR_FIELDS['SensorType'].map((r) => <FormItem key={`${props.rootId}-${r.name}`} rootId={props.rootId} for={r} err={props.err}/>)
  else f = SENSOR_FIELDS['Sensor'].map((r) => <FormItem key={`${props.rootId}-${r.name}`} rootId={props.rootId} for={r} err={props.err}/>)
  return (
    <React.Fragment>
      {f}
    </React.Fragment>
  )
}
export function FormItem(props: {rootId: string, for: FieldDef, err: any[]}) {
  const f = `${props.rootId}-${props.for.name}`
  let e = -1
  let m
  for (let i = 0; i < props.err.length; i++) {
    if (props.err[i].options.widget === props.for.name) {
      e = i
      break
    }
  }
  if (e >= 0) m = props.err[e].message
  return (
    <React.Fragment>
      <label htmlFor={f}>
        {props.for.label}
        <span className='required' title='Required'>*</span>
      </label>
      <span>
        <input id={f} name={`${props.for.name}`}/><br/>
        <span id={`${f}-error`} className={`${props.rootId}-errors error`}>
          {m}
        </span>
      </span>
    </React.Fragment>
  )
}
