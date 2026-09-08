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
  const root = tag.split('-')[0]?.toLowerCase();
  if (!root) return null;
  return validos.find((l) => l.split('-')[0].toLowerCase() === root) ?? null;
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
  const list =
    idiomas ??
    (typeof navigator === 'undefined'
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : []);

  for (const tag of list) {
    if (!tag) continue;
    const exato = validos.find((l) => l.toLowerCase() === tag.toLowerCase());
    if (exato) return exato;
    const root = byRoot(tag, validos);
    if (root) return root;
  }
  return null;
}

/**
 * A escada completa, para as cinco stacks chamarem em vez de repetir.
 *
 * `window` é injetável para o teste não depender de `window` global.
 */
export function negociarLocale(
  // `janela`, e NÃO `window`. Chamava-se `window` e sombreava o global: com o
  // argumento omitido — que é como TODOS os chamadores chamam, menos um —, o
  // `typeof window === 'undefined'` dentro da função testava o PARÂMETRO, dava
  // verdadeiro, e a função devolvia o padrão sem consultar nada.
  //
  // O efeito era a função inteira virar `return 'pt-BR'`: `?lang=` ignorado, a
  // preferência salva ignorada (trocar de idioma e recarregar perdia a escolha)
  // e o idioma do navegador ignorado — exatamente o problema que este arquivo
  // foi escrito para resolver. Nas cinco stacks, e na barra lateral.
  janela?: { location?: { search?: string }; localStorage?: Pick<Storage, 'getItem'> },
  idiomasDoNavegador?: readonly string[],
  key = 'ds-locale',
  padrao: Locale = 'pt-BR',
): Locale {
  const w = janela ?? (typeof window === 'undefined' ? undefined : window);
  if (!w) return padrao;

  const daUrl = new URLSearchParams(w.location?.search ?? '').get('lang');
  const urlValida = LOCALES.find((l) => l === daUrl);
  if (urlValida) return urlValida;

  // A leitura vai num `try`, e o `?.` não bastava: quem LANÇA é o acesso à
  // propriedade `localStorage`, antes de haver o que encadear. Acontece de
  // verdade — iframe isolado, navegador com dados de site bloqueados, janela
  // anônima com restrição. Medido: sem esta guarda, um `SecurityError` sobe e
  // derruba a montagem inteira de quem chama, e a pessoa fica sem a interface
  // por causa de uma preferência que era só conveniência.
  //
  // Falhar aqui volta ao passo seguinte da escada — o idioma do navegador —,
  // que é exatamente o que se quer: perde-se a memória da escolha, não o
  // idioma.
  let salvo: string | null = null;
  try {
    salvo = w.localStorage?.getItem(key) ?? null;
  } catch {
    salvo = null;
  }
  const salvoValido = LOCALES.find((l) => l === salvo);
  if (salvoValido) return salvoValido;

  return localeDoNavegador(idiomasDoNavegador) ?? padrao;
}
