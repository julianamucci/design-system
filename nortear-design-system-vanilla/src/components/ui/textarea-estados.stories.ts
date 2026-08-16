import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createTextarea } from './textarea';
import { createLabel } from './label';
import {
  anelDeFocoAssentado,
  contrasteTextoFundo,
  resizeComputado,
} from '@shared/testing/textarea-probe';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Textarea/States',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Textarea: padrão (vazio), foco, preenchido, desabilitado, read-only e inválido (aria-invalid).',
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
  wrapper.dataset.spacing = 'sm';

  textarea.id = id;
  wrapper.append(createLabel({ htmlFor: id, text: labelText }), textarea);
  return wrapper;
}

const CLASSES = 'nds-resize-y nds-min-h-30';

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: { covers: ['accessibility.item1', 'visual.item1'] },
  render: () => labeled(
    'est-default',
    'Descrição',
    createTextarea({ placeholder: 'ex: Descreva o produto...', class: CLASSES }),
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const ta = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea padrão vazio e habilitado', async () => {
      await expect(ta).toBeVisible();
      await expect(ta).not.toBeDisabled();
      await expect(ta.value).toBe('');
    });

    await step('Sem aria-invalid no estado padrão', async () => {
      await expect(ta).not.toHaveAttribute('aria-invalid', 'true');
    });
  },
};

export const Focus: Story = {
  parameters: { covers: ['accessibility.item3'] },
  render: () => labeled(
    'est-focus',
    'Descrição',
    createTextarea({ placeholder: 'ex: Descreva o produto...', class: CLASSES }),
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const ta = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea recebe foco', async () => {
      ta.focus();
      await expect(ta).toHaveFocus();
    });

    await step('O anel de foco existe e é opaco o bastante para ser visto', async () => {
      // Medido DEPOIS da transição: lido no primeiro quadro, o computado
      // devolve `rgba(0,0,0,0) 0px 0px 0px 0px` e um anel pintado passa por
      // inexistente.
      const { boxShadow, corDaBorda } = anelDeFocoAssentado(ta);
      await expect(boxShadow).not.toBe('none');
      await expect(boxShadow).toMatch(/2px/);
      await expect(corDaBorda).not.toBe('rgba(0, 0, 0, 0)');
    });
  },
};

export const Filled: Story = {
  parameters: { covers: ['accessibility.item2', 'visual.item2'] },
  render: () => labeled(
    'est-filled',
    'Biografia',
    createTextarea({
      placeholder: 'Conte um pouco sobre você...',
      value: 'Designer multidisciplinar com 8 anos de experiência em produtos digitais. Apaixonado por sistemas de design escaláveis.',
      class: CLASSES,
    }),
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const ta = canvas.getByLabelText('Biografia') as HTMLTextAreaElement;

    await step('Textarea com valor pré-preenchido', async () => {
      await expect(ta.value).toContain('Designer multidisciplinar');
    });

    await step('Texto digitado tem contraste de pelo menos 4.5:1', async () => {
      const razao = contrasteTextoFundo(ta);
      await expect(razao).not.toBeNull();
      await expect(razao!).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => labeled(
    'est-disabled',
    'Descrição',
    createTextarea({ placeholder: 'Não disponível', disabled: true, class: CLASSES }),
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const ta = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea possui atributo disabled', async () => {
      await expect(ta).toBeDisabled();
    });

    await step('Digitação não altera o value', async () => {
      await userEvent.type(ta, 'teste', { pointerEventsCheck: 0 });
      await expect(ta.value).toBe('');
    });

    await step('Desabilitado também trava o redimensionamento', async () => {
      await expect(resizeComputado(ta)).toBe('none');
    });
  },
};

export const ReadOnly: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => {
    const ta = createTextarea({
      value: 'Pedido confirmado em 02/05/2026. Entrega prevista em até 5 dias úteis.',
      class: CLASSES,
    });
    ta.readOnly = true;
    return labeled('est-readonly', 'Observações', ta);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const ta = canvas.getByLabelText('Observações') as HTMLTextAreaElement;

    await step('Textarea possui atributo readOnly', async () => {
      await expect(ta.readOnly).toBe(true);
    });

    await step('Conteúdo é selecionável mas não editável', async () => {
      const antes = ta.value;
      await userEvent.type(ta, 'teste');
      await expect(ta.value).toBe(antes);
    });
  },
};

export const Invalid: Story = {
  parameters: { covers: ['accessibility.item5', 'visual.item3'] },
  render: () => {
    const ta = createTextarea({ value: 'curto', class: CLASSES });
    ta.setAttribute('aria-invalid', 'true');
    ta.setAttribute('aria-describedby', 'est-invalid-msg');
    const wrapper = labeled('est-invalid', 'Descrição', ta);

    const msg = document.createElement('p');
    msg.id = 'est-invalid-msg';
    msg.className = 'nds-text-caption nds-text-destructive';
    msg.textContent = 'A descrição precisa de pelo menos 20 caracteres.';
    wrapper.appendChild(msg);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const ta = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea possui aria-invalid="true"', async () => {
      await expect(ta).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para uma mensagem que existe', async () => {
      const id = ta.getAttribute('aria-describedby')!;
      await expect(canvasElement.ownerDocument.getElementById(id)).toBeInTheDocument();
      await expect(canvas.getByText(/pelo menos 20 caracteres/)).toBeVisible();
    });

    await step('A borda inválida difere da borda em repouso', async () => {
      const invalida = getComputedStyle(ta).borderTopColor;
      const referencia = createTextarea({});
      ta.parentElement!.appendChild(referencia);
      const repouso = getComputedStyle(referencia).borderTopColor;
      referencia.remove();
      await expect(invalida).not.toBe(repouso);
    });
  },
};
