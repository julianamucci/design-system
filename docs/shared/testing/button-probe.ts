/**
 * Sonda de comparação do Button entre as cinco stacks.
 *
 * Passo padrão da auditoria (quality 2f1). O Button é o componente mais
 * copiado do design system — todo outro o compõe — e é o primeiro a ser
 * portado para uma stack nova. É onde divergência custa mais caro, porque ela
 * se propaga.
 *
 * A medição é por VARIANTE: o colhedor varre os `.nds-button` da tela e chaveia
 * cada um pela classe de variante, então uma story só cobre a matriz inteira.
 */

import { contraste, ligarTemaEscuro, superficieDoApp } from './alert-probe';

const VARIANTES = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;

/**
 * O botão ou pinta o próprio fundo, ou é transparente sobre a superfície do app.
 * Não há terceira hipótese, e por isso aqui não precisa da composição em camadas
 * do alert — precisa saber qual dos dois casos é.
 */
function fundoDoBotao(el: HTMLElement): string {
  const propria = getComputedStyle(el).backgroundColor;
  const alfa = Number((propria.match(/-?[\d.]+/g) ?? [])[3] ?? 1);
  return propria !== 'rgba(0, 0, 0, 0)' && alfa >= 1 ? propria : superficieDoApp(el);
}

function varianteDe(el: HTMLElement): string {
  for (const v of VARIANTES) {
    if (el.classList.contains(`nds-button-${v}`)) return v;
  }
  // Sem classe de variante o botão é o default — três stacks omitem a classe
  // nesse caso, e isso é, ele próprio, um dado a comparar.
  return 'default (sem classe)';
}

export function medirBotao(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const fundo = fundoDoBotao(el);
  const icone = el.querySelector<HTMLElement>('svg');

  return {
    tag: el.tagName.toLowerCase(),
    tipo: el.getAttribute('type'),
    // Desabilitado: atributo nativo OU aria — as libs headless divergem, e o
    // que importa para quem usa teclado é que uma das duas formas exista.
    desabilitado: el.hasAttribute('disabled')
      ? 'nativo'
      : el.getAttribute('aria-disabled') === 'true'
        ? 'aria'
        : 'não',
    altura: Math.round(r.height),
    padding: cs.padding,
    raio: Math.round(parseFloat(cs.borderTopLeftRadius) || 0),
    larguraDaBorda: Math.round(parseFloat(cs.borderTopWidth) || 0),
    gap: cs.gap,
    fonte: `${cs.fontSize}/${cs.fontWeight}`,
    fundo: cs.backgroundColor,
    cor: cs.color,
    contraste: contraste(cs.color, fundo),
    icone: icone
      ? `${Math.round(icone.getBoundingClientRect().width)}px aria-hidden=${icone.getAttribute('aria-hidden')}`
      : null,
  };
}

/** Todos os botões da tela, chaveados por variante. */
export function medirBotoes(raiz: HTMLElement) {
  const porVariante: Record<string, ReturnType<typeof medirBotao>> = {};
  for (const el of raiz.querySelectorAll<HTMLElement>('.nds-button')) {
    const v = varianteDe(el);
    if (!porVariante[v]) porVariante[v] = medirBotao(el);
  }
  return porVariante;
}

/** Contraste de cada variante nos DOIS temas. O `.dark` sai no `finally`. */
export function contrasteDosBotoes(raiz: HTMLElement) {
  const razao = (m: Record<string, ReturnType<typeof medirBotao>>) =>
    Object.fromEntries(Object.entries(m).map(([v, d]) => [v, d.contraste]));
  const claro = razao(medirBotoes(raiz));
  const desfazer = ligarTemaEscuro(raiz.ownerDocument);
  try {
    return { claro, escuro: razao(medirBotoes(raiz)) };
  } finally {
    desfazer();
  }
}

/** Canal de saída: o console da play não chega ao terminal do vitest. */
export function reportarBotoes(stack: string, raiz: HTMLElement) {
  throw new Error(
    `SONDA::${stack}::matriz::${JSON.stringify({
      variantes: medirBotoes(raiz),
      contraste: contrasteDosBotoes(raiz),
    })}`,
  );
}
