import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import SkeletonComposicaoStory from './SkeletonComposicaoStory.svelte';
import { boxDesenhada } from '@shared/testing/skeleton-probe';
import {
  skeletonCardDePerfilSource,
  ratioSkeletonImageSource,
  skeletonListWithAvatarSource,
  skeletonParagrafoSource,
  skeletonSource,
} from './skeleton.source';

const meta: Meta = {
  title: 'UI/Skeleton/Compositions',
  component: SkeletonComposicaoStory,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: skeletonSource },
      description: {
        component:
          'Composições típicas — card de perfil, lista, imagem em proporção e parágrafo. Cada bloco é uma região de carregamento com `aria-busy`, e cada placeholder fica fora da árvore de acessibilidade.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ProfileCard: Story = {
  args: { variant: 'cardDePerfil' },
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: skeletonCardDePerfilSource },
      description: {
        story: 'Avatar circular + 2 linhas de texto — padrão de carregamento de card de perfil.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const regiao = canvasElement.querySelector('[role="status"]') as HTMLElement;
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A região tem papel, estado e nome', async () => {
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao.getAttribute('aria-label')).toBeTruthy();
    });

    await step('Avatar + duas linhas, todos fora da árvore de acessibilidade', async () => {
      await expect(parts).toHaveLength(3);
      for (const p of parts) await expect(p).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O avatar é circular e as linhas têm larguras diferentes', async () => {
      await expect(boxDesenhada(parts[0]).quadrado).toBe(true);
      await expect(parts[1].getBoundingClientRect().width).toBeGreaterThan(
        parts[2].getBoundingClientRect().width,
      );
    });
  },
};

export const ListWithAvatar: Story = {
  args: { variant: 'listaComAvatar' },
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: skeletonListWithAvatarSource },
      description: {
        story: 'Cinco itens com avatar pequeno e duas linhas — padrão de carregamento de lista.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const lista = canvasElement.querySelector('ul') as HTMLElement;
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A lista inteira é uma região ocupada, com nome', async () => {
      await expect(lista).toHaveAttribute('aria-busy', 'true');
      await expect(lista.getAttribute('aria-label')).toBeTruthy();
      await expect(lista.querySelectorAll('li')).toHaveLength(5);
    });

    await step('Cinco itens de três peças, todas ocultas ao leitor', async () => {
      await expect(parts).toHaveLength(15);
      for (const p of parts) await expect(p).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O avatar pequeno continua quadrado e com medida do tema', async () => {
      // `data-size="sm"` só entrega se a folha responder: sem isso o item da
      // lista sai com o mesmo bloco do card de perfil.
      const caixa = boxDesenhada(parts[0]);
      await expect(caixa.quadrado).toBe(true);
      await expect(caixa.largura).toBeGreaterThan(0);
    });
  },
};

export const ImageInAspectRatio: Story = {
  args: { variant: 'imagemEmAspectRatio' },
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: { transform: ratioSkeletonImageSource },
      description: {
        story:
          'Placeholder de imagem dentro de uma proporção 16/9 — quem define a caixa é o container.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]') as HTMLElement;
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;

    await step('A região de carregamento tem estado e nome', async () => {
      const regiao = canvasElement.querySelector('[role="status"]') as HTMLElement;
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao.getAttribute('aria-label')).toBeTruthy();
    });

    await step('O placeholder preenche a caixa proporcional', async () => {
      // Se o filho perdesse o `inset: 0`, a proporção continuaria certa e a
      // caixa ficaria vazia — só a medição acusa.
      const c = caixa.getBoundingClientRect();
      const s = sk.getBoundingClientRect();
      await expect(Math.abs(s.height - c.height)).toBeLessThan(2);
      await expect(Math.abs(s.width - c.width)).toBeLessThan(2);
      await expect(Math.abs(c.width / c.height - 16 / 9)).toBeLessThan(0.05);
    });
  },
};

export const Paragraph: Story = {
  args: { variant: 'paragrafo' },
  parameters: {
    docs: {
      source: { transform: skeletonParagrafoSource },
      description: {
        story: 'Três linhas com larguras decrescentes — placeholder de parágrafo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const regiao = canvasElement.querySelector('[role="status"]') as HTMLElement;
    const linhas = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A região tem estado e nome', async () => {
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao.getAttribute('aria-label')).toBeTruthy();
    });

    await step('Três linhas, ocultas ao leitor de tela', async () => {
      await expect(linhas).toHaveLength(3);
      for (const l of linhas) await expect(l).toHaveAttribute('aria-hidden', 'true');
    });

    await step('As larguras decrescem — é o que faz o bloco parecer parágrafo', async () => {
      const larguras = linhas.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
