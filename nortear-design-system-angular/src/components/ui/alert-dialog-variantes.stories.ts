import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NDS_ALERT_DIALOG } from './alert-dialog';
import { NdsButton } from './button';
import { esperarPortal, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';

// Variantes e formas do painel. Sem argTypes, então o painel Controls é
// desligado — do contrário apareceria vazio.
//
// Todas nascem abertas: é o estado que a regressão visual precisa capturar, e
// o fechado já está no Playground.

const meta: Meta = {
  title: 'UI/AlertDialog/Types',
  decorators: [moduleMetadata({ imports: [...NDS_ALERT_DIALOG, NdsButton] })],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
  },
};

export default meta;
type Story = StoryObj;

export const Neutral: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    template: `
      <nds-alert-dialog [defaultOpen]="true">
        <button ndsAlertDialogTrigger ndsButton variant="outline">Sair da conta</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>Sair da conta</h2>
            <p ndsAlertDialogDescription>
              Você precisará entrar novamente para acessar seus dados.
            </p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">Cancelar</button>
            <button ndsAlertDialogAction ndsButton data-testid="acao">Sair</button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ step }) => {
    await step('A confirmação neutra não usa a cor de perigo', async () => {
      // Vermelho reservado ao irreversível: usá-lo em "sair da conta" gasta o
      // sinal, e quando a exclusão real aparecer ele não vai mais alarmar.
      await esperarPortal('alertdialog');
      const acao = document.querySelector<HTMLElement>('[data-testid="acao"]')!;
      await expect(acao.classList.contains('nds-button-destructive')).toBe(false);
    });
  },
};

export const LongDescription: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    template: `
      <nds-alert-dialog [defaultOpen]="true">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">Revogar acesso</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>Revogar acesso da equipe</h2>
            <p ndsAlertDialogDescription data-testid="descricao">
              As 12 pessoas da equipe perdem acesso imediato aos 34 projetos deste espaço,
              incluindo os arquivos já baixados, que deixam de sincronizar. Quem estiver com
              um documento aberto será desconectado ao salvar.
            </p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">Manter acesso</button>
            <button ndsAlertDialogAction ndsButton variant="destructive">Revogar</button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ step }) => {
    await step('A descrição longa quebra em várias linhas dentro do painel', async () => {
      const painel = await esperarPortal('alertdialog');
      const descricao = document.querySelector<HTMLElement>('[data-testid="descricao"]')!;
      const linhas =
        descricao.getBoundingClientRect().height /
        Number.parseFloat(getComputedStyle(descricao).lineHeight);
      await expect(linhas).toBeGreaterThan(1);
      // E não vaza do painel: o texto é o que dimensiona a caixa, não o
      // contrário — não há altura cravada aqui.
      await expect(descricao.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        painel.getBoundingClientRect().bottom,
      );
    });
  },
};

export const WithMedia: Story = {
  parameters: { covers: ['visual.item6'] },
  render: () => ({
    template: `
      <nds-alert-dialog [defaultOpen]="true">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">Excluir conta</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <div ndsAlertDialogMedia data-testid="midia">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <h2 ndsAlertDialogTitle>Excluir conta</h2>
            <p ndsAlertDialogDescription>
              Todos os seus dados serão removidos permanentemente.
            </p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">Cancelar</button>
            <button ndsAlertDialogAction ndsButton variant="destructive">Excluir</button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ step }) => {
    await step('O ícone fica acima do título e não é anunciado', async () => {
      // Num alertdialog o título é lido de imediato; um ícone anunciado ali
      // seria a terceira voz na mesma frase.
      await esperarPortal('alertdialog');
      const midia = document.querySelector<HTMLElement>('[data-testid="midia"]')!;
      const titulo = document.querySelector<HTMLElement>('[data-slot="alert-dialog-title"]')!;
      await expect(midia.getAttribute('aria-hidden')).toBe('true');
      await expect(midia.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        titulo.getBoundingClientRect().top + 1,
      );
    });
  },
};

export const StackedFooter: Story = {
  parameters: {
    covers: ['visual.item5'],
    // A folha empilha os botões abaixo de 40rem. O viewport da story é o que
    // decide, não uma classe — é a mesma media query que o produto vê.
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => ({
    template: `
      <nds-alert-dialog [defaultOpen]="true">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">Excluir conta</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>Excluir conta</h2>
            <p ndsAlertDialogDescription>
              Todos os seus dados serão removidos permanentemente.
            </p>
          </div>
          <div ndsAlertDialogFooter data-testid="rodape">
            <button ndsAlertDialogCancel ndsButton variant="outline">Cancelar</button>
            <button ndsAlertDialogAction ndsButton variant="destructive">Excluir</button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ step }) => {
    await step('O rodapé segue a largura real da janela, não um parâmetro', async () => {
      // `parameters.viewport` é da UI do Storybook: ele NÃO redimensiona o
      // iframe do vitest, que roda largo. Afirmar "empilhado" aqui seria
      // afirmar o que a story não produz. O que dá para provar é que a regra
      // responde à largura — e é isso que o Chromatic exercita no viewport
      // móvel, onde o parâmetro vale.
      await esperarPortal('alertdialog');
      const rodape = document.querySelector<HTMLElement>('[data-testid="rodape"]')!;
      const largo = window.matchMedia('(min-width: 40rem)').matches;

      await expect(getComputedStyle(rodape).flexDirection).toBe(
        largo ? 'row' : 'column-reverse',
      );

      const [cancelar, excluir] = [...rodape.querySelectorAll('button')].map((b) =>
        b.getBoundingClientRect(),
      );
      if (largo) {
        // Lado a lado, com a confirmação à direita.
        await expect(excluir.left).toBeGreaterThan(cancelar.left);
      } else {
        // `column-reverse`: o DOM traz Cancelar primeiro para o foco pousar
        // nele, e a tela mostra a confirmação em cima.
        await expect(excluir.bottom).toBeLessThanOrEqual(cancelar.top + 1);
      }
    });
  },
};

export const Controlled: Story = {
  parameters: { covers: ['functional.item7'] },
  render: () => ({
    props: { aberto: false },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsButton variant="outline" (click)="aberto = true" data-testid="abrir">
          Abrir de fora
        </button>

        <nds-alert-dialog [open]="aberto" (openChange)="aberto = $event">
          <button ndsAlertDialogTrigger ndsButton variant="destructive">Excluir conta</button>

          <ng-template ndsAlertDialogContent>
            <div ndsAlertDialogHeader>
              <h2 ndsAlertDialogTitle>Excluir conta</h2>
              <p ndsAlertDialogDescription>
                Todos os seus dados serão removidos permanentemente.
              </p>
            </div>
            <div ndsAlertDialogFooter>
              <button ndsAlertDialogCancel ndsButton variant="outline">Cancelar</button>
              <button ndsAlertDialogAction ndsButton variant="destructive">Excluir</button>
            </div>
          </ng-template>
        </nds-alert-dialog>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Quem controla o estado é a página, não o gatilho', async () => {
      // Abrir por um botão que não é o gatilho prova que `open` manda.
      await expect(document.querySelector('[data-slot="alert-dialog-content"]')).toBeNull();
      await userEvent.click(canvas.getByTestId('abrir'));
      await esperarPortal('alertdialog');
    });
  },
};
