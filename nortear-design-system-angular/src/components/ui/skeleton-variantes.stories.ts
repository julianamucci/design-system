import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSkeleton } from './skeleton';
import { NdsAspectRatio } from './aspect-ratio';

const meta: Meta = {
  title: 'UI/Skeleton/Variants',
  decorators: [moduleMetadata({ imports: [NdsSkeleton, NdsAspectRatio] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Formas: Story = {
  // As cinco linhas de `testes.visual` numa story só: o que a regressão visual
  // compara é o conjunto, e cada forma isolada viraria uma imagem que nunca se
  // confronta com as outras.
  parameters: {
    covers: ['visual.item1', 'visual.item2', 'visual.item3', 'visual.item4', 'visual.item5'],
  },
  render: () => ({
    props: { linhas: [1, 2, 3, 4, 5] },
    template: `
      <div class="nds-grid nds-w-full" data-spacing="lg" data-min="15rem">
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-text-muted-foreground">Retângulo</p>
          <div role="status" aria-busy="true" aria-label="Carregando bloco">
            <div ndsSkeleton data-shape="fill" class="nds-docs-skeleton-media"></div>
          </div>
        </div>

        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-text-muted-foreground">Avatar circular</p>
          <div role="status" aria-busy="true" aria-label="Carregando avatar">
            <div ndsSkeleton data-shape="avatar"></div>
          </div>
        </div>

        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-text-muted-foreground">Card de perfil</p>
          <div role="status" aria-busy="true" aria-label="Carregando perfil" class="nds-cluster" data-spacing="sm">
            <div ndsSkeleton data-shape="avatar"></div>
            <div class="nds-stack" data-spacing="xs">
              <div ndsSkeleton data-shape="text" data-width="1-2"></div>
              <div ndsSkeleton data-shape="text" data-width="1-3"></div>
            </div>
          </div>
        </div>

        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-text-muted-foreground">Lista</p>
          <div role="status" aria-busy="true" aria-label="Carregando lista" class="nds-stack" data-spacing="sm">
            @for (i of linhas; track i) {
              <div class="nds-cluster" data-spacing="sm">
                <div ndsSkeleton data-shape="avatar" data-size="sm"></div>
                <div ndsSkeleton data-shape="text" data-width="1-2"></div>
              </div>
            }
          </div>
        </div>

        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-caption nds-text-muted-foreground">Imagem 16:9</p>
          <div role="status" aria-busy="true" aria-label="Carregando imagem">
            <div ndsAspectRatio [ratio]="16 / 9">
              <div ndsSkeleton data-shape="fill"></div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Toda região de carregamento tem role e nome', async () => {
      // O par role="status" + aria-label é o que faz o leitor anunciar; sem
      // ele o aria-busy passa despercebido e o axe acusa aria-prohibited-attr.
      const regioes = [...canvasElement.querySelectorAll<HTMLElement>('[aria-busy="true"]')];
      await expect(regioes.length).toBeGreaterThanOrEqual(5);
      for (const r of regioes) {
        await expect(r.getAttribute('role')).toBe('status');
        await expect(r.getAttribute('aria-label')).toBeTruthy();
      }
    });

    await step('O esqueleto dentro do AspectRatio preenche a caixa', async () => {
      // É o caso que junta os dois componentes: se o filho perdesse o
      // `position: absolute; inset: 0`, o esqueleto colapsaria e a caixa
      // ficaria vazia mesmo com a proporção certa.
      const caixa = canvasElement.querySelector<HTMLElement>('[data-slot="aspect-ratio"]')!;
      const sk = caixa.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
      const caixaBox = caixa.getBoundingClientRect();
      const skBox = sk.getBoundingClientRect();
      await expect(Math.abs(skBox.height - caixaBox.height)).toBeLessThan(2);
    });
  },
};
