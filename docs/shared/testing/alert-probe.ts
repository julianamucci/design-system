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
