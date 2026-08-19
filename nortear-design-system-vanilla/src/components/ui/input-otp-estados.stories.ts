import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { razao } from '@shared/testing/cor';
import { createInputOTP } from './input-otp';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/InputOTP/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do InputOTP: Vazio, Preenchendo (3 de 6), Completo (todos), Desabilitado e Erro (aria-invalid).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full nds-min-h-30';
  wrapper.dataset.justify = 'center';
  wrapper.appendChild(child);
  return wrapper;
}

const slotsDe = (raiz: HTMLElement): HTMLInputElement[] => [
  ...raiz.querySelectorAll<HTMLInputElement>('[data-slot="input-otp-slot"]'),
];

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Empty: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => wrap(createInputOTP({ length: 6, autoFocus: true })),
  play: async ({ canvasElement, step }) => {
    await step('Nasce vazio com o primeiro slot pronto para receber', async () => {
      const slots = slotsDe(canvasElement);
      await expect(slots.map((s) => s.value).join('')).toBe('');
      await expect(slots[0]).toHaveFocus();
    });
  },
};

export const Filling: Story = {
  name: 'Filling (3 of 6)',
  parameters: { covers: ['visual.item2', 'accessibility.item6'] },
  render: () => wrap(createInputOTP({ length: 6, value: '123' })),
  play: async ({ canvasElement, step }) => {
    await step('O valor inicial se distribui da esquerda para a direita', async () => {
      const slots = slotsDe(canvasElement);
      await expect(slots.map((s) => s.value)).toEqual(['1', '2', '3', '', '', '']);
    });

    await step('O dígito digitado tem contraste suficiente contra o slot', async () => {
      // Um slot é uma caixa pequena com um caractere só: se o contraste cair,
      // não há palavra em volta para compensar pelo contexto. Conta WCAG feita
      // pelo colhedor compartilhado, não por olhômetro nem por nome de token.
      const slot = slotsDe(canvasElement)[0];
      const cs = getComputedStyle(slot);
      const medida = razao(cs.color, cs.backgroundColor);
      await expect(medida?.razao ?? 0).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Complete: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => wrap(createInputOTP({ length: 6, value: '482913' })),
  play: async ({ canvasElement, step }) => {
    await step('Todos os slots preenchidos, na ordem do código', async () => {
      const slots = slotsDe(canvasElement);
      await expect(slots.map((s) => s.value).join('')).toBe('482913');
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item6'] },
  render: () => wrap(createInputOTP({ length: 6, value: '4829', disabled: true })),
  play: async ({ canvasElement, step }) => {
    await step('Nenhum slot aceita foco nem digitação', async () => {
      const slots = slotsDe(canvasElement);
      for (const slot of slots) await expect(slot).toBeDisabled();
      await userEvent.click(slots[4]);
      await expect(slots[4]).not.toHaveFocus();
    });

    await step('O bloqueio também se vê', async () => {
      // Efeito computado: a folha esmaece cada slot, e medir a opacidade é o
      // que prova que a cascata chegou — asserção de nome de classe passaria
      // com a classe morta.
      const slot = slotsDe(canvasElement)[0];
      await expect(Number(getComputedStyle(slot).opacity)).toBeLessThan(1);
    });
  },
};

export const Error: Story = {
  parameters: { covers: ['functional.item7', 'accessibility.item5', 'visual.item4'] },
  render: () => {
    const raiz = document.createElement('div');
    raiz.className = 'nds-stack';
    raiz.dataset.spacing = 'sm';
    raiz.style.width = 'fit-content';

    const comErro = createInputOTP({
      length: 6,
      value: '482913',
      invalid: true,
      describedBy: 'est-erro-msg',
    });
    comErro.dataset.testid = 'com-erro';

    const msg = document.createElement('p');
    msg.id = 'est-erro-msg';
    msg.className = 'nds-text-caption nds-text-destructive';
    msg.textContent = 'Código incorreto. Verifique e tente novamente.';

    const rotuloOk = document.createElement('p');
    rotuloOk.className = 'nds-text-caption nds-text-muted-foreground';
    rotuloOk.textContent = 'Comparação — sem erro';

    const semErro = createInputOTP({ length: 6, value: '482913' });
    semErro.dataset.testid = 'sem-erro';

    raiz.append(comErro, msg, rotuloOk, semErro);
    return wrap(raiz);
  },
  play: async ({ canvasElement, step }) => {
    const comErro = () => canvasElement.querySelector<HTMLElement>('[data-testid="com-erro"]')!;

    await step('O erro é anunciado por ARIA, não só pela borda', async () => {
      const slots = slotsDe(comErro());
      await expect(slots).toHaveLength(6);
      for (const slot of slots) await expect(slot).toHaveAttribute('aria-invalid', 'true');
    });

    await step('A mensagem de erro está ligada ao campo', async () => {
      const slot = slotsDe(comErro())[0];
      const id = slot.getAttribute('aria-describedby');
      await expect(id).toBe('est-erro-msg');
      await expect(canvasElement.querySelector(`#${id}`)).toBeTruthy();
    });

    await step('A borda do slot troca para a cor de erro', async () => {
      // Comparação contra uma SEGUNDA instância sem erro em vez de remover o
      // atributo da primeira: mexer no DOM renderizado deixaria a asserção
      // medindo o mesmo estado dos dois lados, e ela não poderia falhar.
      const bordaComErro = getComputedStyle(slotsDe(comErro())[0]).borderTopColor;
      const bordaSemErro = getComputedStyle(
        slotsDe(canvasElement.querySelector<HTMLElement>('[data-testid="sem-erro"]')!)[0],
      ).borderTopColor;
      await expect(bordaComErro).not.toBe(bordaSemErro);
    });
  },
};
