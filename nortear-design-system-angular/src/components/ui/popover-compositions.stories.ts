import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen } from 'storybook/test';
import { NDS_POPOVER } from './popover';
import { abrir, painel } from './popover.fixtures';
import { NdsButton } from './button';
import { NdsCheckbox } from './checkbox';
import { NdsInput } from './input';
import { NdsLabel } from './label';

// As quatro combinações canônicas do conteúdo compartilhado — edição de perfil,
// filtro de tabela, seletor de cor e configurações rápidas — mais a prova de
// posicionamento em `side="top"`.
//
// Nenhuma acrescenta API: todas são arranjo de conteúdo dentro do mesmo
// `<ng-template ndsPopoverContent>`, que é justamente o ponto de o Popover não
// impor forma ao que ele carrega.

const meta: Meta = {
  title: 'UI/Popover/Compositions',
  decorators: [
    moduleMetadata({ imports: [...NDS_POPOVER, NdsButton, NdsCheckbox, NdsInput, NdsLabel] }),
  ],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Formulário curto, filtros combináveis, paleta restrita e preferências ' +
          'booleanas. Todo gatilho nomeia a ação e o objeto — nunca "Mais" ou ' +
          '"Clique aqui".',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Marca e desmarca em par idempotente, como `abrir`/`fechar`.
 *
 * O painel Interactions REEXECUTA a play no mesmo DOM: um clique cego partiria
 * do estado que a rodada anterior deixou e inverteria a asserção seguinte.
 */
async function marcar(caixa: HTMLElement): Promise<void> {
  if (caixa.getAttribute('aria-checked') !== 'true') await userEvent.click(caixa);
}

async function desmarcar(caixa: HTMLElement): Promise<void> {
  if (caixa.getAttribute('aria-checked') !== 'false') await userEvent.click(caixa);
}

export const EditProfile: Story = {
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Editar perfil</button>

        <ng-template ndsPopoverContent align="start">
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>Editar perfil</h3>
            <p ndsPopoverDescription>Altere o nome e o email da conta.</p>
          </div>

          <div class="nds-stack" data-spacing="sm">
            <label ndsLabel for="pc-perfil-nome">Nome</label>
            <input ndsInput id="pc-perfil-nome" value="Ana Ribeiro" />
          </div>

          <div class="nds-stack" data-spacing="sm">
            <label ndsLabel for="pc-perfil-email">Email</label>
            <input ndsInput id="pc-perfil-email" type="email" value="ana@nortear.com.br" />
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
            <button ndsPopoverClose ndsButton size="sm">Atualizar</button>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'Editar perfil' });

    await step('O formulário abre preenchido e pronto para edição', async () => {
      await abrir(gatilho);
      await expect(screen.getByLabelText('Nome')).toHaveValue('Ana Ribeiro');
      await expect(screen.getByLabelText('Email')).toHaveValue('ana@nortear.com.br');
    });

    await step('Cancelar fecha sem sair do contexto', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      await waitFor(async () => {
        await expect(painel()).toBeNull();
      });
      // Fechar por dentro devolve o foco ao gatilho, senão quem navega por
      // teclado voltaria ao início da página.
      await waitFor(async () => {
        await expect(gatilho).toHaveFocus();
      });
    });
  },
};

export const TableFilter: Story = {
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Filtros</button>

        <ng-template ndsPopoverContent align="start">
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>Filtrar por status</h3>
            <p ndsPopoverDescription>Combine quantos status quiser na listagem.</p>
          </div>

          <div class="nds-stack" data-spacing="sm">
            <div class="nds-cluster" data-spacing="sm">
              <button ndsCheckbox id="pc-filtro-ativo"></button>
              <label ndsLabel for="pc-filtro-ativo">Ativo</label>
            </div>
            <div class="nds-cluster" data-spacing="sm">
              <button ndsCheckbox id="pc-filtro-pendente"></button>
              <label ndsLabel for="pc-filtro-pendente">Pendente</label>
            </div>
            <div class="nds-cluster" data-spacing="sm">
              <button ndsCheckbox id="pc-filtro-arquivado"></button>
              <label ndsLabel for="pc-filtro-arquivado">Arquivado</label>
            </div>
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <button ndsButton variant="ghost" size="sm">Limpar</button>
            <button ndsPopoverClose ndsButton size="sm">Aplicar</button>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'Filtros' });

    await step('Os três status são combináveis', async () => {
      await abrir(gatilho);
      await expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    await step('E marcar um deles não fecha o painel', async () => {
      // Filtro é escolha múltipla: fechar no primeiro clique obrigaria a
      // reabrir para cada critério.
      const active = screen.getByRole('checkbox', { name: 'Ativo' });
      await marcar(active);
      await expect(active).toHaveAttribute('aria-checked', 'true');
      await expect(painel()).toBeInTheDocument();
    });
  },
};

export const ColorPicker: Story = {
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Escolher cor da etiqueta</button>

        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>Cor da etiqueta</h3>
            <p ndsPopoverDescription>Escolha uma cor da paleta do tema.</p>
          </div>

          <div class="nds-cluster" data-spacing="sm">
            <button
              type="button"
              class="nds-size-8 nds-rounded-full nds-bg-primary nds-border-soft nds-focus-ring"
              aria-label="Primária"
            ></button>
            <button
              type="button"
              class="nds-size-8 nds-rounded-full nds-bg-secondary nds-border-soft nds-focus-ring"
              aria-label="Secundária"
            ></button>
            <button
              type="button"
              class="nds-size-8 nds-rounded-full nds-bg-success nds-border-soft nds-focus-ring"
              aria-label="Sucesso"
            ></button>
            <button
              type="button"
              class="nds-size-8 nds-rounded-full nds-bg-warning nds-border-soft nds-focus-ring"
              aria-label="Atenção"
            ></button>
            <button
              type="button"
              class="nds-size-8 nds-rounded-full nds-bg-info nds-border-soft nds-focus-ring"
              aria-label="Informação"
            ></button>
            <button
              type="button"
              class="nds-size-8 nds-rounded-full nds-bg-destructive nds-border-soft nds-focus-ring"
              aria-label="Destrutiva"
            ></button>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'Escolher cor da etiqueta' });

    await step('Cada amostra tem nome acessível próprio', async () => {
      // A cor não é o nome: quem não distingue a cor precisa do rótulo, e sem
      // ele o axe reprova por button-name.
      await abrir(gatilho);
      const amostras = within(painel()!).getAllByRole('button');
      const names = amostras
        .map((b) => b.getAttribute('aria-label'))
        .filter((n): n is string => n !== null);
      await expect(names).toHaveLength(6);
      await expect(new Set(names).size).toBe(6);
    });

    await step('E o foco chega a cada uma por Tab', async () => {
      const primeira = screen.getByRole('button', { name: 'Primária' });
      const segunda = screen.getByRole('button', { name: 'Secundária' });
      primeira.focus();
      await userEvent.tab();
      await expect(segunda).toHaveFocus();
      await expect(segunda.matches(':focus-visible')).toBe(true);
    });
  },
};

export const QuickSettings: Story = {
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Configurações rápidas</button>

        <ng-template ndsPopoverContent align="end">
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>Preferências</h3>
            <p ndsPopoverDescription>Cada linha vale por si — nada aqui depende do resto.</p>
          </div>

          <div class="nds-stack" data-spacing="sm">
            <div class="nds-cluster" data-justify="between">
              <label ndsLabel for="pc-pref-notificacoes">Notificações</label>
              <button ndsCheckbox id="pc-pref-notificacoes" [checked]="true"></button>
            </div>
            <div class="nds-cluster" data-justify="between">
              <label ndsLabel for="pc-pref-escuro">Modo escuro</label>
              <button ndsCheckbox id="pc-pref-escuro"></button>
            </div>
            <div class="nds-cluster" data-justify="between">
              <label ndsLabel for="pc-pref-compacto">Modo compacto</label>
              <button ndsCheckbox id="pc-pref-compacto"></button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'Configurações rápidas' });

    await step('As preferências são independentes entre si', async () => {
      await abrir(gatilho);
      const notificacoes = screen.getByRole('checkbox', { name: 'Notificações' });
      const escuro = screen.getByRole('checkbox', { name: 'Modo escuro' });

      // Ponto de partida conhecido antes de medir — no replay o painel chega
      // com o que a rodada anterior deixou.
      await marcar(notificacoes);
      await desmarcar(escuro);
      await expect(notificacoes).toHaveAttribute('aria-checked', 'true');
      await expect(escuro).toHaveAttribute('aria-checked', 'false');

      await marcar(escuro);
      await expect(escuro).toHaveAttribute('aria-checked', 'true');
      // A que já estava marcada não se mexe: são preferências, não um grupo de
      // escolha única.
      await expect(notificacoes).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const SideTop: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Abrir acima</button>

        <ng-template ndsPopoverContent side="top" [sideOffset]="12">
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>Ancorado acima</h3>
            <p ndsPopoverDescription>
              Sem espaço acima, o painel vira para baixo sozinho.
            </p>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: 'Abrir acima' });

    await step('O lado pedido no template chega ao posicionamento', async () => {
      await abrir(gatilho);
      const dialogo = screen.getByRole('dialog');
      // `top` ou `bottom`, nunca um lado do outro eixo: o auto-flip troca de
      // LADO por colisão, jamais de eixo. Se o input não tivesse chegado, o
      // padrão seria `bottom` — que também passaria aqui, então a asserção
      // seguinte, sobre o deslocamento, é a que fecha a prova.
      await expect(['top', 'bottom']).toContain(dialogo.getAttribute('data-side'));
    });

    await step('E o sideOffset separa painel e gatilho pela medida pedida', async () => {
      const dialogo = screen.getByRole('dialog');
      const r1 = gatilho.getBoundingClientRect();
      const r2 = dialogo.getBoundingClientRect();
      const distancia =
        dialogo.getAttribute('data-side') === 'top'
          ? r1.top - r2.bottom
          : r2.top - r1.bottom;
      // 12px pedidos, com 1px de folga para arredondamento sub-pixel do
      // floating-ui. No padrão (4px) esta asserção reprovaria.
      await expect(Math.abs(distancia - 12)).toBeLessThanOrEqual(1);
    });
  },
};
