import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, fn } from 'storybook/test';
import { Collapsible } from './index';
import CollapsibleStory from './CollapsibleStory.svelte';
import CollapsibleControladoStory from './CollapsibleControladoStory.svelte';

const meta = {
  title: 'UI/Collapsible/Estados',
  component: Collapsible,
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados operacionais do Collapsible: não-controlado, controlado e desabilitado.',
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controlado: Story = {
  name: 'Controlado',
  render: () => ({
    Component: CollapsibleControladoStory,
    props: {
      label: 'Exibir filtros avançados',
      contentText: 'Filtro avançado 1 · Filtro avançado 2',
      onOpenChange: fn(),
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('painel está fechado no estado inicial', async () => {
      const trigger = canvas.getByRole('button', { name: /Exibir filtros/i });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('botão externo abre o painel', async () => {
      const externalBtn = canvas.getByRole('button', { name: /Abrir via botão externo/i });
      await userEvent.click(externalBtn);
      const trigger = canvas.getByRole('button', { name: /Exibir filtros/i });
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('botão externo fecha o painel', async () => {
      const externalBtn = canvas.getByRole('button', { name: /Fechar via botão externo/i });
      await userEvent.click(externalBtn);
      const trigger = canvas.getByRole('button', { name: /Exibir filtros/i });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const NaoControlado: Story = {
  name: 'Não-controlado',
  render: () => ({
    Component: CollapsibleStory,
    props: {
      defaultOpen: false,
      label: 'Exibir filtros avançados',
      contentText: 'Filtro avançado 1 · Filtro avançado 2',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('painel está fechado no estado inicial', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('clicar no trigger expande o painel sem controle externo', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('clicar novamente fecha o painel sem controle externo', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const AbertoporPadrao: Story = {
  name: 'Aberto por Padrão',
  render: () => ({
    Component: CollapsibleStory,
    props: {
      defaultOpen: true,
      label: 'Ocultar filtros avançados',
      contentText: 'Filtro avançado 1 · Filtro avançado 2',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('painel está aberto na montagem', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('conteúdo está visível no DOM', async () => {
      await expect(canvas.getByText(/Filtro avançado/)).toBeVisible();
    });
  },
};

export const Desabilitado: Story = {
  render: () => ({
    Component: CollapsibleStory,
    props: {
      disabled: true,
      label: 'Exibir filtros avançados',
      contentText: 'Filtro avançado 1 · Filtro avançado 2',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('trigger está desabilitado', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toBeDisabled();
    });

    await step('clicar no trigger não expande o painel', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
