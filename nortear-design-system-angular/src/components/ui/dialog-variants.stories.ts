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
  open,
  waitForOpen,
  waitForClosed,
  checkNameAndDescription,
} from './dialog.fixtures';

// Dialog não tem prop `variant` nem `size` — o conteúdo compartilhado diz isso
// com todas as letras. As "variantes" abaixo são composições estruturais
// recorrentes, e cada uma é uma story própria porque é assim que a regressão
// visual captura cada arranjo de Header/Body/Footer.
//
// Todas nascem abertas (`defaultOpen`): o que a captura precisa mostrar é o
// painel, não o gatilho.

const meta: Meta = {
  title: 'Components/Overlay/Dialog/Variants',
  tags: ['overlay'],
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
      await checkNameAndDescription(p);
    });

    await step('A ação primária é a última do rodapé', async () => {
      // `flex-direction: column-reverse` põe a ação primária no topo da pilha
      // no estreito e à direita no largo. No DOM ela vem por último, que é a
      // ordem de leitura e de foco correta.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll('button');
      await expect(buttons[buttons.length - 1]).toHaveTextContent(LABELS.action);
    });

    await step('O rodapé arredonda junto com o painel', async () => {
      // RELAÇÃO, e não valor: derivar a expectativa de `--radius-card` faria a
      // asserção concordar com qualquer defeito que também saísse do token, e
      // asserção que não pode falhar foi o achado mais repetido desta campanha.
      // O rodapé rasga até a borda do painel — as margens negativas cancelam o
      // padding —, então as duas quinas de baixo são a MESMA linha. O 0.75rem
      // cravado que morava na folha divergia do painel nas doze combinações de
      // tema x modo x largura medidas.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const panelStyle = getComputedStyle(p);
      const footerStyle = getComputedStyle(footer);
      await expect(footerStyle.borderBottomLeftRadius).toBe(panelStyle.borderBottomLeftRadius);
      await expect(footerStyle.borderBottomRightRadius).toBe(panelStyle.borderBottomRightRadius);
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
                <input ndsInput id="dlg-nome" name="name" value="Ana Ribeiro" />
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
      // Vinte cláusulas de frase inteira, e não doze rótulos curtos: o corpo
      // tem teto de 60vh, e a asserção que prova a variante é o corpo TER o que
      // rolar. Com o texto curto o conteúdo cabia inteiro no teto
      // (`scrollHeight === clientHeight`) e a rota não acontecia — a mesma
      // leitura que a story da outra rota faz sobre o overlay.
      paragrafos: Array.from(
        { length: 20 },
        (_, i) =>
          `Cláusula ${i + 1}: o corpo é a única região que rola, e o cabeçalho e o rodapé ficam parados enquanto o texto passa por baixo deles.`,
      ),
    },
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

            <div
              ndsDialogBody
              class="nds-dialog-body-scroll nds-stack"
              data-spacing="sm"
              tabindex="0"
              role="group"
              [attr.aria-label]="labels.title"
            >
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

    await step('O corpo rola sozinho, com header e rodapé parados', async () => {
      // Esta story demonstrava a OUTRA rota — o par [scroll] do overlay e do
      // painel, em que quem rola é o overlay e o cabeçalho sobe junto. O
      // conteúdo compartilhado descreve withScrollContent como "Header e Footer
      // fixos", que é o arranjo de corpo rolável: a story dizia uma coisa e a
      // descrição renderizada ao lado dela dizia outra.
      //
      // Comportamento e não nome de classe: é o overflow computado que prova a
      // variante, e a asserção sobrevive se a classe for renomeada.
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(getComputedStyle(body).overflowY).toBe('auto');
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
    });

    await step('A região rolável é alcançável por teclado e tem nome', async () => {
      // Sem tabindex quem navega só por teclado não consegue rolar a caixa — é
      // a exigência que acompanha toda região com rolagem própria.
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(body).toHaveAttribute('tabindex', '0');
      await expect(body).toHaveAccessibleName();
    });
  },
};

export const WithScrollingOverlay: Story = {
  // A OUTRA rota, e por isso story própria: reusar o nome da de cima é
  // exatamente como as duas circularam sob o mesmo rótulo.
  parameters: { covers: ['visual.item6'] },
  render: () => ({
    props: {
      labels: LABELS,
      clausulas: Array.from(
        { length: 20 },
        (_, i) =>
          `Cláusula ${i + 1}: o painel entra no fluxo do overlay, e o cabeçalho sobe junto com o conteúdo em vez de ficar parado no topo do painel.`,
      ),
    },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">{{ labels.trigger }}</button>

        <ng-template ndsDialogPortal>
          <!--
            Na rota B o painel é FILHO do overlay: rolagem de um elemento só
            alcança o que está dentro dele. Com os dois como irmãos — que é o
            arranjo da rota A — as classes chegam e o overlay não tem o que
            rolar.
          -->
          <div ndsDialogOverlay scroll>
            <div ndsDialogContent scroll [closeLabel]="labels.close">
              <div ndsDialogHeader>
                <h2 ndsDialogTitle>{{ labels.title }}</h2>
                <p ndsDialogDescription>{{ labels.description }}</p>
              </div>

              <!--
                Sem a classe de rolagem, sem tabindex e sem papel: nesta rota não
                há região rolável aninhada para alcançar por teclado — quem rola
                é o overlay, e ele já está na ordem natural da página.
              -->
              <div ndsDialogBody class="nds-stack" data-spacing="sm">
                @for (clausula of clausulas; track clausula) {
                  <p>{{ clausula }}</p>
                }
              </div>

              <div ndsDialogFooter>
                <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
                <button ndsButton>{{ labels.action }}</button>
              </div>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Quem rola é o overlay, e o painel está DENTRO dele', async () => {
      // Comportamento, e não nome de classe: a rota só existe se o overlay
      // tiver o que rolar, e ele só tem se o painel for filho dele. Medido
      // contra a folha compartilhada, com os dois como irmãos o scrollHeight do
      // overlay é igual ao clientHeight — a classe chega e não pinta.
      const ov = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
      await expect(ov.contains(p)).toBe(true);
      await expect(getComputedStyle(ov).overflowY).toBe('auto');
      await expect(ov.scrollHeight).toBeGreaterThan(ov.clientHeight);
    });

    await step('O painel entra no fluxo, e o cabeçalho sobe junto', async () => {
      // O que separa esta rota da outra: lá o cabeçalho fica parado. Aqui ele
      // se move com a rolagem do overlay, e é isso que a asserção mede.
      await expect(getComputedStyle(p).position).toBe('relative');
      const header = p.querySelector<HTMLElement>('[data-slot="dialog-header"]')!;
      const antes = header.getBoundingClientRect().top;
      const ov = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
      ov.scrollTop = 120;
      await expect(header.getBoundingClientRect().top).toBeLessThan(antes);
      ov.scrollTop = 0;
    });

    await step('Não há região rolável aninhada nesta rota', async () => {
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(body).not.toHaveClass('nds-dialog-body-scroll');
      await expect(body).not.toHaveAttribute('tabindex');
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
