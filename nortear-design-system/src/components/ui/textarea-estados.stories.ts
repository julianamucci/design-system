import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createTextarea } from './textarea';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Textarea/Estados',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      description: {
        component: 'Estados do Textarea: padrão (vazio), preenchido (filled), desabilitado, read-only e inválido (aria-invalid).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function labeled(id: string, labelText: string, textarea: HTMLTextAreaElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full nds-max-w-md';
  wrapper.dataset.spacing = 'xs';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.className = 'nds-text-body nds-font-medium nds-text-foreground';
  label.textContent = labelText;

  textarea.id = id;
  wrapper.append(label, textarea);
  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Padrao: Story = {
  render: () => labeled(
    'est-default',
    'Descrição',
    createTextarea({
      placeholder: 'ex: Descreva o produto...',
      class: 'resize-y',
    }),
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea padrão presente e habilitado', async () => {
      const ta = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;
      await expect(ta).toBeInTheDocument();
      await expect(ta).not.toBeDisabled();
      await expect(ta.value).toBe('');
    });
    await step('Sem aria-invalid no estado padrão', async () => {
      const ta = canvas.getByLabelText('Descrição');
      await expect(ta).not.toHaveAttribute('aria-invalid', 'true');
    });
  },
};

export const Filled: Story = {
  render: () => labeled(
    'est-filled',
    'Biografia',
    createTextarea({
      placeholder: 'Conte um pouco sobre você...',
      value: 'Designer multidisciplinar com 8 anos de experiência em produtos digitais. Apaixonado por sistemas de design escaláveis.',
      class: 'resize-y',
    }),
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea com valor pré-preenchido', async () => {
      const ta = canvas.getByLabelText('Biografia') as HTMLTextAreaElement;
      await expect(ta.value.length).toBeGreaterThan(0);
    });
  },
};

export const Desabilitado: Story = {
  render: () => labeled(
    'est-disabled',
    'Descrição',
    createTextarea({
      placeholder: 'Não disponível',
      disabled: true,
      class: 'resize-y',
    }),
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea possui atributo disabled', async () => {
      const ta = canvas.getByLabelText('Descrição');
      await expect(ta).toBeDisabled();
    });
  },
};

export const SomenteLeitura: Story = {
  render: () => {
    const ta = createTextarea({
      value: 'Este conteúdo é somente leitura — pode ser selecionado mas não editado.',
      class: 'resize-y',
    });
    ta.readOnly = true;
    return labeled('est-readonly', 'Termos', ta);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea possui atributo readOnly', async () => {
      const ta = canvas.getByLabelText('Termos') as HTMLTextAreaElement;
      await expect(ta.readOnly).toBe(true);
    });
  },
};

export const Invalido: Story = {
  render: () => {
    const ta = createTextarea({
      placeholder: 'ex: Descreva o produto...',
      class: 'resize-y',
    });
    ta.setAttribute('aria-invalid', 'true');
    return labeled('est-invalid', 'Descrição', ta);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea possui aria-invalid="true"', async () => {
      const ta = canvas.getByLabelText('Descrição');
      await expect(ta).toHaveAttribute('aria-invalid', 'true');
    });
  },
};
