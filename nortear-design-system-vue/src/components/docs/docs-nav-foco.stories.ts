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
export const LandmarkPrincipal: Story = {
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
export const FocoAoNavegar: Story = {
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
