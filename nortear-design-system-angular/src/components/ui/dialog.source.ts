/**
 * Transform do painel Code do Dialog.
 *
 * Vive fora do `.stories.ts` porque é assim que ele entra na varredura do
 * `source-snippets.test.ts`, que CHAMA cada export e lê o texto publicado.
 * Enquanto o construtor era função local, o que o leitor copia não tinha portão
 * nenhum — nem a checagem de import, nem a de andaime vazado.
 *
 * O snippet ensina a composição inteira: o portal, a sobreposição e o painel
 * com título e descrição ligados por `ndsDialogTitle`/`ndsDialogDescription`,
 * que é de onde sai o nome acessível do diálogo. Os rótulos vêm da fixture
 * compartilhada, e não de literais daqui: o mesmo valor alimenta o exemplo e as
 * asserções das quatro stories.
 */
import { LABELS } from './dialog.fixtures';
export type DialogArgs = {
  defaultOpen: boolean;
  modal: boolean;
  showCloseButton: boolean;
  triggerLabel: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * Ver a nota em separator.stories.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos args e com as interpolações
 * de `labels`. O `transform` devolve o uso real, com os valores atuais.
 */
export function dialogPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<DialogArgs> } = {},
): string {
  const {
    defaultOpen = false,
    modal = true,
    showCloseButton = true,
    triggerLabel = LABELS.trigger,
  } = ctx.args ?? {};

  // Só o que difere do padrão entra no snippet — documentação que repete valor
  // default ensina ruído.
  const root = [
    '<div ndsDialog',
    defaultOpen ? '[defaultOpen]="true"' : '',
    modal ? '' : '[modal]="false"',
  ].filter(Boolean).join(' ');

  const content = [
    '<div ndsDialogContent',
    showCloseButton ? '' : '[showCloseButton]="false"',
  ].filter(Boolean).join(' ');

  return `import { NDS_DIALOG } from '@/components/ui/dialog';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_DIALOG, NdsButton],
  template: \`
    ${root}>
      <button ndsDialogTrigger ndsButton variant="outline">${triggerLabel}</button>

      <ng-template ndsDialogPortal>
        <div ndsDialogOverlay></div>

        ${content} closeLabel="${LABELS.close}">
          <div ndsDialogHeader>
            <h2 ndsDialogTitle>${LABELS.title}</h2>
            <p ndsDialogDescription>${LABELS.description}</p>
          </div>

          <div ndsDialogFooter>
            <button ndsDialogClose ndsButton variant="outline">${LABELS.cancel}</button>
            <button ndsButton>${LABELS.action}</button>
          </div>
        </div>
      </ng-template>
    </div>
  \`,
})
export class Exemplo {}`;
}
