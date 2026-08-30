import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Composer } from './index';
import { composerLabels } from './composer.fixtures';
import { mentionSource, triggerLabels } from './composer-trigger-popover.fixtures';
import {
  triggerPopoverBaseSource,
  triggerPopoverKeyboardSource,
  triggerPopoverPointerSource,
} from './composer-trigger-popover.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os dois caminhos de escolher: pelo teclado e pelo ponteiro. É aqui que a
// decisão que atravessa o composer inteiro se prova — com a lista aberta, a
// tecla de envio ESCOLHE em vez de enviar.

const meta: Meta<typeof Composer> = {
  title: 'Primitives/Conversational/ComposerTriggerPopover/Compositions',
  component: Composer,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: triggerPopoverBaseSource },
      description: {
        component: 'Escolher pelo teclado e pelo ponteiro, sem que o foco saia do campo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Composer>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSubmit = fn();

const mount = () => ({
  Component: Composer,
  props: {
    labels: composerLabels(),
    triggerLabels: triggerLabels(),
    triggers: [mentionSource()],
    class: 'nds-max-w-lg',
    onSubmit,
  },
});

const panelOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-slot="composer-trigger-popover"]')!;

export const ChoosingWithKeyboard: Story = {
  parameters: {
    covers: ['functional.item4', 'functional.item5'],
    docs: { source: { transform: triggerPopoverKeyboardSource } },
  },
  render: mount,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const input = canvas.getByRole('textbox');
    const panel = () => panelOf(root);

    await step('Com a lista aberta, a tecla de envio ESCOLHE — e não envia', async () => {
      // A decisão que atravessa o componente inteiro. Enviar no meio de uma
      // menção manda a mensagem pela metade, e é o primeiro defeito que quem
      // escreve encontra.
      await userEvent.clear(input);
      onSubmit.mockClear();
      input.focus();
      await userEvent.type(input, 'avisa a @an');
      await waitFor(() => expect(panel().hidden).toBe(false));

      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(input).toHaveValue('avisa a @Ana Souza '));
      await expect(onSubmit).not.toHaveBeenCalled();
    });

    await step('Fechada a lista, a MESMA tecla envia', async () => {
      // O outro lado da decisão: a tecla não muda de dono para sempre, só
      // enquanto há uma lista disputando com ela.
      await waitFor(() => expect(panel().hidden).toBe(true));
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    });

    await step('A tecla de tabulação também escolhe, e o foco fica', async () => {
      // Sem isto o Tab tiraria o foco do campo com a lista aberta, e a escolha
      // se perderia no caminho.
      await userEvent.clear(input);
      await userEvent.type(input, 'oi @bru');
      await waitFor(() => expect(panel().hidden).toBe(false));

      await userEvent.tab();
      await waitFor(() => expect(input).toHaveValue('oi @Bruno Dias '));
      await expect(input).toHaveFocus();
    });
  },
};

export const ChoosingWithPointer: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item6'],
    docs: { source: { transform: triggerPopoverPointerSource } },
  },
  render: mount,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const input = canvas.getByRole('textbox');
    const panel = () => panelOf(root);

    await step('Apontar e escolher escreve no campo', async () => {
      await userEvent.clear(input);
      input.focus();
      await userEvent.type(input, 'avisa a @');
      await waitFor(() => expect(panel().hidden).toBe(false));

      const bruno = await within(panel()).findByText('Bruno Dias');
      await userEvent.click(bruno);
      await waitFor(() => expect(input).toHaveValue('avisa a @Bruno Dias '));
    });

    await step('E o foco continua no campo', async () => {
      // A escolha acontece ao APERTAR o botão, e não ao soltar: soltar tiraria
      // o foco do campo antes, e a escolha aconteceria com o cursor perdido.
      await expect(input).toHaveFocus();
    });

    await step('Cada opção tem pelo menos vinte e quatro pixels de alvo', async () => {
      // WCAG 2.5.8. É a regra em que esta família mais escorrega, e uma lista de
      // nomes é onde a tentação de apertar as linhas é maior.
      await userEvent.type(input, '@');
      await waitFor(() => expect(panel().hidden).toBe(false));

      const optionEls = await within(panel()).findAllByRole('option');
      for (const optionEl of optionEls) {
        const caixa = optionEl.getBoundingClientRect();
        await expect(caixa.height).toBeGreaterThanOrEqual(24);
      }
    });
  },
};
