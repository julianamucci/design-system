import type { Meta, StoryObj } from '@storybook/html-vite';
import { createAspectRatio } from './aspect-ratio';
import { createCard, createCardContent, createCardHeader, createCardTitle, createCardDescription } from './card';
import { expect } from 'storybook/test';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/AspectRatio/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composicoes reais: AspectRatio com <img>, <iframe>, <video>, em grid de cards ' +
          'e como placeholder de skeleton enquanto o conteúdo carrega.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function boxed(el: HTMLElement, maxWidth = '36rem'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full';
  wrap.style.maxWidth = maxWidth;
  wrap.appendChild(el);
  return wrap;
}

function buildImage(src: string, alt: string, extraClass = ''): HTMLImageElement {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.className = `nds-w-full nds-rounded-md ${extraClass}`.trim();
  img.style.objectFit = 'cover';
  img.style.height = '100%';
  return img;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComImagem: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item1'] },
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
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    const img = canvasElement.querySelector('img');
    await expect(img).not.toBeNull();
    // accessibility.item1 — imagem informativa precisa de alt não vazio.
    await expect(img!.getAttribute('alt')).not.toBe('');
    // functional.item3 — o filho cobre a caixa sem distorcer.
    await expect(getComputedStyle(img!).objectFit).toBe('cover');
  },
};

export const ComIframe: Story = {
  parameters: { covers: ['accessibility.item3'] },
  name: 'Com <iframe>',
  render: () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=-46.66,-23.57,-46.63,-23.54&layer=mapnik';
    iframe.title = 'Mapa do escritório em São Paulo';
    iframe.loading = 'lazy';
    iframe.className = 'nds-w-full nds-rounded-md';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    return boxed(createAspectRatio({ ratio: 16 / 9, content: iframe }));
  },

  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    const frame = canvasElement.querySelector('iframe');
    await expect(frame).not.toBeNull();
    // accessibility.item3 — sem title o iframe não tem nome acessível.
    await expect(frame!.getAttribute('title')).toBeTruthy();
  },
};

export const ComVideo: Story = {
  parameters: { covers: ['accessibility.item4', 'accessibility.item5'] },
  name: 'Com <video>',
  render: () => {
    const video = document.createElement('video');
    video.controls = true;
    video.poster = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80';
    video.className = 'nds-w-full nds-rounded-md';
    video.style.objectFit = 'cover';
    video.style.height = '100%';
    video.style.background = 'black';
    video.setAttribute('aria-label', 'Vídeo demonstrativo com legendas');

    const track = document.createElement('track');
    track.kind = 'captions';
    // Uma cue em data: URI — legenda de verdade, sem depender de arquivo servido.
    track.src = 'data:text/vtt,WEBVTT%0A%0A00:00:00.000 --> 00:00:05.000%0AV%C3%ADdeo de demonstra%C3%A7%C3%A3o do AspectRatio';
    track.srclang = 'pt-BR';
    track.label = 'Português';
    track.default = true;
    video.appendChild(track);

    return boxed(createAspectRatio({ ratio: 16 / 9, content: video }));
  },

  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    const video = canvasElement.querySelector('video');
    await expect(video).not.toBeNull();
    // accessibility.item4 — a faixa de legendas é o que o contrato promete.
    const legenda = video!.querySelector('track[kind="captions"]');
    await expect(legenda).not.toBeNull();
    await expect(legenda!.getAttribute('src')).toBeTruthy();
    // accessibility.item5 — o controle de mídia é alcançável pelo teclado.
    // focus() em vez de tab(): a ordem de tabulação parte do documento inteiro,
    // e o que o critério promete é que o vídeo aceita foco — se não aceitasse,
    // activeElement continuaria no body e a asserção reprovaria.
    await expect(video!.hasAttribute('controls')).toBe(true);
    video!.focus();
    await expect(document.activeElement).toBe(video);
  },
};

export const EmGrid: Story = {
  parameters: { covers: ['functional.item4'] },
  name: 'Grid de cards',
  render: () => {
    const grid = document.createElement('div');
    grid.className = 'nds-grid nds-w-full';
    grid.dataset.min = '16rem';
    grid.dataset.spacing = 'lg';

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
      const card = createCard({ className: 'nds-overflow-hidden' });
      card.style.padding = '0';
      card.style.gap = '0';

      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'nds-w-full';
      mediaWrap.appendChild(
        createAspectRatio({
          ratio: 4 / 3,
          content: (() => { const im = buildImage(item.src, item.alt, ''); im.style.borderRadius = '0'; return im; })(),
        }),
      );

      const header = createCardHeader({ className: 'nds-p-4' });
      header.appendChild(createCardTitle({ text: item.title, className: 'nds-text-h4' }));
      header.appendChild(createCardDescription({ text: item.desc }));

      const content = createCardContent({ className: 'nds-px-4 nds-text-body nds-text-muted-foreground' });
      content.style.paddingBottom = 'var(--spacing-4, 1rem)';
      content.textContent = 'Proporção 4/3 mantida em qualquer largura do card.';

      card.append(mediaWrap, header, content);
      grid.appendChild(card);
    });

    return grid;
  },

  play: async ({ canvasElement }) => {
    const caixas = Array.from(
      canvasElement.querySelectorAll('[data-slot="aspect-ratio"]'),
    );
    await expect(caixas.length).toBeGreaterThan(1);
    // functional.item4 — larguras diferentes, mesma proporção: é o que garante
    // que a altura é recalculada a partir da largura, e não fixada.
    const proporcoes = caixas.map((c) => {
      const r = c.getBoundingClientRect();
      return r.width / r.height;
    });
    for (const p of proporcoes) {
      await expect(Math.abs(p - proporcoes[0])).toBeLessThan(0.02);
    }
  },
};

export const PlaceholderVazio: Story = {
  parameters: { covers: ['functional.item5'] },
  name: 'Placeholder (skeleton)',
  render: () =>
    // Sem `content` mesmo: o item documentado é "renderizar sem filho", e a
    // caixa vazia é o que reserva o espaço enquanto a mídia não chega. O visual
    // de skeleton vem por classe na própria caixa, não por um filho.
    boxed(
      createAspectRatio({
        ratio: 16 / 9,
        className: 'nds-rounded-md nds-bg-muted',
      }),
    ),

  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    // functional.item5 — sem filho nenhum, a caixa ainda reserva o espaço.
    await expect(caixa!.children.length).toBe(0);
    await expect(caixa!.getBoundingClientRect().height).toBeGreaterThan(0);
    // A classe extra chega ao elemento junto com a classe base.
    await expect(caixa!.classList.contains('nds-aspect-ratio')).toBe(true);
    await expect(caixa!.classList.contains('nds-bg-muted')).toBe(true);
  },
};

export const ComImagemDecorativa: Story = {
  name: 'Imagem decorativa',
  parameters: { covers: ['accessibility.item2'] },
  render: () =>
    boxed(
      createAspectRatio({
        ratio: 16 / 9,
        content: buildImage(
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
          '',
        ),
      }),
      '26rem',
    ),

  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('img');
    await expect(img).not.toBeNull();
    // accessibility.item2 — decorativa é alt vazio, e não atributo ausente: sem
    // o alt o leitor de tela anuncia o nome do arquivo.
    await expect(img!.hasAttribute('alt')).toBe(true);
    await expect(img!.getAttribute('alt')).toBe('');
  },
};
