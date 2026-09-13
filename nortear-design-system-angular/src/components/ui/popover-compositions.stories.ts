import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen } from 'storybook/test';
import { NDS_POPOVER } from './popover';
import { close, open, panel } from './popover.fixtures';
import {
  popoverColorPickerSource,
  popoverFormSource,
  popoverQuickSettingsSource,
  popoverSideTopSource,
  popoverTableFilterSource,
} from './popover.source';
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
  parameters: {
    // O painel Code tem de ensinar o contraste do rodapé: "Aplicar" fecha por
    // código e "Limpar" não fecha — nenhum dos dois é a peça de fechar.
    docs: { source: { transform: popoverTableFilterSource } },
  },
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
  parameters: {
    // A grade de amostras, com a cor saindo de token do tema — nunca de
    // hexadecimal — e o nome de cada amostra declarado.
    docs: { source: { transform: popoverColorPickerSource } },
  },
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
  parameters: {
    // Os alternadores independentes, sem rodapé de confirmação: marcar já é o
    // efeito, e é isso que o painel Code precisa ensinar.
    docs: { source: { transform: popoverQuickSettingsSource } },
  },
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

/** Seletor do irmão que cria — e, escondido, tira — o espaço acima do gatilho. */
const HEADROOM = '[data-slot="side-top-headroom"]';

// O contrato C9 do PRD (sem espaço no lado pedido, o painel vira para o oposto)
// é gateado por esta story, e até 2026-09-13 ela não podia reprovar: a asserção
// aceitava `top` OU `bottom`, então passava com ou sem auto-flip.
//
// Duas coisas precisavam mudar junto com a asserção.
//
// O QUADRO. O meta abre estas stories em `centered`, e ali o espaço acima do
// gatilho vem do próprio quadro: tirar o irmão que cria o espaço faria o quadro
// recentralizar e DEVOLVER o espaço, medindo o oposto do que se quer. Esta story
// abre ancorada no topo, e então todo o espaço acima é o que o irmão dá.
//
// O ESPAÇO. Ele é um IRMÃO de verdade, não `data-split`/`margin` no próprio
// popover: no vanilla o espaço vinha de um utilitário que empurra o ÚLTIMO
// filho, e o popover era filho único — nada era empurrado, e ninguém viu porque
// sem flip o painel era desenhado acima do mesmo jeito, fora da tela.
export const SideTop: Story = {
  parameters: {
    covers: ['visual.item4'],
    layout: 'padded',
    // O painel Code publica `side="top"` + `[sideOffset]="12"` e NADA do irmão
    // que cria o espaço acima: ele é andaime do quadro, e ensiná-lo faria quem
    // copia achar que o popover precisa de um espaçador para abrir acima.
    docs: { source: { transform: popoverSideTopSource } },
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full" data-align="center" data-spacing="sm">
        <!-- Espaço acima do gatilho. aria-hidden porque é andaime de layout:
             não há nada aqui para um leitor de tela anunciar. -->
        <div class="nds-min-h-60" data-slot="side-top-headroom" aria-hidden="true"></div>

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
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir acima' });
    const headroom = canvasElement.querySelector<HTMLElement>(HEADROOM)!;

    // Precondição do primeiro passo, e ela é do REPLAY: o painel Interactions
    // reexecuta a play no mesmo DOM, e uma rodada interrompida no meio do
    // segundo passo teria deixado o irmão escondido.
    headroom.style.display = '';

    await step('Com espaço acima, o painel abre ACIMA e o markup diz top', async () => {
      await open(trigger);
      const dialogo = screen.getByRole('dialog');
      const rg = trigger.getBoundingClientRect();
      const rp = dialogo.getBoundingClientRect();

      // O arranjo é MEDIDO, não presumido: sem esta linha a story afirmaria
      // "há espaço acima" sobre um quadro que talvez não tenha.
      await expect(rg.top).toBeGreaterThan(rp.height + 12);

      // Exatamente `top`, e não "um dos dois lados do eixo": com espaço acima o
      // flip não tem por que acontecer, e se acontecesse seria defeito.
      await expect(dialogo).toHaveAttribute('data-side', 'top');

      // E a geometria acompanha o atributo — o `data-side` sozinho é markup, e
      // markup pode mentir sobre onde o painel foi parar.
      await expect(rp.bottom).toBeLessThanOrEqual(rg.top + 1);
      // 12px pedidos, com 1px de folga para arredondamento sub-pixel do
      // floating-ui. No padrão (4px) esta asserção reprovaria.
      await expect(Math.abs(rg.top - rp.bottom - 12)).toBeLessThanOrEqual(1);
    });

    await step('Sem espaço acima, o painel VIRA para baixo e a geometria acompanha', async () => {
      try {
        // Some com o irmão: o gatilho sobe para o topo do quadro.
        headroom.style.display = 'none';
        await close(trigger);
        await open(trigger);

        const dialogo = screen.getByRole('dialog');
        const rg = trigger.getBoundingClientRect();
        const rp = dialogo.getBoundingClientRect();

        // De novo a precondição medida: agora o painel NÃO cabe acima.
        await expect(rg.top).toBeLessThan(rp.height + 12);

        await expect(dialogo).toHaveAttribute('data-side', 'bottom');
        await expect(rp.top).toBeGreaterThanOrEqual(rg.bottom - 1);
        await expect(Math.abs(rp.top - rg.bottom - 12)).toBeLessThanOrEqual(1);
      } finally {
        headroom.style.display = '';
      }
    });

    // Termina ABERTA e no lado pedido: é o estado que o Chromatic fotografa, e
    // é o mesmo estado em que a play começou.
    await step('Estado final: o espaço volta, e o lado pedido também', async () => {
      await close(trigger);
      await open(trigger);
      await expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'top');
    });
  },
};
