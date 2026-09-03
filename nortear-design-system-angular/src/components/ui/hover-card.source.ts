/**
 * Transform do painel Code do HoverCard.
 *
 * Exportado de um módulo próprio para entrar na varredura do
 * `source-snippets.test.ts`, que CHAMA cada export e lê o snippet publicado.
 * Construtor inline é função local: o que o leitor copia não tinha portão.
 *
 * O snippet ensina o cartão dentro de texto corrido — o gatilho é um LINK real,
 * porque o conteúdo do cartão é reforço e não pode ser a única via — e mostra
 * `openDelay`/`closeDelay` apenas quando diferem do padrão do componente. O
 * markup do painel vem da fixture compartilhada, o mesmo que a demonstração usa.
 */
import { CARTAO_PERFIL } from './hover-card.fixtures';
export type HoverCardArgs = {
  triggerLabel: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  align: 'start' | 'center' | 'end';
  openDelay: number;
  closeDelay: number;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * Ver a nota em separator.stories.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos args. O `transform` devolve o
 * uso real, já com os valores atuais dos controls.
 */
export function hoverCardPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<HoverCardArgs> } = {},
): string {
  const {
    triggerLabel = '@joana',
    side = 'bottom',
    align = 'center',
    openDelay = 150,
    closeDelay = 100,
  } = ctx.args ?? {};

  // Só o que difere do padrão entra no snippet — repetir valor padrão ensina
  // ruído. O padrão do gatilho é 600ms para abrir e 300ms para fechar.
  const atrasos = [
    openDelay !== 600 ? `[openDelay]="${openDelay}"` : '',
    closeDelay !== 300 ? `[closeDelay]="${closeDelay}"` : '',
  ].filter(Boolean).join(' ');
  const position = [
    side !== 'bottom' ? `side="${side}"` : '',
    align !== 'center' ? `align="${align}"` : '',
  ].filter(Boolean).join(' ');

  return `import { NDS_HOVER_CARD } from '@/components/ui/hover-card';
import { NDS_AVATAR } from '@/components/ui/avatar';

@Component({
  imports: [...NDS_HOVER_CARD, ...NDS_AVATAR],
  template: \`
    <p class="nds-text-body nds-max-w-sm">
      Comentário de
      <span ndsHoverCard>
        <a
          ndsHoverCardTrigger
          href="/users/joana"
          class="nds-text-primary nds-font-medium"${atrasos ? `\n          ${atrasos}` : ''}
        >${triggerLabel}</a>

        <ng-template ndsHoverCardContent${position ? ` ${position}` : ''}>${CARTAO_PERFIL}
        </ng-template>
      </span>
      há 2 horas.
    </p>
  \`,
})
export class Exemplo {}`;
}
