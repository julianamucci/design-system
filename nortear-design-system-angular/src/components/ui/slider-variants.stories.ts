import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { NdsSlider } from './slider';

// Tipos e composições do Slider. Sem argTypes, então o painel Controls é
// desligado — do contrário ele apareceria vazio.

const meta: Meta = {
  title: 'Components/Form/Slider/Types',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsSlider] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

/** Largura preenchida do range, em % do trilho. Mede o desenho, não o dado. */
function preenchimento(root: HTMLElement): number {
  const track = root.querySelector<HTMLElement>('[data-slot="slider-track"]')!;
  const range = root.querySelector<HTMLElement>('[data-slot="slider-range"]')!;
  return Math.round((range.getBoundingClientRect().width / track.getBoundingClientRect().width) * 100);
}

export const Types: Story = {
  // `visual.item1` é a story de valor único em 50, e vive na Playground. Aqui o
  // valor único está em 40: declarar o item aqui era cobertura deslocada — o
  // Chromatic fotografa outro estado que o documentado.
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="lg">
        <div class="nds-stack" data-spacing="sm">
          <span class="nds-text-caption">Valor único</span>
          <div ndsSlider data-testid="single" [value]="[40]" aria-label="Volume"></div>
        </div>

        <div class="nds-stack" data-spacing="sm">
          <span class="nds-text-caption">Intervalo</span>
          <div
            ndsSlider
            data-testid="range"
            [value]="[20, 80]"
            [thumbLabels]="['Preço mínimo', 'Preço máximo']"
          ></div>
        </div>

        <div class="nds-stack" data-spacing="sm">
          <span class="nds-text-caption">Passo de 5</span>
          <div ndsSlider data-testid="passo" [value]="[35]" [step]="5" aria-label="Brilho"></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Um valor, uma alça; dois valores, duas alças', async () => {
      const single = canvasElement.querySelector<HTMLElement>('[data-testid="single"]')!;
      const range = canvasElement.querySelector<HTMLElement>('[data-testid="range"]')!;
      await expect(single.querySelectorAll('[data-slot="slider-thumb"]').length).toBe(1);
      await expect(range.querySelectorAll('[data-slot="slider-thumb"]').length).toBe(2);
    });

    await step('Cada alça do intervalo tem nome próprio', async () => {
      // "Faixa de preço" repetido duas vezes não diz qual alça está em foco.
      const range = canvasElement.querySelector<HTMLElement>('[data-testid="range"]')!;
      const rotulos = [...range.querySelectorAll('[data-slot="slider-thumb"] > input')].map((i) =>
        i.getAttribute('aria-label'),
      );
      await expect(rotulos).toEqual(['Preço mínimo', 'Preço máximo']);
    });

    await step('O preenchimento desenhado corresponde ao valor', async () => {
      // Afirma o pixel, não a propriedade: é o posicionamento do primitivo que
      // está sob teste, e ele só aparece no layout.
      const single = canvasElement.querySelector<HTMLElement>('[data-testid="single"]')!;
      await expect(preenchimento(single)).toBe(40);

      // Num intervalo o preenchimento é o miolo entre as duas alças: 80 − 20.
      const range = canvasElement.querySelector<HTMLElement>('[data-testid="range"]')!;
      await expect(preenchimento(range)).toBe(60);
    });

    await step('step=5 arredonda o passo, não o valor inicial', async () => {
      const step = canvasElement.querySelector<HTMLElement>('[data-testid="passo"]')!;
      const input = step.querySelector<HTMLInputElement>('[data-slot="slider-thumb"] > input')!;
      await expect(input.step).toBe('5');
    });
  },
};

export const Vertical: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    template: `
      <div ndsSlider orientation="vertical" [value]="[60]" aria-label="Temperatura"></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('data-orientation chega ao elemento que o CSS observa', async () => {
      // O CSS vertical seleciona `.nds-slider[data-orientation="vertical"]`, e
      // `.nds-slider` fica no control — é lá que o primitivo escreve o atributo.
      const control = canvasElement.querySelector<HTMLElement>('[data-slot="slider-control"]')!;
      await expect(control.classList.contains('nds-slider')).toBe(true);
      await expect(control.getAttribute('data-orientation')).toBe('vertical');
    });

    await step('O trilho fica em pé', async () => {
      const track = canvasElement.querySelector<HTMLElement>('[data-slot="slider-track"]')!;
      const box = track.getBoundingClientRect();
      await expect(box.height).toBeGreaterThan(box.width);
    });

    await step('ArrowUp incrementa no eixo vertical', async () => {
      // As outras quatro stacks já cobriam isto; aqui a story parava no
      // atributo e na geometria. Orientação que muda o desenho e não muda o
      // eixo das setas é meia orientação: o controle fica em pé e continua
      // sendo operado como se estivesse deitado.
      const input = canvasElement.querySelector<HTMLInputElement>(
        '[data-slot="slider-thumb"] > input',
      )!;
      const antes = Number(input.value);
      input.focus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(Number(input.value)).toBe(Math.min(100, antes + 1));
    });
  },
};
