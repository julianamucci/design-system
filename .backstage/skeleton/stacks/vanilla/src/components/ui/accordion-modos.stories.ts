import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createAccordion, type AccordionOptions } from './accordion';

const meta: Meta = {
  title: 'UI/Accordion/Modos',
};

export default meta;
type Story = StoryObj;

// ─── Items ────────────────────────────────────────────────────────────────────

const FAQ_ITEMS: AccordionOptions['items'] = [
  { value: 'senha',     trigger: 'Como faço para redefinir minha senha?',  content: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
  { value: 'pagamento', trigger: 'Quais formas de pagamento são aceitas?',  content: 'Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.' },
  { value: 'cancel',    trigger: 'Como cancelo minha assinatura?',          content: 'Você pode cancelar a qualquer momento em Configurações → Assinatura. O acesso permanece ativo até o fim do período já pago.' },
];

const SPEC_ITEMS: AccordionOptions['items'] = [
  { value: 'layout',   trigger: 'Layout e Espaçamento', content: 'Grid de 12 colunas, gutter de 24px, margem lateral mínima de 16px em mobile e 24px em tablet.' },
  { value: 'cores',    trigger: 'Cores e Tokens',       content: 'Paleta semântica com tokens de background, foreground, primary, secondary, destructive, muted e accent.' },
  { value: 'tipografia', trigger: 'Tipografia',         content: 'Escala tipográfica de xs (12px) a 4xl (36px). Família padrão: Inter. Peso regular (400) e medium (500).' },
];

// ─── Modos ────────────────────────────────────────────────────────────────────

export const Single: Story = {
  render: () => createAccordion({ type: 'single', collapsible: true, items: FAQ_ITEMS }),
  parameters: {
    docs: {
      description: {
        story: 'Apenas um item pode estar aberto por vez. Abrir um novo fecha o anterior automaticamente.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Abre o primeiro item', async () => {
      await userEvent.click(triggers[0]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Abrir segundo fecha o primeiro', async () => {
      await userEvent.click(triggers[1]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Multiple: Story = {
  render: () => createAccordion({ type: 'multiple', items: SPEC_ITEMS }),
  parameters: {
    docs: {
      description: {
        story: 'Múltiplos itens podem estar abertos simultaneamente. Use para conteúdo independente que o usuário precisa comparar.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Abre dois itens simultaneamente', async () => {
      await userEvent.click(triggers[0]);
      await userEvent.click(triggers[1]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const Controlled: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full max-w-lg space-y-3';

    const indicator = document.createElement('p');
    indicator.className = 'text-xs text-muted-foreground';

    const setIndicator = (val: string | string[]) => {
      const display = Array.isArray(val) ? val.join(', ') : val || '(nenhum)';
      indicator.innerHTML = `Item ativo: <code class="font-mono">${display}</code>`;
    };
    setIndicator('item-1');

    const accordion = createAccordion({
      type: 'single',
      collapsible: true,
      defaultValue: 'item-1',
      onValueChange: setIndicator,
      items: [
        { value: 'item-1', trigger: 'Item 1', content: 'Conteúdo do primeiro item.' },
        { value: 'item-2', trigger: 'Item 2', content: 'Conteúdo do segundo item.' },
        { value: 'item-3', trigger: 'Item 3', content: 'Conteúdo do terceiro item.' },
      ],
    });

    wrapper.append(indicator, accordion);
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story: 'Modo controlado via onValueChange. O indicador acima mostra o item ativo em tempo real.',
      },
    },
  },
};

export const DefaultOpen: Story = {
  render: () =>
    createAccordion({
      type: 'single',
      collapsible: true,
      defaultValue: 'senha',
      items: FAQ_ITEMS,
    }),
  parameters: {
    docs: {
      description: {
        story: 'Item aberto por padrão via defaultValue. Use para destacar a pergunta mais frequente ou o passo atual de um fluxo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Primeiro item está aberto por padrão', async () => {
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};
