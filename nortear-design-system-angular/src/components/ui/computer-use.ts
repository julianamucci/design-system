import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import type { ComputerStep, RunStatus } from '@shared/primitives/chat-protocol';

// ─── ComputerUse ──────────────────────────────────────────────────────────────
//
// A tela que o agente está dirigindo, com a marca da ação em curso e o rastro de
// onde ela veio.
//
// Desenho em docs/shared/styles/nds/agent-run.css, no bloco "Tela do
// computador", que também guarda as nove decisões de acessibilidade. O
// vocabulário — ComputerStep, RunStatus — vem de
// `@shared/primitives/chat-protocol`.
//
// POR QUE ELA É PEÇA, e não composição das irmãs. É a primeira da família cujo
// eixo é o ESPAÇO. `tool-group` desenha uma lista, `agent-plan` desenha uma
// lista, `terminal-block` desenha linhas: todas ordenam no tempo, e a posição de
// cada item é consequência da ordem. Aqui a posição é DADO — o ponto que o
// agente clicou —, e nada no design system posiciona dado em coordenada sobre
// uma superfície que ele não conhece. O que falta para compor isto não é uma
// classe, é um sistema de coordenadas.
//
// A TELA É ESPAÇO, e a peça nunca a cria. Captura de tela de sistema real traz
// marca registrada e conteúdo de terceiro (§1 da guideline 17), que é a mesma
// razão pela qual os logotipos de modelo não entram no repositório. Quem consome
// passa a tela, como `avatar` já faz na mensagem — e o TEXTO ALTERNATIVO dela é
// de quem consome, porque a peça não é dona daquele elemento. A orientação está
// escrita na decisão 6 da folha: com a legenda ao lado dizendo o que está
// acontecendo, a captura é decorativa e vai com texto alternativo vazio; quando
// ela carrega o que a legenda não diz, o texto é obrigatório.
//
// O ESTADO É `RunStatus`, INTEIRO, e é usado para uma pergunta só: a execução
// ainda corre? É ela que decide se a peça se declara ocupada e se a marca ativa
// pulsa — marca que pulsa depois do fim é o cursor que fica mentindo do bloco de
// terminal. Receber as cinco palavras e perguntar uma coisa só NÃO é o
// achatamento que a §5.3 da guideline condena: aquele critério é sobre o modelo
// de DADOS, e o que ele condena é a informação se perder na entrada. Aqui ela
// entra inteira, vinda do mesmo `RunStatus` que alimenta o estado da execução
// logo acima na tela; um booleano na assinatura obrigaria quem consome a
// traduzir cinco palavras em duas no ponto da chamada, que é exatamente onde a
// perda aconteceria.
//
// O PASSO NÃO TEM ESTADO, e isso é do vocabulário: o que está acontecendo vale
// para a SESSÃO, não por passo. Um passo com estado próprio faria a peça
// desenhar cinco marcas diferentes sobre uma tela que ela não conhece — cor
// sobre conteúdo de terceiro, que é a codificação que a legenda existe para não
// precisar.
//
// O QUE O COMPONENTE NÃO FAZ: dirigir, clicar, avançar sozinho, capturar tela,
// agendar quadro, contar tempo, rolar. Ele desenha o endereço, a tela que
// recebe, as marcas dos passos que recebe e a legenda do passo ativo. Avançar é
// de quem consome — a peça não agenda nada (§2 da guideline 17).
//
// A RAIZ É UMA FIGURA, e por isso o seletor é de ATRIBUTO em `figure`. A escolha
// do elemento é da folha e não desta stack: `<figure>` com `<figcaption>` é o
// que amarra a legenda à imagem que ela descreve, e `role="region"` seria marco
// de página por tela numa conversa — uma lista de marcos que ninguém navega
// (decisão 4). Um seletor de elemento (`<nds-computer-use>`) somaria uma caixa
// sem papel entre a pilha e a figura, e as cinco stacks deixariam de renderizar
// a mesma árvore. Mesma escolha do `div[ndsTerminalBlock]`, do
// `p[ndsAgentStatus]` e do `div[ndsJobProgress]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - A TELA É `TemplateRef<unknown>`, e no vanilla é `HTMLElement`. É a mesma
//     promessa vista de outro instrumento: quem consome declara um
//     `<ng-template>` e a peça o instancia por `ngTemplateOutlet`. Montar DOM à
//     mão perderia detecção de mudança e os inputs dos componentes projetados —
//     é a mesma escolha que o `chat-thread` já fez para avatar, ações e
//     aprovação, e que os containers de seção da documentação fazem para os
//     previews. Um efeito colateral que o vanilla não tem, e que vale registrar:
//     um `TemplateRef` pode ser instanciado VÁRIAS vezes, então a mesma tela
//     serve a duas molduras na mesma página sem ser movida de uma para a outra.
//   - as entradas são `input()` de signal, então os passos chegam por
//     `[steps]="passos"` e o padrão vazio mora na própria declaração.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento. Mesma escolha do bloco de terminal.
//   - não há saída nenhuma: a peça não oferece ação, e não há o que avisar.

/**
 * Quantas marcas o rastro mostra, contando a ativa.
 *
 * Três, e o número tem motivo: duas marcas são um segmento, e um segmento é uma
 * direção — com duas não dá para saber se o agente estava subindo ou descendo a
 * tela. Com três há duas pernas, que é o mínimo que desenha um caminho. Mais do
 * que isso e o rastro passa a cobrir a tela que ele deveria estar apontando.
 *
 * Não é opção: o número é desenho, e quem consome que quisesse outro estaria
 * pedindo outra peça. Quem tiver menos de três passos vê menos marcas, que é o
 * começo de toda sessão.
 */
const TRAIL_LENGTH = 3;

export interface ComputerUseLabels {
  /**
   * A palavra que apresenta o endereço, e que só quem ouve recebe.
   *
   * Sem os pontos de janela — que a folha recusou, e diz por quê —, o que diz
   * "isto é um endereço" é a posição e o tratamento, e nada disso chega a quem
   * não vê a barra. Uma cadeia solta no começo da figura seria texto sem assunto
   * (decisão 8 da folha).
   */
  address: string;
  /**
   * O molde da contagem. `{index}` vira a posição do passo e `{total}` vira
   * quantos são.
   *
   * Molde, e não texto pronto, pela mesma divisão do código de saída do bloco de
   * terminal: a palavra que liga os dois números é do idioma, e os números são
   * dado. O `{index}` já chega contado a partir de um — quem lê conta a partir
   * de um, e deixar a conversão para o molde a espalharia por três idiomas.
   */
  position: string;
}

/**
 * Uma marca do rastro, já pronta para o template.
 *
 * As coordenadas saem daqui como CADEIA, e não como número: `[style.--custom]`
 * com valor numérico faz o Angular anexar "px" à propriedade personalizada, e o
 * `calc(var(--computer-use-mark-x) * 1%)` da folha passaria a receber "86px". É
 * a mesma nota do `NdsProgressIndicator`, do `NdsAspectRatio` e da barra do
 * anexo, e o defeito é silencioso: a marca simplesmente não aparece onde
 * deveria.
 */
interface TrailMark {
  key: string;
  x: string;
  y: string;
  /** `'true'` na ativa, e nada nas outras — a folha lê o atributo. */
  active: string | null;
}

/** A legenda do passo em curso, já escrita. */
interface CaptionText {
  action: string;
  target: string;
  position: string;
}

@Component({
  selector: 'figure[ndsComputerUse]',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-computer-use',
    '[attr.data-slot]': '"computer-use"',
    '[attr.data-status]': 'status()',
    // OCUPADO ENQUANTO CORRE, e só (decisão 1, regra 1 da §8 da guideline 17).
    // Nada aqui é `aria-live`: a legenda troca a cada passo, e uma tela dirigida
    // por agente troca de passo mais depressa do que se lê — anunciar cada uma
    // seria a rajada da saída de terminal com outro nome.
    '[attr.aria-busy]': 'busy()',
  },
  template: `
    <!-- O ENDEREÇO. A monoespaçada anda na MARCAÇÃO, e não nesta folha: ela vem
         de uma utilitária de typography.css, e some em silêncio quando alguém
         copia a árvore pela metade. Por isso a play a AFIRMA. -->
    <p
      class="nds-computer-use-address nds-font-mono"
      data-slot="computer-use-address"
    >
      <!-- A PALAVRA QUE SÓ QUEM OUVE RECEBE (decisão 8). Ela não é enfeite de
           leitor de tela: é o que a barra diz pelo desenho e não conseguiria
           dizer em voz. -->
      <span class="nds-sr-only">{{ labels().address }}</span>

      <!-- lang="en": um endereço é máquina — servidor, caminho, parâmetro. Sem
           isto, a voz do leitor em pt-BR tenta pronunciá-lo como português (WCAG
           3.1.2). Mesma decisão do comando no bloco de terminal. -->
      <span
        class="nds-computer-use-url nds-truncate"
        data-slot="computer-use-url"
        lang="en"
      >{{ url() }}</span>
    </p>

    <div class="nds-computer-use-screen" data-slot="computer-use-screen">
      <!-- A SUPERFÍCIE é o encaixe da tela de quem consome (§1 e §2 da guideline
           17). O outlet INSTANCIA o template recebido; a peça não monta nada
           dentro dele, não escreve e não apaga o texto alternativo do que
           chega. -->
      <div class="nds-computer-use-surface" data-slot="computer-use-surface">
        <ng-container [ngTemplateOutlet]="screen()"></ng-container>
      </div>

      <!-- O RASTRO É UMA CAMADA SÓ, e é ela que sai inteira do que é lido em voz
           (decisão 2) — um aria-hidden por marca seria a mesma decisão repetida
           em tantos lugares quantos forem os passos. Posição numa imagem não
           chega a quem não a vê; o que chega é a legenda, logo abaixo. -->
      @if (trail().length > 0) {
        <span
          class="nds-computer-use-trail"
          data-slot="computer-use-trail"
          aria-hidden="true"
        >
          @for (mark of trail(); track mark.key) {
            <!-- O PONTO É DADO, e entra em propriedade personalizada: não existe
                 token de "62%", e a regra do repositório reserva estilo embutido
                 para mecânica e para propriedade personalizada. A conta de
                 porcentagem fica na folha, que é onde ela pode mudar sem tocar
                 nas cinco stacks. -->
            <span
              class="nds-computer-use-mark"
              data-slot="computer-use-mark"
              [attr.data-active]="mark.active"
              [style.--computer-use-mark-x]="mark.x"
              [style.--computer-use-mark-y]="mark.y"
            ></span>
          }
        </span>
      }
    </div>

    <!-- A LEGENDA é a peça para quem ouve (decisão 2), e é figcaption porque a
         legenda de uma figura É o nome dela: sem isso a tela seria uma imagem
         anônima no meio da conversa. Sem passo nenhum não há legenda — não há o
         que dizer, e uma legenda vazia daria à figura um nome em branco. -->
    @if (caption(); as written) {
      <figcaption
        class="nds-computer-use-caption"
        data-slot="computer-use-caption"
      >
        <!-- O VERBO É O QUE DESCREVE, e por isso carrega o peso e a cor de texto
             — mesma divisão do nome e do detalhe da chamada de ferramenta. -->
        <span
          class="nds-computer-use-action"
          data-slot="computer-use-action"
        >{{ written.action }}</span>

        <span
          class="nds-computer-use-target nds-truncate"
          data-slot="computer-use-target"
        >{{ written.target }}</span>

        <!-- A CONTAGEM É NÚMERO, e chega a quem ouve: ela não se reescreve
             sozinha — quem a muda é um passo novo —, então não é o relógio de
             que esta folha se defende. É também a única parte da peça que diz
             que existe uma SEQUÊNCIA: o rastro diz isso pelo desenho, e o
             desenho não é lido. -->
        <span
          class="nds-computer-use-position"
          data-slot="computer-use-position"
        >{{ written.position }}</span>
      </figcaption>
    }
  `,
})
export class NdsComputerUse {
  /** O endereço da tela que está sendo dirigida. */
  readonly url = input.required<string>();

  /**
   * A tela, que é ESPAÇO de quem consome.
   *
   * Obrigatória: a moldura não tem nada para mostrar por baixo do rastro até que
   * alguém a passe. A peça não cria imagem nenhuma (§1 da guideline 17), e não
   * escreve nem apaga o texto alternativo do que recebe.
   */
  readonly screen = input.required<TemplateRef<unknown>>();

  /**
   * Os passos da sessão, na ordem em que aconteceram.
   *
   * Sem passo nenhum não há rastro nem legenda: sobra a moldura com o endereço e
   * a tela, que é o que existe antes de o agente tocar em qualquer coisa.
   */
  readonly steps = input<readonly ComputerStep[]>([]);

  /**
   * Qual passo está acontecendo agora.
   *
   * Índice, e não fatia — e a diferença importa. A revelação aos poucos é
   * recorte de quem consome, como em toda esta família; mas a legenda diz
   * "3 de 6", e o total não sobrevive a uma fatia. Fora de alcance é preso ao
   * alcance, para que incrementar além do último passo continue apontando para
   * um passo de verdade.
   */
  readonly activeIndex = input<number>(0);

  /**
   * Em que pé está a sessão. Quem dirige é quem sabe, e é quem passa.
   *
   * Decide se a peça se declara ocupada e se a marca ativa pulsa. Não decide cor
   * de marca: estado por cor sobre uma tela de terceiro é a codificação que a
   * legenda substitui.
   */
  readonly status = input<RunStatus>('idle');

  /** O texto da peça. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ComputerUseLabels>();

  /** A peça se declara ocupada enquanto corre, e em nenhum outro momento. */
  protected readonly busy = computed(() => (this.status() === 'running' ? 'true' : null));

  /**
   * O índice PRESO ao alcance, e não recusado.
   *
   * Quem avança uma sessão incrementa um número, e o passo seguinte ao último é
   * o último. Recusar deixaria a tela sem marca justamente quando a sessão
   * acabou de terminar.
   */
  private readonly clamped = computed(() => {
    const total = this.steps().length;
    return Math.min(Math.max(this.activeIndex(), 0), Math.max(total - 1, 0));
  });

  /** As marcas do rastro, do mais antigo para o mais recente. */
  protected readonly trail = computed<TrailMark[]>(() => {
    const steps = this.steps();
    if (steps.length === 0) return [];

    const active = this.clamped();
    const from = Math.max(active - (TRAIL_LENGTH - 1), 0);
    const marks: TrailMark[] = [];
    for (let i = from; i <= active; i++) {
      const step = steps[i]!;
      marks.push({
        key: step.id ?? String(i),
        x: String(step.x),
        y: String(step.y),
        active: i === active ? 'true' : null,
      });
    }
    return marks;
  });

  /** A legenda do passo em curso, ou nada quando não há passo. */
  protected readonly caption = computed<CaptionText | null>(() => {
    const steps = this.steps();
    if (steps.length === 0) return null;

    const index = this.clamped();
    const step = steps[index]!;
    return {
      action: step.action,
      target: step.target,
      position: this.labels()
        .position.replace('{index}', String(index + 1))
        .replace('{total}', String(steps.length)),
    };
  });
}
