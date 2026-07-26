<script lang="ts">
  import { untrack } from 'svelte';
  import { Spring } from 'svelte/motion';
  import { fly, scale } from 'svelte/transition';
  import FoundationPage from './shared/FoundationPage.svelte';
  import { Button } from '@/components/ui/button';
  import { useTranslation } from '@/lib/i18n';
  import translations from '@shared/content/foundations/motion/translations.json';

  const { tStore } = untrack(() => useTranslation(translations));

  const LADDER = [
    { token: '--duration-instant', label: 'instant — 0ms' },
    { token: '--duration-fast', label: 'fast — 120ms' },
    { token: '--duration-base', label: 'base — 200ms' },
    { token: '--duration-moderate', label: 'moderate — 320ms' },
    { token: '--duration-slow', label: 'slow — 500ms' },
    { token: '--duration-stately', label: 'stately — 800ms' },
  ];

  let played = $state(false);

  const STAGGER_ITEMS = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

  // Spring físico nativo (svelte/motion). Durante o arrasto a mola PERSEGUE o
  // ponteiro (sem instant — instant zeraria a velocidade interna a cada set).
  // No soltar, preserveMomentum deixa a trajetória continuar por 120ms antes
  // da mola puxar de volta — o fling fica proporcional à velocidade do gesto.
  const coords = new Spring({ x: 0, y: 0 }, { stiffness: 0.3, damping: 0.8 });
  let dragging = $state(false);
  let tx = 0;
  let ty = 0;

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    tx += e.movementX;
    ty += e.movementY;
    coords.target = { x: tx, y: ty };
  }
  function onPointerUp() {
    dragging = false;
    tx = 0;
    ty = 0;
    coords.set({ x: 0, y: 0 }, { preserveMomentum: 120 });
  }

  let run = $state(0);
  let show = $state(true);

  const CODE_SPRING = `// nativo — svelte/motion (zero dependência)
import { Spring } from 'svelte/motion';

const coords = new Spring({ x: 0, y: 0 }, { stiffness: 0.3, damping: 0.8 });
// durante o arrasto a mola persegue o ponteiro (acumula velocidade real):
//   coords.target = { x, y };
// ao soltar, preserveMomentum continua a trajetória por 120ms — o fling
// fica proporcional à velocidade do gesto (instant zeraria a velocidade):
//   coords.set({ x: 0, y: 0 }, { preserveMomentum: 120 });

<div style="transform: translate({coords.current.x}px, {coords.current.y}px)" />`;

  const CODE_STAGGER = `import { fly } from 'svelte/transition';

{#key run}
  {#each items as item, i (item)}
    <!-- |global: sem ele a transição não dispara quando o {#key} recria a lista -->
    <li in:fly|global={{ y: 8, duration: 200, delay: i * 60 }}>{item}</li>
  {/each}
{/key}`;

  const CODE_PRESENCE = `import { scale } from 'svelte/transition';

{#if open}
  <div transition:scale={{ start: 0.95, duration: 200 }}>…</div>
{/if}`;
</script>

<!--
  Specimens: botões com hover demonstrando cada duração + demos interativas de
  motion nativo (svelte/motion + svelte/transition) — springs, stagger e
  presence. Micro-interações dos componentes continuam CSS-first (motion.css).
-->
<FoundationPage {translations} componentSlug="motion">
  {#snippet extra()}
    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('specimens.title')}</h2>
        <p class="nds-text-body">{$tStore('specimens.subtitle')}</p>
      </div>

      <div class="nds-stack nds-p-6 nds-bg-card nds-rounded-lg nds-border-soft" data-spacing="sm">
        <div>
          <Button variant="outline" size="sm" onclick={() => { played = !played; }}>
            {$tStore('specimens.advanced.labels.replay')}
          </Button>
        </div>
        {#each LADDER as d (d.token)}
          <div class="nds-bg-muted-30 nds-rounded-lg nds-p-1 nds-overflow-hidden">
            <div
              class="nds-bg-primary-soft nds-border-primary-soft nds-rounded-sm nds-px-4 nds-py-1 nds-text-caption nds-whitespace-nowrap"
              style="width: fit-content; transform: translateX({played ? '12rem' : '0'}); transition-property: transform; transition-duration: var({d.token}); transition-timing-function: var(--ease-standard)"
            >
              {d.label}
            </div>
          </div>
        {/each}
      </div>
    </section>

    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('specimens.advanced.title')}</h2>
        <p class="nds-text-body">{$tStore('specimens.advanced.subtitle')}</p>
      </div>

      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">{$tStore('specimens.advanced.spring.title')}</h3>
        <p class="nds-text-body">{$tStore('specimens.advanced.spring.desc')}</p>
        <div
          class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-cluster"
          data-align="center"
          data-justify="center"
          style="min-height: 9rem; overflow: hidden"
        >
          <div
            role="presentation"
            class="nds-bg-primary-soft nds-border-primary-soft nds-rounded-lg nds-p-4 nds-text-caption nds-font-medium nds-cursor-pointer"
            style="touch-action: none; user-select: none; transform: translate({coords.current.x}px, {coords.current.y}px) scale({dragging ? 1.05 : 1})"
            onpointerdown={onPointerDown}
            onpointermove={onPointerMove}
            onpointerup={onPointerUp}
          >
            {$tStore('specimens.advanced.labels.drag')}
          </div>
        </div>
        <pre class="nds-code-block"><code>{CODE_SPRING}</code></pre>
      </div>

      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">{$tStore('specimens.advanced.stagger.title')}</h3>
        <p class="nds-text-body">{$tStore('specimens.advanced.stagger.desc')}</p>
        <div class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-stack" data-spacing="sm" style="min-height: 9rem">
          <div>
            <Button variant="outline" size="sm" onclick={() => { run += 1; }}>
              {$tStore('specimens.advanced.labels.replay')}
            </Button>
          </div>
          {#key run}
            <ul class="nds-cluster nds-list-none" data-spacing="sm">
              {#each STAGGER_ITEMS as item, i (item)}
                <!-- |global: transições são locais por default e não disparam
                     quando um ancestral ({#key}) é recriado -->
                <li
                  in:fly|global={{ y: 8, duration: 200, delay: i * 60 }}
                  class="nds-bg-muted-50 nds-rounded-md nds-px-4 nds-py-2 nds-text-caption"
                >
                  {item}
                </li>
              {/each}
            </ul>
          {/key}
        </div>
        <pre class="nds-code-block"><code>{CODE_STAGGER}</code></pre>
      </div>

      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">{$tStore('specimens.advanced.presence.title')}</h3>
        <p class="nds-text-body">{$tStore('specimens.advanced.presence.desc')}</p>
        <div class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-stack" data-spacing="sm" style="min-height: 9rem; align-items: center">
          <Button variant="outline" size="sm" onclick={() => { show = !show; }}>
            {show ? $tStore('specimens.advanced.labels.hide') : $tStore('specimens.advanced.labels.show')}
          </Button>
          {#if show}
            <div
              transition:scale={{ start: 0.95, duration: 200 }}
              class="nds-bg-primary-soft nds-border-primary-soft nds-rounded-lg nds-p-4 nds-text-caption"
            >
              Presence
            </div>
          {/if}
        </div>
        <pre class="nds-code-block"><code>{CODE_PRESENCE}</code></pre>
      </div>

      <p class="nds-text-body nds-accent-start">{$tStore('specimens.advanced.note')}</p>

      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">{$tStore('specimens.advanced.touch.title')}</h3>
        <ul class="nds-stack nds-list-none" data-spacing="md">
          <li class="nds-accent-start nds-text-body">{$tStore('specimens.advanced.touch.tap')}</li>
          <li class="nds-accent-start nds-text-body">{$tStore('specimens.advanced.touch.hover')}</li>
          <li class="nds-accent-start nds-text-body">{$tStore('specimens.advanced.touch.drag')}</li>
        </ul>
      </div>
    </section>
  {/snippet}
</FoundationPage>
