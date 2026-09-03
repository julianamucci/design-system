/**
 * Transform do painel Code do Button.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina, além da variante e do tamanho, é a virada do
 * botão só-ícone: nos tamanhos `icon*` o rótulo deixa de ser texto visível e
 * passa a `aria-label`, e o import ganha o `NdsButtonIcon`. Sem essa troca o
 * botão ficaria sem nome acessível, que é o defeito clássico deste componente.
 */
import type { ButtonVariant, ButtonSize } from './button';

export type ButtonArgs = {
  variant: ButtonVariant;
  size: ButtonSize;
  label: string;
  disabled: boolean;
  onClick?: (e: MouseEvent) => void;
  // Documentadas na aba "API Reference" sem control — o Playground não as
  // encaminha para o componente, mas fazem parte da API do NdsButton.
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
};

/**
 * Ver a nota em separator.stories.ts: o painel Code mostra o `template` da
 * story, com o `@if` que alterna texto e ícone e os bindings ligados aos args.
 * O `transform` devolve o uso real, com os valores atuais dos controls.
 */
export function buttonPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<ButtonArgs> } = {},
): string {
  const { variant = 'default', size = 'default', label = 'Salvar', disabled = false } =
    ctx.args ?? {};
  const isIcon = size.startsWith('icon');

  // Só o que difere do default entra no snippet — documentação que repete
  // valor padrão ensina ruído.
  const attrs = [
    variant === 'default' ? '' : `variant="${variant}"`,
    size === 'default' ? '' : `size="${size}"`,
    disabled ? '[disabled]="true"' : '',
    isIcon ? `aria-label="${label || 'Ação'}"` : '',
  ].filter(Boolean).join(' ');

  const abre = attrs ? `<button ndsButton ${attrs}>` : '<button ndsButton>';
  const content = isIcon
    ? '      <svg ndsButtonIcon kind="plus"></svg>'
    : `      ${label}`;

  return `import { NdsButton${isIcon ? ', NdsButtonIcon' : ''} } from '@/components/ui/button';

@Component({
  imports: [NdsButton${isIcon ? ', NdsButtonIcon' : ''}],
  template: \`
    ${abre}
${content}
    </button>
  \`,
})
export class Exemplo {}`;
}
