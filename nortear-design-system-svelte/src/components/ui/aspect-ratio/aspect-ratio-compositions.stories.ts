import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import AspectRatioStory from './AspectRatioStory.svelte';
import AspectRatioGridStory from './AspectRatioGridStory.svelte';
import { gridAspectRatioSource, aspectRatioSource } from './aspect-ratio.source';

const meta: Meta = {
  title: 'Components/Layout/AspectRatio/Compositions',
  component: AspectRatioStory,
  tags: ['layout'],
  parameters: {
    design: figmaDesign('aspectRatio'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; o tipo de filho vem dos
      // `args` de cada uma, e a grade sobrescreve com a própria composição.
      source: { transform: aspectRatioSource },
      description: {
        component:
          'Composicoes comuns do AspectRatio com diferentes tipos de filho: imagem, iframe, vídeo e em grid responsivo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithImage: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item1'] },
  args: {
    ratio: 16 / 9,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60',
    alt: 'Paisagem com object-cover',
    width: 'nds-w-lg',
  },

  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    const img = canvasElement.querySelector('img');
    await expect(img).not.toBeNull();
    // accessibility.item1 — imagem informativa precisa de alt não vazio.
    await expect(img!.getAttribute('alt')).not.toBe('');
    // functional.item3 — o filho cobre a caixa sem distorcer.
    await expect(getComputedStyle(img!).objectFit).toBe('cover');
  },
};

export const WithIframe: Story = {
  parameters: { covers: ['accessibility.item3'] },
  args: {
    ratio: 16 / 9,
    child: 'iframe',
    src: 'https://www.openstreetmap.org/export/embed.html?bbox=-46.66%2C-23.56%2C-46.62%2C-23.54&layer=mapnik',
    title: 'Mapa do escritório em São Paulo',
    width: 'nds-w-lg',
  },

  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    const frame = canvasElement.querySelector('iframe');
    await expect(frame).not.toBeNull();
    // accessibility.item3 — sem title o iframe não tem nome acessível.
    await expect(frame!.getAttribute('title')).toBeTruthy();
  },
};

export const WithVideo: Story = {
  parameters: { covers: ['accessibility.item4', 'accessibility.item5'] },
  args: {
    ratio: 16 / 9,
    child: 'video',
    src: 'https://cdn.coverr.co/videos/coverr-a-quiet-beach-7103/1080p.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=60',
    width: 'nds-w-lg',
  },

  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    const video = canvasElement.querySelector('video');
    await expect(video).not.toBeNull();
    // accessibility.item4 — a faixa de legendas é o que o contrato promete.
    const caption = video!.querySelector('track[kind="captions"]');
    await expect(caption).not.toBeNull();
    await expect(caption!.getAttribute('src')).toBeTruthy();
    // accessibility.item5 — o controle de mídia é alcançável pelo teclado.
    // focus() em vez de tab(): a ordem de tabulação parte do documento inteiro,
    // e o que o critério promete é que o vídeo aceita foco — se não aceitasse,
    // activeElement continuaria no body e a asserção reprovaria.
    await expect(video!.hasAttribute('controls')).toBe(true);
    video!.focus();
    await expect(document.activeElement).toBe(video);
  },
};

export const InGrid: Story = {
  render: () => ({
    Component: AspectRatioGridStory,
  }),
  parameters: {
    covers: ['functional.item4'],
    layout: 'padded',
    docs: { source: { transform: gridAspectRatioSource } },
  },

  play: async ({ canvasElement }) => {
    const boxes = Array.from(
      canvasElement.querySelectorAll('[data-slot="aspect-ratio"]'),
    );
    await expect(boxes.length).toBeGreaterThan(1);
    // functional.item4 — larguras diferentes, mesma proporção: é o que garante
    // que a altura é recalculada a partir da largura, e não fixada.
    const proporcoes = boxes.map((c) => {
      const r = c.getBoundingClientRect();
      return r.width / r.height;
    });
    for (const p of proporcoes) {
      await expect(Math.abs(p - proporcoes[0])).toBeLessThan(0.02);
    }
  },
};

export const EmptyPlaceholder: Story = {
  parameters: { covers: ['functional.item5'] },
  args: {
    ratio: 16 / 9,
    child: 'placeholder',
    label: 'Carregando…',
    width: 'nds-w-lg',
  },

  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // functional.item5 — sem mídia dentro, a caixa ainda reserva o espaço.
    await expect(box!.querySelector('img, video, iframe')).toBeNull();
    await expect(box!.getBoundingClientRect().height).toBeGreaterThan(0);
  },
};

export const WithDecorativeImage: Story = {
  parameters: { covers: ['accessibility.item2'] },
  args: {
    ratio: 16 / 9,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60',
    alt: '',
    width: 'nds-w-lg',
  },

  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('img');
    await expect(img).not.toBeNull();
    // accessibility.item2 — decorativa é alt vazio, e não atributo ausente: sem
    // o alt o leitor de tela anuncia o nome do arquivo.
    await expect(img!.hasAttribute('alt')).toBe(true);
    await expect(img!.getAttribute('alt')).toBe('');
  },
};
