import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
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
    design: figmaDesign('accordion'),
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
      description: "Item(ns) aberto(s) inicialmente. O Playground fixa 'item-1'.",
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
    onValueChange: fn(),
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
    covers: [
      'functional.item1', 'functional.item3', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item4', 'accessibility.item6',
      'visual.item1',
    ],
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
  defaultValue: 'item-1',
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
      defaultValue: 'item-1',
      onValueChange: args.onValueChange,
      items: DEMO_ITEMS,
    }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    // Idempotentes de propósito: clicam SÓ se o estado atual já não for o
    // desejado. Um clique cego ALTERNA — a partir do estado errado ele inverte
    // o resultado e a asserção seguinte falha. É o que fazia este Playground
    // passar no vitest (montagem limpa) e falhar no painel Interactions, onde
    // o replay reaproveita o componente já mexido.
    const abrir = async (t: HTMLElement) => {
      if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
      await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
    };
    const fechar = async (t: HTMLElement) => {
      if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
      await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
    };

    await step('A raiz registra a configuração recebida', async () => {
      const root = canvasElement.querySelector('[data-slot="accordion"]');
      await expect(root).toHaveAttribute('data-type', args.type);
      await expect(root).toHaveAttribute('data-collapsible', String(args.collapsible));
    });

    await step('Item 1 começa aberto (defaultValue)', async () => {
      await waitFor(() => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'));
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no trigger fechado abre o item, e o modo single fecha o anterior', async () => {
      await userEvent.click(triggers[1]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
      // A aba Actions só se popula se o callback chegar à factory.
      await expect(args.onValueChange).toHaveBeenCalled();
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
    await step('Trigger aponta para o painel por aria-controls, e o painel NAO e landmark', async () => {
      // Documentado em accessibility.aria.* como automático — esta asserção é o
      // que impede a docs page de afirmar o que a factory não faz.
      // Medido com o item ABERTO: onde o painel desmonta ao fechar, apontar
      // aria-controls para id ausente seria ARIA inválido.
      const trigger = triggers[0];
      await abrir(trigger);
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
      await abrir(triggers[0]);      // parte de aberto, seja qual for o estado herdado
      await fechar(triggers[0]);
      const panel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>('[data-slot="accordion-content"]');
        if (!el || el.getAttribute('hidden') === null) throw new Error('painel ainda fechando');
        return el;
      });
      await expect(panel.getAttribute('hidden')).toBe('until-found');
      await expect(getComputedStyle(panel).display).not.toBe('none');
    });

    await step('Setas movem o foco entre triggers (com loop) e Home/End vão às pontas', async () => {
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
      triggers[0].focus();
      await userEvent.tab();
      await expect(triggers[1]).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(triggers[0]).toHaveFocus();
    });

  },
};
