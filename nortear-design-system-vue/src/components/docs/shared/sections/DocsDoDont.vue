<script setup lang="ts">
import { Card } from '@/components/ui/card';

interface DocsDoDontPair {
  doLabel: string;
  dontLabel: string;
  doCaption: string;
  dontCaption: string;
  /**
   * Por que o par é assim — OPCIONAL, e rendido abaixo das duas colunas.
   *
   * A legenda de cada lado diz o QUE fazer; o motivo diz por quê, e vale para o
   * par inteiro. Repeti-lo nas duas legendas seria a mesma frase duas vezes.
   */
  reason?: string;
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
          class="nds-stack"
          data-spacing="sm"
        >
          <div
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
                class="nds-cluster nds-shadow-none nds-p-4"
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
                class="nds-cluster nds-shadow-none nds-p-4"
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
          <p
            v-if="pair.reason"
            class="nds-text-body nds-text-muted-foreground nds-px-1"
          >
            {{ pair.reason }}
          </p>
        </div>
      </div>
    </Card>
  </section>
</template>
