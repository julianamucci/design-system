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

import { contraste, darkLigarTheme, superficieDoApp } from './alert-probe';
import {
  byTheme, ratio, resolveColor, backgroundEffective, ruleDeclaration, noTransicao,
} from './cor';
import { byDensity, type Density } from './espacamento';

const VARIANTES = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;

const SIZES = [
  'xs', 'sm', 'lg', 'icon-xs', 'icon-sm', 'icon-lg', 'icon',
] as const;

/**
 * O botão ou pinta o próprio fundo, ou é transparente sobre a superfície do app.
 * Não há terceira hipótese, e por isso aqui não precisa da composição em camadas
 * do alert — precisa saber qual dos dois casos é.
 */
function buttonBackground(el: HTMLElement): string {
  const own = getComputedStyle(el).backgroundColor;
  const alfa = Number((own.match(/-?[\d.]+/g) ?? [])[3] ?? 1);
  return own !== 'rgba(0, 0, 0, 0)' && alfa >= 1 ? own : superficieDoApp(el);
}

function variantOf(el: HTMLElement): string {
  for (const v of VARIANTES) {
    if (el.classList.contains(`nds-button-${v}`)) return v;
  }
  // Sem classe de variante o botão é o default — três stacks omitem a classe
  // nesse caso, e isso é, ele próprio, um dado a comparar.
  return 'default (sem classe)';
}

export function measureButton(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const background = buttonBackground(el);
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
    borderWidth: Math.round(parseFloat(cs.borderTopWidth) || 0),
    gap: cs.gap,
    fonte: `${cs.fontSize}/${cs.fontWeight}`,
    background: cs.backgroundColor,
    cor: cs.color,
    contraste: contraste(cs.color, background),
    icone: icone
      ? `${Math.round(icone.getBoundingClientRect().width)}px aria-hidden=${icone.getAttribute('aria-hidden')}`
      : null,
  };
}

/** Todos os botões da tela, chaveados por variante. */
export function measureButtons(raiz: HTMLElement) {
  const byVariant: Record<string, ReturnType<typeof measureButton>> = {};
  for (const el of raiz.querySelectorAll<HTMLElement>('.nds-button')) {
    const v = variantOf(el);
    if (!byVariant[v]) byVariant[v] = measureButton(el);
  }
  return byVariant;
}

/** Contraste de cada variante nos DOIS temas. O `.dark` sai no `finally`. */
export function buttonsContrast(raiz: HTMLElement) {
  const ratio = (m: Record<string, ReturnType<typeof measureButton>>) =>
    Object.fromEntries(Object.entries(m).map(([v, d]) => [v, d.contraste]));
  const light = ratio(measureButtons(raiz));
  const desfazer = darkLigarTheme(raiz.ownerDocument);
  try {
    return { light, escuro: ratio(measureButtons(raiz)) };
  } finally {
    desfazer();
  }
}

/** Canal de saída: o console da play não chega ao terminal do vitest. */
export function reportButtons(stack: string, raiz: HTMLElement) {
  throw new Error(
    `SONDA::${stack}::matriz::${JSON.stringify({
      variantes: measureButtons(raiz),
      contraste: buttonsContrast(raiz),
    })}`,
  );
}

// ─── Chave por TAMANHO ────────────────────────────────────────────────────────

/**
 * Nome do tamanho a partir da classe. `default` não tem modificador — o
 * dimensionamento base mora em `.nds-button`, e essa ausência é o contrato.
 */
export function sizeOf(el: HTMLElement): string {
  for (const t of SIZES) {
    if (el.classList.contains(`nds-button-${t}`)) return t;
  }
  return 'default';
}

/** `true` para os quatro quadrados sem texto — a única exceção à 1.4.4. */
export function ehIconOnly(el: HTMLElement): boolean {
  return sizeOf(el).startsWith('icon');
}

/** Todos os botões da tela, chaveados por TAMANHO (um por tamanho). */
function bySize(raiz: HTMLElement): Map<string, HTMLElement> {
  const mapa = new Map<string, HTMLElement>();
  for (const el of raiz.querySelectorAll<HTMLElement>('.nds-button')) {
    const t = sizeOf(el);
    if (!mapa.has(t)) mapa.set(t, el);
  }
  return mapa;
}

// ─── WCAG 1.4.4 — a altura tem de crescer com a fonte ─────────────────────────

export interface CrescimentoMeasurement {
  tamanho: string;
  iconOnly: boolean;
  /** Altura em px com a fonte da raiz no valor normal. */
  base: number;
  /** Altura em px com a fonte da raiz DOBRADA. */
  dobrada: number;
  /** `dobrada / base`. 1.0 é altura cravada; ~2.0 é altura resultante. */
  fator: number;
}

/**
 * Mede a altura de cada tamanho com a fonte da raiz normal e DOBRADA.
 *
 * Ler `height` no CSS não prova nada: a altura pode estar cravada por
 * `padding-block` em px, por `min-height`, por um `--size-*` em rem que não
 * responde à fonte do usuário, ou por um ancestral. Medir duas vezes com a
 * fonte diferente é a única leitura que responde à pergunta da WCAG 1.4.4 —
 * "o bloco cresce junto com o texto?".
 *
 * A fonte é dobrada no `<html>` porque é ele que `rem` referencia e é ele que a
 * configuração do navegador mexe. Volta no `finally`: fonte vazada envenena a
 * story seguinte e a foto do Chromatic.
 */
export function measureCrescimentoWithFonte(raiz: HTMLElement): CrescimentoMeasurement[] {
  const html = raiz.ownerDocument.documentElement;
  const fonteOriginal = html.style.fontSize;
  const targets = bySize(raiz);

  const alturas = (): Map<string, number> => {
    void raiz.offsetHeight;
    return new Map([...targets].map(([t, el]) => [t, el.getBoundingClientRect().height]));
  };

  try {
    const base = alturas();
    const emPx = parseFloat(getComputedStyle(html).fontSize) || 16;
    html.style.fontSize = `${emPx * 2}px`;
    const dobrada = alturas();
    return [...targets].map(([tamanho, el]) => {
      const b = base.get(tamanho)!;
      const d = dobrada.get(tamanho)!;
      return {
        tamanho,
        iconOnly: ehIconOnly(el),
        base: Math.round(b * 100) / 100,
        dobrada: Math.round(d * 100) / 100,
        fator: b > 0 ? Math.round((d / b) * 100) / 100 : 0,
      };
    });
  } finally {
    if (fonteOriginal) html.style.fontSize = fonteOriginal;
    else html.style.removeProperty('font-size');
    void raiz.offsetHeight;
  }
}

// ─── WCAG 2.5.8 — alvo de toque nas três densidades ───────────────────────────

export interface TargetMeasurement {
  tamanho: string;
  densidade: Density;
  largura: number;
  altura: number;
  /** O menor lado — é ele que a 2.5.8 compara com 24. */
  menorLado: number;
}

/**
 * Caixa de cada tamanho de botão nas três densidades.
 *
 * A densidade entra no `<html>` (ver `byDensity`): `--spacing-*` é resolvido
 * em `:root`, então redeclarar a base num contêiner do meio da árvore não move
 * nada. O botão de ícone lê `--size-*`, que a densidade também redeclara.
 */
export function touchMeasureTarget(raiz: HTMLElement): TargetMeasurement[] {
  const targets = bySize(raiz);
  return byDensity(raiz, (densidade) =>
    [...targets].map(([tamanho, el]): TargetMeasurement => {
      const r = el.getBoundingClientRect();
      const largura = Math.round(r.width * 100) / 100;
      const altura = Math.round(r.height * 100) / 100;
      return { tamanho, densidade, largura, altura, menorLado: Math.min(largura, altura) };
    }),
  ).flat();
}

// ─── Contraste por tema, modo, variante — texto E borda ───────────────────────

export interface VariantMeasurement {
  tema: string;
  modo: 'claro' | 'escuro';
  variante: string;
  /** `false` quando a variante não está na tela — isso É o achado. */
  presente: boolean;
  texto: number | null;
  /** `null` quando a variante não desenha borda (largura 0). */
  border: number | null;
  background: string | null;
}

/**
 * Contraste de texto e de borda de CADA variante, nos três temas e nos dois
 * modos.
 *
 * O fundo é o efetivo — `--destructive / 0.1` e `--muted / 0.3` têm alfa, e ler
 * `backgroundColor` devolveria uma cor que ninguém vê. A borda é medida contra
 * o mesmo fundo do botão: é a superfície com que ela faz limite por dentro, e
 * nos três temas `--background` responde pelo lado de fora.
 */
export function themeMeasureVariants(raiz: HTMLElement): VariantMeasurement[] {
  const targets = new Map<string, HTMLElement>();
  for (const el of raiz.querySelectorAll<HTMLElement>('.nds-button')) {
    const v = variantOf(el);
    if (!targets.has(v)) targets.set(v, el);
  }

  // As transições morrem ANTES da troca de tema: `background-color` e `color`
  // estão no lote de transição do botão, e medir logo após trocar a classe
  // devolveria a cor do tema anterior — o "contraste ~1.0" do CLAUDE.md.
  const originais = [...targets.values()].map((el) => el.style.transition);
  targets.forEach((el) => { el.style.transition = 'none'; });
  const backgroundOriginal = raiz.style.backgroundColor;

  try {
    return byTheme(raiz, (tema, modo) => {
      // A raiz da sonda PINTA a superfície do app antes de medir.
      //
      // Sem isto o escuro é medido contra o branco do `<body>`, que o harness do
      // Storybook não repinta: `backgroundEffective` sobe a árvore procurando o
      // primeiro opaco, atravessa a raiz (transparente) e chega ao body claro.
      // Toda variante de fundo translúcido — outline, ghost, link, destructive —
      // acusava então ~1.05:1 no escuro, um defeito que não existe. É a mesma
      // armadilha que o `alert-probe` documenta, aqui pelo lado do CONTÊINER: lá
      // a saída foi resolver `--background`, e é ela que se aplica na raiz.
      raiz.style.backgroundColor = superficieDoApp(raiz);
      void raiz.offsetHeight;
      const superficie = raiz.style.backgroundColor;

      return [...VARIANTES].map((variante): VariantMeasurement => {
        const el = targets.get(variante);
        if (!el) {
          return { tema, modo, variante, presente: false, texto: null, border: null, background: null };
        }
        const cs = getComputedStyle(el);
        const background = backgroundEffective(el) ?? superficie;
        const borderWidth = parseFloat(cs.borderTopWidth) || 0;
        return {
          tema,
          modo,
          variante,
          presente: true,
          texto: ratio(cs.color, background)?.ratio ?? null,
          // A borda é vista contra a PÁGINA, não contra o interior do botão: é o
          // limite externo do controle, e é dele que a 1.4.11 fala.
          border:
            borderWidth > 0
              ? (ratio(cs.borderTopColor, superficie)?.ratio ?? null)
              : null,
          background,
        };
      });
    }).flat();
  } finally {
    [...targets.values()].forEach((el, i) => {
      if (originais[i]) el.style.transition = originais[i];
      else el.style.removeProperty('transition');
    });
    if (backgroundOriginal) raiz.style.backgroundColor = backgroundOriginal;
    else raiz.style.removeProperty('background-color');
  }
}

/**
 * Contraste do ANEL DE FOCO de cada variante, nos três temas e nos dois modos.
 *
 * Separado de `themeMeasureVariants` porque a pergunta é outra: ali o limite é
 * 4.5:1 de texto, aqui é 3:1 de elemento não-textual (WCAG 1.4.11). E porque a
 * cor do anel não sai do elemento — sai da DECLARAÇÃO da folha, resolvida
 * dentro da árvore que carrega o tema.
 */
export function themeMeasureRing(raiz: HTMLElement) {
  const regras: [string, string][] = [
    ['foco', '.nds-button:focus-visible'],
    ['foco-destructive', '.nds-button-destructive:focus-visible'],
    ['invalido', '.nds-button[aria-invalid="true"]'],
  ];

  const declaradas = regras.map(([nome, seletor]) => [
    nome,
    ruleDeclaration(raiz.ownerDocument, (s) => s.includes(seletor), 'box-shadow') ?? '',
  ] as const);

  return byTheme(raiz, (tema, modo) => {
    const superficie = superficieDoApp(raiz);
    const saida: Record<string, number | null> = {};
    for (const [nome, declarada] of declaradas) {
      // Última camada de cor da sombra: é a banda visível do anel — as
      // anteriores são o vão em `--background` e a elevação.
      const cores = declarada.match(/hsl\(var\(--[a-z-]+\)(?:\s*\/\s*[\d.]+)?\s*\)/g) ?? [];
      const banda = cores.at(-1);
      const bruta = banda ? resolveColor(raiz, banda) : null;
      saida[nome] = bruta ? (ratio(bruta, superficie)?.ratio ?? null) : null;
    }
    return { tema, modo, ...saida };
  });
}

// ─── Anel de foco ─────────────────────────────────────────────────────────────

export interface RingMeasurement {
  /** `box-shadow` computado sem foco. */
  rest: string;
  /** `box-shadow` computado com `:focus-visible` casando. */
  focus: string;
  /** `true` quando o navegador realmente acendeu a pseudo-classe. */
  focoVisivel: boolean;
  /** Cor do anel já composta sobre o fundo que ele cobre. */
  corDoAnel: string | null;
  /** Anel × superfície do app — WCAG 1.4.11, limite 3:1. */
  contra0Fundo: number | null;
  /** Anel × borda de repouso do botão. `null` quando o botão não tem borda. */
  contraBordaDeRepouso: number | null;
}

/**
 * Mede o anel de foco de UM botão já focado pela story.
 *
 * O foco é da story de propósito: `:focus-visible` é heurística do navegador —
 * `el.focus()` programático nem sempre a acende, e uma sonda que forçasse a
 * classe mediria uma regra que o usuário talvez nunca veja. `focoVisivel`
 * registra se a pseudo-classe casou de fato; `false` é o achado.
 *
 * `rest` tem de ser colhido ANTES do foco — daí ser parâmetro.
 */
export function focusMeasureRing(el: HTMLElement, rest: string): RingMeasurement {
  // `box-shadow` está no lote de transição do botão. Lida logo após o Tab, a
  // sombra volta no PRIMEIRO QUADRO — camada externa com 0px de espalhamento e
  // alfa quase zero — e um anel perfeitamente pintado é relatado como
  // inexistente. Medido: `rgba(0,0,0,0) 0px 0px 0px 0px` no ghost e no link.
  // Desligar a transição faz o computado saltar para o valor final.
  const focus = noTransicao(el, () => getComputedStyle(el).boxShadow);
  const cs = getComputedStyle(el);
  const raiz = el.parentElement ?? el;
  const superficie = superficieDoApp(el);

  // A cor do anel sai da DECLARAÇÃO da folha, não da string do box-shadow
  // computado: o navegador devolve as camadas concatenadas, e separar a cor da
  // camada externa por regex quebra em `rgba(...)` com vírgulas. Resolvendo o
  // valor declarado o próprio navegador expande o `var` e compõe o alfa.
  const declarado = ruleDeclaration(
    el.ownerDocument,
    (s) => s.includes('.nds-button:focus-visible'),
    'box-shadow',
  );
  const ringToken = declarado?.match(/hsl\(var\(--ring\)[^)]*\)\s*\)?/)?.[0] ?? 'hsl(var(--ring) / 0.5)';
  const bruta = resolveColor(raiz, ringToken);
  const composto = bruta ? ratio(bruta, superficie) : null;

  const restBorder = parseFloat(cs.borderTopWidth) > 0 ? cs.borderTopColor : null;

  return {
    rest,
    focus,
    focoVisivel: el.matches(':focus-visible'),
    corDoAnel: composto?.frente ?? bruta,
    contra0Fundo: composto?.ratio ?? null,
    contraBordaDeRepouso:
      restBorder && composto ? (ratio(composto.frente, restBorder)?.ratio ?? null) : null,
  };
}

// ─── Desabilitado ─────────────────────────────────────────────────────────────

export interface DisabledMeasurement {
  /** `nativo`, `aria`, `both` ou `nenhum` — `nenhum` é o achado. */
  mecanismo: string;
  /** `none` impede o clique de ponteiro; qualquer outro valor o deixa passar. */
  pointer: string;
  /** Foco retido depois de `focus()`. Nativo bloqueia; `aria-disabled` não. */
  retemFocus: boolean;
  /** `true` quando `elementFromPoint` no centro devolve o próprio botão. */
  alcancavelPeloPonteiro: boolean;
  opacidade: number;
}

export function measureDisabled(el: HTMLElement): DisabledMeasurement {
  const cs = getComputedStyle(el);
  const nativo = el.hasAttribute('disabled');
  const aria = el.getAttribute('aria-disabled') === 'true';
  const r = el.getBoundingClientRect();
  const alvo = el.ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);

  const antes = el.ownerDocument.activeElement;
  el.focus();
  const retemFocus = el.ownerDocument.activeElement === el;
  if (!retemFocus && antes instanceof HTMLElement) antes.focus();

  return {
    mecanismo: nativo && aria ? 'ambos' : nativo ? 'nativo' : aria ? 'aria' : 'nenhum',
    pointer: cs.pointerEvents,
    retemFocus,
    alcancavelPeloPonteiro: alvo === el || el.contains(alvo),
    opacidade: Number(cs.opacity),
  };
}

// ─── Botão como link ──────────────────────────────────────────────────────────

export interface LinkMeasurement {
  tag: string;
  /** `null` sem `href` — âncora sem destino não é link para o leitor de tela. */
  href: string | null;
  /** `role` explícito. `button` num `<a href>` é perda de semântica. */
  papel: string | null;
  /** Índice de tabulação efetivo. `<a href>` é focável sem declarar nada. */
  tabIndex: number;
  focavel: boolean;
  nomeAcessivel: string;
  temClasseDeBotao: boolean;
}

export function measureLink(el: HTMLElement): LinkMeasurement {
  const antes = el.ownerDocument.activeElement;
  el.focus();
  const focavel = el.ownerDocument.activeElement === el;
  if (antes instanceof HTMLElement) antes.focus();

  return {
    tag: el.tagName.toLowerCase(),
    href: el.getAttribute('href'),
    papel: el.getAttribute('role'),
    tabIndex: el.tabIndex,
    focavel,
    nomeAcessivel: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim(),
    temClasseDeBotao: el.classList.contains('nds-button'),
  };
}

// ─── Ícone ────────────────────────────────────────────────────────────────────

export interface IconMeasurement {
  /** `null` quando o SVG não se esconde do leitor — o achado. */
  ariaHidden: string | null;
  /** `<title>` dentro do SVG entra no nome acessível e o polui. */
  temTitulo: boolean;
  lado: number;
  /** Texto que o leitor de tela anuncia para o botão inteiro. */
  nomeAcessivel: string;
  /** `true` quando o nome vem do `aria-label` (obrigatório em icon-only). */
  nomeVemDoRotulo: boolean;
}

export function measureIcon(button: HTMLElement): IconMeasurement | null {
  const svg = button.querySelector<SVGSVGElement>('svg');
  if (!svg) return null;
  const rotulo = button.getAttribute('aria-label');
  return {
    ariaHidden: svg.getAttribute('aria-hidden'),
    temTitulo: !!svg.querySelector('title'),
    lado: Math.round(svg.getBoundingClientRect().width),
    nomeAcessivel: (rotulo ?? button.textContent ?? '').trim(),
    nomeVemDoRotulo: !!rotulo,
  };
}

// ─── Portões: o que as stories asseveram ──────────────────────────────────────

/**
 * Variantes cujo TEXTO fica abaixo de `minimum` em algum tema ou modo.
 *
 * Devolve linha legível por falha, e `[]` quando tudo passa — de modo que a
 * story escreva `expect(falhas).toEqual([])` e a mensagem de erro já diga qual
 * tema, qual modo, qual variante e qual razão.
 *
 * Isto é o que `testes.accessibility.item2` prometia. O item dizia "axe-core /
 * Lighthouse" no campo `how`, e nenhuma das duas coisas rodava: o axe do
 * test-runner mede o que está na tela, e a tela está sempre no tema claro
 * padrão. Cinco sextos da matriz nunca foram olhados por ninguém.
 */
export function contrastDeTextFailures(raiz: HTMLElement, minimum: number): string[] {
  return themeMeasureVariants(raiz)
    .filter((m) => m.presente && m.texto !== null && m.texto < minimum)
    .map((m) => `${m.tema}/${m.modo} · ${m.variante}: texto ${m.texto}:1 (mínimo ${minimum})`);
}

/**
 * Temas/modos em que a banda colorida do anel fica abaixo de `minimum`.
 *
 * `minimum` é 3 — WCAG 1.4.11 trata o anel como informação não-textual. Cobre as
 * três regras de anel do botão (foco, foco destrutivo e inválido permanente).
 */
export function ringFailures(raiz: HTMLElement, minimum: number): string[] {
  const saida: string[] = [];
  for (const linha of themeMeasureRing(raiz)) {
    for (const [nome, valor] of Object.entries(linha)) {
      if (nome === 'tema' || nome === 'modo') continue;
      // `tema` e `modo` saíram no `continue` acima, então o que resta é razão
      // ou `null`. A guarda por tipo é o que o `Object.entries` exige — o cast
      // direto para número não compila, e forçá-lo esconderia um campo novo de
      // outro tipo no dia em que a linha crescer.
      const r = typeof valor === 'number' ? valor : null;
      // `null` quer dizer que a REGRA sumiu da folha — achado, não aprovação.
      if (r === null) saida.push(`${linha.tema}/${linha.modo} · ${nome}: regra ausente na folha`);
      else if (r < minimum) saida.push(`${linha.tema}/${linha.modo} · ${nome}: ${r}:1 (mínimo ${minimum})`);
    }
  }
  return saida;
}

// ─── Colheita completa ────────────────────────────────────────────────────────

/**
 * Roda a bateria inteira sobre a mesma tela e lança o resultado.
 *
 * Mora aqui, e não em cada story, porque a comparação entre stacks só vale se as
 * cinco medirem a MESMA coisa na mesma ordem — cinco cópias divergiriam na
 * primeira correção. As stories ficam com o que é irredutivelmente de stack: o
 * markup dos cenários.
 *
 * `tab` é injetado porque o `userEvent` é do pacote de teste, não do colhedor —
 * e porque o foco tem de vir de TECLADO: `:focus-visible` é heurística do
 * navegador, e `el.focus()` programático mede uma regra que a pessoa talvez
 * nunca veja.
 */
export async function colherAll(
  stack: string,
  raiz: HTMLElement,
  tab: () => Promise<void>,
): Promise<never> {
  const doc = raiz.ownerDocument;
  const buttons = [...raiz.querySelectorAll<HTMLElement>('.nds-button')];
  const rest = new Map(buttons.map((b) => [b, getComputedStyle(b).boxShadow]));

  const crescimento = measureCrescimentoWithFonte(raiz);
  const alvo = touchMeasureTarget(raiz);
  const temas = themeMeasureVariants(raiz);

  const focos: Record<string, RingMeasurement> = {};
  (doc.activeElement as HTMLElement | null)?.blur();
  for (let i = 0; i < buttons.length + 4; i++) {
    await tab();
    const ativo = doc.activeElement as HTMLElement | null;
    if (!ativo?.classList?.contains('nds-button')) continue;
    const chave = variantOf(ativo);
    if (!focos[chave]) focos[chave] = focusMeasureRing(ativo, rest.get(ativo) ?? '');
  }

  const find = (sel: string) => raiz.querySelector<HTMLElement>(sel);
  const desab = find('[data-sonda="desabilitado"]');
  const link = find('[data-sonda="link"]');
  const withIcon = find('[data-sonda="com-icone"]');
  const iconOnly = find('.nds-button-icon-sm');

  throw new Error(
    `SONDA::${stack}::` +
      JSON.stringify({
        matriz: measureButtons(raiz),
        crescimento,
        alvo,
        temas,
        anelPorTema: themeMeasureRing(raiz),
        focos,
        desabilitado: desab ? measureDisabled(desab) : null,
        link: link ? measureLink(link) : null,
        iconeComTexto: withIcon ? measureIcon(withIcon) : null,
        iconeSozinho: iconOnly ? measureIcon(iconOnly) : null,
      }),
  );
}
