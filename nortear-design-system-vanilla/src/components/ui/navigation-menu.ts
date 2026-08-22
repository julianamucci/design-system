// ─── NavigationMenu — Vanilla factory standalone ────────────────────────────
// Visual: classes .nds-navigation-menu-* (docs/shared/styles/nds/navigation-menu.css).
// Painel via atributo `hidden`; um aberto por vez; clique fora e Escape fecham.
//
// ─── Isto é NAVEGAÇÃO, não menu de comandos ──────────────────────────────────
//
// A barra usa o padrão de DIVULGAÇÃO (disclosure) do APG: `aria-expanded` +
// `aria-controls` no gatilho, e nada de `role="menu"`/`role="menubar"`.
//
//   · o item é um `<a href>` de verdade. Quem navega quer abrir em nova aba,
//     copiar o endereço e ver o destino na barra de status — `role="menuitem"`
//     apaga as três coisas, porque o leitor de tela deixa de anunciar "link";
//   · o painel NÃO recebe `role="menu"`: é uma lista de destinos, e quem ouve
//     "menu, 4 itens" espera comandos, não páginas;
//   · o gatilho NÃO recebe `aria-haspopup`. A guideline 01 é explícita: se o
//     gatilho anuncia um popup, o painel precisa ter o papel correspondente.
//     Como o painel é navegação, anunciar `aria-haspopup` prometeria um papel
//     que não existe.
//
// `role="menubar"` também obriga a barra a gerenciar tabindex móvel e a aceitar
// só filhos `menuitem` (`aria-required-children`) — contrato que esta factory
// não cumpria e que o próprio conteúdo compartilhado já negava ("Tab move o
// foco para fora do menu, não loop interno como Menubar").

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

export type NavigationMenuChild = {
  label: string;
  href: string;
  description?: string;
};

export type NavigationMenuItem = {
  label: string;
  href?: string;
  children?: NavigationMenuChild[];
  /**
   * Identificador do item no valor da barra.
   *
   * É o que `value`/`defaultValue`/`onValueChange` trocam entre si. Sem ele o
   * rótulo serve de identidade — o que basta enquanto ninguém traduz a barra,
   * e deixa de bastar no dia em que alguém traduzir.
   */
  value?: string;
  /**
   * Marca o destino como a página atual.
   *
   * Escreve `aria-current="page"` — o que o leitor de tela anuncia E o que a
   * folha compartilhada usa para pintar o destaque. Um atributo só, porque cor
   * sozinha não informa quem não a distingue.
   */
  active?: boolean;
};

export type NavigationMenuOrientation = 'horizontal' | 'vertical';

export type NavigationMenuOptions = {
  class?: string;
  /**
   * Nome acessível do landmark de navegação.
   *
   * Era cravado, e em INGLÊS (`'Main navigation'`), num design system escrito em
   * português — quem ouvia a tela recebia o nome numa língua e o conteúdo em
   * outra. As outras quatro stacks passam `Navegação principal` pela story, e
   * nenhuma podia ser seguida aqui porque a fábrica não aceitava o nome.
   *
   * O padrão continua servindo à barra principal de uma página, que é o caso
   * comum; uma segunda barra na mesma página precisa de nome próprio, senão as
   * duas ficam indistinguíveis na lista de landmarks.
   */
  'aria-label'?: string;
  /** Direção da barra. Vertical serve a colunas laterais e gavetas móveis. */
  orientation?: NavigationMenuOrientation;
  /** Espera em ms antes de abrir o painel quando o ponteiro entra no gatilho. */
  delayDuration?: number;
  /**
   * Janela, depois de um painel fechar, em que o PRÓXIMO abre sem esperar.
   *
   * Quem acabou de percorrer a barra não precisa provar de novo a cada gatilho:
   * a espera existe para separar o ponteiro que atravessa do que para, e isso
   * já foi decidido uma vez. `0` desliga e toda abertura volta a esperar.
   */
  skipDelayDuration?: number;
  /**
   * Painel aberto, em modo CONTROLADO.
   *
   * Definido, a barra deixa de se governar: ponteiro, teclado e clique passam a
   * apenas ANUNCIAR a intenção por `onValueChange`, e nada se move até
   * `setValue()`. String vazia quer dizer "nenhum painel aberto".
   */
  value?: string;
  /** Painel aberto na montagem, em modo não-controlado. */
  defaultValue?: string;
  /** Avisado a cada mudança do painel aberto. Vazio quer dizer fechado. */
  onValueChange?: (value: string) => void;
};

/** O que a fábrica devolve. */
export type NavigationMenuElement = DestroyableElement & {
  /** Move a barra para o painel pedido. Vazio fecha tudo. */
  setValue: (value: string) => void;
  /** Painel aberto agora. Vazio quer dizer fechado. */
  getValue: () => string;
};

// ─── Chevron SVG (anexado via createElementNS) ───────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

function createChevronSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('class', 'nds-navigation-menu-chevron');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'm6 9 6 6 6-6');
  svg.appendChild(path);
  return svg;
}

let _navCounter = 0;

// ─── createNavigationMenu ─────────────────────────────────────────────────────

export function createNavigationMenu(
  items: NavigationMenuItem[],
  options?: NavigationMenuOptions
): NavigationMenuElement {
  const id = ++_navCounter;
  const orientation: NavigationMenuOrientation = options?.orientation ?? 'horizontal';
  const vertical = orientation === 'vertical';
  const delayDuration = options?.delayDuration ?? 200;
  const skipDelayDuration = options?.skipDelayDuration ?? 300;
  const controlado = options?.value !== undefined;

  const nav = document.createElement('nav');
  nav.dataset.slot = 'navigation-menu';
  nav.dataset.orientation = orientation;
  nav.setAttribute('aria-label', options?.['aria-label'] ?? 'Navegação principal');
  nav.className = cn('nds-navigation-menu', options?.class);

  const ul = document.createElement('ul');
  ul.dataset.slot = 'navigation-menu-list';
  ul.dataset.orientation = orientation;
  // A folha compartilhada só descreve a barra horizontal. Na vertical a lista
  // vira `.nds-stack`, que é a mesma saída das demais stacks.
  ul.className = vertical
    ? 'nds-stack nds-list-none nds-w-full'
    : 'nds-navigation-menu-list';
  if (vertical) ul.dataset.spacing = 'xs';

  type Painel = { content: HTMLElement; trigger: HTMLElement; value: string };

  let openItem: Painel | null = null;
  let timerAbertura: ReturnType<typeof setTimeout> | null = null;
  /** Quando o último painel saiu da tela — é o relógio do `skipDelayDuration`. */
  let closedIn = 0;
  /** Painéis por valor, para `setValue()` alcançar qualquer um pelo nome. */
  const paineis = new Map<string, Painel>();

  function cancelarAbertura(): void {
    if (timerAbertura !== null) {
      clearTimeout(timerAbertura);
      timerAbertura = null;
    }
  }

  function closeAll(): void {
    cancelarAbertura();
    if (!openItem) return;
    openItem.content.hidden = true;
    openItem.trigger.setAttribute('aria-expanded', 'false');
    openItem.trigger.dataset.state = 'closed';
    openItem = null;
    closedIn = Date.now();
  }

  /** Abertura pedida por uma interação sobre um gatilho. */
  function open(trigger: HTMLElement): void {
    const painel = [...paineis.values()].find((p) => p.trigger === trigger);
    if (painel) pedirValue(painel.value);
  }

  /** Move a barra. É o único caminho que mexe no DOM dos painéis. */
  function applyValue(valor: string): void {
    // `?? ''` porque "nenhum painel aberto" é a string vazia, e sem ela um
    // `setValue('')` numa barra já fechada anunciaria um fechamento que não
    // aconteceu.
    if ((openItem?.value ?? '') === valor) return;
    closeAll();
    const painel = valor ? paineis.get(valor) : undefined;
    if (painel) {
      painel.content.hidden = false;
      painel.trigger.setAttribute('aria-expanded', 'true');
      painel.trigger.dataset.state = 'open';
      openItem = painel;
    }
    // Controlada, a barra não anuncia o que ela própria aplicou: quem pediu a
    // mudança foi quem chama, e o aviso já saiu na intenção. Sem esta cerca, um
    // `onValueChange` que responde com `setValue()` receberia o mesmo evento
    // duas vezes.
    if (!controlado) options?.onValueChange?.(openItem?.value ?? '');
  }

  /**
   * Intenção vinda de uma INTERAÇÃO (ponteiro, clique, teclado).
   *
   * Controlada, ela só é anunciada — quem manda na barra é quem chama. Fora do
   * modo controlado, ela é aplicada na hora.
   */
  function pedirValue(valor: string): void {
    if ((openItem?.value ?? '') === valor) return;
    if (controlado) {
      options?.onValueChange?.(valor);
      return;
    }
    applyValue(valor);
  }

  /** Os elementos focáveis da BARRA — gatilhos e destinos diretos, em ordem. */
  function barItems(): HTMLElement[] {
    return [
      ...ul.querySelectorAll<HTMLElement>(
        ':scope > li > .nds-navigation-menu-link, :scope > li > .nds-navigation-menu-item > .nds-navigation-menu-trigger'
      ),
    ];
  }

  /**
   * Setas movem o foco ao longo da barra; Home/End vão às pontas.
   *
   * O eixo segue a orientação: numa coluna, seta para o lado não move nada, e
   * seria justamente o gesto que o leitor de tela ensina a usar.
   */
  function navegarPelaBar(e: KeyboardEvent): boolean {
    const anterior = vertical ? 'ArrowUp' : 'ArrowLeft';
    const proximo = vertical ? 'ArrowDown' : 'ArrowRight';
    const itens = barItems();
    const atual = itens.indexOf(document.activeElement as HTMLElement);
    if (atual === -1) return false;

    let destino = -1;
    if (e.key === proximo) destino = (atual + 1) % itens.length;
    else if (e.key === anterior) destino = (atual - 1 + itens.length) % itens.length;
    else if (e.key === 'Home') destino = 0;
    else if (e.key === 'End') destino = itens.length - 1;
    if (destino === -1) return false;

    e.preventDefault();
    itens[destino]?.focus();
    return true;
  }

  items.forEach((item, idx) => {
    const li = document.createElement('li');

    if (!item.children || item.children.length === 0) {
      const a = document.createElement('a');
      a.href = item.href ?? '#';
      a.className = 'nds-navigation-menu-link';
      a.dataset.slot = 'navigation-menu-link';
      if (item.active) a.setAttribute('aria-current', 'page');
      a.textContent = item.label;
      a.addEventListener('keydown', (e) => {
        navegarPelaBar(e);
      });
      li.appendChild(a);
    } else {
      const contentId = `nav-menu-content-${id}-${idx}`;
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'nds-navigation-menu-trigger';
      trigger.dataset.slot = 'navigation-menu-trigger';
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', contentId);
      trigger.dataset.state = 'closed';
      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;
      trigger.appendChild(labelSpan);
      trigger.appendChild(createChevronSvg());

      const content = document.createElement('div');
      content.id = contentId;
      content.className = 'nds-navigation-menu-content';
      content.dataset.slot = 'navigation-menu-content';
      content.hidden = true;

      const itemValue = item.value ?? item.label;
      paineis.set(itemValue, { trigger, content, value: itemValue });
      // O valor fica legível no markup: é como uma story prova que a barra
      // abriu o painel PEDIDO, e não um painel qualquer.
      trigger.dataset.value = itemValue;
      content.dataset.value = itemValue;

      item.children.forEach((child) => {
        const childA = document.createElement('a');
        childA.href = child.href;
        childA.className = 'nds-navigation-menu-child';
        childA.dataset.slot = 'navigation-menu-child';

        const labelEl = document.createElement('div');
        labelEl.className = 'nds-navigation-menu-child-label';
        labelEl.textContent = child.label;
        childA.appendChild(labelEl);

        if (child.description) {
          const descEl = document.createElement('p');
          descEl.className = 'nds-navigation-menu-child-description';
          descEl.textContent = child.description;
          childA.appendChild(descEl);
        }

        // Navegar É sair da página: um painel que sobrevive ao clique fica
        // pendurado sobre a página seguinte. Não olha `defaultPrevented` de
        // propósito — quem usa roteador de cliente chama `preventDefault()` e
        // continua querendo o painel fechado.
        childA.addEventListener('click', () => pedirValue(''));

        content.appendChild(childA);
      });

      trigger.addEventListener('click', () => {
        const isOpen = trigger.dataset.state === 'open';
        if (isOpen) pedirValue('');
        else open(trigger);
      });

      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'nds-navigation-menu-item';
      itemWrapper.dataset.slot = 'navigation-menu-item';

      // Abertura por ponteiro, com espera. Duas situações a dispensam: já haver
      // um painel aberto (reesperar entre dois gatilhos vizinhos faz o painel
      // piscar) e o painel anterior ter fechado há pouco — a janela do
      // `skipDelayDuration`, que é o que as demais stacks chamam pelo mesmo
      // nome.
      itemWrapper.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        cancelarAbertura();
        const panelTroca = !!openItem && openItem.trigger !== trigger;
        const windowInside =
          skipDelayDuration > 0 && !openItem && Date.now() - closedIn < skipDelayDuration;
        if (panelTroca || windowInside) {
          open(trigger);
          return;
        }
        timerAbertura = setTimeout(() => open(trigger), delayDuration);
      });
      itemWrapper.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        cancelarAbertura();
      });

      trigger.addEventListener('keydown', (e) => {
        if (navegarPelaBar(e)) return;
        if (e.key === 'Escape') {
          pedirValue('');
          trigger.focus();
          return;
        }
        // Enter e Espaço já disparam o `click` nativo do <button>; o que falta é
        // levar o foco PARA DENTRO do painel, senão o teclado abre e fica preso
        // do lado de fora.
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          if (e.key === 'ArrowDown' && trigger.dataset.state !== 'open') return;
          e.preventDefault();
          open(trigger);
          content.querySelector<HTMLElement>('.nds-navigation-menu-child')?.focus();
        }
      });

      content.addEventListener('keydown', (e) => {
        const links = [...content.querySelectorAll<HTMLElement>('.nds-navigation-menu-child')];
        const focused = links.indexOf(document.activeElement as HTMLElement);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          links[(focused + 1) % links.length]?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          links[(focused - 1 + links.length) % links.length]?.focus();
        } else if (e.key === 'Escape') {
          pedirValue('');
          trigger.focus();
        }
      });

      itemWrapper.appendChild(trigger);
      itemWrapper.appendChild(content);
      li.appendChild(itemWrapper);
    }

    ul.appendChild(li);
  });

  /*
   * Os dois eram anônimos e registrados NA MONTAGEM, sem par. A guarda por
   * `nav.isConnected` deixava o ouvinte de uma barra removida INERTE — que é
   * outra coisa de estar removido: ele continuava no `document`, sendo chamado
   * a cada clique e a cada tecla da página, e segurando na closure a barra
   * inteira que deveria ter sido coletada. Uma story remontada dez vezes
   * chegava ao fim com vinte ouvintes vivos.
   *
   * A guarda fica onde estava: `destroy()` cobre a remoção da barra, mas o
   * `isConnected` ainda protege a janela entre a saída do nó e a varredura do
   * observador, que é assíncrona.
   */
  function onClickOutside(e: MouseEvent): void {
    if (!nav.isConnected) return;
    if (openItem && !nav.contains(e.target as Node)) pedirValue('');
  }

  function onDocumentKeyDown(e: KeyboardEvent): void {
    if (!nav.isConnected) return;
    if (e.key === 'Escape' && openItem) {
      const triggerToFocus = openItem.trigger;
      pedirValue('');
      triggerToFocus.focus();
    }
  }

  document.addEventListener('click', onClickOutside);
  document.addEventListener('keydown', onDocumentKeyDown);

  nav.appendChild(ul);

  // `Object.assign` e não um `as`: os dois verbos entram no tipo do próprio
  // alvo, e `tornarDestruivel` devolve exatamente `NavigationMenuElement`.
  const instancia = tornarDestruivel(
    nav,
    Object.assign(nav, {
      setValue: applyValue,
      getValue: () => openItem?.value ?? '',
    }),
    () => {
      closeAll();
      document.removeEventListener('click', onClickOutside);
      document.removeEventListener('keydown', onDocumentKeyDown);
    },
  );

  // Estado inicial. Controlada, quem manda é `value`; fora disso, `defaultValue`.
  const valorInicial = controlado ? options?.value ?? '' : options?.defaultValue ?? '';
  if (valorInicial) applyValue(valorInicial);

  return instancia;
}
