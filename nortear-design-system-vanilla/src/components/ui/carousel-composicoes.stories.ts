import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createCarousel } from './carousel';
import { createCard, createCardContent, createCardHeader, createCardTitle, createCardDescription } from './card';

// ─── Slide helpers ────────────────────────────────────────────────────────────

function buildSlide(label: string): HTMLElement {
  const card = createCard({ className: 'nds-w-full nds-cluster nds-aspect-16-9 nds-bg-muted-soft' });
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

function buildSlides(count: number, prefix = 'Slide'): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => buildSlide(`${prefix} ${i + 1}`));
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Carousel/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes do Carousel — com dots que levam direto a um slide e galeria de imagens com legenda.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Dots ─────────────────────────────────────────────────────────────────────

const TOTAL_DOTS = 5;

export const WithDots: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-full nds-max-w-md';
    wrap.dataset.spacing = 'sm';

    const dotsRow = document.createElement('div');
    dotsRow.className = 'nds-cluster';
    dotsRow.dataset.align = 'center';
    dotsRow.dataset.justify = 'center';
    dotsRow.dataset.spacing = 'sm';

    // `.nds-carousel-dot` traz o alvo de 24px e a marca visível de 8px. Desenhar
    // o dot à mão com 8px de lado — que é o que as cinco stacks faziam — reprova
    // no axe por `target-size` (WCAG 2.5.8, AA): o alvo fica menor que o dedo.
    //
    // O estado ativo é só `aria-current`: é o atributo que o leitor de tela
    // anuncia E o que a folha usa para pintar, então os dois nunca divergem.
    const pintar = (dot: HTMLElement, ativo: boolean) => {
      if (ativo) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    };

    const dots: HTMLButtonElement[] = [];
    for (let i = 0; i < TOTAL_DOTS; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'nds-carousel-dot';
      // Posição E total no nome: "2" sozinho não diz para onde leva.
      dot.setAttribute('aria-label', `Ir para o slide ${i + 1} de ${TOTAL_DOTS}`);
      pintar(dot, i === 0);
      dots.push(dot);
      dotsRow.appendChild(dot);
    }

    const carousel = createCarousel({
      items: buildSlides(TOTAL_DOTS),
      label: 'Galeria com dots',
      onIndexChange: (index) => dots.forEach((d, i) => pintar(d, i === index)),
    });

    // O dot leva direto ao slide. A factory não expõe um `irPara`, então o
    // salto é composto a partir da navegação que ela EXPÕE — os próprios
    // botões de seta, acionados na direção certa. Nada de evento sintético:
    // o caminho é o mesmo que o dedo de quem usa percorre.
    const seta = (direcao: 'prev' | 'next') =>
      carousel.querySelector<HTMLButtonElement>(`.nds-carousel-button-${direcao}`)!;

    dots.forEach((dot, alvo) => {
      dot.addEventListener('click', () => {
        const atual = dots.findIndex((d) => d.getAttribute('aria-current') === 'true');
        const botao = seta(alvo > atual ? 'next' : 'prev');
        for (let passo = 0; passo < Math.abs(alvo - atual); passo++) botao.click();
      });
    });

    wrap.append(carousel, dotsRow);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;
    const recorte = canvasElement.querySelector<HTMLElement>('.nds-carousel-overflow')!;
    const dot = (n: number) =>
      canvas.getByRole('button', { name: `Ir para o slide ${n} de ${TOTAL_DOTS}` });

    // Quanto o track já andou, em pixels, medido contra o recorte. É valor
    // ABSOLUTO: não depende de onde a rodada anterior parou, ao contrário de um
    // "andou mais do que antes", que só vale na primeira execução.
    const deslocamento = () =>
      recorte.getBoundingClientRect().left - track.getBoundingClientRect().left;

    // Par idempotente: só clica quando o dot ainda não é o atual. O painel
    // Interactions reexecuta a play no MESMO DOM, e um clique cego partiria do
    // estado que a rodada anterior deixou.
    const irPara = async (n: number) => {
      const alvo = dot(n);
      if (alvo.getAttribute('aria-current') !== 'true') await userEvent.click(alvo);
      await waitFor(() => expect(dot(n)).toHaveAttribute('aria-current', 'true'));
    };

    await step('Há um dot por slide, e o primeiro nasce como o atual', async () => {
      // Contado a partir dos slides renderizados: um número escrito à mão
      // continuaria batendo depois de alguém tirar um slide do conjunto.
      await expect(canvas.getAllByRole('group').length).toBe(TOTAL_DOTS);
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
      await expect(dot(2).hasAttribute('aria-current')).toBe(false);
    });

    await step('O dot ativo se distingue dos outros por mais do que a posição', async () => {
      // Comparação entre dois dots, e não medida absoluta de um só: "tem fundo"
      // é verdade para os cinco. O que prova o destaque é o ativo ter um fundo
      // DIFERENTE do inativo.
      //
      // A leitura é do `::before`, que é onde a marca visível mora. Medir o
      // botão devolveria `transparent` para os dois — uma comparação que nunca
      // falha, exatamente o defeito que esta rodada existe para remover.
      const cor = (el: Element) => getComputedStyle(el, '::before').backgroundColor;
      await expect(cor(dot(1))).not.toBe(cor(dot(2)));
    });

    await step('Clicar num dot leva o carrossel àquele slide', async () => {
      // Alvo em coordenada de LAYOUT: `offsetLeft` não é afetado pelo
      // `transform` corrente, então o valor esperado não muda enquanto o
      // deslize corre.
      const slides = canvas.getAllByRole('group') as HTMLElement[];
      const esperado = slides[2].offsetLeft - slides[0].offsetLeft;

      await irPara(3);
      await waitFor(() => expect(Math.abs(deslocamento() - esperado)).toBeLessThan(2));
      await expect(dot(1).hasAttribute('aria-current')).toBe(false);
    });

    await step('E a story termina no começo', async () => {
      // Estado limpo para a próxima rodada e para a captura do Chromatic.
      await irPara(1);
      await waitFor(() => expect(deslocamento()).toBeLessThan(2));
      await expect(canvas.getByRole('button', { name: 'Item anterior' })).toBeDisabled();
    });
  },
};

// ─── Galeria ──────────────────────────────────────────────────────────────────

const FOTOS = [
  { title: 'Foto 1', description: 'Paisagem natural ao amanhecer' },
  { title: 'Foto 2', description: 'Detalhe arquitetônico em pedra' },
  { title: 'Foto 3', description: 'Cidade iluminada à noite' },
  { title: 'Foto 4', description: 'Praia vista do alto' },
];

export const Gallery: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';

    const items = FOTOS.map((foto) => {
      const card = createCard({ className: 'nds-w-full nds-overflow-hidden' });
      const cover = document.createElement('div');
      cover.className = 'nds-w-full nds-cluster nds-aspect-16-9 nds-bg-muted-soft';
      cover.dataset.align = 'center';
      cover.dataset.justify = 'center';
      const label = document.createElement('span');
      label.className = 'nds-text-h3 nds-font-semibold nds-text-foreground';
      label.textContent = foto.title;
      cover.appendChild(label);

      const header = createCardHeader();
      header.appendChild(createCardTitle({ text: foto.title, level: 3 }));
      header.appendChild(createCardDescription({ text: foto.description }));

      card.append(cover, header);
      return card;
    });

    wrap.appendChild(createCarousel({ items, label: 'Galeria de fotos do produto' }));
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A região diz de que galeria se trata', async () => {
      await expect(canvas.getByRole('region')).toHaveAccessibleName('Galeria de fotos do produto');
    });

    await step('Cada slide traz capa, título e legenda', async () => {
      const slides = canvas.getAllByRole('group');
      await expect(slides.length).toBe(FOTOS.length);
      for (const [i, slide] of slides.entries()) {
        await expect(within(slide).getByRole('heading', { level: 3 })).toHaveTextContent(
          FOTOS[i].title,
        );
        await expect(slide).toHaveTextContent(FOTOS[i].description);
      }
    });
  },
};
