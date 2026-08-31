<script lang="ts">
/**
 * Quanto da janela de contexto já foi usada.
 *
 * Desenho em `nds/medicao.css`, no bloco "Uso da janela de contexto", que
 * também guarda as cinco decisões de acessibilidade. A CONTA — fração, limiar
 * de aviso, nível — vem de `@shared/primitives/token-budget`; o dado vem de
 * `TokenUsage`, em `@shared/primitives/chat-protocol`.
 *
 * É A PEÇA QUE DÁ NOME AO EIXO DA FAMÍLIA 5: o mesmo número em formas
 * diferentes. Anel, barra e texto desenham a MESMA medição, e a forma é
 * escolha de espaço, não de significado — quem troca de forma não troca de
 * informação.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: o que muda a cada quadro é DECORATIVO, e o
 * número é TEXTO. O medidor não tem papel ARIA nem valor, não há `aria-live` em
 * lugar nenhum, e nada aqui se reanuncia — um contador que se reanuncia torna a
 * tela impossível de ouvir. É a mesma decisão do contador do campo de mensagem,
 * do relógio do reprodutor de mídia e do medidor de voz.
 *
 * SEM TETO NÃO HÁ FRAÇÃO, SÓ CONTAGEM. O `limit` é opcional no vocabulário
 * porque nem sempre se sabe qual é, e a peça desenha os dois casos: com teto
 * mostra a fração e o nível; sem teto mostra a contagem e diz que não há teto
 * conhecido — e NÃO desenha medidor nenhum, porque um anel vazio lê como zero
 * por cento, que é o oposto de "não se sabe quanto cabe".
 *
 * O QUE O COMPONENTE NÃO FAZ: buscar consumo, contar token, formatar duração,
 * decidir o que fazer quando a janela enche. Ele recebe a medição e desenha —
 * §2 da guideline 17.
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
 * A forma com que o mesmo número se apresenta.
 *
 * `ring` cabe num trilho estreito ao lado de outros controles; `bar` toma a
 * largura e serve a um painel; `text` some com o desenho e fica só com o
 * número, para quando o espaço é uma linha de rodapé. Nenhuma das três muda o
 * que é dito, nem o que é lido em voz.
 */
export type ContextDisplayForm = 'ring' | 'bar' | 'text'

/** Na ordem do mais compacto para o mais nu. */
export const CONTEXT_DISPLAY_FORMS: readonly ContextDisplayForm[] = [
  'ring',
  'bar',
  'text',
] as const

export interface ContextDisplayLabels {
  /**
   * De que número se trata.
   *
   * "62%" sozinho não diz de quê. O título não aparece na tela — o desenho já
   * dá o contexto a quem vê — e é o que responde a pergunta para quem ouve.
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
  /** Liga o consumido ao teto: dezenove mil DE trinta e dois mil. */
  of: string
  /** O que está sendo contado. */
  unit: string
  /**
   * Quando não se sabe o teto.
   *
   * Sem esta palavra o caso sem teto pareceria uma medição incompleta. Com ela,
   * a ausência de fração vira informação: o número é uma contagem, e não uma
   * fração que ficou pela metade.
   */
  unbounded: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import type { TokenUsage } from '@shared/primitives/chat-protocol'
import { budgetLevel, usedPercent, usedTokens } from '@shared/primitives/token-budget'

const props = withDefaults(
  defineProps<{
    /** A medição. Quem conta é quem sabe, e é quem passa. */
    usage: TokenUsage
    /** Como desenhar o mesmo número. */
    form?: ContextDisplayForm
    labels: ContextDisplayLabels
  }>(),
  { form: 'ring' },
)

/**
 * A cor de reforço de cada nível, em tabela.
 *
 * Tabela em vez de cadeia de ternários, pelo mesmo motivo do `badge`: com a
 * tabela não há ramo para cobrir nem ramo inalcançável a ignorar. A ETIQUETA é
 * quem carrega a palavra; a cor dela é reforço, e é curta o bastante para o
 * limiar de 3:1.
 */
const LEVEL_VARIANT: Record<BudgetLevel, BadgeVariants['variant']> = {
  normal: 'default',
  warning: 'warning',
  critical: 'destructive',
}

// A CONTA SAI DO PRIMITIVO, e não de um `if` daqui: `null` é a resposta de que
// não há teto, e é a mesma resposta nas cinco stacks. Escrita aqui, uma delas
// trataria teto zero como teto e desenharia uma fração infinita.
const percent = computed(() => usedPercent(props.usage))
const level = computed(() => budgetLevel(props.usage))
const used = computed(() => usedTokens(props.usage))

/**
 * O inteiro que o medidor recebe — o MESMO que o texto mostra.
 *
 * Um medidor contínuo ao lado de um número travado seriam duas respostas para
 * uma pergunta só. Sem teto o medidor não chega a ser montado, e o zero daqui
 * nunca alcança a tela.
 */
const meterValue = computed(() => String(percent.value ?? 0))

/**
 * O VALOR é sempre o maior número disponível: a fração quando há teto, a
 * contagem quando não há. O que muda entre os dois casos é o que se pode dizer,
 * e não o lugar onde se diz.
 */
const valueText = computed(() =>
  percent.value === null
    ? `${used.value.toLocaleString()} ${props.labels.unit}`
    : `${percent.value}%`,
)

/**
 * E O DETALHE é sempre o que qualifica o valor: o teto quando ele existe, e a
 * notícia de que não existe quando não existe.
 */
const detailText = computed(() =>
  percent.value === null
    ? props.labels.unbounded
    : `${used.value.toLocaleString()} ${props.labels.of} ${props.usage.limit!.toLocaleString()} ${props.labels.unit}`,
)
</script>

<template>
  <!-- `<p>`, e não `<div>`: é uma frase sobre uma medição, e a etiqueta de nível
       é conteúdo de frase. Nenhum papel ARIA, nenhuma região viva (decisão 1 da
       folha).

       Sem teto não há nível, e o atributo fica FORA — em vez de sair como uma
       palavra vazia que a folha ainda tentaria colorir. -->
  <p
    class="nds-context-display"
    data-slot="context-display"
    :data-form="form"
    :data-level="level ?? undefined"
  >
    <!-- O NÚMERO TEM NOME (decisão 4). Ele não aparece na tela: quem vê já sabe
         do que se trata pelo lugar em que a peça está, e quem ouve não sabe. -->
    <span
      class="nds-sr-only"
      data-slot="context-display-title"
    >{{ labels.title }}</span>

    <!-- SEM TETO NÃO SE DESENHA MEDIDOR (decisão 5).

         O MEDIDOR É DECORATIVO (decisão 1) e sai inteiro do que é lido em voz:
         o número ao lado já diz tudo, e repeti-lo em desenho não acrescenta
         nada a quem ouve. Nenhum papel, nenhum `aria-valuenow` — um segundo
         portador do mesmo número o faria ser lido duas vezes (decisão 2). -->
    <template v-if="percent !== null">
      <!-- Custom property, e não largura em `style`: o valor é dado de runtime,
           e a folha é quem decide como ele vira desenho. Mesma mecânica do
           progresso do anexo. -->
      <span
        v-if="form === 'ring'"
        class="nds-context-display-ring"
        data-slot="context-display-meter"
        aria-hidden="true"
        :style="{ '--nds-context-used': meterValue }"
      />

      <!-- A propriedade fica no TRILHO, e não no preenchimento — custom
           property herda, e o preenchimento a lê de graça. Com ela nas duas
           formas presa ao mesmo elemento, quem lê o desenho não precisa saber
           qual forma está montada para achá-la. -->
      <span
        v-else-if="form === 'bar'"
        class="nds-context-display-bar"
        data-slot="context-display-meter"
        aria-hidden="true"
        :style="{ '--nds-context-used': meterValue }"
      >
        <span class="nds-context-display-bar-fill" />
      </span>
    </template>

    <span
      class="nds-context-display-value"
      data-slot="context-display-value"
    >{{ valueText }}</span>

    <span
      class="nds-context-display-detail"
      data-slot="context-display-detail"
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
      class="nds-context-display-level"
      data-slot="context-display-level"
      :variant="LEVEL_VARIANT[level]"
    >{{ labels.level[level] }}</Badge>
  </p>
</template>
