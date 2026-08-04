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
      description:
        'Desmonta o conteúdo ao fechar. Este design system entrega false: o painel fechado permanece no DOM com hidden="until-found", e é isso que deixa o Ctrl+F do navegador achar e abrir o item. Ligar desativa a busca.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
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
    unmountOnHide: false,
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
    await step('Trigger aponta para o painel por aria-controls, e o painel NAO e landmark', async () => {
      // Documentado em accessibility.aria.* como automático — esta asserção é o
      // que impede a docs page de afirmar o que a lib não faz.
      // Medido com o item ABERTO: onde o painel desmonta ao fechar, apontar
      // aria-controls para id ausente seria ARIA inválido.
      const trigger = canvas.getAllByRole('button')[0];
      await userEvent.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
      const contentId = trigger.getAttribute('aria-controls');
      await expect(contentId).toBeTruthy();
      const panel = canvasElement.querySelector(`#${CSS.escape(contentId!)}`);
      // Sem role="region": o painel fica sempre montado por causa do
      // until-found, e um landmark por item proliferaria — medido na docs
      // page, 41 paineis viraram 41 landmarks (axe landmark-unique).
      await expect(panel).not.toHaveAttribute('role');
      await expect(trigger.id).toBeTruthy();
    });

    await step('Painel fechado continua no DOM, achável pelo Ctrl+F', async () => {
      // `hidden="until-found"` esconde por content-visibility, não por display —
      // é o que deixa a busca do navegador achar a resposta e abrir o item.
      // O display computado entra na asserção de propósito: uma regra de autor
      // com `display: none` anula o recurso sem quebrar nada visível.
      const trigger = canvas.getAllByRole('button')[0];
      await userEvent.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
      const panel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>('[data-slot="accordion-content"]');
        if (!el || el.getAttribute('hidden') === null) throw new Error('painel ainda fechando');
        return el;
      });
      await expect(panel.getAttribute('hidden')).toBe('until-found');
      await expect(getComputedStyle(panel).display).not.toBe('none');
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
