/**
 * theme-config.ts — Configuração de temas compartilhada entre todos os stacks.
 * Importar via: import { ... } from '@shared/themes/theme-config'
 *
 * Default é o tema padrão e carrega as cores da marca Nortear. Warm e Cold são variantes de cor.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ThemeId = 'default' | 'warm' | 'cold';

/**
 * Os outros cinco eixos que convivem com o tema no `<html>`. Cada valor é o
 * sufixo da classe: `confortavel` → `.densidade-confortavel`.
 */
export interface ThemeAxisDefaults {
  density: string;
  font: string;
  typescale: string;
  typebase: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  cssClass: string;
  /**
   * Ponto de partida dos OUTROS eixos quando este tema é escolhido.
   *
   * É DEFAULT, não trava: escolher o tema move as outras toolbars, e a pessoa
   * troca qualquer uma depois sem o tema desfazer a escolha. Os seis eixos
   * seguem independentes, que é o contrato registrado na guideline 16.
   *
   * OBRIGATÓRIO nos três, inclusive no que não tem opinião. Quando só o `warm`
   * declarava, voltar dele para o `default` não devolvia nada — o handler saía
   * cedo por não achar defaults, e a tela ficava com a densidade e a fonte do
   * tema anterior. Um tema "sem opinião" não é um tema sem defaults: é um tema
   * cujos defaults são os do sistema, e eles precisam estar escritos para poder
   * ser restaurados.
   *
   * Mora AQUI e não no CSS do tema por duas razões medidas. Uma: `.tema-warm` e
   * `.densidade-confortavel` têm a mesma especificidade, e os eixos são
   * importados DEPOIS dos temas — como o preview aplica sempre a classe do eixo,
   * um default escrito na folha do tema nunca chegaria a valer. Duas: copiar a
   * densidade para dentro do tema duplicaria oito tokens mantidos iguais à mão,
   * que é exatamente como os 39 valores de cor divergiram antes (a história está
   * no cabeçalho do `tokens.css`).
   *
   * Não varia por modo: densidade, fonte e escala não têm versão clara e escura.
   * O default vale nos dois.
   */
  axisDefaults: ThemeAxisDefaults;
}

// ─── Catálogo de temas ────────────────────────────────────────────────────────

export const themes: ThemeDefinition[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Cores da marca Nortear — teal, areia e Ink · tema padrão',
    // `tema-default`, e não string vazia. Enquanto o Default era ausência de
    // classe, os 39 tokens de cor dele precisavam viver em `:root` — e viviam
    // ali E em `default.css`, os mesmos valores em dois lugares mantidos iguais
    // à mão. Divergiram. Agora cada tema tem um lugar só, e o preço é que a
    // classe passou a ser obrigatória: sem ela não há cor.
    cssClass: 'tema-default',
    // Os do sistema. Escritos, e não omitidos, porque é voltando para cá que a
    // restauração acontece.
    axisDefaults: {
      density: 'default',
      font: 'default',
      typescale: 'minor-third',
      typebase: 'm',
    },
  },
  {
    id: 'warm',
    label: 'Warm',
    description: 'Cores quentes — tint âmbar nos neutros, marca vermelha e status fora do semáforo',
    cssClass: 'tema-warm',
    // O Warm é o único tema com voz própria nos outros eixos: respiro maior,
    // uma tipografia de traço caligráfico e uma escala mais aberta. O `typebase`
    // vem declarado mesmo sendo o mesmo do resto — sem ele, trocar para o Warm
    // não devolveria a base a `m` depois de alguém ter escolhido `s` ou `l`, e o
    // default do tema ficaria pela metade.
    axisDefaults: {
      density: 'confortavel',
      font: 'lxgw-wenkai',
      typescale: 'major-third',
      typebase: 'm',
    },
  },
  {
    id: 'cold',
    label: 'Cold',
    description: 'Cores frias — tint azul nos neutros, marca cyan e status fora do semáforo',
    cssClass: 'tema-cold',
    // Voz própria, como o Warm e no sentido oposto: mais informação por tela.
    axisDefaults: {
      density: 'condensado',
      font: 'pt-serif',
      typescale: 'perfect-fourth',
      typebase: 'm',
    },
  },
];

/** Map id → label (para selects, dropdowns, etc.) */
export const themeDisplayNames: Record<ThemeId, string> = Object.fromEntries(
  themes.map((t) => [t.id, t.label])
) as Record<ThemeId, string>;

/** Map id → cssClass */
export const themeCssClasses: Record<ThemeId, string> = Object.fromEntries(
  themes.map((t) => [t.id, t.cssClass])
) as Record<ThemeId, string>;

/** Defaults dos outros eixos por tema. Os três declaram; nenhum devolve vazio. */
export const themeAxisDefaults: Record<ThemeId, ThemeAxisDefaults> = Object.fromEntries(
  themes.map((t) => [t.id, t.axisDefaults])
) as Record<ThemeId, ThemeAxisDefaults>;

/**
 * Prefixo da classe de cada eixo no `<html>`.
 *
 * Existe para que `applyTheme` saiba o que TIRAR antes de pôr: sem a lista, a
 * troca de tema empilharia `densidade-confortavel` e `densidade-condensado` no
 * mesmo elemento, e quem venceria seria a ordem da folha, não a escolha.
 */
export const AXIS_CLASS_PREFIX: Record<keyof ThemeAxisDefaults, string> = {
  density: 'densidade-',
  font: 'fonte-',
  typescale: 'escala-',
  typebase: 'base-tipo-',
};

// ─── Subdomínio → tema ────────────────────────────────────────────────────────
// O PRIMEIRO rótulo do hostname decide o tema (warm.norteardesign.com.br → warm;
// warm.react.norteardesign.com.br → warm). Subdomínios de stack e hosts
// institucionais caem no Default. Consumido pelos preview.ts das 4 stacks
// (defaultValue do global `brand`) — a toolbar continua permitindo troca manual.

export const subdomainThemeMap: Record<string, ThemeId> = {
  // temas de marca
  warm: 'warm',
  cold: 'cold',
  // stacks e hosts institucionais → tema padrão
  localhost: 'default',
  nortear:   'default',
  admin:     'default',
  react:     'default',
  vue:       'default',
  svelte:    'default',
  vanilla:   'default',
};

// ─── Domínios de produção ─────────────────────────────────────────────────────

const PRODUCTION_DOMAINS = ['norteardesign.com.br', 'nortear.com.br', 'design-system.dev'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCurrentSubdomain(): string {
  if (typeof window === 'undefined') return 'localhost';
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'localhost';
  const parts = hostname.split('.');
  return parts.length >= 2 ? parts[0] : 'localhost';
}

export function getThemeFromSubdomain(): ThemeId {
  const sub = getCurrentSubdomain();
  return subdomainThemeMap[sub] ?? 'default';
}

export function isDevMode(): boolean {
  if (typeof window === 'undefined') return true;
  const { hostname } = window.location;
  if (['localhost', '127.0.0.1', ''].includes(hostname)) return true;
  if (hostname.includes('figma.com')) return true;
  return !PRODUCTION_DOMAINS.some((d) => hostname.endsWith(d));
}

export function getThemeInfo() {
  const subdomain = getCurrentSubdomain();
  const theme = getThemeFromSubdomain();
  const devMode = isDevMode();
  return {
    subdomain,
    theme,
    isDevMode: devMode,
    allowManualSelection:
      devMode || new URLSearchParams(window.location.search).has('theme-selector'),
  };
}

/**
 * Aplica um tema no `<html>`, removendo o anterior.
 *
 * Leva junto os OUTROS EIXOS — densidade, fonte, escala e base tipográfica — no
 * `axisDefaults` do tema. É o que faz a troca de tema devolver uma tela
 * coerente: sem isso, sair do `cold` deixava a serifada e o condensado para
 * trás, porque nada os desfazia.
 *
 * `axes: false` para quem quer só a cor: aplica tema e modo, e não toca nos
 * outros quatro. É a escotilha de quem monta a combinação por conta — e é o
 * caso de qualquer consumidor que já controle densidade ou tipografia pelo
 * próprio produto.
 */
export function applyTheme(
  themeId: ThemeId,
  isDark: boolean,
  options: { axes?: boolean } = {},
): void {
  const { axes = true } = options;
  const root = document.documentElement;

  themes.forEach((t) => { if (t.cssClass) root.classList.remove(t.cssClass); });
  root.classList.remove('dark');

  const cssClass = themeCssClasses[themeId];
  if (cssClass) root.classList.add(cssClass);
  if (isDark) root.classList.add('dark');

  if (!axes) return;

  const eixos = themeAxisDefaults[themeId];
  if (!eixos) return;

  // Tira TODA classe do eixo antes de pôr a nova. Varrer por prefixo, e não
  // remover só a que este arquivo conhece, é o que mantém a troca correta
  // quando alguém aplicou uma classe de eixo por fora.
  for (const [eixo, prefixo] of Object.entries(AXIS_CLASS_PREFIX)) {
    for (const classe of Array.from(root.classList)) {
      if (classe.startsWith(prefixo)) root.classList.remove(classe);
    }
    const valor = eixos[eixo as keyof ThemeAxisDefaults];
    if (valor) root.classList.add(prefixo + valor);
  }
}
