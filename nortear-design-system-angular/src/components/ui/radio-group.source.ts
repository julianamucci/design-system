/**
 * Transform do painel Code do RadioGroup.
 *
 * Vive fora do arquivo de story para entrar na varredura do
 * `source-snippets.test.ts`, que CHAMA cada export e cobra o snippet publicado.
 * Construtor inline é função local: nem exportada, nem alcançável.
 *
 * O snippet ensina o grupo como `<fieldset>` com nome vindo de
 * `aria-labelledby` — o título do grupo é um elemento real da página, não um
 * atributo solto — e cada opção com o rótulo amarrado por `for`/`id`.
 */
export type RadioGroupArgs = {
  groupLabel: string;
  name: string;
  value: string;
  disabled: boolean;
  onValueChange: (value: string | null) => void;
};

/** Ver a nota em separator.stories.ts. */
export function radioGroupPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<RadioGroupArgs> } = {},
): string {
  const { groupLabel = 'Forma de pagamento', name = 'payment', value = '', disabled = false } =
    ctx.args ?? {};

  // Só o que difere do default entra: snippet que repete valor padrão ensina ruído.
  const attrs = [
    `name="${name}"`,
    value ? `value="${value}"` : '',
    disabled ? '[disabled]="true"' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `import { NdsRadioGroup, NdsRadioGroupItem } from '@/components/ui/radio-group';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsRadioGroup, NdsRadioGroupItem, NdsLabel],
  template: \`
    <p id="pagamento-titulo" class="nds-text-body nds-font-semibold">${groupLabel}</p>
    <fieldset ndsRadioGroup aria-labelledby="pagamento-titulo" ${attrs}>
      <div class="nds-radio-row">
        <button ndsRadioGroupItem value="cartao" id="cartao"></button>
        <label ndsLabel class="nds-radio-label" for="cartao">Cartão de crédito</label>
      </div>
      <div class="nds-radio-row">
        <button ndsRadioGroupItem value="pix" id="pix"></button>
        <label ndsLabel class="nds-radio-label" for="pix">Pix</label>
      </div>
    </fieldset>
  \`,
})
export class Exemplo {}`;
}
