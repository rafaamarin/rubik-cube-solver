# Rubik's Cube Solver

Minimal Vite + Three.js Rubik cube solver game.

## Project location

This project is stored in:

```text
/Users/rafa/Desarrollo/Rubik's cube solver
```

## Run locally

```bash
cd "/Users/rafa/Desarrollo/Rubik's cube solver"
npm install
npm run dev
```

## Build for deployment

```bash
cd "/Users/rafa/Desarrollo/Rubik's cube solver"
npm run build
npm run preview
```

The production files are written to `dist/`. Vite is configured with `base: "./"`, so the built `dist/index.html` uses relative asset paths and can be deployed from this folder without breaking CSS or JavaScript paths.

## Vercel

A minimal `vercel.json` is included:

- Build command: `npm run build`
- Output directory: `dist`
- Framework: `vite`
