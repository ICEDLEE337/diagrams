export default function el(rawTagName: string, content?, styles?) {
  const tagName = rawTagName.includes('.') ? rawTagName.split('.')[0] : rawTagName;
  
  const html = document.createElement(tagName);

  if (rawTagName.includes('.')) {
    html.className = rawTagName.split('.').slice(1).join(' ');
  }
  if (content instanceof Array) {
    content.forEach(s => html['append'](s));
  } else if (content) {
    html.innerHTML = content.outerHTML || content;
  }

  if (styles) {
    Object.assign(html.style, styles);
  }
  return html;
}
