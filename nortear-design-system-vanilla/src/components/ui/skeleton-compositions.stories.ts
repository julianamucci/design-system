import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createSkeleton } from './skeleton';
import { regiaoDeCarregamento } from './skeleton.fixtures';
import {
  skeletonSource,
  skeletonSourceCom,
  skeletonSourceEmProporcao,
  skeletonSourceLista,
  skeletonSourcePerfil,
} from './skeleton.source';
import { createAspectRatio } from './aspect-ratio';
import { caixaDesenhada } from '@shared/testing/skeleton-probe';

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Skeleton/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
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

function bloco(className: string, spacing: string): HTMLElement {
  const el = document.createElement('div');
  el.className = className;
  el.dataset.spacing = spacing;
  return el;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ProfileCard: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // O arranjo é o assunto: peça redonda ao lado do bloco de linhas.
      source: { transform: skeletonSourcePerfil() },
      description: {
        story: 'Avatar circular + 2 linhas de texto — padrão de carregamento de card de perfil.',
      },
    },
  },
  render: () => {
    const wrap = regiaoDeCarregamento(
      'Carregando card de perfil',
      'nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm',
    );
    wrap.dataset.align = 'center';
    wrap.dataset.spacing = 'md';

    wrap.appendChild(createSkeleton({ shape: 'avatar' }));

    const linhas = bloco('nds-stack nds-flex-1', 'sm');
    linhas.appendChild(createSkeleton({ shape: 'text', width: '2-3' }));
    linhas.appendChild(createSkeleton({ shape: 'text', width: '1-2' }));
    wrap.appendChild(linhas);

    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;
    const pecas = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A região tem papel, estado e nome', async () => {
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao.getAttribute('aria-label')).toBeTruthy();
    });

    await step('Avatar + duas linhas, todos fora da árvore de acessibilidade', async () => {
      await expect(pecas).toHaveLength(3);
      for (const p of pecas) await expect(p).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O avatar é circular e as linhas têm larguras diferentes', async () => {
      await expect(caixaDesenhada(pecas[0]).quadrado).toBe(true);
      await expect(pecas[1].getBoundingClientRect().width).toBeGreaterThan(
        pecas[2].getBoundingClientRect().width,
      );
    });
  },
};

export const ListWithAvatar: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // A região é a LISTA inteira: uma por item repetiria o aviso cinco vezes.
      source: { transform: skeletonSourceLista() },
      description: {
        story: 'Cinco itens com avatar pequeno e duas linhas — padrão de carregamento de lista.',
      },
    },
  },
  render: () => {
    const lista = document.createElement('ul');
    lista.className = 'nds-stack nds-list-none nds-p-0 nds-w-md';
    lista.dataset.spacing = 'md';
    lista.setAttribute('aria-busy', 'true');
    lista.setAttribute('aria-label', 'Carregando lista de pedidos');

    for (let i = 0; i < 5; i++) {
      const item = document.createElement('li');
      item.className = 'nds-cluster';
      item.dataset.align = 'center';
      item.dataset.spacing = 'sm';

      item.appendChild(createSkeleton({ shape: 'avatar', size: 'sm' }));

      const texto = bloco('nds-stack nds-flex-1', 'xs');
      texto.appendChild(createSkeleton({ shape: 'text', width: '2-3' }));
      texto.appendChild(createSkeleton({ shape: 'text', width: '1-3' }));
      item.appendChild(texto);

      lista.appendChild(item);
    }

    return lista;
  },
  play: async ({ canvasElement, step }) => {
    const lista = canvasElement.querySelector<HTMLElement>('ul')!;
    const pecas = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('A lista inteira é uma região ocupada, com nome', async () => {
      await expect(lista).toHaveAttribute('aria-busy', 'true');
      await expect(lista.getAttribute('aria-label')).toBeTruthy();
      await expect(lista.querySelectorAll('li')).toHaveLength(5);
    });

    await step('Cinco itens de três peças, todas ocultas ao leitor', async () => {
      await expect(pecas).toHaveLength(15);
      for (const p of pecas) await expect(p).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O avatar pequeno continua quadrado e com medida do tema', async () => {
      // `data-size="sm"` só entrega se a folha responder: sem isso o item da
      // lista sai com o mesmo bloco do card de perfil.
      const caixa = caixaDesenhada(pecas[0]);
      await expect(caixa.quadrado).toBe(true);
      await expect(caixa.largura).toBeGreaterThan(0);
    });
  },
};

export const ImageInAspectRatio: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: { transform: skeletonSourceEmProporcao() },
      description: {
        story:
          'Placeholder de imagem dentro de uma proporção 16/9 — quem define a caixa é o container.',
      },
    },
  },
  render: () => {
    const wrap = regiaoDeCarregamento('Carregando imagem', 'nds-w-sm');
    wrap.appendChild(
      createAspectRatio({ ratio: 16 / 9, content: createSkeleton({ shape: 'fill' }) }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const caixa = canvasElement.querySelector<HTMLElement>('[data-slot="aspect-ratio"]')!;
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step('A região de carregamento tem estado e nome', async () => {
      const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;
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
  parameters: {
    docs: {
      source: {
        transform: skeletonSourceCom({
          regionLabel: 'Carregando parágrafo',
          linhas: [
            { shape: 'text', width: 'full' },
            { shape: 'text', width: '3-4' },
            { shape: 'text', width: '1-2' },
          ],
        }),
      },
      description: {
        story: 'Três linhas com larguras decrescentes — placeholder de parágrafo.',
      },
    },
  },
  render: () => {
    const wrap = regiaoDeCarregamento('Carregando parágrafo', 'nds-stack nds-w-sm');
    wrap.dataset.spacing = 'sm';
    for (const width of ['full', '3-4', '1-2'] as const) {
      wrap.appendChild(createSkeleton({ shape: 'text', width }));
    }
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;
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
