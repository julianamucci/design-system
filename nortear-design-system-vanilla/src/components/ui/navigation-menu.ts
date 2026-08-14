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
  /** Direção da barra. Vertical serve a colunas laterais e gavetas móveis. */
  orientation?: NavigationMenuOrientation;
  /** Espera em ms antes de abrir o painel quando o ponteiro entra no gatilho. */
  delayDuration?: number;
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
): HTMLElement {
  const id = ++_navCounter;
  const orientation: NavigationMenuOrientation = options?.orientation ?? 'horizontal';
  const vertical = orientation === 'vertical';
  const delayDuration = options?.delayDuration ?? 200;

  const nav = document.createElement('nav');
  nav.dataset.slot = 'navigation-menu';
  nav.dataset.orientation = orientation;
  nav.setAttribute('aria-label', 'Main navigation');
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

  let openItem: { content: HTMLElement; trigger: HTMLElement } | null = null;
  let timerAbertura: ReturnType<typeof setTimeout> | null = null;

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
  }

  function open(trigger: HTMLElement, content: HTMLElement): void {
    if (openItem?.trigger === trigger) return;
    closeAll();
    content.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.dataset.state = 'open';
    openItem = { content, trigger };
  }

  /** Os elementos focáveis da BARRA — gatilhos e destinos diretos, em ordem. */
  function itensDaBarra(): HTMLElement[] {
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
  function navegarPelaBarra(e: KeyboardEvent): boolean {
    const anterior = vertical ? 'ArrowUp' : 'ArrowLeft';
    const proximo = vertical ? 'ArrowDown' : 'ArrowRight';
    const itens = itensDaBarra();
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
        navegarPelaBarra(e);
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
        childA.addEventListener('click', () => closeAll());

        content.appendChild(childA);
      });

      trigger.addEventListener('click', () => {
        const isOpen = trigger.dataset.state === 'open';
        if (isOpen) closeAll();
        else open(trigger, content);
      });

      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'nds-navigation-menu-item';
      itemWrapper.dataset.slot = 'navigation-menu-item';

      // Abertura por ponteiro, com espera. Quando JÁ existe um painel aberto a
      // troca é instantânea: reesperar entre dois gatilhos vizinhos faz o painel
      // piscar, que é o que `skipDelayDuration` evita nas demais stacks.
      itemWrapper.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        cancelarAbertura();
        if (openItem && openItem.trigger !== trigger) {
          open(trigger, content);
          return;
        }
        timerAbertura = setTimeout(() => open(trigger, content), delayDuration);
      });
      itemWrapper.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        cancelarAbertura();
      });

      trigger.addEventListener('keydown', (e) => {
        if (navegarPelaBarra(e)) return;
        if (e.key === 'Escape') {
          closeAll();
          trigger.focus();
          return;
        }
        // Enter e Espaço já disparam o `click` nativo do <button>; o que falta é
        // levar o foco PARA DENTRO do painel, senão o teclado abre e fica preso
        // do lado de fora.
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          if (e.key === 'ArrowDown' && trigger.dataset.state !== 'open') return;
          e.preventDefault();
          open(trigger, content);
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
          closeAll();
          trigger.focus();
        }
      });

      itemWrapper.appendChild(trigger);
      itemWrapper.appendChild(content);
      li.appendChild(itemWrapper);
    }

    ul.appendChild(li);
  });

  // Guardados por `nav.isConnected`: uma story remontada deixa a barra antiga
  // no ar, e sem a guarda o Escape de uma fecharia o painel da outra.
  document.addEventListener('click', (e) => {
    if (!nav.isConnected) return;
    if (openItem && !nav.contains(e.target as Node)) closeAll();
  });
  document.addEventListener('keydown', (e) => {
    if (!nav.isConnected) return;
    if (e.key === 'Escape' && openItem) {
      const triggerToFocus = openItem.trigger;
      closeAll();
      triggerToFocus.focus();
    }
  });

  nav.appendChild(ul);
  return nav;
}
