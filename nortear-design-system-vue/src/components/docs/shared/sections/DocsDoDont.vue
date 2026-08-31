<script setup lang="ts">
import { Card } from '@/components/ui/card';

/**
 * Um par tem DUAS legendas, e nada além delas.
 *
 * Em 2026-08-27 acrescentei aqui um `reason` opcional por par, porque o
 * conteúdo do editor trazia `doDont.pairN.reason` e só ele. Quatro dev-agents
 * mexeram nos containers em paralelo, sem se ver, e o diagnóstico é o mesmo dos
 * outros três: o desvio estava no CONTEÚDO, não na leitura de cada um. Um campo
 * que uma página só preenche vira terceiro parágrafo fantasma em todas as
 * outras. Corrigido o conteúdo (`f5f2ef555`), o motivo foi DOBRADO no texto de
 * cada lado — que é onde ele já morava nas 66 páginas — e a chave saiu.
 */
interface DocsDoDontPair {
  doLabel: string;
  dontLabel: string;
  doCaption: string;
  dontCaption: string;
}

defineProps<{
  title: string;
  pairs: DocsDoDontPair[];
}>();
</script>

<template>
  <section id="do-dont">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <Card class="nds-cluster nds-p-4 nds-mt-2">
      <div
        class="nds-stack nds-w-full"
        data-spacing="xl"
      >
        <div
          v-for="(pair, index) in pairs"
          :key="index"
          class="nds-grid"
          data-cols="2"
          data-spacing="lg"
        >
          <!-- DO -->
          <div
            class="nds-stack"
            data-spacing="sm"
          >
            <div
              class="nds-cluster nds-text-success"
              data-spacing="sm"
            >
              <span
                class="nds-pill"
                data-tone="success"
              >✓</span>
              <span class="nds-text-body nds-font-semibold nds-uppercase nds-tracking-wider">{{ pair.doLabel }}</span>
            </div>
            <!-- `nds-cluster` + `data-justify` é o mesmo par que centraliza o
                 preview em DocsVariants e em ComponentDemo. Sem ele o Card herda
                 a coluna do `.nds-card` e encosta tudo à esquerda — visível em
                 qualquer componente de largura própria. -->
            <Card
              class="nds-cluster nds-shadow-none nds-p-4 nds-card-nested"
              data-justify="center"
              data-docs-preview="do"
            >
              <slot :name="`do-preview-${index}`" />
            </Card>
            <p class="nds-text-body nds-italic nds-px-1">
              {{ pair.doCaption }}
            </p>
          </div>
          <!-- DON'T -->
          <div
            class="nds-stack"
            data-spacing="sm"
          >
            <div
              class="nds-cluster nds-text-destructive"
              data-spacing="sm"
            >
              <span
                class="nds-pill"
                data-tone="destructive"
              >✗</span>
              <span class="nds-text-body nds-font-semibold nds-uppercase nds-tracking-wider">{{ pair.dontLabel }}</span>
            </div>
            <Card
              class="nds-cluster nds-shadow-none nds-p-4 nds-card-nested"
              data-justify="center"
              data-docs-preview="dont"
            >
              <slot :name="`dont-preview-${index}`" />
            </Card>
            <p class="nds-text-body nds-italic nds-px-1">
              {{ pair.dontCaption }}
            </p>
          </div>
        </div>
      </div>
    </Card>
  </section>
</template>
