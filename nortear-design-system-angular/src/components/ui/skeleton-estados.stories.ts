import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSkeleton } from './skeleton';

const meta: Meta = {
  title: 'UI/Skeleton/States',
  decorators: [moduleMetadata({ imports: [NdsSkeleton] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const DimensaoCustomizada: Story = {
  parameters: { covers: ['functional.item2', 'functional.item3', 'accessibility.item2'] },
  render: () => ({
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando perfil" class="nds-cluster" data-spacing="sm">
        <div ndsSkeleton data-shape="avatar"></div>
        <div class="nds-stack" data-spacing="xs">
          <div ndsSkeleton data-shape="text" data-width="2-3"></div>
          <div ndsSkeleton data-shape="text" data-width="1-2"></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O avatar é um quadrado com medida do tema', async () => {
      // A medida vem de `data-shape=avatar` -> escada --size-*, que responde à
      // densidade. Se o atributo sumir, o esqueleto colapsa para zero e só a
      // medição acusa.
      const circulo = canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')[0];
      const caixa = circulo.getBoundingClientRect();
      await expect(Math.round(caixa.width)).toBe(Math.round(caixa.height));
      // Sem número mágico: a medida vem da escada --size-*, que muda por
      // densidade. Afirmar '40px' amarraria o teste ao tema padrão.
      await expect(caixa.width).toBeGreaterThan(0);
    });

    await step('Todos os esqueletos ficam fora da árvore de acessibilidade', async () => {
      const todos = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')];
      await expect(todos).toHaveLength(3);
      for (const sk of todos) await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const ContainerOcupado: Story = {
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

export const MovimentoReduzido: Story = {
  parameters: { covers: ['functional.item5', 'accessibility.item4', 'accessibility.item5'] },
  render: () => ({
    template: `
      <div role="status" aria-busy="true" aria-label="Carregando" class="nds-stack" data-spacing="sm">
        <div ndsSkeleton data-shape="text" data-width="3-4"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const html = canvasElement.ownerDocument.documentElement;
    const anterior = html.dataset['reducedMotion'];

    await step('Com movimento normal, o pulso está animado', async () => {
      delete html.dataset['reducedMotion'];
      const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
      await expect(getComputedStyle(sk).animationName).not.toBe('none');
    });

    await step('Com movimento reduzido, a animação é desligada', async () => {
      // O toolbar "Motion" escreve `data-reduced-motion` no <html> e o
      // motion.css zera as durações. Medir aqui prova que o .nds-skeleton
      // participa desse override — o pulso infinito é justamente o tipo de
      // animação que incomoda quem pediu movimento reduzido (WCAG 2.3.3).
      html.dataset['reducedMotion'] = 'true';
      const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
      const estilo = getComputedStyle(sk);
      const desligada =
        estilo.animationName === 'none' ||
        Number.parseFloat(estilo.animationDuration) === 0;
      await expect(desligada).toBe(true);
    });

    // Restaura para não vazar estado global para as stories seguintes.
    if (anterior === undefined) delete html.dataset['reducedMotion'];
    else html.dataset['reducedMotion'] = anterior;
  },
};
