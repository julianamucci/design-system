import type { Citation } from '@shared/primitives/chat-protocol';
import { isSafeUrl } from '@shared/primitives/markdown-ast';
import { cn } from '@/lib/utils';
import { tornarDestruivel, type Destroyable } from '@/lib/destroy';

/**
 * A marca numerada que liga uma frase à fonte em que ela se apoia.
 *
 * Desenho em `nds/evidencia.css`, no bloco "Citação em linha", que também
 * guarda as decisões de acessibilidade e o eixo da família.
 *
 * A TRIAGEM VEIO ANTES DO DESENHO, e a pergunta que a abre é a mais barata de
 * todas: isto é mais do que um cartão de ponteiro com título e link? A resposta
 * é sim, e por duas razões que nenhum painel flutuante genérico resolve.
 *
 *   - ELA VIVE DENTRO DE TEXTO CORRIDO, e isso é GEOMETRIA PRÓPRIA. A marca
 *     interrompe um parágrafo: precisa assentar na linha de base sem esticar a
 *     entrelinha, não pode se separar da palavra que a antecede quando a linha
 *     quebra, e mesmo assim precisa de um alvo de toque de 24 px (WCAG 2.5.8).
 *     As três exigências brigam entre si, e nenhuma classe desta base as
 *     concilia — as irmãs desenham listas e caixas, onde a altura do elemento é
 *     livre porque não há linha de texto em volta dele.
 *   - TOQUE NÃO TEM PONTEIRO. Uma citação que só abrisse ao passar o mouse
 *     seria invisível em telefone, e a regra 3 da §8 da guideline 17 é literal
 *     a respeito. O cartão de ponteiro desta base abre por `mouseenter` e por
 *     `focus`, com 600 ms de espera — desenho certo para uma prévia de link e
 *     errado para uma marca de referência: percorrer com Tab um parágrafo de
 *     cinco citações abriria cinco painéis, um por parada.
 *
 * O QUE ESTA PEÇA CORRIGE NA FONTE, e a correção está escrita na §5.3 da
 * guideline: lá a raiz é um PARÁGRAFO FIXO com dois pontos de ancoragem, e o
 * texto da frase mora no arquivo instalado em vez de chegar por propriedade —
 * a própria fonte manda editá-lo à mão. Isso não é componente, é espécime.
 * Aqui a peça é a MARCA, autônoma (§4.2 da guideline 17): quem escreve a frase
 * a põe onde a afirmação precisa dela, e o design system não fica dono do texto
 * da resposta, que é do modelo e é desenhado pelo Markdown ou pela conversa.
 *
 * Disso sai a segunda correção: `openIndex: number | null` na fonte vira
 * `open`/`onOpenChange` por marca. Um índice único é a conveniência de um
 * espécime que só sabe ancorar duas marcas — a própria fonte diz que índices
 * além de 0 e 1 "não têm onde se prender" —, e ele não consegue endereçar marca
 * que não seja posição de arranjo. Exclusão mútua entre marcas é decisão de
 * quem monta a página, e a §2 já a entrega a ele.
 *
 * O VOCABULÁRIO NÃO É NOVO, e é isso que diz que a fundação está certa:
 * `Citation` e `ChatSource` já descrevem tudo, e descrevem MELHOR. A fonte
 * declara `Source { domain, title, snippet }`, que guarda o trecho DENTRO da
 * fonte; o docblock de `Citation` já escreveu por que ele mora na citação, e o
 * defeito aparece aqui inteiro — três citações do mesmo documento repetiriam o
 * documento três vezes na lista de fontes. E `domain` é o endereço achatado em
 * cadeia de exibição: perde o `url`, que é justamente o que faz uma procedência
 * ser verificável.
 *
 * O QUE O COMPONENTE NÃO FAZ: buscar a fonte, resolver o endereço, recortar o
 * trecho, numerar as marcas de uma página, decidir se duas podem estar abertas
 * ao mesmo tempo. Ele desenha o que recebe (§2 da guideline 17).
 */

export interface InlineCitationLabels {
  /**
   * O nome acessível da marca, JÁ ESCRITO.
   *
   * O que se vê é um número, e "1" sozinho não diz nada a quem ouve. O nome
   * chega escrito porque junta três coisas que só quem monta conhece — a
   * palavra para "fonte", o número e o título do documento —, e a ordem entre
   * elas troca com o idioma. Mesmo precedente das medidas escritas do tempo da
   * resposta.
   *
   * Ele PRECISA conter o número que a marca mostra (WCAG 2.5.3, rótulo no
   * nome), e é por isso que quem o escreve recebe o número junto no andaime.
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

export interface InlineCitationOptions {
  /**
   * A citação: a fonte, o trecho e onde dentro dela.
   *
   * Vem inteira de `@shared/primitives/chat-protocol`. `excerpt` e `anchor` são
   * opcionais lá e continuam opcionais aqui: quem cita um documento sem saber a
   * página tem uma citação legítima, e a caixa simplesmente não monta a parte
   * que não veio — nunca um traço no lugar dela.
   */
  citation: Citation;
  /**
   * O número que a marca mostra.
   *
   * É CONTEÚDO, e não decoração: é por ele que a frase se refere à fonte, e é
   * ele que amarra a marca à lista de fontes do turno. Mesma decisão que a
   * conversa já tomou ao numerar as fontes pelo `<ol>` em vez de por um
   * `::before`.
   *
   * Quem numera é quem escreve a frase. Uma marca que se numerasse sozinha
   * precisaria conhecer as irmãs, e marcas irmãs podem nem estar no mesmo
   * parágrafo.
   */
  index: number;
  /** Abre já montada — o equivalente não controlado das outras stacks. */
  defaultOpen?: boolean;
  /** Cada abertura e cada fechamento, para quem controla de fora. */
  onOpenChange?: (open: boolean) => void;
  labels: InlineCitationLabels;
  class?: string;
}

/**
 * A marca, com os comandos que o modo controlado precisa.
 *
 * É a forma que uma fábrica tem de ser controlada: não há propriedade reativa
 * para observar, então quem controla chama `open()`/`close()` e recebe cada
 * mudança de volta por `onOpenChange`. Mesma forma do cartão de ponteiro desta
 * base.
 */
export type InlineCitationElement = HTMLElement & Destroyable & {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
};

let counter = 0;

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
 * Dá tempo de atravessar o vão entre a marca e a caixa. Mesmo valor do cartão
 * de ponteiro, e pelo mesmo motivo.
 */
const CLOSE_DELAY = 300;

/**
 * Folga entre a caixa e a borda da janela, em pixels.
 *
 * Número mecânico, e não valor de desenho: ele não pinta nada e não entra em
 * folha nenhuma — é o limite contra o qual a caixa é empurrada de volta para
 * dentro da tela. Mesmo papel do `gap` do cartão de ponteiro.
 */
const VIEWPORT_GUTTER = 8;

/**
 * Empurra a caixa de volta para dentro da janela, e escolhe o lado.
 *
 * A FOLHA POSICIONA; esta função só MEDE, e devolve o resultado por uma custom
 * property e por um atributo. É a divisão que mantém o desenho na folha: sem
 * ela, o deslocamento viraria `left` em `style` inline, e no dia em que a folha
 * mudasse a largura da caixa o número inline continuaria o mesmo.
 *
 * Roda uma vez por abertura, e fora de qualquer espera com observador de
 * mutação — ela LÊ layout, e leitura que provoca a própria reavaliação é a
 * armadilha que pendura a aba (regra do `waitFor` no CLAUDE.md raiz).
 */
function fitPanel(marker: HTMLElement, panel: HTMLElement): void {
  panel.style.removeProperty('--nds-inline-citation-shift');
  panel.dataset.side = 'bottom';

  const markerRect = marker.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();

  // ABAIXO NÃO CABE? Abre para cima — e só quando ACIMA cabe. Sem a segunda
  // metade da pergunta, uma marca numa janela baixa trocaria um transbordo por
  // outro, e o de cima é pior: a caixa cobriria a frase que se estava lendo.
  const roomBelow = window.innerHeight - markerRect.bottom - VIEWPORT_GUTTER;
  if (panelRect.height > roomBelow && markerRect.top > panelRect.height + VIEWPORT_GUTTER) {
    panel.dataset.side = 'top';
  }

  // O DESVIO HORIZONTAL é medido depois do lado, com a caixa já onde vai ficar.
  // Só a componente horizontal é empurrada: a vertical já foi resolvida pelo
  // lado, e empurrar as duas faria a caixa descolar da marca que a abriu.
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

/** O endereço, o título, o trecho e o lugar dentro da fonte. */
function buildPanel(
  id: string,
  citation: Citation,
  labels: InlineCitationLabels,
): HTMLElement {
  // `<span>`, e não `<div>`: a marca vive dentro de um parágrafo, e `<p>` só
  // aceita conteúdo de frase. Um `<div>` aqui fecharia o parágrafo antes da
  // metade da frase, e o resto do texto viraria irmão do parágrafo em vez de
  // continuação dele. Dentro de uma caixa flexível todo filho é blocado de
  // qualquer jeito, então nada se perde no desenho.
  const panel = document.createElement('span');
  panel.id = id;
  // A SUPERFÍCIE É A COMPARTILHADA, e a fonte declara a dela do mesmo jeito —
  // "a marca e a prévia leem a superfície `floating` compartilhada". Fundo,
  // borda, raio, sombra e respiro vêm do painel ancorado desta base; o que a
  // folha desta família acrescenta é o que só a citação tem.
  panel.className = 'nds-popover-content nds-inline-citation-panel';
  panel.dataset.slot = 'inline-citation-panel';

  // A CAIXA NÃO É UM DIÁLOGO, e é a diferença mais visível para o cartão de
  // ponteiro desta base: aquele nasce `role="dialog"`, e papel de diálogo exige
  // nome acessível — que ele tira do texto do gatilho. Com um gatilho cujo texto
  // é "1", o resultado seria um diálogo chamado "1". Aqui a caixa é o conteúdo
  // de um botão que se expande, ligada por `aria-controls`, sem papel próprio.

  // O ENDEREÇO VEM DE QUEM GEROU A RESPOSTA, e endereço vindo dali é ENTRADA:
  // `javascript:` num `href` executa. A pergunta é feita no ponto em que o
  // endereço encosta no DOM, e não antes — mesma decisão da lista de fontes da
  // conversa e do Markdown. Aqui ela é explícita porque a regra
  // `href_unvalidated` do auditor só enxerga JSX.
  const safe = isSafeUrl(citation.source.url);

  const address = document.createElement('span');
  // O MONOESPAÇADO SÓ ENTRA QUANDO A LINHA É MESMO UM ENDEREÇO. Recusado, o que
  // fica ali são PALAVRAS — endereço recusado não é um lugar, e imprimi-lo
  // responderia com ruído a pergunta que a linha existe para responder.
  address.className = safe
    ? 'nds-inline-citation-address nds-font-mono nds-truncate'
    : 'nds-inline-citation-address';
  address.dataset.slot = 'inline-citation-address';
  address.textContent = safe ? citation.source.url : labels.unsafeSource;
  panel.appendChild(address);

  // O TÍTULO CONTINUA LEGÍVEL quando o endereço foi recusado, e deixa de ser
  // link: não há para onde ir, e um link que não leva a lugar nenhum é uma
  // parada de tabulação sem destino.
  const title = document.createElement(safe ? 'a' : 'span');
  title.className = 'nds-inline-citation-title';
  title.dataset.slot = 'inline-citation-title';
  title.textContent = citation.source.title;
  if (title instanceof HTMLAnchorElement) {
    title.href = citation.source.url;
    title.rel = 'noreferrer';
  } else {
    title.dataset.unsafe = '';
  }
  panel.appendChild(title);

  // O TRECHO É UMA CITAÇÃO, e `<q>` é o elemento que diz isso — com as aspas do
  // idioma vindo do navegador em vez de escritas no texto, que é o mesmo motivo
  // pelo qual nenhum glifo entra na `translations.json`. `cite` leva o endereço
  // só quando ele passou, porque o atributo é um endereço como o `href`.
  if (citation.excerpt) {
    const quote = document.createElement('q');
    quote.className = 'nds-inline-citation-excerpt';
    quote.dataset.slot = 'inline-citation-excerpt';
    quote.textContent = citation.excerpt;
    if (safe) quote.cite = citation.source.url;
    panel.appendChild(quote);
  }

  // ONDE DENTRO DA FONTE — página, âncora, intervalo de linhas. Chega escrito,
  // porque "12" sozinho não é um lugar e o que precede o número é idioma.
  if (citation.anchor) {
    const place = document.createElement('span');
    place.className = 'nds-inline-citation-anchor';
    place.dataset.slot = 'inline-citation-anchor';
    place.textContent = citation.anchor;
    panel.appendChild(place);
  }

  return panel;
}

export function createInlineCitation(options: InlineCitationOptions): InlineCitationElement {
  const { citation, index, defaultOpen = false, onOpenChange, labels } = options;

  const id = `inline-citation-${++counter}`;
  const panelId = `${id}-panel`;

  // A RAIZ É UM `<span>` EM LINHA, e a caixa é FILHA dela — não um portal para
  // o `body`. Duas coisas dependem disso, e as duas são desta peça:
  //
  //   · A ORDEM DE TABULAÇÃO fica natural. Da marca, o Tab entra na caixa e
  //     alcança o link do título. Com a caixa portalada para o fim do `body`, o
  //     Tab sairia da marca para a próxima palavra do parágrafo e o link ficaria
  //     inalcançável sem mover o foco à mão — e mover o foco é o que a regra 2
  //     da §8 proíbe.
  //   · O POSICIONAMENTO fica na FOLHA. A raiz é `position: relative`, então a
  //     caixa se ancora nela por CSS; o único número que o código escreve é o
  //     empurrão de volta para dentro da janela.
  const root = document.createElement('span') as unknown as InlineCitationElement;
  root.className = cn('nds-inline-citation', options.class);
  root.dataset.slot = 'inline-citation';

  const marker = document.createElement('button');
  marker.type = 'button';
  marker.id = id;
  marker.className = 'nds-inline-citation-marker';
  marker.dataset.slot = 'inline-citation-marker';
  // O NÚMERO É O TEXTO, e o nome acessível o contém (WCAG 2.5.3).
  marker.textContent = String(index);
  marker.setAttribute('aria-label', labels.marker);
  // A MARCA É UM BOTÃO QUE EXPANDE, e não um link nem um gatilho de diálogo.
  // `aria-expanded` é o que diz o estado, e ele é PALAVRA para quem ouve — nada
  // aqui depende de a marca mudar de cor (WCAG 1.4.1).
  marker.setAttribute('aria-expanded', 'false');
  marker.setAttribute('aria-controls', panelId);
  root.appendChild(marker);

  let panel: HTMLElement | null = null;
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Quem abriu.
   *
   * `pointer` fecha sozinho quando o ponteiro sai; `control` fica até alguém
   * fechar. Sem essa distinção, a caixa aberta por clique sumiria ao primeiro
   * movimento do mouse — e quem abriu por toque veria a prévia piscar.
   */
  let openedBy: 'pointer' | 'control' = 'pointer';

  function clearTimers(): void {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  }

  function onOutsidePointer(event: Event): void {
    const target = event.target;
    if (target instanceof Node && root.contains(target)) return;
    hide();
  }

  function onKeyDown(event: KeyboardEvent): void {
    // Escape fecha e o foco NÃO se move: ele já está na marca, que é de onde a
    // caixa saiu (WCAG 2.1.2, e a regra 2 da §8 da guideline 17).
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    hide();
    marker.focus();
  }

  function show(): void {
    clearTimers();
    if (panel) return;

    panel = buildPanel(panelId, citation, labels);
    panel.addEventListener('mouseenter', () => {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    });
    panel.addEventListener('mouseleave', scheduleHide);
    root.appendChild(panel);
    fitPanel(marker, panel);

    marker.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onOutsidePointer, true);
    onOpenChange?.(true);
  }

  function hide(): void {
    clearTimers();
    if (!panel) return;
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('pointerdown', onOutsidePointer, true);
    panel.remove();
    panel = null;
    marker.setAttribute('aria-expanded', 'false');
    onOpenChange?.(false);
  }

  function scheduleShow(): void {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    if (panel) return;
    openTimer = setTimeout(() => { openedBy = 'pointer'; show(); }, OPEN_DELAY);
  }

  function scheduleHide(): void {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    // Aberta por controle, o ponteiro que sai não fecha: quem clicou pediu que
    // ficasse, e em toque não há "sair" nenhum para desfazer o pedido.
    if (openedBy === 'control') return;
    closeTimer = setTimeout(() => { hide(); }, CLOSE_DELAY);
  }

  // PONTEIRO, TOQUE E TECLADO, e nenhum deles sozinho. O clique é o caminho que
  // serve aos três — em toque ele é o único que existe, e no teclado ele é o
  // que Enter e Espaço já disparam num botão. O ponteiro ganha a abertura por
  // espera como CONVENIÊNCIA, nunca como único caminho (regra 3 da §8).
  marker.addEventListener('click', () => {
    clearTimers();
    openedBy = 'control';
    if (panel) hide(); else show();
  });
  marker.addEventListener('mouseenter', scheduleShow);
  marker.addEventListener('mouseleave', scheduleHide);

  // A MARCA NÃO ABRE POR FOCO, e é a divergência deliberada em relação ao cartão
  // de ponteiro. Percorrer com Tab um parágrafo de cinco citações abriria cinco
  // caixas, uma por parada — e caixa aberta sem ninguém pedir cobre o texto que
  // a pessoa estava lendo.

  root.open = () => { openedBy = 'control'; show(); };
  root.close = hide;
  root.toggle = () => { openedBy = 'control'; if (panel) hide(); else show(); };
  root.isOpen = () => panel !== null;

  // Os dois ouvintes de documento e os dois temporizadores só existem enquanto a
  // caixa está aberta, e `hide()` solta os quatro. Quem tira a marca da página
  // com a caixa aberta não passa por `hide()`: o observador de
  // `tornarDestruivel` passa por ele.
  tornarDestruivel(root, root, hide);

  if (defaultOpen) {
    // `requestAnimationFrame` e não `queueMicrotask`: encaixar exige o retângulo
    // da marca, e ele só existe depois de a raiz entrar no documento e o
    // navegador calcular o layout.
    requestAnimationFrame(() => { openedBy = 'control'; show(); });
  }

  return root;
}
