/**
 * Negociação do idioma inicial das docs pages.
 *
 * As cinco stacks resolviam o locale com a mesma escada — `?lang=`, depois
 * `localStorage`, depois `pt-BR` — e nenhuma consultava o navegador. Quem abre
 * de fora do Brasil recebia português mesmo com o navegador em inglês, e o
 * conteúdo trilíngue que já existe ficava invisível até a pessoa achar o
 * seletor.
 *
 * O navegador entra como terceira prioridade: depois da URL (link compartilhado
 * é escolha explícita) e da preferência salva (escolha explícita anterior), e
 * antes do padrão. Ele é palpite, e palpite não sobrepõe decisão.
 */

export type Locale = 'pt-BR' | 'en' | 'es';

export const LOCALES: readonly Locale[] = ['pt-BR', 'en', 'es'];

/** `pt-PT` e `pt-AO` também são português: casa pela raiz quando não há exato. */
function byRoot(tag: string, validos: readonly Locale[]): Locale | null {
  const raiz = tag.split('-')[0]?.toLowerCase();
  if (!raiz) return null;
  return validos.find((l) => l.split('-')[0].toLowerCase() === raiz) ?? null;
}

/**
 * Primeiro idioma do navegador que o design system fala, ou `null`.
 *
 * Percorre `navigator.languages` na ordem em que a pessoa configurou — a
 * primeira posição é a preferência real, e parar na primeira que casa respeita
 * isso. `navigator.language` sozinho ignora as demais preferências, então serve
 * só de reserva para navegador antigo.
 */
export function localeDoNavegador(
  idiomas?: readonly string[],
  validos: readonly Locale[] = LOCALES,
): Locale | null {
  const lista =
    idiomas ??
    (typeof navigator === 'undefined'
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : []);

  for (const tag of lista) {
    if (!tag) continue;
    const exato = validos.find((l) => l.toLowerCase() === tag.toLowerCase());
    if (exato) return exato;
    const raiz = byRoot(tag, validos);
    if (raiz) return raiz;
  }
  return null;
}

/**
 * A escada completa, para as cinco stacks chamarem em vez de repetir.
 *
 * `window` é injetável para o teste não depender de `window` global.
 */
export function negociarLocale(
  window?: { location?: { search?: string }; localStorage?: Pick<Storage, 'getItem'> },
  idiomasDoNavegador?: readonly string[],
  chave = 'ds-locale',
  padrao: Locale = 'pt-BR',
): Locale {
  const w = window ?? (typeof window === 'undefined' ? undefined : window);
  if (!w) return padrao;

  const daUrl = new URLSearchParams(w.location?.search ?? '').get('lang');
  const urlValida = LOCALES.find((l) => l === daUrl);
  if (urlValida) return urlValida;

  const salvo = w.localStorage?.getItem(chave);
  const salvoValido = LOCALES.find((l) => l === salvo);
  if (salvoValido) return salvoValido;

  return localeDoNavegador(idiomasDoNavegador) ?? padrao;
}
