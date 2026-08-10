import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsAspectRatio } from './aspect-ratio';
import { IMG_PLACEHOLDER } from './aspect-ratio.stories';

const meta: Meta = {
  title: 'UI/AspectRatio/Composições',
  decorators: [moduleMetadata({ imports: [NdsAspectRatio] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const ImagemDecorativa: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => ({
    props: { src: IMG_PLACEHOLDER },
    template: `
      <div class="nds-max-w-md">
        <p class="nds-text-body">Padrão geométrico de fundo, sem informação própria:</p>
        <div ndsAspectRatio [ratio]="21 / 9">
          <img [src]="src" alt="" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Imagem decorativa tem alt vazio, não alt ausente', async () => {
      // `alt=""` diz ao leitor "ignore isto". Sem o atributo, ele lê o nome do
      // arquivo — que é o pior dos dois mundos.
      const img = canvasElement.querySelector<HTMLImageElement>('img')!;
      await expect(img.hasAttribute('alt')).toBe(true);
      await expect(img.alt).toBe('');
    });
  },
};

export const IframeEVideo: Story = {
  parameters: { covers: ['accessibility.item3', 'accessibility.item4'] },
  render: () => ({
    template: `
      <div class="nds-grid nds-w-full" data-spacing="lg" data-min="16rem">
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-text-muted-foreground">Iframe</p>
          <div ndsAspectRatio [ratio]="16 / 9">
            <iframe
              title="Mapa da sede em Recife"
              src="about:blank"
              class="nds-border-none"
            ></iframe>
          </div>
        </div>

        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-text-muted-foreground">Vídeo</p>
          <div ndsAspectRatio [ratio]="16 / 9">
            <video controls>
              <track kind="captions" srclang="pt-BR" label="Português" default />
            </video>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O iframe tem title — é o nome acessível do frame', async () => {
      // Iframe sem title é anunciado como "frame" e nada mais; quem navega por
      // landmarks não sabe se vale entrar.
      const iframe = canvasElement.querySelector<HTMLIFrameElement>('iframe')!;
      await expect(iframe.title.length).toBeGreaterThan(0);
    });

    await step('O vídeo declara faixa de legendas', async () => {
      const track = canvasElement.querySelector<HTMLTrackElement>('track')!;
      await expect(track.kind).toBe('captions');
      await expect(track.srclang).toBe('pt-BR');
    });

    await step('A caixa não torna a mídia inerte', async () => {
      // Os filhos ficam em `position: absolute; inset: 0`. Se o container ou o
      // filho recebessem `pointer-events: none`, a mídia continuaria visível e
      // deixaria de responder — sintoma clássico de overlay mal posicionado.
      const video = canvasElement.querySelector<HTMLVideoElement>('video')!;
      const caixa = video.closest<HTMLElement>('[data-slot="aspect-ratio"]')!;
      await expect(getComputedStyle(video).pointerEvents).not.toBe('none');
      await expect(getComputedStyle(caixa).pointerEvents).not.toBe('none');
    });
  },
};

export const MidiaClicavel: Story = {
  parameters: { covers: ['accessibility.item5'] },
  render: () => ({
    props: { src: IMG_PLACEHOLDER },
    // Um <a> dentro da caixa: é o padrão real de mídia clicável e o único jeito
    // honesto de exercitar "o foco alcança o conteúdo interativo".
    //
    // O <video> da story anterior NÃO serve para isso: sem `src` ele não tem o
    // que tocar, o Chromium não expõe os controles e ele não entra na ordem de
    // tabulação. Um teste ali mediria a falta da mídia de exemplo, não o
    // comportamento do AspectRatio.
    template: `
      <div class="nds-max-w-md">
        <div ndsAspectRatio [ratio]="16 / 9">
          <a href="#video-42" aria-label="Assistir: bastidores da produção">
            <img [src]="src" alt="" />
          </a>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O Tab alcança o conteúdo posicionado dentro da caixa', async () => {
      const link = canvas.getByRole('link');
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
    });

    await step('O foco fica visível sobre a mídia', async () => {
      const link = canvas.getByRole('link');
      link.focus();
      const estilo = getComputedStyle(link);
      await expect(estilo.outlineStyle !== 'none' || estilo.boxShadow !== 'none').toBe(true);
    });
  },
};

export const WithoutChild: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    template: `
      <div class="nds-max-w-md">
        <div ndsAspectRatio [ratio]="4 / 3"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A caixa reserva o espaço mesmo vazia', async () => {
      // É o caso do placeholder antes da imagem carregar: sem filho, o
      // container tem que manter a altura para o layout não pular depois.
      const box = canvasElement.querySelector<HTMLElement>('[data-slot="aspect-ratio"]')!;
      const { width, height } = box.getBoundingClientRect();
      await expect(height).toBeGreaterThan(0);
      await expect(Math.abs(width / height - 4 / 3)).toBeLessThan(0.1);
    });
  },
};
