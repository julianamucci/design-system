<script lang="ts">
  import { untrack } from 'svelte';
  import FoundationPage from './shared/FoundationPage.svelte';
  import { useTranslation } from '@/lib/i18n';
  import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';

  const { tStore } = untrack(() => useTranslation(translations));

  const ELEVATIONS: Array<{ token: string | null; label: string }> = [
    { token: null, label: '0 — Plano' },
    { token: '--elevation-sm', label: '1 — Card' },
    { token: '--elevation-md', label: '2 — Dropdown' },
    { token: '--elevation-lg', label: '3 — Dialog' },
    { token: '--elevation-xl', label: '4 — Tooltip' },
  ];

  const RADII: Array<{ token: string | null; label: string }> = [
    { token: '--radius-none', label: 'none' },
    { token: '--radius-xs', label: 'xs' },
    { token: '--radius-sm', label: 'sm' },
    { token: '--radius-md', label: 'md' },
    { token: '--radius-lg', label: 'lg' },
    { token: '--radius-xl', label: 'xl' },
    { token: '--radius-full', label: 'full' },
  ];
</script>

<FoundationPage {translations} componentSlug="elevacao-bordas-sombras">
  {#snippet extra()}
    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('specimens.title')}</h2>
        <p class="nds-text-body">{$tStore('specimens.subtitle')}</p>
      </div>

      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">{$tStore('specimens.shadows')}</h3>
        <div
          class="nds-grid nds-p-6 nds-rounded-lg"
          data-spacing="lg"
          style="--grid-min: 8rem; background-color: hsl(var(--muted) / 0.2)"
        >
          {#each ELEVATIONS as el (el.label)}
            <div
              class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-4 nds-text-caption nds-text-muted-foreground nds-text-center"
              style={el.token ? `box-shadow: var(${el.token})` : undefined}
            >
              <div class="nds-font-medium nds-text-foreground nds-mb-1">{el.label}</div>
              <code style="font-size: 10px">{el.token ?? '—'}</code>
            </div>
          {/each}
        </div>
      </div>

      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">{$tStore('specimens.radius')}</h3>
        <div class="nds-grid" data-spacing="md" style="--grid-min: 8rem">
          {#each RADII as r (r.label)}
            <div
              class="nds-bg-primary-soft nds-border-primary-soft nds-p-6 nds-text-caption nds-text-muted-foreground nds-text-center {r.token ? '' : 'nds-rounded-full'}"
              style={r.token ? `border-radius: var(${r.token})` : undefined}
            >
              <code>{r.token ?? '.nds-rounded-full'}</code>
            </div>
          {/each}
        </div>
      </div>

      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-body nds-font-medium">{$tStore('specimens.nested')}</h3>
        <div class="nds-grid" data-spacing="md" style="--grid-min: 12rem">
          <!-- Rᵢ = Rₑ − E: 14 → 10 → 6 com inset p-1 (4px) em cada nível -->
          <div class="nds-stack" data-spacing="xs">
            <div class="nds-bg-primary-soft nds-p-1" style="border-radius: var(--radius-xl)">
              <div class="nds-bg-card nds-p-1" style="border-radius: var(--radius)">
                <div class="nds-bg-primary-soft nds-p-6" style="border-radius: var(--radius-sm)"></div>
              </div>
            </div>
            <span class="nds-text-caption nds-text-muted-foreground">{$tStore('specimens.nestedOk')}</span>
          </div>
          <!-- Errado: mesmo raio em todos os níveis -->
          <div class="nds-stack" data-spacing="xs">
            <div class="nds-bg-primary-soft nds-p-1" style="border-radius: var(--radius-xl)">
              <div class="nds-bg-card nds-p-1" style="border-radius: var(--radius-xl)">
                <div class="nds-bg-primary-soft nds-p-6" style="border-radius: var(--radius-xl)"></div>
              </div>
            </div>
            <span class="nds-text-caption nds-text-muted-foreground">{$tStore('specimens.nestedBad')}</span>
          </div>
        </div>
      </div>
    </section>
  {/snippet}
</FoundationPage>
