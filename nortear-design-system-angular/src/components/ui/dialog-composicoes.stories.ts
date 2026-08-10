import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { NDS_DIALOG } from './dialog';
import { NdsButton } from './button';
import { NdsAspectRatio } from './aspect-ratio';
import {
  IMG_PLACEHOLDER,
  LABELS,
  esperarAberto,
  esperarFechado,
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
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step('A mídia tem descrição textual', async () => {
      // A imagem carrega a informação do diálogo — `alt` vazio aqui apagaria o
      // conteúdo inteiro para quem usa leitor de tela.
      const img = p.querySelector<HTMLImageElement>('img')!;
      await expect(img.alt.length).toBeGreaterThan(0);
    });

    await step('Sem rodapé de ações, porque não há o que confirmar', async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
    });

    await step('O botão de fechar é a saída, e ele fecha', async () => {
      const x = p.querySelector<HTMLElement>('[data-slot="dialog-close"]')!;
      await expect(x).toHaveAccessibleName(LABELS.close);
      await userEvent.click(x);
      await esperarFechado();
    });
  },
};
