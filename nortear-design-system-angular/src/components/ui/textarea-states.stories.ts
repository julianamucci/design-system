import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsTextarea } from './textarea';
import { NdsLabel } from './label';
import {
  focusAssentadoRing,
  contrastTextBackground,
  resizeComputado,
} from '@shared/testing/textarea-probe';

const meta: Meta = {
  title: 'UI/Textarea/States',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsTextarea, NdsLabel] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Textarea: default, focus, filled, disabled, invalid (aria-invalid) e read-only.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: { covers: ['accessibility.item1', 'visual.item1'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="est-default">Descrição</label>
        <textarea
          ndsTextarea
          id="est-default"
          class="nds-resize-y nds-min-h-30"
          placeholder="ex: Descreva o produto..."
        ></textarea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea padrão vazio, visível e habilitado', async () => {
      await expect(textarea).toBeVisible();
      await expect(textarea).not.toBeDisabled();
      await expect(textarea.value).toBe('');
    });
  },
};

export const Focus: Story = {
  parameters: { covers: ['accessibility.item3'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="est-focus">Descrição</label>
        <textarea
          ndsTextarea
          id="est-focus"
          class="nds-resize-y nds-min-h-30"
          placeholder="ex: Descreva o produto..."
        ></textarea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea recebe foco', async () => {
      textarea.focus();
      await expect(textarea).toHaveFocus();
    });

    await step('O anel de foco existe e é opaco o bastante para ser visto', async () => {
      // Medido DEPOIS da transição: lido no primeiro quadro, o computado
      // devolve `rgba(0,0,0,0) 0px 0px 0px 0px` e um anel pintado passa por
      // inexistente.
      const { boxShadow, corDaBorda } = focusAssentadoRing(textarea);
      await expect(boxShadow).not.toBe('none');
      await expect(boxShadow).toMatch(/2px/);
      await expect(corDaBorda).not.toBe('rgba(0, 0, 0, 0)');
    });
  },
};

export const Filled: Story = {
  parameters: { covers: ['accessibility.item2', 'visual.item2'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="est-filled">Biografia</label>
        <textarea
          ndsTextarea
          id="est-filled"
          class="nds-resize-y nds-min-h-30"
        >Designer multidisciplinar com 8 anos de experiência em produtos digitais.</textarea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Biografia') as HTMLTextAreaElement;

    await step('Textarea com valor pré-preenchido', async () => {
      await expect(textarea.value).toContain('Designer multidisciplinar');
    });

    await step('Texto digitado tem contraste de pelo menos 4.5:1', async () => {
      const ratio = contrastTextBackground(textarea);
      await expect(ratio).not.toBeNull();
      await expect(ratio!).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="est-disabled">Descrição</label>
        <textarea
          ndsTextarea
          id="est-disabled"
          class="nds-resize-y nds-min-h-30"
          placeholder="Não disponível"
          disabled
        ></textarea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea possui atributo disabled', async () => {
      await expect(textarea).toBeDisabled();
    });

    await step('Digitação não altera o value', async () => {
      await userEvent.type(textarea, 'teste', { pointerEventsCheck: 0 });
      await expect(textarea.value).toBe('');
    });

    await step('Desabilitado também trava o redimensionamento', async () => {
      await expect(resizeComputado(textarea)).toBe('none');
    });
  },
};

export const Invalid: Story = {
  parameters: { covers: ['accessibility.item5', 'visual.item3'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="est-invalid">Descrição</label>
        <textarea
          ndsTextarea
          id="est-invalid"
          class="nds-resize-y nds-min-h-30"
          aria-invalid="true"
          aria-describedby="est-invalid-msg"
        >curto</textarea>
        <p id="est-invalid-msg" class="nds-text-caption nds-text-destructive">
          A descrição precisa de pelo menos 20 caracteres.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea possui aria-invalid="true"', async () => {
      await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para uma mensagem que existe', async () => {
      const id = textarea.getAttribute('aria-describedby')!;
      await expect(canvasElement.ownerDocument.getElementById(id)).toBeInTheDocument();
      await expect(canvas.getByText(/pelo menos 20 caracteres/)).toBeVisible();
    });

    await step('A borda inválida difere da borda em repouso', async () => {
      const invalida = getComputedStyle(textarea).borderTopColor;
      const referencia = canvasElement.ownerDocument.createElement('textarea');
      referencia.className = 'nds-textarea';
      textarea.parentElement!.appendChild(referencia);
      const repouso = getComputedStyle(referencia).borderTopColor;
      referencia.remove();
      await expect(invalida).not.toBe(repouso);
    });
  },
};

export const ReadOnly: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <label ndsLabel for="est-readonly">Observações</label>
        <textarea
          ndsTextarea
          id="est-readonly"
          class="nds-resize-y nds-min-h-30"
          readonly
        >Pedido confirmado em 02/05/2026. Entrega prevista em até 5 dias úteis.</textarea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Observações') as HTMLTextAreaElement;

    await step('Textarea possui atributo readonly', async () => {
      await expect(textarea).toHaveAttribute('readonly');
    });

    await step('Conteúdo é selecionável mas não editável', async () => {
      const antes = textarea.value;
      await userEvent.type(textarea, 'teste');
      await expect(textarea.value).toBe(antes);
    });
  },
};
