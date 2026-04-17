import { cn } from '@/lib/utils';

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

// ─── Classes ──────────────────────────────────────────────────────────────────

const ROOT_CLASS = 'relative z-10 flex max-w-max flex-1 items-center justify-center';
const LIST_CLASS = 'group flex flex-1 list-none items-center justify-center space-x-1';
const TRIGGER_CLASS =
  'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium ' +
  'transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ' +
  'focus:outline-none disabled:pointer-events-none disabled:opacity-50';
const LINK_CLASS =
  'inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium ' +
  'transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ' +
  'focus:outline-none';
const CONTENT_CLASS =
  'absolute top-full left-0 mt-1.5 min-w-[180px] rounded-md border bg-popover p-2 text-popover-foreground shadow-md z-50 hidden';
const CHILD_LINK_CLASS =
  'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors ' +
  'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground';

const CHEVRON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1 inline-block transition-transform duration-200" aria-hidden="true">' +
  '<path d="m6 9 6 6 6-6"/></svg>';

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
  nav.className = cn(ROOT_CLASS, options?.class);

  const ul = document.createElement('ul');
  ul.className = LIST_CLASS;
  ul.setAttribute('role', 'menubar');

  let openItem: { content: HTMLElement; trigger: HTMLElement; chevron: SVGElement | null } | null = null;

  function closeAll(): void {
    if (!openItem) return;
    openItem.content.classList.add('hidden');
    openItem.trigger.setAttribute('aria-expanded', 'false');
    openItem.trigger.dataset.state = 'closed';
    if (openItem.chevron) openItem.chevron.style.transform = '';
    openItem = null;
  }

  items.forEach((item, idx) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'none');

    if (!item.children || item.children.length === 0) {
      const a = document.createElement('a');
      a.href = item.href ?? '#';
      a.className = LINK_CLASS;
      a.setAttribute('role', 'menuitem');
      a.textContent = item.label;
      li.appendChild(a);
    } else {
      const contentId = `nav-menu-content-${id}-${idx}`;
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = TRIGGER_CLASS;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', contentId);
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('role', 'menuitem');
      trigger.dataset.state = 'closed';
      trigger.innerHTML = `<span>${item.label}</span>${CHEVRON_SVG}`;

      const content = document.createElement('div');
      content.id = contentId;
      content.className = CONTENT_CLASS;
      content.setAttribute('role', 'menu');

      const chevron = trigger.querySelector<SVGElement>('svg');

      item.children.forEach((child) => {
        const childA = document.createElement('a');
        childA.href = child.href;
        childA.className = CHILD_LINK_CLASS;
        childA.setAttribute('role', 'menuitem');

        const labelEl = document.createElement('div');
        labelEl.className = 'text-sm font-medium leading-none';
        labelEl.textContent = child.label;
        childA.appendChild(labelEl);

        if (child.description) {
          const descEl = document.createElement('p');
          descEl.className = 'line-clamp-2 text-sm leading-snug text-muted-foreground mt-1';
          descEl.textContent = child.description;
          childA.appendChild(descEl);
        }

        content.appendChild(childA);
      });

      trigger.addEventListener('click', () => {
        const isOpen = trigger.dataset.state === 'open';
        closeAll();
        if (!isOpen) {
          content.classList.remove('hidden');
          trigger.setAttribute('aria-expanded', 'true');
          trigger.dataset.state = 'open';
          if (chevron) chevron.style.transform = 'rotate(180deg)';
          openItem = { content, trigger, chevron };
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
      itemWrapper.style.position = 'relative';
      itemWrapper.appendChild(trigger);
      itemWrapper.appendChild(content);
      li.appendChild(itemWrapper);
    }

    ul.appendChild(li);
  });

  document.addEventListener('click', (e) => {
    if (openItem && !nav.contains(e.target as Node)) closeAll();
  });

  nav.appendChild(ul);
  return nav;
}
