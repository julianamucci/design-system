/**
 * Sonda de comparação do Alert entre as quatro stacks.
 *
 * Mesmo papel da sonda do Calendar: medir as quatro de uma vez, com o mesmo
 * colhedor, para a divergência aparecer como diferença de valor e não como
 * impressão de quem olha.
 *
 * O que interessa aqui é sobretudo CONTRASTE. O alert pinta um fundo colorido
 * suave e escreve por cima; a regra do projeto é que o texto corrido fique
 * sempre em `--foreground` e só ícone e título possam receber a cor semântica —
 * e mesmo o título só quando alcança 4.5:1. Isso é aritmética, não olhômetro,
 * então a sonda calcula a razão em vez de comparar nomes de token.
 */

export interface MedidaDeTexto {
  cor: string;
  contraste: number;
}

function rgb(cor: string): [number, number, number] {
  const m = cor.match(/-?[\d.]+/g);
  if (!m) return [0, 0, 0];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

/** Luminância relativa, WCAG 2.x. */
function luminancia(cor: string): number {
  const [r, g, b] = rgb(cor).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Razão de contraste entre duas cores JÁ RESOLVIDAS.
 *
 * O fundo é lido do próprio alert, e não do body: um fundo semitransparente
 * sobre branco não é o mesmo que sobre o cinza de um card, e medir contra a
 * página inteira daria um número que não existe na tela.
 */
export function contraste(frente: string, fundo: string): number {
  const a = luminancia(frente);
  const b = luminancia(fundo);
  const [claro, escuro] = a > b ? [a, b] : [b, a];
  return Math.round(((claro + 0.05) / (escuro + 0.05)) * 100) / 100;
}

/**
 * Liga o tema escuro NO LUGAR CERTO e devolve como desfazer.
 *
 * Marcar só o `documentElement` não bastava: os tokens escuros vivem em `.dark`,
 * mas o tema de marca RE-DECLARA os mesmos tokens em `.tema-default` — e essa
 * classe mora mais abaixo na árvore, então vence para tudo que está dentro. O
 * resultado era um escuro que não escurecia: `--background` voltava claro nos
 * dois temas, e toda variante transparente acusava contraste ~1:1.
 *
 * Por isso a classe entra também em quem carrega `tema-*`.
 */
export function ligarTemaEscuro(doc: Document): () => void {
  const alvos = [doc.documentElement, ...doc.querySelectorAll<HTMLElement>('[class*="tema-"]')];
  const postos = alvos.filter((el) => !el.classList.contains('dark'));
  postos.forEach((el) => el.classList.add('dark'));
  return () => postos.forEach((el) => el.classList.remove('dark'));
}

/**
 * Cor da superfície do app (`--background`), resolvida pelo navegador.
 *
 * O elemento-sonda entra ao lado do medido para herdar as mesmas custom
 * properties: se o tema mudou, `--background` mudou junto, e a cor volta em rgb
 * sem que ninguém precise interpretar HSL aqui. Sai do DOM no `finally`.
 */
export function superficieDoApp(perto: HTMLElement): string {
  const doc = perto.ownerDocument;
  const sonda = doc.createElement('div');
  // O token é RESOLVIDO antes de pintar: `style.backgroundColor = 'hsl(var(…))'`
  // é descartado pelo CSSOM (não parseia como <color> na atribuição), e o
  // computado voltava transparente — caindo no branco em qualquer tema. Com o
  // valor já substituído a declaração é uma cor comum, e o navegador converte
  // para rgb sem que ninguém precise interpretar HSL aqui.
  const canais = getComputedStyle(perto).getPropertyValue('--background').trim();
  if (!canais) return 'rgb(255, 255, 255)';
  sonda.style.backgroundColor = `hsl(${canais})`;
  sonda.style.position = 'absolute';
  sonda.style.pointerEvents = 'none';
  (perto.parentElement ?? doc.body).appendChild(sonda);
  try {
    const cor = getComputedStyle(sonda).backgroundColor;
    // `--background` ausente faz o navegador descartar a declaração; aí o
    // computado volta transparente e o branco é a última rede.
    return cor && cor !== 'rgba(0, 0, 0, 0)' ? cor : 'rgb(255, 255, 255)';
  } finally {
    sonda.remove();
  }
}

/**
 * Fundo efetivo: sobe a árvore até achar quem realmente pinta.
 *
 * `--alert-bg` costuma ter alfa, e `backgroundColor` devolve a cor declarada,
 * não a composta. Sem compor com o ancestral opaco, o contraste medido é o de
 * uma cor que ninguém vê.
 */
export function fundoEfetivo(el: HTMLElement): string {
  let atual: HTMLElement | null = el;
  const camadas: string[] = [];
  while (atual) {
    const cor = getComputedStyle(atual).backgroundColor;
    const [, , , alfa = 1] = (cor.match(/-?[\d.]+/g) ?? []).map(Number);
    if (cor !== 'rgba(0, 0, 0, 0)') camadas.unshift(cor);
    if (cor !== 'rgba(0, 0, 0, 0)' && alfa >= 1) break;
    atual = atual.parentElement;
  }
  // Nada opaco acima: a superfície é a do app, `--background`. Resolvida por um
  // elemento-sonda montado no mesmo ponto da árvore, para herdar o tema vigente
  // — subir até o body devolvia a cor clara também no escuro, porque o harness
  // não o repinta, e aí toda variante transparente acusava contraste ~1:1.
  if (camadas.length === 0) return superficieDoApp(el);
  // Composição de trás para frente (source-over).
  return camadas.reduce((base, camada) => {
    const [r, g, b, a = 1] = (camada.match(/-?[\d.]+/g) ?? []).map(Number);
    const [br, bg, bb] = rgb(base);
    const mist = (f: number, t: number) => Math.round(f * a + t * (1 - a));
    return `rgb(${mist(r, br)}, ${mist(g, bg)}, ${mist(b, bb)})`;
  });
}

function medirTexto(el: Element | null, fundo: string): MedidaDeTexto | null {
  if (!el) return null;
  const cor = getComputedStyle(el as HTMLElement).color;
  return { cor, contraste: contraste(cor, fundo) };
}

export function medirAlert(raiz: HTMLElement) {
  const alerta = raiz.querySelector<HTMLElement>('.nds-alert');
  if (!alerta) return { achado: false };
  return medirAlertEm(alerta);
}

/** Mede UM alert já localizado — é o que a story usa quando há vários na tela. */
export function medirAlertEm(alerta: HTMLElement) {

  const fundo = fundoEfetivo(alerta);
  const cs = getComputedStyle(alerta);
  const titulo = alerta.querySelector('.nds-alert-title, h1, h2, h3, h4, h5, h6, [data-title], strong');
  const descricao = alerta.querySelector('.nds-alert-description, section');
  const icone = alerta.querySelector<HTMLElement>(':scope > svg');
  const fechar = alerta.querySelector<HTMLElement>('.nds-alert-dismiss');

  return {
    achado: true,
    classes: alerta.className.split(/\s+/).filter((c) => c.startsWith('nds-alert')).sort().join(' '),
    papel: alerta.getAttribute('role'),
    aoVivo: alerta.getAttribute('aria-live'),
    fundo,
    borda: cs.borderTopColor,
    larguraDaBorda: Math.round(parseFloat(cs.borderTopWidth) || 0),
    titulo: medirTexto(titulo, fundo),
    descricao: medirTexto(descricao, fundo),
    icone: icone ? getComputedStyle(icone).color : null,
    fechar: fechar
      ? { rotulo: fechar.getAttribute('aria-label'), tag: fechar.tagName.toLowerCase() }
      : null,
    /** Estrutura: quem é filho direto, na ordem. */
    filhos: Array.from(alerta.children)
      .map((f) => f.tagName.toLowerCase() + (f.className ? '.' + String(f.className).split(/\s+/)[0] : ''))
      .join(' > '),
  };
}

export interface FalhaDeContraste {
  variante: string;
  parte: 'título' | 'texto';
  contraste: number;
}

/** Nome da variante a partir da classe — "default" quando não há modificador. */
function varianteDe(alerta: HTMLElement): string {
  const m = alerta.className.match(/nds-alert-(destructive|success|warning|info)\b/);
  return m ? m[1] : 'default';
}

function falhas(raiz: HTMLElement, minimo: number, tema: string): FalhaDeContraste[] {
  const encontradas: FalhaDeContraste[] = [];
  for (const alerta of raiz.querySelectorAll<HTMLElement>('.nds-alert')) {
    const m = medirAlertEm(alerta);
    const variante = `${varianteDe(alerta)} (${tema})`;
    if (m.titulo && m.titulo.contraste < minimo) {
      encontradas.push({ variante, parte: 'título', contraste: m.titulo.contraste });
    }
    if (m.descricao && m.descricao.contraste < minimo) {
      encontradas.push({ variante, parte: 'texto', contraste: m.descricao.contraste });
    }
  }
  return encontradas;
}

/**
 * Contraste de TODOS os alerts da tela, nos DOIS temas.
 *
 * O tema escuro é metade do produto e não era medido em lugar nenhum: o `info`
 * ficou com o título em 3.19:1 sem ninguém ver, enquanto no claro marcava 6.16.
 * O limite é 4.5 porque o título é 14px semibold — pela WCAG isso não é texto
 * grande (precisaria de 18.66px em negrito), então os 3:1 não valem aqui.
 *
 * A classe `.dark` é removida no fim mesmo se a medição falhar: deixá-la posta
 * envenenaria a story seguinte e a foto do Chromatic.
 */
export function contrasteNosDoisTemas(raiz: HTMLElement, minimo = 4.5): FalhaDeContraste[] {
  const claro = falhas(raiz, minimo, 'claro');
  const desfazer = ligarTemaEscuro(raiz.ownerDocument);
  try {
    return [...claro, ...falhas(raiz, minimo, 'escuro')];
  } finally {
    desfazer();
  }
}

/** Mensagem de falha legível, com o número medido. */
export function descreverFalhas(fs: FalhaDeContraste[]): string {
  return fs.map((f) => `  · ${f.variante} — ${f.parte} em ${f.contraste}:1`).join('\n');
}

// ─── Sonda: os três temas de marca, não só claro × escuro ────────────────────
//
// `contrasteNosDoisTemas` mede o tema VIGENTE em claro e escuro — e o vigente é
// sempre o `default`, porque é o que a toolbar entrega ao test-runner. Warm e
// Cold re-declaram `--destructive`, `--success`, `--warning` e `--info` com
// outros matizes, então cada um é um par de cores diferente sobre um fundo
// diferente. Seis combinações, não duas.
//
// A varredura por tema vem de `cor.ts` (`porTema`) para não existir um segundo
// colhedor de tema neste repositório: é ele que sabe que `.dark.tema-x` exige as
// duas classes NO MESMO elemento.

import { TEMAS, MODOS } from './cor';

/**
 * Roda `fn` uma vez por tema de marca e modo, trocando a classe NO
 * `documentElement`.
 *
 * O `porTema` do `cor.ts` estampa a classe na raiz da story, e para medir a
 * BORDA de um campo isso basta. Aqui não basta, e a primeira versão desta sonda
 * caiu no buraco: o fundo do alert tem alfa, então a cor que se enxerga depende
 * de quem pinta por baixo — e quem pinta é o `body`, com
 * `background-color: hsl(var(--background))`. Com a classe só na raiz da story,
 * o `body` continuava no claro e TODA variante translúcida era medida sobre
 * branco no tema escuro: o `warning` acusava 1.01:1, um defeito que não existe.
 *
 * Estampando no `documentElement`, o `body` repinta junto e a medida é a do
 * produto. As classes que não são de tema (densidade, fonte, escala) são
 * preservadas; a original volta no `finally`, senão a story seguinte e a foto
 * do Chromatic herdam o tema da última iteração.
 */
export function porTemaNoDocumento<T>(
  doc: Document,
  fn: (tema: (typeof TEMAS)[number], modo: (typeof MODOS)[number]) => T,
): T[] {
  const html = doc.documentElement;
  const original = html.className;
  const preservadas = Array.from(html.classList).filter(
    (c) => !c.startsWith('tema-') && c !== 'dark',
  );
  const saida: T[] = [];
  try {
    for (const tema of TEMAS) {
      for (const modo of MODOS) {
        html.className = [...preservadas, `tema-${tema}`, ...(modo === 'escuro' ? ['dark'] : [])].join(' ');
        void html.offsetHeight;
        saida.push(fn(tema, modo));
      }
    }
  } finally {
    html.className = original;
    void html.offsetHeight;
  }
  return saida;
}

/**
 * As camadas de fundo entre o elemento e a primeira superfície opaca, com o
 * elemento que pinta cada uma.
 *
 * Serve para responder "contra o que este texto está sendo medido?" — pergunta
 * que decide se um contraste baixo é defeito de paleta ou artefato de harness.
 */
export function camadasDeFundo(el: HTMLElement): string[] {
  const camadas: string[] = [];
  let atual: HTMLElement | null = el;
  while (atual) {
    const cor = getComputedStyle(atual).backgroundColor;
    const quem =
      atual.tagName.toLowerCase() +
      (atual.id ? `#${atual.id}` : '') +
      (typeof atual.className === 'string' && atual.className
        ? `.${atual.className.trim().split(/\s+/).join('.')}`
        : '');
    if (cor !== 'rgba(0, 0, 0, 0)') camadas.push(`${quem} → ${cor}`);
    const [, , , alfa = 1] = (cor.match(/-?[\d.]+/g) ?? []).map(Number);
    if (cor !== 'rgba(0, 0, 0, 0)' && alfa >= 1) break;
    atual = atual.parentElement;
  }
  return camadas;
}

export interface MedidaDeVariante {
  tema: string;
  modo: 'claro' | 'escuro';
  variante: string;
  fundo: string;
  /** `null` quando o elemento não existe — isso É o achado, não falha da sonda. */
  titulo: MedidaDeTexto | null;
  descricao: MedidaDeTexto | null;
  icone: MedidaDeTexto | null;
}

/**
 * Contraste de todos os alerts da tela nos TRÊS temas de marca e nos DOIS modos.
 *
 * Devolve a tabela inteira, não só as falhas: resultado negativo também é
 * resultado, e a linha que passa com folga é o que prova que a regra do
 * contêiner colorido está sendo cumprida.
 */
export function contrastePorTema(raiz: HTMLElement): MedidaDeVariante[] {
  return porTemaNoDocumento(raiz.ownerDocument, (tema, modo) =>
    Array.from(raiz.querySelectorAll<HTMLElement>('.nds-alert')).map((alerta): MedidaDeVariante => {
      const fundo = fundoEfetivo(alerta);
      const icone = alerta.querySelector<HTMLElement>(':scope > svg:not(.nds-icon)')
        ?? alerta.querySelector<HTMLElement>(':scope > svg');
      return {
        tema,
        modo,
        variante: varianteDe(alerta),
        fundo,
        titulo: medirTexto(alerta.querySelector('.nds-alert-title'), fundo),
        descricao: medirTexto(alerta.querySelector('.nds-alert-description'), fundo),
        icone: medirTexto(icone, fundo),
      };
    }),
  ).flat();
}

/** Uma linha por medida — a tabela inteira, para o diff campo a campo. */
export function resumirPorTema(medidas: MedidaDeVariante[]): string[] {
  const n = (m: MedidaDeTexto | null) => (m ? String(m.contraste) : 'null');
  return medidas.map(
    (m) =>
      `${m.variante}|${m.tema}/${m.modo}|fundo=${m.fundo}|titulo=${n(m.titulo)}|texto=${n(m.descricao)}|icone=${n(m.icone)}`,
  );
}

/** Só as linhas que reprovam o mínimo, já legíveis. */
export function reprovasPorTema(medidas: MedidaDeVariante[], minimo = 4.5): string[] {
  const saida: string[] = [];
  for (const m of medidas) {
    const rotulo = `${m.variante} · ${m.tema}/${m.modo}`;
    if (m.titulo && m.titulo.contraste < minimo) {
      saida.push(`${rotulo} — título ${m.titulo.contraste}:1 (${m.titulo.cor} sobre ${m.fundo})`);
    }
    if (m.descricao && m.descricao.contraste < minimo) {
      saida.push(`${rotulo} — texto ${m.descricao.contraste}:1 (${m.descricao.cor} sobre ${m.fundo})`);
    }
    if (!m.titulo) saida.push(`${rotulo} — título AUSENTE (.nds-alert-title não casou)`);
    if (!m.descricao) saida.push(`${rotulo} — texto AUSENTE (.nds-alert-description não casou)`);
  }
  return saida;
}

// ─── Sonda: semântica de anúncio e ordem de leitura ──────────────────────────

export interface SemanticaDoAlert {
  variante: string;
  /** Tag da raiz — o contrato do design system é `div`. */
  tag: string;
  papel: string | null;
  ariaLive: string | null;
  ariaAtomic: string | null;
  /** `null` quando não há `<svg>` filho direto. */
  icone: { ariaHidden: string | null; role: string | null; focusable: string | null } | null;
  /** Tag do título — `null` quando `.nds-alert-title` não casou. */
  tituloTag: string | null;
  descricaoTag: string | null;
  /** O que o leitor de tela percorre, na ordem do DOM. */
  ordemDeLeitura: string[];
  dismiss: { tag: string; rotulo: string | null; ehUltimoFilho: boolean; tabIndex: number } | null;
}

/**
 * Texto que o leitor de tela realmente percorre, na ordem do DOM.
 *
 * Filho com `aria-hidden="true"` sai da árvore de acessibilidade e não entra na
 * lista — é assim que se vê se o ícone está mudo e se o botão de fechar é
 * anunciado antes ou depois da mensagem.
 */
function ordemDeLeitura(alerta: HTMLElement): string[] {
  return Array.from(alerta.children)
    .filter((f) => f.getAttribute('aria-hidden') !== 'true')
    .map((f) => {
      const rotulo = f.getAttribute('aria-label');
      const texto = (f.textContent ?? '').trim().replace(/\s+/g, ' ');
      return rotulo ? `[${rotulo}]` : texto;
    })
    .filter((t) => t.length > 0);
}

export function medirSemantica(raiz: HTMLElement): SemanticaDoAlert[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.nds-alert')).map((alerta) => {
    const svg = alerta.querySelector<SVGElement>(':scope > svg');
    const fechar = alerta.querySelector<HTMLElement>('[data-slot="alert-dismiss"]');
    return {
      variante: varianteDe(alerta),
      tag: alerta.tagName.toLowerCase(),
      papel: alerta.getAttribute('role'),
      ariaLive: alerta.getAttribute('aria-live'),
      ariaAtomic: alerta.getAttribute('aria-atomic'),
      icone: svg
        ? {
            ariaHidden: svg.getAttribute('aria-hidden'),
            role: svg.getAttribute('role'),
            focusable: svg.getAttribute('focusable'),
          }
        : null,
      tituloTag: alerta.querySelector('.nds-alert-title')?.tagName.toLowerCase() ?? null,
      descricaoTag: alerta.querySelector('.nds-alert-description')?.tagName.toLowerCase() ?? null,
      ordemDeLeitura: ordemDeLeitura(alerta),
      dismiss: fechar
        ? {
            tag: fechar.tagName.toLowerCase(),
            rotulo: fechar.getAttribute('aria-label'),
            ehUltimoFilho: alerta.lastElementChild === fechar,
            tabIndex: fechar.tabIndex,
          }
        : null,
    };
  });
}
