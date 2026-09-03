import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { NDS_ALERT_DIALOG } from './alert-dialog';
import { NdsButton } from './button';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

// Variantes e formas do painel. Sem argTypes, então o painel Controls é
// desligado — do contrário apareceria vazio.
//
// Todas nascem abertas: é o estado que a regressão visual precisa capturar, e
// o fechado já está no Playground.
//
// A Controlled saiu daqui para -states: o conteúdo compartilhado a descreve em
// `states.controlled`, ao lado de fechado, aberto, confirmação e cancelamento,
// e era o único ponto em que esta stack punha no menu de Variantes o que as
// outras quatro punham no de Configurações.
//
// A Responsive virou Responsive, que é o nome que as outras quatro usavam
// para a MESMA story — nome diferente por stack é invisível ao portão, que
// compara por nome.

const meta: Meta = {
  title: 'Primitives/Overlay/AlertDialog/Variants',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_ALERT_DIALOG, NdsButton] })],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
  },
};

export default meta;
type Story = StoryObj;

// Destructive existia nas outras quatro stacks e não aqui. É a primeira linha
// de `variants.items` do conteúdo compartilhado — sem ela, metade da tabela de
// variantes ficava sem foto no Chromatic nesta stack.
export const Destructive: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    template: `
      <nds-alert-dialog [defaultOpen]="true">
        <button ndsAlertDialogTrigger ndsButton variant="destructive" data-testid="gatilho">
          Excluir conta
        </button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>Excluir conta</h2>
            <p ndsAlertDialogDescription>
              Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
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
  play: async ({ canvasElement, step }) => {
    await step('O painel abre com o nome acessível da confirmação destrutiva', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName(/Excluir conta/i);
    });

    await step('Gatilho e Action compartilham a variante destructive', async () => {
      // Com o painel aberto o gatilho fica sob aria-hidden/inert e sai das
      // buscas por papel — por isso a consulta é pelo data-testid do template.
      const trigger = canvasElement.querySelector<HTMLElement>('[data-testid="gatilho"]')!;
      const action = document.querySelector<HTMLElement>('[data-slot="alert-dialog-action"]')!;
      await expect(trigger).toHaveClass('nds-button-destructive');
      await expect(action).toHaveClass('nds-button-destructive');
    });

    await step('O Cancel fica na hierarquia secundária', async () => {
      const cancel = document.querySelector<HTMLElement>('[data-slot="alert-dialog-cancel"]')!;
      await expect(cancel).toHaveClass('nds-button-outline');
      await expect(cancel).not.toHaveClass('nds-button-destructive');
    });
  },
};

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
    await step('O painel abre com o nome acessível da confirmação neutra', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName(/Sair da conta/i);
    });

    await step('A confirmação neutra não usa a cor de perigo', async () => {
      // Vermelho reservado ao irreversível: usá-lo em "sair da conta" gasta o
      // sinal, e quando a exclusão real aparecer ele não vai mais alarmar.
      const acao = document.querySelector<HTMLElement>('[data-testid="acao"]')!;
      await expect(acao).toHaveClass('nds-button-default');
      await expect(acao).not.toHaveClass('nds-button-destructive');
    });

    await step('O Cancel fica na hierarquia secundária', async () => {
      const cancelar = document.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-cancel"]',
      )!;
      await expect(cancelar).toHaveClass('nds-button-outline');
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
      const panel = await waitForPortal('alertdialog');
      const descricao = document.querySelector<HTMLElement>('[data-testid="descricao"]')!;
      const lines =
        descricao.getBoundingClientRect().height /
        Number.parseFloat(getComputedStyle(descricao).lineHeight);
      await expect(lines).toBeGreaterThan(1);
      // E não vaza do painel: o texto é o que dimensiona a caixa, não o
      // contrário — não há altura cravada aqui.
      await expect(descricao.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        panel.getBoundingClientRect().bottom,
      );
    });
  },
};

// testes.accessibility.item8 — a descrição é opcional (anatomy.item6), e o
// caminho sem ela precisa de uma story: enquanto nenhuma omitia, a única prova
// de que o componente aguenta era a assinatura. O que se mede aqui não é a
// ausência do parágrafo — é que o painel deixa de declarar `aria-describedby`
// em vez de apontar para um id que não existe, o que o axe reprova em
// `aria-valid-attr-value` e o leitor de tela anuncia como nada.
export const WithoutDescription: Story = {
  parameters: { covers: ['accessibility.item8'] },
  render: () => ({
    template: `
      <nds-alert-dialog [defaultOpen]="true">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">Descartar rascunho</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>Descartar rascunho</h2>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">Cancelar</button>
            <button ndsAlertDialogAction ndsButton variant="destructive">Descartar</button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ step }) => {
    await step('O painel abre sem descrição e mantém o nome acessível', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toBeVisible();
      await expect(
        panel.querySelector('[data-slot="alert-dialog-description"]'),
      ).toBeNull();
      await expect(panel).toHaveAccessibleName(/Descartar rascunho/i);
    });

    await step('Nenhum aria-describedby pendurado', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).not.toHaveAttribute('aria-describedby');
      await expect(panel).toHaveAccessibleDescription('');
    });

    await step('As duas saídas continuam presentes e alcançáveis', async () => {
      const panel = await waitForPortal('alertdialog');
      const escopo = within(panel);
      await expect(escopo.getByRole('button', { name: /^Cancelar$/i })).toBeInTheDocument();
      await expect(escopo.getByRole('button', { name: /^Descartar$/i })).toBeInTheDocument();
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
      await waitForPortal('alertdialog');
      const midia = document.querySelector<HTMLElement>('[data-testid="midia"]')!;
      const title = document.querySelector<HTMLElement>('[data-slot="alert-dialog-title"]')!;
      await expect(midia.getAttribute('aria-hidden')).toBe('true');
      await expect(midia.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        title.getBoundingClientRect().top + 1,
      );
    });
  },
};

export const Responsive: Story = {
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
      await waitForPortal('alertdialog');
      const footer = document.querySelector<HTMLElement>('[data-testid="rodape"]')!;
      const wide = window.matchMedia('(min-width: 40rem)').matches;

      await expect(getComputedStyle(footer).flexDirection).toBe(
        wide ? 'row' : 'column-reverse',
      );

      const [cancelar, excluir] = [...footer.querySelectorAll('button')].map((b) =>
        b.getBoundingClientRect(),
      );
      if (wide) {
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

// ExtraClass também não existia aqui, e não podia: até esta rodada o painel
// desta stack não aceitava classe nenhuma de quem consome — a classe posta em
// <nds-alert-dialog> cai no host, que fica na página, e o painel é portalado.
// O conteúdo compartilhado promete o contrário para as cinco, em props.
// extensibility. O input panelClass entregou o que já estava documentado.
export const ExtraClass: Story = {
  render: () => ({
    template: `
      <nds-alert-dialog [defaultOpen]="true" panelClass="nds-overflow-hidden">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">Excluir conta</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <div ndsAlertDialogMedia class="nds-shrink-0" data-testid="midia">
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
              Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
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
    await step('A classe do call site chega ao painel E faz efeito', async () => {
      // As duas pontas: presença sozinha passaria com a classe inerte, e foi
      // assim que o panelClass do Sheet ensinou um botão que não ligava nada.
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toHaveClass(/nds-overflow-hidden/);
      await expect(getComputedStyle(panel).overflow).toBe('hidden');
    });

    await step('A classe base não é substituída pela extra', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toHaveClass(/nds-alert-dialog-content/);
    });

    await step('O bloco de mídia também aceita classe, e ela pinta', async () => {
      const midia = document.querySelector<HTMLElement>('[data-testid="midia"]')!;
      await expect(midia).toHaveClass('nds-alert-dialog-media');
      await expect(getComputedStyle(midia).flexShrink).toBe('0');
    });
  },
};
