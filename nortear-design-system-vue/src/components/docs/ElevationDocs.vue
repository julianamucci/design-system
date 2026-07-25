<script setup lang="ts">
import FoundationsRenderer from '@/components/docs/shared/FoundationsRenderer.vue';
import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';
import { useTranslation } from '@/lib/i18n';

const { t } = useTranslation(translations);

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
              :key="el.label"
              class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-4 nds-text-caption nds-text-muted-foreground nds-text-center"
              :style="el.token ? { boxShadow: `var(${el.token})` } : undefined"
            >
              <div class="nds-font-medium nds-text-foreground nds-mb-1">{{ el.label }}</div>
              <code style="font-size: 10px">{{ el.token ?? '—' }}</code>
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
