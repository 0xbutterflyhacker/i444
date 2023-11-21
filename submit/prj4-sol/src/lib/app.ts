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
  const form = document.querySelector('#addSensorType-form')!
  form.addEventListener("submit", (e) => {
    e.preventDefault()
    clearErrors('addSensorType')
    add_listener('addSensorType', ws)
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
  const w = await ws.addSensorType(f0)
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


