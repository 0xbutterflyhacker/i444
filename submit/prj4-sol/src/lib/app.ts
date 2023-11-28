import { Errors } from 'cs544-js-utils';
import { PagedValues, makeSensorsWs, SensorsWs } from './sensors-ws.js';

import init from './init.js';
import { makeElement, getFormData } from './utils.js';

export default function makeApp(wsUrl: string) {
  const ws = makeSensorsWs(wsUrl);
  init();
  //TODO: add call to select initial tab and calls to set up
  selectTab('addSensorType')
  //form submit listeners
  const f0 = document.querySelector('#addSensorType-form')!
  f0.addEventListener("submit", (e) => {
    e.preventDefault()
    clearErrors('addSensorType')
    add_listener('addSensorType', ws)
  })
  const f1 = document.querySelector('#addSensor-form')!
  f1.addEventListener("submit", (e) => {
    e.preventDefault()
    clearErrors('addSensor')
    add_listener('addSensor', ws)
  })

  const f2 = document.querySelector('#findSensorTypes-form')!
  f2.addEventListener("submit", (e) => {
    e.preventDefault()
    clearErrors('findSensorTypes')
    find_listener('findSensorTypes', ws)
  })
  const f3 = document.querySelector('#findSensors-form')!
  f3.addEventListener("submit", (e) => {
    e.preventDefault()
    clearErrors('findSensors')
    find_listener('findSensors', ws)
  })
}


//TODO: functions to select a tab and set up form submit listeners
function selectTab(rootId: string) {
  const tab = document.querySelector(`#${rootId}-tab`)
  tab?.setAttribute("checked", "checked")
}

async function add_listener(rootId: string, ws: SensorsWs) {
  const form: HTMLFormElement = document.querySelector(`#${rootId}-form`)!
  const f0 = getFormData(form)
  let w
  if (rootId === 'addSensorType') w = await ws.addSensorType(f0)
  else w = await ws.addSensor(f0)
  if (!w.isOk) displayErrors(rootId, w.errors)
  else {
    const r = document.createElement('dl')
    r.setAttribute('class', 'result')
    r.innerHTML= ""
    for (const [k, v] of Object.entries(w.val)) r.innerHTML += `<dt>${k}</dt> <dd>${v}</dd>`
    const d = document.querySelector(`#${rootId}-results`)
    d?.insertBefore(r, null)
  }
}

async function find_listener(rootId: string, ws: SensorsWs) {
  const form: HTMLFormElement = document.querySelector(`#${rootId}-form`)!
  const f0 = getFormData(form)
  let w: Errors.Result<PagedValues>
  if (rootId === 'findSensorTypes') w = await ws.findSensorTypesByReq(f0)
  else w = await ws.findSensorsByReq(f0)
  if (!w.isOk) displayErrors(rootId, w.errors)
  else {
    if (w.val.next) {
      const n = document.querySelectorAll(`#${rootId}-content div.scroll a[rel="next"]`)!
      for (const i of n) {
        i.setAttribute('href', `${w.val.next}`)
        setVisibility(i as HTMLElement, true)
        let n0 = i.cloneNode(true)
        n0.addEventListener("click", async (e) => {
          e.preventDefault()
          let w = await ws.findSensorTypesByRelLink(`${i.getAttribute('href')}`)
          if (w.isOk) displayPaged(rootId, w.val, ws)
        })
        i.replaceWith(n0)
      }
    }
    if (w.val.prev) {
      const n = document.querySelectorAll(`#${rootId}-content div.scroll a[rel="prev"]`)!
      for (const i of n) {
        i.setAttribute('href', `${w.val.prev}`)
        setVisibility(i as HTMLElement, true)
        let p0 = i.cloneNode(true)
        p0.addEventListener("click", async (e) => {
          e.preventDefault()
          let w = await ws.findSensorTypesByRelLink(`${i.getAttribute('href')}`)
          if (w.isOk) displayPaged(rootId, w.val, ws)
        })
        i.replaceWith(p0)
      }
    }
    displayPaged(rootId, w.val, ws)
  }
}

function displayPaged(rootId: string, v: PagedValues, ws: SensorsWs) {
  if (v.next) {
    const n = document.querySelectorAll(`#${rootId}-content div.scroll a[rel="next"]`)!
    for (const i of n) {
      i.setAttribute('href', `${v.next}`)
      setVisibility(i as HTMLElement, true)
      let n0 = i.cloneNode(true)
      n0.addEventListener("click", async (e) => {
        e.preventDefault()
        let w
        if (rootId === 'findSensorTypes') w = await ws.findSensorTypesByRelLink(`${i.getAttribute('href')}`)
        else w = await ws.findSensorsByRelLink(`${i.getAttribute('href')}`)
        if (w.isOk) displayPaged(rootId, w.val, ws)
      })
      i.replaceWith(n0)
    }
  } else {
    const n = document.querySelectorAll(`#${rootId}-content div.scroll a[rel="next"]`)!
    for (const i of n) {
      i.setAttribute('href', '#')
      setVisibility(i as HTMLElement, false)
    }
  }
  if (v.prev) {
    const n = document.querySelectorAll(`#${rootId}-content div.scroll a[rel="prev"]`)!
    for (const i of n) {
      i.setAttribute('href', `${v.prev}`)
      setVisibility(i as HTMLElement, true)
      let p0 = i.cloneNode(true)
      p0.addEventListener("click", async (e) => {
        e.preventDefault()
        let w
        if (rootId === 'findSensorTypes') w = await ws.findSensorTypesByRelLink(`${i.getAttribute('href')}`)
        else w = await ws.findSensorsByRelLink(`${i.getAttribute('href')}`)
        if (w.isOk) displayPaged(rootId, w.val, ws)
      })
      i.replaceWith(p0)
    }
  } else {
    const n = document.querySelectorAll(`#${rootId}-content div.scroll a[rel="prev"]`)!
    for (const i of n) {
      i.setAttribute('href', '#')
      setVisibility(i as HTMLElement, false)
    }
  }
  const d = document.querySelector(`#${rootId}-results`)!
  d.innerHTML = ""
  for (const i of v.values) {
    const r = document.createElement('dl')
    r.setAttribute('class', 'result')
    r.innerHTML = ""
    for (const [k, v] of Object.entries(i)) r.innerHTML += `<dt>${k}</dt> <dd>${v}</dd>`
    d?.insertBefore(r, null)
  }
}

/** clear out all errors within tab specified by rootId */
function clearErrors(rootId: string) {
  document.querySelectorAll(`.${rootId}-errors`).forEach( el => {
    el.innerHTML = '';
  });
}

/** Display errors for rootId.  If an error has a widget widgetId such
 *  that an element having ID `${rootId}-${widgetId}-error` exists,
 *  then the error message is added to that element; otherwise the
 *  error message is added to the element having to the element having
 *  ID `${rootId}-errors` wrapped within an `<li>`.
 */  
function displayErrors(rootId: string, errors: Errors.Err[]) {
  for (const err of errors) {
    const id = err.options.widget;
    const widget = id && document.querySelector(`#${rootId}-${id}-error`);
    if (widget) {
      widget.append(err.message);
    }
    else {
      const li = makeElement('li', {class: 'error'}, err.message);
      document.querySelector(`#${rootId}-errors`)!.append(li);
    }
  }
}

/** Turn visibility of element on/off based on isVisible.  This
 *  is done by adding class "show" or "hide".  It presupposes
 *  that "show" and "hide" are set up with appropriate CSS styles.
 */
function setVisibility(element: HTMLElement, isVisible: boolean) {
  element.classList.add(isVisible ? 'show' : 'hide');
  element.classList.remove(isVisible ? 'hide' : 'show');
}


