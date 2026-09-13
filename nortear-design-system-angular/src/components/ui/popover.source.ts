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
