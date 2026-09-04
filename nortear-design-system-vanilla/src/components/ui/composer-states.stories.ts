import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { createComposer, type ComposerElement } from './composer';
import { composerLabels, textOfLength } from './composer.fixtures';
import { composerSourceWith } from './composer.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que a docs page lista. O estado vazio é o Playground, e não se
// repete aqui.

const meta: Meta = {
  title: 'Components/Conversational/Composer/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: composerSourceWith({}) },
      description: {
        component: 'Cada story fixa um estado e verifica o que ele muda no campo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSubmit = fn();
const onStop = fn();

const LIMITE = 120;

export const Filled: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: composerSourceWith({ value: 'Resume a última reunião.' }) } },
  },
  render: () =>
    createComposer({
      labels: composerLabels(),
      value: 'Resume a última reunião.',
      onSubmit,
      class: 'nds-max-w-lg',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Com texto, o envio está disponível', async () => {
      await expect(canvas.getByRole('button', { name: composerLabels().submit })).toBeEnabled();
    });
  },
};

export const Running: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item4', 'visual.item4'],
    docs: { source: { transform: composerSourceWith({ running: true, value: 'Resume a última reunião.' }) } },
  },
  render: () => {
    const composer = createComposer({
      labels: composerLabels(),
      value: 'Resume a última reunião.',
      onSubmit,
      onStop,
      class: 'nds-max-w-lg',
    });
    composer.setRunning(true);
    return composer;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<ComposerElement>('[data-slot="composer"]')!;
    const input = canvas.getByRole('textbox');

    await step('O botão troca de NOME, e não só de forma', async () => {
      // Precondição própria: a play reexecuta no mesmo DOM.
      root.setRunning(true);
      // Trocar só o ícone deixaria quem usa leitor de tela sem saber o que o
      // botão faz agora — e agora ele faz o oposto do que fazia.
      const rotulos = composerLabels();
      await expect(canvas.getByRole('button', { name: rotulos.stop })).toBeInTheDocument();
      await expect(canvas.queryByRole('button', { name: rotulos.submit })).toBeNull();
    });

    await step('Ele interrompe, e não envia', async () => {
      onSubmit.mockClear();
      onStop.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: composerLabels().stop }));
      await expect(onStop).toHaveBeenCalledTimes(1);
      await expect(onSubmit).not.toHaveBeenCalled();
    });

    await step('E a tecla de envio também não envia enquanto gera', async () => {
      // Um segundo envio no meio do primeiro é o defeito que este estado
      // existe para impedir.
      onSubmit.mockClear();
      input.focus();
      await userEvent.keyboard('{Enter}');
      await expect(onSubmit).not.toHaveBeenCalled();
    });

  },
};

export const NearLimit: Story = {
  parameters: {
    covers: ['accessibility.item3', 'visual.item5'],
    docs: { source: { transform: composerSourceWith({ maxLength: LIMITE }) } },
  },
  render: () =>
    createComposer({
      labels: composerLabels(),
      maxLength: LIMITE,
      // Nove décimos do limite é onde o contador muda de cor e de peso.
      value: textOfLength(Math.ceil(LIMITE * 0.95)),
      onSubmit,
      class: 'nds-max-w-lg',
    }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const counter = root.querySelector<HTMLElement>('.nds-composer-counter')!;

    await step('Perto do limite, o contador marca DOIS sinais', async () => {
      // Cor sozinha não descreve estado para quem não a percebe (1.4.1). O
      // peso é o segundo sinal, e é ele que sobrevive à visão de cores.
      await expect(counter.dataset.nearLimit).toBe('true');
      await waitFor(() => expect(getComputedStyle(counter).fontWeight).toBe('600'));
    });

    await step('O contador está FORA do que é lido em voz', async () => {
      // Ele muda a cada tecla: um número reanunciado a cada letra torna o
      // campo impossível de usar por audição. O limite chega uma vez, pela
      // descrição do campo — que é texto estático.
      await expect(counter).toHaveAttribute('aria-hidden', 'true');
      await expect(root.querySelector('[aria-live]')).toBeNull();
      await expect(within(canvasElement).getByRole('textbox')).toHaveAccessibleDescription(
        new RegExp(String(LIMITE)),
      );
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: { source: { transform: composerSourceWith({ disabled: true }) } },
  },
  render: () =>
    createComposer({
      labels: composerLabels(),
      value: 'Resume a última reunião.',
      disabled: true,
      onSubmit,
      class: 'nds-max-w-lg',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    await step('Campo e envio saem do percurso do teclado', async () => {
      await expect(input).toBeDisabled();
      await expect(canvas.getByRole('button', { name: composerLabels().submit })).toBeDisabled();
    });

    await step('E nada envia, nem por tecla', async () => {
      onSubmit.mockClear();
      // O campo desabilitado não recebe foco, então a tecla vai para o
      // documento — o que se afirma é que nada saiu de qualquer forma.
      await userEvent.keyboard('{Enter}');
      await expect(onSubmit).not.toHaveBeenCalled();
    });
  },
};
