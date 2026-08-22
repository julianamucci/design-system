import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createRadioGroup } from './radio-group';
import {
  radioGroupSource,
  radioGroupSourceWith,
  radioGroupSourceInvalido,
} from './radio-group.source';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/RadioGroup/States',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: radioGroupSource },
      description: {
        component:
          'Estados do RadioGroup: Default (nenhum selecionado), Checked (uma opção marcada), Disabled (grupo inteiro), DisabledItem (apenas 1 item bloqueado), Invalid (aria-invalid + mensagem) e Focus (anel `--ring`).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pergunta do grupo, igual em todas as stories deste arquivo. */
const PERGUNTA = 'Forma de pagamento';

/**
 * Razão de contraste da WCAG entre duas cores computadas opacas. Comparar nome
 * de token não responde a pergunta do critério — a razão responde.
 */
function ratioContrast(a: string, b: string): number {
  const luminancia = (cor: string): number => {
    const [r, g, bl] = cor
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () =>
    createRadioGroup({
      name: 'rg-default',
      legend: PERGUNTA,
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    }),
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
    docs: {
      description: {
        story: 'Nenhum item pré-selecionado — comportamento recomendado para forçar confirmação explícita.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Todos os radios têm aria-checked="false"', async () => {
      const radios = canvas.getAllByRole('radio');
      for (const r of radios) await expect(r).toHaveAttribute('aria-checked', 'false');
    });

    await step('Borda contra fundo e rótulo contra fundo passam na WCAG', async () => {
      // 3:1 é o piso de componente de interface (1.4.11); 4.5:1 é o de texto
      // normal (1.4.3) — o rótulo tem 14px, não é texto grande.
      const item = canvas.getAllByRole('radio')[0] as HTMLElement;
      const styleItem = getComputedStyle(item);
      await expect(
        ratioContrast(styleItem.borderTopColor, styleItem.backgroundColor),
      ).toBeGreaterThanOrEqual(3);

      const rotulo = canvasElement.querySelector<HTMLElement>('.nds-radio-label')!;
      const backgroundPage = getComputedStyle(canvasElement.ownerDocument.body).backgroundColor;
      await expect(
        ratioContrast(getComputedStyle(rotulo).color, backgroundPage),
      ).toBeGreaterThanOrEqual(4.5);
    });
  },
};

// ─── Checked ──────────────────────────────────────────────────────────────────

export const Checked: Story = {
  render: () =>
    createRadioGroup({
      name: 'rg-checked',
      legend: PERGUNTA,
      defaultValue: 'pix',
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    }),
  parameters: {
    covers: ['visual.item2'],
    // Override de story: `defaultValue` é o assunto.
    docs: {
      source: { transform: radioGroupSourceWith({ name: 'pagamento', defaultValue: 'pix' }) },
      description: {
        story: 'Item "Pix" marcado via `defaultValue`. Indicador interno visível, `aria-checked="true"`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Apenas o segundo radio está marcado', async () => {
      const radios = canvas.getAllByRole('radio');
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
      await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
      await expect(radios[2]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

// ─── Disabled (grupo inteiro) ─────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    // Override de story: `disabled` no grupo é o assunto.
    docs: {
      source: { transform: radioGroupSourceWith({ name: 'pagamento', disabled: true }) },
      description: {
        story:
          'Grupo inteiro bloqueado por `disabled: true` nas opções do factory — item e rótulo a 50% de opacidade, cursor bloqueado, sem foco e sem clique.',
      },
    },
  },
  render: () =>
    createRadioGroup({
      name: 'rg-disabled',
      legend: PERGUNTA,
      disabled: true,
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('O disabled do grupo desce para todos os itens', async () => {
      const radios = canvas.getAllByRole('radio');
      for (const r of radios) await expect(r).toBeDisabled();
    });
    await step('Nenhum item entra na ordem de tabulação', async () => {
      // Grupo bloqueado não é ponto de parada do Tab: o botão desabilitado já
      // sai da ordem, e nenhum roving tabindex o traz de volta.
      const radios = canvas.getAllByRole('radio') as HTMLElement[];
      await expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(0);
    });
    await step('Clique não altera o estado', async () => {
      const radios = canvas.getAllByRole('radio');
      await userEvent.click(radios[0], { pointerEventsCheck: 0 });
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

// ─── DisabledItem (apenas 1 item) ─────────────────────────────────────────────

export const DisabledItem: Story = {
  render: () =>
    createRadioGroup({
      name: 'rg-disabled-item',
      legend: PERGUNTA,
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto (temporariamente indisponível)', disabled: true },
      ],
    }),
  parameters: {
    // Override de story: `disabled` por ITEM é o assunto, e ele mora dentro de
    // `items` — nenhum control chega lá.
    docs: {
      source: {
        transform: radioGroupSourceWith({
          name: 'pagamento',
          items: [
            { value: 'card', label: 'Cartão de crédito' },
            { value: 'pix', label: 'Pix' },
            { value: 'boleto', label: 'Boleto (temporariamente indisponível)', disabled: true },
          ],
        }),
      },
      description: {
        story: 'Apenas o terceiro item desabilitado. Útil para indicar opções temporariamente indisponíveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Apenas o terceiro radio está desabilitado', async () => {
      const radios = canvas.getAllByRole('radio');
      await expect(radios[0]).not.toBeDisabled();
      await expect(radios[1]).not.toBeDisabled();
      await expect(radios[2]).toBeDisabled();
    });
  },
};

// ─── Invalid ──────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'xs';

    const group = createRadioGroup({
      name: 'rg-invalid',
      legend: PERGUNTA,
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    });
    group.setAttribute('aria-invalid', 'true');
    group.setAttribute('aria-describedby', 'rg-invalid-msg');

    // `aria-invalid` no item é o único gancho necessário: quem troca a cor da
    // borda é `.nds-radio-item[aria-invalid="true"]` no CSS compartilhado. A
    // versão anterior ainda empilhava uma classe e um box-shadow inline em
    // `rgb(var(--destructive))` — os tokens são HSL, então a sombra nunca
    // chegou a pintar nada.
    group.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]').forEach((btn) => {
      btn.setAttribute('aria-invalid', 'true');
    });

    const msg = document.createElement('p');
    msg.id = 'rg-invalid-msg';
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = 'Selecione uma forma de pagamento para continuar.';

    wrap.append(group, msg);
    return wrap;
  },
  parameters: {
    covers: ['visual.item4'],
    // Override de story: o erro não é opção da fábrica — é atributo marcado
    // depois de construir, mais a mensagem associada.
    docs: {
      source: { transform: radioGroupSourceInvalido({ name: 'pagamento' }) },
      description: {
        story:
          'Estado de erro via `aria-invalid="true"` no grupo. Borda `--destructive` em cada item, mensagem associada via `aria-describedby`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Grupo possui aria-invalid', async () => {
      const group = canvasElement.querySelector('[role="radiogroup"]');
      await expect(group).toHaveAttribute('aria-invalid', 'true');
    });
    await step('Mensagem de erro associada via aria-describedby', async () => {
      const group = canvasElement.querySelector('[role="radiogroup"]');
      await expect(group).toHaveAttribute('aria-describedby', 'rg-invalid-msg');
      await expect(canvas.getByText(/Selecione uma forma de pagamento/)).toBeVisible();
    });
  },
};

// ─── FocoVisivel ──────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  render: () =>
    createRadioGroup({
      name: 'rg-focus',
      legend: PERGUNTA,
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    }),
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Estado de foco por teclado. O anel sai de `:focus-visible` — 2px em `--ring` a 50% de opacidade — e não aparece no clique de mouse.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Um Tab entra no grupo e para no primeiro item', async () => {
      // Tab de verdade, não `.focus()`: `:focus-visible` só casa quando o foco
      // chega por teclado, e é dele que sai o anel.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      const radios = canvas.getAllByRole('radio');
      await expect(radios[0]).toHaveFocus();
    });
    await step('O item focado por teclado desenha anel visível', async () => {
      // Afirma o efeito, não a classe: a asserção sobrevive a qualquer troca de
      // vocabulário no CSS e reprova se o anel sumir.
      const foco = canvas.getAllByRole('radio')[0] as HTMLElement;
      const estilo = getComputedStyle(foco);
      await expect(estilo.boxShadow !== 'none' || estilo.outlineStyle !== 'none').toBe(true);
    });
  },
};
