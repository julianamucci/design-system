import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, waitFor } from 'storybook/test';
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge } from './index';
import {
  avatarComIconeSource,
  avatarWithImageSource,
  avatarWithIniciaisSource,
  avatarComStatusSource,
  avatarGrupoSource,
} from './avatar.source';

const IMG_MARIA =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces';
const IMG_SECOND =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces';
const IMG_THIRD =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=faces';

const meta = {
  title: 'UI/Avatar/Compositions',
  component: Avatar,
  tags: ['display'],
  parameters: {
    design: [figmaDesign('avatar', 'Avatar'), figmaDesign('avatarGroup', 'Grupo')],
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: avatarWithImageSource },
      description: {
        component:
          'Composicoes canônicas do Avatar: com imagem, com iniciais, com ícone, agrupamento e com indicador de status.',
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item1'],
  },
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup: () => ({ IMG_MARIA }),
    template: `
      <Avatar>
        <AvatarImage :src="IMG_MARIA" alt="Foto de perfil de Maria Rodrigues" />
        <AvatarFallback :delay-ms="600">MR</AvatarFallback>
      </Avatar>
    `,
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
      const foraDaArvore =
        !fallback ||
        getComputedStyle(fallback).display === 'none' ||
        getComputedStyle(fallback).visibility === 'hidden' ||
        fallback.getBoundingClientRect().height === 0;
      await expect(foraDaArvore).toBe(true);
    }, { timeout: 5000 });
  },
};

export const WithInitials: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    // Sem imagem: some o subcomponente e some o import — a do meta traz os dois.
    docs: { source: { transform: avatarWithIniciaisSource } },
  },
  render: () => ({
    components: { Avatar, AvatarFallback },
    template: `
      <Avatar>
        <AvatarFallback>JP</AvatarFallback>
      </Avatar>
    `,
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
    // O conteúdo de reserva deixa de ser texto e passa a carregar papel e
    // rótulo próprios, com o ícone decorativo dentro.
    docs: { source: { transform: avatarComIconeSource } },
  },
  render: () => ({
    components: { Avatar, AvatarFallback },
    template: `
      <Avatar>
        <AvatarFallback role="img" aria-label="Usuário genérico">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="nds-icon-lg">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </AvatarFallback>
      </Avatar>
    `,
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
    // Três avatares dentro de um agrupador, com texto alternativo vazio e um
    // contador ao fim: composição inteira que a do meta não mostra.
    docs: { source: { transform: avatarGrupoSource } },
  },
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount },
    setup: () => ({ IMG_MARIA, IMG_SECOND, IMG_THIRD }),
    template: `
      <AvatarGroup role="group" aria-label="Participantes">
        <Avatar>
          <AvatarImage :src="IMG_MARIA" alt="" />
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage :src="IMG_SECOND" alt="" />
          <AvatarFallback>JP</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage :src="IMG_THIRD" alt="" />
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        <AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>
      </AvatarGroup>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grupo = canvas.getByRole('group', { name: /Participantes/i });
    const avatares = Array.from(grupo.querySelectorAll('[data-slot="avatar"]'));
    await expect(avatares.length).toBe(3);

    // functional.item5 — a sobreposição é o que a composição promete. Medir a
    // posição prova o recuo; a asserção anterior conferia a classe do Tailwind,
    // que saiu do projeto e não empurrava nada.
    const primeiro = avatares[0].getBoundingClientRect();
    const segundo = avatares[1].getBoundingClientRect();
    await expect(segundo.left).toBeLessThan(primeiro.right);

    // O contador fecha a fila e sobrepõe igual.
    const contador = grupo.querySelector('[data-slot="avatar-group-count"]');
    await expect(contador).not.toBeNull();
    await expect(contador!.textContent).toBe('+3');
    const rc = contador!.getBoundingClientRect();
    await expect(rc.left).toBeLessThan(avatares[2].getBoundingClientRect().right);
  },
};

export const WithStatus: Story = {
  parameters: {
    covers: ['visual.item4'],
    // Entra um terceiro filho, com papel e rótulo próprios — sub-composição
    // que a do meta esconderia.
    docs: { source: { transform: avatarComStatusSource } },
  },
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback, AvatarBadge },
    setup: () => ({ IMG_MARIA }),
    template: `
      <Avatar>
        <AvatarImage :src="IMG_MARIA" alt="Foto de perfil de Maria Rodrigues" />
        <AvatarFallback>MR</AvatarFallback>
        <AvatarBadge role="img" aria-label="Online" />
      </Avatar>
    `,
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
    const alvo = document.elementFromPoint(rb.left + rb.width / 2, rb.top + rb.height / 2);
    await expect(badge.contains(alvo)).toBe(true);
  },
};
