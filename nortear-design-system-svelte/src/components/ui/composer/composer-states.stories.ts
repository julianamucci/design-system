import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Composer } from './index';
import { composerLabels, textOfLength } from './composer.fixtures';
import {
  composerBaseSource,
  composerDisabledSource,
  composerFilledSource,
  composerNearLimitSource,
  composerRunningSource,
} from './composer.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que a docs page lista. O estado vazio é o Playground, e não se
// repete aqui.

const meta: Meta<typeof Composer> = {
  title: 'Primitives/Conversational/Composer/States',
  component: Composer,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: composerBaseSource },
      description: {
        component: 'Cada story fixa um estado e verifica o que ele muda no campo.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Composer>;

/** Espiões de escopo de módulo: dentro do render, a play não os alcança. */
const onSubmit = fn();
const onStop = fn();

const LIMIT = 120;
const SAMPLE = 'Resume a última reunião.';

export const Filled: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: composerFilledSource } },
  },
  render: () => ({
    Component: Composer,
    props: { labels: composerLabels(), value: SAMPLE, class: 'nds-max-w-lg', onSubmit },
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
    docs: { source: { transform: composerRunningSource } },
  },
  /**
   * A geração fica LIGADA o tempo todo, e é o que faz esta story fotografar a
   * mesma tela que as outras quatro stacks.
   *
   * Aqui o estado é uma PROP, e não um método da raiz — não há o que a play
   * chamar. A saída fácil seria um controle na tela para religar entre
   * reexecuções, e foi o que três stacks fizeram sozinhas: o resultado é o
   * Chromatic fotografando um botão a mais em três das cinco. Sem desligar,
   * não há o que religar. Que o botão volta ao envio quem afirma é a story
   * `Filled`, que é o estado sem geração.
   */
  render: () => ({
    Component: Composer,
    props: {
      labels: composerLabels(),
      value: SAMPLE,
      running: true,
      class: 'nds-max-w-lg',
      onSubmit,
      onStop,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const input = canvas.getByRole('textbox');

    await step('O botão troca de NOME, e não só de forma', async () => {
      // Precondição própria sem controle na tela: a geração fica ligada o
      // tempo todo, então a reexecução parte do mesmo estado.
      await expect(root.dataset.state).toBe('running');
      // Trocar só o ícone deixaria quem usa leitor de tela sem saber o que o
      // botão faz agora — e agora ele faz o oposto do que fazia.
      const labels = composerLabels();
      await expect(canvas.getByRole('button', { name: labels.stop })).toBeInTheDocument();
      await expect(canvas.queryByRole('button', { name: labels.submit })).toBeNull();
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
    docs: { source: { transform: composerNearLimitSource } },
  },
  render: () => ({
    Component: Composer,
    props: {
      labels: composerLabels(),
      maxLength: LIMIT,
      // Nove décimos do limite é onde o contador muda de cor e de peso.
      value: textOfLength(Math.ceil(LIMIT * 0.95)),
      class: 'nds-max-w-lg',
      onSubmit,
    },
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
        new RegExp(String(LIMIT)),
      );
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: { source: { transform: composerDisabledSource } },
  },
  render: () => ({
    Component: Composer,
    props: {
      labels: composerLabels(),
      value: SAMPLE,
      disabled: true,
      class: 'nds-max-w-lg',
      onSubmit,
    },
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
