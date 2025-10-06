# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hill CipherLab** is a browser-based educational tool for the Hill cipher, a classical cryptographic algorithm that uses linear algebra (matrix operations) over mod 26. The tool supports both 2×2 and 3×3 key matrices for encryption/decryption.

- **Demo**: https://ipusiron.github.io/hill-cipherlab/
- **Part of**: "100 Security Tools with Generative AI" project (Day 93)
- **Tech Stack**: Vanilla JavaScript (no frameworks), HTML, CSS
- **Deployment**: GitHub Pages (static site)

## Running the Application

Since this is a static HTML/CSS/JS application:

```bash
# Open directly in browser (Windows)
start index.html

# Or use any local web server
python -m http.server 8000
# Then visit http://localhost:8000
```

No build process, dependencies, or compilation required.

## Architecture

### Core Algorithm (script.js)

The implementation follows this structure:

1. **Modular Arithmetic Utilities** (lines 11-35):
   - `gcd(a, b)`: Euclidean algorithm for greatest common divisor
   - `mod(a, m)`: Modular reduction (always returns non-negative)
   - `modInv(a, m)`: Extended Euclidean algorithm for modular multiplicative inverse

2. **Matrix Operations** (lines 58-119):
   - `det2(M)` / `det3(M)`: Determinant calculation for 2×2 and 3×3 matrices
   - `adjugate2(M)` / `adjugate3(M)`: Adjugate matrix via cofactor matrix transpose
   - `matMulVec(M, v)`: Matrix-vector multiplication (mod 26)
   - `matScalar(M, s)`: Scalar multiplication of matrix

3. **Key Validation** (lines 200-231):
   - Checks if `gcd(det(K), 26) = 1` (required for invertibility)
   - Computes modular inverse of determinant
   - Displays inverse matrix K⁻¹ in UI

4. **Encryption/Decryption** (lines 246-288):
   - Converts A-Z to 0-25
   - Pads plaintext/ciphertext with 'X' (23) to block size
   - Encrypts: `C ≡ K·P (mod 26)`
   - Decrypts: `P ≡ K⁻¹·C (mod 26)`

### Hill Cipher Mathematics

- **Alphabet Mapping**: A=0, B=1, ..., Z=25
- **Key Matrix K**: n×n matrix where n ∈ {2, 3}
- **Invertibility Condition**: `gcd(det(K), 26) = 1` (det must not be divisible by 2 or 13)
- **Encryption**: For plaintext vector P, ciphertext C = K·P (mod 26)
- **Decryption**: P = K⁻¹·C (mod 26), where K⁻¹ = det(K)⁻¹ · adj(K) (mod 26)

### UI Structure (index.html)

1. **Matrix Input Section**: Dynamic grid for 2×2 or 3×3 key matrix
2. **Key Validation Panel**: Shows det(K), gcd, invertibility status, and K⁻¹
3. **Encryption/Decryption Section**: Text areas for plaintext/ciphertext
4. **Processing Log**: Detailed block-by-block calculation steps

## Important Implementation Details

### Why Determinant Must Satisfy gcd(det, 26) = 1

Since 26 = 2 × 13, a matrix is invertible in ℤ₂₆ only if its determinant is coprime to 26. If det(K) is even or divisible by 13, the modular inverse doesn't exist, making decryption impossible.

### Random Invertible Matrix Generation (line 234)

The `randomInvertible()` function uses trial-and-error: generates random matrices and checks `gcd(det, 26) = 1`. For 3×3 matrices, fewer random matrices satisfy this condition compared to 2×2.

### Padding Behavior

Non-alphabetic characters are ignored. If the text length isn't a multiple of the block size, it's padded with 'X' (value 23). Users should be aware that trailing X's in decrypted text may be padding artifacts.

## File Structure

```
.
├── index.html       # Main HTML structure and UI elements
├── script.js        # All Hill cipher logic and matrix operations
├── style.css        # Calm light theme with accessibility features
├── .nojekyll        # GitHub Pages configuration (no Jekyll processing)
├── .gitignore       # Standard git ignore file
└── README.md        # Detailed documentation (Japanese) with cipher theory
```

## Historical Context (from README)

- Invented by Lester S. Hill in 1929
- Used by the U.S. during WWII only for encrypting radio call signs
- Never widely adopted due to complexity of manual computation
- First cipher to use algebraic techniques systematically
- Considered a multialphabetic substitution cipher
- Vulnerable to known-plaintext attacks (weak by modern standards)

## Relationship to Other Classical Ciphers

From the same author's "100 Security Tools" series:
- **Caesar Cipher**: Shift cipher (single substitution)
- **Vigenère Cipher**: Polyalphabetic cipher (character-by-character)
- **Porta Cipher**: Digraph cipher (2 chars → 1 symbol)
- **Hill Cipher** (this tool): Matrix-based (n chars → n chars)

Hill cipher can be viewed as matrix-based affine cipher: `Enc(x) = Ax + B` where `B = 0`.
