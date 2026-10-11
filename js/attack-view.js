/* ============================================================================
 * Hill CipherLab - 解読タブの画面（既知平文攻撃・クリブの位置探し・暗号文単独攻撃）
 * ============================================================================
 *
 * 計算は js/hill-attack.js（HillAttack）、例は js/samples.js（HillSamples）、文言は js/messages.js。
 * 画面の部品と鍵の設定は script.js が公開する HillApp を使う。
 * ============================================================================
 */
(() => {
  'use strict';

  const H = globalThis.HillCore;
  const A = globalThis.HillAttack;
  const S = globalThis.HillSamples;
  const { t, tm } = globalThis.HillMessages;
  const app = globalThis.HillApp;
  const { el, clear, matrixTable, fmtCount } = app;
  const $ = (id) => document.getElementById(id);

  const PREVIEW = 40; // 候補の一覧に出す復号の先頭の字数

  const kpaPlain = $('kpa-plain');
  const kpaCipher = $('kpa-cipher');
  const kpaResult = $('kpa-result');
  const kpaPlainLabel = $('kpaPlainLabel');
  const btnKpa = $('btnKpa');
  const btnKpaUse = $('btnKpaUse');
  const coaCipher = $('coa-cipher');
  const coaResult = $('coa-result');
  const btnCoa = $('btnCoa');
  const btnCoaUse = $('btnCoaUse');

  let kpaN = 2;
  let coaN = 2;
  let kpaFound = null; // { n, key }
  let coaFound = null;

  const letters = H.normalizeText(S.TEXT).letters;
  const mode = () => ($('kpaModeCrib').checked ? 'crib' : 'aligned');
  const vecText = (v) => `(${v.join(', ')})`;
  const keyText = (M) => `[${M.map((r) => r.join(',')).join(' / ')}]`;

  // ===== 小さな部品 =====

  const setSeg = (prefix, n) => {
    for (const k of [2, 3]) {
      const b = $(`${prefix}${k}`);
      b.classList.toggle('active', k === n);
      b.setAttribute('aria-pressed', String(k === n));
    }
  };

  const para = (box, text, className) => box.appendChild(el('p', className || null, text));

  const statusLine = (box, ok, text) => {
    const p = el('p', 'status');
    p.appendChild(el('span', ok ? 'ok' : 'ng', text));
    box.appendChild(p);
  };

  const matrices = (box, items) => {
    const row = el('div', 'mat-row');
    for (const [label, M] of items) {
      const fig = el('figure', 'mat-fig');
      fig.appendChild(matrixTable(M, label));
      fig.appendChild(el('figcaption', null, label));
      row.appendChild(fig);
    }
    box.appendChild(row);
  };

  const textBlock = (box, text) => box.appendChild(el('pre', 'result-text', text));

  /** 列見出しと行の配列から表を作る */
  const table = (box, heads, rows, bestFirst) => {
    const wrap = el('div', 'table-wrap');
    const tb = el('table', 'cand');
    const thead = el('thead');
    const hr = el('tr');
    for (const h of heads) hr.appendChild(el('th', null, h));
    thead.appendChild(hr);
    tb.appendChild(thead);
    const body = el('tbody');
    rows.forEach((cells, i) => {
      const tr = el('tr', bestFirst && i === 0 ? 'best' : null);
      for (const c of cells) tr.appendChild(el('td', null, c));
      body.appendChild(tr);
    });
    tb.appendChild(body);
    wrap.appendChild(tb);
    box.appendChild(wrap);
  };

  const error = (box, m) => {
    clear(box);
    box.appendChild(el('p', 'warning', tm(m)));
  };

  // ===== 既知平文攻撃（先頭からそろった平文） =====

  const renderAligned = (r) => {
    clear(kpaResult);
    kpaFound = null;
    if (!r.ok) {
      error(kpaResult, r.error);
      return;
    }
    statusLine(kpaResult, r.status === 'solved', t(`kpa.status.${r.status}`));
    para(kpaResult, t('kpa.summary', { blocks: r.blocks, used: r.used, n: r.n, r2: r.rank2, r13: r.rank13 }));
    if (r.direct) {
      const idx = r.direct.indices.map((i) => i + 1).join('・');
      para(kpaResult, t('kpa.directText', { blocks: idx, det: r.direct.detP }));
      matrices(kpaResult, [['P', r.direct.P], ['P⁻¹', r.direct.Pinv], ['C', r.direct.C], ['K = C × P⁻¹', r.direct.K]]);
    } else if (r.status === 'solved' || r.status === 'notInvertible') {
      para(kpaResult, t('kpa.crtText'));
      matrices(kpaResult, [['K mod 2', r.key2], ['K mod 13', r.key13], ['K', r.key]]);
    }
    if (r.status === 'solved') {
      kpaFound = { n: r.n, key: r.key };
      matrices(kpaResult, [['K', r.key], ['K⁻¹', r.inverse]]);
      if (r.decrypted && r.cipherLetters > r.used) {
        para(kpaResult, t('attack.plaintext'));
        textBlock(kpaResult, r.decrypted);
      }
    } else if (r.status === 'ambiguous') {
      para(kpaResult, t('kpa.candidates', { a: fmtCount(r.candidates2), b: fmtCount(r.candidates13) }));
      para(kpaResult, t('kpa.missing', { mods: [r.rank2 < r.n ? '2' : '', r.rank13 < r.n ? '13' : ''].filter(Boolean).join(', ') }));
    }
    if (r.plainLetters !== r.used || r.cipherLetters !== r.used) {
      para(kpaResult, t('kpa.used', { p: r.plainLetters, c: r.cipherLetters, used: r.used }));
    }
  };

  let kpaLast = null;
  let coaLast = null;
  const resetCoa = () => {
    coaLast = coaFound = null;
    btnCoaUse.disabled = true;
    clear(coaResult);
    para(coaResult, t('attack.ready'));
  };
  const renderCrib = (r) => {
    clear(kpaResult);
    kpaFound = null;
    if (!r.ok) return error(kpaResult, r.error);
    para(kpaResult, t('crib.summary', { tried: r.tried, enough: r.enough, found: r.found }));
    para(kpaResult, t('attack.scoreNote'));
    if (!r.results.length) return para(kpaResult, t('crib.none'));
    table(kpaResult, t('crib.heads').split('|'), r.results.map((x) => [
      x.pos + 1, keyText(x.key), x.score.toFixed(4), x.plaintext.slice(0, PREVIEW),
    ]), true);
    const best = r.results[0];
    kpaFound = { n: r.n, key: best.key };
    matrices(kpaResult, [['K', best.key], ['K⁻¹', best.inverse]]);
    textBlock(kpaResult, best.plaintext);
  };
  const renderKpa = () => {
    kpaPlainLabel.textContent = t(mode() === 'crib' ? 'kpa.cribLabel' : 'kpa.plainLabel');
    if (kpaLast) {
      if (mode() === 'crib') renderCrib(kpaLast);
      else renderAligned(kpaLast);
    } else {
      clear(kpaResult);
      para(kpaResult, t('attack.ready'));
    }
    btnKpaUse.disabled = !kpaFound;
  };
  const runKpa = (explicit = false) => {
    kpaFound = null;
    if (mode() === 'crib' && !explicit) kpaLast = null;
    else kpaLast = mode() === 'crib' ? A.cribSearch(kpaN, kpaCipher.value, kpaPlain.value)
      : A.knownPlaintext(kpaN, kpaPlain.value, kpaCipher.value);
    renderKpa();
    if (explicit) app.announce(kpaResult.textContent);
  };
  for (const n of [2, 3]) {
    $(`kpaSize${n}`).addEventListener('click', () => { kpaN = n; setSeg('kpaSize', n); runKpa(); });
    $(`coaSize${n}`).addEventListener('click', () => { coaN = n; setSeg('coaSize', n); resetCoa(); });
  }
  for (const node of [kpaPlain, kpaCipher]) node.addEventListener('input', () => runKpa());
  for (const id of ['kpaModeAligned', 'kpaModeCrib']) $(id).addEventListener('change', () => runKpa());
  btnKpa.addEventListener('click', () => runKpa(true));
  const useKey = (found) => {
    if (!found) return;
    app.setKey(found.n, found.key);
    app.selectTab('key');
    $('tabbtn-key').focus();
    app.announce(t('attack.applied'));
  };
  btnKpaUse.addEventListener('click', () => useKey(kpaFound));
  btnCoaUse.addEventListener('click', () => useKey(coaFound));
  document.querySelectorAll('[data-kpa]').forEach((btn) => btn.addEventListener('click', () => {
    const crib = btn.dataset.kpa === 'crib';
    const s = crib ? S.CRIB : S.KPA.find((x) => x.id === btn.dataset.kpa);
    kpaN = s.n;
    setSeg('kpaSize', kpaN);
    $('kpaModeCrib').checked = crib;
    $('kpaModeAligned').checked = !crib;
    const enc = H.encrypt(s.key, crib ? letters.slice(0, s.letters) : s.plain);
    kpaPlain.value = crib ? s.crib : s.plain;
    kpaCipher.value = enc.output;
    runKpa();
  }));
  coaCipher.addEventListener('input', resetCoa);
  document.querySelectorAll('[data-coa]').forEach((btn) => btn.addEventListener('click', () => {
    const s = S.COA.find((x) => x.id === btn.dataset.coa);
    coaN = s.n;
    setSeg('coaSize', coaN);
    coaCipher.value = H.encrypt(s.key, letters.slice(0, s.letters)).output;
    resetCoa();
  }));
  const renderCoa = () => {
    clear(coaResult);
    coaFound = null;
    const r = coaLast;
    if (!r) para(coaResult, t('attack.ready'));
    else if (!r.ok) error(coaResult, r.error);
    else {
      para(coaResult, t('coa.summary', {
        letters: r.letters, scored: r.scored, rows: r.rowsTried, skipped: r.rowsSkipped, combos: r.combosTried,
      }));
      para(coaResult, t('attack.scoreNote'));
      para(coaResult, t('coa.limit'));
      if (r.short) para(coaResult, t('coa.short', { guide: r.guide }), 'warning');
      if (r.best) {
        coaFound = { n: r.n, key: r.best.key };
        matrices(coaResult, [['K', r.best.key], ['K⁻¹', r.best.inverse]]);
        textBlock(coaResult, r.best.plaintext);
        table(coaResult, t('coa.heads').split('|'), [r.best, ...r.alternatives].map((x) => [
          keyText(x.key), x.score.toFixed(4), x.plaintext.slice(0, PREVIEW),
        ]), true);
      } else para(coaResult, t('coa.none'));
      const details = el('details', 'explain');
      details.appendChild(el('summary', null, t('coa.rows')));
      table(details, t('coa.rowHeads').split('|'), r.rows.map((x) => [vecText(x.row), x.score.toFixed(4)]));
      coaResult.appendChild(details);
    }
    btnCoaUse.disabled = !coaFound;
  };
  btnCoa.addEventListener('click', () => {
    coaLast = A.ciphertextOnly(coaN, coaCipher.value);
    renderCoa();
    app.announce(t(coaFound ? 'coa.done' : 'coa.none'));
  });
  document.addEventListener('languagechange', () => { renderKpa(); renderCoa(); });
  renderKpa();
  resetCoa();
})();
