# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hill CipherLab** is a browser-based educational tool for the Hill cipher, a classical cryptographic algorithm that uses linear algebra (matrix operations) over mod 26. The tool supports both 2×2 and 3×3 key matrices for encryption/decryption and shows every step of the modular matrix inverse.

- **Demo**: https://ipusiron.github.io/hill-cipherlab/
- **Part of**: "100 Security Tools with Generative AI" project (Day 93)
- **Tech Stack**: Vanilla JavaScript (classic scripts, no frameworks, no dependencies), HTML, CSS
- **Deployment**: GitHub Pages (static site, legacy build from `main` /, `.nojekyll`)

## Running the Application

The scripts are classic scripts (not ES modules), so both ways work:

```bash
# Open directly in browser (file://)
start index.html

# Or use any local web server
python -m http.server 8000
# Then visit http://localhost:8000
```

## Tests

```bash
npm test   # node --test (Node.js 22+), no dependencies
```

GitHub Actions (`.github/workflows/test.yml`) runs the same on push and pull_request.
Do not change expected values to make a test pass; fix the code. README numbers are recomputed by `test/readme.test.js`.

## Architecture

### Files

- `js/hill-core.js` — `globalThis.HillCore`. DOM-free math: `mod`, `gcd`, `egcdSteps`, `modInv`, `normalizeText` (NFKC, uppercase, A–Z only), `det` / `cofactorMatrix` / `adjugate` (integers), `matMul` / `matVec` (mod 26), `analyzeKey` (validation, reason, inverse, check), `parseCells` (integer-only key cells), `encrypt` / `decrypt` (blocks with per-row sums for the log), `randomInvertible` (crypto.getRandomValues), `invertibleCount` (|GL(n,2)|·|GL(n,13)|)
- `js/messages.js` — `globalThis.HillMessages`. All UI strings (`t(key, params)`, `tm({ key, params })`). The core returns `{ key, params }` instead of text
- `script.js` — DOM only. Recomputes encryption/decryption whenever the key, plaintext or ciphertext changes (`refreshOutputs`), so stale results never remain
- `index.html` — 4 tabs (WAI-ARIA tabs). Meta CSP: no inline script/style, no external hosts
- `style.css` — Calm light theme. All text/background pairs are ≥ 4.5:1 (`test/contrast.test.js`)

Load order (all `defer`): `js/hill-core.js` → `js/messages.js` → `script.js`.

### Behaviour that matters

- Key cells accept integers in −999..999 only. Empty, decimal, exponent (`1e2`) or out-of-range cells are reported with row/column and the key is treated as unusable
- `det(K)` in the details panel is the determinant of the entered integers (not of the reduced matrix)
- Encryption pads with `X`. Decryption never pads: if the letter count is not a multiple of the block size it stops (`err.length`). While typing it shows a soft hint; the Decrypt button shows the warning
- Limits: 10,000 letters (counted before padding, so 3×3 with 10,000 letters gives 10,002), 100,000 input characters
- The processing log shows the first 200 blocks

### Hill Cipher Mathematics

- **Alphabet Mapping**: A=0, B=1, ..., Z=25
- **Key Matrix K**: n×n matrix where n ∈ {2, 3}
- **Invertibility Condition**: `gcd(det(K), 26) = 1` (det must not be divisible by 2 or 13)
- **Encryption**: C = K·P (mod 26)
- **Decryption**: P = K⁻¹·C (mod 26), where K⁻¹ = det(K)⁻¹ · adj(K) (mod 26)
- **Invertible keys**: 2×2 157,248 / 456,976 (34.4%), 3×3 about 30.1%

## Conventions

- No `innerHTML`; build DOM with `createElement` + `textContent`
- No Japanese string literals in `script.js` or `js/hill-core.js` (`test/messages.test.js`); add keys to `js/messages.js`
- Max line length 160 (JS/CSS/tests), 250 (`index.html`); LF line endings (`test/format.test.js`)
- README keeps the YAML metadata block (inside the HTML comment) unchanged in structure; `id`, `slug`, `repo_url`, `demo_url`, `hub` values are fixed
- README directory tree lists every file with a one-line description (`test/readme.test.js`)

## File Structure

```
.
├── .github/workflows/test.yml  # CI (npm test)
├── assets/                     # README screenshots
├── js/hill-core.js             # Math (DOM-free)
├── js/messages.js              # UI strings
├── test/                       # node --test
├── index.html                  # 4-tab UI
├── script.js                   # DOM logic
├── style.css                   # Calm light theme
├── README.md                   # Documentation (Japanese) with cipher theory
├── TECHNICAL.md                # Technical implementation details
├── package.json                # npm test only
├── .nojekyll                   # GitHub Pages configuration
└── .gitignore                  # Standard git ignore file
```

## Security Considerations

- Meta CSP (`default-src 'self'`, no `unsafe-inline`, `connect-src 'none'`), `no-referrer`
- Everything runs in the browser; nothing is sent anywhere
- Hill cipher itself is weak (known-plaintext attacks); keys made by the tool must not be used to protect secrets
