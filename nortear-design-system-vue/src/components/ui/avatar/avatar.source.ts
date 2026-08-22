/**
 * Transforms do painel Code do Avatar.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import {
  attr,
  attrNum,
  attrs,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type AvatarArgs = {
  size: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  class: string;
};

const IMPORT = `import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'`;

const FOTO_MARIA =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces';
const FOTO_JOAO =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces';
const FOTO_ANA =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=faces';

/**
 * Ícone genérico de pessoa, decorativo: quem nomeia o avatar é o rótulo do
 * próprio fallback, e um ícone anunciado repetiria a mesma informação.
 */
const ICON_USUARIO = `<svg
  aria-hidden="true"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="nds-icon-lg"
>
  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
  <circle cx="12" cy="7" r="4" />
</svg>`;

/** Raiz + filhos, cada filho indentado um nível. */
function avatar(partes: Array<string | false | undefined>, filhos: string[]): string {
  return `<Avatar${attrs(...partes)}>\n${indentar(filhos.join('\n'))}\n</Avatar>`;
}

/** A foto, identificada pelo texto alternativo. */
function foto(src: string, alt: string): string {
  return `<AvatarImage src="${src}" alt="${alt}" />`;
}

/**
 * Forma canônica: a foto e, atrás dela, o que aparece quando ela não chega.
 *
 * `delay-ms` segura as iniciais pelo tempo em que a foto ainda pode chegar —
 * sem ele, uma conexão lenta pisca as letras antes de trocá-las pela imagem.
 *
 * O diâmetro sai do preset; o preset padrão não é escrito, e a classe extra
 * mostra a extensibilidade documentada — ela SOMA à do componente.
 */
export const avatarSource: SourceTransform<AvatarArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    IMPORT,
    avatar([attr('size', args.size, 'md'), attr('class', args.class)], [
      `<AvatarImage
  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format"
  alt="Foto de perfil de Maria Rodrigues"
/>`,
      `<AvatarFallback${attrs(attrNum('delay-ms', 600))}>MR</AvatarFallback>`,
    ]),
  );
};

/** Cada preset de diâmetro, com a mesma composição por baixo. */
function withPreset(size?: string): string {
  return vueSnippet(
    IMPORT,
    avatar([attr('size', size, 'md')], [
      foto(FOTO_MARIA, 'Foto de perfil de Maria Rodrigues'),
      '<AvatarFallback>MR</AvatarFallback>',
    ]),
  );
}

/** Preset mínimo: para lista densa, ao lado de uma linha de texto. */
export function avatarSmSource(): string {
  return withPreset('sm');
}

/**
 * Preset padrão: não se escreve. O componente já entrega este diâmetro quando
 * ninguém pede outro, e repeti-lo ensinaria que a prop é obrigatória.
 */
export function avatarMdSource(): string {
  return withPreset('md');
}

/** Preset de lista e de cabeçalho de card. */
export function avatarLgSource(): string {
  return withPreset('lg');
}

/** Preset de destaque: cabeçalho de perfil e menu de conta. */
export function avatarXlSource(): string {
  return withPreset('xl');
}

/** Preset máximo: a página de perfil, onde o avatar é o assunto. */
export function avatarTwoXlSource(): string {
  return withPreset('2xl');
}

/**
 * Ciclo de carregamento da foto: não há nada a escrever.
 *
 * Chegando a imagem, ela fica e o conteúdo de reserva sai; falhando, o de
 * reserva permanece. Quem decide é o componente — o exemplo é o mesmo nos dois
 * desfechos, e é justamente isso que o leitor precisa saber.
 */
export function avatarCarregadoSource(): string {
  return vueSnippet(
    IMPORT,
    avatar([], [
      foto(FOTO_MARIA, 'Foto de perfil de Maria Rodrigues'),
      '<AvatarFallback>MR</AvatarFallback>',
    ]),
  );
}

/**
 * Espera com atraso: as iniciais só entram depois do prazo. É o que evita o
 * pisca-pisca de letras em conexão lenta — e o prazo é do conteúdo de reserva,
 * não da imagem.
 */
export function avatarLoadingSource(): string {
  return vueSnippet(
    IMPORT,
    avatar([], [
      foto(FOTO_MARIA, 'Foto de perfil de Maria Rodrigues'),
      `<AvatarFallback${attrs(attrNum('delay-ms', 600))}>MR</AvatarFallback>`,
    ]),
  );
}

/**
 * Sem foto nenhuma: o conteúdo de reserva aparece na hora, sem espera.
 *
 * Sendo ele o único conteúdo, é ele que nomeia o avatar — daí o papel e o
 * rótulo. Escondê-lo da árvore de acessibilidade deixaria o avatar mudo.
 */
export function avatarNoImageSource(): string {
  return vueSnippet(
    `import { Avatar, AvatarFallback } from '@/components/ui/avatar'`,
    avatar([], [
      `<AvatarFallback role="img" aria-label="Usuário genérico">
${indentar(ICON_USUARIO)}
</AvatarFallback>`,
    ]),
  );
}

/** Foto com iniciais de reserva, o par mais comum. */
export function avatarWithImageSource(): string {
  return vueSnippet(
    IMPORT,
    avatar([], [
      foto(FOTO_MARIA, 'Foto de perfil de Maria Rodrigues'),
      `<AvatarFallback${attrs(attrNum('delay-ms', 600))}>MR</AvatarFallback>`,
    ]),
  );
}

/**
 * Só iniciais: sem imagem, não há import de imagem nem espera. Duas letras
 * bastam — três já não cabem no preset menor.
 */
export function avatarWithIniciaisSource(): string {
  return vueSnippet(
    `import { Avatar, AvatarFallback } from '@/components/ui/avatar'`,
    avatar([], ['<AvatarFallback>JP</AvatarFallback>']),
  );
}

/** Ícone no lugar das iniciais, para quem ainda não tem nome nem foto. */
export function avatarWithIconSource(): string {
  return avatarNoImageSource();
}

/**
 * Fila de participantes: a sobreposição vem do agrupador, e o excedente fecha
 * a fila.
 *
 * Cada foto vai com texto alternativo VAZIO de propósito: quem nomeia o
 * conjunto é o rótulo do grupo, e um nome por avatar faria o leitor de tela
 * recitar a lista inteira. Pela mesma razão o contador fica fora da árvore.
 */
export function avatarGroupSource(): string {
  const pessoas: Array<[string, string]> = [
    [FOTO_MARIA, 'MR'],
    [FOTO_JOAO, 'JP'],
    [FOTO_ANA, 'AS'],
  ];
  const membros = pessoas
    .map(([src, iniciais]) =>
      avatar([], [foto(src, ''), `<AvatarFallback>${iniciais}</AvatarFallback>`]),
    )
    .join('\n');
  return vueSnippet(
    `import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar'`,
    `<AvatarGroup role="group" aria-label="Participantes">
${indentar(membros)}
  <AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>
</AvatarGroup>`,
  );
}

/**
 * Indicador de situação: o selo é o terceiro filho e se ancora sozinho no canto
 * inferior direito. Ele carrega o próprio rótulo, porque a cor sozinha não diz
 * nada a quem não a vê.
 */
export function avatarWithStatusSource(): string {
  return vueSnippet(
    `import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'`,
    avatar([], [
      foto(FOTO_MARIA, 'Foto de perfil de Maria Rodrigues'),
      '<AvatarFallback>MR</AvatarFallback>',
      '<AvatarBadge role="img" aria-label="Online" />',
    ]),
  );
}
