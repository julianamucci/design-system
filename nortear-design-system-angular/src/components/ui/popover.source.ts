/**
 * Transform do painel Code do Popover.
 *
 * Exportado de um módulo próprio para ser CHAMADO pela guarda
 * `source-snippets.test.ts`, que varre `*.source.ts` por glob e lê o texto que
 * sai. Construtor inline não é alcançável por ela — e exportar do
 * `.stories.ts` viraria story fantasma na barra lateral.
 *
 * O snippet ensina o painel com cabeçalho nomeado (`ndsPopoverTitle` e
 * `ndsPopoverDescription`, que é de onde sai o nome acessível) e os DOIS
 * caminhos de fechar, que não são intercambiáveis: o "Cancelar" é a peça de
 * fechar (`button[ndsPopoverClose]`), e o "Salvar" fecha por CÓDIGO depois de
 * salvar. A diferença chega ao relatório como `close-button` × `api`, que é o
 * que separa quem desistiu de quem concluiu — ver `popover-close-reason.ts`.
 *
 * O segundo construtor é o do painel com FORMULÁRIO, e ele existe porque ali a
 * mesma regra muda de lugar: o fechamento por código não pode morar no clique
 * de "Atualizar" — mora no `(submit)`. Ver o bloco sobre `popoverFormSource`.
 *
 * Os quatro últimos servem as cinco stories de ESTADO, que até 2026-09-13
 * publicavam o template cru — com a interpolação de `SIMPLE_PANEL` no meio, com
 * o gancho `data-testid` da play e com o `[(open)]` amarrado a uma propriedade
 * solta que não existe fora do renderer do Storybook.
 *
 * O que é ANDAIME naquelas stories, e por isso não entra em snippet nenhum:
 *
 *  · `data-testid="area-externa"` e o parágrafo que o carrega, em Controlled.
 *    É alvo inerte para a play clicar FORA do painel — não faz parte do que o
 *    modo controlado ensina.
 *  · `[defaultOpen]="true"` em Modal, que abre o painel para o axe varrer e o
 *    Chromatic fotografar. Um popover modal que já nasce aberto prende o foco
 *    de quem acabou de chegar na página, e ensiná-lo seria ensinar a foto.
 *
 * O que NÃO é andaime, e por isso fica: em Modal, a AUSÊNCIA de peça de fechar
 * e os dois checkboxes rotulados. Os dois são o assunto — ver o comentário da
 * story e o bloco sobre `popoverModalSource`.
 */
import type { PopoverAlign, PopoverSide } from './popover';
export type PopoverArgs = {
  side: PopoverSide;
  align: PopoverAlign;
  sideOffset: number;
  defaultOpen: boolean;
  triggerLabel: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * Ver a nota em separator.stories.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos args e o `(openChange)` do
 * espião. O `transform` devolve o uso real, com os valores atuais dos controls.
 */
export function popoverPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<PopoverArgs> } = {},
): string {
  const {
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    defaultOpen = false,
    triggerLabel = 'Abrir popover',
  } = ctx.args ?? {};

  // Só o que difere do padrão entra no snippet — documentação que repete valor
  // padrão ensina ruído.
  const options = [
    side !== 'bottom' ? `side="${side}"` : '',
    align !== 'center' ? `align="${align}"` : '',
    sideOffset !== 4 ? `[sideOffset]="${sideOffset}"` : '',
  ].filter(Boolean).join(' ');
  // A raiz é sempre CONTROLADA: é o `[(open)]` que permite ao "Salvar" fechar
  // por código. O control `defaultOpen` entra no valor inicial do sinal, que é
  // onde o estado inicial mora num painel controlado.
  return `import { signal } from '@angular/core';
import { NDS_POPOVER } from '@/components/ui/popover';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_POPOVER, NdsButton],
  template: \`
    <div ndsPopover [(open)]="aberto">
      <button ndsPopoverTrigger ndsButton variant="outline">${triggerLabel}</button>

      <ng-template ndsPopoverContent${options ? ` ${options}` : ''}>
        <div ndsPopoverHeader>
          <h2 ndsPopoverTitle>Configurações de exibição</h2>
          <p ndsPopoverDescription>Ajuste a aparência do conteúdo da página.</p>
        </div>

        <div class="nds-cluster" data-justify="end" data-spacing="sm">
          <!-- Desistiu: a peça de fechar, que reporta close-button -->
          <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
          <!-- Concluiu: salva e fecha por código, que reporta api -->
          <button ndsButton size="sm" (click)="salvar()">Salvar</button>
        </div>
      </ng-template>
    </div>
  \`,
})
export class Exemplo {
  readonly aberto = signal(${defaultOpen ? 'true' : 'false'});

  salvar(): void {
    // …persistir…
    this.aberto.set(false);
  }
}`;
}

/**
 * Painel com FORMULÁRIO embutido — a terceira forma documentada do popover.
 *
 * A regra do rodapé é a mesma do construtor acima, e a diferença é só ONDE o
 * fechamento por código mora: aqui a ação que confirma é o `type="submit"` do
 * formulário, então fechar tem de acontecer no `(submit)`, depois do
 * `preventDefault()`. Fechar no `(click)` do botão desmontaria o formulário
 * antes de ele enviar — e deixaria de fora o ENTER num campo, que é como
 * metade das pessoas envia formulário e nunca passa pelo clique.
 *
 * O "Cancelar" continua sendo a peça de fechar (`ndsPopoverClose`, motivo
 * `close-button`, desistiu); o submit fecha por código (motivo `api`,
 * concluiu).
 */
export function popoverFormSource(
  _gerado?: string,
  ctx: { args?: Partial<PopoverArgs> } = {},
): string {
  const { triggerLabel = 'Editar perfil' } = ctx.args ?? {};

  return `import { signal } from '@angular/core';
import { NDS_POPOVER } from '@/components/ui/popover';
import { NdsButton } from '@/components/ui/button';
import { NdsInput } from '@/components/ui/input';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [...NDS_POPOVER, NdsButton, NdsInput, NdsLabel],
  template: \`
    <div ndsPopover [(open)]="aberto">
      <button ndsPopoverTrigger ndsButton variant="outline">${triggerLabel}</button>

      <ng-template ndsPopoverContent align="start">
        <div ndsPopoverHeader>
          <h2 ndsPopoverTitle>Editar perfil</h2>
          <p ndsPopoverDescription>Altere o nome e o email da conta.</p>
        </div>

        <!-- Fechar mora no (submit), e não no clique de "Atualizar": fechar no
             clique desmontaria o formulário antes de ele enviar, e só o caminho
             do submit cobre também o Enter num campo. -->
        <form class="nds-stack" data-spacing="md" (submit)="atualizar($event)">
          <div class="nds-stack" data-spacing="xs">
            <label ndsLabel for="perfil-nome">Nome</label>
            <input ndsInput id="perfil-nome" value="Ana Ribeiro" />
          </div>

          <div class="nds-stack" data-spacing="xs">
            <label ndsLabel for="perfil-email">Email</label>
            <input ndsInput id="perfil-email" type="email" value="ana@nortear.com.br" />
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <!-- Desistiu: a peça de fechar, que reporta close-button -->
            <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
            <!-- Concluiu: o submit grava e fecha por código, que reporta api -->
            <button ndsButton type="submit" size="sm">Atualizar</button>
          </div>
        </form>
      </ng-template>
    </div>
  \`,
})
export class Exemplo {
  readonly aberto = signal(false);

  atualizar(evento: Event): void {
    evento.preventDefault();
    // …gravar o perfil…
    this.aberto.set(false);
  }
}`;
}

// ─── As cinco stories de ESTADO ───────────────────────────────────────────────

/**
 * O painel simples — o MESMO das stories de estado, que o interpolam de uma
 * constante em vez de o repetirem quatro vezes.
 *
 * Escrito sem recuo de base: `indented()` o encaixa no nível de cada exemplo,
 * que muda quando a raiz ganha um embrulho (é o caso de Controlled).
 */
const SIMPLE_PANEL = `<ng-template ndsPopoverContent>
  <div ndsPopoverHeader>
    <h2 ndsPopoverTitle>Configurações de exibição</h2>
    <p ndsPopoverDescription>Ajuste a aparência do conteúdo da página.</p>
  </div>

  <div class="nds-cluster" data-justify="end" data-spacing="sm">
    <!-- Desistiu: a peça de fechar, que reporta close-button -->
    <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
    <!-- Concluiu: salva e fecha por código, que reporta api -->
    <button ndsButton size="sm" (click)="salvar()">Salvar</button>
  </div>
</ng-template>`;

/** O bloco recuado ao nível em que ele aparece no exemplo. */
function indented(block: string, pad: string): string {
  return block
    .split('\n')
    .map((line) => (line ? pad + line : line))
    .join('\n');
}

/**
 * A raiz controlada com o painel simples — o corpo de `Closed`, `Open` e
 * `Focus`, que só diferem no valor que SEMEIA o sinal.
 *
 * Não é exportada: o `transform` do Storybook chama o construtor com
 * `(código, contexto)`, então quem entra na tabela de transforms tem de ter
 * essa assinatura. Aqui o parâmetro é o estado inicial, e os dois construtores
 * exportados logo abaixo é que o fixam.
 */
function simpleStateExample(initialOpen: boolean): string {
  return `import { signal } from '@angular/core';
import { NDS_POPOVER } from '@/components/ui/popover';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_POPOVER, NdsButton],
  template: \`
    <div ndsPopover [(open)]="aberto">
      <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>

${indented(SIMPLE_PANEL, '      ')}
    </div>
  \`,
})
export class Exemplo {
  readonly aberto = signal(${initialOpen ? 'true' : 'false'});

  salvar(): void {
    // …persistir…
    this.aberto.set(false);
  }
}`;
}

/**
 * States/Closed e States/Focus — o popover padrão, fechado em repouso.
 *
 * Serve DUAS stories, e a exceção está declarada em `popover.source.test.ts`
 * com a premissa cobrada caso a caso: as duas renderizam o mesmo template e
 * semeiam o mesmo estado inicial. O que as separa é INTERAÇÃO — uma não abre o
 * painel, a outra abre e caminha com Tab entre os controles —, e interação não
 * aparece em snippet. Dois construtores idênticos seriam a cópia que envelhece
 * sozinha.
 *
 * É também o que diferencia `Focus` de `Modal`: aqui o foco ENTRA no painel ao
 * abrir e não fica preso, porque a raiz não declara `modal`. A ausência do
 * input é o que o snippet ensina.
 */
export function popoverBasicSource(): string {
  return simpleStateExample(false);
}

/**
 * States/Open — o painel que NASCE aberto, que é o que a story afirma.
 *
 * Mesmo markup do construtor acima, e a diferença inteira está no sinal:
 * `signal(true)`. Num painel CONTROLADO é ali que o estado inicial mora — o
 * `defaultOpen` ao lado do `[(open)]` seriam duas fontes para a mesma pergunta.
 */
export function popoverOpenSource(): string {
  return simpleStateExample(true);
}

/**
 * States/Controlled — o par `[open]`/`(openChange)` escrito por extenso.
 *
 * É o assunto da story, e por isso o snippet não usa o açúcar `[(open)]` das
 * outras: quem precisa abrir o painel a partir de um comando de fora tem de ver
 * as duas pontas separadas. Ligar só `open` é o defeito clássico — o painel
 * fecha sozinho no Escape e no clique fora, e o estado de fora continua dizendo
 * que está aberto.
 *
 * O parágrafo `data-testid="area-externa"` da story não vem: é alvo inerte para
 * a play clicar fora do painel, e não faz parte do que o modo controlado ensina.
 */
export function popoverControlledSource(): string {
  return `import { signal } from '@angular/core';
import { NDS_POPOVER } from '@/components/ui/popover';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_POPOVER, NdsButton],
  template: \`
    <div class="nds-cluster" data-spacing="md">
      <div ndsPopover [open]="aberto()" (openChange)="aberto.set($event)">
        <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>

${indented(SIMPLE_PANEL, '        ')}
      </div>

      <button ndsButton variant="ghost" (click)="aberto.set(!aberto())">
        Alternar por fora
      </button>
    </div>
  \`,
})
export class Exemplo {
  readonly aberto = signal(false);

  salvar(): void {
    // …persistir…
    this.aberto.set(false);
  }
}`;
}

/**
 * States/Modal — `[modal]="true"`, que prende o foco, trava a rolagem e anuncia
 * `aria-modal`, os três juntos.
 *
 * O painel NÃO traz peça de fechar, e a ausência é o assunto: com um
 * `ndsPopoverClose` registrado quem prende o foco passa a ser a lib
 * (`hasPopupClose()`), e o laço de tabulação que o `NdsPopover` escreve — que é
 * o que esta stack de fato entrega — deixaria de ser exercido. São DOIS
 * focáveis pelo mesmo motivo: com um só, "o Tab do último volta ao primeiro"
 * seria verdade sem laço nenhum.
 *
 * E são CHECKBOX com rótulo amarrado por `for`/`id`, não um par
 * Cancelar/Confirmar: sem a peça de fechar, um "Cancelar" não cancelaria nada.
 * Checkbox é o controle que se BASTA — marcar já é o efeito.
 *
 * O `[defaultOpen]="true"` da story fica de fora: ele abre o painel para o axe
 * varrer e o Chromatic fotografar, e um popover modal que nasce aberto prende o
 * foco de quem acabou de chegar na página.
 */
export function popoverModalSource(): string {
  return `import { NDS_POPOVER } from '@/components/ui/popover';
import { NdsButton } from '@/components/ui/button';
import { NdsCheckbox } from '@/components/ui/checkbox';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [...NDS_POPOVER, NdsButton, NdsCheckbox, NdsLabel],
  template: \`
    <div ndsPopover [modal]="true">
      <button ndsPopoverTrigger ndsButton variant="outline">Abrir modal</button>

      <ng-template ndsPopoverContent>
        <div ndsPopoverHeader>
          <h2 ndsPopoverTitle>Popover modal</h2>
          <p ndsPopoverDescription>O foco fica preso no painel enquanto ele está aberto.</p>
        </div>

        <div class="nds-stack" data-spacing="sm">
          <div class="nds-cluster" data-spacing="sm">
            <button ndsCheckbox id="popover-modal-remember"></button>
            <label ndsLabel for="popover-modal-remember">Lembrar minha escolha</label>
          </div>

          <div class="nds-cluster" data-spacing="sm">
            <button ndsCheckbox id="popover-modal-email"></button>
            <label ndsLabel for="popover-modal-email">Receber aviso por e-mail</label>
          </div>
        </div>
      </ng-template>
    </div>
  \`,
})
export class Exemplo {}`;
}
