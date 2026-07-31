<script setup lang="ts">
import { computed, useSlots } from 'vue';
import DocsVariants from './DocsVariants.vue';

interface DocsCompositionItem {
  name: string;
  description: string;
  /** Situação de uso recomendada — renderizada após "Quando usar:" abaixo da descrição. */
  useWhen?: string;
  code?: string;
}

/**
 * Seção "Composições" — combinações canônicas do componente
 * (ícone + label, par de ações, icon-only, etc.).
 *
 * Por baixo usa DocsVariants — layout idêntico ao de Variantes/Tamanhos.
 * Previews dos itens são passados via slots `variant-preview-{i}` (mesmo
 * padrão do DocsVariants).
 */
const props = withDefaults(defineProps<{
  title: string;
  items: DocsCompositionItem[];
  /** Label da linha "Quando usar:" (i18n, ex: tNav('common.useWhen')). */
  useWhenLabel?: string;
  /** Slug do componente para tracking GA4 dos toggles de código. */
  componentSlug?: string;
  /**
   * Parágrafo de introdução da seção. Declarado explicitamente porque o
   * fallthrough de atributos entregaria a `note` ao DocsVariants por acidente:
   * bastaria um `inheritAttrs: false` ou um segundo nó raiz aqui para o texto
   * sumir da página sem erro nenhum. As outras 3 stacks declaram.
   */
  note?: string;
  /** Id da seção. Default: 'composicoes'. */
  id?: string;
}>(), {
  useWhenLabel: 'Quando usar:',
  id: 'composicoes',
});

const variantItems = computed(() =>
  props.items.map(item => {
    if (!item.useWhen) return item;
    return {
      ...item,
      description:
        `${item.description}<br><br><strong>${props.useWhenLabel}</strong> ${item.useWhen}`,
    };
  }),
);

const slots = useSlots();
</script>

<template>
  <DocsVariants
    :id="props.id"
    :title="props.title"
    :note="props.note"
    :items="variantItems"
    :component-slug="props.componentSlug"
  >
    <template
      v-for="(_, slotName) in slots"
      :key="slotName"
      #[slotName]
    >
      <slot :name="slotName" />
    </template>
  </DocsVariants>
</template>
