import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NDS_DIALOG } from './dialog';
import { NdsButton } from './button';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import {
  LABELS,
  panel,
  overlay,
  open,
  waitForOpen,
  waitForClosed,
  checkNameEDescricao,
} from './dialog.fixtures';

// Dialog não tem prop `variant` nem `size` — o conteúdo compartilhado diz isso
// com todas as letras. As "variantes" abaixo são composições estruturais
// recorrentes, e cada uma é uma story própria porque é assim que a regressão
// visual captura cada arranjo de Header/Body/Footer.
//
// Todas nascem abertas (`defaultOpen`): o que a captura precisa mostrar é o
// painel, não o gatilho.

const meta: Meta = {
  title: 'UI/Dialog/Variants',
  decorators: [
    moduleMetadata({ imports: [...NDS_DIALOG, NdsButton, NdsInput, NdsLabel] }),
  ],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições estruturais do Dialog. A diferença entre elas está em quais partes ' +
          'existem (Body, Footer, botão de fechar) e em que papel a ação primária cumpre — ' +
          'nunca em uma propriedade de variante.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    props: { labels: LABELS },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">{{ labels.trigger }}</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ labels.title }}</h2>
              <p ndsDialogDescription>{{ labels.description }}</p>
            </div>

            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
              <button ndsButton>{{ labels.action }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('As quatro partes da composição padrão estão no painel', async () => {
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-title"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-description"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
      await checkNameEDescricao(p);
    });

    await step('A ação primária é a última do rodapé', async () => {
      // `flex-direction: column-reverse` põe a ação primária no topo da pilha
      // no estreito e à direita no largo. No DOM ela vem por último, que é a
      // ordem de leitura e de foco correta.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll('button');
      await expect(buttons[buttons.length - 1]).toHaveTextContent(LABELS.action);
    });
  },
};

export const WithForm: Story = {
  parameters: { covers: ['visual.item2', 'visual.item4'] },
  render: () => ({
    props: { labels: LABELS },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">{{ labels.trigger }}</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ labels.title }}</h2>
              <p ndsDialogDescription>{{ labels.description }}</p>
            </div>

            <div ndsDialogBody class="nds-stack" data-spacing="md">
              <div class="nds-stack" data-spacing="xs">
                <label ndsLabel for="dlg-nome">Nome</label>
                <input ndsInput id="dlg-nome" name="nome" value="Ana Ribeiro" />
              </div>
              <div class="nds-stack" data-spacing="xs">
                <label ndsLabel for="dlg-email">E-mail</label>
                <input ndsInput id="dlg-email" name="email" type="email" value="ana@exemplo.com" />
              </div>
            </div>

            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
              <button ndsButton type="submit">{{ labels.action }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Os campos estão rotulados', async () => {
      const name = p.querySelector<HTMLInputElement>('#dlg-nome')!;
      // `toHaveAccessibleName` e não a presença do `<label>`: o que importa é o
      // par for/id ter fechado, e é isso que o leitor de tela anuncia.
      await expect(name).toHaveAccessibleName('Nome');
      await expect(p.querySelector('#dlg-email')).toHaveAccessibleName('E-mail');
    });

    await step('O foco alcança os campos por teclado, dentro do painel', async () => {
      const name = p.querySelector<HTMLInputElement>('#dlg-nome')!;
      name.focus();
      await expect(document.activeElement).toBe(name);
      await userEvent.tab();
      await expect(document.activeElement).toBe(p.querySelector('#dlg-email'));
    });
  },
};

export const WithScrollContent: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    props: {
      labels: LABELS,
      paragrafos: Array.from({ length: 12 }, (_, i) => `Cláusula ${i + 1}`),
    },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">{{ labels.trigger }}</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay [scroll]="true"></div>

          <div ndsDialogContent [scroll]="true" [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ labels.title }}</h2>
              <p ndsDialogDescription>{{ labels.description }}</p>
            </div>

            <div ndsDialogBody class="nds-stack" data-spacing="sm">
              @for (paragrafo of paragrafos; track paragrafo) {
                <p>{{ paragrafo }}</p>
              }
            </div>

            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
              <button ndsButton>{{ labels.action }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('O painel sai do centro fixo e entra no fluxo do overlay', async () => {
      // Conteúdo mais alto que a janela precisa de alguém para rolar. Quem rola
      // é o overlay: o painel centralizado por `position: fixed` cortaria o que
      // não coubesse, sem barra de rolagem nenhuma.
      await expect(p).toHaveClass(/nds-dialog-content-scroll/);
      await expect(overlay()).toHaveClass(/nds-dialog-overlay-scroll/);
      await expect(getComputedStyle(overlay()!).overflowY).toBe('auto');
      await expect(getComputedStyle(p).position).toBe('relative');
    });

    await step('Header e Footer continuam no painel, acima e abaixo do corpo', async () => {
      // Só os slots da família: os botões do rodapé carregam `data-slot="button"`
      // e entrariam na lista sem dizer nada sobre a ordem das PARTES.
      const partes = [...p.querySelectorAll<HTMLElement>('[data-slot^="dialog-"]')]
        .map((el) => el.dataset['slot'])
        .filter((slot) => slot !== 'dialog-close');
      await expect(partes).toEqual([
        'dialog-header',
        'dialog-title',
        'dialog-description',
        'dialog-body',
        'dialog-footer',
      ]);
    });
  },
};

export const NoFooter: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    props: { labels: LABELS },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">{{ labels.trigger }}</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ labels.title }}</h2>
              <p ndsDialogDescription>{{ labels.description }}</p>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('Sem rodapé, o botão X é a única saída visível', async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
      const x = p.querySelector<HTMLElement>('[data-slot="dialog-close"]')!;
      await expect(x).toHaveAccessibleName(LABELS.close);
    });

    await step('E ele fecha de verdade — e a story volta a abrir para a captura', async () => {
      await userEvent.click(p.querySelector<HTMLElement>('[data-slot="dialog-close"]')!);
      await waitForClosed();
      // O Chromatic fotografa o estado final e o axe roda depois da play: uma
      // story de composição que termina fechada capturaria só o gatilho.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

export const WithDestructiveAction: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    props: { labels: LABELS },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">Remover item</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>Remover item da lista</h2>
              <p ndsDialogDescription>
                O item sai desta lista e continua disponível no catálogo.
              </p>
            </div>

            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
              <button ndsButton variant="destructive">Remover item</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('A ação primária carrega a variante destrutiva', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      // Esta é a asserção que prova o binding de input: sob JIT o botão
      // renderizaria no default e a classe destructive nunca apareceria
      // (armadilha 1 do CLAUDE.md deste stack).
      await expect(buttons[buttons.length - 1]).toHaveClass(/nds-button-destructive/);
    });

    await step('Ainda assim é um Dialog, não um AlertDialog', async () => {
      // A destrutividade aqui é secundária ao fluxo (remover de uma lista, não
      // apagar o recurso). Confirmação irreversível pede `role="alertdialog"`,
      // foco inicial no Cancelar e Cancelar obrigatório — outro componente.
      await expect(p).toHaveAttribute('role', 'dialog');
    });
  },
};

export const CustomCloseInFooter: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    props: { labels: LABELS },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">{{ labels.trigger }}</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [showCloseButton]="false">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ labels.title }}</h2>
              <p ndsDialogDescription>{{ labels.description }}</p>
            </div>

            <div ndsDialogFooter [showCloseButton]="true" [closeLabel]="labels.close">
              <button ndsButton>{{ labels.action }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('Sem X no canto, o fechar mora no rodapé', async () => {
      await expect(p.querySelector('[data-slot="dialog-close"]')).toBeNull();
      // Pelo nome acessível: o botão do rodapé é um `ndsButton`, e o slot dele
      // é `button` — ver a nota em NdsDialogClose.
      const close = within(p).getByRole('button', { name: LABELS.close });
      await expect(close.closest('[data-slot="dialog-footer"]')).not.toBeNull();
    });

    await step('E o botão do rodapé fecha o diálogo', async () => {
      await userEvent.click(within(p).getByRole('button', { name: LABELS.close }));
      await waitForClosed();
      await expect(panel()).toBeNull();
      // Reabre: o Chromatic fotografa o estado final da play.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

export const ConfirmEmail: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    props: { labels: LABELS },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">Enviar convite</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>Enviar convite</h2>
              <p ndsDialogDescription>
                O convite vai para ana&#64;exemplo.com. Você pode reenviar depois.
              </p>
            </div>

            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
              <button ndsButton>Enviar convite</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('A operação é reversível, então a ação primária é neutra', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await expect(buttons[buttons.length - 1]).toHaveClass(/nds-button-default/);
    });

    await step('Cancelar sai sem consequência', async () => {
      await userEvent.click(within(p).getByRole('button', { name: LABELS.cancel }));
      await waitForClosed();
      // Reabre: o Chromatic fotografa o estado final da play.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};
