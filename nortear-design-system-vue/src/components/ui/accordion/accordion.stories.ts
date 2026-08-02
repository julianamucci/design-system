import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect , waitFor, fn } from 'storybook/test';
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
  // A aba "API Reference" combina o docgen com estes argTypes. Declarar a API
  // real evita que a tabela saia com duas linhas. Props sem control são
  // documentação: o template do Playground as fixa depois do v-bind, então
  // control ativo aqui viraria controle morto.
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Define se um ou múltiplos itens podem estar abertos.',
      table: { type: { summary: "'single' | 'multiple'" }, defaultValue: { summary: '—' } },
    },
    collapsible: {
      control: 'boolean',
      description: 'Permite fechar o item ativo (apenas com modo único).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens de uma vez.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Eixo de navegação por teclado.',
      table: { type: { summary: "'vertical' | 'horizontal'" }, defaultValue: { summary: "'vertical'" } },
    },
    unmountOnHide: {
      control: 'boolean',
      description: 'Desmonta o conteúdo ao fechar. Desligue para manter o painel no DOM.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    modelValue: {
      control: false,
      description: 'Item(ns) aberto(s) no modo controlado, via v-model.',
      table: { type: { summary: 'string | string[]' } },
    },
    defaultValue: {
      control: false,
      description: 'Item(ns) aberto(s) inicialmente. O Playground fixa "item-1".',
      table: { type: { summary: 'string | string[]' } },
    },
    asChild: {
      control: false,
      description: 'Compõe no elemento filho em vez de renderizar o container próprio.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    'onUpdate:modelValue': {
      control: false,
      description: 'Callback disparado quando o valor muda.',
      table: { type: { summary: '(value: string | string[]) => void' } },
    },
  },
  args: {
    type: 'single',
    collapsible: true,
    disabled: false,
    orientation: 'vertical',
    unmountOnHide: true,
    'onUpdate:modelValue': fn(),
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item3', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item4', 'accessibility.item6',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return { args }; },
    template: `
      <Accordion v-bind="args" default-value="item-1" class="nds-max-w-lg">
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A raiz registra o modo recebido', async () => {
      const root = canvasElement.querySelector('[data-slot="accordion"]');
      await expect(root).toHaveAttribute('data-type', args.type);
    });

    await step('Item 1 começa aberto (defaultValue)', async () => {
      const triggers = canvas.getAllByRole('button');
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no trigger fechado abre o item', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[1]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
      // A aba Actions só se popula se o callback chegar ao componente.
      await expect(args['onUpdate:modelValue']).toHaveBeenCalled();
    });

    await step('Conteúdo aberto fica de fato visível, com altura real', async () => {
      // aria-expanded sozinho não prova que o painel apareceu: já houve
      // regressão em que o trigger reportava aberto e o conteúdo ficava
      // colapsado (altura vinda de custom property defasada da lib).
      // waitFor: a entrada tem fade (opacity 0 → 1), então a asserção precisa
      // esperar a animação assentar em vez de medir no meio dela.
      const panel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>(
          '[data-slot="accordion-content"]:not([hidden]):not([data-state="closed"]):not([data-closed])',
        );
        if (!el || el.getBoundingClientRect().height === 0) {
          throw new Error('painel aberto ainda não assentou');
        }
        return el;
      });
      await expect(panel).toBeVisible();
      await expect(panel.getBoundingClientRect().height).toBeGreaterThan(0);
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
    await step('Setas movem o foco entre triggers (com loop) e Home/End vão às pontas', async () => {
      const triggers = canvas.getAllByRole('button');
      triggers[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(triggers[1]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(triggers[0]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(triggers[triggers.length - 1]).toHaveFocus();
      await userEvent.keyboard('{Home}');
      await expect(triggers[0]).toHaveFocus();
      await userEvent.keyboard('{End}');
      await expect(triggers[triggers.length - 1]).toHaveFocus();
    });

    await step('Tab e Shift+Tab movem o foco entre triggers', async () => {
      // Documentado em accessibility.keyboard.tab/shiftTab; o conteúdo dos itens
      // não tem elementos focáveis, então Tab vai direto ao próximo trigger.
      const triggers = canvas.getAllByRole('button');
      triggers[0].focus();
      await userEvent.tab();
      await expect(triggers[1]).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(triggers[0]).toHaveFocus();
    });

  },
};
