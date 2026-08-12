import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { createCarousel } from './carousel';
import { createCard, createCardContent } from './card';

// ─── Slide helpers ────────────────────────────────────────────────────────────

// Em horizontal a altura do slide vem de uma proporção; em vertical ela vem do
// track, e o cartão só precisa preenchê-la.
function buildSlide(label: string, medida: string): HTMLElement {
  const card = createCard({ className: `nds-w-full nds-cluster ${medida} nds-bg-muted-soft` });
  card.dataset.align = 'center';
  card.dataset.justify = 'center';
  const content = createCardContent({ className: 'nds-cluster' });
  content.dataset.align = 'center';
  content.dataset.justify = 'center';
  const span = document.createElement('span');
  span.className = 'nds-text-h2 nds-font-semibold nds-text-foreground';
  span.textContent = label;
  content.appendChild(span);
  card.appendChild(content);
  return card;
}

function buildSlides(count: number, medida: string): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => buildSlide(`Slide ${i + 1}`, medida));
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Carousel/Variants',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
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
  parameters: { covers: ['accessibility.item5', 'visual.item2'] },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(
      createCarousel({ items: buildSlides(5, 'nds-aspect-16-9'), label: 'Slides na horizontal' }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;

    await step('O track deita os slides em linha', async () => {
      await expect(getComputedStyle(track).flexDirection).toBe('row');
    });

    await step('As setas ficam nas laterais opostas', async () => {
      // É o que `.nds-carousel-button-prev/-next` fazem; se as regras não
      // chegassem, os dois botões empilhariam no mesmo canto sem nenhum erro
      // visível no console.
      const anterior = canvas
        .getByRole('button', { name: 'Item anterior' })
        .getBoundingClientRect();
      const proximo = canvas
        .getByRole('button', { name: 'Próximo item' })
        .getBoundingClientRect();
      await expect(anterior.left).toBeLessThan(proximo.left);
      // Mesma faixa vertical: em horizontal elas se alinham pelo meio.
      await expect(Math.abs(anterior.top - proximo.top)).toBeLessThan(2);
    });
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  parameters: { covers: ['functional.item5', 'visual.item2'] },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-xs';
    wrap.appendChild(
      createCarousel({
        items: buildSlides(4, 'nds-h-full'),
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
    const recorte = canvasElement.querySelector<HTMLElement>('.nds-carousel-overflow')!;
    const regiao = canvas.getByRole('region');
    const posicao = () => track.getBoundingClientRect().top;

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
      await expect(recorte.clientHeight).toBeGreaterThan(0);
      const slide = canvas.getAllByRole('group')[0];
      const altura = slide.getBoundingClientRect().height;
      await expect(Math.abs(altura - recorte.clientHeight)).toBeLessThan(2);
    });

    await step('As setas ficam acima e abaixo, não nas laterais', async () => {
      const anterior = canvas
        .getByRole('button', { name: 'Item anterior' })
        .getBoundingClientRect();
      const proximo = canvas
        .getByRole('button', { name: 'Próximo item' })
        .getBoundingClientRect();
      await expect(anterior.top).toBeLessThan(proximo.top);
      // Mesma coluna: em vertical elas se alinham pelo centro horizontal.
      await expect(Math.abs(anterior.left - proximo.left)).toBeLessThan(2);
    });

    await step('A seta para baixo avança, e a pilha volta ao topo', async () => {
      // Em vertical o par de teclas muda: ArrowLeft/Right não teriam sentido
      // para quem lê a pilha de cima para baixo.
      const antes = posicao();
      regiao.focus();
      await expect(regiao).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(posicao()).toBeLessThan(antes));

      // Voltar deixa a story assentada para a foto do Chromatic e replayável no
      // painel Interactions.
      await userEvent.keyboard('{ArrowUp}');
      // Tolerância de um pixel: a caixa volta ao mesmo lugar, mas o retângulo é
      // medido em float e o arredondamento do compositor não é garantido.
      await waitFor(() => expect(Math.abs(posicao() - antes)).toBeLessThan(1));
    });
  },
};
