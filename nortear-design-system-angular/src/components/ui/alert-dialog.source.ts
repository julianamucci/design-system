/**
 * Transforms do painel Code do AlertDialog.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * estes construtores sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que estes snippets ensinam é o contrato do diálogo destrutivo: título e
 * descrição são obrigatórios (o primeiro é o nome acessível, a segunda diz o
 * que a ação custa), e a saída segura vem ANTES da confirmação. A ação de
 * negócio roda no método da classe; quem fecha o diálogo é o primitivo.
 */
import { useTranslation } from '@/lib/i18n';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

const { t } = useTranslation(alertDialogTranslations as Record<string, unknown>);

export type AlertDialogArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  cancel: string;
  action: string;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
};

/**
 * O componente que se escreve: import, template e o método da ação.
 *
 * `titleTag` é o nível do cabeçalho, e o padrão é `h2` — que é o que quase toda
 * story mostra. A diretiva de título casa de `h1` a `h6`, porque o nível certo
 * depende da hierarquia da página em volta e não do componente.
 */
function example(o: {
  triggerLabel: string;
  title: string;
  description: string;
  cancel: string;
  action: string;
  titleTag?: string;
}): string {
  const tag = o.titleTag ?? 'h2';

  // Crase escapada: este texto vive dentro de um template literal, e uma crase
  // crua fecharia a string no meio do snippet.
  return `import { NDS_ALERT_DIALOG } from '@/components/ui/alert-dialog';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [NDS_ALERT_DIALOG, NdsButton],
  template: \`
    <nds-alert-dialog>
      <button ndsAlertDialogTrigger ndsButton variant="destructive">
        ${o.triggerLabel}
      </button>

      <ng-template ndsAlertDialogContent>
        <div ndsAlertDialogHeader>
          <${tag} ndsAlertDialogTitle>${o.title}</${tag}>
          <p ndsAlertDialogDescription>${o.description}</p>
        </div>

        <div ndsAlertDialogFooter>
          <button ndsAlertDialogCancel ndsButton variant="outline">${o.cancel}</button>
          <button ndsAlertDialogAction ndsButton variant="destructive" (click)="excluir()">
            ${o.action}
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

  return example({ triggerLabel, title, description, cancel, action });
}

/**
 * O título num nível diferente de `h2`.
 *
 * A diretiva de título casa de `h1` a `h6`, e o nível certo é o que a página em
 * volta pede: aberto de dentro de uma seção que já está em `h2`, o painel entra
 * em `h3` para não repetir o degrau. Nada mais muda — o `aria-labelledby` sai do
 * id REAL do título, e não da tag.
 *
 * Os rótulos vêm de `demonstration.labels` no conteúdo compartilhado, lidos NA
 * CHAMADA: o idioma é global do Storybook e muda sem recarregar a página, e
 * resolvido numa constante de módulo o snippet congelaria no idioma em que a
 * aba abriu.
 */
export function alertDialogHeadingH3Source(): string {
  return example({
    titleTag: 'h3',
    triggerLabel: t('demonstration.labels.triggerLabel'),
    title: t('demonstration.labels.title'),
    description: t('demonstration.labels.description'),
    cancel: t('demonstration.labels.cancel'),
    action: t('demonstration.labels.action'),
  });
}
