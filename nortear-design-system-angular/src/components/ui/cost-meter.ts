import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import {
  fractionLevel,
  fractionPercent,
  type BudgetLevel,
} from '@shared/primitives/token-budget';
import { NdsBadge, type BadgeVariant } from './badge';

// ─── CostMeter ────────────────────────────────────────────────────────────────
//
// Quanto uma execução custou, em dinheiro.
//
// Desenho em docs/shared/styles/nds/medicao.css, no bloco "Custo de uma
// execução", que também guarda as seis decisões de acessibilidade. A CONTA — o
// por cento que se lê, o limiar e o nível — vem de
// `@shared/primitives/token-budget`, e é a MESMA que a peça da janela de
// contexto lê: se as duas aparecem lado a lado usando a palavra "perto do
// teto", ela precisa querer dizer a mesma coisa nas duas.
//
// A DECISÃO QUE SÓ ESTA PEÇA TEM: O DINHEIRO CHEGA ESCRITO. A quantia entra
// como texto — "US$ 0,42" —, nunca como número com uma moeda ao lado. É o
// precedente que o tempo decorrido do ditado, o relógio do estado da execução e
// o carimbo da faixa de rascunho já fixaram, e aqui ele vale com mais força:
// duração tem separador e ordem; moeda tem símbolo, POSIÇÃO do símbolo,
// separador de milhar, separador decimal e número de casas — e os cinco variam
// por idioma E por moeda. A mesma quantia se escreve `US$ 0,42`, `$0.42` ou
// `0,42 US$` conforme quem lê, e o símbolo troca de ponta entre um idioma e
// outro. Quem sabe disso é quem escolheu a moeda, e não um componente que
// decidiria idioma em cinco stacks.
//
// O QUE ATRAVESSA A CONTA É A FRAÇÃO, e não a quantia: a razão entre o gasto e
// o teto é número puro, sem moeda e sem idioma. Por isso o teto chega como um
// par — a quantia ESCRITA e a fração JÁ CALCULADA (`spentFraction`) —, e não
// como dois números que a peça dividiria: um par de números ao lado das duas
// cadeias seriam dois portadores do mesmo fato, e dois portadores discordam.
//
// SEM TETO NÃO HÁ FRAÇÃO, SÓ A QUANTIA. Custo sem orçamento declarado é a
// situação comum, e a peça a desenha: sem o teto não há medidor, não há nível e
// o detalhe passa a dizer que não há teto — porque um trilho vazio lê como "não
// gastou nada", que é o oposto do que se sabe.
//
// E A DECISÃO QUE GOVERNA A FAMÍLIA INTEIRA: o que muda a cada quadro é
// DECORATIVO, e o número é TEXTO. O medidor não tem papel ARIA nem valor, não
// há `aria-live` em lugar nenhum, e nada aqui se reanuncia — um contador que se
// reanuncia torna a tela impossível de ouvir enquanto a resposta é gerada logo
// ao lado.
//
// O QUE O COMPONENTE NÃO FAZ: buscar preço, calcular tarifa, converter moeda,
// formatar dinheiro, decidir o que fazer quando o orçamento acaba. Ele recebe o
// que custou e desenha — §2 da guideline 17.
//
// A RAIZ É O PRÓPRIO PARÁGRAFO, e é por isso que o seletor é de ATRIBUTO. A
// peça é uma frase sobre uma quantia, com a etiqueta de nível como conteúdo
// dela, e um seletor de elemento (`<nds-cost-meter>`) somaria uma caixa sem
// papel entre a pilha e a frase — as cinco stacks deixariam de renderizar a
// mesma árvore, e markup divergente não é a exceção de "API de framework". Ou
// se perderia o `<p>`, que é a semântica que a referência escolheu de propósito.
// Mesma escolha do `p[ndsContextDisplay]`, do `p[ndsAgentStatus]` e do
// `button[ndsButton]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento. É o mesmo registro de `context-display` e de
//     `agent-status`.
//   - não há saída nenhuma, e a ausência não é divergência: esta peça é só
//     leitura, e nada nela pede coisa alguma a quem consome.
//   - o `data-slot` da etiqueta de nível é escrito no template, mas o
//     `ndsBadge` liga o dele por host binding e os dois disputam sem ordem
//     garantida (§8 do RULES.md). Quem procura a etiqueta — folha e teste —
//     procura pela CLASSE `.nds-cost-meter-level`, que não disputa com ninguém.
//     O atributo fica no template porque o contrato de markup é o mesmo nas
//     cinco, e não porque se possa contar com ele aqui.

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
  amount: string;
  /**
   * Quanto do teto já foi gasto, de 0 a 1.
   *
   * Número puro: não tem moeda nem idioma, e é justamente por isso que é ele
   * que entra na conta. Sai de `spentFraction`, do primitivo compartilhado, que
   * é quem guarda o recorte em uma volta e a resposta de que sem teto não há
   * fração nenhuma.
   */
  fraction: number;
}

export interface CostMeterLabels {
  /**
   * De que número se trata.
   *
   * "US$ 0,42" sozinho não diz de quê — nem de qual execução, nem se é do turno
   * ou da conversa inteira. O título não aparece na tela, porque quem vê já
   * sabe pelo lugar em que a peça está; quem ouve não sabe.
   */
  title: string;
  /**
   * A palavra de cada nível.
   *
   * É ela que descreve, e não a cor do medidor: cor sozinha não descreve estado
   * (WCAG 1.4.1). `Record` completo de propósito — nível novo no primitivo
   * compartilhado reprova a compilação aqui, em vez de desenhar uma etiqueta em
   * branco que ninguém repara.
   */
  level: Record<BudgetLevel, string>;
  /** Liga a fração ao teto: oitenta e quatro por cento DE cinquenta centavos. */
  of: string;
  /**
   * Quando não há teto declarado.
   *
   * Sem esta palavra a ausência de teto pareceria uma medição incompleta. Com
   * ela, a ausência de fração vira informação: o que se sabe é quanto custou, e
   * não quanto ainda pode custar.
   */
  unbounded: string;
}

/**
 * A cor de reforço de cada nível, em tabela.
 *
 * Tabela em vez de cadeia de ternários, pelo mesmo motivo do badge: com a
 * tabela não há ramo para cobrir nem ramo inalcançável a ignorar. A ETIQUETA é
 * quem carrega a palavra; a cor dela é reforço, e é curta o bastante para o
 * limiar de 3:1.
 *
 * Os mesmos três valores da peça da janela de contexto, e isso é o eixo da
 * família: mesmo limiar, mesma palavra, mesma cor. Uma tabela diferente aqui
 * faria duas medições da mesma tela discordarem sobre o que é aviso.
 */
const LEVEL_VARIANT: Record<BudgetLevel, BadgeVariant> = {
  normal: 'default',
  warning: 'warning',
  critical: 'destructive',
};

@Component({
  selector: 'p[ndsCostMeter]',
  standalone: true,
  imports: [NdsBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-cost-meter',
    '[attr.data-slot]': '"cost-meter"',
    // Sem teto não há nível, e `null` tira o atributo do elemento — em vez de
    // deixá-lo sair como uma palavra vazia que a folha ainda tentaria colorir.
    '[attr.data-level]': 'level()',
    // Nenhum papel ARIA e nenhuma região viva (decisão 1 da folha), e a
    // ausência é deliberada: quem quiser anunciar põe a região por fora.
  },
  template: `
    <!-- O NÚMERO TEM NOME (decisão 4). Ele não aparece na tela: quem vê já sabe
         do que se trata pelo lugar em que a peça está, e quem ouve não. -->
    <span
      class="nds-sr-only"
      data-slot="cost-meter-title"
    >{{ labels().title }}</span>

    <!-- A QUANTIA É SEMPRE A QUANTIA (decisão 6). Ao contrário da peça da
         janela, o valor não troca de significado entre as duas situações:
         dinheiro é dinheiro com teto e sem teto, e o que aparece e some é o que
         o QUALIFICA.

         Ela sai daqui exatamente como chegou — a peça não escolhe símbolo,
         separador nem casas decimais. -->
    <span
      class="nds-cost-meter-amount"
      data-slot="cost-meter-amount"
    >{{ amount() }}</span>

    <!-- O DETALHE MANTÉM A FRAÇÃO EM TEXTO, e não é adorno: é ele que permite à
         barra ser só desenho. Se o por cento saísse da tela, a barra viraria a
         única portadora da fração e passaria a dever 3:1 entre a parte cheia e
         a vazia — que é exatamente a diferença entre este medidor e uma barra
         de progresso. Sem teto declarado, ele diz que não há teto. -->
    <span
      class="nds-cost-meter-detail"
      data-slot="cost-meter-detail"
    >{{ detail() }}</span>

    <!-- O NÍVEL É PALAVRA (decisão 3), e a cor acompanha em vez de substituir.
         Ele aparece SEMPRE que há teto, inclusive com folga: uma peça que só
         falasse quando a notícia é ruim deixaria a boa notícia indistinguível
         de uma medição que não chegou.

         A CLASSE é o que a folha lê e o que o teste procura — o data-slot
         estático daqui disputa com o host binding do ndsBadge (§8 do
         RULES.md), e essa disputa não tem ordem garantida. -->
    @if (level(); as word) {
      <span
        ndsBadge
        [variant]="levelVariant()"
        class="nds-cost-meter-level"
        data-slot="cost-meter-level"
      >{{ labels().level[word] }}</span>
    }

    <!-- SEM TETO NÃO SE DESENHA MEDIDOR (decisão 5): um trilho vazio leria como
         "não gastou nada", que é o oposto do que se sabe.

         O MEDIDOR É DECORATIVO (decisão 1) e sai inteiro do que é lido em voz:
         o por cento ao lado já diz o mesmo, e repeti-lo em desenho não
         acrescenta nada a quem ouve. Nenhum papel, nenhum aria-valuenow — um
         segundo portador do mesmo número o faria ser lido duas vezes, uma delas
         como controle (decisão 2).

         A propriedade personalizada é valor de RUNTIME, e por isso é a exceção
         legítima à proibição de estilo embutido: o que entra é o MESMO inteiro
         que o detalhe mostra, e não a fração crua — uma barra cheia ao lado de
         "99%" seriam duas respostas para uma pergunta.

         Ela fica no TRILHO, e não no preenchimento: ela herda, então o
         preenchimento a lê de graça, e o número mora sempre no mesmo elemento.

         E o medidor vem POR ÚLTIMO no DOM: a folha o joga para a segunda linha
         com uma declaração só, e como ele é aria-hidden a ordem de leitura não
         muda. -->
    @if (showMeter()) {
      <span
        class="nds-cost-meter-bar"
        data-slot="cost-meter-meter"
        aria-hidden="true"
        [style.--nds-cost-spent]="percent()"
      >
        <span class="nds-cost-meter-bar-fill"></span>
      </span>
    }
  `,
})
export class NdsCostMeter {
  /**
   * O que já custou, JÁ ESCRITO.
   *
   * Não há rótulo de unidade nesta peça, ao contrário das duas irmãs: a moeda
   * já está dentro desta cadeia, e um rótulo à parte seria uma segunda chance
   * de discordar dela.
   */
  readonly amount = input.required<string>();

  /** O teto declarado. Ausente quando não há — e aí não há fração, só a quantia. */
  readonly budget = input<CostBudget>();

  /** O texto da peça. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<CostMeterLabels>();

  /**
   * A CONTA SAI DO PRIMITIVO, e não de um arredondamento daqui: as duas travas
   * do número que se lê em voz — um gasto de verdade não sai como 0%, e um
   * gasto que não é tudo não sai como 100% — e o limiar de cada nível são a
   * mesma resposta nas cinco stacks. Escritas aqui, uma delas arredondaria para
   * cima e diria "100%" com espaço sobrando.
   *
   * `null` entra quando não há teto, e `null` sai: é assim que a ausência
   * atravessa a peça inteira sem virar zero pelo caminho.
   */
  protected readonly percent = computed(() =>
    fractionPercent(this.budget()?.fraction ?? null),
  );

  /**
   * O nível, pela mesma comparação que a medição da janela lê.
   *
   * Dois limiares fariam "perto do teto" querer dizer uma coisa acima e outra
   * abaixo na mesma tela, e aí a palavra deixaria de decidir o que fazer.
   */
  protected readonly level = computed(() => fractionLevel(this.budget()?.fraction ?? null));

  /**
   * Comparação EXPLÍCITA com `null`, e não um bloco sobre o número.
   *
   * Zero por cento é medição legítima — a execução que ainda não custou nada —,
   * e um bloco que só olhasse a verdade do valor sumiria com o medidor
   * exatamente na primeira vez que alguém abre a peça.
   */
  protected readonly showMeter = computed(() => this.percent() !== null);

  protected readonly detail = computed(() => {
    const labels = this.labels();
    const budget = this.budget();
    const percent = this.percent();
    // SEM TETO NÃO HÁ FRAÇÃO (decisão 5): a ausência vira informação em vez de
    // parecer medição pela metade.
    if (budget === undefined || percent === null) return labels.unbounded;
    return `${percent}% ${labels.of} ${budget.amount}`;
  });

  /** A cor da etiqueta, pela tabela. Sem nível a etiqueta nem chega a existir. */
  protected readonly levelVariant = computed<BadgeVariant>(() => {
    const word = this.level();
    return word === null ? 'default' : LEVEL_VARIANT[word];
  });
}
