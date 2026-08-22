/**
 * Transforms do painel Code do Avatar.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O painel imprimia `src={IMG_MARIA}` — uma constante do arquivo de story, com
 * uma URL de banco de imagens e parâmetros de recorte que não têm nada a ver
 * com o design system. Aqui o `src` é um caminho comum de aplicação: quem cola
 * troca pelo seu.
 */
import {
  attrs,
  jsxSnippet,
  propOption,
  propText,
  type SourceTransform,
} from '@/lib/story-source';

export type AvatarArgs = {
  /** Preset de diâmetro: sm 24 · md 32 · lg 40 · xl 48 · 2xl 64. */
  size: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className: string;
};

const TAMANHOS = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

const FOTO = '/fotos/maria-rodrigues.jpg';
const ALT = 'Foto de perfil de Maria Rodrigues';

/** Bloco de import com as peças que o exemplo realmente usa. */
function importarPecas(pecas: readonly string[]): string {
  return `import { ${[...pecas].join(', ')} } from "@/components/ui/avatar";`;
}

/**
 * Foto com iniciais atrás — a forma completa do componente.
 *
 * O diâmetro sai do preset, nunca de altura cravada: `size` alimenta o
 * `data-size`, e o CSS deriva dele o círculo, a tipografia das iniciais e o
 * tamanho do indicador de status.
 */
function avatarWithFoto(size: unknown, className: unknown, atraso = false): string {
  const raiz = attrs(
    propOption('size', size, TAMANHOS, 'md'),
    propText('className', className),
  );
  const fallback = atraso ? '<AvatarFallback delayMs={600}>' : '<AvatarFallback>';
  return jsxSnippet(
    importarPecas(['Avatar', 'AvatarImage', 'AvatarFallback']),
    `<Avatar${raiz}>
  <AvatarImage src="${FOTO}" alt="${ALT}" />
  ${fallback}MR</AvatarFallback>
</Avatar>`,
  );
}

/**
 * Transform do `meta` — cascateia para as stories dos quatro arquivos.
 *
 * Lê `size` e `className` dos controls do Playground; nos arquivos que os
 * desligam cai no preset padrão (md) e sem classe extra, que é a forma
 * canônica. `size="md"` não entra no snippet: repetir o padrão ensina ruído.
 */
export const avatarSource: SourceTransform<AvatarArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return avatarWithFoto(args.size, args.className);
};

/** 24px — o menor preset, para linha de tabela e lista densa. */
export function avatarSmSource(): string {
  return avatarWithFoto('sm', undefined);
}

/** 40px — cabeçalho de card e item de lista com duas linhas de texto. */
export function avatarLgSource(): string {
  return avatarWithFoto('lg', undefined);
}

/** 48px — barra de topo e cabeçalho de conversa. */
export function avatarXlSource(): string {
  return avatarWithFoto('xl', undefined);
}

/** 64px — o maior preset, para cabeçalho de perfil. */
export function avatar2xlSource(): string {
  return avatarWithFoto('2xl', undefined);
}

/**
 * `delayMs` segura as iniciais pelo tempo dado antes de mostrá-las. É o que
 * evita o pisca-pisca de quem carrega a foto rápido: sem o atraso, as iniciais
 * aparecem e somem num quadro. O atraso é o assunto das duas stories que
 * apontam para cá, e não cabe nos args.
 */
export function avatarWithDelaySource(): string {
  return avatarWithFoto(undefined, undefined, true);
}

/**
 * Só iniciais: a AUSÊNCIA do `AvatarImage` é o assunto. Sem imagem o fallback
 * é imediato — não há carregamento a esperar, e por isso também não há
 * `delayMs`.
 */
export function avatarSoIniciaisSource(): string {
  return jsxSnippet(
    importarPecas(['Avatar', 'AvatarFallback']),
    `<Avatar>
  <AvatarFallback>JP</AvatarFallback>
</Avatar>`,
  );
}

/**
 * Ícone genérico no lugar das iniciais: o `svg` é decorativo e sai da árvore de
 * acessibilidade, então quem dá voz ao avatar é o `role="img"` com rótulo no
 * fallback. Sem isso o componente fica mudo — o ícone não fala.
 */
export function avatarComIconeSource(): string {
  return jsxSnippet(
    `${importarPecas(['Avatar', 'AvatarFallback'])}
import { User } from "lucide-react";`,
    `<Avatar>
  <AvatarFallback role="img" aria-label="Usuário genérico">
    <User aria-hidden="true" className="nds-icon-lg" />
  </AvatarFallback>
</Avatar>`,
  );
}

/**
 * Grupo sobreposto: o recuo e a borda que separa um avatar do outro vêm do
 * `AvatarGroup`, nunca de margem na story. O `alt` de cada foto fica vazio e
 * quem nomeia é o rótulo do grupo — três nomes seguidos viram ruído, e o que
 * interessa é "Participantes". O contador fecha a fila e é decorativo: o
 * número sem o grupo não diz de quê.
 */
export function avatarEmGrupoSource(): string {
  return jsxSnippet(
    importarPecas([
      'Avatar',
      'AvatarImage',
      'AvatarFallback',
      'AvatarGroup',
      'AvatarGroupCount',
    ]),
    `<AvatarGroup role="group" aria-label="Participantes">
  <Avatar>
    <AvatarImage src="/fotos/maria-rodrigues.jpg" alt="" />
    <AvatarFallback>MR</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="/fotos/joao-pereira.jpg" alt="" />
    <AvatarFallback>JP</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="/fotos/ana-souza.jpg" alt="" />
    <AvatarFallback>AS</AvatarFallback>
  </Avatar>
  <AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>
</AvatarGroup>`,
  );
}

/**
 * Indicador de status: é IRMÃO da imagem, dentro do próprio Avatar — o CSS o
 * ancora no canto inferior direito e o dimensiona junto com o preset. Um ponto
 * colorido não se explica sozinho, então ele se anuncia como imagem com
 * rótulo: a cor é reforço, o nome é o que informa.
 */
export function avatarComStatusSource(): string {
  return jsxSnippet(
    importarPecas(['Avatar', 'AvatarImage', 'AvatarFallback', 'AvatarBadge']),
    `<Avatar>
  <AvatarImage src="${FOTO}" alt="${ALT}" />
  <AvatarFallback>MR</AvatarFallback>
  <AvatarBadge role="img" aria-label="Online" />
</Avatar>`,
  );
}
