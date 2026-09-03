/**
 * Transform do painel Code do Sonner.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o `<div ndsToaster>` entra UMA VEZ, no root da
 * aplicação, e `toast()` é chamado de qualquer lugar — sem referência ao
 * Toaster e sem injeção. É a peça em que a story mais engana: o botão que
 * dispara a demonstração existe só para haver o que clicar, e copiá-lo ensinaria
 * a montar o toaster junto do gatilho.
 */
import { TEXTS } from './sonner.fixtures';
import type { ToastPosition, ToastType } from './sonner';

export type SonnerArgs = {
  type: ToastType;
  title: string;
  description: string;
  actionLabel: string;
  position: ToastPosition;
  richColors: boolean;
  closeButton: boolean;
  duration: number;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o botão que só
 * existe para disparar a demonstração e com os bindings ligados aos controls. É
 * o que a pessoa copia, e não é o que ela deve escrever. Ver a nota em
 * `separator.source.ts`.
 */
export function sonnerPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<SonnerArgs> } = {},
): string {
  const {
    type = 'success',
    title = TEXTS.success,
    description = '',
    actionLabel = '',
    position = 'top-right',
    richColors = true,
    closeButton = false,
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet — documentação que repete valor
  // padrão ensina ruído.
  const tagAttrs = [
    `position="${position}"`,
    richColors ? '[richColors]="true"' : '',
    closeButton ? '[closeButton]="true"' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const options = [
    description ? `description: '${description}'` : '',
    actionLabel ? `action: { label: '${actionLabel}', onClick: () => this.desfazer() }` : '',
  ].filter(Boolean);

  const call = type === 'default' ? 'toast' : `toast.${type}`;
  const tagArgs = options.length
    ? `'${title}', {\n      ${options.join(',\n      ')},\n    }`
    : `'${title}'`;

  return `import { NdsToaster, toast } from '@/components/ui/sonner';

@Component({
  imports: [NdsToaster],
  // O Toaster entra UMA VEZ, no root da aplicação. \`toast()\` é chamado de
  // qualquer lugar — não precisa de referência ao Toaster nem de injeção.
  template: \`
    <div ndsToaster ${tagAttrs}></div>
  \`,
})
export class Exemplo {
  confirmar(): void {
    ${call}(${tagArgs});
  }
}`;
}
