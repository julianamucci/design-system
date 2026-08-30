import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSkeleton } from './skeleton';
import {
  animationAtiva,
  boxDesenhada,
  backgroundDistincao,
  ligarMovimentoReduzido,
} from '@shared/testing/skeleton-probe';

const meta: Meta = {
  title: 'Primitives/Feedback/Skeleton/States',
  tags: ['feedback'],
  decorators: [moduleMetadata({ imports: [NdsSkeleton] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Pulsing: Story = {
  parameters: { covers: ['functional.item1', 'accessibility.item5'] },
  render: () => ({
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando conteúdo" class="nds-stack nds-w-sm" data-spacing="sm">
        <div ndsSkeleton data-shape="text" data-width="full"></div>
        <div ndsSkeleton data-shape="text" data-width="3-4"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;

    await step('A classe base entrega pulso e raio', async () => {
      await expect(animationAtiva(sk)).toBe(true);
      await expect(getComputedStyle(sk).borderRadius).not.toBe('0px');
    });

    await step('O placeholder se distingue do fundo do container', async () => {
      // Não é critério de contraste — o esqueleto não transmite informação. O
      // piso pega o caso degenerado: token trocado ou opacidade zerada fazem o
      // placeholder sumir, e o carregamento deixa de ser visível.
      const { ratio } = backgroundDistincao(sk);
      await expect(ratio).toBeGreaterThan(1.05);
    });
  },
};

export const CustomDimension: Story = {
  parameters: { covers: ['functional.item2', 'functional.item3'] },
  render: () => ({
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando perfil" class="nds-cluster nds-w-sm" data-align="center" data-spacing="sm">
        <div ndsSkeleton data-shape="avatar"></div>
        <!-- nds-flex-1 não é enfeite: sem base de largura o bloco encolhe para
             o conteúdo, as linhas em porcentagem resolvem para zero e o
             esqueleto some. Foi o que a medição de largura acusou aqui. -->
        <div class="nds-stack nds-flex-1" data-spacing="xs">
          <div ndsSkeleton data-shape="text" data-width="2-3"></div>
          <div ndsSkeleton data-shape="text" data-width="1-2"></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];

    await step('O avatar é um quadrado com medida do tema', async () => {
      // A medida vem de `data-shape=avatar` -> escada --size-*, que responde à
      // densidade. Se o atributo sumir, o esqueleto colapsa para zero e só a
      // medição acusa.
      const box = boxDesenhada(parts[0]);
      await expect(box.quadrado).toBe(true);
      // Sem número mágico: a medida vem da escada --size-*, que muda por
      // densidade. Afirmar '40px' amarraria o teste ao tema padrão.
      await expect(box.width).toBeGreaterThan(0);
    });

    await step('As duas linhas seguem a fração de largura declarada', async () => {
      await expect(parts[1].getBoundingClientRect().width).toBeGreaterThan(
        parts[2].getBoundingClientRect().width,
      );
    });

    await step('Todos os esqueletos ficam fora da árvore de acessibilidade', async () => {
      await expect(parts).toHaveLength(3);
      for (const sk of parts) await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const BusyContainer: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item3'] },
  render: () => ({
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando resultados" class="nds-stack" data-spacing="sm">
        <div ndsSkeleton data-shape="text" data-width="full"></div>
        <div ndsSkeleton data-shape="text" data-width="3-4"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O container é uma região anunciável com nome', async () => {
      // `aria-busy` sozinho num <div> sem role não é anunciado, e `aria-label`
      // em div sem role é violação de ARIA — o par role+label é o que faz o
      // leitor dizer "carregando resultados".
      const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;
      await expect(regiao).toHaveAttribute('aria-busy', 'true');
      await expect(regiao.getAttribute('aria-label')).toBeTruthy();
    });

    await step('Os esqueletos são filhos da região ocupada', async () => {
      const regiao = canvasElement.querySelector<HTMLElement>('[role="status"]')!;
      await expect(regiao.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2);
    });
  },
};

export const ReducedMotion: Story = {
  parameters: { covers: ['functional.item5', 'accessibility.item4'] },
  render: () => ({
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando" class="nds-stack nds-w-sm" data-spacing="sm">
        <div ndsSkeleton data-shape="text" data-width="3-4"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
    // Cada passo estabelece a própria precondição: o desfazer roda no finally
    // para a story seguinte (e a foto do Chromatic) não herdarem a marca.
    const desfazer = ligarMovimentoReduzido(canvasElement.ownerDocument);
    try {
      await step('Com movimento reduzido, o pulso é desligado', async () => {
        // O toolbar "Motion" escreve `data-reduced-motion` no <html> e o
        // motion.css zera as durações. Medir aqui prova que o .nds-skeleton
        // participa desse override — o pulso infinito é justamente o tipo de
        // animação que incomoda quem pediu movimento reduzido (WCAG 2.3.3).
        //
        // Asserção pelo PAR, não pelo nome da animação: o nome muda por stack e
        // por versão, e `animationName !== 'none'` passava com duração zerada.
        await expect(animationAtiva(sk)).toBe(false);
      });

      await step('O placeholder continua visível e ocupando a caixa', async () => {
        await expect(sk.getBoundingClientRect().height).toBeGreaterThan(0);
        await expect(getComputedStyle(sk).opacity).toBe('1');
      });
    } finally {
      desfazer();
    }

    await step('Sem a preferência, o pulso volta', async () => {
      await expect(animationAtiva(sk)).toBe(true);
    });
  },
};
