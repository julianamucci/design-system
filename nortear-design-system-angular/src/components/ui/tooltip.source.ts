/**
 * Transform do painel Code do Tooltip.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o `ndsTooltipProvider` entra UMA VEZ, no root da
 * aplicação, e é ele que guarda o atraso comum a todos os balões. O gatilho
 * carrega o próprio `aria-label` — o balão COMPLEMENTA o nome acessível, nunca
 * o substitui, e um botão de ícone sem rótulo continua mudo mesmo com tooltip.
 */
import { SAVE_ICON } from './tooltip.fixtures';

export type TooltipArgs = {
  label: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  delay: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Ver a nota em separator.source.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos args. O `transform` devolve o
 * uso real, com os valores atuais dos controls.
 */
export function tooltipPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<TooltipArgs> } = {},
): string {
  const {
    label = 'Salvar (Ctrl+S)',
    side = 'top',
    align = 'center',
    sideOffset = 4,
    delay = 0,
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet — documentação que repete valor
  // padrão ensina ruído.
  const position = [
    side !== 'top' ? `side="${side}"` : '',
    align !== 'center' ? `align="${align}"` : '',
    sideOffset !== 4 ? `[sideOffset]="${sideOffset}"` : '',
  ].filter(Boolean).join(' ');
  const content = position ? `<ng-template ndsTooltipContent ${position}>` : '<ng-template ndsTooltipContent>';

  return `import { NDS_TOOLTIP } from '@/components/ui/tooltip';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_TOOLTIP, NdsButton],
  template: \`
    <!-- Uma vez no root da app -->
    <div ndsTooltipProvider [delay]="${delay}">
      <span ndsTooltip>
        <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
          ${SAVE_ICON.replace(/\n/g, '\n  ')}
        </button>

        ${content}${label}</ng-template>
      </span>
    </div>
  \`,
})
export class Exemplo {}`;
}
