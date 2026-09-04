import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { Component, computed, signal } from '@angular/core';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import type { VoiceState } from '@shared/primitives/chat-protocol';
import { NdsComposer } from './composer';
import { NdsComposerVoice, type ComposerVoiceIntent } from './composer-voice';
import {
  SAMPLE_ELAPSED,
  SAMPLE_LEVEL,
  composerLabels,
  voiceLabels,
} from './composer-voice.fixtures';
import { voiceInRailSource } from './composer-voice.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O controle é AUTÔNOMO: o campo não sabe que ele existe, e o trilho é um
// espaço. Quem consome põe o ditado ali, do mesmo jeito que poria qualquer outro
// controle — e é isso que estas stories mostram.

const meta: Meta = {
  title: 'Components/Conversational/ComposerVoice/Compositions',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposer, NdsComposerVoice] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
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
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onToggle = fn();

/**
 * O ponto do ditado, fora do componente.
 *
 * Sinal de escopo de módulo porque é ele que faz o papel de quem consome: o
 * controle NÃO muda sozinho, e a story precisa mudá-lo de fora para provar que o
 * segundo pedido sai do MESMO botão. Cada `render` o reafirma, porque ele
 * sobrevive entre stories.
 */
const railState = signal<VoiceState>('idle');

// ── O andaime do trilho ───────────────────────────────────────────────────────
//
// É um COMPONENTE porque `railStart` é `TemplateRef` nesta stack: um
// `<ng-template>` só existe depois que a vista foi criada, e o objeto de `props`
// do renderer é montado antes.

@Component({
  selector: 'nds-composer-voice-rail-demo',
  standalone: true,
  imports: [NdsComposer, NdsComposerVoice],
  template: `
    <ng-template #voiceTpl>
      <nds-composer-voice
        [labels]="voiceText"
        [state]="state()"
        [level]="level()"
        [elapsed]="elapsed()"
        (toggle)="toggled($event)"
      />
    </ng-template>

    <nds-composer class="nds-max-w-lg" [labels]="labels" [railStart]="voiceTpl" />
  `,
})
class RailDemo {
  readonly labels = composerLabels();
  readonly voiceText = voiceLabels();
  readonly state = railState;

  /** Nível e tempo só existem enquanto capta — fora daí seriam dado sem uso. */
  readonly level = computed(() =>
    railState() === 'recording' ? SAMPLE_LEVEL : undefined,
  );
  readonly elapsed = computed(() =>
    railState() === 'recording' ? SAMPLE_ELAPSED : undefined,
  );

  toggled(intent: ComposerVoiceIntent): void {
    onToggle(intent);
  }
}

const mountRail = (state: VoiceState) => {
  railState.set(state);
  return {
    props: {},
    template: '<nds-composer-voice-rail-demo />',
  };
};

export const InRail: Story = {
  parameters: { covers: ['functional.item8', 'visual.item6'] },
  decorators: [moduleMetadata({ imports: [RailDemo] })],
  render: () => mountRail('recording'),
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
      for (const el of describers) {
        await expect(el?.contains(voice)).toBe(false);
      }
    });
  },
};

export const Toggling: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item4', 'accessibility.item6'],
  },
  decorators: [moduleMetadata({ imports: [RailDemo] })],
  render: () => mountRail('idle'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const labels = voiceLabels();
    const toggle = () =>
      root.querySelector<HTMLElement>('[data-slot="composer-voice-toggle"]')!;

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
      // provar que o segundo pedido sai do MESMO botão. Dentro do `waitFor` só
      // há leitura pura: sonda que mexe no DOM reagenda a si mesma e pendura a
      // aba sem nunca reprovar.
      railState.set('recording');
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: labels.stop })).toBe(toggle()),
      );

      onToggle.mockClear();
      await userEvent.click(toggle());
      await expect(onToggle).toHaveBeenCalledTimes(1);
      await expect(onToggle).toHaveBeenCalledWith('stop');
    });
  },
};
