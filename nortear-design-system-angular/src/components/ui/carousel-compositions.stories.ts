import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CAROUSEL } from './carousel';
import { NdsAspectRatio } from './aspect-ratio';
import { NdsButton } from './button';
import { NDS_CARD } from './card';
import carouselTranslations from '@shared/content/carousel/translations.json';

/**
 * "Slide" é texto VISÍVEL dentro da pílula, então é conteúdo e não literal de
 * código: sai do mesmo `translations.json` que a docs page lê, onde a chave
 * existe nos três idiomas. A story é fixture e fica presa a pt-BR de propósito
 * — quem resolve o idioma de quem lê é a docs page, e uma play que dependesse
 * do seletor de idioma procuraria um nome diferente a cada rodada.
 */
const CONTENT = carouselTranslations['pt-BR'].demonstration.labels;
/** Nome acessível: posição E total. "Slide 2" sozinho não diz para onde leva. */
const accessibleName = (position: number, total: number) =>
  `${CONTENT.goToSlide} ${position} ${CONTENT.of} ${total}`;
/** Texto visível da pílula — um PEDAÇO do nome acessível (WCAG 2.5.3). */
const labelVisible = (position: number) => `${CONTENT.slide} ${position}`;

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Nesta stack não há instância externa nem plugin: a posição, o total e o
// comando de ir a um índice são do próprio componente, lidos por referência de
// template. É isso que permite montar dots e um controle de apresentação sem
// nada além do que o carrossel já expõe.

const meta: Meta = {
  title: 'UI/Carousel/Compositions',
  decorators: [moduleMetadata({ imports: [...NDS_CAROUSEL, NdsAspectRatio, NdsButton, ...NDS_CARD] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'O carrossel composto com controles próprios: dots que levam direto a um slide e um comando de iniciar ou pausar a apresentação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const SLIDES = [1, 2, 3, 4, 5];

// ─── Dots e controle de apresentação ──────────────────────────────────────────

export const WithDots: Story = {
  parameters: {
    covers: ['functional.item8', 'accessibility.item6', 'visual.item5'],
    docs: {
      description: {
        story:
          'A paginação traz posição e total no nome — "2" sozinho não diz para onde leva — e o slide atual ocupa a própria posição da fileira como pílula rotulada. O avanço automático começa parado: quem decide se a tela se mexe é quem lê.',
      },
    },
  },
  render: () => ({
    props: { slides: SLIDES, accessibleName, labelVisible },
    // `#comDots` é a referência de template: `index()`, `total()`,
    // `irPara()` e `alternarAutoplay()` são a API pública do carrossel, e os
    // controles abaixo não precisam de estado próprio para acompanhá-la.
    //
    // `autoplay` fica em falso no primeiro render de propósito: um preview que
    // nasce se mexendo nunca estabiliza para a regressão visual, e a WCAG 2.2.2
    // pede que o movimento automático seja controlável — começar parado é a
    // forma mais direta disso.
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <nds-carousel
          #comDots
          class="nds-w-full"
          label="Galeria com dots"
          slideLabel="Slide {index} de {total}"
          [autoplayDelay]="400"
        >
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

        <!-- Sem crase neste comentário: o template é um literal de template de
             JavaScript, e uma crase aqui dentro fecha a string. O erro que sai
             é "carousel is not defined", que não aponta para nada parecido.

             A classe nds-carousel-dot é a MESMA das outras quatro stacks. Esta
             stack montava a fileira com o componente de botão em variante
             numerada: legível, mas uma composição diferente da que o conteúdo
             compartilhado descreve. O atual vira pílula com o rótulo à vista,
             os demais continuam pontos, e o alvo tem piso de 24px nos dois
             estados (WCAG 2.5.8).

             O rótulo mora em TODOS os controles, não só no atual: é o que deixa
             a pílula abrir e fechar por recorte em vez de o texto piscar. -->
        <div class="nds-cluster" data-justify="center" data-spacing="sm">
          @for (i of slides; track i) {
            <button
              type="button"
              class="nds-carousel-dot"
              [attr.aria-current]="comDots.index() === i - 1 ? 'true' : null"
              [attr.aria-label]="accessibleName(i, slides.length)"
              (click)="comDots.irTo(i - 1)"
            ><span class="nds-carousel-dot-label">{{ labelVisible(i) }}</span></button>
          }
        </div>

        <button ndsButton variant="outline" size="sm" (click)="comDots.alternarAutoplay()">
          {{ comDots.autoplayAtivo() ? 'Pausar apresentação' : 'Iniciar apresentação' }}
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const dot = (position: number) =>
      canvas.getByRole('button', { name: accessibleName(position, SLIDES.length) });
    /**
     * O rótulo é o único filho do controle — a marca do ponto é `::before`, e
     * pseudo-elemento não entra em `firstElementChild`. Buscar por classe seria
     * asserir o nome dela; o que interessa aqui é a CAIXA que ela produz.
     */
    const label = (el: Element) => el.firstElementChild as HTMLElement;
    const width = (el: Element) => el.getBoundingClientRect().width;

    await step('Há um dot por slide, e o primeiro nasce como o atual', async () => {
      // Contado a partir dos slides renderizados: um número escrito à mão
      // continuaria batendo depois de alguém tirar um slide do array.
      const total = canvas.getAllByRole('group').length;
      await expect(total).toBe(SLIDES.length);
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
      await expect(dot(2).hasAttribute('aria-current')).toBe(false);
    });

    await step('O slide atual vira pílula rotulada na própria posição da fileira', async () => {
      // Este é o padrão novo: a fileira não é de N peças iguais. Com o 2º slide
      // atual, ela é `• [Slide 2] • • •` — e a asserção mede exatamente isso,
      // na posição 2, sem nunca citar nome de classe.
      //
      // Par idempotente: o clique só sai quando o controle ainda não é o atual.
      // O painel Interactions reexecuta a play no MESMO DOM.
      if (dot(2).getAttribute('aria-current') !== 'true') await userEvent.click(dot(2));
      await waitFor(() => expect(dot(2)).toHaveAttribute('aria-current', 'true'), { timeout: 4000 });

      // `waitFor` porque a mudança de forma é ANIMADA: medida no primeiro
      // quadro, a pílula ainda está fechada e o ponto anterior ainda aberto.
      await waitFor(() => {
        expect(width(label(dot(2)))).toBeGreaterThan(0);
        expect(width(label(dot(1)))).toBeLessThan(1);
      }, { timeout: 4000 });

      // Rótulo visível certo, e é um pedaço do nome acessível (WCAG 2.5.3).
      await expect(label(dot(2))).toHaveTextContent(labelVisible(2));
      await expect(accessibleName(2, SLIDES.length).toLowerCase()).toContain(
        labelVisible(2).toLowerCase(),
      );

      // A forma mudou, não só a cor: a pílula é mais larga que o ponto vizinho.
      await expect(width(dot(2))).toBeGreaterThan(width(dot(3)));

      // E os DEMAIS continuam pontos: nenhum outro rótulo à vista, e um único
      // `aria-current` na fileira inteira.
      const demais = SLIDES.filter((p) => p !== 2);
      for (const position of demais) {
        await expect(width(label(dot(position)))).toBeLessThan(1);
        await expect(dot(position).hasAttribute('aria-current')).toBe(false);
      }
    });

    await step('O alvo de cada controle da paginação continua com 24px de piso', async () => {
      // Medido na densidade padrão do preview. O ponto tem marca de 8px e a
      // pílula tem texto de 12px: sem o piso, os dois ficariam abaixo dos 24px
      // que a WCAG 2.5.8 cobra — foi o defeito que criou `.nds-carousel-dot`.
      for (const position of SLIDES) {
        const box = dot(position).getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    await step('Clicar num dot salta direto para aquele slide', async () => {
      const slides = canvas.getAllByRole('group') as HTMLElement[];
      // Alvo em coordenada de LAYOUT: `offsetLeft` não é afetado pela rolagem
      // corrente, então o valor esperado não muda enquanto a animação corre.
      const esperado = slides[2].offsetLeft - slides[0].offsetLeft;
      const terceiro = dot(3);
      await userEvent.click(terceiro);
      // Salto, não passo — e a espera é pelo fim da rolagem suave, não pelo
      // primeiro pixel: os passos seguintes medem a partir daqui.
      await waitFor(() => expect(Math.abs(viewport.scrollLeft - esperado)).toBeLessThan(2), { timeout: 4000 });
      // A POSIÇÃO chega antes do ESTADO: a rolagem encostou no alvo, mas quem
      // marca o dot é a reconciliação do índice, adiada de propósito até o
      // silêncio do motor. Afirmar aqui mede uma janela em que o componente
      // ainda não foi avisado de que parou — passa na máquina ociosa e reprova
      // sob carga.
      await waitFor(async () => {
        await expect(dot(3)).toHaveAttribute('aria-current', 'true');
        await expect(dot(1).hasAttribute('aria-current')).toBe(false);
      }, { timeout: 4000 });
    });

    await step('O comando de apresentação liga o avanço automático', async () => {
      const start = canvas.getByRole('button', { name: 'Iniciar apresentação' });
      const antes = viewport.scrollLeft;
      await userEvent.click(start);
      // O rótulo é o estado observável de fora; a rolagem é a prova de que o
      // relógio realmente andou.
      await expect(canvas.getByRole('button', { name: 'Pausar apresentação' })).toBeInTheDocument();
      await waitFor(() => expect(viewport.scrollLeft).toBeGreaterThan(antes), { timeout: 4000 });
    });

    await step('E a story termina parada e no começo', async () => {
      // Estado limpo para a próxima rodada e para a captura: nem o relógio
      // rodando, nem o carrossel num slide qualquer.
      const pause = canvas.getByRole('button', { name: 'Pausar apresentação' });
      await userEvent.click(pause);
      await expect(canvas.getByRole('button', { name: 'Iniciar apresentação' })).toBeInTheDocument();

      const first = dot(1);
      await userEvent.click(first);
      await waitFor(() => expect(viewport.scrollLeft).toBe(0), { timeout: 4000 });
      // A POSIÇÃO chega antes do ESTADO: a rolagem encostou em zero, mas quem
      // marca o dot é a reconciliação do índice, adiada até o motor silenciar.
      await waitFor(async () => {
        await expect(dot(1)).toHaveAttribute('aria-current', 'true');
      }, { timeout: 4000 });
    });
  },
};

// ─── Galeria ──────────────────────────────────────────────────────────────────
//
// A composição "Galeria de imagens" do conteúdo compartilhado existia como
// story nas outras quatro stacks e não nesta — então o Chromatic nunca a
// fotografou aqui, e o axe nunca a varreu. Cada slide junta uma capa em
// proporção fixa a um título e uma legenda.

const FOTOS = [
  { title: 'Foto 1', caption: 'Paisagem natural ao amanhecer' },
  { title: 'Foto 2', caption: 'Detalhe arquitetônico em pedra' },
  { title: 'Foto 3', caption: 'Cidade iluminada à noite' },
  { title: 'Foto 4', caption: 'Praia vista do alto' },
];

export const Gallery: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'O nome da região descreve o contexto da galeria — "Galeria de fotos do produto" diz o que a pessoa vai percorrer antes de ela percorrer.',
      },
    },
  },
  render: () => ({
    props: { fotos: FOTOS },
    template: `
      <nds-carousel class="nds-w-md" label="Galeria de fotos do produto" slideLabel="Slide {index} de {total}">
        <div ndsCarouselContent>
          @for (foto of fotos; track foto.title) {
            <div ndsCarouselItem>
              <div ndsCard class="nds-overflow-hidden">
                <div ndsAspectRatio [ratio]="16 / 9">
                  <div class="nds-cluster nds-bg-muted-soft" data-justify="center">
                    <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ foto.title }}</span>
                  </div>
                </div>
                <div ndsCardHeader>
                  <h3 ndsCardTitle>{{ foto.title }}</h3>
                  <p ndsCardDescription>{{ foto.caption }}</p>
                </div>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious label="Foto anterior"></button>
        <button ndsCarouselNext label="Próxima foto"></button>
      </nds-carousel>
    `,
  }),
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
        await expect(slide).toHaveTextContent(FOTOS[i].caption);
      }
    });

    await step('As setas desta galeria falam de fotos, não de itens', async () => {
      // O rótulo acompanha o conteúdo: "Próximo item" numa galeria de fotos do produto
      // obriga quem ouve a adivinhar o que é o item.
      await expect(canvas.getByRole('button', { name: 'Foto anterior' })).toBeDisabled();
      await expect(canvas.getByRole('button', { name: 'Próxima foto' })).toBeEnabled();
    });
  },
};
