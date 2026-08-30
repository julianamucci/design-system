import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Composer } from './index';
import ComposerRunningStory from './ComposerRunningStory.svelte';
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
  title: 'UI/Composer/States',
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

/**
 * A story que muda de estado monta OUTRO componente — a marcação de um controle
 * na tela não cabe no `render` desta stack. O tipo acompanha o componente
 * montado; herdar o do `meta` cobraria as props do composer de um andaime que
 * não as tem.
 */
type RunningStory = StoryObj<typeof ComposerRunningStory>;

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

export const Running: RunningStory = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item4', 'visual.item4'],
    docs: { source: { transform: composerRunningSource } },
  },
  /**
   * Aqui o estado de geração é uma PROP, e não um método da raiz — não há o que
   * a play chamar. Quem o liga é um controle na tela do andaime, que é o caminho
   * real: quem sabe se a resposta está vindo é quem consome.
   */
  render: () => ({
    Component: ComposerRunningStory,
    props: { value: SAMPLE, onSubmit, onStop },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const toggle = canvasElement.querySelector<HTMLElement>(
      '[data-slot="composer-running-toggle"]',
    )!;
    const input = canvas.getByRole('textbox');

    /** Precondição própria: a play reexecuta no mesmo DOM. Leitura pura, e clique. */
    const setRunning = async (on: boolean) => {
      if ((root.dataset.state === 'running') !== on) await userEvent.click(toggle);
      await waitFor(() => expect(root.dataset.state).toBe(on ? 'running' : 'idle'));
    };

    await step('O botão troca de NOME, e não só de forma', async () => {
      await setRunning(true);
      // Trocar só o ícone deixaria quem usa leitor de tela sem saber o que o
      // botão faz agora — e agora ele faz o oposto do que fazia.
      const labels = composerLabels();
      await expect(canvas.getByRole('button', { name: labels.stop })).toBeInTheDocument();
      await expect(canvas.queryByRole('button', { name: labels.submit })).toBeNull();
    });

    await step('Ele interrompe, e não envia', async () => {
      await setRunning(true);
      onSubmit.mockClear();
      onStop.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: composerLabels().stop }));
      await expect(onStop).toHaveBeenCalledTimes(1);
      await expect(onSubmit).not.toHaveBeenCalled();
    });

    await step('E a tecla de envio também não envia enquanto gera', async () => {
      // Um segundo envio no meio do primeiro é o defeito que este estado
      // existe para impedir.
      await setRunning(true);
      onSubmit.mockClear();
      input.focus();
      await userEvent.keyboard('{Enter}');
      await expect(onSubmit).not.toHaveBeenCalled();
    });

    await step('Desligado o estado, o botão volta ao envio', async () => {
      await setRunning(false);
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: composerLabels().submit })).toBeInTheDocument(),
      );
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
