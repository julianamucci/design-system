<script lang="ts">
/**
 * De onde veio o contexto já gasto.
 *
 * Desenho em `nds/medicao.css`, no bloco "Repartição do contexto por origem",
 * que também guarda as cinco decisões de acessibilidade. A CONTA — o total, o
 * peso de cada parcela e o por cento que se lê — vem de
 * `@shared/primitives/token-budget`; o dado vem de `ContextPart`, do mesmo
 * módulo.
 *
 * A PERGUNTA É OUTRA, E É O QUE SEPARA ESTA PEÇA DA IRMÃ. "Quanto ainda cabe"
 * precisa de um teto; "de onde veio" não precisa de teto nenhum, e é por isso
 * que aqui não existe `limit`, não existe nível e não existe o caso de teto
 * desconhecido. O DENOMINADOR É O TOTAL REPARTIDO: quem quer a outra pergunta
 * monta a outra peça, e as duas convivem na mesma tela sem discordar, porque
 * nenhuma responde pela outra.
 *
 * AS TRÊS DECISÕES QUE O PRIMITIVO GUARDA, e que nenhum `if` daqui refaz:
 *
 *   - A ORDEM É A DE QUEM MEDIU, nunca a do tamanho. A legenda se lê por
 *     posição, e uma parcela que sobe de lugar entre um turno e o seguinte faz
 *     comparar duas fotos diferentes achando que é a mesma.
 *   - A PARCELA ZERADA CONTINUA NA LISTA. Fatia e linha da legenda se
 *     emparelham por posição para dividirem a cor; sumir com a zerada faria a
 *     cor apontar para a fatia da vizinha — e continuaria parecendo certa.
 *   - O POR CENTO É TEXTO, com as duas travas: uma parcela de verdade não sai
 *     como 0%, e uma parcela que não é tudo não sai como 100%.
 *
 * E A DECISÃO QUE GOVERNA A FAMÍLIA INTEIRA: o que muda a cada quadro é
 * DECORATIVO, e o número é TEXTO. A barra é `aria-hidden`, não tem papel nem
 * valor, e não há `aria-live` em lugar nenhum — um contador que se reanuncia
 * torna a tela impossível de ouvir enquanto a resposta é gerada logo ao lado.
 *
 * O QUE O COMPONENTE NÃO FAZ: contar token, adivinhar de onde o contexto veio,
 * agrupar origens, esconder a legenda atrás de um clique. Ele recebe a
 * repartição e desenha — §2 da guideline 17.
 *
 * NÃO HÁ DIVERGÊNCIA DE API a registrar nesta peça, e vale dizer por quê: ela é
 * só leitura. Sem retorno para avisar, sem ação para oferecer, não há `emit` —
 * e é justamente o emit que costuma ser o ponto em que as cinco stacks deixam
 * de se parecer. As duas props têm o mesmo nome nas cinco.
 *
 * O vocabulário mora neste bloco, e não no índice da pasta, porque a peça é
 * autônoma: ela não entra na API de nenhuma outra, e quem a usa a importa por
 * inteiro — componente e tipos — de um lugar só.
 */

export interface ContextBreakdownLabels {
  /**
   * O que está sendo repartido.
   *
   * Aparece na tela, ao contrário do título da peça irmã: lá o número mora numa
   * linha cujo lugar já diz do que se trata, e aqui o que se vê é uma lista de
   * nomes e números que sem título não diz o que foi dividido.
   */
  title: string
  /** O que está sendo contado. */
  unit: string
  /**
   * A palavra de cada origem, por endereço.
   *
   * `Record` aberto, e não um `Record` de união fechada como o dos níveis da
   * peça irmã: quantas origens existem e como se chamam é conhecimento de quem
   * mediu, e não do design system — é a razão de `ContextPart.id` ser etiqueta
   * e não membro de tipo. Origem sem palavra aqui não some da lista: ela mostra
   * o próprio endereço, porque uma linha sem nome deixaria a cor sozinha
   * identificando a parcela.
   */
  parts: Record<string, string>
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { ContextPart } from '@shared/primitives/token-budget'
import { contextSlices, contextTotal } from '@shared/primitives/token-budget'

const props = defineProps<{
  /** A repartição, na ordem em que quem mediu a produziu. */
  parts: readonly ContextPart[]
  labels: ContextBreakdownLabels
}>()

// A CONTA SAI DO PRIMITIVO, e não de um `reduce` daqui: a ordem, a parcela
// zerada e as duas travas do por cento são a mesma resposta nas cinco stacks.
// Escritas aqui, uma delas ordenaria por peso "para ficar melhor".
const slices = computed(() => contextSlices(props.parts))
const total = computed(() => contextTotal(props.parts))

/** `25.000 tokens` — o mesmo formato no total e em cada parcela. */
function countText(tokens: number): string {
  return `${tokens.toLocaleString()} ${props.labels.unit}`
}

/**
 * A palavra da origem, ou o endereço dela.
 *
 * Sem palavra, o endereço é o que aparece: uma linha em branco deixaria a cor
 * sozinha dizendo de qual origem se trata (decisão 2 da folha, WCAG 1.4.1).
 */
function nameOf(id: string): string {
  return props.labels.parts[id] ?? id
}
</script>

<template>
  <!-- `<div>`, e não `<p>`: o corpo desta peça é uma lista, e lista não cabe
       dentro de parágrafo. Nenhum papel ARIA, nenhuma região viva (decisão 1 da
       folha). Não há atributo de estado, e a ausência é decisão: o que varia
       aqui é quantas parcelas chegaram e quanto cada uma pesa, e as duas coisas
       são desenho por posição, não por estado. -->
  <div
    class="nds-context-breakdown"
    data-slot="context-breakdown"
  >
    <!-- O TÍTULO É VISÍVEL (decisão 4), e o total ao lado dele é o denominador
         de tudo o que vem abaixo: sem ele os por cento não têm grandeza. -->
    <p
      class="nds-context-breakdown-headline"
      data-slot="context-breakdown-headline"
    >
      <span
        class="nds-context-breakdown-title"
        data-slot="context-breakdown-title"
      >{{ labels.title }}</span>
      <span
        class="nds-context-breakdown-total"
        data-slot="context-breakdown-total"
      >{{ countText(total) }}</span>
    </p>

    <!-- A BARRA É DECORATIVA (decisão 1 da folha), e sai inteira do que é lido
         em voz: a legenda abaixo já diz nome e número de cada parcela. Nenhum
         papel, nenhum `aria-valuenow` — um segundo portador dos mesmos números
         os faria ser lidos duas vezes, uma delas como controle. -->
    <span
      class="nds-context-breakdown-bar"
      data-slot="context-breakdown-bar"
      aria-hidden="true"
    >
      <!-- Uma fatia por parcela, SEMPRE — inclusive a que vale zero. É o que
           mantém a contagem desta lista igual à da legenda, e é dessa igualdade
           que sai o pareamento de cor por `:nth-child` que a folha declara. Uma
           fatia a menos não desapareceria da tela: ela deslocaria a cor de todas
           as seguintes.

           A chave é a POSIÇÃO de propósito: aqui a posição É a identidade, e é
           dela que a cor sai. Chavear pelo endereço quebraria no dia em que a
           medição trouxesse duas parcelas com o mesmo endereço, e a cor
           escorregaria de fatia sem que nada reprovasse.

           Valor de RUNTIME por custom property, como o medidor da peça irmã já
           faz. O que entra é o MESMO inteiro que a legenda mostra, e não a
           fração crua: uma fatia que discordasse do número ao lado seriam duas
           respostas para uma pergunta só. -->
      <span
        v-for="(slice, index) in slices"
        :key="index"
        class="nds-context-breakdown-slice"
        data-slot="context-breakdown-slice"
        :style="{ '--nds-context-share': String(slice.percent) }"
      />
    </span>

    <!-- A LEGENDA É UMA LISTA DE VERDADE (decisão 3): a contagem e a posição
         chegam a quem ouve, e é por posição que esta repartição pede para ser
         comparada de um turno para o seguinte. -->
    <ul
      class="nds-context-breakdown-legend"
      data-slot="context-breakdown-legend"
    >
      <li
        v-for="(slice, index) in slices"
        :key="index"
        class="nds-context-breakdown-part"
        data-slot="context-breakdown-part"
      >
        <!-- O ponto de cor é o par visual da fatia, e fica fora do que é lido
             pela mesma razão que ela: quem ouve recebe o nome e os dois
             números. -->
        <span
          class="nds-context-breakdown-swatch"
          data-slot="context-breakdown-swatch"
          aria-hidden="true"
        />

        <!-- CADA PARCELA TEM NOME E NÚMERO EM TEXTO (decisão 2, WCAG 1.4.1).
             Sem palavra para o endereço, o endereço é o que aparece. -->
        <span
          class="nds-context-breakdown-name"
          data-slot="context-breakdown-name"
        >{{ nameOf(slice.id) }}</span>
        <span
          class="nds-context-breakdown-tokens"
          data-slot="context-breakdown-tokens"
        >{{ countText(slice.tokens) }}</span>
        <span
          class="nds-context-breakdown-percent"
          data-slot="context-breakdown-percent"
        >{{ slice.percent }}%</span>
      </li>
    </ul>
  </div>
</template>
