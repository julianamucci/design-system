import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CAROUSEL } from './carousel';
import { NdsAspectRatio } from './aspect-ratio';
import {
  measureSlides,
  reprovasDeEscala,
  feedbackDePointerReprovas,
  pontoDeParadaIntacto,
  controlReach,
  escalaSobMovimentoReduzido,
  describeFailures,
} from '@shared/testing/carousel-probe';

const meta: Meta = {
  title: 'Primitives/Display/Carousel/Variants',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [...NDS_CAROUSEL, NdsAspectRatio] })],
  parameters: { layout: 'centered', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

// ─── Horizontal ───────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  parameters: { covers: ['accessibility.item5', 'accessibility.item7', 'functional.item10', 'visual.item2', 'visual.item6'] },
  render: () => ({
    props: { slides: [1, 2, 3, 4, 5] },
    template: `
      <nds-carousel class="nds-w-md" label="Slides na horizontal" slideLabel="Slide {index} de {total}">
        <div ndsCarouselContent>
          @for (i of slides; track i) {
            <div ndsCarouselItem>
              <div ndsAspectRatio [ratio]="16 / 9">
                <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ i }}</span>
                </div>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious label="Item anterior"></button>
        <button ndsCarouselNext label="Próximo item"></button>
      </nds-carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole('region');
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;

    await step('O track deita os slides em linha', async () => {
      await expect(track).toHaveAttribute('data-orientation', 'horizontal');
      await expect(getComputedStyle(track).flexDirection).toBe('row');
    });

    await step('As setas ficam nas laterais, fora da área dos slides', async () => {
      // É o que `.nds-carousel-arrow-prev[data-orientation="horizontal"]` faz;
      // se o atributo não chegasse, os botões empilhariam sobre o primeiro
      // slide sem nenhum erro visível no console.
      const area = regiao.getBoundingClientRect();
      const previous = canvas.getByRole('button', { name: 'Item anterior' }).getBoundingClientRect();
      const next = canvas.getByRole('button', { name: 'Próximo item' }).getBoundingClientRect();
      await expect(previous.left).toBeLessThan(area.left);
      await expect(next.right).toBeGreaterThan(area.right);
    });

    await step('O slide atual fica em tamanho cheio e os vizinhos recuam', async () => {
      // A escala é `transform`, e `transform` não deixa rastro em atributo, em
      // texto nem em papel ARIA: a única prova é a caixa RENDERIZADA contra a
      // caixa de LAYOUT. O `waitFor` não é folga — a transição parte do tamanho
      // cheio e leva `--duration-base` para chegar, então o primeiro quadro
      // mede o ponto de partida e reprovaria por corrida.
      await waitFor(async () => {
        await expect(describeFailures(reprovasDeEscala(measureSlides(canvasElement), 0))).toBe('');
      }, { timeout: 4000 });
    });

    await step('A escala não moveu o ponto de parada da rolagem', async () => {
      // Esta é a stack que rola NATIVAMENTE, com `scroll-snap`: aqui o ponto de
      // parada não é conta de motor, é geometria de layout que o navegador lê.
      // Uma escala que tivesse alcançado o layout mudaria os pontos de encosto
      // e o carrossel passaria a parar fora do slide — e é justamente onde uma
      // foto não acusaria nada.
      await expect(describeFailures(pontoDeParadaIntacto(canvasElement))).toBe('');
    });

    await step('Com movimento reduzido a escala some por inteiro', async () => {
      // Não basta a transição parar: um salto de tamanho é justamente o que a
      // preferência pede para não acontecer. A sonda liga a preferência pelo
      // mesmo canal do toolbar do Storybook e a desliga no `finally`, senão a
      // story seguinte e a foto dela sairiam envenenadas.
      const failures = await escalaSobMovimentoReduzido(canvasElement, waitFor);
      await expect(describeFailures(failures)).toBe('');
    });

    await step('A seta responde ao ponteiro sem sair do lugar', async () => {
      const next = canvas.getByRole('button', { name: 'Próximo item' });

      // A escrita direta do `transform` faz as vezes do ponteiro. Não é atalho:
      // `userEvent.hover` despacha eventos, e o `:hover` do CSS responde ao
      // cursor de verdade — medido, dá razão 1.000 e não verifica nada. O que
      // importa aqui é a COLISÃO de duas regras na propriedade `transform`, e
      // escrevê-la à mão reproduz a colisão inteira.
      const failures = [
        ...(await feedbackDePointerReprovas(next, waitFor)),
        ...controlReach(next),
      ];
      await expect(describeFailures(failures)).toBe('');
    });
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  parameters: { covers: ['functional.item5', 'functional.item10', 'visual.item2'] },
  render: () => ({
    props: { slides: [1, 2, 3, 4] },
    // `nds-aspect-4-3` no viewport dá a altura DEFINIDA que a base
    // `flex: 0 0 100%` do slide precisa para resolver. Sem ela o carrossel
    // vertical empilha os slides e nada é recortado.
    template: `
      <nds-carousel class="nds-w-xs" orientation="vertical" label="Slides na vertical" slideLabel="Slide {index} de {total}">
        <div ndsCarouselContent class="nds-aspect-4-3">
          @for (i of slides; track i) {
            <div ndsCarouselItem>
              <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg nds-h-full" data-justify="center">
                <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ i }}</span>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious label="Item anterior"></button>
        <button ndsCarouselNext label="Próximo item"></button>
      </nds-carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole('region');
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    await step('O track empilha os slides em coluna', async () => {
      await expect(track).toHaveAttribute('data-orientation', 'vertical');
      await expect(getComputedStyle(track).flexDirection).toBe('column');
    });

    await step('Cada slide ocupa o viewport inteiro em altura', async () => {
      // A prova de que a altura definida chegou: sem ela a base 100% do slide
      // cai para `auto` e o slide encolhe até o conteúdo.
      const slide = canvas.getAllByRole('group')[0];
      const height = slide.getBoundingClientRect().height;
      await expect(Math.abs(height - viewport.clientHeight)).toBeLessThan(2);
    });

    await step('As setas ficam acima e abaixo do viewport', async () => {
      const area = regiao.getBoundingClientRect();
      const previous = canvas.getByRole('button', { name: 'Item anterior' }).getBoundingClientRect();
      const next = canvas.getByRole('button', { name: 'Próximo item' }).getBoundingClientRect();
      await expect(previous.top).toBeLessThan(area.top);
      await expect(next.bottom).toBeGreaterThan(area.bottom);
    });

    await step('A seta para baixo avança em vertical', async () => {
      // Em vertical o par de teclas muda: ArrowLeft/Right não teriam sentido
      // para quem lê a pilha de cima para baixo.
      // O foco vai ao RECORTE, que é quem rola; a tecla sobe até a região.
      viewport.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0), { timeout: 4000 });
    });

    await step('E a pilha volta ao topo, parada', async () => {
      // `toBeGreaterThan(0)` acima resolve no PRIMEIRO quadro em que a rolagem
      // suave saiu do zero — a story terminava com o viewport ainda em
      // movimento, e era esse quadro que o Chromatic fotografava. Voltar ao
      // topo e esperar o zero dá um estado assentado para a foto e deixa a
      // play replayável no painel Interactions.
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(viewport.scrollTop).toBe(0), { timeout: 4000 });
    });

    await step('A seta girada também não sai do lugar sob o ponteiro', async () => {
      // O eixo vertical é o caso difícil: aqui a centralização vem acompanhada
      // de uma ROTAÇÃO. Escrita em `transform`, ela desaparecia junto com a
      // centralização quando o `scale` do hover chegava — o chevron voltava a
      // apontar para o lado errado no mesmo quadro em que o botão despencava.
      // Escrita em `translate` + `rotate`, as duas convivem com o `scale`.
      const next = canvas.getByRole('button', { name: 'Próximo item' });
      const failures = await feedbackDePointerReprovas(next, waitFor);
      await expect(describeFailures(failures)).toBe('');
    });
  },
};
