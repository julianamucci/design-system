import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, waitFor, within, expect, fn } from 'storybook/test';
import { Collapsible } from './index';
import CollapsibleStory from './CollapsibleStory.svelte';
import CollapsibleDocs from '@/components/docs/CollapsibleDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(CollapsibleDocs) },
  },
  argTypes: {
    // Docgen está desligado nesta stack: `argTypes` é a ÚNICA fonte da aba
    // API Reference, então type e default entram à mão.
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial no modo não-controlado',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o trigger impedindo interação',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    // O modo controlado é demonstrado na story Controlled: aqui o control não
    // encaminharia nada, então entra como documentação, não como controle morto.
    open: {
      control: false,
      description: 'Estado aberto/fechado no modo controlado',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: '—' } },
    },
    onOpenChange: {
      control: false,
      description: 'Chamado a cada alternância, com o novo estado',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    defaultOpen: false,
    disabled: false,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj;

/**
 * Par idempotente. O painel Interactions REEXECUTA a play no mesmo DOM, sem
 * remontar: num toggle, o clique cego parte do estado que a rodada anterior
 * deixou e inverte todas as asserções seguintes.
 */
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const fechar = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: CollapsibleStory,
    props: {
      defaultOpen: args.defaultOpen,
      disabled: args.disabled,
      onOpenChange: args.onOpenChange,
      label: 'Exibir filtros avançados',
      contentText: 'Filtro avançado 1 · Filtro avançado 2',
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    const painel = () =>
      canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

    await step('trigger está presente e visível', async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeVisible();
    });

    await step('o chevron é decorativo', async () => {
      await expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    if (args.disabled) {
      await step('desabilitado, o trigger não responde ao clique', async () => {
        const antes = trigger.getAttribute('aria-expanded');
        await userEvent.click(trigger, { pointerEventsCheck: 0 });
        await expect(trigger.getAttribute('aria-expanded')).toBe(antes);
      });
      return;
    }

    await step('clicar com o painel fechado expande o conteúdo', async () => {
      // fechar/abrir e não só abrir: o par garante um clique REAL nesta rodada,
      // que é o que a contagem do spy abaixo mede.
      await fechar(trigger);
      const spy = args.onOpenChange as ReturnType<typeof fn>;
      const antes = spy.mock.calls.length;
      await abrir(trigger);
      await expect(painel()).toBeInTheDocument();
      await expect(canvas.getByText(/Filtro avançado 1/)).toBeVisible();
      await expect(spy.mock.calls.length).toBe(antes + 1);
    });

    await step('aberto, aria-controls aponta para o id real do painel', async () => {
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(painel());
    });

    await step('Enter alterna o painel', async () => {
      await fechar(trigger);
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Space alterna o painel, idêntico a Enter', async () => {
      await fechar(trigger);
      trigger.focus();
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('clicar com o painel aberto recolhe o conteúdo', async () => {
      // Último passo de propósito: a story declara visual.item1 (fechado por
      // padrão), e é o quadro final que o Chromatic fotografa e o axe varre.
      await abrir(trigger);
      await fechar(trigger);
      await waitFor(() => expect(painel()).not.toBeVisible());
    });
  },
};
