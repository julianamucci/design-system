import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { nextTick, ref } from 'vue';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Composer, ComposerVoice } from './index';
import { useComposerLabels } from './composer.fixtures';
import {
  SAMPLE_ELAPSED,
  SAMPLE_LEVEL,
  useVoiceLabels,
  voiceLabels,
} from './composer-voice.fixtures';
import { voiceInRailSource } from './composer-voice.source';
import type { VoiceState } from '@shared/primitives/chat-protocol';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O controle é AUTÔNOMO: o campo não sabe que ele existe, e o trilho é um
// espaço — nesta stack, um slot com escopo. Quem consome põe o ditado ali, do
// mesmo jeito que poria qualquer outro controle, e é isso que estas stories
// mostram.

const meta: Meta = {
  title: 'Primitives/Conversational/ComposerVoice/Compositions',
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
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onToggle = fn();

/**
 * O estado do ditado, fora do componente e fora do render.
 *
 * É a DIVERGÊNCIA DE FORMA desta stack, e ela diz a mesma coisa que a
 * referência imperativa: quem troca o estado é quem consome. Lá a story
 * substitui o nó; aqui ela move o vínculo que o render lê, que é o caminho por
 * onde o estado entra numa stack de render. O componente continua sem mexer
 * nele sozinho — é justamente o que a story prova.
 */
const railState = ref<VoiceState>('idle');

const inRail = (initial: VoiceState) => {
  railState.value = initial;
  return {
    components: { Composer, ComposerVoice },
    setup() {
      return {
        labels: useComposerLabels(),
        railLabels: useVoiceLabels(),
        state: railState,
        sampleLevel: SAMPLE_LEVEL,
        sampleElapsed: SAMPLE_ELAPSED,
        onToggle,
      };
    },
    template: `<Composer
      :labels="labels"
      class="nds-max-w-lg"
    >
      <template #railStart>
        <ComposerVoice
          :labels="railLabels"
          :state="state"
          :level="state === 'recording' ? sampleLevel : undefined"
          :elapsed="state === 'recording' ? sampleElapsed : undefined"
          @toggle="onToggle"
        />
      </template>
    </Composer>`,
  };
};

export const InRail: Story = {
  parameters: { covers: ['functional.item8', 'visual.item6'] },
  render: () => inRail('recording'),
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
      const described = ids.map((id) => root.ownerDocument.getElementById(id));
      for (const el of described) {
        await expect(el?.contains(voice)).toBe(false);
      }
    });
  },
};

export const Toggling: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item4', 'accessibility.item6'],
  },
  render: () => inRail('idle'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
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
      // provar que o segundo pedido sai do MESMO botão.
      railState.value = 'recording';
      await nextTick();

      onToggle.mockClear();
      await expect(canvas.getByRole('button', { name: voiceLabels().stop })).toBe(toggle());
      await userEvent.click(toggle());
      await expect(onToggle).toHaveBeenCalledTimes(1);
      await expect(onToggle).toHaveBeenCalledWith('stop');
    });
  },
};
