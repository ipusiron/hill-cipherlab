// DOM-free helpers for the linearity experiment and URL fragment import.
(function (root) {
  'use strict';
  const H = root.HillCore;
  function linearity(key, first, second) {
    const n = key.length;
    const p = H.normalizeText(first).letters;
    const q = H.normalizeText(second).letters;
    if (p.length !== n || q.length !== n) return { ok: false, error: { key: 'lab.length', params: { n } } };
    if (!H.analyzeKey(key).invertible) return { ok: false, error: { key: 'err.key' } };
    const a = H.toNums(p);
    const b = H.toNums(q);
    const sum = a.map((x, i) => H.mod(x + b[i]));
    const ca = H.matVec(key, a);
    const cb = H.matVec(key, b);
    const left = H.matVec(key, sum);
    const right = ca.map((x, i) => H.mod(x + cb[i]));
    return { ok: true, a, b, sum, ca, cb, left, right };
  }
  function parseFragment(hash) {
    if (hash.length > 40000) return { ok: false, error: { key: 'import.invalid' } };
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const text = params.get('text');
    let key = null;
    if (params.has('key')) {
      try {
        key = JSON.parse(params.get('key'));
        if (!Array.isArray(key) || ![2, 3].includes(key.length)
          || !key.every((r) => Array.isArray(r) && r.length === key.length
            && r.every((x) => Number.isInteger(x) && Math.abs(x) <= H.LIMITS.cellAbs))
          || !H.analyzeKey(key).invertible) throw new Error('invalid');
      } catch { return { ok: false, error: { key: 'import.invalid' } }; }
    }
    if (text !== null && (text.length > 10000 || !/^[A-Za-z]*$/.test(text))) {
      return { ok: false, error: { key: 'import.invalid' } };
    }
    return { ok: true, text, key };
  }
  root.HillLab = { linearity, parseFragment };
})(globalThis);
