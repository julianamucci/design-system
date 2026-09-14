import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import SkeletonComposicaoStory from './SkeletonComposicaoStory.svelte';
import { boxDesenhada, heightAgainstToken } from '@shared/testing/skeleton-probe';
import {
  skeletonCardDePerfilSource,
  ratioSkeletonImageSource,
  skeletonListWithAvatarSource,
  skeletonParagrafoSource,
  skeletonSource,
} from './skeleton.source';

const meta: Meta = {
  title: 'Components/Feedback/Skeleton/Compositions',
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
          'Composições típicas — card de perfil, lista, imagem em proporção e parágrafo. Cada bloco é uma peça de região de carregamento, e cada placeholder fica fora da árvore de acessibilidade.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** A peça de região da story, com papel, estado fixo e nome. */
async function expectRegion(canvasElement: HTMLElement): Promise<HTMLElement> {
  const regiao = canvasElement.querySelector('[data-slot="skeleton-region"]') as HTMLElement;
  await expect(regiao).not.toBeNull();
  await expect(regiao).toHaveAttribute('role', 'status');
  await expect(regiao).toHaveAttribute('aria-busy', 'true');
  await expect(regiao.getAttribute('aria-label')).toBeTruthy();
  return regiao;
}

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
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A região tem papel, estado e nome', async () => {
      await expectRegion(canvasElement);
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
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A lista inteira está dentro de UMA região ocupada, com nome', async () => {
      const regiao = await expectRegion(canvasElement);
      await expect(canvasElement.querySelectorAll('[data-slot="skeleton-region"]')).toHaveLength(1);
      const list = regiao.querySelector('ul') as HTMLElement;
      await expect(list).not.toBeNull();
      await expect(list).toHaveAttribute('role', 'list');
      await expect(list.querySelectorAll('li')).toHaveLength(5);
    });

    await step('A lista não carrega estado nem nome — isso é da região', async () => {
      const list = canvasElement.querySelector('ul') as HTMLElement;
      await expect(list).not.toHaveAttribute('aria-busy');
      await expect(list).not.toHaveAttribute('aria-label');
    });

    await step('Cinco itens de três peças, todas ocultas ao leitor', async () => {
      await expect(parts).toHaveLength(15);
      for (const p of parts) await expect(p).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O avatar pequeno continua quadrado e com medida do tema', async () => {
      // `data-size="sm"` só entrega se a folha responder: sem isso o item da
      // lista sai com o mesmo bloco do card de perfil.
      const box = boxDesenhada(parts[0]);
      await expect(box.quadrado).toBe(true);
      await expect(box.width).toBeGreaterThan(0);
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
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]') as HTMLElement;
    const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;

    await step('A região de carregamento tem papel, estado e nome', async () => {
      await expectRegion(canvasElement);
    });

    await step('O placeholder preenche a caixa proporcional', async () => {
      // Se o filho perdesse o `inset: 0`, a proporção continuaria certa e a
      // caixa ficaria vazia — só a medição acusa.
      const c = box.getBoundingClientRect();
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
    covers: ['functional.item2', 'functional.item3', 'functional.item4'],
    docs: {
      source: { transform: skeletonParagrafoSource },
      description: {
        story: 'Três linhas com larguras decrescentes — placeholder de parágrafo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const lines = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    // functional.item4: a região expõe papel, estado e nome acessível.
    let regiao!: HTMLElement;
    await step('A região tem papel, estado e nome', async () => {
      regiao = await expectRegion(canvasElement);
      await expect(regiao).toHaveAccessibleName('Carregando parágrafo');
    });

    // functional.item3: dentro da região, cada placeholder sai da árvore.
    await step('Três linhas dentro da região, ocultas ao leitor de tela', async () => {
      await expect(lines).toHaveLength(3);
      for (const l of lines) {
        await expect(regiao.contains(l)).toBe(true);
        await expect(l).toHaveAttribute('aria-hidden', 'true');
      }
    });

    // functional.item2: a caixa sai do atributo — altura da escada e fração.
    await step('Cada linha tem a altura do token de texto', async () => {
      for (const l of lines) {
        const { token, height, expected } = heightAgainstToken(l);
        await expect(Math.abs(height - expected), `altura contra ${token}`).toBeLessThanOrEqual(0.5);
      }
    });

    await step('As larguras decrescem — é o que faz o bloco parecer parágrafo', async () => {
      const larguras = lines.map((l) => l.getBoundingClientRect().width);
      await expect(larguras[0]).toBeGreaterThan(larguras[1]);
      await expect(larguras[1]).toBeGreaterThan(larguras[2]);
    });
  },
};
