import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { createCarousel } from './carousel';
import { carouselSource, carouselSourceWith } from './carousel.source';
import { slidesDeExemplo } from './carousel.fixtures';
import {
  measureSlides,
  reprovasDeEscala,
  feedbackDePointerReprovas,
  pontoDeParadaIntacto,
  controlReach,
  escalaSobMovimentoReduzido,
  describeFailures,
} from '@shared/testing/carousel-probe';

// ─── Slide helpers ────────────────────────────────────────────────────────────

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Carousel/Variants',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: carouselSource },
      description: {
        component:
          'Orientações disponíveis para o Carousel — horizontal (padrão) e vertical. A orientação decide o eixo do deslize, o par de setas do teclado e onde os botões ficam.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Horizontal ───────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  parameters: { covers: ['accessibility.item5', 'accessibility.item7', 'functional.item10', 'visual.item2', 'visual.item6'] },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';
    wrap.appendChild(
      createCarousel({ items: slidesDeExemplo(5), label: 'Slides na horizontal' }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step, parameters }) => {
    const canvas = within(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;

    // ─── Prova da cascata ────────────────────────────────────────────────────
    //
    // Esta story NÃO declara `transform` — só o `meta` do arquivo declara. Se
    // `parameters.docs.source.transform` chega aqui, chega igual ao painel
    // Code: `useCode` do addon-docs lê exatamente este `storyContext.parameters`
    // (`parameters.docs?.source`), que é o resultado da fusão global + meta +
    // story feita pelo `prepareStory`. A saída do painel não existe no DOM
    // durante a play, então é aqui — no parâmetro resolvido — que a cascata é
    // observável. Todo o desenho (uma transform por componente, e não uma por
    // story) depende deste passo.
    await step('O painel Code herda a transform declarada no meta', async () => {
      const transform = parameters.docs?.source?.transform;
      // A comparação sai do `expect`: o instrumenter do Storybook envolve os
      // argumentos num Proxy, e `toBe` entre duas referências de função reprova
      // por identidade mesmo quando ela é a MESMA (medido). O booleano é
      // calculado aqui, fora do alcance do proxy.
      await expect(transform === carouselSource).toBe(true);
      // E o que ela devolve é a chamada da fábrica, não o `outerHTML`.
      const código = transform('<div data-slot="carousel" role="region"></div>', {});
      await expect(código).toContain('createCarousel({');
      await expect(código).not.toContain('data-slot');
    });

    await step('O track deita os slides em linha', async () => {
      await expect(getComputedStyle(track).flexDirection).toBe('row');
    });

    await step('As setas ficam nas laterais opostas', async () => {
      // É o que as regras de posição do controle fazem; se o eixo não chegasse
      // a elas, os dois botões empilhariam no mesmo canto sem nenhum erro
      // visível no console.
      const previous = canvas
        .getByRole('button', { name: 'Item anterior' })
        .getBoundingClientRect();
      const proximo = canvas
        .getByRole('button', { name: 'Próximo item' })
        .getBoundingClientRect();
      await expect(previous.left).toBeLessThan(proximo.left);
      // Mesma faixa vertical: em horizontal elas se alinham pelo meio.
      await expect(Math.abs(previous.top - proximo.top)).toBeLessThan(2);
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
      // `transform` é pintura, não layout — mas isso é promessa. Passos de
      // layout desiguais entre slides significariam que a escala vazou para o
      // layout, e o carrossel passaria a parar fora do slide.
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
      const proximo = canvas.getByRole('button', { name: 'Próximo item' });

      // A escrita direta do `transform` faz as vezes do ponteiro. Não é atalho:
      // `userEvent.hover` despacha eventos, e o `:hover` do CSS responde ao
      // cursor de verdade — medido, dá razão 1.000 e não verifica nada. O que
      // importa aqui é a COLISÃO de duas regras na propriedade `transform`, e
      // escrevê-la à mão reproduz a colisão inteira.
      const failures = [
        ...(await feedbackDePointerReprovas(proximo, waitFor)),
        ...controlReach(proximo),
      ];
      await expect(describeFailures(failures)).toBe('');
    });
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item10', 'visual.item2'],
    // Override de story: o eixo e a altura definida do recorte não passam por
    // control nenhum, então a transform do meta não teria como saber deles.
    docs: {
      source: {
        transform: carouselSourceWith({
          slides: 4,
          orientation: 'vertical',
          contentClass: 'nds-aspect-4-3',
          ariaLabel: 'Slides na vertical',
        }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-xs';
    wrap.appendChild(
      createCarousel({
        items: slidesDeExemplo(4, { measurement: 'nds-h-full' }),
        orientation: 'vertical',
        // A altura definida é o que a base `flex: 0 0 100%` do slide precisa
        // para resolver. Sem ela o carrossel vertical empilha e nada é
        // recortado — e a classe entra no track, que é onde as outras stacks
        // também a recebem.
        contentClass: 'nds-aspect-4-3',
        label: 'Slides na vertical',
      }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;
    const clip = canvasElement.querySelector<HTMLElement>('.nds-carousel-overflow')!;
    const regiao = canvas.getByRole('region');
    const position = () => track.getBoundingClientRect().top;

    await step('O track empilha os slides em coluna', async () => {
      await expect(track).toHaveAttribute('data-orientation', 'vertical');
      await expect(getComputedStyle(track).flexDirection).toBe('column');
    });

    await step('Cada slide ocupa o recorte inteiro em altura', async () => {
      // A prova de que a altura definida chegou. Ela é medida no RECORTE, não
      // no track: `aspect-ratio` só segura a altura de uma caixa cujo overflow
      // não é visível — num track de overflow visível o conteúdo empurra a
      // caixa e a proporção vira sugestão. Foi assim que a pilha inteira
      // apareceu de uma vez, com os quatro slides somando a altura do track.
      await expect(clip.clientHeight).toBeGreaterThan(0);
      const slide = canvas.getAllByRole('group')[0];
      const altura = slide.getBoundingClientRect().height;
      await expect(Math.abs(altura - clip.clientHeight)).toBeLessThan(2);
    });

    await step('As setas ficam acima e abaixo, não nas laterais', async () => {
      const previous = canvas
        .getByRole('button', { name: 'Item anterior' })
        .getBoundingClientRect();
      const proximo = canvas
        .getByRole('button', { name: 'Próximo item' })
        .getBoundingClientRect();
      await expect(previous.top).toBeLessThan(proximo.top);
      // Mesma coluna: em vertical elas se alinham pelo centro horizontal.
      await expect(Math.abs(previous.left - proximo.left)).toBeLessThan(2);
    });

    await step('A seta para baixo avança, e a pilha volta ao topo', async () => {
      // Em vertical o par de teclas muda: ArrowLeft/Right não teriam sentido
      // para quem lê a pilha de cima para baixo.
      const antes = position();
      regiao.focus();
      await expect(regiao).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(position()).toBeLessThan(antes), { timeout: 4000 });

      // Voltar deixa a story assentada para a foto do Chromatic e replayável no
      // painel Interactions.
      await userEvent.keyboard('{ArrowUp}');
      // Tolerância de um pixel: a caixa volta ao mesmo lugar, mas o retângulo é
      // medido em float e o arredondamento do compositor não é garantido.
      await waitFor(() => expect(Math.abs(position() - antes)).toBeLessThan(1), { timeout: 4000 });
    });

    await step('A seta girada também não sai do lugar sob o ponteiro', async () => {
      // O eixo vertical é o caso difícil: aqui a centralização vem acompanhada
      // de uma ROTAÇÃO. Escrita em `transform`, ela desaparecia junto com a
      // centralização quando o `scale` do hover chegava — o chevron voltava a
      // apontar para o lado errado no mesmo quadro em que o botão despencava.
      // Escrita em `translate` + `rotate`, as duas convivem com o `scale`.
      const proximo = canvas.getByRole('button', { name: 'Próximo item' });
      const failures = await feedbackDePointerReprovas(proximo, waitFor);
      await expect(describeFailures(failures)).toBe('');
    });
  },
};
