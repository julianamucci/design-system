import { createDocsNav, type DocsNavGroup, type DocsNavHandle } from '../DocsNav';
import { DOCS_PAGE_TITLE_ID } from './DocsHeader';
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
  // .sb-unstyled é a escape hatch oficial do Storybook que desliga o
  // prose-style emotion na subárvore (ver storybook-docs.css).
  // .nds-page = wrapper top-level: max-width + padding lateral + ritmo vertical.
  root.className = 'sb-unstyled ds-docs nds-page';
  root.dataset.width = 'wide';

  const headerSlot = document.createElement('div');

  // Layout sidebar+conteúdo, adaptável (empilha em telas estreitas).
  const layout = document.createElement('div');
  layout.className = 'nds-sidebar-layout';
  layout.dataset.sidebarSticky = 'true';

  // Sidebar: nav com espaçamento vertical entre grupos.
  const sidebar = document.createElement('nav');
  sidebar.setAttribute('aria-label', 'Navegação das seções do componente');
  sidebar.className = 'nds-stack';
  sidebar.dataset.spacing = 'md';

  // Conteúdo: landmark <main> (mesmas classes e mesmo lugar na árvore que o
  // <div> anterior — zero mudança visual) + stack com gap grande entre seções.
  // - tabindex="-1": recebe foco programático (skip link "Ir para o conteúdo")
  //   sem entrar na ordem de tabulação;
  // - aria-labelledby → <h1> do DocsHeader: o leitor de tela anuncia
  //   "principal, <título da página>" ao cair aqui, sem precisar mover o
  //   header no DOM.
  const main = document.createElement('main');
  main.className = 'ds-docs nds-stack';
  main.dataset.spacing = '2xl';
  main.tabIndex = -1;
  main.setAttribute('aria-labelledby', DOCS_PAGE_TITLE_ID);

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

  // slug omitido → derivado do ?id= do iframe (mountDocsTracking)
  const trackingCleanup = mountDocsTracking(root, { componentSlug: props.componentSlug });

  return {
    root,
    headerSlot,
    main,
    rebuildNav,
    setActiveSection,
    destroy: trackingCleanup,
  };
}
