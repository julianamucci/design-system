/**
 * Transform do painel Code do Collapsible.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é que o estado do painel se abre por `defaultOpen`
 * no modo não-controlado — e que o chevron não precisa de código para girar: a
 * classe `.nds-chevron` responde ao `aria-expanded` que o próprio trigger já
 * publica. O desenho vem de `collapsible.fixtures.ts`, o mesmo que a story usa,
 * para que o exemplo copiado seja idêntico ao que a pessoa acabou de ver.
 */
import { CHEVRON } from './collapsible.fixtures';

export type CollapsibleArgs = {
  open: boolean;
  disabled: boolean;
  triggerLabel: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * Ver a nota em separator.stories.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos args. O `transform` devolve o
 * uso real, com os valores atuais dos controls.
 */
export function collapsiblePlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<CollapsibleArgs> } = {},
): string {
  const {
    open = false,
    disabled = false,
    triggerLabel = 'Exibir filtros avançados',
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet — documentação que repete valor
  // padrão ensina ruído.
  const root = ['<div ndsCollapsible class="nds-w-sm"', open ? '[defaultOpen]="true"' : '']
    .filter(Boolean)
    .join(' ');
  const trigger = [
    '<button ndsCollapsibleTrigger ndsButton variant="ghost"',
    'class="nds-cluster nds-w-full nds-px-4" data-spacing="md" data-justify="between"',
    disabled ? '[disabled]="true"' : '',
  ].filter(Boolean).join(' ');

  return `import { NDS_COLLAPSIBLE } from '@/components/ui/collapsible';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_COLLAPSIBLE, NdsButton],
  template: \`
    ${root}>
      ${trigger}>
        <span>${triggerLabel}</span>
        ${CHEVRON.replace(/\n/g, '\n  ')}
      </button>

      <div
        ndsCollapsiblePanel
        class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2"
        data-spacing="sm"
      >
        <p>Filtro avançado 1</p>
        <p>Filtro avançado 2</p>
      </div>
    </div>
  \`,
})
export class Exemplo {}`;
}
