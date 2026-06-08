import type { Meta, StoryObj } from '@storybook/vue3';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ref } from 'vue';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './index';

const meta = {
  title: 'UI/Accordion/Modos',
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Single: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" :collapsible="true" default-value="item-1" class="w-full max-w-lg">
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
            Aceitamos cartão de crédito, Pix e boleto bancário.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Como cancelo minha assinatura?</AccordionTrigger>
          <AccordionContent>
            Você pode cancelar a qualquer momento em Configuracoes → Assinatura.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo single com collapsible. Apenas um item aberto por vez. Clicar no item ativo o fecha. Use para FAQ.',
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
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="multiple" class="w-full max-w-lg">
        <AccordionItem value="especificacoes">
          <AccordionTrigger>Especificações técnicas</AccordionTrigger>
          <AccordionContent>
            CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="compatibilidade">
          <AccordionTrigger>Compatibilidade</AccordionTrigger>
          <AccordionContent>
            Windows 11, macOS 14+, Ubuntu 22.04 LTS
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="garantia">
          <AccordionTrigger>Garantia e suporte</AccordionTrigger>
          <AccordionContent>
            24 meses de garantia de fábrica. Suporte técnico 24/7.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
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
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() {
      const value = ref<string>('item-1');
      return { value };
    },
    template: `
      <div class="space-y-2 w-full max-w-lg">
        <p class="text-xs text-muted-foreground">
          Item aberto: <code>{{ value || 'nenhum' }}</code>
        </p>
        <Accordion
          type="single"
          :collapsible="true"
          :model-value="value"
          @update:model-value="value = $event"
          class="w-full"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1 — controlado</AccordionTrigger>
            <AccordionContent>Estado gerenciado externamente via model-value + @update:model-value.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2 — controlado</AccordionTrigger>
            <AccordionContent>Útil para sincronizar com URL ou outro estado da aplicação.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo controlado. model-value e @update:model-value gerenciam o estado externamente. O indicador acima mostra o item ativo.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const DefaultOpen: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" :collapsible="true" default-value="item-1" class="w-full max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item aberto por padrão</AccordionTrigger>
          <AccordionContent>
            Este item inicia expandido via <code>default-value="item-1"</code>.
            Não é modo controlado — o estado interno gerencia após a montagem.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Item fechado por padrão</AccordionTrigger>
          <AccordionContent>Este item inicia colapsado.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Prop default-value abre um item na montagem sem modo controlado. Use em documentação e onboarding.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
