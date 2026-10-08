<script lang="ts">
  import { onMount } from 'svelte';
  import { ChairViewer } from './lib/viewer';
  import {
    BASES,
    BASE_PRICE,
    DEFAULT_CONFIG,
    SEAT_PAD_PRICE,
    SHELL_COLORS,
    findBase,
    findColor,
    formatPrice,
    totalPrice,
    type ChairConfig
  } from './lib/config';

  let canvas: HTMLCanvasElement;
  let viewer = $state.raw<ChairViewer>();

  let config = $state<ChairConfig>({ ...DEFAULT_CONFIG });
  let autoRotate = $state(true);
  let showInfos = $state(true);
  let added = $state(false);

  const price = $derived(totalPrice(config));
  const color = $derived(findColor(config.color));
  const base = $derived(findBase(config.base));

  onMount(() => {
    viewer = new ChairViewer(canvas);
    return () => viewer?.dispose();
  });

  // Rebuild the 3D model whenever the configuration changes
  $effect(() => {
    viewer?.setConfig($state.snapshot(config));
    added = false;
  });

  $effect(() => {
    viewer?.setAutoRotate(autoRotate);
  });

  const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
</script>

<main>
  <section class="stage">
    <canvas bind:this={canvas} aria-label="3D preview of the configured chair"></canvas>

    <div class="stage-tools">
      <button type="button" onclick={() => (autoRotate = !autoRotate)} aria-pressed={autoRotate}>
        {autoRotate ? 'Pause rotation' : 'Rotate'}
      </button>
      <button type="button" onclick={() => viewer?.resetView()}>Reset view</button>
    </div>

    {#if showInfos}
      <dl class="infos">
        <div><dt>Shell</dt><dd>{color.name}</dd></div>
        <div><dt>Base</dt><dd>{base.name}</dd></div>
        <div><dt>Seat pad</dt><dd>{config.seatPad ? 'Yes' : 'No'}</dd></div>
        <div><dt>Size</dt><dd>46 × 55 × 82 cm</dd></div>
      </dl>
    {/if}
  </section>

  <aside class="panel">
    <header>
      <h1>Plastic side chair</h1>
      <p class="sub">Moulded shell, three bases, seven colours.</p>
    </header>

    <fieldset>
      <legend>Shell colour <span class="current">{color.name}</span></legend>
      <div class="swatches">
        {#each SHELL_COLORS as c (c.id)}
          <button
            type="button"
            class="swatch"
            class:selected={config.color === c.id}
            style:--swatch={hex(c.hex)}
            aria-label={c.name}
            aria-pressed={config.color === c.id}
            onclick={() => (config.color = c.id)}
          ></button>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Base</legend>
      <div class="options">
        {#each BASES as b (b.id)}
          <button
            type="button"
            class="option"
            class:selected={config.base === b.id}
            aria-pressed={config.base === b.id}
            onclick={() => (config.base = b.id)}
          >
            <span>
              <strong>{b.name}</strong>
              <small>{b.description}</small>
            </span>
            <em>{b.price ? `+${formatPrice(b.price)}` : 'Included'}</em>
          </button>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Extras</legend>
      <label class="toggle">
        <input type="checkbox" bind:checked={config.seatPad} />
        <span>Seat pad</span>
        <em>+{formatPrice(SEAT_PAD_PRICE)}</em>
      </label>
      <label class="toggle">
        <input type="checkbox" bind:checked={showInfos} />
        <span>Show product details</span>
      </label>
    </fieldset>

    <footer>
      <div class="price">
        <span>Total</span>
        <strong>{formatPrice(price)}</strong>
        <small>Chair {formatPrice(BASE_PRICE)}{color.price ? ` + colour ${formatPrice(color.price)}` : ''}</small>
      </div>
      <button type="button" class="cta" onclick={() => (added = true)}>
        {added ? 'Added to cart' : 'Add to cart'}
      </button>
    </footer>
  </aside>
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 1fr 380px;
    height: 100%;
  }

  .stage {
    position: relative;
    background: radial-gradient(ellipse at 50% 70%, #f1f3f5 0%, var(--stage) 70%);
    min-height: 320px;
    overflow: hidden;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
    cursor: grab;
  }
  canvas:active { cursor: grabbing; }

  .stage-tools {
    position: absolute;
    top: 1rem;
    left: 1rem;
    display: flex;
    gap: 0.5rem;
  }
  .stage-tools button {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: rgb(255 255 255 / 0.8);
    backdrop-filter: blur(6px);
    cursor: pointer;
    font-size: 0.85rem;
  }
  .stage-tools button:hover { background: #fff; }

  .infos {
    position: absolute;
    left: 1rem;
    bottom: 1rem;
    margin: 0;
    padding: 0.75rem 1rem;
    display: grid;
    grid-template-columns: auto auto;
    gap: 0.25rem 1.25rem;
    background: rgb(255 255 255 / 0.85);
    border: 1px solid var(--line);
    border-radius: 10px;
    font-size: 0.82rem;
  }
  .infos div { display: contents; }
  .infos dt { color: var(--muted); }
  .infos dd { margin: 0; font-weight: 600; }

  .panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.75rem;
    overflow-y: auto;
    background: var(--panel);
    border-left: 1px solid var(--line);
  }
  h1 {
    margin: 0;
    font-size: 1.75rem;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .sub { margin: 0.4rem 0 0; color: var(--muted); }

  fieldset { border: 0; padding: 0; margin: 0; }
  legend {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }
  .current { font-weight: 400; color: var(--muted); }

  .swatches { display: flex; flex-wrap: wrap; gap: 0.6rem; }
  .swatch {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    border: 1px solid rgb(0 0 0 / 0.18);
    background: var(--swatch);
    cursor: pointer;
    transition: box-shadow 0.15s;
  }
  .swatch.selected { box-shadow: 0 0 0 2px var(--panel), 0 0 0 4px var(--accent); }

  .options { display: grid; gap: 0.5rem; }
  .option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 0.9rem;
    text-align: left;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 8px;
    cursor: pointer;
  }
  .option strong { display: block; }
  .option small { color: var(--muted); }
  .option em { font-style: normal; font-size: 0.85rem; color: var(--muted); white-space: nowrap; }
  .option.selected { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 0;
    cursor: pointer;
  }
  .toggle span { flex: 1; }
  .toggle em { font-style: normal; color: var(--muted); font-size: 0.85rem; }
  .toggle input { accent-color: var(--accent); width: 1.05rem; height: 1.05rem; }

  footer {
    margin-top: auto;
    padding-top: 1.25rem;
    border-top: 1px solid var(--line);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
  }
  .price { display: grid; }
  .price span { color: var(--muted); font-size: 0.85rem; }
  .price strong { font-size: 1.8rem; letter-spacing: -0.02em; }
  .price small { color: var(--muted); }
  .cta {
    padding: 0.85rem 1.4rem;
    border: 0;
    border-radius: 8px;
    background: var(--accent);
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  .cta:hover { filter: brightness(1.08); }

  @media (max-width: 820px) {
    main { grid-template-columns: 1fr; grid-template-rows: 55vh auto; height: auto; }
    .panel { border-left: 0; border-top: 1px solid var(--line); }
  }
</style>
