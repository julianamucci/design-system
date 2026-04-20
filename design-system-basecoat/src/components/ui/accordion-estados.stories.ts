import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createAccordion, type AccordionOptions } from './accordion';

const meta: Meta = {
  title: 'UI/Accordion/Estados',
};

export default meta;
type Story = StoryObj;

// ─── Items ────────────────────────────────────────────────────────────────────

const BASE_ITEMS: AccordionOptions['items'] = [
  { value: 'item-1', trigger: 'Informações gerais', content: 'Conteúdo das informações gerais do componente.' },
  { value: 'item-2', trigger: 'Configurações avançadas', content: 'Conteúdo das configurações avançadas disponíveis.' },
  { value: 'item-3', trigger: 'Suporte e contato', content: 'Entre em contato pelo email suporte@empresa.com.' },
];

const WITH_DISABLED: AccordionOptions['items'] = [
  { value: 'item-1', trigger: 'Item ativo',      content: 'Este item pode ser expandido normalmente.' },
  { value: 'item-2', trigger: 'Item desabilitado', content: 'Este conteúdo não pode ser acessado.', disabled: true },
  { value: 'item-3', trigger: 'Outro item ativo', content: 'Este item também pode ser expandido.' },
];

// ─── Estados ──────────────────────────────────────────────────────────────────

export const Fechado: Story = {
  render: () => createAccordion({ type: 'single', collapsible: true, items: BASE_ITEMS }),
  parameters: {
    docs: {
      description: {
        story: 'Estado padrão: todos os itens fechados. O chevron aponta para baixo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Todos os triggers têm aria-expanded=false', async () => {
      for (const trigger of triggers) {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }
    });
  },
};

export const Aberto: Story = {
  render: () =>
    createAccordion({
      type: 'single',
      collapsible: true,
      defaultValue: 'item-1',
      items: BASE_ITEMS,
    }),
  parameters: {
    docs: {
      description: {
        story: 'Item expandido. O conteúdo é visível e o chevron rotaciona 180°.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Primeiro trigger tem aria-expanded=true', async () => {
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const Disabled: Story = {
  render: () => createAccordion({ type: 'single', collapsible: true, items: WITH_DISABLED }),
  parameters: {
    docs: {
      description: {
        story: 'Item desabilitado. Não responde a cliques e tem opacidade reduzida para sinalizar indisponibilidade.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Segundo trigger está desabilitado', async () => {
      await expect(triggers[1]).toBeDisabled();
    });

    await step('Clique no item desabilitado não abre o conteúdo', async () => {
      await userEvent.click(triggers[1], { pointerEventsCheck: 0 });
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const FocusVisible: Story = {
  render: () => createAccordion({ type: 'single', collapsible: true, items: BASE_ITEMS }),
  parameters: {
    docs: {
      description: {
        story: 'Estado de foco via teclado. Use Tab para navegar entre triggers e verificar o focus ring visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Trigger recebe foco via teclado', async () => {
      triggers[0].focus();
      await expect(triggers[0]).toHaveFocus();
    });

    await step('ArrowDown move foco para o próximo trigger', async () => {
      await userEvent.keyboard('{ArrowDown}');
      await expect(triggers[1]).toHaveFocus();
    });

    await step('ArrowUp retorna foco ao trigger anterior', async () => {
      await userEvent.keyboard('{ArrowUp}');
      await expect(triggers[0]).toHaveFocus();
    });
  },
};
