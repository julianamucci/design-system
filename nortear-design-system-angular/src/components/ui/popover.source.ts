/**
 * Transform do painel Code do Popover.
 *
 * Exportado de um módulo próprio para ser CHAMADO pela guarda
 * `source-snippets.test.ts`, que varre `*.source.ts` por glob e lê o texto que
 * sai. Construtor inline não é alcançável por ela — e exportar do
 * `.stories.ts` viraria story fantasma na barra lateral.
 *
 * O snippet ensina o painel com cabeçalho nomeado (`ndsPopoverTitle` e
 * `ndsPopoverDescription`, que é de onde sai o nome acessível) e as ações
 * fechando pelo `ndsPopoverClose`, em vez de por estado escrito à mão.
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
  const root = ['<div ndsPopover', defaultOpen ? '[defaultOpen]="true"' : '']
    .filter(Boolean)
    .join(' ');

  return `import { NDS_POPOVER } from '@/components/ui/popover';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_POPOVER, NdsButton],
  template: \`
    ${root}>
      <button ndsPopoverTrigger ndsButton variant="outline">${triggerLabel}</button>

      <ng-template ndsPopoverContent${options ? ` ${options}` : ''}>
        <div ndsPopoverHeader>
          <h3 ndsPopoverTitle>Configurações de exibição</h3>
          <p ndsPopoverDescription>Ajuste a aparência do conteúdo da página.</p>
        </div>

        <div class="nds-cluster" data-justify="end" data-spacing="sm">
          <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
          <button ndsPopoverClose ndsButton size="sm">Salvar</button>
        </div>
      </ng-template>
    </div>
  \`,
})
export class Exemplo {}`;
}
