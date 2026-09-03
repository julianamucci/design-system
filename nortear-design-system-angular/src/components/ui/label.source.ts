/**
 * Transform do painel Code do Label.
 *
 * Módulo próprio para entrar na varredura do `source-snippets.test.ts`, que
 * CHAMA cada export de `*.source.ts` e lê o snippet publicado. Enquanto o
 * construtor era função local da story, o que o leitor copia não tinha portão.
 *
 * O snippet ensina o par rótulo + controle amarrado por `for`/`id`, e o
 * asterisco de obrigatório como enfeite `aria-hidden`: quem anuncia a exigência
 * ao leitor de tela é o `aria-required` do campo, nunca o símbolo.
 */
export type LabelArgs = {
  text: string;
  htmlFor: string;
  required: boolean;
  disabled: boolean;
};

/**
 * Ver a nota em separator.stories.ts: o painel Code mostra o `template` da
 * story, com o `@if` do asterisco e os bindings ligados aos args. O transform
 * devolve o uso real com os valores atuais dos controls.
 */
export function labelPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<LabelArgs> } = {},
): string {
  const { text = 'Nome completo', htmlFor = 'playground-label', required = false, disabled = false } =
    ctx.args ?? {};

  const marcador = required
    ? `\n      <span class="nds-text-destructive" aria-hidden="true">*</span>`
    : '';
  const inputAttrs = [
    'class="nds-input' + (disabled ? ' nds-peer' : '') + '"',
    `id="${htmlFor}"`,
    required ? 'aria-required="true"' : '',
    disabled ? 'disabled' : '',
  ].filter(Boolean).join(' ');

  return `import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsLabel],
  template: \`
    <label ndsLabel for="${htmlFor}">
      ${text}${marcador}
    </label>
    <input ${inputAttrs} />
  \`,
})
export class Exemplo {}`;
}
