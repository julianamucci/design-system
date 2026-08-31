import { Children, type CSSProperties, type ReactNode } from "react"
import type { VariantProps } from "class-variance-authority"

import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  fractionLevel,
  fractionPercent,
  remainingUnits,
  spentFraction,
  type BudgetLevel,
} from "@shared/primitives/token-budget"

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
 * há `aria-live` em lugar nenhum, e nada aqui se reanuncia. Aqui isso precisou
 * ser DECIDIDO em vez de herdado, porque "sua cota acabou" tem cara de ser da
 * natureza do chão saindo — a folha guarda o porquê de não ser, em duas linhas
 * que valem ler antes de acrescentar região viva por fora.
 *
 * O QUE O COMPONENTE NÃO FAZ: buscar cota, contar uso, formatar duração,
 * decidir o que acontece quando a cota acaba, saber o que o controle faz. Ele
 * recebe a medição e desenha — §2 da guideline 17.
 *
 * A API DIVERGE em UM ponto, e é divergência de framework: os controles chegam
 * como nó — qualquer coisa que o renderizador saiba desenhar — em vez de uma
 * lista de elementos do documento. O nome da prop é o mesmo, e a página de
 * documentação sobrescreve só o tipo. Mesma divergência que o cartão de
 * autorização já registrou para os controles da resposta.
 */

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

export interface QuotaBannerProps {
  /** O uso e o teto. */
  quota: QuotaAllowance
  /**
   * Quando a cota renova, JÁ ESCRITO.
   *
   * Ausente é a resposta de que ela não renova — crédito comprado uma vez é
   * caso real —, e aí a linha some em vez de dizer "renova em nunca".
   */
  renewsIn?: string
  /**
   * Os controles, prontos de quem consome.
   *
   * Ação é ESPAÇO, e não política (§2 e §7 da guideline 17): a peça desenha o
   * lugar de quem responde e nada mais. O que "mudar de plano" faz, se há um
   * segundo botão, se a cota pode ser comprada avulsa — nada disso está aqui.
   * Mesmo contrato das ações da mensagem e do cartão de autorização.
   */
  actions?: ReactNode
  labels: QuotaBannerLabels
  className?: string
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

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
const LEVEL_VARIANT: Record<BudgetLevel, BadgeVariant> = {
  normal: "default",
  warning: "warning",
  critical: "destructive",
}

/**
 * O trilho e o preenchimento — o único desenho da peça.
 *
 * Ele existe SEMPRE, porque sempre há teto (ver o docblock do módulo). É a
 * diferença em relação às irmãs, onde o medidor some quando não há fração.
 */
function QuotaBannerBar({ percent }: { percent: number }) {
  // O MEDIDOR É DECORATIVO (decisão 1 da folha), e sai inteiro do que é lido em
  // voz: a razão do rodapé já diz o mesmo, e repeti-la em desenho não
  // acrescenta nada a quem ouve. Nenhum papel, nenhum `aria-valuenow` — um
  // segundo portador da mesma fração a faria ser lida duas vezes, uma delas
  // como controle.
  //
  // Valor de RUNTIME por custom property, como o medidor das três peças irmãs.
  // A propriedade fica no TRILHO, e não no preenchimento — ela herda, então o
  // preenchimento a lê de graça, e o número mora sempre no mesmo elemento.
  const style = { "--nds-quota-used": String(percent) } as CSSProperties

  return (
    <span
      className="nds-quota-banner-bar"
      data-slot="quota-banner-meter"
      aria-hidden="true"
      style={style}
    >
      <span className="nds-quota-banner-bar-fill" />
    </span>
  )
}

function QuotaBanner({
  quota,
  renewsIn,
  actions,
  labels,
  className,
}: QuotaBannerProps) {
  // A CONTA SAI DO PRIMITIVO, e não de uma subtração daqui: o piso do resto em
  // zero, o recorte da razão em uma volta, as duas travas do por cento e o
  // limiar de cada nível são a mesma resposta nas cinco stacks. Escritas aqui,
  // uma delas mostraria "-14 mensagens restantes" no dia em que alguém passasse
  // do teto — e a subtração é justamente a conta que mais parece dispensar uma
  // função.
  const remaining = remainingUnits(quota.used, quota.limit)
  // O `null` desta chamada NÃO é "sem teto declarado", porque o tipo exige
  // teto: é teto que não é teto — zero, negativo ou não-finito. Uma cota cujo
  // teto é zero não tem nada a restar, e a razão cheia é a resposta certa para
  // ela: é a mesma que `remainingUnits` já deu, do outro lado da conta.
  const fraction = spentFraction(quota.used, quota.limit) ?? 1
  const percent = fractionPercent(fraction)
  const level = fractionLevel(fraction)
  // ESGOTADA NÃO É UM QUARTO NÍVEL (decisão do bloco da folha): o resto só
  // chega a zero quando a razão chega a um, então o nível já é o mais apertado.
  // O que muda é o TEXTO da manchete, e texto não precisa de gancho de folha.
  const exhausted = remaining === 0

  // Nó vazio é ausência de controle, e não uma caixa em branco. `Children.count`
  // e não a verdade do valor: um array sem itens é verdadeiro, e desenharia o
  // vão com afastamento e nada dentro que a folha existe para não ter. Mesma
  // leitura do cartão de autorização.
  const hasActions = Children.count(actions) > 0

  // O texto de cada linha nasce como UMA cadeia, e não como pedaços vizinhos no
  // JSX: é assim que ele fica idêntico ao que a folha compartilhada descreve, e
  // é a cadeia inteira que a `play` compara.
  const headline = exhausted
    ? labels.exhausted
    : `${remaining.toLocaleString()} ${labels.unit} ${labels.left}`
  const ratio =
    `${quota.used.toLocaleString()} ${labels.of} ${quota.limit.toLocaleString()} ${labels.unit}`

  return (
    // `<div>`, e não `<p>` como as três irmãs: esta peça tem duas linhas de
    // texto e uma caixa de controles, e botão dentro de parágrafo é marcação
    // inválida. Nenhum papel ARIA, nenhuma região viva (decisão 2 da folha).
    <div
      data-slot="quota-banner"
      className={cn("nds-quota-banner", className)}
      // SEMPRE PRESENTE, ao contrário das irmãs — lá o atributo some quando não
      // há teto, e aqui não há caso sem teto.
      data-level={level}
    >
      {/* O NÚMERO TEM NOME, e o nome é o ESCOPO (decisão 4). Ele não aparece na
          tela: quem vê já sabe de qual cota se trata pelo lugar em que a faixa
          está, e quem ouve não sabe. */}
      <span className="nds-sr-only" data-slot="quota-banner-title">
        {labels.title}
      </span>

      <p className="nds-quota-banner-headline" data-slot="quota-banner-headline">
        {/* O QUE AINDA RESTA abre a linha, porque é ele que muda a decisão de
            quem lê. Com a cota esgotada a manchete troca o número pela palavra:
            zero contado lê como medição, e não como fim. */}
        <span
          className="nds-quota-banner-remaining"
          data-slot="quota-banner-remaining"
        >
          {headline}
        </span>

        {/* O HORIZONTE, quando existe. A duração chegou ESCRITA; a palavra que a
            antecede é interface e veio dos rótulos. */}
        {renewsIn ? (
          <span
            className="nds-quota-banner-renews"
            data-slot="quota-banner-renews"
          >
            {`${labels.renews} ${renewsIn}`}
          </span>
        ) : null}

        {/* O NÍVEL É PALAVRA (decisão 3), e a cor acompanha em vez de
            substituir. Ele aparece SEMPRE, inclusive com folga: uma faixa que só
            falasse quando a notícia é ruim deixaria a boa notícia
            indistinguível de uma medição que não chegou.

            O `data-slot` da etiqueta é sobrescrito para o desta peça, como as
            medições irmãs já fazem. */}
        <Badge
          className="nds-quota-banner-level"
          data-slot="quota-banner-level"
          variant={LEVEL_VARIANT[level]}
        >
          {labels.level[level]}
        </Badge>
      </p>

      {/* O medidor fica ENTRE as duas linhas de texto, e é por isso que ele vem
          aqui na marcação: pô-lo no fim exigiria `order` para desfazer a ordem
          de leitura, e `order` que discorda do foco é a armadilha da decisão
          5. */}
      <QuotaBannerBar percent={percent} />

      <div className="nds-quota-banner-footer" data-slot="quota-banner-footer">
        {/* A RAZÃO EM TEXTO, e não um segundo por cento: `168 de 200 mensagens`
            diz exatamente o que a barra desenha, e com mais precisão, porque não
            passa pelo truncamento do inteiro. É este elemento que permite à
            barra ser só desenho — sem ele, ela viraria a única portadora da
            fração e passaria a dever 3:1 entre a parte cheia e a vazia. */}
        <span
          className="nds-quota-banner-detail"
          data-slot="quota-banner-detail"
        >
          {ratio}
        </span>

        {/* OS CONTROLES VÊM POR ÚLTIMO (decisões 5 e 8), e a caixa deles só
            existe quando há o que pôr dentro: um container vazio deixaria um
            espaço que ninguém pediu e um `data-slot` que não descreve nada. */}
        {hasActions ? (
          <div
            className="nds-quota-banner-actions"
            data-slot="quota-banner-actions"
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { QuotaBanner }
