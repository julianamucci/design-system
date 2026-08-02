// Regressão de foco na navegação das docs pages (contrato docs-nav-foco).
// Prova os dois consertos numa página real (BreadcrumbDocs — passa componentSlug,
// então os botões do menu carregam data-track-id com o id da seção alvo):
//   A. existe exatamente um <main> e ele tem nome acessível = título da página;
//   B. acionar um item do menu move o foco para dentro da seção alvo — sem
//      isso o leitor de tela não continua a leitura e o Tab volta pro menu.
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent, within } from 'storybook/test';

import BreadcrumbDocs from './BreadcrumbDocs.svelte';

const meta = {
  title: 'QA/Docs Nav Focus',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Mesmo cast do docs-smoke: as *Docs.svelte não recebem props.
const page = (Page: unknown) => () => ({ Component: Page as never });

export const LandmarkPrincipal: Story = {
  render: page(BreadcrumbDocs),
  play: async ({ canvasElement }) => {
    const mains = canvasElement.querySelectorAll('main');
    expect(mains).toHaveLength(1);

    const heading = canvasElement.querySelector('h1');
    expect(heading).not.toBeNull();

    const named = within(canvasElement).getByRole('main', {
      name: heading!.textContent!.trim(),
    });
    expect(named).toBe(mains[0]);
  },
};

export const FocoAoNavegar: Story = {
  render: page(BreadcrumbDocs),
  play: async ({ canvasElement }) => {
    const buttons = [
      ...canvasElement.querySelectorAll<HTMLButtonElement>('.nds-docs-nav-button'),
    ];
    expect(buttons.length).toBeGreaterThan(0);

    // Primeiro item do menu cuja seção alvo existe na página.
    const pair = buttons
      .map((button) => {
        const id = button.dataset.trackId?.split(':').pop() ?? '';
        return { button, section: id ? canvasElement.querySelector(`#${CSS.escape(id)}`) : null };
      })
      .find((entry): entry is { button: HTMLButtonElement; section: Element } => entry.section !== null);

    expect(pair).toBeDefined();

    await userEvent.click(pair!.button);

    // O foco tem de sair do botão do menu e cair dentro da seção alvo.
    expect(pair!.section.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(pair!.button);
  },
};
