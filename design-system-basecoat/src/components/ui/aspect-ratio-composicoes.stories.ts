import type { Meta, StoryObj } from '@storybook/html';
import { createAspectRatio } from './aspect-ratio';
import { createCard, createCardContent, createCardHeader, createCardTitle, createCardDescription } from './card';
import { within, expect } from 'storybook/test';

const meta: Meta = {
  title: 'UI/AspectRatio/Composições',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composições reais: AspectRatio com <img>, <iframe>, <video>, em grid de cards ' +
          'e como placeholder de skeleton enquanto o conteúdo carrega.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function boxed(el: HTMLElement, maxWidth = 'max-w-xl'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = `w-full ${maxWidth}`;
  wrap.appendChild(el);
  return wrap;
}

function buildImage(src: string, alt: string, extraClass = ''): HTMLImageElement {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.className = `object-cover w-full h-full rounded-md ${extraClass}`.trim();
  return img;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComImagem: Story = {
  name: 'Com <img>',
  render: () =>
    boxed(
      createAspectRatio({
        ratio: 16 / 9,
        content: buildImage(
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
          'Paisagem montanhosa ao entardecer',
        ),
      }),
    ),

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const ComIframe: Story = {
  name: 'Com <iframe>',
  render: () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=-46.66,-23.57,-46.63,-23.54&layer=mapnik';
    iframe.title = 'Mapa do escritório em São Paulo';
    iframe.loading = 'lazy';
    iframe.className = 'w-full h-full rounded-md border-0';
    return boxed(createAspectRatio({ ratio: 16 / 9, content: iframe }));
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const ComVideo: Story = {
  name: 'Com <video>',
  render: () => {
    const video = document.createElement('video');
    video.controls = true;
    video.poster = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80';
    video.className = 'object-cover w-full h-full rounded-md bg-black';
    video.setAttribute('aria-label', 'Vídeo demonstrativo com legendas');

    const track = document.createElement('track');
    track.kind = 'captions';
    track.srclang = 'pt';
    track.label = 'Português';
    track.default = true;
    video.appendChild(track);

    return boxed(createAspectRatio({ ratio: 16 / 9, content: video }));
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const EmGrid: Story = {
  name: 'Grid de cards',
  render: () => {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full';

    const items = [
      {
        src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        alt: 'Relógio de pulso moderno',
        title: 'Relógio Série 8',
        desc: 'Mostrador preto fosco com pulseira esportiva.',
      },
      {
        src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        alt: 'Tênis de corrida vermelho',
        title: 'Tênis Runner Pro',
        desc: 'Amortecimento responsivo para corridas longas.',
      },
      {
        src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
        alt: 'Mochila minimalista preta',
        title: 'Mochila Urban',
        desc: 'Compartimento para notebook de até 15".',
      },
    ];

    items.forEach(item => {
      const card = createCard({ className: 'overflow-hidden p-0 gap-0' });

      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'w-full';
      mediaWrap.appendChild(
        createAspectRatio({
          ratio: 4 / 3,
          content: buildImage(item.src, item.alt, 'rounded-none'),
        }),
      );

      const header = createCardHeader({ className: 'p-4' });
      header.appendChild(createCardTitle({ text: item.title, className: 'text-base' }));
      header.appendChild(createCardDescription({ text: item.desc }));

      const content = createCardContent({ className: 'px-4 pb-4 text-sm text-muted-foreground' });
      content.textContent = 'Proporção 4/3 mantida em qualquer largura do card.';

      card.append(mediaWrap, header, content);
      grid.appendChild(card);
    });

    return grid;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const PlaceholderSkeleton: Story = {
  name: 'Placeholder (skeleton)',
  render: () => {
    const skeleton = document.createElement('div');
    skeleton.className = 'w-full h-full rounded-md bg-muted animate-pulse';
    skeleton.setAttribute('aria-hidden', 'true');
    return boxed(createAspectRatio({ ratio: 16 / 9, content: skeleton }));
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
