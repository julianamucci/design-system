import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Accordion } from './index';
import AccordionStory from './AccordionStory.svelte';
import AccordionControlledStory from './AccordionControlledStory.svelte';

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Accordion/Modos',
  component: Accordion,
  tags: ['disclosure'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const FAQ_ITEMS = [
  { value: 'item-1', q: 'Como faço para redefinir minha senha?', a: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
  { value: 'item-2', q: 'Quais formas de pagamento são aceitas?', a: 'Aceitamos cartão de crédito, Pix e boleto bancário.' },
  { value: 'item-3', q: 'Como cancelo minha assinatura?', a: 'Você pode cancelar a qualquer momento em Configuracoes → Assinatura.' },
];

const SPEC_ITEMS = [
  { value: 'especificacoes', q: 'Especificações técnicas', a: 'CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe' },
  { value: 'compatibilidade', q: 'Compatibilidade', a: 'Windows 11, macOS 14+, Ubuntu 22.04 LTS' },
  { value: 'garantia', q: 'Garantia e suporte', a: '24 meses de garantia de fábrica. Suporte técnico 24/7.' },
];

export const Single: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', defaultValue: 'item-1', items: FAQ_ITEMS },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo single (bits-ui: sempre collapsible). Apenas um item aberto por vez. Clicar no item ativo o fecha. Use para FAQ.',
      },
    },
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Item 1 começa aberto via defaultValue', async () => {
      const triggers = canvas.getAllByRole('button');
      await waitFor(
        () => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'),
        { timeout: 500 }
      );
    });

    await step('Clicar no trigger ativo fecha o item (collapsible)', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[0]);
      await waitFor(
        () => expect(triggers[0]).toHaveAttribute('aria-expanded', 'false'),
        { timeout: 500 }
      );
    });
  },
};

export const Multiple: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'multiple', items: SPEC_ITEMS },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo multiple. Múltiplos itens podem estar abertos ao mesmo tempo. Use para especificações técnicas comparáveis.',
      },
    },
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Abrir dois itens — ambos permanecem expandidos (modo múltiplo)', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[0]);
      await waitFor(
        () => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'),
        { timeout: 500 }
      );
      await userEvent.click(triggers[1]);
      await waitFor(
        () => expect(triggers[1]).toHaveAttribute('aria-expanded', 'true'),
        { timeout: 500 }
      );
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar em trigger aberto fecha o item individualmente (modo múltiplo)', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[0]);
      await waitFor(
        () => expect(triggers[0]).toHaveAttribute('aria-expanded', 'false'),
        { timeout: 500 }
      );
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const Controlled: Story = {
  render: () => ({ Component: AccordionControlledStory }),
  parameters: {
    docs: {
      description: {
        story: 'Modo controlado. value e onValueChange gerenciam o estado externamente. O indicador acima mostra o item ativo.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const DefaultOpen: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', defaultValue: 'item-1', items: FAQ_ITEMS.slice(0, 2) },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Prop defaultValue abre um item na montagem sem modo controlado. Use em documentação e onboarding.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
