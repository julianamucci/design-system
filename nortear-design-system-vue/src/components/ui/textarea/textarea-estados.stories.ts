import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { Textarea } from './index';
import { Label } from '@/components/ui/label';
import {
  anelDeFocoAssentado,
  contrasteTextoFundo,
  resizeComputado,
} from '@shared/testing/textarea-probe';
import {
  textareaComRotuloSource,
  textareaDesabilitadoSource,
  textareaInvalidoSource,
  textareaPreenchidoSource,
  textareaSomenteLeituraSource,
} from './textarea.source';

const meta = {
  title: 'UI/Textarea/States',
  component: Textarea,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Foco não se escreve: o par mínimo serve para as stories cujo assunto é
      // um estado que o navegador produz.
      source: { transform: textareaComRotuloSource },
      description: {
        component:
          'O Textarea possui 6 estados visuais: default, focus, filled, disabled, invalid (aria-invalid) e read-only. Os estilos de cada estado são controlados por tokens de tema.',
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: { covers: ['accessibility.item1', 'visual.item1'] },
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <Label for="estado-default">Descrição</Label>
        <Textarea id="estado-default" placeholder="ex: Descreva o produto..." class="nds-resize-y nds-min-h-30" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea padrão está vazio, visível e habilitado', async () => {
      const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;
      await expect(textarea).toBeVisible();
      await expect(textarea).not.toBeDisabled();
      await expect(textarea.value).toBe('');
    });
  },
};

export const Focus: Story = {
  parameters: { covers: ['accessibility.item3'] },
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <Label for="estado-focus">Descrição</Label>
        <Textarea id="estado-focus" placeholder="ex: Descreva o produto..." class="nds-resize-y nds-min-h-30" />
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
      const { boxShadow, corDaBorda } = anelDeFocoAssentado(textarea);
      await expect(boxShadow).not.toBe('none');
      await expect(boxShadow).toMatch(/2px/);
      await expect(corDaBorda).not.toBe('rgba(0, 0, 0, 0)');
    });
  },
};

export const Filled: Story = {
  parameters: {
    covers: ['accessibility.item2', 'visual.item2'],
    // O valor de partida é prop escrita à mão, e ela troca de lugar com o
    // `placeholder` — os dois nunca aparecem juntos.
    docs: { source: { transform: textareaPreenchidoSource } },
  },
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <Label for="estado-filled">Biografia</Label>
        <Textarea
          id="estado-filled"
          default-value="Designer e desenvolvedora apaixonada por design systems e acessibilidade."
          class="nds-resize-y nds-min-h-30"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Biografia') as HTMLTextAreaElement;

    await step('Textarea preenchido tem conteúdo inicial', async () => {
      await expect(textarea.value).toContain('Designer e desenvolvedora');
    });

    await step('Texto digitado tem contraste de pelo menos 4.5:1', async () => {
      const razao = contrasteTextoFundo(textarea);
      await expect(razao).not.toBeNull();
      await expect(razao!).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item5'],
    // `disabled` é a única diferença, e é o que o leitor precisa copiar.
    docs: { source: { transform: textareaDesabilitadoSource } },
  },
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <Label for="estado-disabled">Descrição</Label>
        <Textarea id="estado-disabled" placeholder="Não disponível" disabled class="nds-resize-y nds-min-h-30" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea está desabilitado', async () => {
      await expect(textarea).toBeDisabled();
    });

    await step('Não é possível digitar no textarea desabilitado', async () => {
      await userEvent.type(textarea, 'teste', { pointerEventsCheck: 0 });
      await expect(textarea.value).toBe('');
    });

    await step('Desabilitado também trava o redimensionamento', async () => {
      await expect(resizeComputado(textarea)).toBe('none');
    });
  },
};

export const Invalid: Story = {
  parameters: {
    covers: ['accessibility.item5', 'visual.item3'],
    // O erro traz a mensagem e o vínculo por `aria-describedby`: sem eles o
    // campo anunciaria "inválido" sem dizer por quê.
    docs: { source: { transform: textareaInvalidoSource } },
  },
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <Label for="estado-invalid">Descrição</Label>
        <Textarea
          id="estado-invalid"
          default-value="curto"
          aria-invalid="true"
          aria-describedby="estado-invalid-msg"
          class="nds-resize-y nds-min-h-30"
        />
        <p id="estado-invalid-msg" class="nds-text-caption nds-text-destructive">
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
  parameters: {
    covers: ['visual.item5'],
    // Somente leitura só faz sentido com conteúdo: o par vem sempre com o valor
    // de partida, nunca com placeholder.
    docs: { source: { transform: textareaSomenteLeituraSource } },
  },
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="nds-stack nds-w-cap-md" data-spacing="sm">
        <Label for="estado-readonly">Observações</Label>
        <Textarea
          id="estado-readonly"
          default-value="Pedido confirmado em 02/05/2026. Entrega prevista em até 5 dias úteis."
          readonly
          class="nds-resize-y nds-min-h-30"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Observações') as HTMLTextAreaElement;

    await step('Textarea está em modo somente leitura', async () => {
      await expect(textarea).toHaveAttribute('readonly');
    });

    await step('Conteúdo é selecionável mas não editável', async () => {
      const antes = textarea.value;
      await userEvent.type(textarea, 'teste');
      await expect(textarea.value).toBe(antes);
    });
  },
};
