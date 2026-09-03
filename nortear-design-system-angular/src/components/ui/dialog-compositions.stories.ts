import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { NDS_DIALOG } from './dialog';
import { NdsButton } from './button';
import { NdsAspectRatio } from './aspect-ratio';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import {
  IMG_PLACEHOLDER,
  LABELS,
  open,
  panel,
  waitForOpen,
  waitForClosed,
  close,
} from './dialog.fixtures';

// Composições do Dialog: arranjos completos que resolvem um caso de uso, não
// configurações de uma propriedade.

const meta: Meta = {
  title: 'Primitives/Overlay/Dialog/Compositions',
  tags: ['overlay'],
  decorators: [
    moduleMetadata({
      imports: [...NDS_DIALOG, NdsButton, NdsAspectRatio, NdsInput, NdsLabel],
    }),
  ],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Arranjos completos que resolvem um caso de uso: editar dados conhecidos sem sair ' +
          'da página, e ver uma mídia em tamanho real sem nada a confirmar.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// A ProfileEdit existia em quatro stacks e não aqui — composição publicada em
// parte do sistema é promessa que uma stack não cumpre. Entra junto com a
// chave 'variants.compositions.profileEdit' do conteúdo compartilhado, que
// antes não descrevia nenhuma delas.
export const ProfileEdit: Story = {
  parameters: { covers: ['functional.item2'] },
  render: () => ({
    props: { labels: LABELS },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">Editar perfil</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>Editar perfil</h2>
              <p ndsDialogDescription>
                Atualize suas informações pessoais. As mudanças são salvas ao confirmar.
              </p>
            </div>

            <form (submit)="$event.preventDefault()">
              <div ndsDialogBody class="nds-grid" data-spacing="md">
                <div class="nds-stack" data-spacing="sm">
                  <label ndsLabel for="profile-name">Nome completo</label>
                  <input ndsInput id="profile-name" name="name" value="Maria Silva" />
                </div>
                <div class="nds-stack" data-spacing="sm">
                  <label ndsLabel for="profile-username">Nome de usuário</label>
                  <input ndsInput id="profile-username" name="username" value="@mariasilva" />
                </div>
              </div>

              <div ndsDialogFooter>
                <button ndsDialogClose ndsButton type="button" variant="outline">
                  {{ labels.cancel }}
                </button>
                <button ndsButton type="submit">Salvar alterações</button>
              </div>
            </form>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Os campos estão rotulados e trazem o valor inicial', async () => {
      // O valor entra na asserção junto com o rótulo: um campo que renderiza
      // vazio passaria só na presença do label e ninguém veria a falha.
      const name = p.querySelector<HTMLInputElement>('#profile-name')!;
      await expect(name).toHaveAccessibleName('Nome completo');
      await expect(name.value).toBe('Maria Silva');

      const username = p.querySelector<HTMLInputElement>('#profile-username')!;
      await expect(username).toHaveAccessibleName('Nome de usuário');
      await expect(username.value).toBe('@mariasilva');
    });

    await step('O rodapé fica dentro do formulário, e o envio não é o Cancelar', async () => {
      // É o que separa esta composição de um painel com dois botões soltos: o
      // Enter em qualquer campo tem de disparar o envio, e para isso o botão
      // de submissão precisa estar DENTRO do form.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(footer.closest('form')).not.toBeNull();
      const botoes = footer.querySelectorAll<HTMLButtonElement>('button');
      await expect(botoes[0].type).toBe('button');
      await expect(botoes[botoes.length - 1].type).toBe('submit');
    });
  },
};

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
      await close();
      await open(canvasElement);
      const x = panel()!.querySelector<HTMLElement>('[data-slot="dialog-close"]')!;
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
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};
