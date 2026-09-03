/**
 * Transform do painel Code do Toggle.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o botão de alternância é um `<button>` com a
 * diretiva, e o estado inicial entra por `defaultPressed` — não por `pressed`,
 * que o componente controla. Quando o botão é só ícone, o `aria-label` é
 * OBRIGATÓRIO: sem texto visível não há nome acessível nenhum, e o botão vira
 * um alvo mudo.
 */
import type { ToggleSize, ToggleVariant } from './toggle';

export type ToggleArgs = {
  variant: ToggleVariant;
  size: ToggleSize;
  pressed: boolean;
  disabled: boolean;
  label: string;
  iconOnly: boolean;
  onPressedChange?: (pressed: boolean) => void;
};

/**
 * Ver a nota em separator.source.ts: o painel Code mostra o `template` da
 * story, com o `@if` que alterna icon-only e rótulo visível e os bindings
 * ligados aos args. O `transform` devolve o uso real, com os valores atuais dos
 * controls.
 */
export function togglePlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<ToggleArgs> } = {},
): string {
  const {
    variant = 'default',
    size = 'default',
    pressed = false,
    disabled = false,
    label = 'Mostrar ocultos',
    iconOnly = true,
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet — documentação que repete valor
  // padrão ensina ruído.
  const attrs = [
    variant === 'default' ? '' : `variant="${variant}"`,
    size === 'default' ? '' : `size="${size}"`,
    pressed ? '[defaultPressed]="true"' : '',
    disabled ? '[disabled]="true"' : '',
    // Toggle sem texto visível não tem nome acessível nenhum sem isto.
    iconOnly ? `aria-label="${label || 'Alternar'}"` : '',
  ].filter(Boolean).join(' ');

  const abre = attrs ? `<button ndsToggle ${attrs}>` : '<button ndsToggle>';
  const content = iconOnly
    ? '      <svg ndsToggleIcon kind="bold"></svg>'
    : `      <svg ndsToggleIcon kind="eye"></svg>\n      ${label}`;

  return `import { NdsToggle, NdsToggleIcon } from '@/components/ui/toggle';

@Component({
  imports: [NdsToggle, NdsToggleIcon],
  template: \`
    ${abre}
${content}
    </button>
  \`,
})
export class Exemplo {}`;
}
