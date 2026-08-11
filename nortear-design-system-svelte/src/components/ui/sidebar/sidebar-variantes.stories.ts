import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import SidebarStory from './SidebarStory.svelte';

const meta: Meta = {
  title: 'UI/Sidebar/Variants',
  component: SidebarStory,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes visuais da Sidebar: sidebar (padrão), floating e inset. Cada variante altera o posicionamento e a aparência do container.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const raizDe = (el: HTMLElement) => el.querySelector<HTMLElement>('[data-slot="sidebar"]')!;

export const VariantSidebar: Story = {
  name: 'sidebar (default)',
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('A variante padrão não arredonda o painel interno', async () => {
      const raiz = raizDe(canvasElement);
      await expect(raiz.getAttribute('data-variant')).toBe('sidebar');
      const interno = raiz.querySelector<HTMLElement>('.nds-sidebar-inner')!;
      await expect(parseFloat(getComputedStyle(interno).borderTopLeftRadius)).toBe(0);
    });
  },
};

export const VariantFloating: Story = {
  name: 'floating',
  parameters: { covers: ['functional.item8', 'visual.item3'] },
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'floating',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('floating ganha borda, cantos e sombra no painel interno', async () => {
      // Afirma o pixel, e não só o atributo: a regra é
      // `[data-variant="floating"] .nds-sidebar-inner`, e um atributo no lugar
      // errado passaria despercebido.
      const raiz = raizDe(canvasElement);
      await expect(raiz.getAttribute('data-variant')).toBe('floating');

      const interno = raiz.querySelector<HTMLElement>('.nds-sidebar-inner')!;
      const estilo = getComputedStyle(interno);
      await expect(parseFloat(estilo.borderTopLeftRadius)).toBeGreaterThan(0);
      await expect(parseFloat(estilo.borderTopWidth)).toBeGreaterThan(0);
      await expect(estilo.boxShadow).not.toBe('none');
    });
  },
};

export const VariantInset: Story = {
  name: 'inset',
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'inset',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('inset marca a variante que arredonda o conteúdo adjacente', async () => {
      const raiz = raizDe(canvasElement);
      await expect(raiz.getAttribute('data-variant')).toBe('inset');
      // A regra que arredonda o conteúdo é `[data-variant="inset"] ~ .nds-sidebar-inset`
      // — depende de a barra e o conteúdo serem irmãos, e é isso que se perde
      // primeiro quando alguém envolve um dos dois.
      await expect(canvasElement.querySelector('.nds-sidebar-inset')).not.toBeNull();
    });
  },
};

export const SideRight: Story = {
  parameters: { covers: ['visual.item6'] },
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'right',
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A barra encosta na direita', async () => {
      const raiz = raizDe(canvasElement);
      await expect(raiz.getAttribute('data-side')).toBe('right');
      // Medida, não atributo: a regra que posiciona é
      // `[data-side="right"] .nds-sidebar-panel { right: 0 }`.
      const painel = raiz.querySelector<HTMLElement>('.nds-sidebar-panel')!;
      await expect(getComputedStyle(painel).right).toBe('0px');
    });

    await step('Trocar de lado não mexe na navegação', async () => {
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { current: 'page' })).toHaveTextContent('Dashboard');
    });
  },
};
