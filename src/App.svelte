<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Camera,
    Crosshair,
    FileText,
    LayoutPanelLeft,
    List,
    RotateCcw,
    RotateCw,
    Save,
    ScanLine,
    SquarePen
  } from 'lucide-svelte';
  import { ChairViewer } from './lib/viewer';
  import {
    BASES,
    BASE_COLORS,
    BASE_ON_OPTIONS,
    BASE_PRICE,
    DEFAULT_CONFIG,
    SEAT_PAD_PRICE,
    SHELL_COLORS,
    SHELL_STYLES,
    findBase,
    findBaseColor,
    findBaseOn,
    findColor,
    findShellStyle,
    formatPrice,
    totalPrice,
    type ChairConfig
  } from './lib/config';

  let canvas: HTMLCanvasElement;
  let viewer = $state.raw<ChairViewer>();

  let config = $state<ChairConfig>({ ...DEFAULT_CONFIG });
  let autoRotate = $state(false);
  let showInfos = $state(true);
  let showAllColors = $state(false);
  let showPanel = $state(true);
  let actionMessage = $state('');

  const previewColorCount = 3;
  const draftKey = 'chair-configurator-draft';
  const price = $derived(totalPrice(config));
  const shellStyle = $derived(findShellStyle(config.shellStyle));
  const color = $derived(findColor(config.color));
  const base = $derived(findBase(config.base));
  const baseColor = $derived(findBaseColor(config.baseColor));
  const baseOn = $derived(findBaseOn(config.baseOn));
  const visibleColors = $derived(
    showAllColors ? SHELL_COLORS : SHELL_COLORS.slice(0, previewColorCount)
  );

  onMount(() => {
    viewer = new ChairViewer(canvas);

    try {
      const storedDraft = window.localStorage.getItem(draftKey);
      if (storedDraft) {
        const parsed: unknown = JSON.parse(storedDraft);
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'config' in parsed &&
          isChairConfig(parsed.config)
        ) {
          config = { ...DEFAULT_CONFIG, ...parsed.config };
          actionMessage = 'Saved draft restored from this device.';
        } else {
          actionMessage = 'Saved draft could not be restored because its chair options are invalid.';
        }
      }
    } catch {
      actionMessage = 'Saved draft could not be restored. Check your browser storage settings.';
    }

    return () => viewer?.dispose();
  });

  $effect(() => {
    viewer?.setConfig($state.snapshot(config));
  });

  $effect(() => {
    viewer?.setAutoRotate(autoRotate);
  });

  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

  function isChairConfig(value: unknown): value is ChairConfig {
    if (typeof value !== 'object' || value === null) return false;
    if (!('color' in value) || !('base' in value) || !('seatPad' in value)) return false;

    return (
      (!('shellStyle' in value) ||
        SHELL_STYLES.some((style) => style.id === value.shellStyle)) &&
      typeof value.color === 'string' &&
      SHELL_COLORS.some((option) => option.id === value.color) &&
      BASES.some((option) => option.id === value.base) &&
      (!('baseColor' in value) ||
        BASE_COLORS.some((option) => option.id === value.baseColor)) &&
      (!('baseOn' in value) ||
        BASE_ON_OPTIONS.some((option) => option.id === value.baseOn)) &&
      typeof value.seatPad === 'boolean'
    );
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({
          config: $state.snapshot(config),
          savedAt: new Date().toISOString()
        })
      );
      actionMessage = 'Draft saved on this device.';
    } catch {
      actionMessage = 'Draft could not be saved. Check your browser storage and try again.';
    }
  }
</script>

<main class:panel-collapsed={!showPanel}>
  <section class="stage" aria-label="Chair preview">
    <canvas bind:this={canvas} aria-label="Interactive 3D preview of the configured chair"></canvas>

    <div class="stage-tools" aria-label="Scene controls">
      <button
        type="button"
        class="tool-button"
        onclick={() => viewer?.resetView()}
        aria-label="Reset view"
        title="Reset view"
      >
        <RotateCcw size={17} strokeWidth={1.9} />
      </button>

      <button
        type="button"
        class="tool-button"
        class:active={autoRotate}
        onclick={() => (autoRotate = !autoRotate)}
        aria-pressed={autoRotate}
        aria-label={autoRotate ? 'Pause rotation' : 'Rotate'}
        title={autoRotate ? 'Pause rotation' : 'Rotate'}
      >
        <RotateCw size={17} strokeWidth={1.9} />
      </button>

      <button
        type="button"
        class="tool-button"
        onclick={() => (actionMessage = 'AR preview is available on supported devices.')}
        aria-label="AR view"
        title="AR view"
      >
        <span class="ar-mark">AR</span>
      </button>

      <button
        type="button"
        class="tool-button"
        class:active={showInfos}
        onclick={() => (showInfos = !showInfos)}
        aria-pressed={showInfos}
        aria-label={showInfos ? 'Hide details' : 'Show details'}
        title={showInfos ? 'Hide details' : 'Show details'}
      >
        <FileText size={17} strokeWidth={1.9} />
      </button>

      <button
        type="button"
        class="tool-button"
        onclick={() => (actionMessage = 'Details panel toggled.')}
        aria-label="List view"
        title="List view"
      >
        <LayoutPanelLeft size={17} strokeWidth={1.9} />
      </button>

      <button
        type="button"
        class="tool-button"
        onclick={() => (showPanel = !showPanel)}
        aria-label={showPanel ? 'Collapse chair options' : 'Expand chair options'}
        title={showPanel ? 'Collapse chair options' : 'Expand chair options'}
      >
        <SquarePen size={17} strokeWidth={1.9} />
      </button>

      <button
        type="button"
        class="tool-button"
        onclick={() => (actionMessage = 'View captured. Use the save draft button to keep it on this device.')}
        aria-label="Capture view"
        title="Capture view"
      >
        <ScanLine size={17} strokeWidth={1.9} />
      </button>

      <button
        type="button"
        class="tool-button"
        onclick={saveDraft}
        aria-label="Save draft"
        title="Save draft"
      >
        <Save size={17} strokeWidth={1.9} />
      </button>

      <button
        type="button"
        class="tool-button"
        onclick={() => (showInfos = !showInfos)}
        aria-label="Toggle inspector"
        title="Toggle inspector"
      >
        <Crosshair size={17} strokeWidth={1.9} />
      </button>
    </div>

    {#if showInfos}
      <dl class="infos">
        <div><dt>Plastic shell</dt><dd>{shellStyle.name}</dd></div>
        <div><dt>Seat shell</dt><dd>{color.name}</dd></div>
        <div><dt>Base</dt><dd>{base.name}</dd></div>
        <div><dt>Base colour</dt><dd>{baseColor.name}</dd></div>
        <div><dt>Base on</dt><dd>{baseOn.name}</dd></div>
        <div><dt>Seat pad</dt><dd>{config.seatPad ? 'Included' : 'Not selected'}</dd></div>
        <div><dt>Size</dt><dd>46 × 55 × 82 cm</dd></div>
      </dl>
    {/if}
  </section>

  <button
    type="button"
    class="panel-toggle"
    class:collapsed={!showPanel}
    aria-label={showPanel ? 'Collapse chair options' : 'Expand chair options'}
    aria-expanded={showPanel}
    aria-controls="chair-options-panel"
    onclick={() => (showPanel = !showPanel)}
  >
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg>
  </button>

  <aside id="chair-options-panel" class="panel" aria-label="Chair options">
    <div class="panel-content">
      <header class="panel-heading">
        <p class="eyebrow">Make it yours</p>
        <h1>{shellStyle.name}</h1>
        <p class="sub">Choose a shell style, colour and base. Your preview updates as you go.</p>
      </header>

      <fieldset class="control-group">
        <legend>
          <span>Plastic shell</span>
          <span class="current">{shellStyle.name}</span>
        </legend>
        <div class="shell-styles">
          {#each SHELL_STYLES as style (style.id)}
            <button
              type="button"
              class="shell-style"
              class:selected={config.shellStyle === style.id}
              aria-pressed={config.shellStyle === style.id}
              onclick={() => {
                config.shellStyle = style.id;
                actionMessage = '';
              }}
            >
              <span class="shell-visual" aria-hidden="true">
                <svg viewBox="0 0 88 72">
                  <path class="shell-back" d="M26 7q0-4 5-4h22q5 0 6 5l5 30q1 6-5 8H31q-7-2-7-9z" />
                  <path class="shell-seat" d="M21 39q1-4 6-4h38q6 0 7 5l2 7q1 5-5 6H25q-6-1-5-6z" />
                  {#if style.id === 'armchair'}
                    <path class="shell-arm" d="M24 31q-8 0-8 6v10q0 4 5 4h5m38-20q8 0 8 6v10q0 4-5 4h-5" />
                    <path class="shell-arm" d="m22 49-3 13m47-13 3 13" />
                  {/if}
                </svg>
              </span>
              <span class="shell-style-name">{style.name}</span>
              <span class="shell-style-description">{style.description}</span>
              {#if config.shellStyle === style.id}
                <span class="selected-mark" aria-hidden="true">
                  <svg viewBox="0 0 20 20"><path d="m4.5 10.5 3.4 3.3 7.6-7.5" /></svg>
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset class="control-group">
        <legend>
          <span>Seat shell</span>
          <span class="current">{color.name}</span>
        </legend>
        <div class="swatches">
          {#each visibleColors as c (c.id)}
            <button
              type="button"
              class="swatch-option"
              class:selected={config.color === c.id}
              aria-label={`${c.name}${c.price ? `, plus ${formatPrice(c.price)}` : ''}`}
              aria-pressed={config.color === c.id}
              onclick={() => {
                config.color = c.id;
                actionMessage = '';
              }}
            >
              <span class="swatch" style:--swatch={hex(c.hex)}>
                {#if config.color === c.id}
                  <svg class:dark={c.hex >= 0xaaaaaa} viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m4.5 10.5 3.4 3.3 7.6-7.5" />
                  </svg>
                {/if}
              </span>
              <span class="swatch-name">{c.name}</span>
              {#if c.price}
                <span class="swatch-price">+{formatPrice(c.price)}</span>
              {/if}
            </button>
          {/each}
          {#if SHELL_COLORS.length > previewColorCount}
            <button
              type="button"
              class="show-more"
              aria-expanded={showAllColors}
              onclick={() => (showAllColors = !showAllColors)}
            >
              <span class="more-circle">
                {showAllColors ? '−' : `+${SHELL_COLORS.length - previewColorCount}`}
              </span>
              <span>{showAllColors ? 'Show less' : 'Show all'}</span>
            </button>
          {/if}
        </div>
      </fieldset>

      <fieldset class="control-group">
        <legend>
          <span>Base type</span>
          <span class="current">{base.name}</span>
        </legend>
        <div class="base-options">
          {#each BASES as b (b.id)}
            <button
              type="button"
              class="base-option"
              class:selected={config.base === b.id}
              aria-label={`${b.name}${b.price ? `, plus ${formatPrice(b.price)}` : ', included'}`}
              aria-pressed={config.base === b.id}
              onclick={() => {
                config.base = b.id;
                actionMessage = '';
              }}
            >
              <span class="base-visual" aria-hidden="true">
                <svg viewBox="0 0 72 58">
                  <path class="chair-seat" d="M16 7h40l-4 8H20z" />
                  {#if b.id === 'dowel'}
                    <path class="base-wood" d="m23 15-9 35m15-35 1 35m8-35-2 35m8-35 13 35" />
                    <path class="base-wire" d="m17 37 36 2m-31-9 27 10m-23-10-8 9" />
                  {:else if b.id === 'eiffel'}
                    <path class="base-metal" d="m22 15 10 35m18-35L40 50m-13-24h21m-20 11h15" />
                  {:else}
                    <path class="base-metal" d="M23 15v22q0 10 9 10h9q9 0 9-10V15m-27 9h36m-30 13h24" />
                  {/if}
                </svg>
              </span>
              <span class="base-name">{b.name}</span>
              <span class="base-description">{b.description}</span>
              <span class="base-price">{b.price ? `+${formatPrice(b.price)}` : 'Included'}</span>
              {#if config.base === b.id}
                <span class="selected-mark" aria-hidden="true">
                  <svg viewBox="0 0 20 20"><path d="m4.5 10.5 3.4 3.3 7.6-7.5" /></svg>
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset class="control-group extras-group">
        <legend>
          <span>Base colour</span>
          <span class="current">{baseColor.name}</span>
        </legend>
        <div class="base-colors">
          {#each BASE_COLORS as finish (finish.id)}
            <button
              type="button"
              class="base-color-option"
              class:selected={config.baseColor === finish.id}
              aria-label={finish.name}
              aria-pressed={config.baseColor === finish.id}
              onclick={() => {
                config.baseColor = finish.id;
                actionMessage = '';
              }}
            >
              <span class="base-color-swatch" style:--swatch={hex(finish.hex)}>
                {#if config.baseColor === finish.id}
                  <svg class:dark={finish.id !== 'dark'} viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m4.5 10.5 3.4 3.3 7.6-7.5" />
                  </svg>
                {/if}
              </span>
              <span class="base-color-name">{finish.name}</span>
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset class="control-group">
        <legend>
          <span>Base on</span>
          <span class="current">{baseOn.name}</span>
        </legend>
        <div class="base-on-options">
          {#each BASE_ON_OPTIONS as option (option.id)}
            <button
              type="button"
              class="base-on-option"
              class:selected={config.baseOn === option.id}
              aria-label={`${option.name}, ${option.description}`}
              aria-pressed={config.baseOn === option.id}
              onclick={() => {
                config.baseOn = option.id;
                actionMessage = '';
              }}
            >
              <span class="glide-visual" style:--glide-color={hex(option.color)} aria-hidden="true">
                <svg viewBox="0 0 48 40">
                  <path d="M15 5h18l-2 5H17z" />
                  <path d="m19 10-4 21m8-21-2 21m8-21 4 21" />
                  <ellipse cx="15" cy="33" rx="3.5" ry="2.5" />
                  <ellipse cx="21" cy="33" rx="3.5" ry="2.5" />
                  <ellipse cx="33" cy="33" rx="3.5" ry="2.5" />
                </svg>
              </span>
              <span class="base-on-name">{option.name}</span>
              <span class="base-on-description">{option.description}</span>
              {#if config.baseOn === option.id}
                <span class="selected-mark" aria-hidden="true">
                  <svg viewBox="0 0 20 20"><path d="m4.5 10.5 3.4 3.3 7.6-7.5" /></svg>
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset class="control-group">
        <legend><span>Comfort</span></legend>
        <label class="extra-option">
          <span class="extra-copy">
            <strong>Seat pad</strong>
            <small>A little extra comfort in a charcoal finish.</small>
          </span>
          <span class="extra-price">+{formatPrice(SEAT_PAD_PRICE)}</span>
          <input
            type="checkbox"
            bind:checked={config.seatPad}
            onchange={() => (actionMessage = '')}
          />
        </label>
      </fieldset>
    </div>

    <footer class="action-bar">
      <div class="price">
        <span>Total price</span>
        <strong>{formatPrice(price)}</strong>
        <small>
          Chair {formatPrice(BASE_PRICE)}
          {#if color.price}+ colour {formatPrice(color.price)}{/if}
          {#if base.price}+ base {formatPrice(base.price)}{/if}
          {#if config.seatPad}+ seat pad {formatPrice(SEAT_PAD_PRICE)}{/if}
        </small>
      </div>
      <div class="actions">
        <button type="button" class="save-button" onclick={saveDraft}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 3.75h12l3.25 3.3v13.2H3.75V3.75zM7.5 3.75v6h9v-6M7.5 20.25v-7.5h9v7.5" />
          </svg>
          Save draft
        </button>
        <button
          type="button"
          class="request-button"
          onclick={() => (actionMessage = 'This demo does not send product requests yet.')}
        >
          Request product
        </button>
      </div>
      {#if actionMessage}
        <p class="action-message" role="status">{actionMessage}</p>
      {/if}
    </footer>
  </aside>
</main>

<style>
  main {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 456px;
    height: 100%;
    min-height: 0;
  }
  main.panel-collapsed { grid-template-columns: minmax(0, 1fr) 0; }
  .panel-toggle {
    position: absolute;
    z-index: 2;
    top: 50%;
    right: 456px;
    display: grid;
    width: 2rem;
    height: 2rem;
    transform: translate(50%, -50%);
    place-items: center;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--surface);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 1px 3px oklch(0.2 0.01 260 / 0.08);
  }
  .panel-toggle:hover { background: var(--surface-hover); }
  .panel-toggle svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }
  .panel-toggle.collapsed { right: 0; }
  .panel-toggle.collapsed svg { transform: rotate(180deg); }

  .stage {
    position: relative;
    min-height: 320px;
    overflow: hidden;
    background: transparent;
  }
  canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: grab;
  }
  canvas:active { cursor: grabbing; }

  .stage-tools {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0.38rem;
    padding: 0.2rem;
    border-radius: 0.8rem;
  }
  .tool-button {
    display: grid;
    place-items: center;
    width: 2.45rem;
    height: 2.45rem;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.72);
    color: var(--ink);
    cursor: pointer;
  }
  .tool-button:hover { background: rgba(255, 255, 255, 0.9); }
  .tool-button.active {
    border-color: rgba(0, 0, 0, 0.22);
    background: rgba(255, 255, 255, 0.9);
  }
  .tool-button :global(svg) {
    width: 1.05rem;
    height: 1.05rem;
    stroke: currentColor;
  }
  .tool-button :global(svg *) {
    vector-effect: non-scaling-stroke;
  }
  .ar-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.55rem;
    height: 1.2rem;
    border: 1px solid currentColor;
    border-radius: 0.22rem;
    font-size: 0.48rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .infos {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    display: grid;
    grid-template-columns: auto auto;
    gap: 0.3rem 1rem;
    margin: 0;
    padding: 0.8rem 1rem;
    border: 1px solid var(--line);
    border-radius: 0.75rem;
    background: var(--surface);
    font-size: 0.78rem;
  }
  .infos div { display: contents; }
  .infos dt { color: var(--muted); }
  .infos dd { margin: 0; font-weight: 600; }

  .panel {
    display: flex;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid var(--line);
    background: var(--panel);
  }
  .panel-collapsed .panel {
    visibility: hidden;
    pointer-events: none;
  }
  .panel-content {
    min-height: 0;
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 1.35rem 1rem;
    scrollbar-color: var(--scroll-thumb) transparent;
    scrollbar-width: thin;
  }
  .panel-heading { margin-bottom: 1.5rem; }
  h1 {
    margin: 0;
    font-size: 1.65rem;
    letter-spacing: -0.035em;
    line-height: 1.15;
  }
  .eyebrow {
    margin: 0 0 0.35rem;
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 650;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
  .sub { max-width: 34ch; margin: 0.45rem 0 0; color: var(--muted); font-size: 0.85rem; line-height: 1.45; }

  .control-group {
    min-width: 0;
    margin: 0;
    padding: 1.15rem 0 1.3rem;
    border: 0;
    border-top: 1px solid var(--line);
  }
  .shell-styles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
    margin-top: 0.75rem;
  }
  .shell-style {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 8.25rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.65rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 0.6rem;
    background: transparent;
    cursor: pointer;
    text-align: center;
  }
  .shell-style:hover { background: var(--surface-hover); }
  .shell-style.selected {
    border-color: var(--line);
    background: var(--surface-selected);
  }
  .shell-visual {
    display: grid;
    width: 100%;
    height: 3.75rem;
    place-items: center;
  }
  .shell-visual svg { width: min(5rem, 100%); height: 3.75rem; overflow: visible; }
  .shell-back,
  .shell-seat {
    fill: oklch(0.74 0.012 80);
    stroke: oklch(0.55 0.012 80);
    stroke-width: 1.3;
  }
  .shell-arm {
    fill: none;
    stroke: oklch(0.55 0.012 80);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3;
  }
  .shell-style-name { font-size: 0.73rem; font-weight: 600; line-height: 1.2; }
  .shell-style-description { color: var(--muted); font-size: 0.66rem; line-height: 1.25; }
  legend {
    display: flex;
    width: 100%;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0;
    color: var(--muted);
    font-size: 0.69rem;
    font-weight: 650;
    letter-spacing: 0.075em;
    text-transform: uppercase;
  }
  .current {
    overflow: hidden;
    color: var(--ink);
    font-size: 0.72rem;
    font-weight: 550;
    letter-spacing: 0;
    text-overflow: ellipsis;
    text-transform: none;
    white-space: nowrap;
  }

  .swatches {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.6rem 0.35rem;
    margin-top: 0.75rem;
  }
  .swatch-option,
  .show-more {
    display: flex;
    min-width: 0;
    min-height: 6.4rem;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 0.45rem;
    padding: 0.35rem 0.15rem 0.4rem;
    border: 1px solid transparent;
    border-radius: 0.6rem;
    background: transparent;
    cursor: pointer;
    text-align: center;
  }
  .swatch-option:hover,
  .show-more:hover { background: var(--surface-hover); }
  .swatch-option.selected {
    border-color: var(--line);
    background: var(--surface-selected);
  }
  .swatch {
    display: grid;
    width: 3rem;
    height: 3rem;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid oklch(0.2 0.01 260 / 0.14);
    border-radius: 50%;
    background: var(--swatch);
    box-shadow: 0 1px 2px oklch(0.2 0.01 260 / 0.08);
  }
  .swatch-option.selected .swatch { outline: 2px solid var(--accent); outline-offset: 2px; }
  .swatch svg,
  .selected-mark svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: none;
    stroke: var(--surface);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }
  .swatch svg.dark { stroke: var(--ink); }
  .swatch-name {
    max-width: 100%;
    overflow: hidden;
    font-size: 0.69rem;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .swatch-price { margin-top: -0.35rem; color: var(--muted); font-size: 0.63rem; }
  .more-circle {
    display: grid;
    width: 3rem;
    height: 3rem;
    place-items: center;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    background: var(--surface);
    font-size: 0.82rem;
  }
  .show-more > span:last-child { color: var(--muted); font-size: 0.69rem; }

  .base-colors {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
    margin-top: 0.75rem;
  }
  .base-color-option {
    display: flex;
    min-height: 5.25rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.4rem;
    border: 1px solid transparent;
    border-radius: 0.6rem;
    background: transparent;
    cursor: pointer;
  }
  .base-color-option:hover { background: var(--surface-hover); }
  .base-color-option.selected {
    border-color: var(--line);
    background: var(--surface-selected);
  }
  .base-color-swatch {
    display: grid;
    width: 2.35rem;
    height: 2.35rem;
    place-items: center;
    border: 1px solid oklch(0.2 0.01 260 / 0.15);
    border-radius: 50%;
    background: var(--swatch);
  }
  .base-color-swatch svg {
    width: 1.15rem;
    height: 1.15rem;
    fill: none;
    stroke: var(--surface);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }
  .base-color-swatch svg.dark { stroke: var(--ink); }
  .base-color-option.selected .base-color-swatch { outline: 2px solid var(--accent); outline-offset: 2px; }
  .base-color-name { font-size: 0.7rem; line-height: 1.2; }

  .base-on-options {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.25rem;
    margin-top: 0.75rem;
  }
  .base-on-option {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 7rem;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.45rem 0.2rem;
    border: 1px solid transparent;
    border-radius: 0.55rem;
    background: transparent;
    cursor: pointer;
    text-align: center;
  }
  .base-on-option:hover { background: var(--surface-hover); }
  .base-on-option.selected {
    border-color: var(--line);
    background: var(--surface-selected);
  }
  .glide-visual {
    display: grid;
    width: 2.6rem;
    height: 2.4rem;
    place-items: center;
  }
  .glide-visual svg { width: 2.5rem; height: 2.1rem; overflow: visible; }
  .glide-visual path {
    fill: none;
    stroke: oklch(0.55 0.012 80);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }
  .glide-visual ellipse {
    fill: var(--glide-color);
    stroke: oklch(0.42 0.01 260);
    stroke-width: 0.8;
  }
  .base-on-name {
    display: -webkit-box;
    overflow: hidden;
    font-size: 0.64rem;
    font-weight: 550;
    line-height: 1.2;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .base-on-description {
    color: var(--muted);
    font-size: 0.59rem;
    line-height: 1.2;
  }

  .base-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
    margin-top: 0.75rem;
  }
  .base-option {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 10rem;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem 0.3rem 0.65rem;
    border: 1px solid transparent;
    border-radius: 0.6rem;
    background: transparent;
    cursor: pointer;
    text-align: center;
  }
  .base-option:hover { background: var(--surface-hover); }
  .base-option.selected {
    border-color: var(--line);
    background: var(--surface-selected);
  }
  .base-visual {
    display: grid;
    width: 100%;
    height: 3.25rem;
    place-items: center;
  }
  .base-visual svg { width: min(4.5rem, 100%); height: 3.2rem; overflow: visible; }
  .chair-seat { fill: oklch(0.69 0.014 78); }
  .base-wood {
    fill: none;
    stroke: oklch(0.43 0.035 70);
    stroke-linecap: round;
    stroke-width: 2.3;
  }
  .base-wire {
    fill: none;
    stroke: oklch(0.67 0.012 250);
    stroke-linecap: round;
    stroke-width: 1.2;
  }
  .base-metal {
    fill: none;
    stroke: oklch(0.49 0.018 255);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }
  .base-name { font-size: 0.69rem; font-weight: 600; line-height: 1.2; }
  .base-description {
    display: -webkit-box;
    overflow: hidden;
    color: var(--muted);
    font-size: 0.62rem;
    line-height: 1.25;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .base-price { margin-top: auto; color: var(--muted); font-size: 0.65rem; font-weight: 550; }
  .selected-mark {
    position: absolute;
    top: 0.45rem;
    right: 0.45rem;
    display: grid;
    width: 1.2rem;
    height: 1.2rem;
    place-items: center;
    border-radius: 50%;
    background: var(--accent);
  }
  .selected-mark svg { width: 0.85rem; height: 0.85rem; stroke: var(--accent-ink); stroke-width: 2.5; }

  .extras-group { padding-bottom: 0.5rem; }
  .extra-option {
    display: flex;
    min-height: 4.25rem;
    align-items: center;
    gap: 0.65rem;
    margin-top: 0.7rem;
    padding: 0.7rem 0.75rem;
    border: 1px solid var(--line);
    border-radius: 0.65rem;
    background: var(--surface);
    cursor: pointer;
  }
  .extra-copy { display: grid; flex: 1; gap: 0.15rem; }
  .extra-copy strong { font-size: 0.8rem; }
  .extra-copy small { color: var(--muted); font-size: 0.69rem; }
  .extra-price { color: var(--muted); font-size: 0.72rem; white-space: nowrap; }
  .extra-option input {
    width: 1.15rem;
    height: 1.15rem;
    margin: 0 0 0 0.15rem;
    accent-color: var(--accent);
  }

  .action-bar {
    position: sticky;
    bottom: 0;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.8rem;
    padding: 1rem 1.35rem 1.1rem;
    border-top: 1px solid var(--line);
    background: var(--surface);
    box-shadow: 0 -8px 20px oklch(0.2 0.01 260 / 0.04);
  }
  .price { display: grid; gap: 0.08rem; }
  .price > span { color: var(--muted); font-size: 0.7rem; }
  .price strong { font-size: 1.35rem; letter-spacing: -0.03em; }
  .price small { color: var(--muted); font-size: 0.64rem; line-height: 1.4; }
  .actions { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 0.55rem; }
  .actions button {
    display: inline-flex;
    min-height: 2.85rem;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--surface);
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 550;
    white-space: nowrap;
  }
  .actions button:hover { background: var(--surface-hover); }
  .actions .save-button svg { width: 1.15rem; height: 1.15rem; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round; }
  .actions .request-button {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-ink);
    font-weight: 650;
  }
  .actions .request-button:hover { background: var(--accent-hover); }
  .action-message { margin: 0; color: var(--muted); font-size: 0.72rem; line-height: 1.35; }

  @media (min-width: 1100px) {
    .action-bar { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
    .actions { grid-template-columns: auto auto; }
    .action-message { grid-column: 1 / -1; }
  }
  @media (max-width: 820px) {
    main { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(250px, 42vh) minmax(0, 1fr); }
    main.panel-collapsed { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) 0; }
    .panel-toggle {
      top: max(250px, 42vh);
      right: auto;
      left: 50%;
      transform: translate(-50%, -50%) rotate(90deg);
    }
    .panel-toggle.collapsed {
      top: calc(100% - 1rem);
      right: auto;
      left: 50%;
      transform: translate(-50%, -50%) rotate(90deg);
    }
    .panel-toggle.collapsed svg { transform: rotate(180deg); }
    .panel { border-top: 1px solid var(--line); border-left: 0; }
    .panel-content { padding: 1.25rem 1.1rem 0.75rem; }
    .action-bar { padding-right: 1.1rem; padding-left: 1.1rem; }
  }
  @media (max-width: 390px) {
    .stage-tools button { padding-right: 0.6rem; padding-left: 0.6rem; font-size: 0.72rem; }
    .base-description { display: none; }
    .base-option { min-height: 8.5rem; }
    .actions button { gap: 0.3rem; padding-right: 0.55rem; padding-left: 0.55rem; font-size: 0.73rem; }
  }
</style>
