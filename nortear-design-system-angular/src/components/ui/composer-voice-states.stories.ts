import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { isVoiceBusy, type VoiceState } from '@shared/primitives/chat-protocol';
import { NdsComposerVoice } from './composer-voice';
import {
  SAMPLE_ELAPSED,
  SAMPLE_ELAPSED_DONE,
  SAMPLE_LEVEL,
  voiceLabels,
} from './composer-voice.fixtures';
import {
  voiceDisabledSource,
  voiceIdleSource,
  voiceRecordingSource,
  voiceTranscribingSource,
} from './composer-voice.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// ESTA PEÇA NÃO TEM ARQUIVO DE VARIANTES, e a ausência é decisão.
//
// Variante é FORMA — quem monta a escolhe e ela não muda durante o uso, como a
// espécie de uma etiqueta de contexto. Aqui não existe eixo assim: o ditado tem
// um desenho só, e tudo o que muda nele é SITUAÇÃO — está captando, já parou de
// captar, não está disponível. Um arquivo de variantes com estados dentro diria
// que há uma escolha de forma onde não há, e a próxima pessoa procuraria a
// diferença que não existe.

const meta: Meta = {
  title: 'Primitives/Conversational/ComposerVoice/States',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposerVoice] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: voiceIdleSource },
      description: {
        component:
          'Os três pontos do ditado, mais o ponto em que ditar não está disponível.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onToggle = fn();

type MountOptions = {
  state: VoiceState;
  level?: number;
  elapsed?: string;
  disabled?: boolean;
};

const mount = (options: MountOptions) => ({
  props: {
    labels: voiceLabels(),
    state: options.state,
    level: options.level,
    elapsed: options.elapsed,
    disabled: options.disabled ?? false,
    onToggle,
  },
  template: `
    <nds-composer-voice
      [labels]="labels"
      [state]="state"
      [level]="level"
      [elapsed]="elapsed"
      [disabled]="disabled"
      (toggle)="onToggle($event)"
    />
  `,
});

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="composer-voice"]')!;

const statusOf = (canvasElement: HTMLElement) =>
  rootOf(canvasElement).querySelector<HTMLElement>('[data-slot="composer-voice-status"]')!;

export const Idle: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item2', 'visual.item2'],
  },
  render: () => mount({ state: 'idle' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = voiceLabels();

    await step('O alternador espera, com o nome do que vai fazer', async () => {
      // Nome acessível é o NOME, e não o ícone: "Ditar" diz o que acontece ao
      // acionar; um microfone desenhado não diz nada a quem não o vê.
      const toggle = canvas.getByRole('button');
      await expect(toggle.getAttribute('aria-pressed')).toBe('false');
      await expect(toggle).toHaveAccessibleName(labels.start);
      await expect(toggle).toBeEnabled();
    });

    await step('Não há medidor: medidor sem som seria medidor mentindo', async () => {
      await expect(
        rootOf(canvasElement).querySelector('[data-slot="composer-voice-level"]'),
      ).toBeNull();
    });

    await step('E o estado chega em PALAVRA, que é o que se ouve', async () => {
      // O medidor é a pista visual de que algo está de pé, e pista que só
      // existe em desenho não chega a quem ouve (WCAG 1.1.1).
      await expect(statusOf(canvasElement)).toHaveTextContent(labels.status.idle);
    });
  },
};

export const Recording: Story = {
  parameters: {
    covers: [
      'functional.item2', 'functional.item7',
      'accessibility.item3', 'accessibility.item4',
      'visual.item3',
    ],
    docs: { source: { transform: voiceRecordingSource } },
  },
  render: () => mount({ state: 'recording', level: SAMPLE_LEVEL, elapsed: SAMPLE_ELAPSED }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = voiceLabels();

    await step('O MESMO botão fica pressionado e passa a se chamar parar', async () => {
      const toggle = canvas.getByRole('button');
      await expect(canvas.getAllByRole('button')).toHaveLength(1);
      await expect(toggle.getAttribute('aria-pressed')).toBe('true');
      await expect(toggle).toHaveAccessibleName(labels.stop);
    });

    await step('O medidor aparece, e está FORA do que é lido em voz', async () => {
      // O que muda a cada quadro, anunciado, cobre tudo o mais que houvesse
      // para ouvir. O nível entra por propriedade personalizada — valor de
      // runtime nunca vai para um estilo embutido de desenho.
      const meter = rootOf(canvasElement)
        .querySelector<HTMLElement>('[data-slot="composer-voice-level"]')!;
      await expect(meter.getAttribute('aria-hidden')).toBe('true');
      // A leitura preserva o espaço com que a propriedade foi escrita, e o que
      // a asserção quer é o número.
      await expect(meter.style.getPropertyValue('--nds-voice-level').trim()).toBe(
        String(SAMPLE_LEVEL),
      );
      await expect(meter.querySelectorAll('.nds-composer-voice-bar').length).toBeGreaterThan(0);
    });

    await step('O tempo decorrido está na TELA e fora do que se anuncia', async () => {
      // Cronômetro ao vivo não se anuncia (regra 9 da guideline 17): um relógio
      // que se reapresenta a cada segundo torna a tela impossível de ouvir. Ele
      // fica dentro do texto de estado para ser lido junto com os olhos, e sai
      // do que é falado por `aria-hidden`.
      const status = statusOf(canvasElement);
      const clock = status.querySelector<HTMLElement>('[data-slot="composer-voice-elapsed"]')!;
      await expect(clock.getAttribute('aria-hidden')).toBe('true');
      await expect(clock.textContent).toContain(SAMPLE_ELAPSED);
      await expect(status.textContent).toContain(labels.status.recording);
    });

    await step('E a palavra do estado chega junto do NOME do botão', async () => {
      // A descrição aponta o texto de estado, e o relógio escondido não vem
      // junto: quem foca o botão ouve "Gravando", e não "Gravando · 0:12".
      const toggle = canvas.getByRole('button');
      await expect(toggle).toHaveAccessibleDescription(labels.status.recording);
    });
  },
};

export const Transcribing: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item5', 'visual.item4'],
    docs: { source: { transform: voiceTranscribingSource } },
  },
  render: () => mount({ state: 'transcribing', elapsed: SAMPLE_ELAPSED_DONE }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = voiceLabels();

    await step('O alternador não responde — apertar não devolve o áudio', async () => {
      // Captar já acabou quando a transcrição começa. `recording` e
      // `transcribing` são estados separados exatamente por isso: parecem
      // iguais na tela e são opostos.
      const toggle = canvas.getByRole('button');
      await expect(toggle).toBeDisabled();
      await expect(toggle.getAttribute('aria-pressed')).toBe('true');
      await expect(isVoiceBusy('transcribing')).toBe(true);
    });

    await step('Acioná-lo não avisa ninguém', async () => {
      onToggle.mockClear();
      await userEvent.click(canvas.getByRole('button'), { pointerEventsCheck: 0 });
      await expect(onToggle).not.toHaveBeenCalled();
    });

    await step('E o MOTIVO está escrito ao lado, e não só no cinza', async () => {
      // Botão apagado sem explicação é a pergunta "por que não posso?" sem
      // resposta na tela — e quem não percebe o cinza não recebe nem a pista.
      await expect(statusOf(canvasElement)).toHaveTextContent(labels.status.transcribing);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: voiceDisabledSource } },
  },
  render: () => mount({ state: 'idle', disabled: true }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Ditar não está disponível, e o texto continua dizendo onde está', async () => {
      await expect(canvas.getByRole('button')).toBeDisabled();
      await expect(statusOf(canvasElement)).toHaveTextContent(voiceLabels().status.idle);
    });
  },
};
