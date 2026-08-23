// Snippet do painel Code do Avatar — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { AvatarSize } from './avatar';

export type AvatarSnippetOptions = {
  /** URL da foto. Vazia mostra o composto só com as iniciais. */
  src?: string;
  alt?: string;
  /** Iniciais do fallback — entra na chamada como `fallbackText`. */
  fallback?: string;
  size?: AvatarSize;
  /** Atraso, em ms, antes de as iniciais aparecerem. */
  delayMs?: number;
  className?: string;
  /** Rótulo do ponto de status no canto (`createAvatarBadge`). */
  status?: string;
};

const FOTO_DEFAULT = 'https://i.pravatar.cc/128?img=47';
const ALT_DEFAULT = 'Foto de perfil de Maria Rodrigues';

/** A chamada real de `createAvatar` com as opções da story. */
export function avatarSnippet(o: AvatarSnippetOptions = {}): string {
  const src = o.src === undefined ? FOTO_DEFAULT : o.src;
  const fallback = o.fallback ?? 'MR';

  const lines = opcoes([
    ['src', src ? texto(src) : undefined],
    // Sem foto não há o que descrever: o alt acompanha a imagem.
    ['alt', src ? texto(o.alt ?? ALT_DEFAULT) : undefined],
    ['fallbackText', fallback ? texto(fallback) : undefined],
    // `md` é o padrão da fábrica: só os outros presets entram.
    ['size', o.size && o.size !== 'md' ? texto(o.size) : undefined],
    ['delayMs', src && o.delayMs ? String(o.delayMs) : undefined],
    ['className', o.className ? texto(o.className) : undefined],
  ]);

  const names = ['createAvatar'];
  if (o.status) names.push('createAvatarBadge');

  return snippet(
    importing('avatar', ...names),
    `const avatar = ${chamada('createAvatar', lines)};`,
    o.status
      ? `avatar.appendChild(createAvatarBadge({ 'aria-label': ${texto(o.status)} }));`
      : undefined,
    montar('avatar'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica.
 */
export const avatarSource: SourceTransform<AvatarSnippetOptions> = (_gerado, ctx) =>
  avatarSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function avatarSourceWith(
  fixas: AvatarSnippetOptions,
): SourceTransform<AvatarSnippetOptions> {
  return (_gerado, ctx) => avatarSnippet({ ...ctx.args, ...fixas });
}

// ─── Sem imagem, pelas fábricas granulares ───────────────────────────────────

export type AvatarGranularSnippetOptions = {
  /** Iniciais do fallback. Sem elas, o fallback recebe um ícone. */
  fallback?: string;
  size?: AvatarSize;
  /** Nome acessível quando o conteúdo é um ícone, não iniciais. */
  iconLabel?: string;
};

/**
 * FORMA diferente: sem foto não há o que reconciliar, e o composto perde a
 * razão de existir. As fábricas granulares montam o avatar peça por peça — é
 * também o único caminho para um fallback que não é texto.
 */
export function avatarGranularSnippet(o: AvatarGranularSnippetOptions = {}): string {
  const names = ['createAvatarFallback', 'createAvatarRoot'];
  const raiz = opcoes([['size', o.size && o.size !== 'md' ? texto(o.size) : undefined]]);

  if (o.iconLabel) {
    return snippet(
      importing('avatar', ...names),
      `const avatar = ${raiz.length ? chamada('createAvatarRoot', raiz) : 'createAvatarRoot()'};`,
      `// \`icone\` é um SVG do seu conjunto, decorativo: aria-hidden="true".
// O papel de imagem é o que deixa o fallback receber um nome acessível.
const fallback = createAvatarFallback();
fallback.setAttribute('role', 'img');
fallback.setAttribute('aria-label', ${texto(o.iconLabel)});
fallback.appendChild(icone);
avatar.appendChild(fallback);`,
      montar('avatar'),
    );
  }

  return snippet(
    importing('avatar', ...names),
    `const avatar = ${raiz.length ? chamada('createAvatarRoot', raiz) : 'createAvatarRoot()'};`,
    `avatar.appendChild(createAvatarFallback({ text: ${texto(o.fallback ?? 'JP')} }));`,
    montar('avatar'),
  );
}

export function avatarGranularSourceWith(
  fixas: AvatarGranularSnippetOptions,
): SourceTransform<AvatarGranularSnippetOptions> {
  return (_gerado, ctx) => avatarGranularSnippet({ ...ctx.args, ...fixas });
}

// ─── Fila de avatares ────────────────────────────────────────────────────────

export type AvatarGroupSnippetOptions = {
  /**
   * Nome acessível da fila. A opção da fábrica chama-se `'aria-label'` — é ela
   * que emite `role="group"` e `aria-label` juntos; sem ela a fila é anônima.
   */
  'aria-label'?: string;
  /** Texto do excedente, no formato `+N`. */
  excedente?: string;
};

/**
 * FORMA diferente: três fábricas compõem a fila, e o contador é o último item.
 */
export function groupAvatarSnippet(o: AvatarGroupSnippetOptions = {}): string {
  return snippet(
    importing('avatar', 'createAvatar', 'createAvatarGroup', 'createAvatarGroupCount'),
    `const fotos = ['/equipe/maria.jpg', '/equipe/joao.jpg', '/equipe/ana.jpg'];

const grupo = createAvatarGroup({ 'aria-label': ${texto(o['aria-label'] ?? 'Participantes')} });
for (const src of fotos) {
  // Alt vazio: quem nomeia a fila é o rótulo do grupo, e repetir o nome de
  // cada pessoa faria o leitor de tela anunciar a lista duas vezes.
  grupo.appendChild(createAvatar({ src, alt: '', fallbackText: '' }));
}`,
    `const contador = createAvatarGroupCount({ text: ${texto(o.excedente ?? '+3')} });
contador.setAttribute('aria-hidden', 'true');
grupo.appendChild(contador);`,
    montar('grupo'),
  );
}

export function groupSourceWithAvatar(
  fixas: AvatarGroupSnippetOptions,
): SourceTransform<AvatarGroupSnippetOptions> {
  return (_gerado, ctx) => groupAvatarSnippet({ ...ctx.args, ...fixas });
}
