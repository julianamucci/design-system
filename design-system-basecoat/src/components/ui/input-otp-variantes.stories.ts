import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createInputOTP } from './input-otp';

const meta: Meta = {
  title: 'UI/InputOTP/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do InputOTP no Basecoat: SeisDigitos (padrão SMS), QuatroDigitos (PIN) e ComSeparator (3+3). Divergência idiomática: o factory Basecoat aceita apenas dígitos (regex \\D no paste) — não há suporte a `pattern` alfanumérico nem a `inputMode=text`. A variante Alfanumerico é documentada mas omitida visualmente neste stack.',
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
  wrapper.className = 'w-full min-h-[120px] flex items-center justify-center';
  wrapper.appendChild(child);
  return wrapper;
}

function withLabel(label: string, child: HTMLElement): HTMLElement {
  const col = document.createElement('div');
  col.className = 'flex flex-col items-center gap-2';
  const span = document.createElement('p');
  span.className = 'text-xs text-muted-foreground';
  span.textContent = label;
  col.append(span, child);
  return col;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const SeisDigitos: Story = {
  name: 'Seis Dígitos (SMS)',
  render: () => wrap(withLabel('maxLength=6', createInputOTP({ length: 6 }))),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Renderiza 6 inputs', async () => {
      const inputs = canvas.getAllByRole('textbox');
      await expect(inputs).toHaveLength(6);
    });
  },
};

export const QuatroDigitos: Story = {
  name: 'Quatro Dígitos (PIN)',
  render: () => wrap(withLabel('maxLength=4', createInputOTP({ length: 4 }))),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Renderiza 4 inputs', async () => {
      const inputs = canvas.getAllByRole('textbox');
      await expect(inputs).toHaveLength(4);
    });
  },
};

export const ComSeparator: Story = {
  name: 'Com Separator (3+3)',
  render: () =>
    wrap(
      withLabel(
        'separator antes do índice 3',
        createInputOTP({ length: 6, separator: [3] }),
      ),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Renderiza 6 inputs com separator visual', async () => {
      const inputs = canvas.getAllByRole('textbox');
      await expect(inputs).toHaveLength(6);
      const sep = canvasElement.querySelector('[aria-hidden="true"]');
      await expect(sep).toBeTruthy();
    });
  },
};

export const Alfanumerico: Story = {
  name: 'Alfanumérico (não suportado)',
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col items-center gap-3 text-center max-w-md';
    const note = document.createElement('p');
    note.className = 'text-xs text-muted-foreground';
    note.textContent =
      'O factory Basecoat aceita apenas dígitos (inputMode=numeric, paste com regex \\D). Para códigos alfanuméricos use a variante das stacks React/Vue/Svelte ou estenda o factory.';
    const fallback = createInputOTP({ length: 6 });
    wrapper.append(note, fallback);
    return wrap(wrapper);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Renderiza fallback numérico com nota de divergência', async () => {
      const inputs = canvas.getAllByRole('textbox');
      await expect(inputs).toHaveLength(6);
      await expect(canvasElement.textContent).toMatch(/apenas dígitos/);
    });
  },
};
