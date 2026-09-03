/**
 * Transform do painel Code do Switch.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o interruptor é um `<button>` e o rótulo é um
 * `<label ndsLabel for="…">` ao lado — o par `id`/`for` é o que dá nome
 * acessível ao controle, e é por isso que o `id` aparece sempre, mesmo sendo o
 * único atributo que não vem de um control.
 */
import type { SwitchSize } from './switch';

export type SwitchArgs = {
  checked: boolean;
  size: SwitchSize;
  disabled: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

/** Ver a nota em separator.source.ts. */
export function switchPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<SwitchArgs> } = {},
): string {
  const {
    checked = false,
    size = 'default',
    disabled = false,
    label = 'Receber notificações',
  } = ctx.args ?? {};

  const attrs = [
    'id="notificacoes"',
    checked ? '[checked]="true"' : '',
    size === 'default' ? '' : `size="${size}"`,
    disabled ? '[disabled]="true"' : '',
  ].filter(Boolean).join(' ');

  return `import { NdsSwitch } from '@/components/ui/switch';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsSwitch, NdsLabel],
  template: \`
    <div class="nds-cluster" data-spacing="sm">
      <button ndsSwitch ${attrs}></button>
      <label ndsLabel for="notificacoes">${label}</label>
    </div>
  \`,
})
export class Exemplo {}`;
}
