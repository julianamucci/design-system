/**
 * Transforms do painel Code do Avatar.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. O snippet importa do design system, com os
 * nomes que `avatar/index.ts` exporta de verdade.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type AvatarArgs = {
  size: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  class?: string;
};

const IMPORT_IMAGEM = `import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";`;

const FOTO = `<AvatarImage src="/equipe/maria.jpg" alt="Foto de perfil de Maria Rodrigues" />`;

/** Junta os atributos da raiz: só o que difere do padrão do componente entra. */
function raiz(size: AvatarArgs['size'] = 'md', classe?: string): string {
  return attrs(size !== 'md' ? `size="${size}"` : '', classe ? `class="${classe}"` : '');
}

/**
 * Forma canônica: foto com iniciais de reserva. Serve o Playground, a story
 * `md` dos tamanhos e as stories de imagem carregada dos estados e composições.
 */
export function avatarSource(_gerado?: string, ctx?: { args?: Partial<AvatarArgs> }): string {
  const { size = 'md', class: classe } = ctx?.args ?? {};

  return svelteSnippet(
    IMPORT_IMAGEM,
    `<Avatar${raiz(size, classe)}>
  ${FOTO}
  <AvatarFallback>MR</AvatarFallback>
</Avatar>`,
  );
}

/** A mesma composição num preset fixo — cada story de tamanho ensina o seu. */
function noTamanho(size: AvatarArgs['size']): string {
  return avatarSource('', { args: { size } });
}

/** Tamanho sm (24px). */
export function avatarTamanhoSmSource(): string {
  return noTamanho('sm');
}

/** Tamanho lg (40px). */
export function avatarTamanhoLgSource(): string {
  return noTamanho('lg');
}

/** Tamanho xl (48px). */
export function avatarTamanhoXlSource(): string {
  return noTamanho('xl');
}

/** Tamanho 2xl (64px). */
export function avatarTamanho2xlSource(): string {
  return noTamanho('2xl');
}

/** Estado de carregamento: o atraso segura a troca do fallback pela foto. */
export function avatarCarregandoSource(): string {
  return svelteSnippet(
    IMPORT_IMAGEM,
    `<Avatar delayMs={600}>
  ${FOTO}
  <AvatarFallback>MR</AvatarFallback>
</Avatar>`,
  );
}

/** Composição só com iniciais: sem imagem, o fallback aparece na hora. */
export function avatarIniciaisSource(): string {
  return svelteSnippet(
    `import { Avatar, AvatarFallback } from "@/components/ui/avatar";`,
    `<Avatar>
  <AvatarFallback>JP</AvatarFallback>
</Avatar>`,
  );
}

/**
 * Composição com ícone genérico — serve a story de ícone das composições e a
 * de ausência de imagem dos estados. Quem nomeia é o rótulo do fallback: o
 * desenho é decorativo.
 */
export function avatarIconeSource(): string {
  return svelteSnippet(
    `import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import User from "@lucide/svelte/icons/user";`,
    `<Avatar>
  <AvatarFallback role="img" aria-label="Usuário genérico">
    <User class="nds-icon-lg" aria-hidden="true" />
  </AvatarFallback>
</Avatar>`,
  );
}

/** Composição em grupo: a sobreposição e a borda vêm do AvatarGroup. */
export function avatarGrupoSource(): string {
  return svelteSnippet(
    `import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";`,
    `<AvatarGroup role="group" aria-label="Participantes">
  <Avatar>
    <AvatarImage src="/equipe/maria.jpg" alt="" />
    <AvatarFallback>MR</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="/equipe/joao.jpg" alt="" />
    <AvatarFallback>JP</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="/equipe/ana.jpg" alt="" />
    <AvatarFallback>AS</AvatarFallback>
  </Avatar>
  <AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>
</AvatarGroup>`,
  );
}

/** Composição com indicador de status no canto inferior direito. */
export function avatarComStatusSource(): string {
  return svelteSnippet(
    `import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";`,
    `<Avatar>
  ${FOTO}
  <AvatarFallback>MR</AvatarFallback>
  <AvatarBadge role="img" aria-label="Online" />
</Avatar>`,
  );
}
