/**
 * Andaime das demonstrações do Avatar — um construtor, dois arquivos de story.
 *
 * Este módulo existe porque num `*.stories.ts` todo export nomeado vira story:
 * o andaime não pode ser exportado de lá, e a saída fácil é copiar a `function`
 * para cada arquivo. Cópia divergida não é variação — é o defeito, porque
 * corrigir uma delas deixa a outra errada sem nenhum sinal.
 *
 * O que variava entre as cópias, e por quê: a de `avatar-tamanhos` mudava só o
 * preset de um avatar fixo (a Maria), enquanto a da story raiz mapeia os args
 * do painel de controls — e precisa poder ficar SEM imagem, que é o caso do
 * fallback. As duas coisas cabem numa assinatura só, com `src` opcional e o
 * exemplo fixo numa constante.
 */

import { createAvatar, type AvatarSize } from './avatar';

/** Foto de exemplo usada pelas demonstrações do Avatar nas cinco stacks. */
export const IMG_MARIA =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces';

/** A pessoa de exemplo: mesma foto, mesmo alt e mesmas iniciais em toda story. */
export const AVATAR_EXEMPLO = {
  src: IMG_MARIA,
  alt: 'Foto de perfil de Maria Rodrigues',
  fallback: 'MR',
} as const;

export interface AvatarDemoOptions {
  /**
   * URL da foto. NÃO tem padrão de propósito: a story raiz passa
   * `args.src || undefined` justamente para demonstrar o fallback, e um padrão
   * aqui apagaria esse caso — o avatar sem imagem deixaria de existir.
   */
  src?: string;
  alt: string;
  fallback: string;
  size?: AvatarSize;
  className?: string;
}

/** Avatar composto: imagem, alt e iniciais de reserva. */
export function buildAvatar(o: AvatarDemoOptions): HTMLElement {
  return createAvatar({
    src: o.src,
    alt: o.alt,
    fallbackText: o.fallback,
    size: o.size,
    className: o.className,
  });
}
