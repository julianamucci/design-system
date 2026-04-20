import type { Meta, StoryObj } from '@storybook/svelte';
import { Accordion } from './index';
import AccordionStory from './AccordionStory.svelte';
import AccordionControlledStory from './AccordionControlledStory.svelte';

const meta = {
  title: 'UI/Accordion/Modos',
  component: Accordion,
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const FAQ_ITEMS = [
  { value: 'item-1', q: 'Como faço para redefinir minha senha?', a: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
  { value: 'item-2', q: 'Quais formas de pagamento são aceitas?', a: 'Aceitamos cartão de crédito, Pix e boleto bancário.' },
  { value: 'item-3', q: 'Como cancelo minha assinatura?', a: 'Você pode cancelar a qualquer momento em Configurações → Assinatura.' },
];

const SPEC_ITEMS = [
  { value: 'especificacoes', q: 'Especificações técnicas', a: 'CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe' },
  { value: 'compatibilidade', q: 'Compatibilidade', a: 'Windows 11, macOS 14+, Ubuntu 22.04 LTS' },
  { value: 'garantia', q: 'Garantia e suporte', a: '24 meses de garantia de fábrica. Suporte técnico 24/7.' },
];

export const Single: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', collapsible: true, defaultValue: 'item-1', items: FAQ_ITEMS },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo single com collapsible. Apenas um item aberto por vez. Clicar no item ativo o fecha. Use para FAQ.',
      },
    },
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
};

export const DefaultOpen: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', collapsible: true, defaultValue: 'item-1', items: FAQ_ITEMS.slice(0, 2) },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Prop defaultValue abre um item na montagem sem modo controlado. Use em documentação e onboarding.',
      },
    },
  },
};
