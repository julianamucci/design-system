/**
 * Colhedor de COR COMPUTADA — o que o navegador realmente pinta.
 *
 * Nasceu dentro de `textarea-probe.ts`, onde `luminancia`, `ratio`,
 * `backgroundEffective` e `noTransicao` eram privados. A rodada de foundations que
 * escureceu `--input` até 3:1 precisou das mesmas quatro funções fora do
 * textarea, e copiá-las teria criado um segundo colhedor com a MESMA armadilha
 * para descobrir de novo — a de medir o primeiro quadro da transição. O
 * módulo passou a morar aqui e o probe do textarea importa daqui.
 *
 * Nenhuma função afirma nada: todas devolvem número. A asserção é da story.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Contrast {
  ratio: number;
  frente: string;
  background: string;
}

export type Side = 'borda' | 'preenchimento';

export interface ColorTarget {
  /** Nome que aparece no relatório de falha. */
  nome: string;
  selector: string;
  /** `border` lê border-top-color; `preenchimento` lê background-color. */
  lado?: Side;
}

export interface ColorMeasurement {
  tema: string;
  modo: 'claro' | 'escuro';
  alvo: string;
  lado: Side;
  /** `false` quando o seletor não casou — isso É o achado, não falha da medição. */
  presente: boolean;
  frente: string | null;
  background: string | null;
  ratio: number | null;
}

// ─── Primitivas de cor ────────────────────────────────────────────────────────

/** Componentes 0..1 + alfa de uma cor computada (`rgb()` / `rgba()`). */
function componentes(cor: string): [number, number, number, number] | null {
  const m = /rgba?\(([^)]+)\)/.exec(cor);
  if (!m) return null;
  const partes = m[1].split(/[,/]/).map((p) => parseFloat(p.trim()));
  if (partes.length < 3 || partes.slice(0, 3).some((n) => Number.isNaN(n))) return null;
  const alfa = partes.length > 3 && !Number.isNaN(partes[3]) ? partes[3] : 1;
  return [partes[0] / 255, partes[1] / 255, partes[2] / 255, alfa];
}

export function luminancia(cor: string): number | null {
  const c = componentes(cor);
  if (!c) return null;
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
}

/**
 * Compõe `frente` sobre `background` quando a frente é translúcida.
 *
 * Sem isto a medição mente para o alfa: `hsl(var(--ring) / 0.4)` sai do
 * `getComputedStyle` como `rgba(115,115,115,0.4)`, e ler a luminância desse
 * rgba ignora os 60% de fundo que a pessoa enxerga por baixo. Foi exatamente
 * essa a borda de hover que passou a APAGAR o campo quando o repouso escureceu.
 *
 * Exportada porque o FUNDO também precisa ser composto às vezes, não só a
 * frente: contêiner colorido pinta `hsl(var(--destructive) / 0.1)`, e medir o
 * texto contra esse rgba translúcido dá um número que ninguém vê na tela. Na
 * sonda do badge, medir sem compor deu razão ~1.0 em cinco variantes de seis.
 */
export function compor(frente: string, background: string): string {
  const f = componentes(frente);
  const b = componentes(background);
  if (!f || !b) return frente;
  if (f[3] >= 0.999) return frente;
  const mix = (i: number) => Math.round((f[i] * f[3] + b[i] * (1 - f[3])) * 255);
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
}

/** Razão WCAG entre duas cores computadas. Compõe a frente translúcida antes. */
export function ratio(frente: string, background: string): Contrast | null {
  const opaca = compor(frente, background);
  const a = luminancia(opaca);
  const b = luminancia(background);
  if (a === null || b === null) return null;
  const [light, escuro] = a > b ? [a, b] : [b, a];
  return { ratio: Math.round(((light + 0.05) / (escuro + 0.05)) * 100) / 100, frente: opaca, background };
}

/** Primeiro fundo OPACO acima do elemento — `backgroundColor` com alfa mente. */
export function backgroundEffective(el: Element | null): string | null {
  let atual: Element | null = el;
  while (atual) {
    const cor = getComputedStyle(atual).backgroundColor;
    const c = componentes(cor);
    if (c && c[3] > 0.99) return cor;
    atual = atual.parentElement;
  }
  return null;
}

/**
 * Roda `fn` com a transição do elemento desligada, e devolve o `style` como
 * estava.
 *
 * Sem isso a medição pega o PRIMEIRO QUADRO da transição, não o estado final:
 * os campos declaram `transition: border-color`, então logo após `focus()` — ou
 * logo após trocar a classe de tema — a borda ainda está na cor anterior.
 * Lido assim, um anel de foco perfeitamente pintado é relatado como
 * inexistente. Mesma armadilha do "contraste ~1.0 = elemento em fade"
 * registrada no CLAUDE.md.
 */
export function noTransicao<T>(el: HTMLElement, fn: () => T): T {
  const antes = el.style.transition;
  el.style.transition = 'none';
  void el.offsetHeight;
  try {
    return fn();
  } finally {
    el.style.transition = antes;
  }
}

/**
 * Liga o tema escuro NO LUGAR CERTO e devolve como desfazer.
 *
 * Os tokens escuros vivem em `.dark`, mas o tema de marca RE-DECLARA os mesmos
 * tokens em `.tema-*`, que mora mais abaixo na árvore e vence para tudo que
 * está dentro. Por isso a classe entra também em quem carrega `tema-*`.
 */
export function darkLigarTheme(doc: Document): () => void {
  const targets = [doc.documentElement, ...doc.querySelectorAll<HTMLElement>('[class*="tema-"]')];
  const postos = targets.filter((el) => !el.classList.contains('dark'));
  postos.forEach((el) => el.classList.add('dark'));
  return () => postos.forEach((el) => el.classList.remove('dark'));
}

// ─── Varredura por tema ───────────────────────────────────────────────────────

export const THEMES = ['default', 'warm', 'cold'] as const;
export const MODOS = ['claro', 'escuro'] as const;

/** Cor de frente do lado pedido, e o fundo contra o qual ela é vista. */
function measureUm(el: HTMLElement, lado: Side): { frente: string; background: string } | null {
  const cs = getComputedStyle(el);
  if (lado === 'preenchimento') {
    const background = backgroundEffective(el.parentElement);
    return background ? { frente: cs.backgroundColor, background } : null;
  }
  // A borda do campo é vista contra DOIS vizinhos: o interior do campo e a
  // página. Nos três temas os dois são o mesmo token (--input-background ==
  // --background), então o interior opaco do próprio campo responde pelos dois.
  const own = backgroundEffective(el);
  const background = own ?? backgroundEffective(el.parentElement);
  return background ? { frente: cs.borderTopColor, background } : null;
}

/**
 * Mede os alvos dentro de `raiz` nos três temas e nos dois modos.
 *
 * `raiz` recebe a classe de tema: as custom properties são herdadas, e
 * `.dark.tema-x` exige as DUAS classes no MESMO elemento (não basta `.dark` no
 * `<html>` — o `.tema-x` mais fundo na árvore re-declara os tokens claros e
 * vence). A classe original volta no fim; deixá-la posta envenena a story
 * seguinte e a foto do Chromatic.
 *
 * As transições morrem ANTES da troca de tema, não depois: `border-color` está
 * em transição nos campos, e medir logo após trocar a classe devolveria a cor
 * do tema anterior.
 */
export function byTheme<T>(
  raiz: HTMLElement,
  fn: (tema: (typeof THEMES)[number], modo: (typeof MODOS)[number]) => T,
): T[] {
  const classNameOriginal = raiz.className;
  const saida: T[] = [];
  try {
    for (const tema of THEMES) {
      for (const modo of MODOS) {
        raiz.className = `${classNameOriginal} tema-${tema}${modo === 'escuro' ? ' dark' : ''}`.trim();
        void raiz.offsetHeight;
        saida.push(fn(tema, modo));
      }
    }
  } finally {
    raiz.className = classNameOriginal;
    void raiz.offsetHeight;
  }
  return saida;
}

export function themeMeasureColor(raiz: HTMLElement, targets: ColorTarget[]): ColorMeasurement[] {
  const elementos = targets.map((a) => ({ alvo: a, el: raiz.querySelector<HTMLElement>(a.selector) }));

  const transicoesOriginais = elementos.map(({ el }) => el?.style.transition ?? null);
  elementos.forEach(({ el }) => {
    if (el) el.style.transition = 'none';
  });

  try {
    return byTheme(raiz, (tema, modo) =>
      elementos.map(({ alvo, el }): ColorMeasurement => {
        const lado = alvo.lado ?? 'borda';
        if (!el) {
          return { tema, modo, alvo: alvo.nome, lado, presente: false, frente: null, background: null, ratio: null };
        }
        const par = measureUm(el, lado);
        const r = par ? ratio(par.frente, par.background) : null;
        return {
          tema,
          modo,
          alvo: alvo.nome,
          lado,
          presente: true,
          frente: r?.frente ?? par?.frente ?? null,
          background: par?.background ?? null,
          ratio: r?.ratio ?? null,
        };
      }),
    ).flat();
  } finally {
    elementos.forEach(({ el }, i) => {
      if (!el) return;
      const antes = transicoesOriginais[i];
      if (antes) el.style.transition = antes;
      else el.style.removeProperty('transition');
    });
  }
}

/**
 * Resolve um valor CSS DENTRO da árvore de `raiz` — `var()`, alfa e tudo.
 *
 * Serve para medir o estado que o ponteiro produz sem depender do ponteiro:
 * `:hover` só existe com mouse real, e o `userEvent` das plays dispara eventos
 * sintéticos, que não acendem a pseudo-classe. Lendo a DECLARAÇÃO da folha e
 * resolvendo-a aqui, a medida continua sendo do navegador (é ele quem expande
 * o `var` e compõe o alfa), sem depender de CDP.
 */
export function resolveColor(raiz: HTMLElement, valor: string): string | null {
  const probe = raiz.ownerDocument.createElement('span');
  probe.style.color = valor;
  probe.style.position = 'absolute';
  probe.style.pointerEvents = 'none';
  probe.setAttribute('aria-hidden', 'true');
  raiz.appendChild(probe);
  try {
    const cor = getComputedStyle(probe).color;
    return cor || null;
  } finally {
    probe.remove();
  }
}

/**
 * Valor declarado para `prop` na primeira regra cujo seletor casa `filtro`.
 *
 * Percorre as folhas recursivamente porque `@media` e `@supports` embrulham
 * regras. `null` quer dizer que a regra sumiu da folha — o que já é o achado.
 */
export function ruleDeclaration(
  doc: Document,
  filtro: (selector: string) => boolean,
  prop: string,
): string | null {
  const visitar = (rules: CSSRuleList): string | null => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && filtro(rule.selectorText)) {
        const v = rule.style.getPropertyValue(prop);
        if (v) return v.trim();
      }
      const aninhadas = (rule as CSSGroupingRule).cssRules;
      if (aninhadas) {
        const finding = visitar(aninhadas);
        if (finding) return finding;
      }
    }
    return null;
  };

  for (const folha of Array.from(doc.styleSheets)) {
    try {
      const finding = visitar(folha.cssRules);
      if (finding) return finding;
    } catch {
      // Folha de outra origem: inacessível por CORS, e nenhuma do design
      // system entra assim. Segue para a próxima.
    }
  }
  return null;
}

/**
 * Seletores das regras que LEEM `--token` em alguma declaração.
 *
 * Serve para provar CONSUMO, não resultado: um token documentado que nenhuma
 * regra lê é decoração de tabela, e foi exatamente esse o defeito que os quatro
 * pares de feedback carregaram por uma rodada inteira — a paleta prometia
 * contraste de um par que a tela não formava. Medir a cor não pega isso: uma cor
 * que ninguém aplica passa em qualquer limite.
 *
 * Percorre as folhas recursivamente (`@media`/`@supports` embrulham regras) e
 * casa a string `var(--token)` no `cssText` da regra — e não iterando
 * `regra.style`, porque a iteração de `CSSStyleDeclaration` já não expôs custom
 * property em todo motor, e é justamente por custom property intermediária que
 * alert e badge consomem estes tokens
 * (`--alert-body-fg: hsl(var(--info-foreground))`). O `cssText` serializa a
 * declaração inteira, custom properties incluídas.
 */
export function selectorsQueLeem(doc: Document, token: string): string[] {
  const alvo = `var(--${token})`;
  const findings: string[] = [];

  const visitar = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        if (rule.cssText.includes(alvo)) findings.push(rule.selectorText);
      }
      const aninhadas = (rule as CSSGroupingRule).cssRules;
      if (aninhadas) visitar(aninhadas);
    }
  };

  for (const folha of Array.from(doc.styleSheets)) {
    try {
      visitar(folha.cssRules);
    } catch {
      // Folha de outra origem: inacessível por CORS, e nenhuma do design
      // system entra assim. Segue para a próxima.
    }
  }
  return findings;
}

/** Linha legível de uma medida — o que a falha da story precisa mostrar. */
export function describeMeasurement(m: ColorMeasurement): string {
  if (!m.presente) return `${m.tema}/${m.modo} · ${m.alvo}: seletor não casou`;
  return `${m.tema}/${m.modo} · ${m.alvo} (${m.lado}) ${m.frente} sobre ${m.background} = ${m.ratio}:1`;
}
