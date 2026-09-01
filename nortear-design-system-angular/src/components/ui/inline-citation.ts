import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { Citation } from '@shared/primitives/chat-protocol';
// O sanitizador de endereço entra pelo NOME, e o campo abaixo o expõe ao
// template sem invólucro: uma varredura estática precisa achar
// `isSafeUrl(citation().source.url)` ligado ao símbolo importado. Mesma decisão
// do `chat-thread` e do `markdown` desta stack.
import { isSafeUrl } from '@shared/primitives/markdown-ast';

// ─── InlineCitation ───────────────────────────────────────────────────────────
//
// A marca numerada que liga uma frase à fonte em que ela se apoia.
//
// Desenho em docs/shared/styles/nds/evidencia.css, no bloco "Citação em linha",
// que também guarda as dez decisões de acessibilidade e o eixo da família. O
// vocabulário — `Citation`, `ChatSource` — vem de
// `@shared/primitives/chat-protocol`.
//
// POR QUE ELA NÃO É O CARTÃO DE PONTEIRO desta base, e a pergunta veio antes de
// qualquer desenho:
//
//   · ELA VIVE DENTRO DE TEXTO CORRIDO, e isso é geometria própria. A marca
//     interrompe um parágrafo: assenta na linha de base sem esticar a
//     entrelinha, não se separa da palavra que a antecede quando a linha quebra,
//     e mesmo assim oferece um alvo de toque de 24 px. As três exigências brigam
//     entre si, e nenhuma classe desta base as concilia — as irmãs desenham
//     listas e caixas, onde a altura do elemento é livre porque não há linha de
//     texto em volta dele.
//   · TOQUE NÃO TEM PONTEIRO. O cartão de ponteiro abre por `mouseenter` e por
//     `focus`, com 600 ms de espera. Em telefone o primeiro não existe; e
//     percorrer com Tab um parágrafo de cinco citações pelo segundo abriria
//     cinco painéis, um por parada de tabulação.
//
// É POR ISSO QUE A PEÇA NÃO USA O `hover-card` NEM O `popover` do
// `@radix-ng/primitives`. Aquele nasce `role="dialog"` — e papel de diálogo
// exige nome acessível, que ele tira do texto do gatilho: com um gatilho cuja
// legenda é "1", o resultado seria um diálogo chamado "1" (decisão 1 da folha).
// Aquele também portala o conteúdo para fora da raiz, e a caixa portalada tira o
// link do título da ordem de tabulação (decisão 6). A marcação é própria, e é a
// mesma das outras quatro stacks.
//
// O QUE O COMPONENTE NÃO FAZ: buscar a fonte, resolver o endereço, recortar o
// trecho, escrever a frase, numerar as marcas de uma página ou decidir se duas
// podem estar abertas ao mesmo tempo. Ele desenha o que recebe (§2 da guideline
// 17).
//
// A RAIZ É UM ELEMENTO EM LINHA, e por isso o seletor é de ATRIBUTO em `span`.
// A escolha do elemento é da folha e não desta stack: a marca entra no meio de
// um parágrafo, e um seletor de elemento (`<nds-inline-citation>`) somaria uma
// caixa sem papel entre o texto e a marca — as cinco stacks deixariam de
// renderizar a mesma árvore. Com o atributo, o host É a raiz
// `.nds-inline-citation`, que a folha declara `position: relative`, e a caixa
// nasce dentro dele como IRMÃ IMEDIATA do botão. Mesma escolha do
// `div[ndsTerminalBlock]`, do `figure[ndsComputerUse]` e do `p[ndsAgentStatus]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - a saída se chama `openChange`, e não `onOpenChange`: nesta stack o prefixo
//     `on` é do LISTENER (`(openChange)="…"`), e um `output` chamado
//     `onOpenChange` viraria `(onOpenChange)` no ponto de uso. Mesma escolha do
//     `action` do estado da execução e do `choose` do cartão de aprovação.
//   - o COMANDO chega por método público na instância, e não por um objeto
//     devolvido: quem controla de fora alcança a peça por `viewChild` e chama
//     `open()`, `close()`, `toggle()` e `isOpen()`. É a forma que esta stack tem
//     de ser controlada por comando, e é ela que a exclusão mútua usa.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento. Mesma escolha do bloco de terminal.
//   - as entradas são `input()` de signal, então a citação chega por
//     `[citation]="citacao"` e o padrão de `defaultOpen` mora na declaração.

/**
 * Escopo de id por instância.
 *
 * O botão aponta para a caixa por `aria-controls`, e o atributo resolve para o
 * PRIMEIRO id do documento: ids derivados do índice colidiriam na hora em que
 * duas frases da mesma página citassem a fonte 1, e a segunda marca passaria a
 * apontar para a caixa da primeira. Contador de módulo, e não
 * `crypto.randomUUID()`: id curto e estável aparece legível no atributo e não
 * polui o diff de snapshot. Mesma precaução do `sequencia` do bloco de terminal.
 */
let sequencia = 0;

/**
 * Espera antes de abrir ao passar o ponteiro.
 *
 * Menor que os 600 ms do cartão de ponteiro, e de propósito: lá o gatilho é um
 * nome de pessoa ou um link, e abrir cedo demais atrapalha quem só atravessa a
 * frase; aqui o gatilho é uma marca deliberadamente pequena, difícil de pegar
 * por acidente. Quem parou o ponteiro em cima dela quis parar.
 */
const OPEN_DELAY = 300;

/**
 * Espera antes de fechar depois que o ponteiro sai.
 *
 * Dá tempo de atravessar o vão entre a marca e a caixa. Mesmo valor do cartão de
 * ponteiro, e pelo mesmo motivo.
 */
const CLOSE_DELAY = 300;

/**
 * Folga entre a caixa e a borda da janela, em pixels.
 *
 * Número mecânico, e não valor de desenho: ele não pinta nada e não entra em
 * folha nenhuma — é o limite contra o qual a caixa é empurrada de volta para
 * dentro da tela.
 */
const VIEWPORT_GUTTER = 8;

export interface InlineCitationLabels {
  /**
   * O nome acessível da marca, JÁ ESCRITO.
   *
   * O que se vê é um número, e "1" sozinho não diz nada a quem ouve. O nome
   * chega escrito porque junta três coisas que só quem monta conhece — a palavra
   * para "fonte", o número e o título do documento —, e a ordem entre elas troca
   * com o idioma.
   *
   * Ele PRECISA conter o número que a marca mostra (WCAG 2.5.3, rótulo no nome),
   * e é por isso que quem o escreve recebe o número junto no andaime. O
   * componente NUNCA monta esse nome.
   */
  marker: string;
  /**
   * O que se diz no lugar do endereço quando ele foi recusado.
   *
   * Endereço recusado não é um lugar, e imprimi-lo responderia com ruído a
   * pergunta que a linha existe para responder — de onde isto vem. O título
   * continua legível; o que sai é o link e o endereço.
   */
  unsafeSource: string;
}

@Component({
  selector: 'span[ndsInlineCitation]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-inline-citation',
    '[attr.data-slot]': '"inline-citation"',
  },
  // NADA AQUI É REGIÃO VIVA (decisão da folha, regra 1 da §8 da guideline 17):
  // nenhum `aria-live`, nenhum `role="status"`, nenhum `role="alert"` e nenhum
  // `role="log"`. Evidência chega junto com a resposta, e a resposta está sendo
  // lida ao lado — quem ouve recebe o estado por `aria-expanded`, que é palavra
  // e não cor (WCAG 1.4.1).
  //
  // A CAIXA É IRMÃ IMEDIATA DO BOTÃO, dentro do host. Nada de portal e nada de
  // sobreposição do CDK: é isso que faz o Tab sair da marca e alcançar o link do
  // título sem nada mover o foco (decisão 6), e é isso que deixa o
  // posicionamento inteiro na folha, ancorado no `position: relative` da raiz.
  template: `
    <button
      class="nds-inline-citation-marker"
      data-slot="inline-citation-marker"
      type="button"
      [id]="markerId"
      [attr.aria-expanded]="opened() ? 'true' : 'false'"
      [attr.aria-controls]="panelId"
      [attr.aria-label]="labels().marker"
      (click)="onMarkerClick()"
      (mouseenter)="scheduleShow()"
      (mouseleave)="scheduleHide()"
      #marker
    >{{ index() }}</button>

    <!-- SÓ EXISTE ENQUANTO ABERTA. Fechada, ela não deixa parada de tabulação
         para trás: o link do título deixa de existir, em vez de existir
         escondido.

         O elemento é SPAN, e nunca DIV: a marca vive dentro de um parágrafo, e
         "p" só aceita conteúdo de frase — um "div" aqui fecharia o parágrafo
         antes da metade da frase, e o resto do texto viraria irmão dele em vez
         de continuação. A superfície é a compartilhada, cujo flex blocifica os
         filhos, então nada se perde no desenho.

         data-side nasce em "bottom" e é a ÚNICA coisa que o código reescreve
         além do empurrão: a folha posiciona, e o método abaixo só mede. -->
    @if (opened()) {
      <span
        class="nds-popover-content nds-inline-citation-panel"
        data-slot="inline-citation-panel"
        data-side="bottom"
        [id]="panelId"
        (mouseenter)="cancelHide()"
        (mouseleave)="scheduleHide()"
        #panel
      >
        <!-- O ENDEREÇO VEM DE QUEM GEROU A RESPOSTA, e endereço vindo dali é
             ENTRADA: "javascript:" num href executa. A pergunta é feita NO PONTO
             em que o endereço encosta no DOM, e não antes — nesta stack ela é a
             única guarda que existe, porque a regra href_unvalidated do auditor
             só enxerga JSX.

             O MONOESPAÇADO SÓ ENTRA QUANDO A LINHA É MESMO UM ENDEREÇO. Recusado,
             o que fica ali são PALAVRAS. -->
        @if (isSafeUrl(citation().source.url)) {
          <span
            class="nds-inline-citation-address nds-font-mono nds-truncate"
            data-slot="inline-citation-address"
          >{{ citation().source.url }}</span>
        } @else {
          <span
            class="nds-inline-citation-address"
            data-slot="inline-citation-address"
          >{{ labels().unsafeSource }}</span>
        }

        <!-- O TÍTULO CONTINUA LEGÍVEL quando o endereço foi recusado, e deixa de
             ser link: não há para onde ir, e um link que não leva a lugar nenhum
             é uma parada de tabulação sem destino. -->
        @if (isSafeUrl(citation().source.url)) {
          <a
            class="nds-inline-citation-title"
            data-slot="inline-citation-title"
            [href]="citation().source.url"
            rel="noreferrer"
          >{{ citation().source.title }}</a>
        } @else {
          <span
            class="nds-inline-citation-title"
            data-slot="inline-citation-title"
            data-unsafe=""
          >{{ citation().source.title }}</span>
        }

        <!-- O TRECHO É UMA CITAÇÃO, e "q" é o elemento que diz isso — com as
             aspas do idioma vindo do navegador em vez de escritas no texto, que
             é o mesmo motivo pelo qual nenhum glifo entra na translations.json.
             O atributo cite leva o endereço só quando ele passou, porque ele é
             um endereço como o href. -->
        @if (citation().excerpt; as excerpt) {
          <q
            class="nds-inline-citation-excerpt"
            data-slot="inline-citation-excerpt"
            [attr.cite]="isSafeUrl(citation().source.url) ? citation().source.url : null"
          >{{ excerpt }}</q>
        }

        <!-- ONDE DENTRO DA FONTE — página, âncora, intervalo de linhas. Chega
             escrito, porque "12" sozinho não é um lugar e o que precede o número
             é idioma. Ausente, NADA é montado no lugar: nem traço, nem espaço
             reservado. -->
        @if (citation().anchor; as anchor) {
          <span
            class="nds-inline-citation-anchor"
            data-slot="inline-citation-anchor"
          >{{ anchor }}</span>
        }
      </span>
    }
  `,
})
export class NdsInlineCitation {
  /**
   * A citação: a fonte, o trecho e onde dentro dela.
   *
   * Vem inteira de `@shared/primitives/chat-protocol`. `excerpt` e `anchor` são
   * opcionais lá e continuam opcionais aqui: quem cita um documento sem saber a
   * página tem uma citação legítima, e a caixa simplesmente não monta a parte
   * que não veio — nunca um traço no lugar dela.
   */
  readonly citation = input.required<Citation>();

  /**
   * O número que a marca mostra.
   *
   * É CONTEÚDO, e não decoração: é por ele que a frase se refere à fonte, e é
   * ele que amarra a marca à lista de fontes do turno. Quem numera é quem
   * escreve a frase — uma marca que se numerasse sozinha precisaria conhecer as
   * irmãs, e marcas irmãs podem nem estar no mesmo parágrafo.
   */
  readonly index = input.required<number>();

  /** O texto da peça. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<InlineCitationLabels>();

  /**
   * Nasce com a prévia aberta.
   *
   * Serve para fotografar o estado; no uso corrente quem abre é quem lê. Lido
   * UMA vez, na primeira renderização: é o equivalente não controlado, e quem
   * quiser mandar depois disso usa o comando.
   */
  readonly defaultOpen = input(false);

  /**
   * Cada abertura e cada fechamento, para quem controla de fora.
   *
   * É por aqui que quem monta a página fecha uma prévia irmã ao abrir esta — a
   * peça não conhece as vizinhas, e não conhecê-las é o que permite que duas
   * marcas da mesma frase venham de lugares diferentes da resposta.
   */
  readonly openChange = output<boolean>();

  /**
   * A validação de endereço, no ponto em que ele encosta no DOM.
   *
   * O campo é o próprio símbolo importado, e não um invólucro: um invólucro
   * local esconderia o sanitizador da análise estática, que é o que ela precisa
   * achar (guideline 09).
   */
  protected readonly isSafeUrl = isSafeUrl;

  /** O id do botão, por instância. */
  protected readonly markerId = `nds-inline-citation-${(sequencia += 1)}`;

  /** O id da caixa — é ele que o botão aponta por `aria-controls`. */
  protected readonly panelId = `${this.markerId}-panel`;

  /** Aberta ou fechada. É daqui que sai `aria-expanded`. */
  protected readonly opened = signal(false);

  private readonly markerRef = viewChild.required<ElementRef<HTMLButtonElement>>('marker');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** Necessário para agendar `afterNextRender` fora do contexto de injeção. */
  private readonly injector = inject(Injector);

  /**
   * Quem abriu.
   *
   * `pointer` fecha sozinho quando o ponteiro sai; `control` fica até alguém
   * fechar. Sem essa distinção, a caixa aberta por clique sumiria ao primeiro
   * movimento do mouse — e quem abriu por toque veria a prévia piscar.
   */
  private openedBy: 'pointer' | 'control' = 'pointer';

  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Escape fecha e o foco NÃO se move.
   *
   * Ele já está na marca, que é de onde a caixa saiu (WCAG 2.1.2, e a regra 2 da
   * §8 da guideline 17). A chamada a `focus()` é para o caso de o foco ter
   * entrado na caixa: fechada, ela sai da árvore, e o foco precisa voltar para
   * onde estava — nunca para o começo do documento.
   */
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    this.hide();
    this.markerRef().nativeElement.focus();
  };

  /** Ponteiro fora da raiz fecha. Dentro dela, nada acontece. */
  private readonly onOutsidePointer = (event: Event): void => {
    const target = event.target;
    if (target instanceof Node && this.host.nativeElement.contains(target)) return;
    this.hide();
  };

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Os dois ouvintes de documento e os dois temporizadores só existem enquanto
    // a caixa está aberta, e `hide()` solta os quatro. Quem tira a marca da
    // página com a caixa aberta não passa por `hide()` — este é o caminho que
    // passa.
    inject(DestroyRef).onDestroy(() => {
      this.clearTimers();
      this.detach();
    });

    // `afterNextRender` e não uma chamada direta: `defaultOpen` é lido depois de
    // a vista existir, e abrir aqui já deixa a caixa montada no quadro seguinte.
    afterNextRender(() => {
      if (!this.defaultOpen()) return;
      this.openedBy = 'control';
      this.show();
    });
  }

  // ─── O comando ──────────────────────────────────────────────────────────────
  //
  // É a forma que esta stack tem de ser controlada: quem controla alcança a peça
  // por `viewChild` e chama o método; a peça devolve cada mudança por
  // `openChange`. É esse par que resolve a exclusão mútua entre marcas, e é ele
  // que a peça oferece EM VEZ de conhecer as vizinhas.

  /** Abre a prévia, e ela fica até alguém fechar. */
  open(): void {
    this.openedBy = 'control';
    this.show();
  }

  /** Fecha a prévia. */
  close(): void {
    this.hide();
  }

  /** Abre se estiver fechada, fecha se estiver aberta. */
  toggle(): void {
    this.openedBy = 'control';
    if (this.opened()) this.hide();
    else this.show();
  }

  /** A prévia está montada? */
  isOpen(): boolean {
    return this.opened();
  }

  // ─── Ponteiro, toque e teclado ──────────────────────────────────────────────
  //
  // O CLIQUE ABRE, e nenhum dos três meios fica de fora: em toque ele é o único
  // que existe, e no teclado ele é o que Enter e Espaço já disparam num botão. O
  // ponteiro ganha a abertura por espera como CONVENIÊNCIA, nunca como único
  // caminho — nada nesta peça existe só no `:hover` (regra 3 da §8).
  //
  // A MARCA NÃO ABRE POR FOCO, e é a divergência deliberada em relação ao cartão
  // de ponteiro: percorrer com Tab um parágrafo de cinco citações abriria cinco
  // caixas, uma por parada, e caixa aberta sem ninguém pedir cobre o texto que a
  // pessoa estava lendo (decisão 4 da folha).

  protected onMarkerClick(): void {
    this.clearTimers();
    this.toggle();
  }

  protected scheduleShow(): void {
    this.cancelHide();
    if (this.opened()) return;
    this.openTimer = setTimeout(() => {
      this.openedBy = 'pointer';
      this.show();
    }, OPEN_DELAY);
  }

  protected scheduleHide(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    // Aberta por controle, o ponteiro que sai não fecha: quem clicou pediu que
    // ficasse, e em toque não há "sair" nenhum para desfazer o pedido.
    if (this.openedBy === 'control') return;
    this.closeTimer = setTimeout(() => this.hide(), CLOSE_DELAY);
  }

  protected cancelHide(): void {
    if (this.closeTimer === null) return;
    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  // ─── Montar e desmontar ─────────────────────────────────────────────────────

  private show(): void {
    this.clearTimers();
    if (this.opened()) return;

    this.opened.set(true);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('pointerdown', this.onOutsidePointer, true);

    // UMA VEZ POR ABERTURA, e depois de o layout existir: encaixar exige o
    // retângulo da marca e o da caixa, e eles só existem depois de a caixa
    // entrar no documento. `afterNextRender` e nunca espera por observador de
    // mutação — leitura que provoca a própria reavaliação é a armadilha que
    // pendura a aba (regra do `waitFor` no CLAUDE.md raiz).
    afterNextRender(() => this.fitPanel(), { injector: this.injector });

    this.openChange.emit(true);
  }

  private hide(): void {
    this.clearTimers();
    if (!this.opened()) return;

    this.detach();
    this.opened.set(false);
    this.openChange.emit(false);
  }

  private detach(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('pointerdown', this.onOutsidePointer, true);
  }

  private clearTimers(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    this.cancelHide();
  }

  /**
   * Empurra a caixa de volta para dentro da janela, e escolhe o lado.
   *
   * A FOLHA POSICIONA; este método só MEDE, e devolve o resultado por uma custom
   * property e por um atributo. É a divisão que mantém o desenho na folha: sem
   * ela, o deslocamento viraria `left` em `style` inline, e no dia em que a
   * folha mudasse a largura da caixa o número inline continuaria o mesmo.
   *
   * Os dois valores são escritos no elemento em vez de saírem de um signal, e é
   * de propósito: a medida do segundo depende de o primeiro já estar aplicado, e
   * um binding só chega ao DOM na detecção seguinte — a caixa seria medida onde
   * ela ainda não está. É também o que evita dois donos para o mesmo atributo.
   */
  private fitPanel(): void {
    const panelRef = this.panelRef();
    if (panelRef === undefined) return;

    const panel = panelRef.nativeElement;
    const marker = this.markerRef().nativeElement;

    panel.style.removeProperty('--nds-inline-citation-shift');
    panel.dataset['side'] = 'bottom';

    const markerRect = marker.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    // ABAIXO NÃO CABE? Abre para cima — e só quando ACIMA cabe. Sem a segunda
    // metade da pergunta, uma marca numa janela baixa trocaria um transbordo por
    // outro, e o de cima é pior: a caixa cobriria a frase que se estava lendo.
    const roomBelow = window.innerHeight - markerRect.bottom - VIEWPORT_GUTTER;
    if (panelRect.height > roomBelow && markerRect.top > panelRect.height + VIEWPORT_GUTTER) {
      panel.dataset['side'] = 'top';
    }

    // O DESVIO HORIZONTAL é medido depois do lado, com a caixa já onde vai
    // ficar. Só a componente horizontal é empurrada: a vertical já foi resolvida
    // pelo lado, e empurrar as duas faria a caixa descolar da marca que a abriu.
    const placed = panel.getBoundingClientRect();
    let shift = 0;
    if (placed.right > window.innerWidth - VIEWPORT_GUTTER) {
      shift = window.innerWidth - VIEWPORT_GUTTER - placed.right;
    }
    if (placed.left + shift < VIEWPORT_GUTTER) {
      shift = VIEWPORT_GUTTER - placed.left;
    }
    if (shift !== 0) {
      panel.style.setProperty('--nds-inline-citation-shift', `${Math.round(shift)}px`);
    }
  }
}
