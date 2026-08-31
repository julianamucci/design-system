<script lang="ts">
/**
 * Quanto uma execução custou, em dinheiro.
 *
 * Desenho em `nds/medicao.css`, no bloco "Custo de uma execução", que também
 * guarda as seis decisões de acessibilidade. A CONTA — o por cento que se lê, o
 * limiar e o nível — vem de `@shared/primitives/token-budget`, e é a MESMA que
 * a peça da janela de contexto lê: se as duas aparecem lado a lado usando a
 * palavra "perto do teto", ela precisa querer dizer a mesma coisa nas duas.
 *
 * A DECISÃO QUE SÓ ESTA PEÇA TEM: O DINHEIRO CHEGA ESCRITO. A quantia entra
 * como texto — "US$ 0,42" —, nunca como número com uma moeda ao lado. É o
 * precedente que o tempo decorrido do ditado, o relógio do estado da execução e
 * o carimbo da faixa de rascunho já fixaram, e aqui ele vale com mais força:
 * duração tem separador e ordem; moeda tem símbolo, POSIÇÃO do símbolo,
 * separador de milhar, separador decimal e número de casas — e os cinco variam
 * por idioma E por moeda. A mesma quantia se escreve `US$ 0,84`, `$0.84` ou
 * `0,84 US$` conforme quem lê, e o símbolo troca de ponta entre um idioma e
 * outro. Quem sabe disso é quem escolheu a moeda, e não um componente que
 * decidiria idioma em cinco stacks.
 *
 * O QUE ATRAVESSA A CONTA É A FRAÇÃO, e não a quantia: a razão entre o gasto e
 * o teto é número puro, sem moeda e sem idioma. Por isso o teto chega como um
 * par — a quantia ESCRITA e a fração JÁ CALCULADA (`spentFraction`) —, e não
 * como dois números que a peça dividiria: um par de números ao lado das duas
 * cadeias seriam dois portadores do mesmo fato, e dois portadores discordam.
 *
 * SEM TETO NÃO HÁ FRAÇÃO, SÓ A QUANTIA. Custo sem orçamento declarado é o caso
 * comum, e a peça o desenha: sem o teto não há medidor, não há nível e o
 * detalhe passa a dizer que não há teto — porque um trilho vazio lê como "não
 * gastou nada", que é o oposto do que se sabe.
 *
 * E A DECISÃO QUE GOVERNA A FAMÍLIA INTEIRA: o que muda a cada quadro é
 * DECORATIVO, e o número é TEXTO. O medidor não tem papel ARIA nem valor, não
 * há `aria-live` em lugar nenhum, e nada aqui se reanuncia — um contador que se
 * reanuncia torna a tela impossível de ouvir enquanto a resposta é gerada logo
 * ao lado.
 *
 * O QUE O COMPONENTE NÃO FAZ: buscar preço, calcular tarifa, converter moeda,
 * formatar dinheiro, decidir o que fazer quando o orçamento acaba. Ele recebe o
 * que custou e desenha — §2 da guideline 17.
 *
 * NÃO HÁ DIVERGÊNCIA DE API a registrar nesta peça, e vale dizer por quê: ela é
 * só leitura. Sem retorno para avisar, sem ação para oferecer, não há `emit` —
 * e é justamente o emit que costuma ser o ponto em que as cinco stacks deixam
 * de se parecer. As três props têm o mesmo nome nas cinco.
 *
 * O vocabulário mora neste bloco, e não no índice da pasta, porque a peça é
 * autônoma: ela não entra na API de nenhuma outra, e quem a usa a importa por
 * inteiro — componente e tipos — de um lugar só.
 */
import type { BudgetLevel } from '@shared/primitives/token-budget'

/**
 * O teto de gasto, quando há um declarado.
 *
 * Os dois lados andam juntos de propósito, num objeto só: quem tem teto tem a
 * quantia dele E a fração já gasta, e quem não tem não tem nenhuma das duas.
 * Como duas propriedades soltas, existiria o estado meio declarado — teto
 * escrito sem fração desenha uma frase sem medidor, fração sem teto escrito
 * desenha um medidor que ninguém sabe de quê —, e nenhum dos dois é uma peça
 * que alguém queira montar.
 */
export interface CostBudget {
  /**
   * O teto, JÁ ESCRITO.
   *
   * Mesma decisão da quantia gasta, e o mesmo motivo: a moeda é de quem mediu.
   */
  amount: string
  /**
   * Quanto do teto já foi gasto, de 0 a 1.
   *
   * Número puro: não tem moeda nem idioma, e é justamente por isso que é ele
   * que entra na conta. Sai de `spentFraction`, do primitivo compartilhado, que
   * é quem guarda o recorte em uma volta e a resposta de que sem teto não há
   * fração nenhuma.
   */
  fraction: number
}

export interface CostMeterLabels {
  /**
   * De que número se trata.
   *
   * "US$ 0,42" sozinho não diz de quê — nem de qual execução, nem se é do turno
   * ou da conversa inteira. O título não aparece na tela, porque quem vê já
   * sabe pelo lugar em que a peça está; quem ouve não sabe.
   */
  title: string
  /**
   * A palavra de cada nível.
   *
   * É ela que descreve, e não a cor do medidor: cor sozinha não descreve estado
   * (WCAG 1.4.1). `Record` completo de propósito — nível novo no primitivo
   * compartilhado reprova a compilação aqui, em vez de desenhar uma etiqueta em
   * branco que ninguém repara.
   */
  level: Record<BudgetLevel, string>
  /** Liga a fração ao teto: oitenta e quatro por cento DE cinquenta centavos. */
  of: string
  /**
   * Quando não há teto declarado.
   *
   * Sem esta palavra o caso sem teto pareceria uma medição incompleta. Com ela,
   * a ausência de fração vira informação: o que se sabe é quanto custou, e não
   * quanto ainda pode custar.
   */
  unbounded: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import { fractionLevel, fractionPercent } from '@shared/primitives/token-budget'

const props = defineProps<{
  /**
   * O que já custou, JÁ ESCRITO.
   *
   * Não há rótulo de unidade nesta peça, ao contrário das duas irmãs: a moeda
   * já está dentro desta cadeia, e um rótulo à parte seria uma segunda chance
   * de discordar dela.
   */
  amount: string
  /** O teto declarado. Ausente quando não há — e aí não há fração, só a quantia. */
  budget?: CostBudget
  labels: CostMeterLabels
}>()

/**
 * A cor de reforço de cada nível, em tabela.
 *
 * Tabela em vez de cadeia de ternários, pelo mesmo motivo do `badge`: com a
 * tabela não há ramo para cobrir nem ramo inalcançável a ignorar. A ETIQUETA é
 * quem carrega a palavra; a cor dela é reforço, e é curta o bastante para o
 * limiar de 3:1.
 *
 * Os mesmos três valores da peça da janela de contexto, e isso é o eixo da
 * família: mesmo limiar, mesma palavra, mesma cor. Uma tabela diferente aqui
 * faria duas medições da mesma tela discordarem sobre o que é aviso.
 */
const LEVEL_VARIANT: Record<BudgetLevel, BadgeVariants['variant']> = {
  normal: 'default',
  warning: 'warning',
  critical: 'destructive',
}

// A CONTA SAI DO PRIMITIVO, e não de um arredondamento daqui: as duas travas do
// número que se lê em voz — um gasto de verdade não sai como 0%, e um gasto que
// não é tudo não sai como 100% — e o limiar de cada nível são a mesma resposta
// nas cinco stacks. Escritas aqui, uma delas arredondaria para cima e diria
// "100%" com espaço sobrando.
//
// SEM TETO NÃO HÁ FRAÇÃO (decisão 5): sem `budget` não há por cento e não há
// nível, e é essa ausência que apaga o medidor e a etiqueta da árvore.
const percent = computed(() =>
  props.budget ? fractionPercent(props.budget.fraction) : null,
)
const level = computed(() =>
  props.budget ? fractionLevel(props.budget.fraction) : null,
)

/**
 * O inteiro que o medidor recebe — o MESMO que o detalhe mostra.
 *
 * Uma barra cheia ao lado de "99%" seriam duas respostas para uma pergunta só.
 * Sem teto o medidor não chega a ser montado, e o zero daqui nunca alcança a
 * tela.
 */
const meterValue = computed(() => String(percent.value ?? 0))

/**
 * O DETALHE MANTÉM A FRAÇÃO EM TEXTO, e não é adorno: é ele que permite à barra
 * ser só desenho. Se o por cento saísse da tela, a barra viraria a única
 * portadora da fração e passaria a dever 3:1 entre a parte cheia e a vazia —
 * que é exatamente a diferença entre este medidor e uma barra de progresso.
 *
 * Sem teto, a ausência vira informação em vez de parecer medição pela metade.
 */
const detailText = computed(() =>
  props.budget && percent.value !== null
    ? `${percent.value}% ${props.labels.of} ${props.budget.amount}`
    : props.labels.unbounded,
)
</script>

<template>
  <!-- `<p>`, e não `<div>`: é uma frase sobre uma quantia, e a etiqueta de nível
       é conteúdo de frase. Nenhum papel ARIA, nenhuma região viva (decisão 1).

       Sem teto não há nível, e o atributo fica FORA — em vez de sair como uma
       palavra vazia que a folha ainda tentaria colorir. -->
  <p
    class="nds-cost-meter"
    data-slot="cost-meter"
    :data-level="level ?? undefined"
  >
    <!-- O NÚMERO TEM NOME (decisão 4). Ele não aparece na tela: quem vê já sabe
         do que se trata pelo lugar em que a peça está, e quem ouve não sabe. -->
    <span
      class="nds-sr-only"
      data-slot="cost-meter-title"
    >{{ labels.title }}</span>

    <!-- A QUANTIA É SEMPRE A QUANTIA (decisão 6). Ao contrário da peça da
         janela, o valor não troca de significado entre os dois casos: dinheiro
         é dinheiro com teto e sem teto, e o que aparece e some é o que o
         QUALIFICA. Ela sai daqui exatamente como chegou — a peça nunca escolhe
         símbolo, separador nem casas decimais. -->
    <span
      class="nds-cost-meter-amount"
      data-slot="cost-meter-amount"
    >{{ amount }}</span>

    <span
      class="nds-cost-meter-detail"
      data-slot="cost-meter-detail"
    >{{ detailText }}</span>

    <!-- O NÍVEL É PALAVRA (decisão 3), e a cor acompanha em vez de substituir.
         Ele aparece SEMPRE que há teto, inclusive com folga: uma peça que só
         falasse quando a notícia é ruim deixaria a boa notícia indistinguível
         de uma medição que não chegou.

         É o `Badge` de propósito — a folha da família não declara desenho
         próprio para a etiqueta, só o alinhamento. A classe anda junto do
         `data-slot`, e o `data-slot` é sobrescrito para a peça se achar no
         documento. -->
    <Badge
      v-if="level"
      class="nds-cost-meter-level"
      data-slot="cost-meter-level"
      :variant="LEVEL_VARIANT[level]"
    >{{ labels.level[level] }}</Badge>

    <!-- O MEDIDOR VEM POR ÚLTIMO NO DOM, e a folha o joga para a segunda linha
         com uma declaração só. Ele é `aria-hidden`, então a ordem de leitura
         não muda.

         O MEDIDOR É DECORATIVO (decisão 1) e sai inteiro do que é lido em voz:
         o por cento ao lado já diz o mesmo, e repeti-lo em desenho não
         acrescenta nada a quem ouve. Nenhum papel, nenhum `aria-valuenow` — um
         segundo portador do mesmo número o faria ser lido duas vezes, uma delas
         como controle (decisão 2).

         Custom property, e não largura em `style`: o valor é dado de runtime, e
         a folha é quem decide como ele vira desenho. A propriedade fica no
         TRILHO, e não no preenchimento — ela herda, então o preenchimento a lê
         de graça, e o número mora sempre no mesmo elemento. -->
    <span
      v-if="percent !== null"
      class="nds-cost-meter-bar"
      data-slot="cost-meter-meter"
      aria-hidden="true"
      :style="{ '--nds-cost-spent': meterValue }"
    >
      <span class="nds-cost-meter-bar-fill" />
    </span>
  </p>
</template>
