/**
 * Transforms do painel Code do Badge.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum. Exportar do próprio `.stories.ts`
 * não serve: export que não é story vira uma story fantasma na barra lateral,
 * que é o motivo de `menubar.fixtures.ts` existir.
 *
 * Chamável SEM argumento, como a convenção da stack pede: os args da story são
 * opcionais e caem no padrão do componente, que é justamente o uso canônico.
 */
import type { BadgeVariant } from './badge';

export type BadgeArgs = {
  variant: BadgeVariant;
  label: string;
};

/**
 * Transform do `meta` — vale para todas as stories do arquivo.
 *
 * O `variant` só entra quando difere do padrão: snippet que repete valor
 * default ensina ruído a quem copia.
 */
export function badgePlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<BadgeArgs> } = {},
): string {
  const { variant = 'default', label = 'Ativo' } = ctx.args ?? {};
  const attrs = variant === 'default' ? '' : ` variant="${variant}"`;
  return `import { NdsBadge } from '@/components/ui/badge';

@Component({
  imports: [NdsBadge],
  template: \`<span ndsBadge${attrs}>${label}</span>\`,
})
export class Exemplo {}`;
}
