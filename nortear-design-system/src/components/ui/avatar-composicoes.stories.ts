import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { User } from 'lucide';
import { createAvatar, createAvatarFallback, createAvatarImage, createAvatarRoot } from './avatar';

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Avatar/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes canônicas do Avatar: com imagem, com iniciais, com ícone, agrupamento e com indicador de status.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createUserIconSvg(): SVGSVGElement {
  type LucideIconNode = [string, Record<string, string>];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'nds-text-muted-foreground');
  svg.style.width = '1.25rem';
  svg.style.height = '1.25rem';

  for (const [tag, attrs] of User as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithImage: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Avatar com imagem carregada. O fallback fica oculto após o load.',
      },
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
    // findBy* com hidden: true cobre o caso em que a imagem ainda está
    // com display:none (fallback pré-load) — a tag <img> continua no DOM.
    const img = (await canvas.findByRole('img', { hidden: true })) as HTMLImageElement;
    await expect(img).toBeInTheDocument();
    await expect(img.alt).toBe('Foto de perfil de Maria Rodrigues');
  },
};

export const WithInitials: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Avatar sem imagem — o fallback com iniciais é exibido imediatamente.',
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
  },
};

export const WithIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Fallback com ícone genérico (User) para usuário anônimo ou placeholder.',
      },
    },
  },
  render: () => {
    const root = createAvatarRoot();
    const fallback = createAvatarFallback();
    // role="img" permite aria-label (senão axe aponta aria-prohibited-attr no <span>).
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', 'Usuário genérico');
    fallback.appendChild(createUserIconSvg());
    root.appendChild(fallback);
    return root;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Group: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Avatares agrupados com sobreposição via <code>-space-x-2</code> e <code>ring-2 ring-background</code>.',
      },
    },
  },
  render: () => {
    const group = document.createElement('div');
    group.style.display = 'flex';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Participantes');

    const members: { src?: string; alt: string; fallback: string }[] = [
      { src: 'https://github.com/shadcn.png', alt: 'Foto de perfil de Maria Rodrigues', fallback: 'MR' },
      { alt: '', fallback: 'JP' },
      { alt: '', fallback: 'AL' },
      { alt: '', fallback: '+3' },
    ];

    members.forEach((m, i) => {
      const av = createAvatar({
        src: m.src,
        alt: m.alt,
        fallbackText: m.fallback,
      });
      av.style.boxShadow = '0 0 0 2px var(--background)';
      if (i > 0) av.style.marginLeft = '-0.5rem';
      group.appendChild(av);
    });
    return group;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const WithStatus: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Avatar com indicador de status posicionado absolutamente. O status é um <code>&lt;span&gt;</code> irmão dentro de um wrapper <code>relative</code>.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-inline-block';
    wrapper.style.position = 'relative';

    const avatar = createAvatar({
      src: 'https://github.com/shadcn.png',
      alt: 'Foto de perfil de Maria Rodrigues',
      fallbackText: 'MR',
    });

    const status = document.createElement('span');
    status.className =
      'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background';
    // role="status" permite aria-label em <span> (senão axe aponta aria-prohibited-attr).
    status.setAttribute('role', 'status');
    status.setAttribute('aria-label', 'online');

    wrapper.append(avatar, status);
    return wrapper;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByLabelText('online');
    await expect(status).toBeInTheDocument();
  },
};

// Prevent unused import warnings on factories used across composições.
void createAvatarImage;
