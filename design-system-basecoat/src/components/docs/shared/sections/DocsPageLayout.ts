import { createDocsNav, type DocsNavGroup, type DocsNavHandle } from '../DocsNav';
import { mountDocsTracking } from '@/lib/docs-tracking';

export interface DocsPageLayoutProps {
  navGroups: DocsNavGroup[];
  activeSection?: string;
  /** Slug do componente — habilita tracking automático via data-track*. */
  componentSlug?: string;
}

export interface DocsPageLayoutHandle {
  /** Outer container — append this to the DOM. */
  root: HTMLElement;
  /** Slot for the DocsHeader element. Use `headerSlot.replaceChildren(headerEl)`. */
  headerSlot: HTMLElement;
  /** Main content column — append sections here. */
  main: HTMLElement;
  /** Rebuilds the sidebar with a new set of groups (e.g. after locale change). */
  rebuildNav(groups: DocsNavGroup[]): void;
  /** Updates the active nav button. */
  setActiveSection(id: string | undefined): void;
  /** Cleanup do click observer de tracking. Chame ao desmontar. */
  destroy(): void;
}

export function createDocsPageLayout(props: DocsPageLayoutProps): DocsPageLayoutHandle {
  const root = document.createElement('div');
  root.className = 'ds-docs p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto';

  const headerSlot = document.createElement('div');

  const layout = document.createElement('div');
  layout.className = 'flex flex-col lg:flex-row gap-8 lg:gap-16 items-start';

  const sidebar = document.createElement('nav');
  sidebar.setAttribute('aria-label', 'Navegação das seções do componente');
  sidebar.className = 'w-full lg:sticky lg:top-8 lg:w-52 lg:shrink-0 self-start space-y-5';

  const main = document.createElement('div');
  main.className = 'ds-docs flex-1 min-w-0 w-full space-y-12';

  layout.append(sidebar, main);
  root.append(headerSlot, layout);

  let navHandle: DocsNavHandle | null = null;

  function rebuildNav(groups: DocsNavGroup[]) {
    navHandle = createDocsNav({
      groups,
      activeSection: props.activeSection,
      componentSlug: props.componentSlug,
    });
    sidebar.replaceChildren(navHandle.element);
  }

  function setActiveSection(id: string | undefined) {
    navHandle?.setActiveSection(id);
  }

  rebuildNav(props.navGroups);

  const trackingCleanup = props.componentSlug
    ? mountDocsTracking(root, { componentSlug: props.componentSlug })
    : () => {};

  return {
    root,
    headerSlot,
    main,
    rebuildNav,
    setActiveSection,
    destroy: trackingCleanup,
  };
}
