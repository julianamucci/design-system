import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import {
  contextSlices,
  contextTotal,
  type ContextPart,
} from '@shared/primitives/token-budget';

// ─── ContextBreakdown ─────────────────────────────────────────────────────────
//
// De onde veio o contexto já gasto.
//
// Desenho em docs/shared/styles/nds/medicao.css, no bloco "Repartição do
// contexto por origem", que também guarda as cinco decisões de acessibilidade.
// A CONTA — o total, o peso de cada parcela e o por cento que se lê — vem de
// `@shared/primitives/token-budget`; o dado vem de `ContextPart`, do mesmo
// módulo.
//
// A PERGUNTA É OUTRA, E É O QUE SEPARA ESTA PEÇA DA IRMÃ. "Quanto ainda cabe"
// precisa de um teto; "de onde veio" não precisa de teto nenhum, e é por isso
// que aqui não existe `limit`, não existe nível e não existe o caso de teto
// desconhecido. O DENOMINADOR É O TOTAL REPARTIDO: quem quer a outra pergunta
// monta a outra peça, e as duas convivem na mesma tela sem discordar, porque
// nenhuma responde pela outra.
//
// AS TRÊS DECISÕES QUE O PRIMITIVO GUARDA, e que nenhum `if` daqui refaz:
//
//   - A ORDEM É A DE QUEM MEDIU, nunca a do tamanho. A legenda se lê por
//     posição, e uma parcela que sobe de lugar entre um turno e o seguinte faz
//     comparar duas fotos diferentes achando que é a mesma.
//   - A PARCELA ZERADA CONTINUA NA LISTA. Fatia e linha da legenda se
//     emparelham por posição para dividirem a cor; sumir com a zerada faria a
//     cor apontar para a fatia da vizinha — e continuaria parecendo certa.
//   - O POR CENTO É TEXTO, com as duas travas: uma parcela de verdade não sai
//     como 0%, e uma parcela que não é tudo não sai como 100%.
//
// E A DECISÃO QUE GOVERNA A FAMÍLIA INTEIRA: o que muda a cada quadro é
// DECORATIVO, e o número é TEXTO. A barra é `aria-hidden`, não tem papel nem
// valor, e não há `aria-live` em lugar nenhum — um contador que se reanuncia
// torna a tela impossível de ouvir enquanto a resposta é gerada logo ao lado.
//
// O QUE O COMPONENTE NÃO FAZ: contar token, adivinhar de onde o contexto veio,
// agrupar origens, esconder a legenda atrás de um clique. Ele recebe a
// repartição e desenha — §2 da guideline 17.
//
// A RAIZ É O PRÓPRIO `<div>`, e é por isso que o seletor é de ATRIBUTO. O corpo
// da peça é uma lista, e lista não cabe dentro de parágrafo — daí `<div>`, e
// não o `<p>` da irmã. Um seletor de elemento (`<nds-context-breakdown>`)
// somaria uma caixa sem papel entre a pilha e o bloco, e as cinco stacks
// deixariam de renderizar a mesma árvore; markup divergente não é a exceção de
// "API de framework". Mesma escolha do `p[ndsContextDisplay]`, do
// `ul[ndsComposerContext]` e do `button[ndsButton]`.
//
// `track $index`, E NUNCA `track slice.id`: aqui a POSIÇÃO é a identidade. A
// folha pareia fatia e linha da legenda por `:nth-child` em containers irmãos
// de mesmo comprimento, e é dela que sai a cor de cada parcela. Rastrear pelo
// endereço deixaria o Angular reordenar nós ao trocar a repartição, e a cor
// escorregaria de linha — o defeito que continua parecendo certo.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento. É o mesmo registro de `agent-status` e da peça irmã.
//   - não há saída nenhuma, e a ausência não é divergência: esta peça é só
//     leitura, e nada nela pede coisa alguma a quem consome. É também por isso
//     que a página de documentação não sobrescreve nenhuma linha da tabela de
//     propriedades — `parts` e `labels` se chamam assim nas cinco.
//   - o `data-slot` da RAIZ vem de host binding, e o do resto da árvore está
//     escrito no template. A folha estiliza pela CLASSE nos dois casos, e aqui
//     isso morde: uma regra presa ao atributo poderia não aplicar na raiz, e o
//     que se perderia não seria um alinhamento — seria o pareamento de cor
//     entre a fatia e a legenda.
//   - a composição do bloco que expande é de FORMA, e é de framework: quem monta
//     a repartição recolhida põe o gatilho no próprio `<button>`
//     (`ndsCollapsibleTrigger ndsButton`), em vez de passar um botão pronto como
//     conteúdo de uma opção. Registrada também na story de composição.

export interface ContextBreakdownLabels {
  /**
   * O que está sendo repartido.
   *
   * Aparece na tela, ao contrário do título da peça irmã: lá o número mora numa
   * linha cujo lugar já diz do que se trata, e aqui o que se vê é uma lista de
   * nomes e números que sem título não diz o que foi dividido.
   */
  title: string;
  /** O que está sendo contado. */
  unit: string;
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
  parts: Record<string, string>;
}

/**
 * Uma linha já pronta para desenhar.
 *
 * O template não chama função nenhuma: com `OnPush` e sinais, uma chamada em
 * interpolação reexecuta a cada verificação, e aqui seriam quatro por parcela.
 * O que a linha carrega é só o que a tela mostra — a fatia e a legenda leem o
 * MESMO inteiro, e é isso que impede o desenho de discordar do número ao lado.
 */
interface ContextBreakdownRow {
  /** O peso em inteiro, que vale para a fatia e para o texto. */
  share: number;
  /** A palavra da origem, ou o endereço dela quando não há palavra. */
  name: string;
  /** `1.500 tokens` — o mesmo formato do total. */
  tokens: string;
  /** `6%` — este número é TEXTO, e é ele que se lê em voz. */
  percent: string;
}

@Component({
  selector: 'div[ndsContextBreakdown]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-context-breakdown',
    '[attr.data-slot]': '"context-breakdown"',
    // NENHUM ATRIBUTO DE ESTADO, e a ausência é decisão. `data-level` existe na
    // vizinha porque lá há um teto contra o qual medir; aqui o que varia é
    // quantas parcelas chegaram e quanto cada uma pesa, e as duas coisas são
    // desenho por posição, não por estado. Nenhum papel ARIA e nenhuma região
    // viva (decisão 1 da folha): quem quiser anunciar põe a região por fora.
  },
  template: `
    <!-- O TÍTULO É VISÍVEL (decisão 4), e o total ao lado dele é o denominador
         de tudo o que vem abaixo: sem ele os por cento não têm grandeza. -->
    <p
      class="nds-context-breakdown-headline"
      data-slot="context-breakdown-headline"
    >
      <span
        class="nds-context-breakdown-title"
        data-slot="context-breakdown-title"
      >{{ labels().title }}</span>
      <span
        class="nds-context-breakdown-total"
        data-slot="context-breakdown-total"
      >{{ totalText() }}</span>
    </p>

    <!-- A BARRA É DECORATIVA (decisão 1) e sai inteira do que é lido em voz: a
         legenda abaixo já diz nome e número de cada parcela. Nenhum papel,
         nenhum aria-valuenow — um segundo portador dos mesmos números os faria
         ser lidos duas vezes, uma delas como controle.

         Uma fatia por parcela, SEMPRE, inclusive a que vale zero: é o que
         mantém a contagem desta lista igual à da legenda, e é dessa igualdade
         que sai o pareamento de cor por :nth-child que a folha declara.

         A propriedade personalizada é valor de RUNTIME, e por isso é a exceção
         legítima à proibição de estilo embutido — o mesmo precedente do medidor
         da peça irmã. O que entra é o MESMO inteiro que a legenda mostra, e não
         a fração crua; a folha reparte o trilho por proporção, e é assim que a
         barra fica sempre cheia sem ninguém escrever largura literal. -->
    <span
      class="nds-context-breakdown-bar"
      data-slot="context-breakdown-bar"
      aria-hidden="true"
    >
      @for (row of rows(); track $index) {
        <span
          class="nds-context-breakdown-slice"
          data-slot="context-breakdown-slice"
          [style.--nds-context-share]="row.share"
        ></span>
      }
    </span>

    <!-- A LEGENDA É UMA LISTA DE VERDADE (decisão 3): a contagem e a posição
         chegam a quem ouve, e é por posição que esta repartição pede para ser
         comparada de um turno para o seguinte. -->
    <ul
      class="nds-context-breakdown-legend"
      data-slot="context-breakdown-legend"
    >
      @for (row of rows(); track $index) {
        <li
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
          ></span>

          <!-- CADA PARCELA TEM NOME E NÚMERO EM TEXTO (decisão 2, WCAG 1.4.1).
               Sem palavra para o endereço, o endereço é o que aparece: uma linha
               em branco deixaria a cor sozinha dizendo de qual origem se trata. -->
          <span
            class="nds-context-breakdown-name"
            data-slot="context-breakdown-name"
          >{{ row.name }}</span>
          <span
            class="nds-context-breakdown-tokens"
            data-slot="context-breakdown-tokens"
          >{{ row.tokens }}</span>
          <span
            class="nds-context-breakdown-percent"
            data-slot="context-breakdown-percent"
          >{{ row.percent }}</span>
        </li>
      }
    </ul>
  `,
})
export class NdsContextBreakdown {
  /** A repartição, na ordem em que quem mediu a produziu. */
  readonly parts = input.required<readonly ContextPart[]>();

  /** O texto da peça. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ContextBreakdownLabels>();

  /**
   * A CONTA SAI DO PRIMITIVO, e não de um `reduce` daqui: a ordem, a parcela
   * zerada e as duas travas do por cento são a mesma resposta nas cinco stacks.
   * Escritas aqui, uma delas ordenaria por peso "para ficar melhor".
   */
  private readonly slices = computed(() => contextSlices(this.parts()));

  protected readonly totalText = computed(
    () => `${contextTotal(this.parts()).toLocaleString()} ${this.labels().unit}`,
  );

  protected readonly rows = computed<ContextBreakdownRow[]>(() => {
    const labels = this.labels();
    return this.slices().map((slice) => ({
      share: slice.percent,
      name: labels.parts[slice.id] ?? slice.id,
      tokens: `${slice.tokens.toLocaleString()} ${labels.unit}`,
      percent: `${slice.percent}%`,
    }));
  });
}
