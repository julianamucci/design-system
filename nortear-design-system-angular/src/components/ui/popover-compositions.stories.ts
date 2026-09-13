import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen } from 'storybook/test';
import { NDS_POPOVER } from './popover';
import { open, panel } from './popover.fixtures';
import { popoverFormSource } from './popover.source';
import { NdsButton } from './button';
import { NdsCheckbox } from './checkbox';
import { NdsInput } from './input';
import { NdsLabel } from './label';

import { figmaDesign } from '@shared/figma/design-links';
// As quatro combinações canônicas do conteúdo compartilhado — edição de perfil,
// filtro de tabela, seletor de cor e configurações rápidas — mais a prova de
// posicionamento em `side="top"`.
//
// Nenhuma acrescenta API: todas são arranjo de conteúdo dentro do mesmo
// `<ng-template ndsPopoverContent>`, que é justamente o ponto de o Popover não
// impor forma ao que ele carrega.

const meta: Meta = {
  title: 'Components/Overlay/Popover/Compositions',
  tags: ['overlay'],
  decorators: [
    moduleMetadata({ imports: [...NDS_POPOVER, NdsButton, NdsCheckbox, NdsInput, NdsLabel] }),
  ],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Formulário curto, filtros combináveis, paleta restrita e preferências ' +
          'booleanas. Todo gatilho nomeia a ação e o objeto — nunca "Mais" ou ' +
          '"Clique aqui". O lado de abertura entra aqui pelo mesmo motivo: é ' +
          'arranjo do painel, não estado dele.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Marca e desmarca em par idempotente, como `open`/`close`.
 *
 * O painel Interactions REEXECUTA a play no mesmo DOM: um clique cego partiria
 * do estado que a rodada anterior deixou e inverteria a asserção seguinte.
 */
async function check(box: HTMLElement): Promise<void> {
  if (box.getAttribute('aria-checked') !== 'true') await userEvent.click(box);
}

async function uncheck(box: HTMLElement): Promise<void> {
  if (box.getAttribute('aria-checked') !== 'false') await userEvent.click(box);
}

export const EditProfile: Story = {
  parameters: {
    // O painel Code tem de ensinar a MESMA forma que o preview: o fechamento
    // vive no `(submit)`, e não no clique da ação primária.
    docs: { source: { transform: popoverFormSource } },
  },
  render: () => ({
    // Controlada por causa do "Atualizar": ele fecha por CÓDIGO depois de
    // gravar, e é isso que faz o motivo chegar como `api`. Com `ndsPopoverClose`
    // ele reportaria `close-button`, que é o motivo de quem desistiu.
    props: { isOpen: false },
    template: `
      <div ndsPopover [(open)]="isOpen">
        <button ndsPopoverTrigger ndsButton variant="outline">Editar perfil</button>

        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h2 ndsPopoverTitle>Editar perfil</h2>
            <p ndsPopoverDescription>Altere o nome e o email da conta.</p>
          </div>

          <!-- Fechar mora AQUI, no submit, e não no clique de "Atualizar":
               fechar no clique desmontaria o formulário antes de ele enviar, e
               só o caminho do submit cobre também o Enter num campo, que é como
               metade das pessoas envia formulário. -->
          <form
            class="nds-stack"
            data-spacing="md"
            (submit)="$event.preventDefault(); isOpen = false"
          >
            <div class="nds-stack" data-spacing="xs">
              <label ndsLabel for="pc-perfil-nome">Nome</label>
              <input ndsInput id="pc-perfil-nome" value="Ana Ribeiro" />
            </div>

            <div class="nds-stack" data-spacing="xs">
              <label ndsLabel for="pc-perfil-email">Email</label>
              <input ndsInput id="pc-perfil-email" type="email" value="ana@nortear.com.br" />
            </div>

            <!-- Os dois fecham, por CAMINHOS diferentes: "Cancelar" é a peça de
                 fechar (close-button, desistiu) e "Atualizar" é submit do form,
                 que fecha por código (api, concluiu). Marcá-lo com
                 ndsPopoverClose apagaria a diferença e ainda deixaria o Enter
                 num campo sem efeito — o gesto natural de quem digitou um valor
                 numa edição em linha. -->
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
              <button ndsButton type="submit" size="sm">Atualizar</button>
            </div>
          </form>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Editar perfil' });

    await step('O formulário abre preenchido e pronto para edição', async () => {
      await open(trigger);
      await expect(screen.getByLabelText('Nome')).toHaveValue('Ana Ribeiro');
      await expect(screen.getByLabelText('Email')).toHaveValue('ana@nortear.com.br');
    });

    await step('Atualizar CONCLUI: fecha por código, e pelo caminho do submit', async () => {
      // O botão é `type="submit"`, e não a peça de fechar: assim o motivo chega
      // ao relatório como `api` — "gravou e fechou" — e o Enter num campo,
      // testado logo abaixo, fecha pelo mesmo caminho.
      const update = screen.getByRole('button', { name: 'Atualizar' });
      await expect(update).not.toHaveAttribute('data-slot', 'popover-close');
      await expect(update).toHaveAttribute('type', 'submit');
      await userEvent.click(update);
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
    });

    await step('E o Enter num campo faz o mesmo, sem passar pelo clique', async () => {
      await open(trigger);
      await userEvent.type(screen.getByLabelText('Nome'), '{Enter}');
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
    });

    await step('Cancelar fecha sem sair do contexto', async () => {
      await open(trigger);
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      // Fechar por dentro devolve o foco ao gatilho, senão quem navega por
      // teclado voltaria ao início da página.
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });
  },
};

export const TableFilter: Story = {
  render: () => ({
    // Estado controlado por causa do "Aplicar": ele fecha por CÓDIGO, depois de
    // aplicar o filtro, e é isso que faz o motivo chegar como `api`. Marcado
    // com `ndsPopoverClose` ele reportaria `close-button`, que é o motivo de
    // quem desistiu — e o "Limpar" ao lado, que não fecha, é o contraste.
    props: { isOpen: false },
    template: `
      <div ndsPopover [(open)]="isOpen">
        <button ndsPopoverTrigger ndsButton variant="outline">Filtros</button>

        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h2 ndsPopoverTitle>Filtrar por status</h2>
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
            <button ndsButton size="sm" (click)="isOpen = false">Aplicar</button>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Filtros' });

    await step('Os três status são combináveis', async () => {
      await open(trigger);
      await expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    await step('E marcar um deles não fecha o painel', async () => {
      // Filtro é escolha múltipla: fechar no primeiro clique obrigaria a
      // reabrir para cada critério.
      const active = screen.getByRole('checkbox', { name: 'Ativo' });
      await check(active);
      await expect(active).toHaveAttribute('aria-checked', 'true');
      await expect(panel()).toBeInTheDocument();
    });

    await step('Aplicar fecha por código, e não pela peça de fechar', async () => {
      // Quem CONCLUIU fecha escrevendo no estado: assim o motivo chega ao
      // relatório como `api`. Com `ndsPopoverClose` ele chegaria como
      // `close-button`, apagando a diferença entre desistir e concluir.
      const aplicar = screen.getByRole('button', { name: 'Aplicar' });
      await expect(aplicar).not.toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(aplicar);
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await open(trigger);
      await expect(panel()).toBeInTheDocument();
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
            <h2 ndsPopoverTitle>Cor da etiqueta</h2>
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
    const trigger = canvas.getByRole('button', { name: 'Escolher cor da etiqueta' });

    await step('Cada amostra tem nome acessível próprio', async () => {
      // A cor não é o nome: quem não distingue a cor precisa do rótulo, e sem
      // ele o axe reprova por button-name.
      await open(trigger);
      const amostras = within(panel()!).getAllByRole('button');
      const names = amostras
        .map((b) => b.getAttribute('aria-label'))
        .filter((n): n is string => n !== null);
      await expect(names).toHaveLength(6);
      await expect(new Set(names).size).toBe(6);
    });

    await step('E o foco chega a cada uma por Tab', async () => {
      const first = screen.getByRole('button', { name: 'Primária' });
      const segunda = screen.getByRole('button', { name: 'Secundária' });
      first.focus();
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

        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h2 ndsPopoverTitle>Preferências</h2>
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
    const trigger = canvas.getByRole('button', { name: 'Configurações rápidas' });

    await step('As preferências são independentes entre si', async () => {
      await open(trigger);
      const notificacoes = screen.getByRole('checkbox', { name: 'Notificações' });
      const escuro = screen.getByRole('checkbox', { name: 'Modo escuro' });

      // Ponto de partida conhecido antes de medir — no replay o painel chega
      // com o que a rodada anterior deixou.
      await check(notificacoes);
      await uncheck(escuro);
      await expect(notificacoes).toHaveAttribute('aria-checked', 'true');
      await expect(escuro).toHaveAttribute('aria-checked', 'false');

      await check(escuro);
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
            <h2 ndsPopoverTitle>Ancorado acima</h2>
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
    const trigger = canvas.getByRole('button', { name: 'Abrir acima' });

    await step('O lado pedido no template chega ao posicionamento', async () => {
      await open(trigger);
      const dialogo = screen.getByRole('dialog');
      // `top` ou `bottom`, nunca um lado do outro eixo: o auto-flip troca de
      // LADO por colisão, jamais de eixo. Se o input não tivesse chegado, o
      // padrão seria `bottom` — que também passaria aqui, então a asserção
      // seguinte, sobre o deslocamento, é a que fecha a prova.
      await expect(['top', 'bottom']).toContain(dialogo.getAttribute('data-side'));
    });

    await step('E o sideOffset separa painel e gatilho pela medida pedida', async () => {
      const dialogo = screen.getByRole('dialog');
      const r1 = trigger.getBoundingClientRect();
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
