import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createAccordion, type AccordionOptions } from './accordion';
import { createAccordionDocs } from '@/components/docs/AccordionDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type AccordionArgs = {
  type: 'single' | 'multiple';
  collapsible: boolean;
  // Documentadas na aba "API Reference" sem control — o Playground não as
  // encaminha para a factory, mas fazem parte de AccordionOptions.
  defaultValue?: AccordionOptions['defaultValue'];
  onValueChange?: AccordionOptions['onValueChange'];
  items?: AccordionOptions['items'];
  class?: string;
};

const meta: Meta<AccordionArgs> = {
  title: 'UI/Accordion',
  tags: ['autodocs', 'disclosure'],
  parameters: {
    docs: { page: withAutoDocsTab(createAccordionDocs) },
  },
  // Esta stack não tem docgen (não há componente de framework para introspectar):
  // a aba "API Reference" é montada só a partir destes argTypes. Props sem
  // control são documentação — o Playground não as encaminha para a factory,
  // e control ativo sem fiação viraria controle morto.
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Modo de expansão: um item ou múltiplos simultaneamente.',
      table: { type: { summary: "'single' | 'multiple'" }, defaultValue: { summary: "'single'" } },
    },
    collapsible: {
      control: 'boolean',
      description: 'Permite fechar o item aberto (apenas no modo único).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    defaultValue: {
      control: false,
      description: 'Item(ns) aberto(s) inicialmente. O Playground começa com todos fechados.',
      table: { type: { summary: 'string | string[]' } },
    },
    onValueChange: {
      control: false,
      description: 'Callback disparado quando o valor muda.',
      table: { type: { summary: '(value: string | string[]) => void' } },
    },
    items: {
      control: false,
      description: 'Itens do accordion. Cada um com value, trigger, content e disabled opcional.',
      table: { type: { summary: 'Array<{ value; trigger; content; disabled? }>' } },
    },
    class: {
      control: false,
      description: 'Classes adicionais no elemento raiz.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    type: 'single',
    collapsible: true,
  },
};

export default meta;
type Story = StoryObj<AccordionArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

// Mesmas perguntas da seção Demonstração da docs page e das demais stacks.
const DEMO_ITEMS: AccordionOptions['items'] = [
  { value: 'item-1', trigger: 'Como faço para redefinir minha senha?', content: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
  { value: 'item-2', trigger: 'Quais formas de pagamento são aceitas?', content: 'Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.' },
  { value: 'item-3', trigger: 'Como cancelo minha assinatura?', content: 'Você pode cancelar a qualquer momento em Configurações → Assinatura. O acesso permanece ativo até o fim do período já pago.' },
];

export const Playground: Story = {
  // O renderer html monta o snippet a partir do `outerHTML` do elemento
  // devolvido pelo render. `type` e `collapsible` só existem no closure da
  // factory — não viram atributo — então o HTML sai idêntico nos dois modos e a
  // caixa de código nunca mudava ao mexer nos controls. Além disso, um dump de
  // DOM não é o que o consumidor escreve: ele chama a factory. O snippet passa
  // a ser a chamada real, montada a partir dos args.
  parameters: {
    docs: {
      source: {
        transform: (_generated: string, ctx: { args?: Partial<AccordionArgs> }) => {
          const { type = 'single', collapsible = true } = ctx.args ?? {};
          const items = DEMO_ITEMS.map(
            (i) => `    { value: '${i.value}', trigger: '${i.trigger}', content: '…' },`,
          ).join('\n');
          return `import { createAccordion } from '@/components/ui/accordion';

const accordion = createAccordion({
  type: '${type}',
  collapsible: ${collapsible},
  items: [
${items}
  ],
});

document.querySelector('#app')?.append(accordion);`;
        },
      },
    },
  },
  render: (args) =>
    createAccordion({
      type: args.type,
      collapsible: args.collapsible,
      items: DEMO_ITEMS,
    }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('A raiz registra a configuração recebida', async () => {
      const root = canvasElement.querySelector('[data-slot="accordion"]');
      await expect(root).toHaveAttribute('data-type', args.type);
      await expect(root).toHaveAttribute('data-collapsible', String(args.collapsible));
    });

    await step('Todos os triggers estão fechados por padrão', async () => {
      for (const trigger of triggers) {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }
    });

    await step('Clicar no primeiro trigger abre o item', async () => {
      await userEvent.click(triggers[0]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('No modo single, abrir outro fecha o primeiro', async () => {
      await userEvent.click(triggers[1]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Conteúdo aberto fica de fato visível, com altura real', async () => {
      // aria-expanded sozinho não prova que o painel apareceu: já houve
      // regressão em que o trigger reportava aberto e o conteúdo ficava
      // colapsado (altura vinda de custom property defasada da lib).
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

    await step('Enter expande um item fechado', async () => {
      // triggers[2] está fechado (single-mode fechou ao abrir triggers[1]).
      // Focamos e pressionamos Enter — deve abrir (não clicar+Enter, que toggla duas vezes).
      triggers[2].focus();
      await userEvent.keyboard('{Enter}');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Space colapsa um item aberto (collapsible=true)', async () => {
      // triggers[2] está aberto do step anterior — Space toggla para fechado.
      triggers[2].focus();
      await userEvent.keyboard(' ');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'false');
    });
    await step('Setas movem o foco entre triggers (com loop)', async () => {
      triggers[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(triggers[1]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(triggers[0]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(triggers[triggers.length - 1]).toHaveFocus();
    });

    await step('Tab e Shift+Tab movem o foco entre triggers', async () => {
      // Documentado em accessibility.keyboard.tab/shiftTab; o conteúdo dos itens
      // não tem elementos focáveis, então Tab vai direto ao próximo trigger.
      triggers[0].focus();
      await userEvent.tab();
      await expect(triggers[1]).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(triggers[0]).toHaveFocus();
    });

  },
};
