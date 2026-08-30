import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NdsComposer } from './composer';
import { composerLabels, textOfLength } from './composer.fixtures';
import { composerSourceWith } from './composer.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que a docs page lista. O estado vazio é o Playground, e não se
// repete aqui.

const meta: Meta = {
  title: 'Primitives/Conversational/Composer/States',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposer] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
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

const LIMIT = 120;

/**
 * O estado de geração, num signal de MÓDULO.
 *
 * Nesta stack `running` é uma entrada, e não um método na raiz: quem liga e
 * desliga é quem consome. O signal fora do render é o que dá à play o mesmo
 * alcance que o `setRunning` dá no Vanilla — sem pendurar na tela um botão de
 * controle que entraria na foto do Chromatic.
 */
const generating = signal(true);

export const Filled: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: composerSourceWith({ value: 'Resume a última reunião.' }) } },
  },
  render: () => ({
    props: { labels: composerLabels(), onSubmit },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        value="Resume a última reunião."
        (submitted)="onSubmit($event)"
      />
    `,
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
    docs: {
      source: {
        transform: composerSourceWith({ running: true, value: 'Resume a última reunião.' }),
      },
    },
  },
  render: () => ({
    props: { labels: composerLabels(), generating, onSubmit, onStop },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        value="Resume a última reunião."
        [running]="generating()"
        (submitted)="onSubmit($event)"
        (stopped)="onStop()"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    const labels = composerLabels();

    await step('O botão troca de NOME, e não só de forma', async () => {
      // Precondição própria sem controle na tela: a geração fica ligada o tempo
      // todo, então a reexecução parte do mesmo estado. O sinal é reafirmado
      // porque ele é de escopo de módulo e sobrevive entre stories.
      generating.set(true);
      // Trocar só o ícone deixaria quem usa leitor de tela sem saber o que o
      // botão faz agora — e agora ele faz o oposto do que fazia.
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: labels.stop })).toBeInTheDocument(),
      );
      await expect(canvas.queryByRole('button', { name: labels.submit })).toBeNull();
    });

    await step('Ele interrompe, e não envia', async () => {
      onSubmit.mockClear();
      onStop.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: labels.stop }));
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
    docs: { source: { transform: composerSourceWith({ maxLength: LIMIT }) } },
  },
  render: () => ({
    props: {
      labels: composerLabels(),
      limit: LIMIT,
      // Nove décimos do limite é onde o contador muda de cor e de peso.
      draft: textOfLength(Math.ceil(LIMIT * 0.95)),
      onSubmit,
    },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        [maxLength]="limit"
        [value]="draft"
        (submitted)="onSubmit($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const counter = root.querySelector<HTMLElement>('.nds-composer-counter')!;

    await step('Perto do limite, o contador marca DOIS sinais', async () => {
      // Cor sozinha não descreve estado para quem não a percebe (1.4.1). O
      // peso é o segundo sinal, e é ele que sobrevive à visão de cores.
      await expect(counter.dataset.nearLimit).toBe('true');
      // Leitura PURA dentro do `waitFor`: condição que mexe no DOM reagenda a
      // si mesma por observador de mutação e pendura o arquivo inteiro.
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
    docs: { source: { transform: composerSourceWith({ disabled: true }) } },
  },
  render: () => ({
    props: { labels: composerLabels(), onSubmit },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        value="Resume a última reunião."
        [disabled]="true"
        (submitted)="onSubmit($event)"
      />
    `,
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
