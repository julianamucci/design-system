import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CAROUSEL } from './carousel';
import { NdsAspectRatio } from './aspect-ratio';
import { NdsButton } from './button';
import { NDS_CARD } from './card';

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
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'Os dots trazem posição e total no nome — "2" sozinho não diz para onde leva. O avanço automático começa parado: quem decide se a tela se mexe é quem lê.',
      },
    },
  },
  render: () => ({
    props: { slides: SLIDES },
    // `#comDots` é a referência de template: `index()`, `total()`,
    // `irPara()` e `alternarAutoplay()` são a API pública do carrossel, e os
    // controles abaixo não precisam de estado próprio para acompanhá-la.
    //
    // `autoplay` fica em falso no primeiro render de propósito: um preview que
    // nasce se mexendo nunca estabiliza para a regressão visual, e a WCAG 2.2.2
    // pede que o movimento automático seja controlável — começar parado é a
    // forma mais direta disso.
    template: `
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
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

        <div class="nds-cluster" data-justify="center">
          @for (i of slides; track i) {
            <button
              ndsButton
              [variant]="comDots.index() === i - 1 ? 'default' : 'outline'"
              size="icon-sm"
              [attr.aria-current]="comDots.index() === i - 1 ? 'true' : null"
              [attr.aria-label]="'Ir para o slide ' + i + ' de ' + slides.length"
              (click)="comDots.irPara(i - 1)"
            >{{ i }}</button>
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
    const dot = (posicao: number) =>
      canvas.getByRole('button', { name: `Ir para o slide ${posicao} de ${SLIDES.length}` });

    await step('Há um dot por slide, e o primeiro nasce como o atual', async () => {
      // Contado a partir dos slides renderizados: um número escrito à mão
      // continuaria batendo depois de alguém tirar um slide do array.
      const total = canvas.getAllByRole('group').length;
      await expect(total).toBe(SLIDES.length);
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
      await expect(dot(2).hasAttribute('aria-current')).toBe(false);
    });

    await step('O dot ativo se distingue dos outros por mais do que a posição', async () => {
      // Comparação entre dois dots, e não medida absoluta de um só: "tem fundo"
      // é verdade para os cinco. O que prova o destaque é o ativo ter um fundo
      // DIFERENTE do inativo.
      const ativo = getComputedStyle(dot(1)).backgroundColor;
      const inativo = getComputedStyle(dot(2)).backgroundColor;
      await expect(ativo).not.toBe(inativo);
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
      await waitFor(() => expect(Math.abs(viewport.scrollLeft - esperado)).toBeLessThan(2));
      await expect(dot(3)).toHaveAttribute('aria-current', 'true');
      await expect(dot(1).hasAttribute('aria-current')).toBe(false);
    });

    await step('O comando de apresentação liga o avanço automático', async () => {
      const iniciar = canvas.getByRole('button', { name: 'Iniciar apresentação' });
      const antes = viewport.scrollLeft;
      await userEvent.click(iniciar);
      // O rótulo é o estado observável de fora; a rolagem é a prova de que o
      // relógio realmente andou.
      await expect(canvas.getByRole('button', { name: 'Pausar apresentação' })).toBeInTheDocument();
      await waitFor(() => expect(viewport.scrollLeft).toBeGreaterThan(antes), { timeout: 4000 });
    });

    await step('E a story termina parada e no começo', async () => {
      // Estado limpo para a próxima rodada e para a captura: nem o relógio
      // rodando, nem o carrossel num slide qualquer.
      const pausar = canvas.getByRole('button', { name: 'Pausar apresentação' });
      await userEvent.click(pausar);
      await expect(canvas.getByRole('button', { name: 'Iniciar apresentação' })).toBeInTheDocument();

      const primeiro = dot(1);
      await userEvent.click(primeiro);
      await waitFor(() => expect(viewport.scrollLeft).toBe(0));
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
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
  { titulo: 'Foto 1', legenda: 'Paisagem natural ao amanhecer' },
  { titulo: 'Foto 2', legenda: 'Detalhe arquitetônico em pedra' },
  { titulo: 'Foto 3', legenda: 'Cidade iluminada à noite' },
  { titulo: 'Foto 4', legenda: 'Praia vista do alto' },
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
      <nds-carousel class="nds-w-full nds-max-w-md" label="Galeria de fotos do produto" slideLabel="Slide {index} de {total}">
        <div ndsCarouselContent>
          @for (foto of fotos; track foto.titulo) {
            <div ndsCarouselItem>
              <div ndsCard class="nds-overflow-hidden">
                <div ndsAspectRatio [ratio]="16 / 9">
                  <div class="nds-cluster nds-bg-muted-soft" data-justify="center">
                    <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ foto.titulo }}</span>
                  </div>
                </div>
                <div ndsCardHeader>
                  <h3 ndsCardTitle>{{ foto.titulo }}</h3>
                  <p ndsCardDescription>{{ foto.legenda }}</p>
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
          FOTOS[i].titulo,
        );
        await expect(slide).toHaveTextContent(FOTOS[i].legenda);
      }
    });

    await step('As setas desta galeria falam de fotos, não de itens', async () => {
      // O rótulo acompanha o conteúdo: "Próximo item" numa galeria de fotos
      // obriga quem ouve a adivinhar o que é o item.
      await expect(canvas.getByRole('button', { name: 'Foto anterior' })).toBeDisabled();
      await expect(canvas.getByRole('button', { name: 'Próxima foto' })).toBeEnabled();
    });
  },
};
