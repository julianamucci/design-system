// ─── Popover — Vanilla factory standalone ───────────────────────────────────
// Visual: classe .nds-popover-content (standalone).
// Render via portal (body), posicionado pelo JS. Click-outside + Escape fecham.

/**
 * MODAL OU NÃO-MODAL — bloco canônico das cinco stacks.
 *
 * Medido em 2026-09-02 na FONTE de cada lib, não na documentação delas. As
 * outras quatro trazem a versão curta com o mecanismo da própria stack.
 *
 * O Popover é o único da família de overlay que não é menu nem dica: ele RECEBE
 * foco e guarda conteúdo interativo. Isso obriga a escolher entre dois
 * contratos, e é escolher METADE de cada um que produz o defeito clássico —
 * painel que o leitor de tela anuncia como diálogo modal e que o Tab atravessa
 * como se não fosse.
 *
 * O PADRÃO do design system é NÃO-MODAL, e ele é literal nas cinco:
 *
 * - O foco ENTRA no painel ao abrir: primeiro elemento focável, ou o próprio
 *   painel quando não há nenhum. É o que separa o popover do tooltip, e é o que
 *   o conteúdo compartilhado promete em três seções (acessibilidade, estados e
 *   critérios de teste).
 * - O foco NÃO fica PRESO: `Tab` sai do painel. Nenhuma das cinco instala laço
 *   de tabulação no estado padrão. E sair com Tab FECHA o painel e DEVOLVE o
 *   foco ao GATILHO — decisões da dona de 2026-09-16 (fechar) e 2026-09-17
 *   (destino), iguais nas cinco. O motivo relatado é `overlay`, o mesmo do
 *   clique fora: quem tabulou para fora saiu do painel sem decidir nada. Vale
 *   nos dois sentidos — `Tab` a partir do último focável e `Shift+Tab` a partir
 *   do primeiro —, e num painel sem focável nenhum qualquer dos dois fecha. O
 *   destino é o gatilho, e não "o próximo da página", porque o painel mora em
 *   portal no fim do `body`: o próximo da ordem é o navegador. **No modo MODAL
 *   não vale**: lá o foco fica preso, e não há "sair" para fechar.
 * - Por isso o painel NUNCA recebe `aria-modal`. O atributo manda o leitor de
 *   tela esconder tudo o que está fora do diálogo, e essa promessa só se cumpre
 *   com o foco preso: sem a prisão ele MENTE — o resto da página fica
 *   inalcançável para quem ouve sem estar inalcançável para quem tabula. É o
 *   contrário do véu do Dialog, e é de propósito: um popover é conteúdo AO
 *   LADO, não no lugar.
 * - `Escape` fecha e DEVOLVE o foco ao gatilho. Clique fora fecha.
 * - Foco levado a OUTRO elemento da página — que não o gatilho — fecha com
 *   `overlay`, uma vez, e o foco FICA onde foi posto (D15, 2026-09-17). Foco que
 *   sai do documento não fecha. No modo modal não vale.
 * - O gatilho declara `aria-expanded` e `aria-haspopup="dialog"`, e
 *   `aria-controls` apontando para o painel SÓ enquanto ele existe — apontar
 *   para um id ausente reprova em `aria-valid-attr-value`.
 * - Nenhuma região viva. O painel não é anúncio: ele é alcançado.
 *
 * ─── A prop `modal`, ENTREGUE nas cinco em 2026-09-02 ───────────────────────
 *
 * `modal` estava na tabela de props do conteúdo compartilhado e existia em três
 * das cinco stacks, com semântica diferente em duas. A dona escolheu ENTREGAR
 * (regra 2e6 — entregar ou remover). O que `modal: true` passa a significar,
 * igual nas cinco e exatamente o que a tabela promete:
 *
 *   1. o foco fica PRESO no painel — `Tab` no último focável volta ao primeiro,
 *      e `Shift+Tab` no primeiro vai ao último;
 *   2. a rolagem da página fica travada;
 *   3. o painel anuncia `aria-modal="true"`;
 *   4. `Escape` fecha e devolve o foco ao gatilho, como no modo padrão;
 *   5. o resto da página fica ESCONDIDO do leitor de tela — `aria-hidden="true"`
 *      nos irmãos de cada ancestral do painel, SEMPRE, com ou sem peça de
 *      fechar, e restaurado exatamente ao fechar e ao desmontar. Decisão da
 *      dona de 2026-09-17 (item 7 da §7 do PRD): `aria-modal` sozinho é honrado
 *      de forma desigual pelos leitores de tela. Aqui é `@/lib/hide-others`.
 *      REGIÃO VIVA e `<script>` ficam de FORA do esconder — escondê-las deixaria
 *      um toast de "salvo" ou de erro mudo com o painel aberto; o `markOthers`
 *      da base-ui e o pacote `aria-hidden` fazem o mesmo. No modo não-modal nada
 *      é escondido.
 *
 * `aria-modal` SÓ existe no modo modal, e é o item 1 que lhe dá direito: o
 * atributo manda o leitor de tela esconder o resto da página, e sem foco preso
 * ele MENTE — o resto da página fica inalcançável para quem ouve sem estar
 * inalcançável para quem tabula. Esta casa já pagou por atributo que anuncia o
 * que não existe (o `aria-label` DESCARTADO em `drawer` e `sheet`, por estar num
 * `div` sem papel). Por isso não-modal não recebe `aria-modal` nem
 * `aria-modal="false"`: recebe atributo NENHUM.
 *
 * O mecanismo de cada lib, medido na FONTE — e é ele que decide quem entrega
 * `modal` pela lib e quem o escreve à mão:
 *
 *   base-ui   — `PopoverRoot` nasce com `modal = false`; `role="dialog"` no
 *               `Popup`. O `FloatingFocusManager` só trapeia quando
 *               `modal !== false && hasClosePart` (`popup/PopoverPopup.js`), e
 *               `hasClosePart` conta os `Popover.Close` REGISTRADOS dentro do
 *               painel (`utils/closePart.js`, via `useClosePartRegistration`).
 *               A trava de rolagem, essa sim, cai de `modal === true` sozinho:
 *               `positioner/PopoverPositioner.js` liga
 *               `useAnchoredPopupScrollLock` com `modal === true && !hover`.
 *               Ou seja: a lib dá a TRAVA, não dá o TRAP.
 *   reka-ui   — `PopoverRoot` nasce com `modal: false`. Não-modal é
 *               `PopoverContentNonModal`, com `trap-focus: false`; modal é
 *               `PopoverContentModal`, que traz `trap-focus` ligado,
 *               `useBodyScrollLock` e `useHideOthers` (este último esconde os
 *               irmãos por `aria-hidden`, que é mais forte que `aria-modal`).
 *               A lib dá as DUAS coisas — por isso aquela stack é a REFERÊNCIA
 *               desta decisão.
 *   bits-ui   — NÃO tem `modal` nenhum. Tem `trapFocus` (padrão da LIB `true`) e
 *               `preventScroll` (padrão `false`), os dois no Content. São eles
 *               que passam a ser o mecanismo de `modal` naquela stack.
 *   radix-ng  — `modal` NÃO é booleano: `transformModal` aceita a string
 *               `'trap-focus'` além do booleano. Trapeia com
 *               `'trap-focus' || (modal === true && hasPopupClose())` e isola o
 *               lado de fora (`inert`) só com `modal === true && hasPopupClose()`.
 *               A trava de rolagem, como no base-ui, cai de `modal === true`
 *               sozinho (`useAnchoredScrollLock`). O `aria-modal` do Radix NG
 *               está no DIALOG, não no popover.
 *   vanilla   — esta fábrica. Não tem lib: o laço de tabulação, a trava contada
 *               e o `aria-modal` estão escritos aqui embaixo, e são a definição
 *               à qual as outras quatro se alinham.
 *
 * O buraco do `Close`, e por que ele NÃO foi contornado: em base-ui e em
 * radix-ng, `modal === true` só prende o foco se houver um botão de fechar
 * REGISTRADO dentro do painel. Isso faria `modal` continuar mentindo para quem
 * não renderizasse um. Nenhuma das duas stacks passou a injetar um botão que o
 * desenho não pede; as duas escrevem o laço de tabulação por conta própria — o
 * mesmo laço daqui — e deixam a lib com o que ela entrega sem condição, que é a
 * trava de rolagem. É a segunda saída que a dona autorizou: a stack implementa o
 * trap por outro caminho.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';
import { hideOthers } from '@/lib/hide-others';
import {
  autoUpdateFloating,
  positionFloating,
  type FloatingAlign,
  type FloatingSide,
} from '@/lib/floating';

export type PopoverSide = FloatingSide;
export type PopoverAlign = FloatingAlign;

export type PopoverOptions = {
  trigger: HTMLElement;
  content: HTMLElement | string;
  side?: PopoverSide;
  align?: PopoverAlign;
  /** Vão entre gatilho e painel, em px. Mesmo nome e mesmo padrão das outras stacks. */
  sideOffset?: number;
  /**
   * Deslocamento do painel no eixo do ALINHAMENTO, em px. Padrão `0`.
   *
   * O par do `sideOffset`, que é o vão do outro eixo: `sideOffset` afasta o
   * painel do gatilho, `alignOffset` o desliza ao longo da borda em que o
   * `align` o encostou. Positivo empurra para o fim do eixo — direita nos lados
   * `top`/`bottom`, baixo nos lados `left`/`right`.
   *
   * Mesmo nome e mesmo padrão das outras quatro stacks, que o recebem da lib
   * headless. A conta vive em `computeFloatingPosition`.
   */
  alignOffset?: number;
  /**
   * Estado CONTROLADO. Definido, quem manda no painel é quem chama: o clique no
   * gatilho, o Escape e o clique fora passam a apenas ANUNCIAR a intenção por
   * `onOpenChange`, e o painel só se move quando `setOpen()` for chamado.
   *
   * Sem esta opção o popover se governa (não-controlado), que é o modo em que
   * ele nasceu e continua sendo o padrão.
   */
  open?: boolean;
  /** Estado inicial no modo não-controlado. */
  defaultOpen?: boolean;
  /**
   * Modo MODAL. Padrão `false`, que é o popover normal desta casa.
   *
   * `true` prende o foco no painel, trava a rolagem da página, faz o painel
   * anunciar `aria-modal="true"` e esconde o resto da página do leitor de tela
   * (`aria-hidden`). Andam juntos de propósito — ver o
   * bloco no cabeçalho deste arquivo para por que anunciar sem prender é
   * mentir para quem usa leitor de tela.
   */
  modal?: boolean;
  /**
   * Nome acessível EXPLÍCITO do painel, para o painel de conteúdo livre — o que
   * não tem `createPopoverTitle` dentro.
   *
   * Só age quando não há título: com título quem nomeia é o `aria-labelledby`,
   * e os dois contratos no mesmo elemento são ambiguidade, não redundância.
   * Sem esta opção o painel continua herdando o texto do gatilho, que é a rede
   * de segurança da regra `aria-dialog-name` do axe — e é exatamente o que o
   * anti-exemplo do Do & Don't precisa continuar mostrando.
   */
  ariaLabel?: string;
  /**
   * Chamado a cada mudança de estado. No FECHAMENTO chega também o motivo, no
   * vocabulário do design system — ver `PopoverCloseReason`.
   */
  onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
  class?: string;
};

/**
 * O que a fábrica devolve.
 *
 * Os três verbos em INGLÊS, como no Sidebar desta stack — que é a forma que o
 * repositório passou a adotar. (`createHoverCard` ainda expõe `open`/`close`;
 * renomear ali é mudança de API pública e tem dono.)
 */
export type PopoverElement = DestroyableElement & {
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Move o painel para o estado pedido. É por aqui que o modo controlado anda. */
  setOpen: (open: boolean) => void;
};

// ─── Sub-fábricas de conteúdo ────────────────────────────────────────────────
//
// Cabeçalho, título e descrição existem no CSS compartilhado
// (`.nds-popover-header`, `.nds-popover-title`, `.nds-popover-description`) e
// nas outras quatro stacks como componentes. Aqui não existiam: quem compunha
// montava a `<div>` e escrevia a classe à mão — e o `data-slot` documentado não
// saía em lugar nenhum.

export type PopoverPartOptions = {
  text?: string;
  class?: string;
};

function createParte(
  tag: keyof HTMLElementTagNameMap,
  slot: string,
  className: string,
  options: PopoverPartOptions,
): HTMLElement {
  const el = document.createElement(tag);
  el.dataset.slot = slot;
  el.className = cn(className, options.class);
  if (options.text) el.textContent = options.text;
  return el;
}

export function createPopoverHeader(options: PopoverPartOptions = {}): HTMLElement {
  return createParte('div', 'popover-header', 'nds-popover-header', options);
}

/**
 * Título do painel.
 *
 * Sai como `<h2>` por padrão: o painel é um `role="dialog"`, e é este elemento
 * que o `aria-labelledby` do painel encontra sozinho — a fábrica procura um
 * cabeçalho antes de cair no nome do gatilho. `level` troca a profundidade para
 * quem precisa encaixar na hierarquia da página.
 *
 * **Era `h4` até 2026-09-09, e o 4 nunca teve justificativa escrita.** As outras
 * quatro anunciam NÍVEL 2: react pelo `Popover.Title` do base-ui, que renderiza
 * `<h2>`; vue e svelte por `role="heading" aria-level="2"` escrito à mão em
 * 2026-08-15 justamente para casar com ele. O `h4` entrou quatro dias depois,
 * em `a8ef7a15c` — a passagem que deu ao vanilla a CAPACIDADE de trocar o
 * nível, e que junto escolheu um valor sem comparar com o que as outras
 * anunciavam. Nada reprovava: qualquer nível é HTML válido.
 */
/**
 * Por qual caminho o painel fechou — no vocabulário do DESIGN SYSTEM, não no da
 * lib. As mesmas quatro palavras do `drawer_close`, para a família inteira ser
 * uma dimensão só no GA4:
 *
 *   escape        tecla Escape
 *   overlay       saiu do painel sem decidir nada: clique fora, Tab na borda,
 *                 foco levado a outro elemento, ou clique no gatilho de novo
 *   close-button  controle de fechar explícito dentro do painel — todo
 *                 `[data-slot="popover-close"]` do painel, por delegação
 *   api           fechado por código — é aqui que cai "salvou e fechou"
 *
 * `close-button` esteve NESTA lista sem nenhum caminho que o produzisse até
 * 2026-09-12: a palavra existia no tipo, a docs page a publicava na tabela de
 * analytics, e o "Cancelar" de três stories era um `createButton` sem ouvinte —
 * o painel não fechava. Vocabulário declarado não é comportamento entregue, e
 * aqui a diferença passou despercebida porque o tipo compilava.
 *
 * `api` é o padrão, e não `close-button` como no drawer: os formulários do
 * popover fecham POR CÓDIGO ao salvar, e com o padrão do drawer "concluiu"
 * chegaria ao relatório como "apertou o botão de fechar" — apagando o sinal que
 * justifica o campo existir (desistiu × concluiu).
 */
export type PopoverCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';

export type PopoverTitleOptions = PopoverPartOptions & { level?: 1 | 2 | 3 | 4 | 5 | 6 };

export function createPopoverTitle(options: PopoverTitleOptions = {}): HTMLElement {
  const { level = 2 } = options;
  return createParte(`h${level}` as keyof HTMLElementTagNameMap, 'popover-title', 'nds-popover-title', options);
}

export function createPopoverDescription(options: PopoverPartOptions = {}): HTMLElement {
  return createParte('p', 'popover-description', 'nds-popover-description', options);
}

/*
 * ─── E por que NÃO existe um `createPopoverClose` ───────────────────────────
 *
 * O controle de fechar do painel é uma MARCA no botão de quem compõe —
 * `data-slot="popover-close"` —, e não uma quarta sub-fábrica ao lado das três
 * acima. A decisão é de 2026-09-12, e as duas saídas foram medidas:
 *
 *  - **Sub-fábrica.** As três irmãs são construtoras PURAS: `createParte` cria
 *    um elemento, escreve classe e `data-slot`, e devolve. Nenhuma delas sabe de
 *    instância nenhuma — e não teria como saber, porque o conteúdo do painel é
 *    montado ANTES de `createPopover()` existir, em toda story, todo snippet e
 *    toda seção da docs page. Uma `createPopoverClose()` nascida no mesmo lugar
 *    não tem em que popover chamar `close()`; para ter, precisaria de um segundo
 *    passo (`painel.ligarFechamento(botao)`) — um verbo que a família não tem —
 *    ou de um visual próprio, duplicando o `createButton` que o desenho pede.
 *  - **Delegação por `data-slot`.** É o que `dialog.ts` e `sheet.ts` desta stack
 *    adotaram em 2026-09-11 (`PATCHES.md#vanilla-overlay-close-api`), pelo mesmo
 *    motivo: o rodapé é de quem compõe, e um ouvinte por elemento só alcançaria
 *    o que a própria fábrica cria. É também a forma das outras stacks lida do
 *    lado certo — `button[ndsPopoverClose]` no angular é DIRETIVA sobre o botão
 *    de quem compõe, e o `PopoverClose` do svelte renderiza o filho; nas duas, a
 *    peça marca um botão que já existe, e aqui marcar é escrever o `data-slot`.
 *
 * Quem compõe:
 *
 *   const cancelar = createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar' });
 *   cancelar.dataset.slot = 'popover-close';
 *
 * A marca vale para QUALQUER elemento dentro do painel, em qualquer profundidade
 * — quem fecha é a delegação no painel, em `open()`.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _popoverCounter = 0;

/**
 * O que conta como "primeiro elemento focável" dentro do painel.
 *
 * `[tabindex="-1"]` fica de fora de propósito: é o marcador de foco
 * programático, não de parada na ordem de tabulação — e o próprio painel o tem.
 *
 * **A regra vale para TODOS os seletores, e até 2026-09-13 só o último a
 * cobrava.** `input[tabindex="-1"]` entrava pela porta do `input:not([disabled])`,
 * e um elemento que o Tab nunca visita virava o "último focável": o ramo do laço
 * deixava de disparar e o foco SAÍA do painel modal — justamente o contrato que
 * o laço existe para sustentar quando a composição não tem botão de fechar.
 *
 * Aqui era latente, e no react não era: a base-ui renderiza, ao lado de cada
 * `Checkbox`, um `<input type="checkbox" tabindex="-1" aria-hidden="true">`
 * escondido. Bastou a story do modo modal passar a usar checkbox para o laço
 * quebrar. Esta lista é a referência que as outras copiam; corrigi-la aqui é o
 * que mantém a cópia honesta.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(', ');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter((el) => !el.closest('[hidden]'));
}

// ─── createPopover ────────────────────────────────────────────────────────────

export function createPopover(options: PopoverOptions): PopoverElement {
  const {
    trigger,
    content,
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    alignOffset = 0,
    modal = false,
    onOpenChange,
  } = options;

  const controlled = options.open !== undefined;

  const id = ++_popoverCounter;
  const contentId = `popover-content-${id}`;

  let panelEl: HTMLElement | null = null;
  let isOpen = false;
  let timerClickOutside: ReturnType<typeof setTimeout> | null = null;
  // Espelha a trava PEDIDA por esta instância, e não o contador global de
  // `scroll-lock`. Sem esta bandeira, um `close()` que chegasse duas vezes
  // soltaria duas travas — e a segunda seria a de outro painel.
  let scrollLocked = false;
  // Elemento para o qual a perda de foco já ANUNCIOU `overlay` e que ainda
  // segura o foco. Só pesa no modo controlado — no não-controlado o fechamento
  // remove os ouvintes —, e é o que impede o clique fora de anunciar a mesma
  // dispensa uma segunda vez: o clique move o foco antes de o `click` chegar.
  let focusLossTarget: Element | null = null;
  // A limpeza do acompanhamento de posição. Existe só com o painel aberto, e é
  // o que `close()` chama — ver `autoUpdateFloating` em `@/lib/floating`.
  let stopAutoUpdate: (() => void) | null = null;
  // A restauração do "esconder os outros" do modo modal. Existe só com o painel
  // modal aberto, e desfaz EXATAMENTE o que esta instância escondeu — a contagem
  // por elemento, que é do documento, está em `@/lib/hide-others`. Zerada em
  // `close()`, para um fechamento duplo não soltar a de outro painel.
  let restoreHidden: (() => void) | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'popover';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  // O gatilho passa a declarar o próprio papel no markup, como nas demais
  // stacks — a peça que compõe vence o `data-slot` de quem foi composto.
  trigger.dataset.slot = 'popover-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');
  // `data-state` é o contrato de estado que a tabela de Estados do conteúdo
  // compartilhado descreve e que as demais stacks emitem pela lib headless.
  // Aqui não há lib: sem esta linha o atributo documentado não existiria em
  // lugar nenhum do stack de referência.
  trigger.dataset.state = 'closed';
  // aria-controls is set only when the popover is open (otherwise it
  // references a non-existent element, which fails axe aria-valid-attr-value).

  function open(): void {
    if (isOpen) return;

    panelEl = document.createElement('div');
    panelEl.id = contentId;
    panelEl.className = cn('nds-popover-content', options.class);
    panelEl.dataset.slot = 'popover-content';
    panelEl.dataset.state = 'open';
    // O lado e o encosto escolhidos ficam legíveis no markup, como nas outras
    // stacks — é o que permite a uma story provar que a opção chegou ao painel.
    //
    // O lado aqui é o PEDIDO, e ele é reescrito com o lado REAL logo depois de
    // posicionar: com `flip` ligado, os dois podem diferir.
    panelEl.dataset.side = side;
    panelEl.dataset.align = align;
    panelEl.setAttribute('role', 'dialog');
    // `aria-modal` SÓ no modo modal, e nunca `"false"` no modo padrão: o
    // atributo ausente e o atributo negado dizem a mesma coisa ao leitor de
    // tela, e o ausente não corre o risco de sobreviver a uma troca de modo.
    if (modal) panelEl.setAttribute('aria-modal', 'true');
    // O painel recebe foco quando não há nada focável dentro: é o que faz o
    // leitor de tela anunciar o diálogo mesmo num painel só de texto.
    panelEl.tabIndex = -1;
    panelEl.style.position = 'absolute';

    /*
     * Todo `[data-slot="popover-close"]` DENTRO do painel fecha, informando
     * `close-button`.
     *
     * Delegação, e não um ouvinte por botão: o conteúdo do painel é de quem
     * compõe e chega pronto pela opção `content` — um ouvinte por elemento só
     * alcançaria peça que esta fábrica criasse, e ela não cria nenhuma.
     *
     * `closest` e não `target`: o clique cai no ícone ou no `.nds-sr-only` de
     * dentro do botão, e a comparação direta erraria os dois.
     *
     * `pedirChange` e não `close`: no modo controlado o gesto só ANUNCIA a
     * intenção, como o Escape e o clique fora — quem move o painel é quem
     * chama `setOpen()`.
     */
    panelEl.addEventListener('click', (event) => {
      const alvo = event.target as Element | null;
      if (alvo?.closest('[data-slot="popover-close"]')) pedirChange(false, 'close-button');
    });

    if (typeof content === 'string') {
      panelEl.textContent = content;
    } else {
      panelEl.appendChild(content);
    }

    // Accessible name (axe rule: aria-dialog-name). Prefer an existing heading
    // inside the content via aria-labelledby; otherwise fall back to a string
    // aria-label derived from the trigger's accessible text.
    const heading = panelEl.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]');
    if (heading) {
      if (!heading.id) heading.id = `${contentId}-title`;
      panelEl.setAttribute('aria-labelledby', heading.id);
    } else {
      const triggerName =
        trigger.getAttribute('aria-label') ||
        trigger.textContent?.trim() ||
        'Popover';
      panelEl.setAttribute('aria-label', options.ariaLabel?.trim() || triggerName);
    }

    // A DESCRIÇÃO do painel, pelo mesmo caminho do nome logo acima: a peça já
    // carrega o `data-slot`, então encontrá-la é uma consulta e não um contrato
    // novo. Sem isto o leitor de tela anuncia o nome do diálogo e CALA a linha
    // que explica o que ele faz — e o conteúdo compartilhado promete o atributo
    // em três chaves e três idiomas (`anatomy.item6`,
    // `accessibility.items.item3`, `accessibility.aria.describedBy`).
    //
    // Só a PRIMEIRA: `aria-describedby` aceita lista de ids, mas um painel com
    // duas descrições é ambiguidade de composição, e apontar para as duas faria
    // o leitor de tela lê-las em sequência como se fossem uma.
    const description = panelEl.querySelector<HTMLElement>('[data-slot="popover-description"]');
    if (description) {
      if (!description.id) description.id = `${contentId}-description`;
      panelEl.setAttribute('aria-describedby', description.id);
    }

    document.body.appendChild(panelEl);
    // `flip: true`, e o retorno é ESCRITO no painel.
    //
    // O contrato C9 diz que sem espaço no lado pedido o painel vira para o
    // oposto, e até 2026-09-13 ele era falso aqui: o `flip` do `positionFloating`
    // é opt-in, o popover não o pedia, e o eixo PRINCIPAL não é clampado de
    // propósito (clampá-lo empurraria o painel por cima do gatilho, desfazendo o
    // `side`). Sem espaço acima, o painel simplesmente saía da tela — visto na
    // tela, no Playground com `side: 'top'`, onde o gatilho fica no topo.
    //
    // Ligar o flip sem a linha de baixo faria o atributo MENTIR: `data-side` era
    // escrito do lado PEDIDO, na montagem, e o retorno de `positionFloating` —
    // que traz o lado onde o painel de fato ficou — era descartado. Quem lesse o
    // markup veria `top` num painel que abriu embaixo.
    //
    // Aqui ligar é seguro, e no tooltip não seria: a folha do popover não lê
    // `[data-side]` para desenhar nada, e não há seta cuja coordenada cruzada
    // precise ser refeita.
    //
    // A conta é uma função porque roda de novo a cada rolagem, redimensionamento
    // da janela ou mudança de tamanho do gatilho ou do painel, enquanto o painel
    // está aberto — e o `data-side` vai junto, porque rolar pode ser justamente
    // o que faz o lado pedido deixar de caber. Só a geometria: reposicionar não
    // anuncia nada e não toca no foco.
    const panel = panelEl;
    const place = (): void => {
      panel.dataset.side = positionFloating(trigger, panel, side, align, sideOffset, {
        flip: true,
        alignOffset,
      });
    };
    place();
    // `?.()` antes de religar: `open()` já barra a segunda abertura, mas um
    // acompanhamento que sobrevivesse seria dois ouvintes de rolagem movendo o
    // mesmo painel.
    stopAutoUpdate?.();
    stopAutoUpdate = autoUpdateFloating(trigger, panel, place);

    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', contentId);
    trigger.dataset.state = 'open';
    isOpen = true;

    // Trava CONTADA, e não `body.style.overflow` local: dois painéis abertos ao
    // mesmo tempo fariam o segundo guardar `hidden` como "valor anterior" e a
    // página nunca mais rolaria. O porquê inteiro está em `@/lib/scroll-lock`.
    if (modal) {
      lockBodyScroll();
      scrollLocked = true;
      // O resto da página sai da árvore do leitor de tela — decisão da dona de
      // 2026-09-17, igual nas cinco, SEMPRE que o modo for modal. `aria-modal`
      // já promete isso, mas os leitores de tela o honram de forma desigual (o
      // VoiceOver do Safari é o caso conhecido). `aria-hidden`, e não `inert`:
      // `inert` bloquearia o ponteiro lá fora, e o clique fora tem de chegar
      // para fechar. Depois do `appendChild`: o algoritmo sobe a partir do
      // painel já no documento.
      restoreHidden?.();
      restoreHidden = hideOthers(panelEl);
    }

    // O foco entra no painel — é o que separa o popover do tooltip. O conteúdo
    // é interativo (formulário, filtro, botões), e sem isto quem navega por
    // teclado teria de atravessar o resto da página para alcançá-lo. É a
    // promessa que o conteúdo compartilhado faz em três seções: acessibilidade,
    // estados e critérios de teste.
    //
    // `[data-autofocus]` vem ANTES, e a consulta é PRÓPRIA: a lista `FOCUSABLE`
    // filtra `[tabindex="-1"]` de propósito (ver o bloco dela), e um alvo
    // marcado à mão com `tabindex="-1"` é exatamente o caso que a marca existe
    // para servir — foco PROGRAMÁTICO, que é o que ela pede. Passar a marca por
    // `getFocusable` descartaria em silêncio o alvo que quem compõe escolheu.
    const autofocus = panelEl.querySelector<HTMLElement>('[data-autofocus]');
    (autofocus ?? getFocusable(panelEl)[0] ?? panelEl).focus();

    document.addEventListener('keydown', handleKeydown);
    // Perda de foco (D15) — registrado DEPOIS de o foco entrar no painel, para
    // o próprio foco de abertura não passar pelo ouvinte. Só fora do modo modal:
    // lá o foco fica preso, e não há "perder" que feche.
    if (!modal) document.addEventListener('focusin', handleFocusIn);
    // Adiado para o clique que ABRIU não fechar em seguida. O timer é guardado
    // porque o fechamento pode chegar antes dele: sem cancelar, o ouvinte era
    // registrado DEPOIS da limpeza e ficava para sempre.
    timerClickOutside = setTimeout(() => {
      timerClickOutside = null;
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    notificar(true);
  }

  function close(reason: PopoverCloseReason = 'api'): void {
    if (!isOpen) return;

    // Se o foco estava dentro do painel — ou já se perdeu para o <body> —, ele
    // volta ao gatilho. Fechar removendo o elemento focado sem devolver o foco
    // manda quem navega por teclado de volta ao início da página (WCAG 2.4.3).
    // Quando a dispensa levou o foco a OUTRO controle da página, o foco fica
    // onde a pessoa o pôs: puxá-lo de volta seria roubá-lo.
    const focusEstavaInside =
      !!panelEl &&
      (panelEl.contains(document.activeElement) || document.activeElement === document.body);

    // Antes de remover o painel: um quadro já agendado não pode medir um nó que
    // saiu do documento.
    stopAutoUpdate?.();
    stopAutoUpdate = null;
    panelEl?.remove();
    panelEl = null;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-controls');
    trigger.dataset.state = 'closed';
    isOpen = false;

    if (timerClickOutside !== null) {
      clearTimeout(timerClickOutside);
      timerClickOutside = null;
    }
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleOutsideClick);
    // Removido ANTES do `trigger.focus()` logo abaixo: o foco devolvido não pode
    // voltar a passar pelo ouvinte de perda de foco. (O gatilho já é ignorado
    // por ele; a ordem é a segunda cerca, não a primeira.)
    document.removeEventListener('focusin', handleFocusIn);
    focusLossTarget = null;

    if (scrollLocked) {
      unlockBodyScroll();
      scrollLocked = false;
    }

    // Cada elemento escondido por ESTA instância volta ao estado de antes — com
    // o `aria-hidden` que já tinha, de qualquer valor. Antes do `trigger.focus()`:
    // o gatilho mora no que foi escondido, e o foco não deve pousar num elemento
    // que o leitor de tela ainda não enxerga.
    restoreHidden?.();
    restoreHidden = null;

    if (focusEstavaInside) trigger.focus();

    notificar(false, reason);
  }

  function setOpen(next: boolean, reason: PopoverCloseReason = 'api'): void {
    if (next) open();
    else close(reason);
  }

  /**
   * Anuncia a mudança de estado.
   *
   * Controlado, o painel não anuncia o que ele próprio aplicou: quem pediu foi
   * quem chama, e o aviso já saiu na intenção. Sem esta cerca, um
   * `onOpenChange` que responde com `setOpen()` receberia o evento duas vezes.
   */
  function notificar(isOpen: boolean, reason?: PopoverCloseReason): void {
    if (!controlled) onOpenChange?.(isOpen, isOpen ? undefined : reason);
  }

  /**
   * Intenção de mudança vinda de uma INTERAÇÃO (clique, Escape, clique fora).
   *
   * Controlado, ela só é anunciada: quem manda no estado é quem chama. Não
   * controlado, ela é executada — e `open`/`close` anunciam por conta própria.
   */
  function pedirChange(next: boolean, reason: PopoverCloseReason = 'api'): void {
    if (controlled) {
      onOpenChange?.(next, next ? undefined : reason);
      return;
    }
    setOpen(next, reason);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      // `close()` já devolve o foco ao gatilho quando ele estava dentro do
      // painel, que é sempre o caso vindo do Escape.
      pedirChange(false, 'escape');
      return;
    }

    // ─── Tab para FORA do painel FECHA — e só fora do modo modal ─────────────
    //
    // Decisão da dona de 2026-09-16, igual nas cinco. O motivo é `overlay`: quem
    // tabulou para fora saiu do painel sem decidir nada, como quem clica fora.
    //
    // Quem fecha AQUI é a TECLA, e não o ouvinte de perda de foco
    // (`handleFocusIn`, D15): tabular para fora do último focável da página não
    // produz `focusin` nenhum — o foco vai para o navegador e o documento fica
    // com o `body`. O painel mora em portal no FIM do `body`, então este é
    // justamente o caso comum aqui, e o ouvinte de foco não o veria. Os dois
    // caminhos não somam: a tecla é cancelada, o foco não se move, e o
    // `close()` tira o ouvinte de foco antes de devolver o foco ao gatilho.
    //
    // COM `preventDefault` — decisão da dona de 2026-09-17: o DESTINO de quem
    // tabula para fora é o GATILHO, nos dois sentidos. O Tab nativo não pode
    // mover o foco, porque o painel mora em portal no fim do `body`: a "próxima
    // posição" da ordem da página é o navegador, e o documento ficava com o
    // foco no `body` (medido na story `Focused`). Com a tecla cancelada, o foco
    // ainda está dentro do painel quando `close()` roda, e é o `close()` que o
    // devolve ao gatilho — um caminho só, o mesmo do Escape.
    //
    // O ramo só age com o foco DENTRO do painel — alinhado às quatro stacks com
    // lib em 2026-09-17, onde o ouvinte mora NO painel e um Tab dado em outro
    // controle da página nem chega a ele. Até ali este ouvinte, que escuta no
    // `document`, fechava o painel também quando o foco estava em OUTRO
    // controle: o contrato fala em Tab a partir do último focável DO PAINEL, e
    // aquele Tab é da pessoa, não do painel. Painel sem focável conta como
    // dentro: o foco está no próprio painel (`tabindex="-1"`), que `contains`
    // inclui.
    if (!modal && e.key === 'Tab' && panelEl) {
      const active = document.activeElement;
      if (!panelEl.contains(active)) return;
      const focusable = getFocusable(panelEl);
      const isLeaving =
        !focusable.length ||
        (e.shiftKey ? active === focusable[0] : active === focusable[focusable.length - 1]);
      if (!isLeaving) return;
      e.preventDefault();
      pedirChange(false, 'overlay');
      return;
    }

    // Laço de tabulação — SÓ no modo modal. Mesma forma do `dialog.ts` desta
    // stack, de propósito: é o mesmo problema, e duas escritas diferentes do
    // mesmo laço divergiriam na primeira correção.
    //
    // É o ramo OPOSTO ao de cima, e os dois juntos são o contrato: fora do modo
    // modal o Tab fecha e devolve ao gatilho; aqui ele volta ao começo e o
    // painel fica.
    if (modal && e.key === 'Tab' && panelEl) {
      const focusable = getFocusable(panelEl);
      // Sem nada focável dentro, o foco não tem para onde ir e ficar preso é
      // literal: o painel já tem `tabindex="-1"` e segura o foco.
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  }

  function handleOutsideClick(e: MouseEvent): void {
    const target = e.target as Node;
    if (!panelEl?.contains(target) && !trigger.contains(target)) {
      // O mesmo gesto já anunciou pela perda de foco: o `mousedown` focou o
      // alvo antes deste `click` chegar. Só alcançável no modo controlado.
      if (focusLossTarget?.contains(target)) {
        focusLossTarget = null;
        return;
      }
      pedirChange(false, 'overlay');
    }
  }

  // ─── Perda de foco FECHA — só fora do modo modal (D15) ─────────────────────
  //
  // Decisão da dona de 2026-09-17, igual nas cinco: o painel não-modal fica
  // aberto só enquanto o foco está nele. Foco levado a OUTRO elemento do
  // documento fecha com `overlay`, uma vez, e o foco FICA onde foi posto — o
  // `close()` só o devolve ao gatilho quando ele estava dentro do painel ou no
  // `body`, e aqui ele já está no destino que alguém escolheu.
  //
  // `focusin` no `document`, e não `focusout` no painel: o `focusout` não diz se
  // o foco foi para um elemento ou para FORA do documento (outra janela, barra
  // de endereço), e esse caso não fecha — sem elemento de destino, não há
  // `focusin` nenhum. E ele não vê o foco levado para fora quando o painel não
  // o tinha, que é justamente o estado que esta decisão elimina.
  //
  // Os três conflitos, cada um resolvido num lugar:
  //  - GATILHO: conta como parte do painel. O `mousedown` do clique nele move
  //    o foco para ele antes do `click`; tratado como fora, o foco fecharia e o
  //    `click` reabriria.
  //  - CLIQUE FORA: no não-controlado o foco fecha e o `close()` tira o ouvinte
  //    de `click`; no controlado, `focusLossTarget` impede o segundo anúncio.
  //  - TAB DA BORDA: a tecla é cancelada e o foco não se move — ver o ramo em
  //    `handleKeydown`.
  function handleFocusIn(e: FocusEvent): void {
    const target = e.target as Node | null;
    if (!panelEl || !target) return;
    if (panelEl.contains(target) || trigger.contains(target)) {
      focusLossTarget = null;
      return;
    }
    // Já anunciado para este mesmo elemento (controlado): não repete.
    if (focusLossTarget === target) return;
    focusLossTarget = target as Element;
    pedirChange(false, 'overlay');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    // Fechar clicando no gatilho de novo é `overlay` — "saí do painel sem
    // decidir nada" —, e NÃO `api`. O drawer manda esse caminho para `api`
    // porque ali o gatilho fica coberto pelo véu e só código fecha por ele; o
    // popover é não-modal, o gatilho continua clicável, e o clique é vontade de
    // quem usa. O motivo só é lido no fechamento.
    pedirChange(!isOpen, 'overlay');
  });

  // O painel mora em portal no body: quando o wrapper sai do DOM — troca de
  // story no Storybook, desmonte de página — nada removeria o painel, e ele
  // sobreviveria por cima do conteúdo seguinte junto com o `keydown`, o `click`
  // de fora e o `focusin` da perda de foco — os três saem em `close()`. Mesma
  // forma do dialog e do sheet.
  // `Object.assign` e não um `as`: os verbos entram no tipo do próprio alvo, e
  // `tornarDestruivel` devolve exatamente `PopoverElement` sem conversão. Uma
  // asserção aqui teria de passar por `unknown` — o wrapper é `HTMLDivElement` e
  // o tipo declarado parte de `HTMLElement`, e nenhum dos dois cobre o outro.
  const instancia = tornarDestruivel(
    wrapper,
    Object.assign(wrapper, {
      open,
      close,
      toggle: () => setOpen(!isOpen),
      setOpen,
    }),
    () => {
      if (isOpen) close();
    },
  );

  // Estado inicial. No modo controlado quem manda é `open`; fora dele,
  // `defaultOpen`. Adiado uma volta do laço de eventos, e não um microtique: a
  // raiz ainda não entrou no documento quando a fábrica retorna, e posicionar o
  // painel exige medir um gatilho já no layout.
  const startsOpen = controlled ? options.open === true : options.defaultOpen === true;
  if (startsOpen) {
    setTimeout(() => {
      // A raiz pode ter sido descartada antes deste tique. Abrir aqui portaria
      // um painel para o `body` sem ninguém com referência para fechá-lo.
      if (wrapper.isConnected) open();
    }, 0);
  }

  return instancia;
}
