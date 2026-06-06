import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createAvatar, createAvatarFallback, createAvatarImage, createAvatarRoot } from './avatar';

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Avatar/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados canônicos do Avatar: loaded (imagem ok), loading (simulado), failed (src inválido), noImage.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Loaded: Story = {
  parameters: {
    docs: {
      description: { story: 'Imagem válida — AvatarImage visível; fallback oculto após load.' },
    },
  },
  render: () =>
    createAvatar({
      src: 'https://github.com/shadcn.png',
      alt: 'Foto de perfil de Maria Rodrigues',
      fallbackText: 'MR',
    }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // hidden:true — img começa com display:none até o load completar.
    const img = (await canvas.findByRole('img', { hidden: true })) as HTMLImageElement;
    await expect(img).toBeInTheDocument();
    await expect(img.alt).toBe('Foto de perfil de Maria Rodrigues');
  },
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado de carregamento simulado: fallback exibido enquanto a imagem é buscada. Aqui o <img> tem src mas nunca é anexado, simulando um fetch pendente.',
      },
    },
  },
  render: () => {
    const root = createAvatarRoot();

    // Simulação: imagem "pendente" fica escondida, fallback aparece como placeholder.
    const img = createAvatarImage({
      src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
      alt: '',
    });
    img.style.display = 'none';

    const fallback = createAvatarFallback({ text: 'MR' });

    root.append(img, fallback);
    return root;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('MR')).toBeVisible();
  },
};

export const Failed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'src inválido — o handler onerror do AvatarImage oculta a imagem e revela o fallback.',
      },
    },
  },
  render: () =>
    createAvatar({
      src: 'https://invalid.example.com/does-not-exist.png',
      alt: '',
      fallbackText: 'MR',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fallback aparece quando a imagem falha', async () => {
      // Aguarda o handler onerror disparar e o fallback virar visível
      await new Promise((resolve) => setTimeout(resolve, 400));
      await expect(canvas.getByText('MR')).toBeVisible();
    });
  },
};

export const NoImage: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Sem AvatarImage — apenas fallback, exibido imediatamente sem tentativa de carregamento.',
      },
    },
  },
  render: () => {
    const root = createAvatarRoot();
    root.appendChild(createAvatarFallback({ text: 'JP' }));
    return root;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('JP')).toBeVisible();
    await expect(canvas.queryByRole('img')).not.toBeInTheDocument();
  },
};
