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

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, within } from 'storybook/test';
import { createButtonDocs } from './ButtonDocs';

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

/** A — existe exatamente um <main> e ele é nomeado pelo <h1> da página. */
export const LandmarkPrincipal: Story = {
  render: () => createButtonDocs(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const mains = canvasElement.querySelectorAll('main');
    await expect(mains).toHaveLength(1);

    const h1 = canvasElement.querySelector('h1');
    await expect(h1).not.toBeNull();
    const pageTitle = h1!.textContent!.trim();

    // Falha se o aria-labelledby não resolver para o <h1> do DocsHeader.
    const main = canvas.getByRole('main', { name: pageTitle });
    await expect(main).toBe(mains[0]);
    await expect(main).toHaveAttribute('tabindex', '-1');
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
