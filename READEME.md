# PDF Mockup Generator

A lightweight, **client‑side** tool for turning blank garment images and logos into polished PDF mock‑ups—perfect for merch previews, proofs, or line‑sheets. Everything runs in the browser; no server or design software required.

---

## ✨ Features

|                             |                                                          |
| --------------------------- | -------------------------------------------------------- |
| 🖼 **Drag‑and‑drop inputs** | Upload blank images (front/back) & logos for each page   |
| ✏️ **Interactive canvas**   | Move, scale, and center artwork with \[Fabric.js] power  |
| 👫 **Multi‑page workflow**  | Add / remove pages and switch between template presets   |
| 👁 **Live print preview**   | Toggle an over‑print simulation to spot alignment issues |
| 📄 **One‑click export**     | Generate high‑resolution PDFs via `pdf-lib`              |

---

## 🔧 Tech Stack

* **Vite 6** – blazing‑fast dev server & bundler
* **Fabric.js 6.7** – HTML5 canvas manipulation
* **pdf-lib 1.17** – create & modify PDFs in the browser
* **pdfjs‑dist 5.3** – render existing PDFs for on‑screen editing
* Plain HTML / CSS (no framework) <sub>(See `package.json` for exact versions.)</sub>

---

## 🚀 Quick Start

```bash
# 1 Clone the repo
$ git clone https://github.com/milobarkow/pdf-mockup-generator.git
$ cd pdf-mockup-generator

# 2 Install dependencies
$ npm install

# 3 Start the dev server (hot‑reloads on save)
$ npm run dev

# 4 Open http://localhost:5173  (or the port Vite prints)
```

To create a production bundle:

```bash
$ npm run build      # outputs to ./dist
$ npm run prev       # preview the build locally
```

Deploy the **`dist/`** folder to any static host (the demo is published via GitHub Pages at `https://milobarkow.github.io/pdf-mockup-generator/`).

---

## 📂 Project Structure

```text
pdf-mockup-generator/
├── public/            # static assets copied as‑is
├── index.html         # main UI (form + preview)
├── popup.html         # separate window for fine‑tuning logo placement
├── src/               # JavaScript modules (canvas logic, helpers)
├── vite.config.js     # multi‑page build config
└── package.json       # scripts & dependencies
```

> **Heads‑up** — Each HTML file that imports npm packages must be listed as an *entry* in `vite.config.js` so Vite bundles the dependencies correctly.
> If you add another popup or worker, remember to add it to the `input` map.

---

## 🐞 Known Issues / Roadmap

* **Popup build error** – deploying without updating `vite.config.js` will cause a *“bare specifier ‘fabric’”* crash. Solution: add `popup.html` to the `input` map (see comment above).

Feel free to open an issue or PR if you hit a bug or want to help!

---

© 2025 Milo Barkow

