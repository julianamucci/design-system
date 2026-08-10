import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSkeleton } from './skeleton';

const meta: Meta = {
  title: 'UI/Skeleton/Estados',
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
        <div ndsSkeleton style="height: 3rem; width: 3rem; border-radius: 9999px"></div>
        <div class="nds-stack" data-spacing="xs">
          <div ndsSkeleton style="height: 1rem; width: 12.5rem"></div>
          <div ndsSkeleton style="height: 0.75rem; width: 8rem"></div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A caixa medida é a que o style pediu', async () => {
      // A dimensão não vem do componente: se alguém mover isso para uma classe
      // que não existe, o esqueleto colapsa para zero e só a medição acusa.
      const circulo = canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')[0];
      const caixa = circulo.getBoundingClientRect();
      await expect(Math.round(caixa.width)).toBe(Math.round(caixa.height));
      await expect(caixa.width).toBeGreaterThan(40);
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
        <div ndsSkeleton style="height: 1rem; width: 100%"></div>
        <div ndsSkeleton style="height: 1rem; width: 80%"></div>
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
        <div ndsSkeleton style="height: 1rem; width: 15rem"></div>
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
