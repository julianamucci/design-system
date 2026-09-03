/**
 * Transform do painel Code do Progress.
 *
 * Módulo à parte porque a guarda `source-snippets.test.ts` só CHAMA o que um
 * `*.source.ts` exporta. Enquanto o construtor era função local da story, o
 * texto que o leitor copia não passava por portão algum.
 *
 * O snippet ensina as três camadas da barra — raiz, trilha e indicador — e o
 * `aria-label`, que aqui não é enfeite: a barra não tem texto próprio, então
 * sem ele o leitor de tela anuncia um progresso sem dizer de quê.
 */
export type ProgressArgs = {
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
};

/** Ver a nota em separator.stories.ts. */
export function progressPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<ProgressArgs> } = {},
): string {
  const { value = 42, min = 0, max = 100, ariaLabel = 'Progresso do upload' } = ctx.args ?? {};

  // Só o que difere do default entra: snippet que repete valor padrão ensina ruído.
  const attrs = [
    `[value]="${value}"`,
    min !== 0 ? `[min]="${min}"` : '',
    max !== 100 ? `[max]="${max}"` : '',
    `aria-label="${ariaLabel}"`,
  ]
    .filter(Boolean)
    .join(' ');

  return `import { NDS_PROGRESS } from '@/components/ui/progress';

@Component({
  imports: [...NDS_PROGRESS],
  template: \`
    <div ndsProgress ${attrs}>
      <div ndsProgressTrack>
        <div ndsProgressIndicator></div>
      </div>
    </div>
  \`,
})
export class Exemplo {}`;
}
