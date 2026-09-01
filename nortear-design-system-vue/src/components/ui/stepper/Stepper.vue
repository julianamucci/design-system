<script setup lang="ts">
import { computed, provide, type HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import { STEPPER_KEY, type StepperLabels } from './stepper.context';

// ─── Stepper — Vue puro, sem lib headless ───────────────────────────────────
//
// Visual: classes .nds-stepper-* de `docs/shared/styles/nds/stepper.css`.
//
// A FOLHA É O CONTRATO, e é dela que esta implementação sai. Ela declara, no
// próprio docblock, `<ol class="nds-stepper">` com `<li class="nds-stepper-item">`,
// o estado em `data-state` (active/completed/inactive) e a indisponibilidade em
// `data-disabled` no item. O `<button class="nds-stepper-trigger">` com
// `cursor: pointer` e anel de `:focus-visible` diz, sem ambiguidade, que a etapa
// é um CONTROLE.
//
// A lib headless desta stack não chegava a esse DOM, e o desvio não se resolvia
// por prop: a raiz dela injeta uma região viva fixa com texto em inglês, crava
// `role="group"` com `aria-label="progress"` e marca a etapa atual com
// `aria-current="true"` em vez de `step`. Por isso aqui não há lib — o DOM é o
// do Vanilla, que é a referência do repositório.
//
// ─── Decisões de acessibilidade, escritas porque são a parte difícil ────────
//
// 1. A RAIZ É LISTA ORDENADA. A ordem e a contagem das etapas são o conteúdo,
//    não decoração: `<ol>` as anuncia sozinho ("lista, 4 itens, item 2") e
//    poupa texto inventado. Um `<div role="group">` com rótulo diria menos e
//    custaria mais.
//
// 2. A ETAPA ATUAL LEVA `aria-current="step"`, e não `aria-current="true"`.
//    `step` é o token que a WAI-ARIA define para posição num processo; `true`
//    é o genérico, e diz "este é o atual" sem dizer atual do quê. É a mesma
//    escolha que `pagination` já faz nesta casa com `page`.
//
// 3. ESTADO NÃO DEPENDE SÓ DE COR (WCAG 1.4.1), e por dois caminhos ao mesmo
//    tempo, porque um só não cobre todo mundo:
//      • visual — a etapa concluída troca o NÚMERO por uma marca de
//        verificação. É forma, não matiz, e sobrevive a daltonismo e a tela
//        monocromática.
//      • programático — `labels.completed` e `labels.current` viram uma
//        palavra `.nds-sr-only` dentro do gatilho. Quem não vê a marca ouve
//        "Etapa concluída".
//    Os rótulos moram na RAIZ, e não no gatilho, porque o estado de uma etapa
//    MUDA quando o fluxo avança: uma palavra fixa por gatilho estaria errada
//    no passo seguinte.
//
// 4. INDICADOR E TRAÇO SÃO DESENHO, e levam `aria-hidden="true"`. O número do
//    indicador repete a posição que a lista já anuncia, e ler os dois faz o
//    leitor de tela dizer a mesma coisa duas vezes.
//
// 5. NÃO HÁ REGIÃO VIVA. Um indicador que se reanuncia a cada avanço atropela
//    a leitura do resto da tela. Quem anuncia o avanço é o painel que trocou
//    de conteúdo, e é para ele que a aplicação move o foco.
//
// 6. ETAPA INDISPONÍVEL É `disabled` DE VERDADE, e sai da ordem de tabulação.
//    Um botão focável que não leva a lugar nenhum é uma parada de foco que
//    gasta o tempo de quem navega por teclado sem entregar nada.
//
// 7. SEM ALTURA FIXA EM TEXTO (WCAG 1.4.4). O círculo do indicador tem
//    dimensão fixa de propósito — mas RELATIVA: `--spacing-8` é
//    `calc(var(--spacing-base) * 8)` com `--spacing-base: 0.25rem`, então o
//    círculo cresce com a densidade e com o tamanho de fonte do navegador.
//    Título e descrição vivem FORA dele e nunca são recortados.
//
// 8. O GATILHO É SEMPRE `<button>`, NAS CINCO STACKS — e a folha é quem
//    decide. Ela declara UMA forma de gatilho, e essa forma é a de um
//    controle: `cursor: pointer`, `border: 0`, fundo transparente e um anel de
//    `:focus-visible` (que só faz sentido em quem recebe foco), mais
//    `pointer-events: none` no item indisponível — regra que só existe para
//    quem recebe ponteiro. Não há na folha uma segunda forma, inerte.
//
//    O CUSTO DISSO, dito na cara: um Stepper sem ouvinte de `step-select`
//    rende N paradas de tabulação que não levam a lugar nenhum. Por isso a
//    ausência do ouvinte está documentada como defeito de uso, e não como modo
//    suportado: ou se liga a seleção, ou se marcam as etapas como
//    indisponíveis.
//
//    O QUE NÃO ESTÁ DECIDIDO, e é da dona: se o design system deve passar a
//    oferecer um indicador de etapas SOMENTE-LEITURA, sem controle nenhum.
//    Isso pede uma segunda forma declarada em `stepper.css`, e inventar aqui
//    uma classe que a folha não tem seria justamente crayonizar o valor.
//    Enquanto essa forma não existir, um indicador não navegável não é este
//    componente.
//
// O nome acessível do fluxo chega por `aria-label` e cai no `<ol>` pelo
// repasse de atributos — é atributo de HTML, e declará-lo como prop só o
// tiraria do elemento para devolvê-lo na linha seguinte.

const props = withDefaults(defineProps<{
  /** Número da etapa atual, contando de 1. É dele que cada etapa deriva o próprio estado. */
  value?: number;
  /** Palavras de estado só para leitor de tela — `completed` e `current`. */
  labels?: StepperLabels;
  class?: HTMLAttributes['class'];
}>(), {
  value: 1,
});

const emit = defineEmits<{
  /** Emitido com o número da etapa quando um gatilho disponível é acionado. */
  'step-select': [step: number];
}>();

provide(STEPPER_KEY, {
  value: computed(() => props.value),
  labels: computed(() => props.labels ?? {}),
  select: (step: number) => emit('step-select', step),
});
</script>

<template>
  <ol
    data-slot="stepper"
    :data-value="value"
    :class="cn('nds-stepper', props.class)"
  >
    <slot />
  </ol>
</template>
