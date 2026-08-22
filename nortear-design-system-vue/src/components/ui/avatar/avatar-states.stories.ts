import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, waitFor } from 'storybook/test';
import { Avatar, AvatarImage, AvatarFallback } from './index';
import {
  avatarCarregadoSource,
  avatarLoadingSource,
  avatarNoImageSource,
} from './avatar.source';

const IMG_MARIA =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces';

// src garantidamente inválido para forçar o estado failed
const IMG_BROKEN = 'https://example.invalid/broken-avatar.jpg';

const meta = {
  title: 'UI/Avatar/States',
  component: Avatar,
  tags: ['display'],
  parameters: {
    design: figmaDesign('avatar'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: avatarCarregadoSource },
      description: {
        component:
          'Configuracoes do Avatar conforme o ciclo de carregamento da imagem: loaded, loading (com atraso), failed e noImage.',
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup: () => ({ IMG_MARIA }),
    template: `
      <Avatar>
        <AvatarImage :src="IMG_MARIA" alt="Foto de perfil de Maria Rodrigues" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement }) => {
    // functional.item1 — carregada a imagem, ela é o que fica; o fallback sai.
    await waitFor(async () => {
      const img = canvasElement.querySelector<HTMLImageElement>('[data-slot="avatar-image"]');
      await expect(img).not.toBeNull();
      await expect(img!.alt).toBe('Foto de perfil de Maria Rodrigues');
    }, { timeout: 5000 });
    // Quem está pintado no centro é a imagem: uma stack remove o fallback do
    // DOM, outra só o esconde, e a promessa das duas é a mesma — depois do load
    // é a foto que aparece.
    const root = canvasElement.querySelector('[data-slot="avatar"]')!;
    await waitFor(async () => {
      const r = root.getBoundingClientRect();
      const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      await expect(alvo && alvo.closest('[data-slot="avatar-image"]')).not.toBeNull();
    }, { timeout: 5000 });
  },
};

export const Loading: Story = {
  name: 'Loading (600ms delay)',
  parameters: {
    covers: ['functional.item4'],
    // O prazo no conteúdo de reserva é o assunto, e a do meta não o tem.
    docs: { source: { transform: avatarLoadingSource } },
  },
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup: () => ({ IMG_BROKEN }),
    template: `
      <Avatar>
        <AvatarImage :src="IMG_BROKEN" alt="Foto de perfil de Maria Rodrigues" />
        <AvatarFallback :delay-ms="600">MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // functional.item4 — o atraso segura as iniciais e depois as entrega. A
    // janela ANTES do prazo não é asserida de propósito: ela é transitória e o
    // replay do painel roda no mesmo DOM, já com o prazo vencido.
    await waitFor(async () => {
      await expect(canvas.getByText('MR')).toBeVisible();
    }, { timeout: 3000 });
  },
};

// Sem override de source de propósito: a marcação da falha é IDÊNTICA à do
// carregamento — quem decide entre foto e conteúdo de reserva é o componente,
// não uma prop. A do meta é exatamente o que se escreve aqui.
export const Failed: Story = {
  parameters: { covers: ['functional.item2', 'accessibility.item2'] },
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup: () => ({ IMG_BROKEN }),
    template: `
      <Avatar>
        <AvatarImage :src="IMG_BROKEN" alt="Foto de perfil de Maria Rodrigues" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // functional.item2 — com src inválido o fallback fica, e a imagem não entra.
    await waitFor(async () => {
      await expect(canvas.getByText('MR')).toBeVisible();
    }, { timeout: 5000 });
    // A imagem não pode estar por cima: uma stack tira o <img> do DOM no erro,
    // outra o mantém escondido. O que vale nas duas é quem está pintado no
    // centro do avatar — e é isso que o leitor vê.
    const root = canvasElement.querySelector('[data-slot="avatar"]')!;
    const r = root.getBoundingClientRect();
    const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    await expect(alvo && alvo.closest('[data-slot="avatar-image"]')).toBeNull();

    // accessibility.item2 — com a foto fora, o fallback é o ÚNICO conteúdo do
    // avatar. Marcá-lo com aria-hidden (que a regra antiga do conteúdo
    // compartilhado mandava fazer) deixava o avatar sem nome acessível nenhum:
    // a imagem sai da árvore junto com a foto, e as iniciais ficavam mudas.
    // Medido pela sonda nas cinco stacks.
    const fallbackFinal = canvasElement.querySelector<HTMLElement>('[data-slot="avatar-fallback"]');
    await expect(fallbackFinal).not.toBeNull();
    await expect(fallbackFinal).not.toHaveAttribute('aria-hidden', 'true');
    await expect(fallbackFinal).toHaveTextContent('MR');
  },
};

export const NoImage: Story = {
  parameters: {
    covers: ['functional.item3'],
    // Não há imagem: some o subcomponente, some o import, e o conteúdo de
    // reserva passa a carregar o papel e o rótulo do avatar.
    docs: { source: { transform: avatarNoImageSource } },
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
    // functional.item3 — sem imagem o fallback é imediato, sem espera nenhuma.
    const fallback = canvas.getByRole('img', { name: /Usuário genérico/i });
    await expect(fallback).toBeVisible();
    await expect(fallback.querySelector('svg')).not.toBeNull();
    await expect(canvasElement.querySelector('img')).toBeNull();
  },
};
