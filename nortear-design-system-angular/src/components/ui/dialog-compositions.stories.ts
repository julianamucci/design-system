import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { NDS_DIALOG } from './dialog';
import { NdsButton } from './button';
import { NdsAspectRatio } from './aspect-ratio';
import {
  IMG_PLACEHOLDER,
  LABELS,
  abrir,
  painel,
  waitForOpen,
  waitForClosed,
  fechar,
} from './dialog.fixtures';

// Composições do Dialog: arranjos completos que resolvem um caso de uso, não
// configurações de uma propriedade.

const meta: Meta = {
  title: 'UI/Dialog/Compositions',
  decorators: [
    moduleMetadata({ imports: [...NDS_DIALOG, NdsButton, NdsAspectRatio] }),
  ],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Quando a única intenção é ver, e não fazer, o rodapé de ações some e o botão de ' +
          'fechar passa a ser a saída principal.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const MediaPreview: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item6'] },
  render: () => ({
    props: { labels: LABELS, src: IMG_PLACEHOLDER },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">Ver capa</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>Capa do artigo</h2>
              <p ndsDialogDescription>
                Padrão geométrico em tons de cinza, usado como capa da publicação.
              </p>
            </div>

            <div ndsDialogBody>
              <div ndsAspectRatio [ratio]="16 / 9">
                <img [src]="src" alt="Padrão geométrico em tons de cinza" />
              </div>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('A mídia tem descrição textual', async () => {
      // A imagem carrega a informação do diálogo — `alt` vazio aqui apagaria o
      // conteúdo inteiro para quem usa leitor de tela.
      const img = p.querySelector<HTMLImageElement>('img')!;
      await expect(img.alt.length).toBeGreaterThan(0);
    });

    await step('Sem rodapé de ações, porque não há o que confirmar', async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
    });

    await step('O botão de fechar é a saída, e ele devolve o foco ao gatilho', async () => {
      const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="dialog-trigger"]')!;
      // A devolução do foco só faz sentido se o diálogo tiver sido ABERTO pelo
      // gatilho. Esta story MONTA aberta por `defaultOpen`, e nesse caminho o
      // elemento focado antes era o próprio documento — era para lá que o foco
      // voltava, com razão. Fechar e reabrir pelo gatilho estabelece a
      // precondição do que se quer provar.
      await fechar();
      await abrir(canvasElement);
      const x = painel()!.querySelector<HTMLElement>('[data-slot="dialog-close"]')!;
      await expect(x).toHaveAccessibleName(LABELS.close);
      await userEvent.click(x);
      await waitForClosed();
      // Sem o X, esta composição não tem rodapé nenhum: fechar por ali é a
      // única saída de ponteiro, e a devolução do foco é metade do item
      // 'functional.item4' que esta story declara.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
      // Reabre: o Chromatic fotografa o estado final, e é o painel ABERTO que
      // o axe precisa varrer — 'accessibility.item6' é declarado nesta story.
      await expect(await abrir(canvasElement)).toBeVisible();
    });
  },
};
