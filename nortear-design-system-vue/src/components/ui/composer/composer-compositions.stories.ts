import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Composer } from './index';
import { Button } from '@/components/ui/button';
import { attachLabel, useAttachLabel, useComposerLabels } from './composer.fixtures';
import { composerRailSource } from './composer.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O trilho é um ESPAÇO. O composer reserva o lugar e não sabe o que se põe
// nele — a mesma divisão de `approval` no ChatThread. Nesta stack esse espaço é
// um slot com escopo, e não uma lista de elementos: é a forma que a stack tem
// para marcação que quem consome fornece.

const meta: Meta = {
  title: 'UI/Composer/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: composerRailSource },
      description: {
        component: 'O composer com os controles que quem consome põe no trilho.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onAttach = fn();

export const WithRailControls: Story = {
  parameters: {
    covers: ['functional.item10', 'accessibility.item5', 'visual.item7'],
  },
  render: () => ({
    components: { Composer, Button },
    setup() {
      return {
        labels: useComposerLabels(),
        attach: useAttachLabel(),
        sample: 'Resume a última reunião.',
        onAttach,
      };
    },
    template: `<Composer :labels="labels" :value="sample" class="nds-max-w-lg">
      <template #railStart>
        <Button
          variant="ghost"
          size="sm"
          @click="onAttach"
        >{{ attach }}</Button>
      </template>
    </Composer>`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;

    await step('O controle de quem consome aparece no INÍCIO do trilho', async () => {
      // O início é o que se acrescenta à mensagem; o fim é o que se faz com
      // ela. Trocar os dois faria o botão de anexar disputar espaço com o de
      // enviar, que é o alvo mais usado da tela.
      const start = root.querySelector<HTMLElement>('.nds-composer-rail-start')!;
      await expect(within(start).getByRole('button', { name: attachLabel() })).toBeInTheDocument();
    });

    await step('Ele está no percurso do teclado, sempre', async () => {
      // Nada no trilho aparece só sob o ponteiro: são os controles do campo, e
      // existem o tempo todo — diferente das ações da mensagem, que são de
      // leitura e somem por opacidade.
      const attachButton = canvas.getByRole('button', { name: attachLabel() });
      attachButton.focus();
      await expect(attachButton).toHaveFocus();
      await expect(getComputedStyle(attachButton).opacity).toBe('1');
    });

    await step('E aciona', async () => {
      onAttach.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: attachLabel() }));
      await expect(onAttach).toHaveBeenCalledTimes(1);
    });

    await step('O alvo de toque tem pelo menos 24 pixels', async () => {
      // WCAG 2.5.8, e é a regra em que esta família mais escorrega — o trilho
      // é feito de botões pequenos.
      const attachButton = canvas.getByRole('button', { name: attachLabel() });
      const box = attachButton.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    });
  },
};
