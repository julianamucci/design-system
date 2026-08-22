/**
 * Sonda de comparação do Badge entre as cinco stacks.
 *
 * Passo padrão da auditoria (quality 2f1): medir as cinco de uma vez, com o
 * mesmo colhedor, antes de corrigir qualquer coisa.
 *
 * O badge é um CONTÊINER COLORIDO, e é sobre ele que vale a regra do projeto:
 * ícone e título podem carregar a cor semântica, texto corrido não — cor
 * semântica sobre fundo suave raramente alcança os 4.5:1 que texto exige. Isso
 * é aritmética, não olhômetro, e precisa ser medido nos TRÊS temas e nos DOIS
 * modos: o axe do test-runner só enxerga o tema claro da marca default, que é
 * um sexto do produto.
 *
 * A segunda coisa que ninguém mede é a ALTURA. Badge é primitivo com texto:
 * a altura tem de sair de `padding-block` + `line-height`, nunca de um valor
 * cravado, senão o rótulo vaza quando a pessoa aumenta a fonte do navegador
 * (WCAG 1.4.4, Resize Text 200%). Medir o `height` uma vez não prova nada —
 * o que prova é a altura CRESCER quando a fonte cresce.
 *
 * Reuso, sem colhedor de cor novo: `cor.ts` dá a varredura por tema e a razão
 * WCAG; `alert-probe.ts` dá o fundo COMPOSTO — o `backgroundEffective` do `cor.ts`
 * pula camada com alfa e devolve a página, e o fundo do badge é justamente
 * `hsl(var(--destructive) / 0.1)`. Medir contra a página daria um número que
 * ninguém vê.
 */

import { byTheme, ratio } from './cor';
import { backgroundEffective } from './alert-probe';

export const VARIANTS_BADGE = [
  'default',
  'secondary',
  'destructive',
  'warning',
  'success',
  'info',
  'outline',
] as const;

export interface BadgeContrast {
  tema: string;
  modo: string;
  variante: string;
  /** `null` quando o seletor não casou — isso É o achado, não falha da medição. */
  presente: boolean;
  texto: number | null;
  border: number | null;
  corDoTexto: string | null;
  background: string | null;
}

/** Nome da variante: preferir o atributo, cair na classe, e nunca adivinhar. */
function variantOf(el: HTMLElement): string {
  const attr = el.getAttribute('data-variant');
  if (attr) return attr;
  const m = el.className.match(
    /nds-badge-(default|secondary|destructive|warning|success|info|outline)\b/,
  );
  return m ? m[1] : 'default';
}

/**
 * Contraste de TODO badge dentro de `raiz`, nos três temas e nos dois modos.
 *
 * `raiz` é quem recebe a classe `tema-*` — precisa ser um ancestral real dos
 * badges, e o `byTheme` devolve a classe original no `finally` (deixá-la posta
 * envenena a story seguinte e a foto do Chromatic).
 */
export function badgeMeasureContrast(raiz: HTMLElement): BadgeContrast[] {
  const badges = Array.from(raiz.querySelectorAll<HTMLElement>('.nds-badge'));

  // A RAIZ passa a pintar `--background` enquanto a medição dura.
  //
  // Sem isso o número do tema escuro é inventado: o fundo do badge tem alfa, e
  // o compositor sobe a árvore até achar quem é opaco — que é o `body` do
  // harness, e o harness NÃO o repinta no escuro. Resultado: texto claro
  // composto sobre branco, razão ~1.0 em cinco variantes de seis. É a mesma
  // armadilha do "contraste ~1.0 = elemento em fade", com outra origem: aqui o
  // elemento está certo e a régua é que estava medindo outra parede.
  //
  // Como a raiz é quem carrega `tema-*`/`dark` durante o `byTheme`, o `var()`
  // resolve no tema vigente a cada passada.
  const backgroundOriginal = raiz.style.backgroundColor;
  raiz.style.setProperty('background-color', 'hsl(var(--background))');

  // A transição de cor morre ANTES da troca de tema: `.nds-badge` declara
  // `transition: background-color, color, border-color`, e medir logo depois de
  // trocar a classe devolveria a cor do tema anterior — o "contraste ~1.0 de
  // elemento em fade" que já custou uma investigação inteira neste repositório.
  const antes = badges.map((b) => b.style.transition);
  badges.forEach((b) => {
    b.style.transition = 'none';
  });

  try {
    return byTheme(raiz, (tema, modo) =>
      badges.map((b): BadgeContrast => {
        const cs = getComputedStyle(b);
        const background = backgroundEffective(b);
        const rText = ratio(cs.color, background);
        // A borda é vista contra a PÁGINA, não contra o interior do badge.
        const pageBackground = b.parentElement ? backgroundEffective(b.parentElement) : background;
        const rBorder =
          parseFloat(cs.borderTopWidth) > 0 ? ratio(cs.borderTopColor, pageBackground) : null;
        return {
          tema,
          modo,
          variante: variantOf(b),
          presente: true,
          texto: rText?.ratio ?? null,
          border: rBorder?.ratio ?? null,
          corDoTexto: rText?.frente ?? null,
          background,
        };
      }),
    ).flat();
  } finally {
    badges.forEach((b, i) => {
      if (antes[i]) b.style.transition = antes[i];
      else b.style.removeProperty('transition');
    });
    if (backgroundOriginal) raiz.style.backgroundColor = backgroundOriginal;
    else raiz.style.removeProperty('background-color');
  }
}

export interface BadgeHeight {
  variante: string;
  fonteBase: string;
  alturaBase: number;
  fonteDobrada: string;
  alturaDobrada: number;
  paddingBlock: string;
  entrelinha: string;
  /** `height` declarado no estilo computado — `auto` é o certo. */
  alturaDeclarada: string;
}

/**
 * Altura antes e depois de dobrar a fonte da RAIZ do documento.
 *
 * É o teste real de WCAG 1.4.4: um `height` cravado não muda quando a fonte
 * dobra, e o rótulo vaza da caixa. Medir só o `height` computado não distingue
 * "32px porque o texto pede" de "32px porque alguém escreveu 32px".
 *
 * O tamanho de fonte do `<html>` volta ao original no `finally`.
 */
export function badgeMeasureHeight(raiz: HTMLElement): BadgeHeight[] {
  const badges = Array.from(raiz.querySelectorAll<HTMLElement>('.nds-badge'));
  const html = raiz.ownerDocument.documentElement;
  const fonteOriginal = html.style.fontSize;

  const base = badges.map((b) => {
    const cs = getComputedStyle(b);
    return {
      variante: variantOf(b),
      fonteBase: cs.fontSize,
      alturaBase: Math.round(b.getBoundingClientRect().height * 100) / 100,
      paddingBlock: `${cs.paddingTop} ${cs.paddingBottom}`,
      entrelinha: cs.lineHeight,
      alturaDeclarada: cs.height,
    };
  });

  try {
    html.style.fontSize = '32px'; // 2× o padrão de 16px
    void raiz.offsetHeight;
    return badges.map((b, i) => {
      const cs = getComputedStyle(b);
      return {
        ...base[i],
        fonteDobrada: cs.fontSize,
        alturaDobrada: Math.round(b.getBoundingClientRect().height * 100) / 100,
      };
    });
  } finally {
    if (fonteOriginal) html.style.fontSize = fonteOriginal;
    else html.style.removeProperty('font-size');
    void raiz.offsetHeight;
  }
}

/** Estrutura e semântica de um badge — o contrato de markup entre as stacks. */
export function badgeMeasureStructure(raiz: HTMLElement) {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.nds-badge')).map((b) => {
    const icone = b.querySelector<SVGElement>('svg');
    return {
      variante: variantOf(b),
      tag: b.tagName.toLowerCase(),
      slot: b.getAttribute('data-slot'),
      atributoDeVariante: b.getAttribute('data-variant'),
      classes: b.className
        .split(/\s+/)
        .filter((c) => c.startsWith('nds-badge'))
        .sort()
        .join(' '),
      texto: (b.textContent ?? '').trim().replace(/\s+/g, ' '),
      icone: icone
        ? {
            escondido: icone.getAttribute('aria-hidden') ?? 'não',
            position: icone.getAttribute('data-icon'),
            largura: Math.round(icone.getBoundingClientRect().width),
            estiloInline: icone.getAttribute('style') ?? '',
          }
        : null,
    };
  });
}

/** Só o que reprova, para o relatório caber numa linha. */
export function contrastFailures(
  measurements: BadgeContrast[],
  minimum = 4.5,
): BadgeContrast[] {
  return measurements.filter((m) => m.texto !== null && m.texto < minimum);
}

export function describeContrast(ms: BadgeContrast[]): string {
  return ms
    .map((m) => `  · ${m.variante} (${m.tema}/${m.modo}) — texto em ${m.texto}:1`)
    .join('\n');
}

/** Canal de saída: o console da play não chega ao terminal do vitest. */
export function reportBadge(stack: string, cenario: string, dados: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(dados)}`);
}
