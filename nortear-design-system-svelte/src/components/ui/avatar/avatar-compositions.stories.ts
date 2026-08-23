import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import { Avatar } from './index';
import AvatarStory from './AvatarStory.svelte';
import {
  avatarWithStatusSource,
  avatarGroupSource,
  avatarIconSource,
  avatarIniciaisSource,
  avatarSource,
} from './avatar.source';

const meta: Meta = {
  title: 'UI/Avatar/Compositions',
  component: Avatar,
  tags: ['display'],
  parameters: {
    design: [figmaDesign('avatar', 'Avatar'), figmaDesign('avatarGroup', 'Grupo')],
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para a story de imagem, que é a composição canônica; as
      // outras quatro sobrescrevem com a sua própria marcação.
      source: { transform: avatarSource },
      description: {
        component:
          'Composicoes do Avatar: imagem, iniciais, ícone, agrupamento e com indicador de status.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithImage: Story = {
  parameters: { covers: ['functional.item1', 'accessibility.item1'] },
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'image',
      src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
      alt: 'Foto de perfil de Maria Rodrigues',
      initials: 'MR',
    },
  }),

  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="avatar"]');
    await expect(root).not.toBeNull();
    // accessibility.item1 — quem identifica a pessoa é o alt da imagem.
    await waitFor(async () => {
      const img = canvasElement.querySelector<HTMLImageElement>('[data-slot="avatar-image"]');
      await expect(img).not.toBeNull();
      await expect(img!.alt).toBe('Foto de perfil de Maria Rodrigues');
    }, { timeout: 5000 });
    // Sem duplicação de voz, e sem aria-hidden: quando a foto aparece o
    // componente já tira o fallback da árvore de acessibilidade (remove do DOM
    // ou o oculta), então o atributo não evitava nada — e deixava o avatar MUDO
    // no estado em que o fallback é o único conteúdo. Ver a story Failed.
    // O waitFor gateia na CARGA, não no relógio: enquanto a foto não chega, o
    // fallback está na tela de propósito. Sem ele o passo passava por acidente
    // nas stacks cujo fallback tem delayMs — ainda nem existia no DOM.
    await waitFor(async () => {
      const fallback = canvasElement.querySelector<HTMLElement>('[data-slot="avatar-fallback"]');
      const arvoreOutside =
        !fallback ||
        getComputedStyle(fallback).display === 'none' ||
        getComputedStyle(fallback).visibility === 'hidden' ||
        fallback.getBoundingClientRect().height === 0;
      await expect(arvoreOutside).toBe(true);
    }, { timeout: 5000 });
  },
};

export const WithInitials: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    docs: { source: { transform: avatarIniciaisSource } },
  },
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'initials',
      initials: 'JP',
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // functional.item3 — sem imagem, o fallback aparece na hora, sem espera.
    await expect(canvas.getByText('JP')).toBeVisible();
    const root = canvasElement.querySelector('[data-slot="avatar"]');
    await expect(root!.querySelector('img')).toBeNull();
  },
};

export const WithIcon: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: avatarIconSource } },
  },
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'icon',
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // O nome acessível vem do rótulo, não do ícone: svg decorativo não fala.
    const fallback = canvas.getByRole('img', { name: /Usuário genérico/i });
    await expect(fallback).toBeVisible();
    const icone = fallback.querySelector('svg');
    await expect(icone).not.toBeNull();
    await expect(icone).toHaveAttribute('aria-hidden', 'true');
  },
};

export const Group: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: { source: { transform: avatarGroupSource } },
  },
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'group',
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: /Participantes/i });
    const avatares = Array.from(group.querySelectorAll('[data-slot="avatar"]'));
    await expect(avatares.length).toBe(3);

    // functional.item5 — a sobreposição é o que a composição promete. Medir a
    // posição prova o recuo; a asserção anterior conferia a classe do Tailwind,
    // que saiu do projeto e não empurrava nada.
    const first = avatares[0].getBoundingClientRect();
    const segundo = avatares[1].getBoundingClientRect();
    await expect(segundo.left).toBeLessThan(first.right);

    // O contador fecha a fila e sobrepõe igual.
    const counter = group.querySelector('[data-slot="avatar-group-count"]');
    await expect(counter).not.toBeNull();
    await expect(counter!.textContent).toBe('+3');
    const rc = counter!.getBoundingClientRect();
    await expect(rc.left).toBeLessThan(avatares[2].getBoundingClientRect().right);
  },
};

export const WithStatus: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: avatarWithStatusSource } },
  },
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'withStatus',
      src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
      alt: 'Foto de perfil de Maria Rodrigues',
      initials: 'MR',
      statusLabel: 'Online',
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByRole('img', { name: /Online/i });
    const root = canvasElement.querySelector('[data-slot="avatar"]')!;

    const rb = badge.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    await expect(rb.width).toBeGreaterThan(0);
    // Canto inferior direito, dentro do avatar.
    await expect(Math.abs(rb.right - rr.right)).toBeLessThan(2);
    await expect(Math.abs(rb.bottom - rr.bottom)).toBeLessThan(2);

    // elementFromPoint e não getBoundingClientRect sozinho: recorte não muda
    // layout. Enquanto o root tinha overflow:hidden, o ponto ficava com a caixa
    // certa e sem pintura nenhuma — invisível, e nenhuma medida acusava.
    const target = document.elementFromPoint(rb.left + rb.width / 2, rb.top + rb.height / 2);
    await expect(badge.contains(target)).toBe(true);
  },
};
