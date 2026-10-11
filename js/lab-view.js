(() => {
  'use strict';
  const { t, tm } = globalThis.HillMessages;
  const app = globalThis.HillApp;
  const H = globalThis.HillCore;
  const $ = (id) => document.getElementById(id);
  const render = () => {
    const state = app.getKey();
    const out = $('lab-result');
    app.clear(out);
    const r = state.ok ? globalThis.HillLab.linearity(state.matrix, $('lab-p').value, $('lab-q').value)
      : { ok: false, error: { key: 'err.key' } };
    if (!r.ok) { out.textContent = tm(r.error); return; }
    out.appendChild(app.el('p', null, t('lab.key', { n: state.n })));
    out.appendChild(app.matrixTable(state.matrix, 'K'));
    for (const [label, nums] of [
      ['P', r.a], ['Q', r.b], ['P + Q', r.sum], ['E(P)', r.ca], ['E(Q)', r.cb],
      ['E(P + Q)', r.left], ['E(P) + E(Q)', r.right],
    ]) out.appendChild(app.el('p', 'mono', `${label} = (${nums.join(', ')}) = ${H.toLetters(nums)}`));
    out.appendChild(app.el('p', null, t('lab.equal')));
  };
  $('lab-p').addEventListener('input', render);
  $('lab-q').addEventListener('input', render);
  $('lab-sample').addEventListener('click', () => {
    const n = app.getKey().n;
    $('lab-p').value = n === 2 ? 'HE' : 'ACT';
    $('lab-q').value = n === 2 ? 'LP' : 'CAT';
    render();
  });
  document.addEventListener('hillkeychange', render);
  document.addEventListener('languagechange', render);
  const imported = globalThis.HillLab.parseFragment(location.hash);
  if (!imported.ok) app.showToast(tm(imported.error), 'info');
  else if (imported.key || imported.text !== null) {
    if (imported.key) app.setKey(imported.key.length, imported.key);
    if (imported.text !== null) {
      const target = imported.key ? $('ciphertext-decrypt') : $('coa-cipher');
      target.value = imported.text;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
    app.selectTab(imported.key ? 'decrypt' : 'attack');
    app.showToast(t('import.done'), 'info');
  }
  render();
})();
