import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import type { TokenUsage } from '@shared/primitives/chat-protocol';
import {
  budgetLevel,
  usedPercent,
  usedTokens,
  type BudgetLevel,
} from '@shared/primitives/token-budget';
import { NdsBadge, type BadgeVariant } from './badge';

// ─── ContextDisplay ───────────────────────────────────────────────────────────
//
// Quanto da janela de contexto já foi usada.
//
// Desenho em docs/shared/styles/nds/medicao.css, no bloco "Uso da janela de
// contexto", que também guarda as cinco decisões de acessibilidade. A CONTA —
// fração, limiar de aviso, nível — vem de `@shared/primitives/token-budget`; o
// dado vem de `TokenUsage`, em `@shared/primitives/chat-protocol`.
//
// É A PEÇA QUE DÁ NOME AO EIXO DA FAMÍLIA 5: o mesmo número em formas
// diferentes. Anel, barra e texto desenham a MESMA medição, e a forma é escolha
// de espaço, não de significado — quem troca de forma não troca de informação.
//
// A DECISÃO QUE GOVERNA A PEÇA: o que muda a cada quadro é DECORATIVO, e o
// número é TEXTO. O medidor não tem papel ARIA nem valor, não há `aria-live` em
// lugar nenhum, e nada aqui se reanuncia — um contador que se reanuncia torna a
// tela impossível de ouvir. É a mesma decisão do contador do campo de mensagem,
// do relógio do reprodutor de mídia e do medidor de voz.
//
// SEM TETO NÃO HÁ FRAÇÃO, SÓ CONTAGEM. O `limit` é opcional no vocabulário
// porque nem sempre se sabe qual é, e a peça desenha os dois casos: com teto
// mostra a fração e o nível; sem teto mostra a contagem e diz que não há teto
// conhecido — e NÃO desenha medidor nenhum, porque um anel vazio lê como zero
// por cento, que é o oposto de "não se sabe quanto cabe".
//
// O QUE O COMPONENTE NÃO FAZ: buscar consumo, contar token, formatar duração,
// decidir o que fazer quando a janela enche. Ele recebe a medição e desenha —
// §2 da guideline 17.
//
// A RAIZ É O PRÓPRIO PARÁGRAFO, e é por isso que o seletor é de ATRIBUTO. A
// peça é uma frase sobre uma medição, com a etiqueta de nível como conteúdo
// dela, e um seletor de elemento (`<nds-context-display>`) somaria uma caixa sem
// papel entre a pilha e a frase — as cinco stacks deixariam de renderizar a
// mesma árvore, e markup divergente não é a exceção de "API de framework". Ou
// se perderia o `<p>`, que é a semântica que a referência escolheu de propósito.
// Mesma escolha do `p[ndsAgentStatus]`, do `ul[ndsComposerContext]` e do
// `button[ndsButton]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento. É o mesmo registro de `agent-status`.
//   - não há saída nenhuma, e a ausência não é divergência: esta peça é só
//     leitura, e nada nela pede coisa alguma a quem consome.
//   - o `data-slot` da etiqueta de nível é escrito no template, mas o
//     `ndsBadge` liga o dele por host binding e os dois disputam sem ordem
//     garantida (§8 do RULES.md). Quem procura a etiqueta — folha e teste —
//     procura pela CLASSE `.nds-context-display-level`, que não disputa com
//     ninguém. O atributo fica no template porque o contrato de markup é o
//     mesmo nas cinco, e não porque se possa contar com ele aqui.

/**
 * A forma com que o mesmo número se apresenta.
 *
 * `ring` cabe num trilho estreito ao lado de outros controles; `bar` toma a
 * largura e serve a um painel; `text` some com o desenho e fica só com o
 * número, para quando o espaço é uma linha de rodapé. Nenhuma das três muda o
 * que é dito, nem o que é lido em voz.
 */
export type ContextDisplayForm = 'ring' | 'bar' | 'text';

/** Na ordem do mais compacto para o mais nu. */
export const CONTEXT_DISPLAY_FORMS: readonly ContextDisplayForm[] = [
  'ring',
  'bar',
  'text',
] as const;

export interface ContextDisplayLabels {
  /**
   * De que número se trata.
   *
   * "62%" sozinho não diz de quê. O título não aparece na tela — o desenho já
   * dá o contexto a quem vê — e é o que responde a pergunta para quem ouve.
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
  /** Liga o consumido ao teto: dezenove mil DE trinta e dois mil. */
  of: string;
  /** O que está sendo contado. */
  unit: string;
  /**
   * Quando não se sabe o teto.
   *
   * Sem esta palavra o caso sem teto pareceria uma medição incompleta. Com ela,
   * a ausência de fração vira informação: o número é uma contagem, e não uma
   * fração que ficou pela metade.
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
 */
const LEVEL_VARIANT: Record<BudgetLevel, BadgeVariant> = {
  normal: 'default',
  warning: 'warning',
  critical: 'destructive',
};

@Component({
  selector: 'p[ndsContextDisplay]',
  standalone: true,
  imports: [NdsBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-context-display',
    '[attr.data-slot]': '"context-display"',
    '[attr.data-form]': 'form()',
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
      data-slot="context-display-title"
    >{{ labels().title }}</span>

    <!-- SEM TETO NÃO SE DESENHA MEDIDOR (decisão 5), e a forma de texto não
         desenha nenhum por escolha de espaço.

         O MEDIDOR É DECORATIVO (decisão 1) e sai inteiro do que é lido em voz:
         o número ao lado já diz tudo, e repeti-lo em desenho não acrescenta
         nada a quem ouve. Nenhum papel, nenhum aria-valuenow — um segundo
         portador do mesmo número o faria ser lido duas vezes (decisão 2).

         A propriedade personalizada é valor de RUNTIME, e por isso é a exceção
         legítima à proibição de estilo embutido: o que entra é o mesmo inteiro
         que o texto mostra, e não a fração crua — um anel cheio ao lado de
         "99%" seriam duas respostas para uma pergunta. -->
    @if (showMeter()) {
      @if (form() === 'ring') {
        <span
          class="nds-context-display-ring"
          data-slot="context-display-meter"
          aria-hidden="true"
          [style.--nds-context-used]="percent()"
        ></span>
      } @else {
        <!-- A propriedade fica no TRILHO, e não no preenchimento: ela herda, e
             o preenchimento a lê de graça. Presa ao mesmo elemento nas duas
             formas, quem lê o desenho não precisa saber qual está montada. -->
        <span
          class="nds-context-display-bar"
          data-slot="context-display-meter"
          aria-hidden="true"
          [style.--nds-context-used]="percent()"
        >
          <span class="nds-context-display-bar-fill"></span>
        </span>
      }
    }

    <!-- O VALOR é sempre o maior número disponível: a fração quando há teto, a
         contagem quando não há. O que muda entre os dois casos é o que se pode
         dizer, e não o lugar onde se diz. -->
    <span
      class="nds-context-display-value"
      data-slot="context-display-value"
    >{{ value() }}</span>

    <!-- E O DETALHE é sempre o que qualifica o valor: o teto quando ele existe,
         e a notícia de que não existe quando não existe. -->
    <span
      class="nds-context-display-detail"
      data-slot="context-display-detail"
    >{{ detail() }}</span>

    <!-- O NÍVEL É PALAVRA (decisão 3), e a cor acompanha em vez de substituir.
         Ele aparece SEMPRE que há teto, inclusive com folga: uma peça que só
         falasse quando a notícia é ruim deixaria a boa notícia indistinguível
         de uma medição que não chegou.

         A CLASSE é o que a folha lê e o que o teste procura — o data-slot
         estático daqui disputa com o host binding do ndsBadge (§8 do
         RULES.md), e essa disputa não tem ordem garantida. -->
    @if (level(); as budget) {
      <span
        ndsBadge
        [variant]="levelVariant()"
        class="nds-context-display-level"
        data-slot="context-display-level"
      >{{ labels().level[budget] }}</span>
    }
  `,
})
export class NdsContextDisplay {
  /** A medição. Quem conta é quem sabe, e é quem passa. */
  readonly usage = input.required<TokenUsage>();

  /** Como desenhar o mesmo número. */
  readonly form = input<ContextDisplayForm>('ring');

  /** O texto da peça. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ContextDisplayLabels>();

  /**
   * A CONTA SAI DO PRIMITIVO, e não de um `if` daqui: `null` é a resposta de
   * que não há teto, e é a mesma resposta nas cinco stacks. Escrita aqui, uma
   * delas trataria teto zero como teto e desenharia uma fração infinita.
   */
  protected readonly percent = computed(() => usedPercent(this.usage()));

  protected readonly level = computed(() => budgetLevel(this.usage()));

  protected readonly used = computed(() => usedTokens(this.usage()));

  /**
   * Comparação EXPLÍCITA com `null`, e não `@if` sobre o número.
   *
   * Zero por cento é medição legítima, e um bloco que só olhasse a verdade do
   * valor sumiria com o medidor exatamente na conversa que ainda não começou —
   * que é a primeira vez que alguém abre a peça.
   */
  protected readonly showMeter = computed(
    () => this.percent() !== null && this.form() !== 'text',
  );

  protected readonly value = computed(() => {
    const percent = this.percent();
    if (percent === null) return `${this.used().toLocaleString()} ${this.labels().unit}`;
    return `${percent}%`;
  });

  protected readonly detail = computed(() => {
    const labels = this.labels();
    if (this.percent() === null) return labels.unbounded;
    const limit = this.usage().limit!;
    return `${this.used().toLocaleString()} ${labels.of} ${limit.toLocaleString()} ${labels.unit}`;
  });

  /** A cor da etiqueta, pela tabela. Sem nível a etiqueta nem chega a existir. */
  protected readonly levelVariant = computed<BadgeVariant>(() => {
    const budget = this.level();
    return budget === null ? 'default' : LEVEL_VARIANT[budget];
  });
}
