import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, within, expect } from 'storybook/test';
import { createButton, createButtonIcon } from './button';

type EstadosArgs = { onClick: (e: MouseEvent) => void };

const meta: Meta<EstadosArgs> = {
  tags: ['form'],
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
  },
  // Spy no meta, como nas outras três stacks. Antes o `fn()` nascia dentro do
  // `render` e era pendurado no próprio nó (`btn.__handler`) para o `play`
  // alcançar — funcionava, mas prendia o spy ao DOM e não se repetia em
  // nenhuma outra stack.
  args: {
    onClick: fn(),
  },
  title: 'UI/Button/Estados',
};

export default meta;
type Story = StoryObj<EstadosArgs>;

export const Disabled: Story = {
  render: (args) =>
    createButton({ variant: 'default', label: 'Salvar', disabled: true, onClick: args.onClick }),
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: { description: { story: 'Estado desabilitado. Previne cliques e reduz opacidade para 50%.' } },
  },
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
      await expect(args.onClick).not.toHaveBeenCalled();
    });
  },
};

export const Loading: Story = {
  render: () => {
    const btn = createButton({ variant: 'default', disabled: true, ariaBusy: true });
    btn.appendChild(createButtonIcon('loader', { spin: true }));
    const label = document.createElement('span');
    label.textContent = 'Salvando…';
    btn.appendChild(label);
    return btn;
  },
  parameters: { docs: { description: { story: 'Estado de carregamento. Use disabled + aria-busy e substitua o label por estado progressivo.' } } },
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
  render: () => createButton({ variant: 'default', label: 'Foco visível' }),
  parameters: {
    covers: ['accessibility.item3'], docs: { description: { story: 'Estado de foco por teclado. Navegue com Tab: o anel só aparece em :focus-visible, não no clique.' } } },
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
    });
  },
};

export const Invalid: Story = {
  render: () => createButton({ variant: 'outline', label: 'Formulário inválido', ariaInvalid: true }),
  parameters: { docs: { description: { story: 'Estado inválido. Use aria-invalid="true" para sinalizar problemas de validação.' } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão tem aria-invalid=true', async () => {
      await expect(button).toHaveAttribute('aria-invalid', 'true');
    });
  },
};
