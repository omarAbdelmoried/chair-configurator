# Chair configurator — Svelte 5 + Three.js + TypeScript

A Roomle-style product configurator. The chair is built procedurally in code (no model files).

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # type check
npm run build
```

## Structure
- `src/lib/config.ts`  options, pricing, types
- `src/lib/chair.ts`   procedural geometry (shell + 3 bases)
- `src/lib/viewer.ts`  Three.js scene, lights, orbit controls (framework-agnostic class)
- `src/App.svelte`     UI using Svelte 5 runes (`$state`, `$derived`, `$effect`)

To use a real GLB instead, swap `buildChair()` for a `GLTFLoader` call and change materials by node name.
