import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createTextarea } from './textarea';
import { textareaSource, textareaSourceCom } from './textarea.source';
import { createLabel } from './label';
import {
  alturaMinimaPx,
  preencherAte,
  resizeComputado,
} from '@shared/testing/textarea-probe';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Textarea/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: textareaSource },
      description: {
        component:
          'Variantes do Textarea: padrão (redimensiona na vertical, altura mínima de 120px), com contador de caracteres e sem redimensionamento. ' +
          'NOTA: o factory Vanilla é wrapper enxuto — maxLength, readOnly e aria-invalid são aplicados via API DOM nativa após a criação.',
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
  hintText?: string;
  maxLength?: number;
}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-cap-md';
  wrapper.dataset.spacing = 'sm';

  const label = createLabel({ htmlFor: opts.id, text: opts.labelText });

  const textarea = createTextarea({
    id: opts.id,
    placeholder: opts.placeholder,
    class: `${opts.resizeClass} nds-min-h-30`,
  });

  if (opts.maxLength !== undefined) textarea.maxLength = opts.maxLength;

  wrapper.append(label, textarea);

  if (opts.maxLength !== undefined) {
    const max = opts.maxLength;
    const row = document.createElement('div');
    row.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
    row.dataset.justify = 'between';

    const hint = document.createElement('span');
    hint.textContent = opts.hintText ?? '';

    const counter = document.createElement('span');
    counter.className = 'nds-tabular-nums nds-shrink-0';
    counter.setAttribute('aria-live', 'polite');

    const atualizar = () => {
      const n = textarea.value.length;
      counter.textContent = `${n}/${max}`;
      counter.setAttribute('aria-label', `${n} de ${max} caracteres usados`);
    };
    atualizar();
    textarea.addEventListener('input', atualizar);

    row.append(hint, counter);
    wrapper.appendChild(row);
  }

  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => buildLabeled({
    id: 'var-default',
    labelText: 'Biografia',
    placeholder: 'Conte um pouco sobre você...',
    resizeClass: 'nds-resize-y',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Biografia');

    await step('Redimensiona só na vertical', async () => {
      await expect(resizeComputado(textarea)).toBe('vertical');
    });

    await step('Altura mínima de 120px', async () => {
      // A classe morta `min-h-[120px]` prometia isto e não aplicava nada; e o
      // `style.minHeight` que a substituía cravava a medida fora do tema.
      await expect(alturaMinimaPx(textarea)).toBe(120);
    });
  },
};

export const WithCounter: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item4'],
    // O contador é o assunto, e não é opção da fábrica: `maxLength` vai pela
    // API do DOM e o número precisa ser anunciado a quem não o vê.
    docs: {
      source: {
        transform: textareaSourceCom({
          id: 'descricao',
          label: 'Descrição',
          placeholder: 'ex: Camiseta de algodão, gola redonda...',
          hint: 'Descreva com clareza.',
          maxLength: 500,
        }),
      },
    },
  },
  render: () => buildLabeled({
    id: 'var-counter',
    labelText: 'Descrição',
    placeholder: 'ex: Camiseta de algodão, gola redonda...',
    resizeClass: 'nds-resize-y',
    hintText: 'Descreva com clareza.',
    maxLength: 500,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea com maxLength=500', async () => {
      await expect(textarea.maxLength).toBe(500);
    });

    await step('Contador inicial "0/500" com aria-live="polite"', async () => {
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveAttribute('aria-live', 'polite');
      await expect(counter).toHaveTextContent('0/500');
    });

    await step('Atingir o limite bloqueia novos caracteres', async () => {
      // Chega à borda por escrita programática (maxLength não se aplica a ela)
      // e digita os últimos de verdade — é aí que o bloqueio acontece.
      preencherAte(textarea, 496);
      await userEvent.type(textarea, 'abcdefgh');
      await expect(textarea.value.length).toBe(500);
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveTextContent('500/500');
    });
  },
};

export const NoResize: Story = {
  parameters: {
    docs: {
      source: {
        transform: textareaSourceCom({
          resize: 'none',
          id: 'feedback',
          label: 'Feedback',
          placeholder: 'O que poderíamos melhorar?',
        }),
      },
    },
  },
  render: () => buildLabeled({
    id: 'var-noresize',
    labelText: 'Feedback',
    placeholder: 'O que poderíamos melhorar?',
    resizeClass: 'nds-resize-none',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Feedback');

    await step('Redimensionamento desligado', async () => {
      // A asserção anterior era `toHaveClass('resize-none')` sobre um elemento
      // que recebia `nds-resize-none`: nome que não casa com nada aplicado.
      await expect(resizeComputado(textarea)).toBe('none');
    });
  },
};
