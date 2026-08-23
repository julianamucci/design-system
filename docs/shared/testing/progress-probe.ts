/**
 * Sonda do Progress — medição única, igual nas cinco stacks.
 *
 * Existe porque atributo certo com desenho errado passou despercebido mais de
 * uma vez: `aria-valuenow="50"` numa barra que não preenchia nada é um teste
 * verde guardando um defeito. Aqui a pergunta é sempre "o que está na tela?".
 *
 * ─── A anatomia difere, o contrato não ──────────────────────────────────────
 *
 * Duas formas convivem, e as duas são legítimas:
 *
 *   - raiz composta + trilha separada — `[data-slot="progress"]` contém
 *     `[data-slot="progress-track"]`, que contém o indicador;
 *   - raiz que É a trilha — `[data-slot="progress"]` contém o indicador direto.
 *
 * O colhedor aceita as duas: a trilha é a `progress-track` quando existe e a
 * própria raiz quando não. O que NÃO varia é o indicador, o `role` e a família
 * `aria-value*` — é sobre isso que as asserções falam.
 */

export type Rgba = [number, number, number, number];

/**
 * Acha a peça pelo `data-slot`, considerando o próprio nó recebido.
 *
 * O `querySelector` só olha DESCENDENTES, e as chamadas por barra passam a
 * própria raiz (`getAllByRole('progressbar')[i]`). Em três stacks essa raiz JÁ
 * é o `[data-slot="progress"]` — a busca voltava vazia numa lista de barras e
 * cheia quando o canvas inteiro era passado.
 */
function find(root: ParentNode, slot: string): HTMLElement | null {
  const selector = `[data-slot="${slot}"]`;
  if (root instanceof Element && root.matches(selector)) return root as HTMLElement;
  return root.querySelector<HTMLElement>(selector);
}

/** A raiz anunciada como barra de progresso. */
export function progressoRoot(root: ParentNode): HTMLElement {
  const el = find(root, 'progress');
  if (!el) throw new Error('SONDA::progress: nenhum [data-slot="progress"] no canvas');
  return el;
}

/** A caixa por onde o indicador corre — a trilha, ou a raiz quando ela acumula o papel. */
export function progressoTrack(root: ParentNode): HTMLElement {
  return find(root, 'progress-track') ?? progressoRoot(root);
}

/** A barra preenchida. */
export function indicadorDoProgresso(root: ParentNode): HTMLElement {
  const el = find(root, 'progress-indicator');
  if (!el) throw new Error('SONDA::progress: nenhum [data-slot="progress-indicator"] no canvas');
  return el;
}

/**
 * Percentual efetivamente DESENHADO, medido no DOM.
 *
 * Vale para as duas técnicas de desenho que as stacks usam — `width` inline e
 * `transform: translateX` a partir de `--value` — porque mede a borda direita
 * do indicador contra a borda esquerda da trilha, e não a propriedade CSS.
 */
export function percentualDesenhado(root: ParentNode): number {
  const trail = progressoTrack(root);
  const indicador = indicadorDoProgresso(root);
  const box = trail.getBoundingClientRect();
  if (box.width === 0) return 0;
  const preenchido = indicador.getBoundingClientRect().right - box.left;
  return Math.min(Math.max((preenchido / box.width) * 100, 0), 100);
}

// ─── Contraste ───────────────────────────────────────────────────────────────
//
// A trilha é uma cor com ALFA sobre o que estiver atrás dela, então
// `backgroundColor` devolve um valor que ninguém vê. A composição é refeita
// aqui, do jeito que o navegador faz, antes de dividir as luminâncias.

function parseRgba(cor: string): Rgba {
  const n = cor.match(/-?[\d.]+/g) ?? [];
  return [Number(n[0] ?? 0), Number(n[1] ?? 0), Number(n[2] ?? 0), n[3] === undefined ? 1 : Number(n[3])];
}

function compor([r, g, b, a]: Rgba, background: Rgba): Rgba {
  return [a * r + (1 - a) * background[0], a * g + (1 - a) * background[1], a * b + (1 - a) * background[2], 1];
}

/** Primeira cor opaca subindo a árvore — o que de fato está atrás do elemento. */
function backgroundEffective(el: HTMLElement): Rgba {
  let current: HTMLElement | null = el.parentElement;
  while (current) {
    const cor = parseRgba(getComputedStyle(current).backgroundColor);
    if (cor[3] === 1) return cor;
    current = current.parentElement;
  }
  return [255, 255, 255, 1];
}

function luminancia([r, g, b]: Rgba): number {
  const canal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: Rgba, b: Rgba): number {
  const [light, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (light + 0.05) / (escuro + 0.05);
}

/**
 * Razão de contraste entre a barra e a trilha (WCAG 1.4.11, mínimo 3:1).
 *
 * A barra só informa se der para ver onde ela termina — é objeto gráfico que
 * transmite informação, não decoração.
 */
export function contrastBarTrack(root: ParentNode): number {
  const trail = progressoTrack(root);
  const indicador = indicadorDoProgresso(root);
  const atras = backgroundEffective(trail);
  const colorTrack = compor(parseRgba(getComputedStyle(trail).backgroundColor), atras);
  const colorIndicador = compor(parseRgba(getComputedStyle(indicador).backgroundColor), colorTrack);
  return contraste(colorIndicador, colorTrack);
}

/**
 * Nome da animação que roda no indicador — `'none'` quando não há nenhuma.
 *
 * Asserção de POSIÇÃO no meio de uma animação infinita é racy por construção: o
 * traço está sempre em outro lugar. O que dá para afirmar sem sorte é que a
 * animação existe e é a do design system.
 */
export function indicadorAnimation(root: ParentNode): string {
  return getComputedStyle(indicadorDoProgresso(root)).animationName;
}

/**
 * Cor que um token semântico produz NESTE ponto da árvore, em `rgb(...)`.
 *
 * Comparar `backgroundColor` com a string `hsl(var(--success))` nunca reprova:
 * o navegador devolve `rgb(...)` e a comparação passa por engano. Aqui o
 * navegador faz a conversão — um elemento efêmero, dentro do mesmo contexto de
 * herança, recebe a cor e devolve o valor computado.
 */
export function tokenColor(contexto: HTMLElement, token: string): string {
  const probe = contexto.ownerDocument.createElement('div');
  probe.style.backgroundColor = `hsl(var(${token}))`;
  contexto.appendChild(probe);
  const cor = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return cor;
}

/** Todo elemento com `role="progressbar"` no canvas. */
export function barrasDeProgresso(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[role="progressbar"]'));
}

/**
 * Nome acessível de uma barra, pelo caminho que o leitor de tela percorre:
 * `aria-labelledby` (rótulo associado) antes de `aria-label`.
 *
 * Devolve string vazia quando não há nome — e é isso que a asserção reprova.
 */
export function accessibleName(el: HTMLElement): string {
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    const texts = labelledby
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent?.trim() ?? '')
      .filter(Boolean);
    if (texts.length) return texts.join(' ');
  }
  return el.getAttribute('aria-label')?.trim() ?? '';
}
