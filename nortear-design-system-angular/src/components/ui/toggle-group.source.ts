/**
 * Transform do painel Code do ToggleGroup.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o grupo é o container e cada opção continua sendo um
 * `ndsToggle` — a `variant` escolhida vale para os dois, e repeti-la no item é
 * o que mantém a borda coerente. O `aria-label` do grupo não é enfeite: sem ele
 * a barra anuncia só "barra de ferramentas", sem dizer do que ela trata. E o
 * `defaultValue` muda de FORMA com o tipo: texto quando é escolha única, array
 * quando é múltipla.
 */
import { LABELS } from './toggle-group.fixtures';
import type { ToggleVariant } from './toggle';
import type { ToggleGroupOrientation, ToggleGroupType } from './toggle-group';

export type ToggleGroupArgs = {
  type: ToggleGroupType;
  variant: ToggleVariant;
  orientation: ToggleGroupOrientation;
  disabled: boolean;
  ariaLabel: string;
  onValueChange?: (value: string | string[]) => void;
};

/**
 * Ver a nota em separator.source.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos args. O `transform` devolve o
 * uso real, já com os valores atuais dos controls.
 */
export function toggleGroupPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<ToggleGroupArgs> } = {},
): string {
  const {
    type = 'single',
    variant = 'outline',
    orientation = 'horizontal',
    disabled = false,
    ariaLabel = 'Alinhamento do texto',
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet — documentação que repete valor
  // padrão ensina ruído.
  const attrs = [
    type === 'single' ? '' : `type="${type}"`,
    variant === 'default' ? '' : `variant="${variant}"`,
    orientation === 'horizontal' ? '' : `orientation="${orientation}"`,
    disabled ? '[disabled]="true"' : '',
    type === 'single' ? `defaultValue="left"` : `[defaultValue]="['left']"`,
    // O grupo sem nome acessível anuncia só "barra de ferramentas".
    `aria-label="${ariaLabel}"`,
  ].filter(Boolean);

  const variantItem = variant === 'default' ? '' : ` variant="${variant}"`;
  const items = (['left', 'center', 'right'] as const)
    .map(
      (v) =>
        `      <button ndsToggle${variantItem} value="${v}" aria-label="${LABELS[v]}">\n` +
        `        <svg ndsToggleGroupIcon kind="align-${v}"></svg>\n` +
        `      </button>`,
    )
    .join('\n');

  return `import { NdsToggle } from '@/components/ui/toggle';
import { NdsToggleGroup, NdsToggleGroupIcon } from '@/components/ui/toggle-group';

@Component({
  imports: [NdsToggleGroup, NdsToggleGroupIcon, NdsToggle],
  template: \`
    <div
      ndsToggleGroup
      ${attrs.join('\n      ')}
    >
${items}
    </div>
  \`,
})
export class Exemplo {}`;
}
