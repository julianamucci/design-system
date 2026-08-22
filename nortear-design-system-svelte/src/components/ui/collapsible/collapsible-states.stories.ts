import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, waitFor, within, expect, fn } from 'storybook/test';
import { Collapsible } from './index';
import CollapsibleStory from './CollapsibleStory.svelte';
import CollapsibleControladoStory from './CollapsibleControladoStory.svelte';
import {
  defaultCollapsibleOpenSource,
  collapsibleControlledSource,
  collapsibleDisabledSource,
  collapsibleSource,
} from './collapsible.source';

const meta: Meta = {
  title: 'UI/Collapsible/States',
  component: Collapsible,
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma que muda a marcação
      // sobrescreve com a sua própria logo abaixo.
      source: { transform: collapsibleSource },
      description: {
        component:
          'Estados operacionais do Collapsible: não-controlado, aberto por padrão, controlado e desabilitado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Par idempotente — ver a nota em collapsible.stories.ts. */
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const fechar = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

// bits-ui NÃO desmonta o painel ao fechar: mantém o nó com `hidden` e
// `data-state="closed"` — o mesmo contrato do Vanilla. Por isso as asserções de
// "fechado" olham VISIBILIDADE, não ausência do nó.
const panelOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

export const Uncontrolled: Story = {
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
    const trigger = canvas.getByRole('button');

    await step('o estado nasce e vive dentro do componente', async () => {
      await fechar(trigger);
      await expect(panelOf(canvasElement)).not.toBeVisible();
      await abrir(trigger);
      await expect(panelOf(canvasElement)).toBeInTheDocument();
      await expect(canvas.getByText(/Filtro avançado 1/)).toBeVisible();
    });

    await step('e continua alternando sem controle externo', async () => {
      await fechar(trigger);
      await waitFor(() => expect(panelOf(canvasElement)).not.toBeVisible());
    });
  },
};

export const OpenByDefault: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item5', 'visual.item2'],
    docs: { source: { transform: defaultCollapsibleOpenSource } },
  },
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
    const trigger = canvas.getByRole('button');

    await step('monta já expandido, sem estado externo nenhum', async () => {
      // Asserção de MONTAGEM: por isso o passo anterior não interage. No replay
      // o DOM não remonta, e o passo seguinte devolve o estado aberto.
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(panelOf(canvasElement)).toBeInTheDocument();
      await expect(canvas.getByText(/Filtro avançado 1/)).toBeVisible();
    });

    await step('defaultOpen é ponto de partida, não trava', async () => {
      await fechar(trigger);
      await abrir(trigger);
      // Termina aberto de propósito: é o quadro que o Chromatic fotografa e o
      // estado que o axe varre nesta story (visual.item2).
      await expect(panelOf(canvasElement)).toBeInTheDocument();
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: { source: { transform: collapsibleControlledSource } },
  },
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
    const trigger = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="collapsible-trigger"]',
    )!;

    await step('o painel obedece ao estado externo', async () => {
      // Nenhum clique no trigger: quem manda é o estado de fora, e é isso que
      // distingue o modo controlado.
      if (trigger.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(canvas.getByRole('button', { name: /Abrir pelo estado externo/i }));
      }
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
      await expect(panelOf(canvasElement)).toBeInTheDocument();
      await expect(trigger).toHaveTextContent('Ocultar filtros avançados');
    });

    await step('o trigger devolve a mudança para o estado externo', async () => {
      await fechar(trigger);
      await expect(trigger).toHaveTextContent('Exibir filtros avançados');
      await waitFor(() => expect(panelOf(canvasElement)).not.toBeVisible());
    });

    await step('e o botão externo fecha de volta', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'false') {
        await userEvent.click(canvas.getByRole('button', { name: /Fechar pelo estado externo/i }));
      }
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item5'],
    docs: { source: { transform: collapsibleDisabledSource } },
  },
  render: () => ({
    Component: CollapsibleStory,
    props: {
      disabled: true,
      label: 'Filtros avançados (desabilitado)',
      contentText: 'Filtro avançado 1 · Filtro avançado 2',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('o botão é desabilitado de verdade, não só na aparência', async () => {
      await expect(trigger).toBeDisabled();
    });

    await step('clique não altera o estado do painel', async () => {
      // Exceção legítima à idempotência: elemento desabilitado não muda de
      // estado em rodada nenhuma.
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(panelOf(canvasElement)).not.toBeVisible();
    });

    await step('teclado também não', async () => {
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
