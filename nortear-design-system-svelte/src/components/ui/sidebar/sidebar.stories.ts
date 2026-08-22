import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { Root as Sidebar } from './index';
import SidebarStory from './SidebarStory.svelte';
import SidebarDocs from '@/components/docs/SidebarDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { sidebarSource } from './sidebar.source';

const meta: Meta = {
  title: 'UI/Sidebar',
  component: Sidebar,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      page: withAutoDocsTab(SidebarDocs),
      source: { transform: sidebarSource },
    },
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Posição da sidebar',
      table: { type: { summary: "'left' | 'right'" }, defaultValue: { summary: 'left' } },
    },
    variant: {
      control: 'select',
      options: ['sidebar', 'floating', 'inset'],
      description: 'Estilo visual da sidebar',
      table: {
        type: { summary: "'sidebar' | 'floating' | 'inset'" },
        defaultValue: { summary: 'sidebar' },
      },
    },
    collapsible: {
      control: 'select',
      options: ['offcanvas', 'icon', 'none'],
      description: 'Comportamento ao recolher',
      table: {
        type: { summary: "'offcanvas' | 'icon' | 'none'" },
        defaultValue: { summary: 'offcanvas' },
      },
    },
    mobileQuery: {
      control: 'text',
      description:
        'Ponto de virada entre coluna e gaveta sobreposta. Uma consulta sempre verdadeira, como (min-width: 0px), força a gaveta em qualquer largura.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '(max-width: 767px)' } },
    },
  },
  args: {
    side: 'left',
    variant: 'sidebar',
    collapsible: 'offcanvas',
    mobileQuery: '(max-width: 767px)',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: SidebarStory,
    props: {
      side: args.side,
      variant: args.variant,
      collapsible: args.collapsible,
      // Vai para o Provider dentro do andaime: o ponto de virada é dele, não
      // da barra.
      mobileQuery: args.mobileQuery,
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = () => canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
    const gatilho = () => canvas.getByRole('button', { name: /alternar barra lateral/i });

    await step('A navegação tem nome acessível', async () => {
      // Sem nome no <nav>, a barra é só "navegação" na lista de marcos do
      // leitor de tela — indistinguível de qualquer outra da página.
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
    });

    await step('O item ativo é anunciado como página atual', async () => {
      // `data-active` é para o CSS; quem não vê a cor precisa do aria-current.
      const active = canvas.getByRole('button', { current: 'page' });
      await expect(active).toHaveAttribute('data-active', 'true');
      await expect(active).toHaveTextContent('Dashboard');
    });

    await step('O ícone do item não é lido pelo leitor de tela', async () => {
      const icone = canvasElement.querySelector<SVGElement>(
        '[data-slot="sidebar-menu-button"] svg',
      )!;
      await expect(icone.getAttribute('aria-hidden')).toBe('true');
    });

    await step('O gatilho tem nome acessível, e em português', async () => {
      // Nome EXATO, e não presença: o gatilho é só um ícone, e o nome dele é a
      // única coisa que quem usa leitor de tela recebe. Enquanto o texto era
      // "Toggle Sidebar", nenhuma asserção reprovava.
      await expect(gatilho()).toHaveAccessibleName('Alternar barra lateral');
      // A faixa repete a ação com o ponteiro, e a dica dela é o mesmo texto.
      const faixa = canvasElement.querySelector<HTMLButtonElement>('[data-slot="sidebar-rail"]')!;
      await expect(faixa.title).toBe('Alternar barra lateral');
    });

    await step('O gatilho alterna o estado — e volta', async () => {
      // Par idempotente: o painel Interactions reexecuta a play no mesmo DOM,
      // e uma única inversão faria a segunda rodada afirmar o oposto.
      const antes = raiz().getAttribute('data-state');
      await userEvent.click(gatilho());
      await expect(raiz().getAttribute('data-state')).not.toBe(antes);
      await userEvent.click(gatilho());
      await expect(raiz().getAttribute('data-state')).toBe(antes);
    });

    await step('Ctrl+B alterna de qualquer lugar da página', async () => {
      const antes = raiz().getAttribute('data-state');
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(raiz().getAttribute('data-state')).not.toBe(antes);
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(raiz().getAttribute('data-state')).toBe(antes);
    });
  },
};
