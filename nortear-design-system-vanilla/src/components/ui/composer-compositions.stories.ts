import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createComposer } from './composer';
import { createButton } from './button';
import { attachLabel, composerLabels } from './composer.fixtures';
import { composerSourceWith } from './composer.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O trilho é um ESPAÇO. O composer reserva o lugar e não sabe o que se põe
// nele — a mesma divisão de `approval` no ChatThread.

const meta: Meta = {
  title: 'Components/Conversational/Composer/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: composerSourceWith({ rail: true }) },
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
  render: () =>
    createComposer({
      labels: composerLabels(),
      value: 'Resume a última reunião.',
      railStart: [
        createButton({
          label: attachLabel(),
          variant: 'ghost',
          size: 'sm',
          onClick: onAttach,
        }),
      ],
      class: 'nds-max-w-lg',
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
      const anexar = canvas.getByRole('button', { name: attachLabel() });
      anexar.focus();
      await expect(anexar).toHaveFocus();
      await expect(getComputedStyle(anexar).opacity).toBe('1');
    });

    await step('E aciona', async () => {
      onAttach.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: attachLabel() }));
      await expect(onAttach).toHaveBeenCalledTimes(1);
    });

    await step('O alvo de toque tem pelo menos 24 pixels', async () => {
      // WCAG 2.5.8, e é a regra em que esta família mais escorrega — o trilho
      // é feito de botões pequenos.
      const anexar = canvas.getByRole('button', { name: attachLabel() });
      const caixa = anexar.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThanOrEqual(24);
      await expect(caixa.height).toBeGreaterThanOrEqual(24);
    });
  },
};
