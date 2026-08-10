import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { AspectRatio } from './index';

const meta = {
  title: 'UI/AspectRatio/Compositions',
  component: AspectRatio,
  tags: ['layout'],
  parameters: {
    design: figmaDesign('aspectRatio'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes típicas do AspectRatio com diferentes conteúdos filhos: imagens, iframes (mapas), vídeos e uso em grids responsivos.',
      },
    },
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item1'] },
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="" style="width: 480px">
        <AspectRatio :ratio="16 / 9">
          <img
            src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&auto=format"
            alt="Paisagem ao amanhecer com montanhas e céu laranja"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
      </div>
    `,
  }),
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

export const WithIframe: Story = {
  parameters: { covers: ['accessibility.item3'] },
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="" style="width: 480px">
        <AspectRatio :ratio="16 / 9">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=-46.66%2C-23.56%2C-46.63%2C-23.54&layer=mapnik"
            title="Mapa do escritório em São Paulo"
            class="nds-w-full nds-rounded-md nds-border-default" style="height: 100%"
            loading="lazy"
          ></iframe>
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    const frame = canvasElement.querySelector('iframe');
    await expect(frame).not.toBeNull();
    // accessibility.item3 — sem title o iframe não tem nome acessível.
    await expect(frame!.getAttribute('title')).toBeTruthy();
  },
};

export const WithVideo: Story = {
  parameters: { covers: ['accessibility.item4', 'accessibility.item5'] },
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="" style="width: 480px">
        <AspectRatio :ratio="16 / 9">
          <video
            controls
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
            poster="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&auto=format"
          >
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
            <track kind="captions" src="data:text/vtt,WEBVTT%0A%0A00:00:00.000 --> 00:00:05.000%0AV%C3%ADdeo de demonstra%C3%A7%C3%A3o do AspectRatio" srclang="pt-BR" label="Português" default />
            Seu navegador não suporta vídeo.
          </video>
        </AspectRatio>
      </div>
    `,
  }),
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

export const InGrid: Story = {
  parameters: { covers: ['functional.item4'] },
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="nds-grid" data-spacing="md" style="width: 720px">
        <AspectRatio :ratio="1">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format"
            alt="Miniatura 1"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
        <AspectRatio :ratio="1">
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format"
            alt="Miniatura 2"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
        <AspectRatio :ratio="1">
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&auto=format"
            alt="Miniatura 3"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
        <AspectRatio :ratio="1">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format"
            alt="Miniatura 4"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
        <AspectRatio :ratio="1">
          <img
            src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=400&auto=format"
            alt="Miniatura 5"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
        <AspectRatio :ratio="1">
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format"
            alt="Miniatura 6"
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
      </div>
    `,
  }),
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

export const EmptyPlaceholder: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="" style="width: 480px">
        <AspectRatio :ratio="16 / 9">
          <div
            class="nds-cluster nds-w-full nds-bg-muted nds-rounded-md nds-text-body nds-text-muted-foreground" data-align="center" data-justify="center" style="height: 100%"
            role="img"
            aria-label="Conteúdo carregando"
          >
            Carregando…
          </div>
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    // functional.item5 — sem mídia dentro, a caixa ainda reserva o espaço.
    await expect(caixa!.querySelector('img, video, iframe')).toBeNull();
    await expect(caixa!.getBoundingClientRect().height).toBeGreaterThan(0);
  },
};

export const WithDecorativeImage: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => ({
    components: { AspectRatio },
    template: `
      <div class="" style="width: 420px">
        <AspectRatio :ratio="16 / 9">
          <img
            src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&auto=format"
            alt=""
            loading="lazy"
            decoding="async"
            class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover"
          />
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('img');
    await expect(img).not.toBeNull();
    // accessibility.item2 — decorativa é alt vazio, e não atributo ausente: sem
    // o alt o leitor de tela anuncia o nome do arquivo.
    await expect(img!.hasAttribute('alt')).toBe(true);
    await expect(img!.getAttribute('alt')).toBe('');
  },
};
