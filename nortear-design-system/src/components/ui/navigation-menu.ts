// ─── NavigationMenu — Vanilla factory standalone ────────────────────────────
// Visual: classes .nds-navigation-menu-* (zero Tailwind/basecoat-css).
// Painel via `hidden` attribute; um aberto por vez; click-fora fecha.

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavigationMenuChild = {
  label: string;
  href: string;
  description?: string;
};

export type NavigationMenuItem = {
  label: string;
  href?: string;
  children?: NavigationMenuChild[];
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
  options?: { class?: string }
): HTMLElement {
  const id = ++_navCounter;
  const nav = document.createElement('nav');
  nav.dataset.slot = 'navigation-menu';
  nav.setAttribute('aria-label', 'Main navigation');
  nav.className = 'nds-navigation-menu';
  if (options?.class) nav.classList.add(...options.class.split(' ').filter(Boolean));

  const ul = document.createElement('ul');
  ul.className = 'nds-navigation-menu-list';
  ul.setAttribute('role', 'menubar');

  let openItem: { content: HTMLElement; trigger: HTMLElement } | null = null;

  function closeAll(): void {
    if (!openItem) return;
    openItem.content.hidden = true;
    openItem.trigger.setAttribute('aria-expanded', 'false');
    openItem.trigger.dataset.state = 'closed';
    openItem = null;
  }

  items.forEach((item, idx) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'none');

    if (!item.children || item.children.length === 0) {
      const a = document.createElement('a');
      a.href = item.href ?? '#';
      a.className = 'nds-navigation-menu-link';
      a.setAttribute('role', 'menuitem');
      a.textContent = item.label;
      li.appendChild(a);
    } else {
      const contentId = `nav-menu-content-${id}-${idx}`;
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'nds-navigation-menu-trigger';
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', contentId);
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('role', 'menuitem');
      trigger.dataset.state = 'closed';
      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;
      trigger.appendChild(labelSpan);
      trigger.appendChild(createChevronSvg());

      const content = document.createElement('div');
      content.id = contentId;
      content.className = 'nds-navigation-menu-content';
      content.setAttribute('role', 'menu');
      content.hidden = true;

      item.children.forEach((child) => {
        const childA = document.createElement('a');
        childA.href = child.href;
        childA.className = 'nds-navigation-menu-child';
        childA.setAttribute('role', 'menuitem');

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

        content.appendChild(childA);
      });

      trigger.addEventListener('click', () => {
        const isOpen = trigger.dataset.state === 'open';
        closeAll();
        if (!isOpen) {
          content.hidden = false;
          trigger.setAttribute('aria-expanded', 'true');
          trigger.dataset.state = 'open';
          openItem = { content, trigger };
        }
      });

      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeAll();
          trigger.focus();
        }
        if (e.key === 'ArrowDown' && trigger.dataset.state === 'open') {
          e.preventDefault();
          const firstLink = content.querySelector<HTMLElement>('[role="menuitem"]');
          firstLink?.focus();
        }
      });

      content.addEventListener('keydown', (e) => {
        const links = Array.from(content.querySelectorAll<HTMLElement>('[role="menuitem"]'));
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

      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'nds-navigation-menu-item';
      itemWrapper.appendChild(trigger);
      itemWrapper.appendChild(content);
      li.appendChild(itemWrapper);
    }

    ul.appendChild(li);
  });

  document.addEventListener('click', (e) => {
    if (openItem && !nav.contains(e.target as Node)) closeAll();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openItem) {
      const triggerToFocus = openItem.trigger;
      closeAll();
      triggerToFocus.focus();
    }
  });

  nav.appendChild(ul);
  return nav;
}
