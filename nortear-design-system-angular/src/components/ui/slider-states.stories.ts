import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, fn } from 'storybook/test';
import { NdsSlider } from './slider';
import { focusAssentadoRing, restRing } from '@shared/testing/slider-probe';

const meta: Meta = {
  title: 'UI/Slider/States',
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

export const Keyboard: Story = {
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

export const FocusVisible: Story = {
  parameters: { covers: ['accessibility.item3'] },
  render: () => ({
    template: `<div ndsSlider [value]="[50]" aria-label="Volume"></div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const handleOf = () => canvasElement.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!;
    const rest = await restRing(handleOf());

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
      const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!;
      const input = thumb.querySelector<HTMLInputElement>('input')!;
      await expect(getComputedStyle(input).opacity).toBe('0');
      // `clientWidth` e não `getBoundingClientRect` da alça: o input mede 100%
      // do bloco que o contém, que é a caixa de padding da alça. Hoje as duas
      // coincidem — a borda saiu da alça e foi para o `::before`, que é o disco
      // desenhado; a caixa da alça é o alvo de toque de 24px e não tem borda.
      // `clientWidth` continua sendo a leitura certa porque é a que acompanha
      // se a borda voltar.
      await expect(Math.round(input.getBoundingClientRect().width)).toBe(thumb.clientWidth);
    });

    await step('A alça focada fica visivelmente diferente da alça em repouso', async () => {
      // O item de contrato fala do ANEL, não do foco. Afirmar só onde o foco
      // pousou deixava passar a alça focada idêntica à alça parada — 2.4.7
      // reprovado com o teste verde, que foi o que aconteceu em duas stacks.
      // A alça transiciona o anel em ~120ms: lido no instante seguinte ao Tab,
      // `getComputedStyle` devolve o valor de PARTIDA, igual ao repouso, e a
      // asserção reprovava um anel que existe. Espera assentar antes de ler.
      const focada = await focusAssentadoRing(handleOf(), rest);
      await expect(focada.sombra !== rest.sombra || focada.border !== rest.border).toBe(true);
      await expect(focada.sombra).not.toBe('none');
    });
  },
};

export const Drag: Story = {
  parameters: { covers: ['functional.item1', 'functional.item2'] },
  render: (args) => ({
    props: { ...args },
    template: `
      <div
        ndsSlider
        [value]="[50]"
        aria-label="Volume"
        (valueChange)="onValueChange($event)"
        (onValueCommitted)="onValueCommitted($event)"
      ></div>
    `,
  }),
  // Função em `args` precisa de entrada em argTypes para o renderer Angular
  // repassá-la ao template — ver armadilha 5 no CLAUDE.md deste stack.
  argTypes: {
    onValueChange: { control: false, table: { disable: true } },
    onValueCommitted: { control: false, table: { disable: true } },
  },
  args: { onValueChange: fn(), onValueCommitted: fn() },
  play: async ({ canvasElement, step, args }) => {
    const control = canvasElement.querySelector<HTMLElement>('[data-slot="slider-control"]')!;
    const track = control.querySelector<HTMLElement>('[data-slot="slider-track"]')!;
    const caixa = track.getBoundingClientRect();
    const y = caixa.top + caixa.height / 2;
    const spyChange = args.onValueChange as unknown as ReturnType<typeof fn>;
    const spyCommit = args.onValueCommitted as unknown as ReturnType<typeof fn>;

    await step('Arrastar sobre o trilho move o valor e avisa a cada movimento', async () => {
      const input = canvasElement.querySelector<HTMLInputElement>(
        '[data-slot="slider-thumb"] > input',
      )!;

      // Limpa antes de medir: no replay o espião chega com as chamadas da
      // rodada anterior, e a asserção passaria sem o arrasto ter movido nada.
      spyChange.mockClear();
      spyCommit.mockClear();

      // userEvent.pointer, e não PointerEvent construído à mão: o primitivo
      // chama `setPointerCapture` no pointerdown, e captura só existe para um
      // ponteiro que o navegador conhece. Evento sintético é descartado ali,
      // em silêncio, e o valor fica parado.
      // Pressionar, mover e SOLTAR na mesma chamada. A API direta do
      // `userEvent` cria uma instância nova a cada chamada, e com ela um estado
      // de ponteiro novo: o `[/MouseLeft]` que ficava numa segunda chamada
      // soltava um botão que aquela instância nunca viu apertado, e o
      // `pointerup` que fecha o arrasto nunca chegava ao componente.
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: control, coords: { clientX: caixa.left + caixa.width * 0.2, clientY: y } },
        { target: control, coords: { clientX: caixa.left + caixa.width * 0.8, clientY: y } },
        { keys: '[/MouseLeft]' },
      ]);

      await expect(Number(input.value)).toBeGreaterThan(50);
      // O item de contrato fala do CALLBACK contínuo, não só do valor: sem esta
      // asserção o espião existia na story e ninguém o consultava.
      await expect(spyChange).toHaveBeenCalled();
    });

    await step('O commit é um por interação, não um por movimento', async () => {
      // Enquanto `onValueCommitted` não estava na lista de outputs da host
      // directive, o binding não ligava em nada — em silêncio, com o slider na
      // tela e o contrato declarando cobertura.
      //
      // Contar as duas é o que separa commit de movimento: o arrasto acima
      // avisou várias vezes e só pode ter confirmado UMA. Afirmar apenas
      // "commit foi chamado" passaria com um commit disparado a cada pixel.
      await expect(spyCommit).toHaveBeenCalledTimes(1);
      await expect(spyChange.mock.calls.length).toBeGreaterThan(
        spyCommit.mock.calls.length,
      );
    });
  },
};
