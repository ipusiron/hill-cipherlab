// Capture static text nodes once. Preserve inline markup and all form state.
(() => {
  'use strict';
  const M = globalThis.HillMessages;
  const pairs = globalThis.HillStaticMessages;
  const records = [];
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const source = node.textContent.trim();
    if (Object.hasOwn(pairs, source)) records.push({ node, source, original: node.textContent });
  }
  document.querySelectorAll('[title], [placeholder], [aria-label]').forEach((node) => {
    for (const attr of ['title', 'placeholder', 'aria-label']) {
      const source = node.getAttribute(attr);
      if (Object.hasOwn(pairs, source)) records.push({ node, source, attr });
    }
  });
  const button = document.getElementById('language-toggle');
  const apply = (lang) => {
    M.setLanguage(lang);
    document.documentElement.lang = lang;
    for (const r of records) {
      const value = lang === 'en' ? pairs[r.source] : r.source;
      if (r.attr) r.node.setAttribute(r.attr, value);
      else r.node.textContent = r.original.replace(r.source, value);
    }
    button.textContent = lang === 'en' ? '日本語' : 'English';
    button.lang = lang === 'en' ? 'ja' : 'en';
    document.dispatchEvent(new Event('languagechange'));
  };
  let initial = 'ja';
  try { if (localStorage.getItem('hill-language') === 'en') initial = 'en'; } catch { /* Storage is optional. */ }
  const query = new URLSearchParams(location.search).get('lang');
  if (query === 'ja' || query === 'en') initial = query;
  apply(initial);
  button.addEventListener('click', () => {
    const lang = M.getLanguage() === 'ja' ? 'en' : 'ja';
    apply(lang);
    try { localStorage.setItem('hill-language', lang); } catch { /* Storage is optional. */ }
  });
})();
