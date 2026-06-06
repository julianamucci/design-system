import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createTextarea } from './textarea';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Textarea/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Textarea: Default (resize-y min-h-[120px]), WithCounter (maxLength + contador aria-live), NoResize (resize-none). ' +
          'NOTA: o factory Basecoat é wrapper enxuto — props como maxLength/readOnly/aria-invalid são aplicadas via DOM nativa após criação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLabeled(opts: {
  id: string;
  labelText: string;
  placeholder?: string;
  resizeClass: string;
  maxLength?: number;
}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full nds-max-w-md';
  wrapper.dataset.spacing = 'xs';

  const label = document.createElement('label');
  label.htmlFor = opts.id;
  label.className = 'nds-text-body nds-font-medium nds-text-foreground';
  label.textContent = opts.labelText;

  const textarea = createTextarea({
    id: opts.id,
    placeholder: opts.placeholder,
    class: opts.resizeClass,
  });
  textarea.style.minHeight = '120px';

  if (opts.maxLength !== undefined) textarea.maxLength = opts.maxLength;

  wrapper.append(label, textarea);

  if (opts.maxLength !== undefined) {
    const counter = document.createElement('span');
    counter.setAttribute('aria-live', 'polite');
    counter.setAttribute('aria-label', `0 de ${opts.maxLength} caracteres usados`);
    counter.className = 'nds-text-caption nds-text-muted-foreground';
    counter.style.fontVariantNumeric = 'tabular-nums';
    counter.style.alignSelf = 'flex-end';
    counter.textContent = `0/${opts.maxLength}`;
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      counter.textContent = `${len}/${opts.maxLength}`;
      counter.setAttribute('aria-label', `${len} de ${opts.maxLength} caracteres usados`);
    });
    wrapper.appendChild(counter);
  }

  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => buildLabeled({
    id: 'var-default',
    labelText: 'Descrição',
    placeholder: 'ex: Descreva o produto em até 500 caracteres...',
    resizeClass: 'resize-y',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea presente com label associado', async () => {
      const ta = canvas.getByLabelText('Descrição');
      await expect(ta).toBeInTheDocument();
      await expect(ta).not.toBeDisabled();
    });
  },
};

export const WithCounter: Story = {
  render: () => buildLabeled({
    id: 'var-counter',
    labelText: 'Descrição',
    placeholder: 'ex: Descreva o produto...',
    resizeClass: 'resize-y',
    maxLength: 500,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea com maxLength=500', async () => {
      const ta = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;
      await expect(ta.maxLength).toBe(500);
    });
    await step('Contador inicial "0/500" com aria-live="polite"', async () => {
      const counter = canvas.getByText('0/500');
      await expect(counter).toHaveAttribute('aria-live', 'polite');
      await expect(counter).toHaveAttribute('aria-label', '0 de 500 caracteres usados');
    });
    await step('Digitar atualiza o contador e o aria-label', async () => {
      const ta = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;
      await userEvent.type(ta, 'Camiseta');
      const counter = canvas.getByText('8/500');
      await expect(counter).toHaveAttribute('aria-label', '8 de 500 caracteres usados');
    });
  },
};

export const NoResize: Story = {
  render: () => buildLabeled({
    id: 'var-noresize',
    labelText: 'Feedback',
    placeholder: 'O que poderíamos melhorar?',
    resizeClass: 'resize-none',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea com classe resize-none', async () => {
      const ta = canvas.getByLabelText('Feedback');
      await expect(ta).toHaveClass('resize-none');
    });
  },
};
