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

import { contraste } from './alert-probe';

const VARIANTES = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;

/** Fundo composto: variante fantasma é transparente sobre a superfície. */
function fundoEfetivo(el: HTMLElement): string {
  let atual: HTMLElement | null = el;
  while (atual) {
    const cor = getComputedStyle(atual).backgroundColor;
    const alfa = Number((cor.match(/-?[\d.]+/g) ?? [])[3] ?? 1);
    if (cor !== 'rgba(0, 0, 0, 0)' && alfa >= 1) return cor;
    atual = atual.parentElement;
  }
  // Nada pinta acima: cai no fundo do DOCUMENTO, não num branco cravado. O
  // literal mentia no tema escuro — variante transparente media texto claro
  // sobre branco imaginário e acusava 1.1:1 onde não há defeito.
  const doDoc = getComputedStyle(el.ownerDocument.body).backgroundColor;
  if (doDoc && doDoc !== 'rgba(0, 0, 0, 0)') return doDoc;
  const daRaiz = getComputedStyle(el.ownerDocument.documentElement).backgroundColor;
  return daRaiz && daRaiz !== 'rgba(0, 0, 0, 0)' ? daRaiz : 'rgb(255, 255, 255)';
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
  const fundo = fundoEfetivo(el);
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
  const html = raiz.ownerDocument.documentElement;
  const jaEscuro = html.classList.contains('dark');
  const razao = (m: Record<string, ReturnType<typeof medirBotao>>) =>
    Object.fromEntries(Object.entries(m).map(([v, d]) => [v, d.contraste]));
  try {
    const claro = razao(medirBotoes(raiz));
    html.classList.add('dark');
    const escuro = razao(medirBotoes(raiz));
    return { claro, escuro };
  } finally {
    if (!jaEscuro) html.classList.remove('dark');
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
