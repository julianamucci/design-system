import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { AspectRatio } from './index';

const meta = {
  title: 'UI/AspectRatio/Composicoes',
  component: AspectRatio,
  tags: ['layout'],
  parameters: {
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

export const ComImagem: Story = {
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
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const ComIframe: Story = {
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
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const ComVideo: Story = {
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
            <track kind="captions" src="" srclang="pt-BR" label="Português" default />
            Seu navegador não suporta vídeo.
          </video>
        </AspectRatio>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const EmGrid: Story = {
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
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const PlaceholderVazio: Story = {
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
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
