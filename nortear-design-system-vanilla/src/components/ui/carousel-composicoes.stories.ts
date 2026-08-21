import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createCarousel } from './carousel';
import { slidesDeExemplo } from './carousel.fixtures';
import { carouselSource, carouselSourceCom } from './carousel.source';
import { createCard, createCardHeader, createCardTitle, createCardDescription } from './card';
import carouselTranslations from '@shared/content/carousel/translations.json';

/**
 * "Slide" é texto VISÍVEL dentro da pílula, então é conteúdo e não literal de
 * código: sai do mesmo `translations.json` que a docs page lê, onde a chave
 * existe nos três idiomas. A story é fixture e fica presa a pt-BR de propósito
 * — quem resolve o idioma de quem lê é a docs page, e uma play que dependesse
 * do seletor de idioma procuraria um nome diferente a cada rodada.
 */
const CONTEUDO = carouselTranslations['pt-BR'].demonstration.labels;
/** Nome acessível: posição E total. "Slide 2" sozinho não diz para onde leva. */
const nomeAcessivel = (posicao: number, total: number) =>
  `${CONTEUDO.goToSlide} ${posicao} ${CONTEUDO.of} ${total}`;
/** Texto visível da pílula — um PEDAÇO do nome acessível (WCAG 2.5.3). */
const rotuloVisivel = (posicao: number) => `${CONTEUDO.slide} ${posicao}`;

// ─── Slide helpers ────────────────────────────────────────────────────────────

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Carousel/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: carouselSource },
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
  parameters: {
    covers: ['functional.item8', 'accessibility.item6', 'visual.item5'],
    // Override de story: os dots são composição de quem consome, e o que os
    // liga ao carrossel é o callback — nenhum dos dois passa por control.
    docs: {
      source: {
        transform: carouselSourceCom({
          slides: TOTAL_DOTS,
          ariaLabel: 'Galeria com dots',
          onIndexChange: '(index) => marcarDotAtual(index)',
        }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-md';
    wrap.dataset.spacing = 'sm';

    const dotsRow = document.createElement('div');
    dotsRow.className = 'nds-cluster';
    dotsRow.dataset.align = 'center';
    dotsRow.dataset.justify = 'center';
    dotsRow.dataset.spacing = 'sm';

    // `.nds-carousel-dot` traz o alvo com piso de 24px nos dois estados: o atual
    // vira pílula com o rótulo à vista, os demais continuam pontos de 8px.
    // Desenhar o ponto à mão com 8px de lado — que é o que as cinco stacks
    // faziam — reprova no axe por `target-size` (WCAG 2.5.8, AA): o alvo fica
    // menor que o dedo.
    //
    // O estado atual é só `aria-current`: é o atributo que o leitor de tela
    // anuncia E o que a folha usa para desenhar, então os dois nunca divergem.
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
      dot.setAttribute('aria-label', nomeAcessivel(i + 1, TOTAL_DOTS));
      // O rótulo mora em TODOS os controles, não só no atual: é o que deixa a
      // pílula abrir e fechar por recorte em vez de o texto piscar.
      const rotulo = document.createElement('span');
      rotulo.className = 'nds-carousel-dot-label';
      rotulo.textContent = rotuloVisivel(i + 1);
      dot.appendChild(rotulo);
      pintar(dot, i === 0);
      dots.push(dot);
      dotsRow.appendChild(dot);
    }

    const carousel = createCarousel({
      items: slidesDeExemplo(TOTAL_DOTS),
      label: 'Galeria com dots',
      onIndexChange: (index) => dots.forEach((d, i) => pintar(d, i === index)),
    });

    // O dot leva direto ao slide. A factory não expõe um `irPara`, então o
    // salto é composto a partir da navegação que ela EXPÕE — os próprios
    // botões de seta, acionados na direção certa. Nada de evento sintético:
    // o caminho é o mesmo que o dedo de quem usa percorre.
    // A busca é pelo `data-slot` da composição, e não pela classe de estilo: é o
    // marcador que as cinco stacks emitem para o mesmo controle, e o único que
    // sobrevive a uma troca de vocabulário `.nds-*` — que é exatamente o que
    // acabou de acontecer aqui, quando as duas famílias de classe do controle
    // viraram uma só.
    const seta = (direcao: 'previous' | 'next') =>
      carousel.querySelector<HTMLButtonElement>(`[data-slot="carousel-${direcao}"]`)!;

    dots.forEach((dot, alvo) => {
      dot.addEventListener('click', () => {
        const atual = dots.findIndex((d) => d.getAttribute('aria-current') === 'true');
        const botao = seta(alvo > atual ? 'next' : 'previous');
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
    const dot = (n: number) => canvas.getByRole('button', { name: nomeAcessivel(n, TOTAL_DOTS) });
    /**
     * O rótulo é o único filho do controle — a marca do ponto é `::before`, e
     * pseudo-elemento não entra em `firstElementChild`. Buscar por classe seria
     * asserir o nome dela; o que interessa aqui é a CAIXA que ela produz.
     */
    const rotulo = (el: Element) => el.firstElementChild as HTMLElement;
    const largura = (el: Element) => el.getBoundingClientRect().width;

    // Quanto o track já andou, em pixels, medido contra o recorte. É valor
    // ABSOLUTO: não depende de onde a rodada anterior parou, ao contrário de um
    // "andou mais do que antes", que só vale na primeira execução.
    // A leitura é RELATIVA ao repouso. O track tem margem negativa de -16px em
    // horizontal (o seletor de orientação no CSS compartilhado, ligado em 2026-08-19
    // para o primeiro slide encostar na borda como nas outras quatro), então a
    // distância entre recorte e track NUNCA é zero em repouso. Medir em absoluto
    // dava 16.7 onde a conta esperava 0.
    const repouso = recorte.getBoundingClientRect().left - track.getBoundingClientRect().left;
    const deslocamento = () =>
      recorte.getBoundingClientRect().left - track.getBoundingClientRect().left - repouso;

    // Par idempotente: só clica quando o dot ainda não é o atual. O painel
    // Interactions reexecuta a play no MESMO DOM, e um clique cego partiria do
    // estado que a rodada anterior deixou.
    const irPara = async (n: number) => {
      const alvo = dot(n);
      if (alvo.getAttribute('aria-current') !== 'true') await userEvent.click(alvo);
      await waitFor(() => expect(dot(n)).toHaveAttribute('aria-current', 'true'), { timeout: 4000 });
    };

    await step('Há um dot por slide, e o primeiro nasce como o atual', async () => {
      // Contado a partir dos slides renderizados: um número escrito à mão
      // continuaria batendo depois de alguém tirar um slide do conjunto.
      await expect(canvas.getAllByRole('group').length).toBe(TOTAL_DOTS);
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
      await expect(dot(2).hasAttribute('aria-current')).toBe(false);
    });

    await step('O slide atual vira pílula rotulada na própria posição da fileira', async () => {
      // Este é o padrão novo: a fileira não é de N peças iguais. Com o 2º slide
      // atual, ela é `• [Slide 2] • • •` — e a asserção mede exatamente isso,
      // na posição 2, sem nunca citar nome de classe.
      await irPara(2);

      // `waitFor` porque a mudança de forma é ANIMADA: medida no primeiro
      // quadro, a pílula ainda está fechada e o ponto anterior ainda aberto.
      await waitFor(() => {
        expect(largura(rotulo(dot(2)))).toBeGreaterThan(0);
        expect(largura(rotulo(dot(1)))).toBeLessThan(1);
      }, { timeout: 4000 });

      // Rótulo visível certo, e é um pedaço do nome acessível (WCAG 2.5.3).
      await expect(rotulo(dot(2))).toHaveTextContent(rotuloVisivel(2));
      await expect(nomeAcessivel(2, TOTAL_DOTS).toLowerCase()).toContain(
        rotuloVisivel(2).toLowerCase(),
      );

      // A forma mudou, não só a cor: a pílula é mais larga que o ponto vizinho.
      await expect(largura(dot(2))).toBeGreaterThan(largura(dot(3)));

      // E os DEMAIS continuam pontos: nenhum outro rótulo à vista, e um único
      // `aria-current` na fileira inteira.
      const demais = Array.from({ length: TOTAL_DOTS }, (_, k) => k + 1).filter((p) => p !== 2);
      for (const posicao of demais) {
        await expect(largura(rotulo(dot(posicao)))).toBeLessThan(1);
        await expect(dot(posicao).hasAttribute('aria-current')).toBe(false);
      }
    });

    await step('O alvo de cada controle da paginação continua com 24px de piso', async () => {
      // Medido na densidade padrão do preview. O ponto tem marca de 8px e a
      // pílula tem texto de 12px: sem o piso, os dois ficariam abaixo dos 24px
      // que a WCAG 2.5.8 cobra — foi o defeito que criou `.nds-carousel-dot`.
      for (let posicao = 1; posicao <= TOTAL_DOTS; posicao++) {
        const caixa = dot(posicao).getBoundingClientRect();
        await expect(caixa.width).toBeGreaterThanOrEqual(24);
        await expect(caixa.height).toBeGreaterThanOrEqual(24);
      }
    });

    await step('Clicar num dot leva o carrossel àquele slide', async () => {
      // Alvo em coordenada de LAYOUT: `offsetLeft` não é afetado pelo
      // `transform` corrente, então o valor esperado não muda enquanto o
      // deslize corre.
      const slides = canvas.getAllByRole('group') as HTMLElement[];
      const esperado = slides[2].offsetLeft - slides[0].offsetLeft;

      await irPara(3);
      await waitFor(() => expect(Math.abs(deslocamento() - esperado)).toBeLessThan(2), { timeout: 4000 });
      // A POSIÇÃO chega antes do ESTADO: quem desmarca o dot é a reconciliação
      // do índice, e ela espera o motor silenciar. Ver a irmã no Angular.
      await waitFor(async () => {
        await expect(dot(1).hasAttribute('aria-current')).toBe(false);
      }, { timeout: 4000 });
    });

    await step('E a story termina no começo', async () => {
      // Estado limpo para a próxima rodada e para a captura do Chromatic.
      await irPara(1);
      await waitFor(() => expect(deslocamento()).toBeLessThan(2), { timeout: 4000 });
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
  parameters: {
    docs: { source: { transform: carouselSourceCom({ slides: 4, ariaLabel: 'Galeria de fotos do produto' }) } },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';

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
