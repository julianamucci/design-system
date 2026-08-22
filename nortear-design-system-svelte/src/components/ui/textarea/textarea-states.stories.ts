import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import TextareaStory from './TextareaStory.svelte';
import {
  focusAssentadoRing,
  contrastTextBackground,
  resizeComputado,
} from '@shared/testing/textarea-probe';
import {
  textareaDisabledSource,
  textareaInvalidoSource,
  textareaPreenchidoSource,
  textareaSomenteLeituraSource,
  textareaSource,
} from './textarea.source';

const meta: Meta = {
  title: 'UI/Textarea/States',
  component: TextareaStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; Default e Focus não têm
      // marcação própria e ficam com a forma canônica.
      source: { transform: textareaSource },
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
    Component: TextareaStory,
    props: {
      id: 'estado-default',
      labelText: 'Descrição',
      placeholder: 'ex: Descreva o produto...',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea vazio, visível e habilitado', async () => {
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
    Component: TextareaStory,
    props: {
      id: 'estado-focus',
      labelText: 'Descrição',
      placeholder: 'ex: Descreva o produto...',
    },
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
  parameters: {
    covers: ['accessibility.item2', 'visual.item2'],
    docs: { source: { transform: textareaPreenchidoSource } },
  },
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'estado-filled',
      labelText: 'Biografia',
      value: 'Camiseta de algodão pima, gola redonda, manga curta. Tamanhos P, M, G e GG.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Biografia') as HTMLTextAreaElement;

    await step('Textarea contém valor preenchido', async () => {
      await expect(textarea.value).toContain('Camiseta de algodão');
    });

    await step('Texto digitado tem contraste de pelo menos 4.5:1', async () => {
      const ratio = contrastTextBackground(textarea);
      await expect(ratio).not.toBeNull();
      await expect(ratio!).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: textareaDisabledSource } },
  },
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'estado-disabled',
      labelText: 'Descrição',
      placeholder: 'Não disponível',
      disabled: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea está desabilitado', async () => {
      await expect(textarea).toBeDisabled();
    });

    await step('Textarea desabilitado não aceita digitação', async () => {
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
    docs: { source: { transform: textareaInvalidoSource } },
  },
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'estado-invalid',
      labelText: 'Descrição',
      value: 'curto',
      'aria-invalid': 'true',
      errorText: 'A descrição precisa de pelo menos 20 caracteres.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Descrição') as HTMLTextAreaElement;

    await step('Textarea possui aria-invalid="true"', async () => {
      await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para uma mensagem que existe', async () => {
      // A story antiga apontava para um id que não existia no DOM: a asserção
      // conferia o ATRIBUTO e passava, enquanto o leitor de tela não anunciava
      // erro nenhum.
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
    docs: { source: { transform: textareaSomenteLeituraSource } },
  },
  render: () => ({
    Component: TextareaStory,
    props: {
      id: 'estado-readonly',
      labelText: 'Observações',
      value: 'Pedido confirmado em 02/05/2026. Entrega prevista em até 5 dias úteis.',
      readonly: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText('Observações') as HTMLTextAreaElement;

    await step('Textarea possui atributo readonly', async () => {
      await expect(textarea).toHaveAttribute('readonly');
    });

    await step('Textarea read-only não altera o valor ao digitar', async () => {
      const original = textarea.value;
      await userEvent.type(textarea, 'XX');
      await expect(textarea.value).toBe(original);
    });
  },
};
