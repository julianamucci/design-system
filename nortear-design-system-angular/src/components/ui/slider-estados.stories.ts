import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, fn } from 'storybook/test';
import { NdsSlider } from './slider';

const meta: Meta = {
  title: 'UI/Slider/Estados',
  decorators: [moduleMetadata({ imports: [NdsSlider] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Disabled: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    template: `<div ndsSlider [value]="[45]" [disabled]="true" aria-label="Volume"></div>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('data-disabled fica onde o CSS o procura', async () => {
      // A regra é `.nds-slider[data-disabled]`, e `.nds-slider` está no control.
      const control = canvasElement.querySelector<HTMLElement>('[data-slot="slider-control"]')!;
      await expect(control.hasAttribute('data-disabled')).toBe(true);
    });

    await step('O teclado não move o valor', async () => {
      const input = canvasElement.querySelector<HTMLInputElement>(
        '[data-slot="slider-thumb"] > input',
      )!;
      const antes = input.value;
      input.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(input.value).toBe(antes);
    });
  },
};

export const Teclado: Story = {
  parameters: { covers: ['functional.item3', 'functional.item4'] },
  render: () => ({
    template: `<div ndsSlider [value]="[50]" [min]="0" [max]="100" aria-label="Volume"></div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const input = () =>
      canvasElement.querySelector<HTMLInputElement>('[data-slot="slider-thumb"] > input')!;

    await step('Home vai para o mínimo, End para o máximo', async () => {
      input().focus();
      await userEvent.keyboard('{Home}');
      await expect(Number(input().value)).toBe(0);
      await userEvent.keyboard('{End}');
      await expect(Number(input().value)).toBe(100);
    });

    await step('As setas andam de um passo', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await expect(Number(input().value)).toBe(99);
      await userEvent.keyboard('{ArrowRight}');
      await expect(Number(input().value)).toBe(100);
    });
  },
};

export const FocoVisivel: Story = {
  parameters: { covers: ['accessibility.item3'] },
  render: () => ({
    template: `<div ndsSlider [value]="[50]" aria-label="Volume"></div>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O foco por teclado pousa no input da alça', async () => {
      // O anel de foco sai de `.nds-slider-thumb:has(input:focus-visible)`: quem
      // recebe o foco é o input, quem é pintado é a alça.
      await userEvent.tab();
      const input = canvasElement.querySelector<HTMLInputElement>(
        '[data-slot="slider-thumb"] > input',
      )!;
      await expect(document.activeElement).toBe(input);
    });

    await step('O input está invisível, mas cobre a alça inteira', async () => {
      // Invisível e não `display:none`: escondê-lo de verdade tiraria o
      // controle da ordem de tabulação e do leitor de tela.
      const alca = canvasElement.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!;
      const input = alca.querySelector<HTMLInputElement>('input')!;
      await expect(getComputedStyle(input).opacity).toBe('0');
      // `clientWidth` e não `getBoundingClientRect`: o input mede 100% do bloco
      // que o contém, que é a caixa de padding da alça — dois pixels a menos
      // que a caixa de borda, porque a alça tem borda de 1px.
      await expect(Math.round(input.getBoundingClientRect().width)).toBe(alca.clientWidth);
    });
  },
};

export const Drag: Story = {
  parameters: { covers: ['functional.item1', 'functional.item2'] },
  render: () => ({
    props: { onValueChange: fn() },
    template: `
      <div
        ndsSlider
        [value]="[50]"
        aria-label="Volume"
        (valueChange)="onValueChange($event)"
      ></div>
    `,
  }),
  // `onValueChange` precisa de entrada em argTypes para o renderer Angular
  // repassá-la ao template — ver armadilha 5 no CLAUDE.md deste stack.
  argTypes: { onValueChange: { control: false, table: { disable: true } } },
  play: async ({ canvasElement, step }) => {
    await step('Arrastar sobre o trilho move o valor e avisa quem escuta', async () => {
      const control = canvasElement.querySelector<HTMLElement>('[data-slot="slider-control"]')!;
      const trilho = control.querySelector<HTMLElement>('[data-slot="slider-track"]')!;
      const caixa = trilho.getBoundingClientRect();
      const input = canvasElement.querySelector<HTMLInputElement>(
        '[data-slot="slider-thumb"] > input',
      )!;

      // userEvent.pointer, e não PointerEvent construído à mão: o primitivo
      // chama `setPointerCapture` no pointerdown, e captura só existe para um
      // ponteiro que o navegador conhece. Evento sintético é descartado ali,
      // em silêncio, e o valor fica parado.
      const y = caixa.top + caixa.height / 2;
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: control, coords: { clientX: caixa.left + caixa.width * 0.5, clientY: y } },
        { target: control, coords: { clientX: caixa.left + caixa.width * 0.8, clientY: y } },
        { keys: '[/MouseLeft]' },
      ]);

      await expect(Number(input.value)).toBeGreaterThan(50);
    });
  },
};
