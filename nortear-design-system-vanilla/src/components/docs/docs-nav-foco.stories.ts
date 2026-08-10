// Portão dos dois bugs de foco reportados com NVDA nas docs pages:
//
//  A. "Ir para o conteúdo" não levava a lugar nenhum — não havia landmark de
//     conteúdo. O DocsPageLayout agora rende <main tabindex="-1"
//     aria-labelledby="docs-page-title">.
//  B. A navegação interna só rolava; o foco ficava no botão do menu, então o
//     leitor de tela não continuava a leitura e o Tab seguinte ia para o
//     próximo item do menu. O DocsNav agora move o foco para a seção alvo.
//
// A prova roda sobre uma docs page real (ButtonDocs) porque os dois consertos
// vivem nos containers compartilhados — DocsPageLayout, DocsHeader e DocsNav —
// usados por todas as páginas de componente.

//  C. As 16 páginas de Foundations não usam o DocsPageLayout (renderer próprio)
//     e ficaram sem landmark. Agora o foundationsRenderer — e as duas páginas de
//     layout próprio, IconsDocs e ThemeColorsDocs — rendem o mesmo <main>.
//  D. docs_nav_click reportava section_id:"nav" (o segmento fixo do id) em vez
//     da seção de destino, e as 44 docs pages que não passam `componentSlug`
//     nem emitiam data-track-id. O DocsNav agora deriva o slug do ?id= do
//     iframe, igual ao mountDocsTracking.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, within } from 'storybook/test';
import { createButtonDocs } from './ButtonDocs';
import { createTypographyDocs } from './TypographyDocs';
import { createIconsDocs } from './IconsDocs';
import { createThemeColorsDocs } from './ThemeColorsDocs';

const meta: Meta = {
  title: 'QA/Docs Nav Foco',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Existe exatamente um <main>, ele é nomeado pelo <h1> da página e recebe foco
 * programático. `main` aninhado seria HTML inválido e o axe acusaria
 * `landmark-no-duplicate-main` — daí a contagem exata.
 */
async function assertLandmarkPrincipal(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);

  const mains = canvasElement.querySelectorAll('main');
  await expect(mains).toHaveLength(1);

  const h1 = canvasElement.querySelector('h1');
  await expect(h1).not.toBeNull();
  const pageTitle = h1!.textContent!.trim();

  // Falha se o aria-labelledby não resolver para o <h1> da página.
  const main = canvas.getByRole('main', { name: pageTitle });
  await expect(main).toBe(mains[0]);
  await expect(main).toHaveAttribute('tabindex', '-1');
}

/** A — docs page de componente (DocsPageLayout). */
export const LandmarkPrincipal: Story = {
  render: () => createButtonDocs(),
  play: async ({ canvasElement }) => {
    await assertLandmarkPrincipal(canvasElement);
  },
};

/** C — Foundations pelo renderer genérico (cobre as 14 páginas que o usam). */
export const LandmarkFoundations: Story = {
  render: () => createTypographyDocs(),
  play: async ({ canvasElement }) => {
    await assertLandmarkPrincipal(canvasElement);
  },
};

/** C — Foundations com layout próprio, fora do renderer. */
export const LandmarkFoundationsIcones: Story = {
  render: () => createIconsDocs(),
  play: async ({ canvasElement }) => {
    await assertLandmarkPrincipal(canvasElement);
  },
};

/** C — Foundations com layout próprio, fora do renderer. */
export const LandmarkFoundationsCores: Story = {
  render: () => createThemeColorsDocs(),
  play: async ({ canvasElement }) => {
    await assertLandmarkPrincipal(canvasElement);
  },
};

/** B — acionar um item do menu deixa o foco DENTRO da seção alvo. */
export const FocoAoNavegar: Story = {
  render: () => createButtonDocs(),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const navButtons = Array.from(
      canvasElement.querySelectorAll<HTMLButtonElement>('.nds-docs-nav-button'),
    );
    await expect(navButtons.length).toBeGreaterThan(0);

    const sections = Array.from(canvasElement.querySelectorAll<HTMLElement>('main section[id]'));
    await expect(sections.length).toBeGreaterThan(0);

    for (const btn of navButtons) {
      await userEvent.click(btn);

      const active = doc.activeElement;
      // O foco saiu do menu…
      await expect(btn).not.toBe(active);
      // …e caiu dentro de uma seção do conteúdo (é a própria <section>, que
      // recebe tabindex="-1" no clique).
      const landed = sections.find((s) => s.contains(active));
      await expect(landed, `foco não entrou em nenhuma seção ao clicar em "${btn.textContent}"`)
        .toBeDefined();
      await expect(landed).toBe(active);
    }
  },
};

/**
 * D — ButtonDocs NÃO passa `componentSlug` ao DocsPageLayout (como outras 43
 * docs pages). Mesmo assim todo botão do nav sai com `data-track-id` de 3
 * partes, `nav` no meio e a SEÇÃO DE DESTINO no 3º segmento — o slug vem do
 * fallback derivado do `?id=` do iframe.
 */
export const NavTrackingWithoutSlug: Story = {
  render: () => createButtonDocs(),
  play: async ({ canvasElement }) => {
    const navButtons = Array.from(
      canvasElement.querySelectorAll<HTMLButtonElement>('.nds-docs-nav-button'),
    );
    await expect(navButtons.length).toBeGreaterThan(0);

    for (const btn of navButtons) {
      const id = btn.getAttribute('data-track-id');
      await expect(id, `botão "${btn.textContent}" sem data-track-id`).toBeTruthy();

      const parts = id!.split(':');
      await expect(parts, `id fora do contrato {component}:{section}:{element}: ${id}`)
        .toHaveLength(3);
      await expect(parts[0]).toBeTruthy();
      await expect(parts[1]).toBe('nav');
      // 3º segmento = seção de destino, e ela existe na página.
      await expect(parts[2]).toBeTruthy();
      await expect(canvasElement.querySelector(`#${CSS.escape(parts[2])}`)).not.toBeNull();
    }
  },
};

/**
 * D — o evento em si: `docs_nav_click` precisa reportar a seção de destino em
 * `section_id`. Antes o código lia o segmento do meio e TODO clique saía com
 * `section_id: "nav"`.
 */
export const EventoNavReportaDestino: Story = {
  render: () => createButtonDocs(),
  play: async ({ canvasElement }) => {
    // `track()` encaminha para o gtag do manager (window.top quando em iframe).
    const managerWin = (window.self !== window.top ? window.top : window) as Window;
    const previous = managerWin.gtag;
    const calls: Array<[string, string, Record<string, unknown>]> = [];
    managerWin.gtag = ((...args: unknown[]) => {
      calls.push(args as [string, string, Record<string, unknown>]);
    }) as Window['gtag'];

    try {
      const btn = canvasElement.querySelector<HTMLButtonElement>('.nds-docs-nav-button');
      await expect(btn).not.toBeNull();
      const destino = btn!.getAttribute('data-track-id')!.split(':')[2];

      await userEvent.click(btn!);

      const navEvents = calls.filter(([cmd, name]) => cmd === 'event' && name === 'docs_nav_click');
      await expect(navEvents).toHaveLength(1);

      const params = navEvents[0][2];
      await expect(params.section_id).toBe(destino);
      await expect(params.section_id).not.toBe('nav');
      await expect(params.component).toBeTruthy();
    } finally {
      managerWin.gtag = previous;
    }
  },
};
