import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, fn, userEvent, expect } from 'storybook/test';
import { Loader2 } from 'lucide-vue-next';
import { Button } from './index';
import { ringFailures } from '@shared/testing/button-probe';
import {
  buttonLoadingSource,
  buttonDisabledSource,
  buttonFocusVisibleSource,
  buttonInvalidoSource,
} from './button.source';

const meta: Meta<any> = {
  title: 'Primitives/Form/Button/States',
  component: Button,
  tags: ['form'],
  args: {
    onClick: fn(),
  } as never,
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: buttonDisabledSource } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Disabled: Story = {
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: '<Button v-bind="args" disabled @click="args.onClick">Salvar</Button>',
  }),
  parameters: {
    covers: ['functional.item2', 'visual.item4'], docs: { description: { story: 'Estado desabilitado. Previne cliques e reduz opacidade para 50%.' } } },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão possui atributo disabled', async () => {
      await expect(button).toBeDisabled();
    });

    await step('Tab pula o botão desabilitado', async () => {
      // accessibility.keyboard.disabled afirma isso e nada verificava.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(button).not.toHaveFocus();
    });

    await step('Clique não dispara onClick quando disabled', async () => {
      await userEvent.click(button, { pointerEventsCheck: 0 });
      await expect((args as { onClick: ReturnType<typeof fn> }).onClick).not.toHaveBeenCalled();
    });
  },
};

export const Loading: Story = {
  render: () => ({
    components: { Button, Loader2 },
    template: `
      <Button disabled aria-busy="true">
        <Loader2 aria-hidden="true" class="nds-button-icon-svg nds-spin" />
        Salvando…
      </Button>
    `,
  }),
  // O ícone que gira e o rótulo trocado são a lição: a do meta mostraria só o
  // botão desabilitado, sem nada do progresso.
  parameters: {
    docs: {
      source: { transform: buttonLoadingSource },
      description: { story: 'Estado de carregamento. Use disabled + aria-busy e substitua o label por estado progressivo.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão tem aria-busy durante loading', async () => {
      await expect(button).toHaveAttribute('aria-busy', 'true');
    });

    await step('Botão está desabilitado durante loading', async () => {
      await expect(button).toBeDisabled();
    });
  },
};

export const FocusVisible: Story = {
  render: () => ({
    components: { Button },
    template: '<Button>Foco visível</Button>',
  }),
  parameters: {
    covers: ['accessibility.item3'],
    // A ausência de prop É o assunto: o anel vem do componente, e a do meta
    // mostraria um `disabled` que aqui não existe.
    docs: {
      source: { transform: buttonFocusVisibleSource },
      description: { story: 'Estado de foco por teclado. Navegue com Tab: o anel só aparece em :focus-visible, não no clique.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button') as HTMLElement;

    await step('Tab leva o foco ao botão', async () => {
      // .focus() programático não é navegação por teclado: passaria até com
      // tabindex="-1". E é o Tab que caracteriza a modalidade de entrada,
      // sem a qual o :focus-visible desta story não existe.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(button).toHaveFocus();
    });

    await step('O anel de foco por teclado está aplicado', async () => {
      // accessibility.item3 — o item promete anel VISÍVEL ao navegar por
      // teclado; toHaveFocus sozinho não distingue foco de mouse.
      await expect(button.matches(':focus-visible')).toBe(true);
      // E o anel tem de ser PERCEPTÍVEL, não só existir. Medido antes desta
      // rodada, a banda colorida compunha 1.87:1 a 2.42:1 contra a superfície
      // do app nos seis pares tema×modo — a meia opacidade de `--ring` comia
      // o indicador inteiro. WCAG 1.4.11 (Non-text Contrast, AA) pede 3:1.
      // `matches(:focus-visible)` sozinho passava com o anel invisível.
      await expect(ringFailures(canvasElement, 3)).toEqual([]);
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    components: { Button },
    template: '<Button variant="outline" aria-invalid="true">Formulário inválido</Button>',
  }),
  // O atributo de validação e a variante com borda não estão nos args.
  parameters: {
    docs: {
      source: { transform: buttonInvalidoSource },
      description: { story: 'Estado inválido. Use aria-invalid="true" para sinalizar problemas de validação.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão tem aria-invalid=true', async () => {
      await expect(button).toHaveAttribute('aria-invalid', 'true');
    });
  },
};
