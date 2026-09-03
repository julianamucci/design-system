// ─── Drawer — Vanilla factory standalone ─────────────────────────────────────
//
// Painel que entra por uma das bordas da tela, com alça visível na direção
// padrão (de baixo). Render via portal no `document.body`.
//
// ─── Por que deixou de ser um apelido de createSheet ─────────────────────────
//
// `createDrawer` era `createSheet({ side: 'bottom' })`, e o resultado era um
// Sheet com nome de Drawer: painel `.nds-sheet-content` com `data-side`, sem
// alça, sem os cantos arredondados do Drawer, sem corpo rolável próprio e sem
// `data-vaul-drawer-direction`. As stories compensavam escrevendo o atributo à
// mão no WRAPPER — onde nenhuma regra do CSS o lê — e chamando `createSheet`
// direto para as outras três direções.
//
// A folha do Drawer (`docs/shared/styles/nds/drawer.css`) publica
// `.nds-drawer-content[data-vaul-drawer-direction]`, `.nds-drawer-handle`,
// `.nds-drawer-header`, `.nds-drawer-body` e `.nds-drawer-footer`, e nada nesta
// stack os usava. Como esta é a stack de
// referência de markup, o contrato que ela não cumpre é contrato que não existe.
// Daí a factory própria: mesmo markup e mesmos `data-slot` das outras stacks.
//
// Do Sheet ficam só `.nds-sheet-overlay`, `.nds-sheet-title` e
// `.nds-sheet-description`, que as duas folhas mandam reusar.
//
// ─── Decisão de acessibilidade, medida na fonte das cinco libs ───────────────
//
// Bloco canônico: as outras quatro stacks trazem a versão curta mais o
// mecanismo delas. O Drawer é irmão do Sheet e DIVIDE a folha do véu com ele,
// então o que muda entre os dois está marcado abaixo como divergência.
//
//   1. Foco preso: AS CINCO, enquanto o painel existe. Aqui é o laço de
//      Tab/Shift+Tab escrito no `handleKeydown`; nas outras quatro é o
//      gerenciador de foco da lib.
//   2. `aria-modal="true"`: AS CINCO, e só no modo modal. Não-modal não recebe
//      o atributo, nem `"false"` — com ele o leitor de tela esconderia o resto
//      da página justamente quando o resto da página continua utilizável.
//   3. `role="dialog"` com nome: AS CINCO. O nome sai do título por
//      `aria-labelledby`, e a descrição por `aria-describedby` quando existe.
//   4. Escape e clique no véu fecham: AS CINCO, quando `dismissible`. O
//      `keydown` é do DOCUMENTO porque o foco pode estar no corpo que rola.
//   5. Foco de volta ao gatilho ao fechar: AS CINCO. `desmontarPanel` NÃO
//      devolve foco, de propósito: quem desmonta pode ter tirado o gatilho do
//      documento junto.
//   6. Trava de rolagem enquanto modal: AS CINCO. Aqui vem de
//      `@/lib/scroll-lock`, que é contada e compartilhada com o Sheet.
//   7. Corpo rolável: `tabindex="0"` sempre (WCAG 2.1.1) e `role="group"` só
//      quando há nome. Nome em elemento sem papel é descartado pelo leitor de
//      tela (`aria-prohibited-attr`); é `group` e não `region` porque marco
//      aninhado num diálogo já nomeado não acrescenta navegação.
//   8. Ordem de leitura: o foco entra no painel na abertura e segue o DOM —
//      alça (escondida), cabeçalho, corpo, rodapé.
//   9. Região viva: NENHUMA. A abertura já move o foco e o papel de diálogo já
//      é anunciado; uma live region diria a mesma coisa duas vezes.
//  10. Arraste com alternativa: AS CINCO (WCAG 2.5.7). O gesto só dispensa, e
//      dispensar tem três caminhos sem trajeto — Escape, clique no véu e o
//      botão de saída do rodapé. Enquanto o gesto não existia em duas stacks o
//      critério era atendido por ausência; agora é atendido por cobertura, e a
//      cobertura é o que precisa continuar verdadeira: capacidade nova de
//      arraste (redimensionar, parar no meio) só entra com caminho próprio.
//
// ─── Onde ele DIVERGE do Sheet, e por quê ────────────────────────────────────
//
//   · Gesto de arrastar. Existe nas CINCO. Aqui o motor é
//     `@shared/primitives/drawer-swipe`, escrito com eventos de ponteiro sobre
//     a leitura da lib que as outras três usam; lá é a própria lib. Em todas é
//     extra de ponteiro: arrastar só DISPENSA, e dispensar já tem Escape, véu e
//     o botão do rodapé — nenhuma ação depende de trajeto (WCAG 2.5.7). O Sheet
//     não tem gesto em stack nenhuma.
//   · Alça. Afordância visual, com `aria-hidden`, sem foco e sem nome — o
//     arraste vale no painel inteiro, não nela, então foco ali seria parada de
//     tabulação sem função. O Sheet não tem alça.
//   · Botão de fechar. O Sheet traz um X próprio (`.nds-sheet-close`, com
//     `showCloseButton`); o Drawer não tem X nenhum, e a saída visível é o que
//     quem compõe puser no rodapé. É por isso que rodapé com saída explícita
//     deixa de ser opcional quando `dismissible` está desligado.
//   · Largura. O Sheet lê `--sheet-width`/`--sheet-max-width`; o Drawer lê
//     `--drawer-width`/`--drawer-max-width`, e o teto só entra a partir de 40rem
//     de viewport. Nos dois, classe de largura NÃO vence: as regras de direção
//     são (0,2,0) e qualquer utilitária é (0,1,0).
//   · Atributo de posição. O Sheet usa `data-side`; o Drawer usa
//     `data-vaul-drawer-direction`, que é o seletor que o CSS compartilhado lê.

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';
import { attachDrawerSwipe, type DrawerSwipeHandle } from '@shared/primitives/drawer-swipe';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Borda por onde o painel entra. */
export type DrawerDirection = 'bottom' | 'top' | 'left' | 'right';

/** Caminho que fechou o painel — o vocabulário que o analytics do produto usa. */
export type DrawerCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';

/**
 * O que a fábrica devolve.
 *
 * Abrir por código é o que faltava: a gaveta só nascia do clique no gatilho,
 * enquanto `createHoverCard` e `createSidebar` já abriam por chamada — e por
 * nomes diferentes um do outro. Aqui os verbos são os do Sidebar, em inglês,
 * que é a forma que o repositório adotou.
 */
export type DrawerElement = DestroyableElement & {
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Está aberta agora? */
  isOpen: () => boolean;
};

export type DrawerOptions = {
  trigger: HTMLElement;
  /** Borda de entrada. Só em `bottom` a alça aparece. */
  direction?: DrawerDirection;
  title?: string;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  /**
   * Nome acessível do CORPO que rola. Sem padrão, de propósito.
   *
   * O corpo entra na ordem de tabulação porque rola (WCAG 2.1.1), e uma parada
   * de teclado precisa de papel e nome — a regra 6 da §8. O conteúdo é o que
   * quem monta pôs lá dentro, e só ali se sabe o que é; padrão genérico
   * ("Conteúdo") anunciaria sem informar.
   *
   * Não herdamos o título do painel: ele já foi anunciado na abertura, e
   * repeti-lo aqui informaria pouco pelo que custa. Sem nome NÃO emitimos papel
   * nenhum — `aria-label` em elemento sem papel é atributo proibido, e o axe
   * acusa `aria-prohibited-attr`.
   *
   * `group` e não `region`: o corpo já vive dentro de um diálogo nomeado, e um
   * marco aninhado num diálogo não acrescenta navegação, só entrada na lista.
   */
  bodyLabel?: string;

  /**
   * Quando `false`, Escape e clique no overlay não fecham — a saída passa a ser
   * só o que quem compõe colocar no rodapé.
   */
  dismissible?: boolean;
  /**
   * Quando `false`, o resto da página continua utilizável: sem `aria-modal`, sem
   * trava de rolagem. O foco continua preso enquanto o painel existe.
   */
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Chamado no fechamento com o caminho que o causou (espelha o Sheet). */
  onClose?: (reason: DrawerCloseReason) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _drawerCounter = 0;

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.closest('[hidden]'));
}

// ─── createDrawer ─────────────────────────────────────────────────────────────

export function createDrawer(options: DrawerOptions): DrawerElement {
  const {
    trigger,
    direction = 'bottom',
    title,
    description,
    content,
    footer,
    bodyLabel,
    dismissible = true,
    modal = true,
    onOpenChange,
    onClose,
  } = options;

  const id = ++_drawerCounter;
  const titleId = `drawer-title-${id}`;
  const descId = `drawer-desc-${id}`;

  let overlayEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;
  /**
   * Este painel está segurando a trava de rolagem?
   *
   * A contagem vive em `@/lib/scroll-lock`, compartilhada com o Sheet. Guardar
   * e devolver o valor cru de `overflow` aqui dentro parecia certo e quebrava
   * com dois painéis: o segundo a abrir guardaria `hidden` como valor anterior
   * e o devolveria ao fechar, e a página nunca mais rolaria.
   */
  let scrollLocked = false;
  /**
   * Motor do arraste, vivo só enquanto o painel existe.
   *
   * Fica aqui (e não dentro de `open`) porque `desmontarPanel` precisa alcançá-lo:
   * o painel é removido do documento, e um motor ainda instalado num nó órfão
   * seguraria o nó inteiro pela referência dos ouvintes.
   */
  let swipeEngine: DrawerSwipeHandle | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'drawer';
  wrapper.appendChild(trigger);

  function isOpen(): boolean {
    return panelEl !== null;
  }

  function open(): void {
    // Reentrância: o gatilho pode ser clicado de novo (ou por código) enquanto o
    // painel já está montado. Sem esta guarda saem dois diálogos no body, e a
    // busca por papel passa a falhar com "found multiple elements" — foi o que
    // derrubou nove testes desta stack.
    if (isOpen()) return;

    previousFocus = document.activeElement as HTMLElement;

    overlayEl = document.createElement('div');
    overlayEl.className = 'nds-sheet-overlay';
    overlayEl.dataset.slot = 'drawer-overlay';
    overlayEl.dataset.state = 'open';
    overlayEl.addEventListener('click', () => {
      if (dismissible) closeWithReason('overlay');
    });

    panelEl = document.createElement('div');
    panelEl.className = cn('nds-drawer-content', options.class);
    panelEl.dataset.slot = 'drawer-content';
    panelEl.dataset.state = 'open';
    // O atributo que TODA regra de posição, borda e canto do painel lê no CSS
    // compartilhado. Escrevê-lo no wrapper (como as stories faziam) não pinta
    // nada: o seletor é `.nds-drawer-content[data-vaul-drawer-direction=…]`.
    panelEl.dataset.vaulDrawerDirection = direction;
    panelEl.setAttribute('role', 'dialog');
    if (modal) panelEl.setAttribute('aria-modal', 'true');
    if (title) panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);

    // Alça: pura afordância. O CSS só a mostra na direção de baixo, e ela não
    // recebe foco nem nome — não há gesto atrás dela, então anunciá-la só
    // somaria ruído ao leitor de tela.
    const handleEl = document.createElement('div');
    handleEl.className = 'nds-drawer-handle';
    handleEl.setAttribute('aria-hidden', 'true');
    panelEl.appendChild(handleEl);

    if (title || description) {
      const headerEl = document.createElement('div');
      headerEl.className = 'nds-drawer-header';
      headerEl.dataset.slot = 'drawer-header';

      if (title) {
        const titleEl = document.createElement('h2');
        titleEl.id = titleId;
        // `.nds-sheet-title` e não `.nds-drawer-title`: o cabeçalho do CSS
        // compartilhado declara que o Drawer reusa título e descrição do Sheet,
        // e `.nds-drawer-title` não existe.
        titleEl.className = 'nds-sheet-title';
        titleEl.dataset.slot = 'drawer-title';
        titleEl.textContent = title;
        headerEl.appendChild(titleEl);
      }

      if (description) {
        const descEl = document.createElement('p');
        descEl.id = descId;
        descEl.className = 'nds-sheet-description';
        descEl.dataset.slot = 'drawer-description';
        descEl.textContent = description;
        headerEl.appendChild(descEl);
      }

      panelEl.appendChild(headerEl);
    }

    // Corpo rolável. `tabindex="0"` é obrigatório: região que rola precisa ser
    // alcançável por teclado (WCAG 2.1.1 — regra `scrollable-region-focusable`
    // do axe).
    const bodyEl = document.createElement('div');
    bodyEl.className = 'nds-drawer-body';
    bodyEl.dataset.slot = 'drawer-body';
    bodyEl.setAttribute('tabindex', '0');
    if (bodyLabel) {
      bodyEl.setAttribute('role', 'group');
      bodyEl.setAttribute('aria-label', bodyLabel);
    }
    bodyEl.appendChild(content);
    panelEl.appendChild(bodyEl);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'nds-drawer-footer';
      footerEl.dataset.slot = 'drawer-footer';
      footerEl.appendChild(footer);
      panelEl.appendChild(footerEl);
    }

    // Fechador explícito, o equivalente desta stack ao componente `DrawerClose`
    // das outras: qualquer elemento com `data-slot="drawer-close"` dentro do
    // painel fecha ao ser acionado. Sem isto, o "Cancelar" do rodapé é um botão
    // inerte — e era, porque a factory anterior só oferecia o X do Sheet.
    //
    // A escuta é DELEGADA no painel, e não um ouvinte por botão. O painel é um
    // nó novo a cada abertura, então nada se acumula; a forma anterior
    // registrava de novo nos MESMOS elementos de rodapé a cada `open()` — o
    // rodapé é o elemento que quem compõe passou, e ele sobrevive ao
    // fechamento. Fechar continuava certo (o `closeWithReason` sai cedo quando
    // já está fechado), mas os ouvintes cresciam sem limite.
    //
    // Delegar também cobre o clique que cai num ícone DENTRO do botão, que é o
    // caso real de um fechador composto.
    panelEl.addEventListener('click', (e) => {
      const alvo = (e.target as HTMLElement | null)?.closest('[data-slot="drawer-close"]');
      if (alvo) closeWithReason('close-button');
    });

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    if (modal) {
      lockBodyScroll();
      scrollLocked = true;
    }

    getFocusable(panelEl)[0]?.focus();

    /*
     * Arraste para dispensar — o mesmo gesto que as três stacks com lib de
     * gaveta trazem pronto, aqui pelo motor compartilhado.
     *
     * Fecha por `'overlay'`, e não por um motivo novo: para quem escuta, soltar
     * o painel para fora da tela é a mesma decisão de "saí sem decidir nada" que
     * o clique no véu — e o vocabulário de `DrawerCloseReason` é o que o
     * analytics do produto consome, então motivo novo aqui vira dimensão nova
     * no GA4 sem que ninguém tenha pedido.
     */
    swipeEngine = attachDrawerSwipe({
      panel: panelEl,
      direction: () => direction,
      dismissible: () => dismissible,
      onDismiss: () => closeWithReason('overlay'),
    });

    document.addEventListener('keydown', handleKeydown);
    onOpenChange?.(true);
  }

  /**
   * Tira o painel do documento e solta o que ele prendeu.
   *
   * Separado do fechamento por vontade de quem usa — mesma divisão do Sheet:
   * aqui não se devolve foco (o elemento anterior pode ter saído do DOM junto)
   * nem se anuncia motivo, porque não houve motivo nenhum: a gaveta não foi
   * fechada, ela deixou de existir.
   */
  function desmontarPanel(): void {
    swipeEngine?.destroy();
    swipeEngine = null;
    overlayEl?.remove();
    panelEl?.remove();
    overlayEl = null;
    panelEl = null;
    document.removeEventListener('keydown', handleKeydown);
    // Guardado por `scrollLocked`, e não por `modal`: `destroy()` chama o
    // fechamento mesmo sem nada montado, e uma solta a mais liberaria a trava
    // de um painel vizinho que ainda está aberto.
    if (scrollLocked) {
      unlockBodyScroll();
      scrollLocked = false;
    }
  }

  function closeWithReason(reason: DrawerCloseReason): void {
    if (!isOpen()) return;

    desmontarPanel();
    previousFocus?.focus();
    onClose?.(reason);
    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      // Sem `dismissible`, Escape não fecha — mas também não é engolido em
      // silêncio noutro lugar: a saída explícita do rodapé continua no foco.
      if (!dismissible) return;
      e.preventDefault();
      closeWithReason('escape');
      return;
    }
    if (e.key === 'Tab' && panelEl) {
      const focusable = getFocusable(panelEl);
      if (!focusable.length) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  trigger.addEventListener('click', open);

  /*
   * Painel e overlay moram no `document.body`, e o `keydown` de Escape/Tab vive
   * no `document` enquanto a gaveta está aberta. Fechar solta os dois — mas só
   * quem fecha. Quem removia o wrapper com a gaveta ABERTA deixava para trás o
   * painel órfão, a trava de rolagem do modo modal e o ouvinte de teclado,
   * agora preso a um nó fora do documento. Não havia nada a chamar: esta era a
   * única fábrica de sobreposição portalada sem guarda de saída.
   */
  // `Object.assign` e não um `as`: os verbos entram no tipo do próprio alvo, e
  // `tornarDestruivel` devolve exatamente `DrawerElement` sem conversão. Uma
  // asserção aqui teria de passar por `unknown` — o wrapper é `HTMLDivElement` e
  // o tipo declarado parte de `HTMLElement`, e nenhum dos dois cobre o outro.
  return tornarDestruivel(
    wrapper,
    Object.assign(wrapper, {
      open,
      // Fechar por código informa o motivo `'api'`: quem escuta `onClose` separa
      // a gaveta que a pessoa dispensou da que o programa recolheu — e no
      // analytics essas duas nunca foram a mesma coisa.
      close: () => closeWithReason('api'),
      toggle: () => {
        if (isOpen()) closeWithReason('api');
        else open();
      },
      isOpen,
    }),
    () => {
      const estavaAberta = isOpen();
      desmontarPanel();
      if (estavaAberta) onOpenChange?.(false);
    },
  );
}
