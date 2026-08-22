import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createAvatar, createAvatarFallback, createAvatarRoot } from './avatar';
import { IMG_MARIA } from './avatar.fixtures';
import { avatarGranularSourceWith, avatarSource, avatarSourceWith } from './avatar.source';

// src garantidamente inválido para forçar o estado failed
const IMG_BROKEN = 'https://example.invalid/broken-avatar.jpg';

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Avatar/States',
  parameters: {
    design: figmaDesign('avatar'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: avatarSource },
      description: {
        component:
          'Configuracoes do Avatar conforme o ciclo de carregamento da imagem: loaded, loading (com atraso), failed e noImage.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Loaded: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: {
      description: { story: 'Imagem válida — AvatarImage visível; fallback oculto após load.' },
    },
  },
  render: () => {
    const av = createAvatar({
      src: IMG_MARIA,
      alt: 'Foto de perfil de Maria Rodrigues',
      fallbackText: 'MR',
    });
    return av;
  },
  play: async ({ canvasElement }) => {
    // functional.item1 — carregada a imagem, ela é o que fica; o fallback sai.
    const img = canvasElement.querySelector<HTMLImageElement>('[data-slot="avatar-image"]');
    await expect(img).not.toBeNull();
    await expect(img!.alt).toBe('Foto de perfil de Maria Rodrigues');
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
    // Override de story: o atraso É o assunto, e ele não passa por control
    // neste arquivo. O `src` quebrado fica de fora — ele existe para o teste
    // alcançar o prazo, não é recomendação.
    docs: {
      source: { transform: avatarSourceWith({ delayMs: 600, src: IMG_MARIA }) },
      description: {
        story:
          'Com atraso configurado, as iniciais só entram se o carregamento passar do prazo — é o que evita o piscar em imagem rápida.',
      },
    },
  },
  render: () =>
    createAvatar({
      src: IMG_BROKEN,
      alt: 'Foto de perfil de Maria Rodrigues',
      fallbackText: 'MR',
      delayMs: 600,
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

export const Failed: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item2'],
    docs: {
      description: {
        story:
          'src inválido — o handler onerror do AvatarImage oculta a imagem e revela o fallback.',
      },
    },
  },
  render: () =>
    createAvatar({
      src: IMG_BROKEN,
      alt: 'Foto de perfil de Maria Rodrigues',
      fallbackText: 'MR',
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
    // Override de story: sem foto não há o que reconciliar, e a story monta o
    // avatar pelas fábricas granulares — outra FORMA, não outra opção.
    docs: {
      source: { transform: avatarGranularSourceWith({ fallback: 'JP' }) },
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
    // functional.item3 — sem imagem o fallback é imediato, sem espera nenhuma.
    await expect(canvas.getByText('JP')).toBeVisible();
    await expect(canvasElement.querySelector('img')).toBeNull();
  },
};
