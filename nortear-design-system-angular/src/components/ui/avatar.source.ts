/**
 * Transform do painel Code do Avatar.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é o par imagem + fallback: as duas peças convivem
 * no mesmo avatar, e o `delayMs` é o que evita o pisca do fallback enquanto a
 * foto ainda carrega. O comentário sobre o `alt` viaja junto de propósito — é
 * ali que se decide se o leitor de tela anuncia a pessoa uma vez ou duas.
 */
import type { AvatarSize } from './avatar';

export type AvatarArgs = {
  src: string;
  alt: string;
  fallback: string;
  size: AvatarSize;
  delayMs: number;
  onStatusChange: (status: string) => void;
};

/** Ver a nota em separator.stories.ts. */
export function avatarPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<AvatarArgs> } = {},
): string {
  const {
    alt = 'Foto de perfil de Maria Rodrigues',
    fallback = 'MR',
    size = 'md',
    delayMs = 600,
  } = ctx.args ?? {};
  // Só o que difere do default entra: snippet que repete valor padrão ensina
  // ruído. `size="md"` é o default do componente.
  const sizeAttr = size === 'md' ? '' : ` size="${size}"`;
  const delay = delayMs ? ` [delayMs]="${delayMs}"` : '';
  return `import { NDS_AVATAR } from '@/components/ui/avatar';

@Component({
  imports: [...NDS_AVATAR],
  template: \`
    <span ndsAvatar${sizeAttr}>
      <img ndsAvatarImage src="/maria.jpg" alt="${alt}" />
      <!-- aria-hidden porque o alt acima já identifica a pessoa:
           sem isso o leitor de tela anuncia o nome duas vezes. -->
      <span ndsAvatarFallback${delay}>${fallback}</span>
    </span>
  \`,
})
export class Exemplo {}`;
}
