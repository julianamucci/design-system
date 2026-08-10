/**
 * Tradução da ESTRUTURA da sidebar do Storybook.
 *
 * Traduz só o esqueleto — seções, subseções e as páginas de fundamento. Os
 * nomes de story ficam em inglês, e isso é decisão medida, não desistência:
 * são 607 nomes distintos, e as 200 palavras mais comuns cobrem apenas 70% dos
 * usos, então não há economia possível num dicionário por palavra. Traduzir
 * tudo seria 607 entradas por idioma mantidas à mão, sem auditor que perceba
 * quando uma story nova entra sem tradução.
 *
 * O esqueleto é o que a pessoa lê para NAVEGAR, e são 28 entradas que quase
 * nunca mudam. É onde o ganho está e onde a manutenção se sustenta.
 *
 * Chave é o rótulo em inglês, que hoje é o vocabulário único do menu depois da
 * normalização. Nome não mapeado passa reto — o fallback é inglês coerente, não
 * um menu remendado.
 */

import type { Locale } from './locale-negotiation';

type Traducao = Partial<Record<Locale, string>>;

/** Seções e subseções: o caminho que a pessoa percorre até a story. */
const ESTRUTURA: Record<string, Traducao> = {
  // Nível 1
  UI: { 'pt-BR': 'UI', es: 'UI' },
  Foundations: { 'pt-BR': 'Fundamentos', es: 'Fundamentos' },
  About: { 'pt-BR': 'Sobre', es: 'Acerca de' },

  // Nível 3 — as pastas dentro de cada componente
  Compositions: { 'pt-BR': 'Composições', es: 'Composiciones' },
  States: { 'pt-BR': 'Estados', es: 'Estados' },
  Variants: { 'pt-BR': 'Variantes', es: 'Variantes' },
  Sizes: { 'pt-BR': 'Tamanhos', es: 'Tamaños' },
  Settings: { 'pt-BR': 'Configurações', es: 'Configuración' },
  Types: { 'pt-BR': 'Tipos', es: 'Tipos' },
  Modes: { 'pt-BR': 'Modos', es: 'Modos' },
  Layouts: { 'pt-BR': 'Layouts', es: 'Layouts' },

  // Folhas fixas que toda página tem
  Docs: { 'pt-BR': 'Documentação', es: 'Documentación' },
  Playground: { 'pt-BR': 'Playground', es: 'Playground' },
};

/** Páginas de fundamento: título próprio, não nome de componente. */
const FUNDAMENTOS: Record<string, Traducao> = {
  Overview: { 'pt-BR': 'Visão geral', es: 'Visión general' },
  Accessibility: { 'pt-BR': 'Acessibilidade', es: 'Accesibilidad' },
  Analytics: { 'pt-BR': 'Analytics', es: 'Analytics' },
  'SEO and GEO': { 'pt-BR': 'SEO e GEO', es: 'SEO y GEO' },
  'Tone of Voice': { 'pt-BR': 'Tom de voz', es: 'Tono de voz' },
  'Getting Started': { 'pt-BR': 'Comece por aqui', es: 'Empieza aquí' },
  'Colors and Themes': { 'pt-BR': 'Cores e temas', es: 'Colores y temas' },
  Typography: { 'pt-BR': 'Tipografia', es: 'Tipografía' },
  Spacing: { 'pt-BR': 'Espaçamento', es: 'Espaciado' },
  'Elevation, Borders and Shadows': {
    'pt-BR': 'Elevação, bordas e sombras',
    es: 'Elevación, bordes y sombras',
  },
  Icons: { 'pt-BR': 'Ícones', es: 'Iconos' },
  Motion: { 'pt-BR': 'Movimento', es: 'Movimiento' },
  Densities: { 'pt-BR': 'Densidades', es: 'Densidades' },
  'Theme System': { 'pt-BR': 'Sistema de temas', es: 'Sistema de temas' },
  Internationalization: { 'pt-BR': 'Internacionalização', es: 'Internacionalización' },
  'Cross-Stack Divergences': {
    'pt-BR': 'Divergências cross-stack',
    es: 'Divergencias cross-stack',
  },
};

const DICIONARIO: Record<string, Traducao> = { ...ESTRUTURA, ...FUNDAMENTOS };

/**
 * Rótulo traduzido, ou o próprio nome quando não há entrada.
 *
 * Nome de componente (Button, Badge) e de story (WithIcon) caem no fallback de
 * propósito: são vocabulário do design system, não prosa.
 */
export function rotuloDaSidebar(nome: string, locale: Locale): string {
  if (locale === 'en') return nome;
  return DICIONARIO[nome]?.[locale] ?? nome;
}

/** Só para teste e para o auditor: o que o dicionário cobre. */
export const ROTULOS_TRADUZIDOS = Object.keys(DICIONARIO);
