// Prova dos dois bugs de foco reportados com NVDA nas docs pages:
//   A. "Ir para o conteúdo" não tinha alvo — não havia landmark <main>.
//   B. Clicar num item do menu só rolava; o foco ficava no botão, então o
//      leitor não continuava a leitura e o Tab seguinte voltava ao menu.
// A amostra é SidebarDocs: DocsPageLayout + DocsNav + DocsHeader são
// compartilhados por todas as docs pages da stack, e é a única página cujo
// demo também renderizava <main> — logo é onde landmark-no-duplicate-main
// poderia reaparecer.
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';

import SidebarDocs from '@/components/docs/SidebarDocs.vue';
// As Foundations não usam o DocsPageLayout — têm renderer próprio, e por isso
// ficaram sem <main> no lote anterior. TypographyDocs é a amostra.
import TypographyDocs from '@/components/docs/TypographyDocs.vue';
// AccordionDocs NÃO passa componentSlug para o DocsPageLayout — é a amostra do
// fallback derivado do DocsNav.
import AccordionDocs from '@/components/docs/AccordionDocs.vue';

const meta = {
  title: 'QA/Docs Nav Foco',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A — existe exatamente um <main> e ele tem o título da página como nome. */
export const MainLandmark: Story = {
  render: () => ({ components: { SidebarDocs }, template: '<SidebarDocs />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const heading = canvasElement.querySelector('h1');
    await expect(heading).not.toBeNull();

    await expect(canvasElement.querySelectorAll('main')).toHaveLength(1);

    const main = canvas.getByRole('main', { name: heading!.textContent!.trim() });
    await expect(main).toBeTruthy();
    await expect(main.getAttribute('tabindex')).toBe('-1');
  },
};

/** B — acionar um item do menu move o foco para dentro da seção alvo. */
export const FocusOnNavigate: Story = {
  render: () => ({ components: { SidebarDocs }, template: '<SidebarDocs />' }),
  play: async ({ canvasElement }) => {
    const navButton = canvasElement.querySelector<HTMLButtonElement>(
      '.nds-docs-nav-button[data-track-id="sidebar:nav:anatomia"]',
    );
    await expect(navButton).not.toBeNull();

    await userEvent.click(navButton!);

    const section = canvasElement.querySelector('#anatomia');
    await expect(section).not.toBeNull();

    // contains() inclui o próprio elemento: o foco cai na <section id="anatomia">.
    await expect(section!.contains(document.activeElement)).toBe(true);
    await expect(document.activeElement).not.toBe(navButton);
  },
};

/**
 * A (Foundations) — as páginas de Foundations montam o renderer próprio, não o
 * DocsPageLayout. Prova que elas também têm exatamente um <main> nomeado.
 */
export const MainLandmarkFoundations: Story = {
  render: () => ({ components: { TypographyDocs }, template: '<TypographyDocs />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const heading = canvasElement.querySelector('h1');
    await expect(heading).not.toBeNull();

    await expect(canvasElement.querySelectorAll('main')).toHaveLength(1);

    const main = canvas.getByRole('main', { name: heading!.textContent!.trim() });
    await expect(main).toBeTruthy();
    await expect(main.getAttribute('tabindex')).toBe('-1');
  },
};

/**
 * B2 — página que NÃO passa `componentSlug` ao DocsPageLayout. O DocsNav deriva
 * o slug do `?id=` do iframe (mesma função do mountDocsTracking), então o
 * data-track-id continua com 3 partes e a seção de destino no 3º segmento —
 * sem isso o docs_nav_click sai sem destino.
 */
export const NavTrackIdWithoutSlug: Story = {
  render: () => ({ components: { AccordionDocs }, template: '<AccordionDocs />' }),
  play: async ({ canvasElement }) => {
    const navButtons = Array.from(
      canvasElement.querySelectorAll<HTMLButtonElement>('.nds-docs-nav-button'),
    );
    await expect(navButtons.length).toBeGreaterThan(0);

    for (const button of navButtons) {
      const id = button.getAttribute('data-track-id');
      await expect(id).not.toBeNull();

      const parts = id!.split(':');
      await expect(parts).toHaveLength(3);
      await expect(parts[0]).not.toBe('');
      await expect(parts[1]).toBe('nav');
      // 3º segmento = seção de destino, o que o docs_nav_click reporta.
      await expect(parts[2]).not.toBe('');
    }

    // O destino do primeiro item corresponde a uma seção real da página.
    const firstTarget = navButtons[0].getAttribute('data-track-id')!.split(':')[2];
    await expect(canvasElement.querySelector(`#${CSS.escape(firstTarget)}`)).not.toBeNull();
  },
};

/**
 * B — o docs_nav_click precisa reportar a SEÇÃO DE DESTINO. Antes o
 * `section_id` vinha do 2º segmento do id, que é sempre a string "nav".
 */
export const NavClickReportsTarget: Story = {
  render: () => ({ components: { SidebarDocs }, template: '<SidebarDocs />' }),
  play: async ({ canvasElement }) => {
    // track() encaminha para o gtag do MANAGER (window.top) quando roda em
    // iframe — é lá que o espião precisa ficar.
    const target: Window = (window.self !== window.top && window.top) ? window.top : window;
    const eventos: Array<Record<string, unknown>> = [];
    const gtagPrevious = target.gtag;
    target.gtag = (command: string, ...args: unknown[]) => {
      if (command === 'event' && args[0] === 'docs_nav_click') {
        eventos.push(args[1] as Record<string, unknown>);
      }
    };

    try {
      const navButton = canvasElement.querySelector<HTMLButtonElement>(
        '.nds-docs-nav-button[data-track-id="sidebar:nav:anatomia"]',
      );
      await expect(navButton).not.toBeNull();

      await userEvent.click(navButton!);

      await expect(eventos).toHaveLength(1);
      await expect(eventos[0].section_id).toBe('anatomia');
      await expect(eventos[0].component).toBe('sidebar');
    } finally {
      target.gtag = gtagPrevious;
    }
  },
};
