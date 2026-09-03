/**
 * Transform do painel Code do Drawer, e os rótulos que ele publica.
 *
 * Módulo à parte porque a guarda `source-snippets.test.ts` só alcança o que é
 * exportado de um `*.source.ts`: construtor inline não é chamável por ela, e o
 * texto que o leitor copia ficava sem portão. Exportar do próprio `.stories.ts`
 * não serve — export que não é story vira story fantasma na barra lateral.
 *
 * `LABEL` mora aqui, e não na story, porque o construtor fecha sobre ele. A
 * story o importa de volta: o mesmo texto alimenta o snippet, a demonstração e
 * as asserções de nome e descrição acessíveis, sem valor duplicado em dois
 * lugares.
 *
 * O que o snippet ensina é a gaveta como composição — gatilho, conteúdo em
 * `ng-template`, cabeçalho com título e descrição, rodapé com o fechar — e que
 * só o que difere do padrão (`direction`, `modal`, `defaultOpen`) aparece no
 * markup.
 */
import type { DrawerDirection } from './drawer';
import { useTranslation } from '@/lib/i18n';
import drawerTranslations from '@shared/content/drawer/translations.json';

const { t } = useTranslation(drawerTranslations as Record<string, unknown>);

// O conteúdo compartilhado do Drawer não tem um bloco de rótulos de demonstração
// (o do Sheet tem). Os textos do painel saem da tabela de UX writing, que é
// justamente onde o conteúdo diz como cada elemento deve ser escrito — o
// exemplo "bom" de cada linha É o rótulo canônico, nos três idiomas.
export const LABEL = {
  trigger: () => t('usage.uxWriting.table.trigger.good'),
  title: () => t('usage.uxWriting.table.title.good'),
  description: () => t('usage.uxWriting.table.description.good'),
  close: () => t('usage.uxWriting.table.close.good'),
};

export type DrawerArgs = {
  direction: DrawerDirection;
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
export function drawerPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<DrawerArgs> } = {},
): string {
  const {
    direction = 'bottom',
    modal = true,
    defaultOpen = false,
    triggerLabel = LABEL.trigger(),
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet: documentação que repete valor
  // padrão ensina ruído.
  const root = [
    '<nds-drawer',
    direction === 'bottom' ? '' : `direction="${direction}"`,
    defaultOpen ? '[defaultOpen]="true"' : '',
    modal ? '' : '[modal]="false"',
  ].filter(Boolean).join(' ');

  // Crase escapada: este texto vive dentro de um template literal, e uma crase
  // crua fecharia a string no meio do snippet.
  return `import { NDS_DRAWER } from '@/components/ui/drawer';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_DRAWER, NdsButton],
  template: \`
    ${root}>
      <button ndsDrawerTrigger ndsButton variant="outline">${triggerLabel}</button>

      <ng-template ndsDrawerContent>
        <div ndsDrawerHeader>
          <h2 ndsDrawerTitle>${LABEL.title()}</h2>
          <p ndsDrawerDescription>${LABEL.description()}</p>
        </div>

        <div ndsDrawerFooter>
          <button ndsDrawerClose ndsButton variant="outline">${LABEL.close()}</button>
        </div>
      </ng-template>
    </nds-drawer>
  \`,
})
export class Exemplo {}`;
}
