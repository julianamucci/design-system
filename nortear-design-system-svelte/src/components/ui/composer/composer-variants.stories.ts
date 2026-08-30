import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Composer } from './index';
import { composerLabels } from './composer.fixtures';
import {
  composerBaseSource,
  composerEnterSource,
  composerModifierSource,
} from './composer.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os dois modos de envio. Não mudam o desenho: mudam qual tecla envia e o que a
// dica promete — e a dica tem de dizer a verdade sobre o dispositivo.

const meta: Meta<typeof Composer> = {
  title: 'UI/Composer/Variants',
  component: Composer,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: composerBaseSource },
      description: {
        component: 'Qual combinação envia, e o que a dica promete em cada modo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Composer>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSubmit = fn();

export const SubmitOnEnter: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item4', 'visual.item2'],
    docs: { source: { transform: composerEnterSource } },
  },
  render: () => ({
    Component: Composer,
    props: {
      labels: composerLabels(),
      submitOn: 'enter' as const,
      class: 'nds-max-w-lg',
      onSubmit,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    await step('A dica promete a tecla direta', async () => {
      // A dica não é decoração: ela é a descrição do campo, e prometer a tecla
      // errada é pior que não prometer nada.
      await expect(input).toHaveAccessibleDescription(/enter/i);
      await expect(input).not.toHaveAccessibleDescription(/ctrl/i);
    });

    await step('A tecla direta envia, sem espaços nas pontas', async () => {
      // Precondição própria: a play reexecuta no mesmo DOM.
      await userEvent.clear(input);
      onSubmit.mockClear();
      await userEvent.type(input, '  bom dia  ');
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('bom dia'));
    });

    await step('Com a modificadora, quebra linha e NÃO envia', async () => {
      await userEvent.clear(input);
      onSubmit.mockClear();
      await userEvent.type(input, 'primeira');
      await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
      await userEvent.type(input, 'segunda');

      await expect(input).toHaveValue('primeira\nsegunda');
      await expect(onSubmit).not.toHaveBeenCalled();
    });
  },
};

export const SubmitOnModifier: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: { source: { transform: composerModifierSource } },
  },
  render: () => ({
    Component: Composer,
    props: {
      labels: composerLabels(),
      submitOn: 'modifier' as const,
      class: 'nds-max-w-lg',
      onSubmit,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    await step('A dica promete a combinação', async () => {
      await expect(input).toHaveAccessibleDescription(/ctrl/i);
    });

    await step('A tecla direta quebra linha, e não envia', async () => {
      // É o modo do toque: no teclado virtual a tecla direta é a de parágrafo,
      // e enviar ali manda mensagem pela metade a cada tentativa.
      await userEvent.clear(input);
      onSubmit.mockClear();
      await userEvent.type(input, 'primeira');
      await userEvent.keyboard('{Enter}');
      await userEvent.type(input, 'segunda');

      await expect(input).toHaveValue('primeira\nsegunda');
      await expect(onSubmit).not.toHaveBeenCalled();
    });

    await step('A combinação envia', async () => {
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('primeira\nsegunda'));
    });
  },
};
