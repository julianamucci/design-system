import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './index';
import AccordionDocs from '@/components/docs/AccordionDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    docs: { page: withAutoDocsTab(AccordionDocs) },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Define se um ou múltiplos itens podem estar abertos.',
    },
    collapsible: {
      control: 'boolean',
      description: 'Permite fechar o item ativo (apenas com type=single).',
    },
  },
  args: {
    type: 'single',
    collapsible: true,
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return { args }; },
    template: `
      <Accordion v-bind="args" default-value="item-1" class="w-full max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
          <AccordionContent>
            Acesse a tela de login e clique em "Esqueci minha senha". Você receberá
            um link de redefinição no email cadastrado, válido por 24 horas.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
          <AccordionContent>
            Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento
            disponível em até 12 vezes sem juros no cartão.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Como cancelo minha assinatura?</AccordionTrigger>
          <AccordionContent>
            Você pode cancelar a qualquer momento em Configuracoes → Assinatura.
            O acesso permanece ativo até o fim do período já pago.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Item 1 começa aberto (defaultValue)', async () => {
      const triggers = canvas.getAllByRole('button');
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no trigger fechado abre o item', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[1]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Modo single: item anterior fecha ao abrir novo', async () => {
      const triggers = canvas.getAllByRole('button');
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Enter expande item focado', async () => {
      const triggers = canvas.getAllByRole('button');
      triggers[2].focus();
      await expect(triggers[2]).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Space colapsa item aberto (collapsible=true)', async () => {
      const triggers = canvas.getAllByRole('button');
      triggers[2].focus();
      await userEvent.keyboard(' ');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
