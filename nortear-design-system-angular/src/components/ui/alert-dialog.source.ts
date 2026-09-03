/**
 * Transform do painel Code do AlertDialog.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é o contrato do diálogo destrutivo: título e
 * descrição são obrigatórios (o primeiro é o nome acessível, a segunda diz o
 * que a ação custa), e a saída segura vem ANTES da confirmação. A ação de
 * negócio roda no método da classe; quem fecha o diálogo é o primitivo.
 */

export type AlertDialogArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  cancel: string;
  action: string;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
};

/** Ver a nota em separator.stories.ts. */
export function alertDialogPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<AlertDialogArgs> } = {},
): string {
  const {
    triggerLabel = 'Excluir conta',
    title = 'Excluir conta',
    description = '',
    cancel = 'Cancelar',
    action = 'Excluir',
  } = ctx.args ?? {};

  return `import { NDS_ALERT_DIALOG } from '@/components/ui/alert-dialog';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [NDS_ALERT_DIALOG, NdsButton],
  template: \`
    <nds-alert-dialog>
      <button ndsAlertDialogTrigger ndsButton variant="destructive">
        ${triggerLabel}
      </button>

      <ng-template ndsAlertDialogContent>
        <div ndsAlertDialogHeader>
          <h2 ndsAlertDialogTitle>${title}</h2>
          <p ndsAlertDialogDescription>${description}</p>
        </div>

        <div ndsAlertDialogFooter>
          <button ndsAlertDialogCancel ndsButton variant="outline">${cancel}</button>
          <button ndsAlertDialogAction ndsButton variant="destructive" (click)="excluir()">
            ${action}
          </button>
        </div>
      </ng-template>
    </nds-alert-dialog>
  \`,
})
export class Exemplo {
  excluir(): void {
    // A ação roda aqui; o fechamento é do primitivo.
  }
}`;
}
