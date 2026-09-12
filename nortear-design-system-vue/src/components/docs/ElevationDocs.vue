<script setup lang="ts">
import FoundationsRenderer from '@/components/docs/shared/FoundationsRenderer.vue';
import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';
import { useTranslation } from '@/lib/i18n';
import { computed } from 'vue';

// Locale sempre de `useTranslation()` — nunca de Pinia/useLocaleStore.
const { t, locale } = useTranslation(translations);

/**
 * A escada de elevação do mostruário é DERIVADA de `elevation.rows` do conteúdo
 * compartilhado — nunca recravada aqui. A lista cravada tinha quatro degraus e o
 * conteúdo passou a seis em 2026-09-12 (entrou `--elevation-xs`, relevo de
 * controle): a tabela mostrava o degrau novo e o mostruário não, e a página se
 * contradizia. Ordem, rótulo e token saem todos da mesma fonte.
 *
 * O `token` do nível plano é o travessão (`—`) no conteúdo; aqui ele vira
 * `null`, que é o que distingue "sem sombra" de "sombra deste token".
 */
interface ElevationStep {
  /** Chave da linha no conteúdo — `plano`, `controle`, `card`, … */
  key: string;
  /** Rótulo traduzido (`elevation.rows.<key>.level`). */
  label: string;
  /** Custom property da sombra, ou `null` no nível plano. */
  token: string | null;
}

/** Classe utilitária que pinta o degrau: `--elevation-md` → `.nds-shadow-md`. */
function shadowClass(token: string | null): string {
  return token ? `nds-shadow-${token.replace('--elevation-', '')}` : 'nds-shadow-none';
}

// A ORDEM e o conjunto de degraus vêm das chaves do dicionário; os textos vêm
// do `t()`, que já resolve locale e overrides.
const ELEVATIONS = computed<ElevationStep[]>(() => {
  const dict = translations as Record<string, { elevation?: { rows?: Record<string, unknown> } }>;
  const rowKeys = Object.keys((dict[locale.value] ?? dict['pt-BR'])?.elevation?.rows ?? {});
  return rowKeys.map((key) => {
    const token = t(`elevation.rows.${key}.token`);
    return {
      key,
      label: t(`elevation.rows.${key}.level`),
      token: token && token !== '—' ? token : null,
    };
  });
});

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

<template>
  <FoundationsRenderer
    component-slug="foundations/elevacao-bordas-sombras"
    :translations="translations"
  >
    <template #extra>
      <section
        class="nds-stack nds-docs-section-divider"
        data-spacing="md"
      >
        <div
          class="nds-stack"
          data-spacing="xs"
        >
          <h2 class="nds-text-h2 nds-text-foreground">{{ t('specimens.title') }}</h2>
          <p class="nds-text-body">{{ t('specimens.subtitle') }}</p>
        </div>

        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.shadows') }}</h3>
          <div
            class="nds-grid nds-p-6 nds-rounded-lg"
            data-spacing="lg"
            :style="{ '--grid-min': '8rem', backgroundColor: 'hsl(var(--muted) / 0.2)' }"
          >
            <div
              v-for="el in ELEVATIONS"
              :key="el.key"
              class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-4 nds-text-caption nds-text-muted-foreground nds-text-center"
              :class="shadowClass(el.token)"
            >
              <div class="nds-font-medium nds-text-foreground nds-mb-1">{{ el.label }}</div>
              <code class="nds-text-code">{{ el.token ?? '—' }}</code>
            </div>
          </div>
        </div>

        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.radius') }}</h3>
          <div
            class="nds-grid"
            data-spacing="md"
            :style="{ '--grid-min': '8rem' }"
          >
            <div
              v-for="r in RADII"
              :key="r.label"
              class="nds-bg-primary-soft nds-border-primary-soft nds-p-6 nds-text-caption nds-text-muted-foreground nds-text-center"
              :class="r.token ? '' : 'nds-rounded-full'"
              :style="r.token ? { borderRadius: `var(${r.token})` } : undefined"
            >
              <code>{{ r.token ?? '.nds-rounded-full' }}</code>
            </div>
          </div>
        </div>

        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.nested') }}</h3>
          <div
            class="nds-grid"
            data-spacing="md"
            :style="{ '--grid-min': '12rem' }"
          >
            <!-- Rᵢ = Rₑ − E: 14 → 10 → 6 com inset p-1 (4px) em cada nível -->
            <div
              class="nds-stack"
              data-spacing="xs"
            >
              <div
                class="nds-bg-primary-soft nds-p-1"
                style="border-radius: var(--radius-xl)"
              >
                <div
                  class="nds-bg-card nds-p-1"
                  style="border-radius: var(--radius)"
                >
                  <div
                    class="nds-bg-primary-soft nds-p-6"
                    style="border-radius: var(--radius-sm)"
                  />
                </div>
              </div>
              <span class="nds-text-caption nds-text-muted-foreground">{{ t('specimens.nestedOk') }}</span>
            </div>
            <!-- Errado: mesmo raio em todos os níveis -->
            <div
              class="nds-stack"
              data-spacing="xs"
            >
              <div
                class="nds-bg-primary-soft nds-p-1"
                style="border-radius: var(--radius-xl)"
              >
                <div
                  class="nds-bg-card nds-p-1"
                  style="border-radius: var(--radius-xl)"
                >
                  <div
                    class="nds-bg-primary-soft nds-p-6"
                    style="border-radius: var(--radius-xl)"
                  />
                </div>
              </div>
              <span class="nds-text-caption nds-text-muted-foreground">{{ t('specimens.nestedBad') }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>
  </FoundationsRenderer>
</template>
