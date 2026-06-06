import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createInputOTP } from './input-otp';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/InputOTP/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do InputOTP: Vazio, Preenchendo (3 de 6), Completo (todos), Desabilitado e Erro (aria-invalid via wrapper).',
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
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '120px';
  wrapper.appendChild(child);
  return wrapper;
}

function fillSlots(root: HTMLElement, value: string): void {
  const inputs = Array.from(root.querySelectorAll('input')) as HTMLInputElement[];
  for (let i = 0; i < value.length && i < inputs.length; i++) {
    inputs[i].value = value[i];
  }
}

function applyError(root: HTMLElement): HTMLElement {
  const inputs = Array.from(root.querySelectorAll('input')) as HTMLInputElement[];
  for (const input of inputs) {
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('border-destructive');
    input.style.boxShadow = '0 0 0 2px hsl(var(--destructive) / 0.2)';
  }
  return root;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Vazio: Story = {
  name: 'Vazio',
  render: () => wrap(createInputOTP({ length: 6 })),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Slots vazios', async () => {
      const inputs = canvas.getAllByRole('textbox') as HTMLInputElement[];
      await expect(inputs.every((i) => i.value === '')).toBe(true);
    });
  },
};

export const Preenchendo: Story = {
  name: 'Preenchendo (3 de 6)',
  render: () => {
    const el = createInputOTP({ length: 6 });
    fillSlots(el, '123');
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Três primeiros slots preenchidos', async () => {
      const inputs = canvas.getAllByRole('textbox') as HTMLInputElement[];
      await expect(inputs[0].value).toBe('1');
      await expect(inputs[2].value).toBe('3');
      await expect(inputs[3].value).toBe('');
    });
  },
};

export const Completo: Story = {
  name: 'Completo',
  render: () => {
    const el = createInputOTP({ length: 6 });
    fillSlots(el, '123456');
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Todos os slots preenchidos', async () => {
      const inputs = canvas.getAllByRole('textbox') as HTMLInputElement[];
      await expect(inputs.map((i) => i.value).join('')).toBe('123456');
    });
  },
};

export const Desabilitado: Story = {
  name: 'Desabilitado',
  render: () => wrap(createInputOTP({ length: 6, disabled: true })),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Inputs disabled e bloqueados', async () => {
      const inputs = canvas.getAllByRole('textbox') as HTMLInputElement[];
      await expect(inputs[0].disabled).toBe(true);
      await userEvent.type(inputs[0], '1');
      await expect(inputs[0].value).toBe('');
    });
  },
};

export const Erro: Story = {
  name: 'Erro',
  render: () => {
    const el = createInputOTP({ length: 6 });
    fillSlots(el, '123456');
    applyError(el);
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-invalid=true e visual destructive aplicado', async () => {
      const inputs = canvas.getAllByRole('textbox') as HTMLInputElement[];
      await expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
      await expect(inputs[0].className).toMatch(/border-destructive/);
    });
  },
};
