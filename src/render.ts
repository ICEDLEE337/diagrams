import el from './create-element';
import { IStep } from './i-step';
import { COLOR_PRESET_GLOBALS } from './config'

// this code is sincerely terrible... don't judge me
// i'll do (p)react or something later if this is useful
export default function render(steps: IStep[], SYSTEMS: string[], DEBUG: boolean, notes?: string[], risks?: string[]) {
  const context = {};
  const COLORS = getColors(SYSTEMS);
  const colWidth = Math.round(1000 / SYSTEMS.length) / 10;
  const stepHtmls = createStepElements(steps, SYSTEMS, COLORS, DEBUG, notes, risks);
  const colHtmls = el('section.header', SYSTEMS.map((s, i) => {
    const col = el('div.col', s);
    col.style.width = `${colWidth}%`;
    col.style.left = `${Math.round((1000 * i) / SYSTEMS.length) / 10}%`;
    col.style.backgroundColor = getSwimLaneColor(s, COLORS).backgroundColor;
    return col;
  }));
  const graph = el('section', colHtmls);
  let lines: HTMLElement[] = [];
  for (var i = 0; i < SYSTEMS.length; i++) {
    const line = el('div.line');
    line.style.height = `${window.innerHeight}px`;
    line.style.width = `${colWidth}%`;
    lines.push(line);
  }
  const lineSection = el('section.lines', lines);
  lineSection.style.left = `${colWidth / 2}%`;
  lineSection.style.left = `0%`;
  graph.appendChild(lineSection);
  stepHtmls.forEach(element => graph.appendChild(element));
  graph.appendChild(Object.assign(colHtmls, { classList: 'footer' }));
  risks && graph.appendChild(getListOfThings('Risks', risks));
  notes && graph.appendChild(getListOfThings('Notes', notes));

  const appDiv: HTMLElement = document.getElementById('app') as HTMLElement;
  appDiv.innerHTML = graph.innerHTML;
}

function getListOfThings(title, strings) {
  const risksEl = el(`section.${title.toLowerCase()}`, el('h1', title));
  risksEl.style.color = 'black';
  strings.map(r => el('li', r)).forEach(r => risksEl.appendChild(r));
  return risksEl;
}

function getColors(systems) {

  const output = {};

  const COLORS = [
    'darkslateblue',
    'darkred',
    '#838b8b',
    // '#1d3227',
    '#252e45',
    '#e7025f',
    'darkgray',
    '#566573',
    '#ee7621',
    '#799179',
    'darkslategray',
    'slateblue',
    '#002f6c',
  ].map(color => Object.assign({ backgroundColor: color }));

  systems.forEach((s, i) => {
    output[s] = COLORS[i];
  });

  return output;

}

export function createStepElements(steps: IStep[], SYSTEMS: string[], COLORS, DEBUG: boolean, notes?: string[], risks?: string[]) {
  return steps.map((rawStep, stepIndex: number) => {
    const step = Object.assign({}, rawStep);
    if (step.internally) {
      Object.assign(step, { from: rawStep.internally, to: rawStep.internally });
    }
    const startIndex = SYSTEMS.indexOf(step.from as string);
    const endIndex = SYSTEMS.indexOf((step.to || step.from) as string);
    const selfDirected = (startIndex === endIndex) || step.internally;
    const startName = SYSTEMS[startIndex];
    const endName = SYSTEMS[endIndex];
    const right = startIndex < endIndex;

    let width;
    let colCount;
    let additionalCssClass;
    let message;
    let leftColor;
    let rightColor;
    let htmlEntity;
    const transmission = getWith(step);
    const defaultMessage = `${startName} transmits ${transmission} to ${endName}`;
    const swimLaneStyle = getSwimLaneColor(startName, COLORS);
    const endSwimLaneStyle = getSwimLaneColor(endName, COLORS);
    let stepStyle = Object.assign({}, swimLaneStyle);
    stepStyle.altStyle = { backgroundColor: stepStyle.color, color: stepStyle.backgroundColor, border: `solid 1px ${stepStyle.color}` }
    const defaultMarginLeft = Math.round((startIndex * 100) / SYSTEMS.length);

    message = step.because || step['inOrderTo'] || step['viaUrl'] || defaultMessage;

    if (selfDirected) {
      additionalCssClass = 'self';
      colCount = 1;
      message = `${step.internally} will ${step.will || step.because}`;
      width = Math.round(colCount * 10000 / SYSTEMS.length) / 100;
      stepStyle.marginLeft = `${defaultMarginLeft}%`;
      leftColor = rightColor = stepStyle.backgroundColor;
    }
    else if (right) {
      additionalCssClass = 'right';
      colCount = endIndex - startIndex;
      width = Math.round(colCount * 10000 / SYSTEMS.length) / 100;
      stepStyle.marginLeft = `${defaultMarginLeft}%`;
      htmlEntity = '&rarr;';
      // rightColor = endSwimLaneStyle.backgroundColor;
      // leftColor = stepStyle.backgroundColor;
      // stepStyle.backgroundImage = `linear-gradient(to right, ${leftColor} 98%, ${rightColor})`;
    } else {
      additionalCssClass = 'left';
      colCount = startIndex - endIndex;
      width = Math.round(colCount * 10000 / SYSTEMS.length) / 100;
      const altLeft = Math.round(((endIndex + 1) * 100) / SYSTEMS.length);
      stepStyle.marginLeft = `${altLeft}%`;
      htmlEntity = '&larr;';
      // leftColor = endSwimLaneStyle.backgroundColor;
      // rightColor = stepStyle.backgroundColor;
      // stepStyle.backgroundImage = `linear-gradient(to left, ${rightColor} 98%, ${leftColor})`;
    }

    const stepHtml = getStepHtml(message, stepStyle);

    stepHtml.style.width = `${width}%`;

    stepHtml.className = stepHtml.className + ' ' + additionalCssClass;

    stepHtml.appendChild(getNumber(stepStyle.altStyle, stepIndex + 1));

    if (step.if) {
      stepHtml.appendChild(el('i', `if ${step.if}`));
    }

    if (htmlEntity) {
      stepHtml.appendChild(el('span.arrow', htmlEntity))
    }

    (step.with || step.withJson) && stepHtml.appendChild(getDiamond(stepStyle.altStyle, getWith(step)));
    Object.assign(stepHtml.style, stepStyle);
    DEBUG && stepHtml.appendChild(getDebug(`
width: ${width}
colCount: ${colCount}
additionalCssClass: ${additionalCssClass}
startIndex: ${startIndex}
stepStyle.marginLeft: ${stepStyle.marginLeft}
stepStyle.marginRight: ${stepStyle.marginRight}
`));
    return stepHtml;
  });
}

function getStepHtml(message, style) {
  const stepHtml = el('div.step', el('p', message));
  Object.assign(stepHtml.style, style);
  return stepHtml;
}

function getDiamond(style, content) {
  return content instanceof Array ?
    el('div.diamond', content.reduce((e, ii, i) => ` ${e} ${i + 1}) ${ii}`, ''), style) :
    el('div.diamond', content, style);
}

function getDebug(content) {
  return el('pre.debug', content);
}

function getNumber(style, content) {
  return el('div.number', content, style);
}

function getWith(step) {
  if (step.withJson) {
    return el('code', JSON.stringify(step.withJson, null, 2));
  }
  return step.with && step.with.join ? `{${step.with.join(', ')}}` : step.with;
}

function getSwimLaneColor(systemName, COLORS) {
  return Object.assign({}, COLOR_PRESET_GLOBALS, COLORS[systemName]);
}