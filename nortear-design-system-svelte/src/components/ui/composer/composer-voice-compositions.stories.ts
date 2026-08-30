import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { tick } from 'svelte';
import { readable, writable } from 'svelte/store';
import ComposerVoiceRailStory from './ComposerVoiceRailStory.svelte';
import { voiceLabels } from './composer-voice.fixtures';
import { voiceInRailSource } from './composer-voice.source';
import type { VoiceState } from '@shared/primitives/chat-protocol';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O controle é AUTÔNOMO: o campo não sabe que ele existe, e o trilho é um
// espaço. Quem consome põe o ditado ali, do mesmo jeito que poria qualquer
// outro controle — e é isso que estas stories mostram.

const meta: Meta<typeof ComposerVoiceRailStory> = {
  title: 'Primitives/Conversational/ComposerVoice/Compositions',
  component: ComposerVoiceRailStory,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: voiceInRailSource },
      description: {
        component:
          'O lugar do controle no trilho, e o que ele deliberadamente NÃO faz quando alguém o aciona.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComposerVoiceRailStory>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onToggle = fn();

/** O trilho parado, captando. Nada aqui troca de estado no meio. */
const RAIL_STATE = readable<VoiceState>('recording');

/**
 * O estado que a `play` troca, no papel de quem consome.
 *
 * Nesta stack os props chegam UMA vez, no `render`; a story que precisa mexer
 * no estado durante a interação mexe na store. É a forma daqui para o que a
 * referência faz trocando o elemento.
 */
const TOGGLING_STATE = writable<VoiceState>('idle');

export const InRail: Story = {
  parameters: { covers: ['functional.item8', 'visual.item6'] },
  render: () => ({
    Component: ComposerVoiceRailStory,
    props: { voiceState: RAIL_STATE, onToggle },
  }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const voice = root.querySelector<HTMLElement>('[data-slot="composer-voice"]')!;

    await step('O controle vive no INÍCIO do trilho', async () => {
      // O início do trilho é o que se acrescenta à mensagem; o fim é o que se
      // faz com ela. Ditar é acrescentar.
      const railStart = root.querySelector<HTMLElement>('.nds-composer-rail-start')!;
      await expect(railStart.contains(voice)).toBe(true);
    });

    await step('E ele está no percurso do teclado, antes do envio', async () => {
      // Nada no trilho aparece só no `:hover`: estes são os controles do campo
      // e existem o tempo todo (decisão 4 da folha do composer).
      const toggle = voice.querySelector<HTMLElement>('[data-slot="composer-voice-toggle"]')!;
      const submit = root.querySelector<HTMLElement>('[data-slot="composer-submit"]')!;
      toggle.focus();
      await expect(root.ownerDocument.activeElement).toBe(toggle);
      await expect(
        toggle.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('O campo NÃO ganha o ditado na descrição dele', async () => {
      // A citação descreve o campo porque saber a quem se responde muda o que
      // se escreve. O ditado é um controle, e um controle na descrição do campo
      // vira ruído que se ouve a cada foco.
      const input = root.querySelector<HTMLElement>('[data-slot="composer-input"]')!;
      const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      const describers = ids.map((id) => root.ownerDocument.getElementById(id));
      for (const element of describers) {
        await expect(element?.contains(voice)).toBe(false);
      }
    });
  },
};

export const Toggling: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item4', 'accessibility.item6'],
  },
  render: () => ({
    Component: ComposerVoiceRailStory,
    props: { voiceState: TOGGLING_STATE, onToggle },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const toggle = () =>
      root.querySelector<HTMLElement>('[data-slot="composer-voice-toggle"]')!;

    // A store é de escopo de módulo e sobrevive à story anterior; a play começa
    // pondo o ditado onde ela precisa dele.
    TOGGLING_STATE.set('idle');
    await tick();

    await step('O alvo de toque tem pelo menos vinte e quatro pixels', async () => {
      // WCAG 2.5.8, e é onde esta família mais escorrega: o trilho é feito de
      // botões de ícone, que não têm texto para crescer.
      const box = toggle().getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    });

    await step('Em repouso, acioná-lo pede para COMEÇAR', async () => {
      // O pedido é INTENÇÃO, e não o estado seguinte: entre pedir e captar
      // existe uma permissão que só quem consome resolve.
      onToggle.mockClear();
      await userEvent.click(toggle());
      await expect(onToggle).toHaveBeenCalledTimes(1);
      await expect(onToggle).toHaveBeenCalledWith('start');
    });

    await step('E o controle NÃO muda sozinho — captar é de quem consome', async () => {
      const voice = root.querySelector<HTMLElement>('[data-slot="composer-voice"]')!;
      await expect(voice.dataset.state).toBe('idle');
      await expect(toggle().getAttribute('aria-pressed')).toBe('false');
    });

    await step('Captando, o mesmo botão pede para PARAR', async () => {
      // Quem troca o estado é quem consome; a story faz o papel dele para
      // provar que o segundo pedido sai do MESMO botão.
      const before = toggle();
      TOGGLING_STATE.set('recording');
      await tick();

      onToggle.mockClear();
      await expect(canvas.getByRole('button', { name: voiceLabels().stop })).toBe(before);
      await userEvent.click(toggle());
      await expect(onToggle).toHaveBeenCalledTimes(1);
      await expect(onToggle).toHaveBeenCalledWith('stop');
    });
  },
};
