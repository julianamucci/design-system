import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import SidebarStory from './SidebarStory.svelte';
import SidebarIconStory from './SidebarIconStory.svelte';
import SidebarFixedStory from './SidebarFixedStory.svelte';

const meta: Meta = {
  title: 'UI/Sidebar/States',
  component: SidebarStory,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados operacionais da Sidebar: expandido, recolhido em modo icon, offcanvas fechado e fixo (collapsible none).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Expanded: Story = {
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
    const canvas = within(canvasElement);

    await step('O estado inicial aberto chega ao DOM', async () => {
      // Esta é a asserção que só a montagem alcança: nenhuma story que
      // interage pode prová-la, porque o replay parte do estado anterior.
      const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
      await expect(raiz.getAttribute('data-state')).toBe('expanded');
      await expect(raiz.getAttribute('data-collapsible')).toBe('');
    });

    await step('Os rótulos estão visíveis em largura total', async () => {
      const ativo = canvas.getByRole('button', { current: 'page' });
      await expect(ativo).toBeVisible();
      await expect(ativo).toHaveTextContent('Dashboard');
    });
  },
};

export const IconMode: Story = {
  name: 'Icon mode (collapsed)',
  parameters: {
    covers: ['functional.item4', 'functional.item7', 'visual.item2'],
  },
  render: () => ({
    Component: SidebarIconStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = () => canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;

    await step('A barra nasce recolhida em ícones', async () => {
      await expect(raiz().getAttribute('data-state')).toBe('collapsed');
      await expect(raiz().getAttribute('data-collapsible')).toBe('icon');
    });

    await step('O painel estreita para a largura de ícone', async () => {
      // Mede o pixel, e não o atributo: a regra que estreita é
      // `[data-collapsible="icon"] .nds-sidebar-panel { width: … }`.
      const painel = raiz().querySelector<HTMLElement>('.nds-sidebar-panel')!;
      const emRem = parseFloat(
        getComputedStyle(raiz()).getPropertyValue('--sidebar-width-icon'),
      );
      const px = emRem * parseFloat(getComputedStyle(document.documentElement).fontSize);
      // `getComputedStyle(...).width` e não a caixa medida: abaixo de 48rem o
      // painel é `display: none` e a caixa mediria 0 — a largura declarada é a
      // mesma nos dois casos, e é ela que a regra entrega.
      await expect(Math.round(parseFloat(getComputedStyle(painel).width))).toBe(Math.round(px));
    });

    await step('O rótulo textual some, mas o nome acessível fica', async () => {
      // Sem rótulo visível, o item precisaria depender do tooltip — que some
      // no teclado. O `aria-label` é o que garante o nome em qualquer entrada.
      const ativo = canvas.getByRole('button', { current: 'page' });
      await expect(ativo).toHaveAccessibleName('Dashboard');
    });

    await step('O ponteiro sobre o item abre o balão com o nome da seção', async () => {
      // O timeout maior é pelo atraso de abertura do tooltip, que é do
      // componente e não do teste.
      const ativo = canvas.getByRole('button', { current: 'page' });
      await userEvent.hover(ativo);
      await waitFor(
        async () => {
          const balao = document.querySelector<HTMLElement>('[data-slot="tooltip-content"]');
          await expect(balao).not.toBeNull();
          await expect(balao!.textContent?.trim()).toBe('Dashboard');
        },
        { timeout: 3000 },
      );
      // Devolve o DOM ao estado de entrada para o replay.
      await userEvent.unhover(ativo);
      await waitFor(
        () => expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull(),
        { timeout: 3000 },
      );
    });
  },
};

export const OffcanvasClosed: Story = {
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: false,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Recolhida em offcanvas, o vão do fluxo zera', async () => {
      const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
      await expect(raiz.getAttribute('data-state')).toBe('collapsed');
      await expect(raiz.getAttribute('data-collapsible')).toBe('offcanvas');

      const vao = raiz.querySelector<HTMLElement>('.nds-sidebar-gap-inner')!;
      await expect(Math.round(vao.getBoundingClientRect().width)).toBe(0);
    });
  },
};

export const Fixed: Story = {
  name: 'Fixed (collapsible none)',
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    Component: SidebarFixedStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem recolhimento não há estado de recolhimento', async () => {
      const raiz = canvasElement.querySelector<HTMLElement>('.nds-sidebar-static')!;
      await expect(raiz).not.toBeNull();
      await expect(raiz.hasAttribute('data-state')).toBe(false);
      // Sem painel fixo, o conteúdo é a própria coluna — nada de reservar vão.
      await expect(canvasElement.querySelector('.nds-sidebar-gap-inner')).toBeNull();
    });

    await step('Não há gatilho de alternância na página', async () => {
      await expect(canvas.queryByRole('button', { name: /toggle sidebar/i })).toBeNull();
    });

    await step('A navegação continua inteira e acessível', async () => {
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { current: 'page' })).toHaveTextContent('Dashboard');
    });
  },
};

/**
 * DÍVIDA DECLARADA: `functional.item3` pede a virada para o overlay em viewport
 * estreita. Nesta stack o corte vem de uma media query global lida por
 * `IsMobile`, sem ponto de injeção — o parâmetro `viewport` redimensiona o
 * iframe no Storybook e no Chromatic (é o que esta story fotografa), mas não no
 * runner headless, onde nenhum passo consegue forçar a virada. Por isso a story
 * declara só o item visual.
 */
export const Mobile: Story = {
  name: 'Mobile (Sheet overlay)',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    covers: ['visual.item5'],
    coversNotApplicable: {
      'functional.item3':
        'a virada para o overlay depende de media query global sem ponto de injeção nesta stack; nenhum passo a força de forma determinística',
    },
  },
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: false,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A navegação e o gatilho existem em qualquer largura', async () => {
      // O que vale nas duas larguras: a barra tem nome de marco e há um único
      // controle de abertura. O resto do cenário é a foto do Chromatic.
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
    });
  },
};
