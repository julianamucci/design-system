/**
 * Transform do painel Code do Select.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o campo é uma composição de quatro peças do barril
 * `NDS_SELECT` — raiz, gatilho, valor e conteúdo em `ng-template` —, e o estado
 * é um signal ligado por `[(value)]`. Os itens são escritos à mão, e não
 * varridos de uma lista: quem copia quer ver a forma de um item, não o `@for`
 * que a story usa para montar a fixture.
 */
import type { SelectSide, SelectAlign, SelectSize } from './select';

export type SelectArgs = {
  size: SelectSize;
  side: SelectSide;
  align: SelectAlign;
  placeholder: string;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  onValueChange: (value: unknown) => void;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com o `@for`
 * que monta os itens e com `[side]="side"` ligado ao arg. Isso é o andaime da
 * story, não o que alguém escreve para usar o campo. O `transform` devolve o uso
 * real, com os valores atuais dos controls já resolvidos (ver a nota em
 * `separator.source.ts`).
 */
export function selectPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<SelectArgs> } = {},
): string {
  const {
    size = 'default',
    side = 'bottom',
    align = 'start',
    placeholder = 'Selecione...',
    disabled = false,
    required = false,
    invalid = false,
  } = ctx.args ?? {};

  // Só o que difere do padrão entra: snippet que repete valor default ensina
  // ruído a quem copia.
  const root =
    ['<nds-select [(value)]="estado"']
      .concat(disabled ? ['disabled'] : [])
      .concat(required ? ['required'] : [])
      .concat(invalid ? ['invalid'] : [])
      .join(' ') + '>';

  const trigger =
    ['<button ndsSelectTrigger aria-label="Estado"']
      .concat(size === 'default' ? [] : [`size="${size}"`])
      .join(' ') + '>';

  const content =
    ['<ng-template ndsSelectContent']
      .concat(side === 'bottom' ? [] : [`side="${side}"`])
      .concat(align === 'start' ? [] : [`align="${align}"`])
      .join(' ') + '>';

  return `import { NDS_SELECT } from '@/components/ui/select';

@Component({
  imports: [...NDS_SELECT],
  template: \`
    ${root}
      ${trigger}
        <span ndsSelectValue placeholder="${placeholder}"></span>
      </button>

      ${content}
        <div ndsSelectItem value="sp">São Paulo</div>
        <div ndsSelectItem value="rj">Rio de Janeiro</div>
        <div ndsSelectItem value="mg">Minas Gerais</div>
      </ng-template>
    </nds-select>
  \`,
})
export class Exemplo {
  readonly estado = signal<string | undefined>(undefined);
}`;
}
