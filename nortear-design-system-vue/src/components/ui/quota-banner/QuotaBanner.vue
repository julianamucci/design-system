<script lang="ts">
/**
 * Quanto ainda resta de uma cota, quando ela renova, e o que dá para fazer.
 *
 * Desenho em `nds/medicao.css`, no bloco "Faixa de cota", que também guarda as
 * nove decisões de acessibilidade. A CONTA — o resto, a razão, o limiar e o
 * nível — vem de `@shared/primitives/token-budget`, e é a MESMA que as três
 * medições irmãs leem: se duas delas aparecem na mesma tela usando a palavra
 * "perto do fim", ela precisa querer dizer a mesma coisa nas duas.
 *
 * A PERGUNTA É O RESTO, e é ela que faz desta peça um slug em vez de uma
 * composição de `alert` com um medidor da família. As irmãs medem o que JÁ FOI;
 * esta mede o que AINDA HÁ, e o número da manchete é `teto − uso`. Virar a
 * medição do avesso muda a decisão de quem lê: "84% usados" se confere,
 * "32 restantes" se gasta. Junto com o resto vêm três coisas que nenhuma irmã
 * tem — um HORIZONTE, um ESPAÇO DE CONTROLES e o estado ESGOTADA —, e são elas
 * que uma faixa genérica de aviso não saberia desenhar.
 *
 * NÃO HÁ CASO SEM TETO, e essa é a divergência desta peça em relação às irmãs.
 * Nelas o teto é opcional porque o que se mede existe sem ele: consumo sem
 * janela conhecida é uma contagem, custo sem orçamento é o caso comum. Aqui o
 * teto É O ASSUNTO — "quanto ainda resta" não tem resposta sem ele —, e por
 * isso ele não é opcional no tipo. A regra da família continua valendo, um
 * passo antes: em vez de desenhar um trilho vazio que leria como zero, a peça
 * não existe. Quem não tem teto não monta a faixa.
 *
 * O HORIZONTE CHEGA ESCRITO, pelo mesmo precedente do relógio do estado da
 * execução, do tempo decorrido do ditado, do carimbo do rascunho e da quantia
 * do custo: formato de duração é decisão de idioma E de lugar. A PALAVRA que o
 * antecede, essa vem dos rótulos — ela é interface, tem três traduções, e
 * grudá-la na cadeia a tiraria da `translations.json`. É a mesma divisão que a
 * peça do custo faz entre a quantia escrita e a palavra que a liga ao teto.
 *
 * E A DECISÃO QUE GOVERNA A FAMÍLIA INTEIRA: o que muda a cada quadro é
 * DECORATIVO, e o número é TEXTO. O medidor não tem papel ARIA nem valor, não
 * há região viva em lugar nenhum, e nada aqui se reanuncia. Aqui isso precisou
 * ser DECIDIDO em vez de herdado, porque "sua cota acabou" tem cara de ser da
 * natureza do chão saindo — a folha guarda o porquê de não ser, em duas linhas
 * que valem ler antes de acrescentar região viva por fora.
 *
 * O QUE O COMPONENTE NÃO FAZ: buscar cota, contar uso, formatar duração,
 * decidir o que acontece quando a cota acaba, saber o que o controle faz. Ele
 * recebe a medição e desenha — §2 da guideline 17.
 *
 * DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada", num ponto só: o
 * espaço dos controles é um SLOT (`#actions`), e não uma lista de nós passada
 * por propriedade. É a forma desta stack para "quem desenha é quem consome" — a
 * mesma que a conversa e o cartão de autorização já usam —, e é ela que faz a
 * peça hospedar o controle sem saber o que ele é. Nada mais diverge: a peça é
 * só leitura, não tem retorno para avisar nem escolha para relatar, e é
 * justamente o aviso de volta que costuma ser o ponto em que as cinco stacks
 * deixam de se parecer.
 *
 * O vocabulário mora neste bloco, e não no índice da pasta, porque a peça é
 * autônoma: ela não entra na API de nenhuma outra, e quem a usa a importa por
 * inteiro — componente e tipos — de um lugar só.
 */
import type { BudgetLevel } from '@shared/primitives/token-budget'

/**
 * A cota: o que já foi usado, e o teto.
 *
 * Os dois lados andam juntos num objeto só porque são a mesma medição, e
 * porque o teto é OBRIGATÓRIO aqui. Como duas propriedades soltas, uma delas
 * opcional, existiria a faixa sem cota — que não é uma medição pela metade, é a
 * ausência da pergunta.
 */
export interface QuotaAllowance {
  /**
   * Quanto da cota já foi usado.
   *
   * Número puro, sem unidade: quem nomeia o que está sendo contado é o texto,
   * porque "mensagens" tem três traduções e um número não tem nenhuma.
   */
  used: number
  /**
   * O teto da cota.
   *
   * Sem ele não há resto, não há razão e não há nível — ou seja, não há faixa.
   * É por isso que ele não é opcional, ao contrário do teto das medições irmãs.
   */
  limit: number
}

export interface QuotaBannerLabels {
  /**
   * De qual cota se trata.
   *
   * A manchete já diz o que é contado ("32 mensagens restantes"), então o
   * título responde a OUTRA pergunta: a cota do plano, a do dia, a do projeto.
   * Ele não aparece na tela porque quem vê sabe pelo lugar em que a faixa está;
   * quem ouve não sabe.
   */
  title: string
  /** O que está sendo contado. Aparece na manchete e na razão do rodapé. */
  unit: string
  /**
   * A palavra que acompanha o resto.
   *
   * É ela que impede a manchete de ser lida como o que já foi gasto — "32
   * mensagens" sozinho aponta para os dois lados. Vem depois da unidade porque
   * é a ordem que serve aos três idiomas do conteúdo compartilhado.
   */
  left: string
  /**
   * O que dizer quando não sobra nada.
   *
   * Sem esta palavra a manchete contaria zero, e zero contado lê como medição —
   * não como fim. É a mesma escolha que faz a peça do custo dizer que não há
   * teto em vez de desenhar um trilho vazio.
   */
  exhausted: string
  /** A palavra que antecede o horizonte: RENOVA EM três horas e doze minutos. */
  renews: string
  /** Liga o usado ao teto na razão do rodapé: cento e sessenta e oito DE duzentos. */
  of: string
  /**
   * A palavra de cada nível.
   *
   * É ela que descreve, e não a cor: cor sozinha não descreve estado (WCAG
   * 1.4.1), e aqui a cor está em dois lugares — moldura e medidor —, o que só
   * torna a palavra mais necessária: duas superfícies coloridas ainda são zero
   * palavras. `Record` completo de propósito — nível novo no primitivo
   * compartilhado reprova a compilação aqui, em vez de desenhar uma etiqueta em
   * branco que ninguém repara.
   */
  level: Record<BudgetLevel, string>
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
// A leitura de slot vem de UMA implementação, e não de uma cópia por peça: ela
// nasceu para exatamente este caso — o slot está sempre declarado, e quem decide
// se ele desenha alguma coisa é o `v-if` de quem consome, lá dentro. Copiá-la
// produziria duas versões que divergem sem nenhum sinal.
import { hasSlotContent } from '@/components/ui/chat-thread/chat-slots'
import {
  fractionLevel,
  fractionPercent,
  remainingUnits,
  spentFraction,
} from '@shared/primitives/token-budget'

const props = defineProps<{
  /** O uso e o teto. */
  quota: QuotaAllowance
  /**
   * Quando a cota renova, JÁ ESCRITO.
   *
   * Ausente é a resposta de que ela não renova — crédito comprado uma vez é
   * caso real —, e aí a linha some em vez de dizer "renova em nunca".
   */
  renewsIn?: string
  labels: QuotaBannerLabels
}>()

const slots = defineSlots<{
  /**
   * Os controles, prontos de quem consome.
   *
   * Ação é ESPAÇO, e não política (§2 e §7 da guideline 17): a peça desenha o
   * lugar de quem responde e nada mais. O que "mudar de plano" faz, se há um
   * segundo botão, se a cota pode ser comprada avulsa — nada disso está aqui.
   *
   * É o MESMO contrato que a conversa e o cartão de autorização já usam nesta
   * stack: quem monta o controle o monta com as ferramentas daqui, e a peça o
   * hospeda sem saber o que ele é.
   *
   * Slot que não desenha nada não desenha a caixa: um vão com afastamento e sem
   * nada dentro é espaço reservado para quem nunca chegou.
   */
  actions?: () => unknown
}>()

/**
 * A cor de reforço de cada nível, em tabela.
 *
 * Tabela em vez de cadeia de ternários, pelo mesmo motivo do `badge`: com a
 * tabela não há ramo para cobrir nem ramo inalcançável a ignorar. A ETIQUETA é
 * quem carrega a palavra; a cor dela é reforço, e é curta o bastante para o
 * limiar de 3:1.
 *
 * Os mesmos três valores das peças irmãs, e isso é o eixo da família: mesmo
 * limiar, mesma palavra, mesma cor. Uma tabela diferente aqui faria duas
 * medições da mesma tela discordarem sobre o que é aviso.
 */
const LEVEL_VARIANT: Record<BudgetLevel, BadgeVariants['variant']> = {
  normal: 'default',
  warning: 'warning',
  critical: 'destructive',
}

// A CONTA SAI DO PRIMITIVO, e não de uma subtração daqui: o piso do resto em
// zero, o recorte da razão em uma volta, as duas travas do por cento e o limiar
// de cada nível são a mesma resposta nas cinco stacks. Escritas aqui, uma delas
// mostraria "-14 mensagens restantes" no dia em que alguém passasse do teto — e
// a subtração é justamente a conta que mais parece dispensar uma função.
const remaining = computed(() => remainingUnits(props.quota.used, props.quota.limit))

// O `null` desta chamada NÃO é "sem teto declarado", porque o tipo exige teto:
// é teto que não é teto — zero, negativo ou não-finito. Uma cota cujo teto é
// zero não tem nada a restar, e a razão cheia é a resposta certa para ela: é a
// mesma que `remainingUnits` já deu, do outro lado da conta.
const fraction = computed(() => spentFraction(props.quota.used, props.quota.limit) ?? 1)
const percent = computed(() => fractionPercent(fraction.value))

/**
 * O nível, SEMPRE presente — ao contrário das irmãs, onde o atributo some
 * quando não há teto. Aqui não há caso sem teto.
 */
const level = computed(() => fractionLevel(fraction.value))

/**
 * O inteiro que o medidor recebe — o MESMO que a razão do rodapé descreve.
 *
 * Uma barra que discordasse do texto ao lado seriam duas respostas para uma
 * pergunta só.
 */
const meterValue = computed(() => String(percent.value))

/**
 * O QUE AINDA RESTA, que é o que muda a decisão de quem lê.
 *
 * ESGOTADA NÃO É UM QUARTO NÍVEL (decisão do bloco da folha): o resto só chega
 * a zero quando a razão chega a um, então o nível já é o mais apertado. O que
 * muda é o TEXTO da manchete, e texto não precisa de gancho de folha — com a
 * cota esgotada ela troca o número pela palavra, porque zero contado lê como
 * medição, e não como fim.
 */
const remainingText = computed(() =>
  remaining.value === 0
    ? props.labels.exhausted
    : `${remaining.value.toLocaleString()} ${props.labels.unit} ${props.labels.left}`,
)

/** O horizonte: a palavra dos rótulos, e a duração que já chegou escrita. */
const renewsText = computed(() => `${props.labels.renews} ${props.renewsIn}`)

/**
 * A RAZÃO EM TEXTO, e não um segundo por cento: `168 de 200 mensagens` diz
 * exatamente o que a barra desenha, e com mais precisão, porque não passa pelo
 * truncamento do inteiro. É este elemento que permite à barra ser só desenho —
 * sem ele, ela viraria a única portadora da fração e passaria a dever 3:1 entre
 * a parte cheia e a vazia.
 */
const detailText = computed(
  () =>
    `${props.quota.used.toLocaleString()} ${props.labels.of} ` +
    `${props.quota.limit.toLocaleString()} ${props.labels.unit}`,
)

/**
 * O slot desenhou alguma coisa?
 *
 * Chamado de dentro do render, e não de um `computed`: o slot só pode ser
 * invocado durante a renderização, e é ali que a resposta é usada.
 */
function actionsFilled(): boolean {
  return hasSlotContent(slots.actions?.())
}
</script>

<template>
  <!-- `<div>`, e não `<p>` como as três irmãs: esta peça tem duas linhas de
       texto e uma caixa de controles, e botão dentro de parágrafo é marcação
       inválida. Nenhum papel ARIA, nenhuma região viva (decisão 2 da folha).

       `data-level` está SEMPRE presente, ao contrário das irmãs — lá o atributo
       some quando não há teto, e aqui não há caso sem teto. -->
  <div
    class="nds-quota-banner"
    data-slot="quota-banner"
    :data-level="level"
  >
    <!-- O NÚMERO TEM NOME, e o nome é o ESCOPO (decisão 4). Ele não aparece na
         tela: quem vê já sabe de qual cota se trata pelo lugar em que a faixa
         está, e quem ouve não sabe. -->
    <span
      class="nds-sr-only"
      data-slot="quota-banner-title"
    >{{ labels.title }}</span>

    <p
      class="nds-quota-banner-headline"
      data-slot="quota-banner-headline"
    >
      <!-- O QUE AINDA RESTA abre a linha, porque é ele que muda a decisão de
           quem lê. Com a cota esgotada a manchete troca o número pela palavra:
           zero contado lê como medição, e não como fim. -->
      <span
        class="nds-quota-banner-remaining"
        data-slot="quota-banner-remaining"
      >{{ remainingText }}</span>

      <!-- O HORIZONTE, quando existe. A duração chegou ESCRITA; a palavra que a
           antecede é interface e veio dos rótulos. -->
      <span
        v-if="renewsIn"
        class="nds-quota-banner-renews"
        data-slot="quota-banner-renews"
      >{{ renewsText }}</span>

      <!-- O NÍVEL É PALAVRA (decisão 3), e a cor acompanha em vez de
           substituir. Ele aparece SEMPRE, inclusive com folga: uma faixa que só
           falasse quando a notícia é ruim deixaria a boa notícia indistinguível
           de uma medição que não chegou.

           É o `Badge` de propósito — a folha da família não declara desenho
           próprio para a etiqueta, só o alinhamento. A classe anda junto do
           `data-slot`, e o `data-slot` é sobrescrito para a peça se achar no
           documento. -->
      <Badge
        class="nds-quota-banner-level"
        data-slot="quota-banner-level"
        :variant="LEVEL_VARIANT[level]"
      >
        {{ labels.level[level] }}
      </Badge>
    </p>

    <!-- O medidor fica ENTRE as duas linhas de texto, e é por isso que ele vem
         aqui no DOM: pô-lo no fim exigiria `order` para desfazer a ordem de
         leitura, e `order` que discorda do foco é a armadilha da decisão 5.

         O MEDIDOR É DECORATIVO (decisão 1 da folha) e sai inteiro do que é lido
         em voz: a razão do rodapé já diz o mesmo, e repeti-la em desenho não
         acrescenta nada a quem ouve. Nenhum papel, nenhum `aria-valuenow` — um
         segundo portador da mesma fração a faria ser lida duas vezes, uma delas
         como controle.

         Custom property, e não largura em `style`: o valor é dado de runtime, e
         a folha é quem decide como ele vira desenho. A propriedade fica no
         TRILHO, e não no preenchimento — ela herda, então o preenchimento a lê
         de graça, e o número mora sempre no mesmo elemento. -->
    <span
      class="nds-quota-banner-bar"
      data-slot="quota-banner-meter"
      aria-hidden="true"
      :style="{ '--nds-quota-used': meterValue }"
    >
      <span class="nds-quota-banner-bar-fill" />
    </span>

    <div
      class="nds-quota-banner-footer"
      data-slot="quota-banner-footer"
    >
      <span
        class="nds-quota-banner-detail"
        data-slot="quota-banner-detail"
      >{{ detailText }}</span>

      <!-- OS CONTROLES VÊM POR ÚLTIMO (decisões 5 e 8), e a caixa deles só
           existe quando há o que pôr dentro: um container vazio deixaria um
           espaço que ninguém pediu e um `data-slot` que não descreve nada.

           O que o slot desenha sai daqui exatamente como chegou — a peça não o
           reescreve, não lhe pendura manipulador e não sabe o que ele faz. -->
      <div
        v-if="actionsFilled()"
        class="nds-quota-banner-actions"
        data-slot="quota-banner-actions"
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
