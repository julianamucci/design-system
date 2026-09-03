/**
 * Transform do painel Code do Sheet.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o painel é uma composição do barril `NDS_SHEET` —
 * raiz, gatilho e um `ng-template` de conteúdo com cabeçalho e rodapé. Os
 * textos saem do MESMO `translations.json` que a story usa; ler dali, e não
 * repetir literal, é o que impede o snippet de ensinar um rótulo que a
 * demonstração não mostra mais.
 */
import { useTranslation } from '@/lib/i18n';
import sheetTranslations from '@shared/content/sheet/translations.json';
import type { SheetSide } from './sheet';

const { t } = useTranslation(sheetTranslations as Record<string, unknown>);

export type SheetArgs = {
  side: SheetSide;
  showCloseButton: boolean;
  modal: boolean;
  defaultOpen: boolean;
  triggerLabel: string;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * O painel Code imprime o `template` da story literalmente — com os bindings
 * ligados aos args. `transform` devolve o uso real, com os valores atuais dos
 * controls (armadilha 3 do CLAUDE.md deste stack).
 */
export function sheetPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<SheetArgs> } = {},
): string {
  const {
    side = 'right',
    showCloseButton = true,
    modal = true,
    defaultOpen = false,
    triggerLabel = t('demonstration.labels.trigger'),
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet: documentação que repete valor
  // padrão ensina ruído.
  const root = ['<nds-sheet', defaultOpen ? '[defaultOpen]="true"' : '', modal ? '' : '[modal]="false"']
    .filter(Boolean)
    .join(' ');
  const content = [
    '<ng-template ndsSheetContent',
    side === 'right' ? '' : `side="${side}"`,
    showCloseButton ? '' : '[showCloseButton]="false"',
  ].filter(Boolean).join(' ');

  return `import { NDS_SHEET } from '@/components/ui/sheet';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_SHEET, NdsButton],
  template: \`
    ${root}>
      <button ndsSheetTrigger ndsButton variant="outline">${triggerLabel}</button>

      ${content}>
        <div ndsSheetHeader>
          <h2 ndsSheetTitle>${t('demonstration.labels.title')}</h2>
          <p ndsSheetDescription>${t('demonstration.labels.description')}</p>
        </div>

        <div ndsSheetFooter>
          <button ndsSheetClose ndsButton variant="outline">${t('demonstration.labels.cancel')}</button>
          <button ndsButton>${t('demonstration.labels.apply')}</button>
        </div>
      </ng-template>
    </nds-sheet>
  \`,
})
export class Exemplo {}`;
}
