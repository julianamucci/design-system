/**
 * Sonda de comparação do Alert entre as cinco stacks.
 *
 * Mesmo papel da sonda do Calendar: medir as cinco de uma vez, com o mesmo
 * colhedor, para a divergência aparecer como diferença de valor e não como
 * impressão de quem olha.
 *
 * O que interessa aqui é sobretudo CONTRASTE. O alert pinta um fundo colorido
 * suave e escreve por cima; a regra do projeto é que título e texto corrido
 * fiquem em `--foreground` e só o ÍCONE receba a cor semântica (D7 do PRD: o
 * título é 14px semibold, e o limite dele é 4.5:1). Isso é aritmética, não
 * olhômetro, então a sonda calcula a razão em vez de comparar nomes de token.
 */

export interface TextMeasurement {
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
export function contraste(frente: string, background: string): number {
  const a = luminancia(frente);
  const b = luminancia(background);
  const [light, escuro] = a > b ? [a, b] : [b, a];
  return Math.round(((light + 0.05) / (escuro + 0.05)) * 100) / 100;
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
export function darkLigarTheme(doc: Document): () => void {
  const targets = [doc.documentElement, ...doc.querySelectorAll<HTMLElement>('[class*="tema-"]')];
  const postos = targets.filter((el) => !el.classList.contains('dark'));
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
  const probe = doc.createElement('div');
  // O token é RESOLVIDO antes de pintar: `style.backgroundColor = 'hsl(var(…))'`
  // é descartado pelo CSSOM (não parseia como <color> na atribuição), e o
  // computado voltava transparente — caindo no branco em qualquer tema. Com o
  // valor já substituído a declaração é uma cor comum, e o navegador converte
  // para rgb sem que ninguém precise interpretar HSL aqui.
  const canais = getComputedStyle(perto).getPropertyValue('--background').trim();
  if (!canais) return 'rgb(255, 255, 255)';
  probe.style.backgroundColor = `hsl(${canais})`;
  probe.style.position = 'absolute';
  probe.style.pointerEvents = 'none';
  (perto.parentElement ?? doc.body).appendChild(probe);
  try {
    const cor = getComputedStyle(probe).backgroundColor;
    // `--background` ausente faz o navegador descartar a declaração; aí o
    // computado volta transparente e o branco é a última rede.
    return cor && cor !== 'rgba(0, 0, 0, 0)' ? cor : 'rgb(255, 255, 255)';
  } finally {
    probe.remove();
  }
}

/**
 * Fundo efetivo: sobe a árvore até achar quem realmente pinta.
 *
 * `--alert-bg` costuma ter alfa, e `backgroundColor` devolve a cor declarada,
 * não a composta. Sem compor com o ancestral opaco, o contraste medido é o de
 * uma cor que ninguém vê.
 */
export function backgroundEffective(el: HTMLElement): string {
  const doc = el.ownerDocument;
  let current: HTMLElement | null = el;
  const camadas: string[] = [];
  // A SUBIDA PARA ANTES DO `body`, e o motivo é o mesmo que já valia embaixo: a
  // pintura do documento fica VELHA quando o tema é trocado por classe. O
  // `body` declara `background-color: hsl(var(--background))`, mas o harness
  // põe a própria cor por cima com mais peso, e ela não acompanha o modo — no
  // escuro o documento continua claro.
  //
  // Enquanto as folhas pintavam realce OPACO isso nunca aparecia: a subida
  // parava na primeira camada e nunca chegava ao `body`. Quando `--accent`
  // voltou a ser a cor cheia e a força passou a ser escrita no componente
  // (`/ 0.2`), o fundo do toggle ativo virou translúcido, a subida passou a
  // alcançar o documento, e a composição saiu do accent escuro sobre página
  // CLARA: 1,16:1 num par que na tela mede 9:1. Não era o toggle, era o chão.
  while (current && current !== doc.body && current !== doc.documentElement) {
    const cor = getComputedStyle(current).backgroundColor;
    const [, , , alfa = 1] = (cor.match(/-?[\d.]+/g) ?? []).map(Number);
    if (cor !== 'rgba(0, 0, 0, 0)') camadas.unshift(cor);
    if (cor !== 'rgba(0, 0, 0, 0)' && alfa >= 1) break;
    current = current.parentElement;
  }
  // O chão é sempre a superfície do app, `--background`, resolvida por um
  // elemento-sonda montado no mesmo ponto da árvore para herdar o tema vigente.
  // Ele já era a resposta quando NADA pintava acima; agora é também a base
  // sobre a qual as camadas translúcidas se compõem.
  const chao = superficieDoApp(el);
  if (camadas.length === 0) return chao;
  // Composição de trás para frente (source-over).
  return camadas.reduce((base, camada) => {
    const [r, g, b, a = 1] = (camada.match(/-?[\d.]+/g) ?? []).map(Number);
    const [br, bg, bb] = rgb(base);
    const mist = (f: number, t: number) => Math.round(f * a + t * (1 - a));
    return `rgb(${mist(r, br)}, ${mist(g, bg)}, ${mist(b, bb)})`;
  }, chao);
}

function measureText(el: Element | null, background: string): TextMeasurement | null {
  if (!el) return null;
  const cor = getComputedStyle(el as HTMLElement).color;
  return { cor, contraste: contraste(cor, background) };
}

/** Nome da variante a partir da classe — "default" quando não há modificador. */
function variantOf(alerta: HTMLElement): string {
  const m = alerta.className.match(/nds-alert-(destructive|success|warning|info)\b/);
  return m ? m[1] : 'default';
}

// ─── Sonda: os três temas de marca, não só claro × escuro ────────────────────
//
// A primeira versão desta sonda media o tema VIGENTE em claro e escuro — e o
// vigente é sempre o `default`, porque é o que a toolbar entrega ao test-runner.
// Warm e Cold re-declaram `--destructive`, `--success`, `--warning` e `--info`
// com outros matizes, então cada um é um par de cores diferente sobre um fundo
// diferente. Seis combinações, não duas.
//
// A varredura por tema vem de `cor.ts` (`byTheme`) para não existir um segundo
// colhedor de tema neste repositório: é ele que sabe que `.dark.tema-x` exige as
// duas classes NO MESMO elemento.

import { THEMES, MODOS } from './cor';

/**
 * Roda `fn` uma vez por tema de marca e modo, trocando a classe NO
 * `documentElement`.
 *
 * O `byTheme` do `cor.ts` estampa a classe na raiz da story, e para medir a
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
export function documentByTheme<T>(
  doc: Document,
  fn: (theme: (typeof THEMES)[number], mode: (typeof MODOS)[number]) => T,
): T[] {
  const html = doc.documentElement;
  const original = html.className;
  const preservadas = Array.from(html.classList).filter(
    (c) => !c.startsWith('tema-') && c !== 'dark',
  );
  const saida: T[] = [];
  try {
    for (const theme of THEMES) {
      for (const mode of MODOS) {
        html.className = [...preservadas, `tema-${theme}`, ...(mode === 'escuro' ? ['dark'] : [])].join(' ');
        void html.offsetHeight;
        saida.push(fn(theme, mode));
      }
    }
  } finally {
    html.className = original;
    void html.offsetHeight;
  }
  return saida;
}

export interface VariantMeasurement {
  theme: string;
  mode: 'claro' | 'escuro';
  variant: string;
  background: string;
  /** `null` quando o elemento não existe — isso É o achado, não falha da sonda. */
  title: TextMeasurement | null;
  descricao: TextMeasurement | null;
  icone: TextMeasurement | null;
}

/**
 * Contraste de todos os alerts da tela nos TRÊS temas de marca e nos DOIS modos.
 *
 * Devolve a tabela inteira, não só as falhas: resultado negativo também é
 * resultado, e a linha que passa com folga é o que prova que a regra do
 * contêiner colorido está sendo cumprida.
 */
export function themeContrast(root: HTMLElement): VariantMeasurement[] {
  return documentByTheme(root.ownerDocument, (theme, mode) =>
    Array.from(root.querySelectorAll<HTMLElement>('.nds-alert')).map((alerta): VariantMeasurement => {
      const background = backgroundEffective(alerta);
      const icone = alerta.querySelector<HTMLElement>(':scope > svg:not(.nds-icon)')
        ?? alerta.querySelector<HTMLElement>(':scope > svg');
      return {
        theme,
        mode,
        variant: variantOf(alerta),
        background,
        title: measureText(alerta.querySelector('.nds-alert-title'), background),
        descricao: measureText(alerta.querySelector('.nds-alert-description'), background),
        icone: measureText(icone, background),
      };
    }),
  ).flat();
}

/** Só as linhas que reprovam o mínimo, já legíveis. */
export function themeReprovas(measurements: VariantMeasurement[], minimum = 4.5): string[] {
  const saida: string[] = [];
  for (const m of measurements) {
    const label = `${m.variant} · ${m.theme}/${m.mode}`;
    if (m.title && m.title.contraste < minimum) {
      saida.push(`${label} — título ${m.title.contraste}:1 (${m.title.cor} sobre ${m.background})`);
    }
    if (m.descricao && m.descricao.contraste < minimum) {
      saida.push(`${label} — texto ${m.descricao.contraste}:1 (${m.descricao.cor} sobre ${m.background})`);
    }
    if (!m.title) saida.push(`${label} — título AUSENTE (.nds-alert-title não casou)`);
    if (!m.descricao) saida.push(`${label} — texto AUSENTE (.nds-alert-description não casou)`);
  }
  return saida;
}

// ─── REMOVIDO em 2026-09-15: a sonda de "semântica de anúncio" ───────────────
//
// `measureSemantica` e `leituraOrder` devolviam papel, `aria-*`, tags de título
// e descrição e a ordem de leitura — e nenhuma story das cinco stacks as
// chamava. Quem cobre isso são as plays, que afirmam o comportamento em vez de
// colher uma tabela: `Playground` (papel pelo control), `WithoutAnnouncement`
// (contagem de papéis), `DynamicInsertion` (sem `aria-live` em volta),
// `Dismissible` (o X como último filho) e `WithoutTitle` (sem heading nenhum).
// Colhedor que ninguém chama envelhece sem reprovar nada.

// ─── Ação e botão de fechar juntos ─────────────────────────────────────────────

export interface ActionDismissLayout {
  /** As caixas da ação e do X se cruzam. */
  overlap: boolean;
  /** Folga horizontal entre a borda direita da ação e a esquerda do X (px). */
  gap: number;
  /** Título e descrição terminam antes de começar a ação. */
  textClearsAction: boolean;
}

/**
 * Mede o alerta que compõe `alert-action` E `alert-dismiss`.
 *
 * Até 2026-09-14 a folha declarava os dois mutuamente exclusivos só em
 * comentário. A primeira acomodação (calha somada, ação absoluta) passou nas
 * duas medidas de botão e reprovou nesta de texto: o botão "Salvar agora" tem
 * 108px, a calha dava 72px, e título e descrição corriam 36px por baixo dele —
 * defeito que já existia em TODO alerta com ação. Lê caixas, não classes, e por
 * isso pegou o que o desenho da regra escondia.
 */
export function measureActionDismiss(alert: HTMLElement): ActionDismissLayout {
  const action = alert.querySelector<HTMLElement>('[data-slot="alert-action"], .nds-alert-action');
  const dismiss = alert.querySelector<HTMLElement>('.nds-alert-dismiss');
  if (!action || !dismiss) throw new Error('SONDA::alert: o alerta precisa de ação e de botão de fechar');
  const a = action.getBoundingClientRect();
  const d = dismiss.getBoundingClientRect();
  const overlap = a.left < d.right && a.right > d.left && a.top < d.bottom && a.bottom > d.top;
  const texts = alert.querySelectorAll<HTMLElement>(
    '[data-slot="alert-title"], .nds-alert-title, [data-slot="alert-description"], .nds-alert-description',
  );
  const textRight = Math.max(...Array.from(texts, (el) => el.getBoundingClientRect().right));
  return {
    overlap,
    gap: d.left - a.right,
    textClearsAction: texts.length === 0 || textRight <= a.left + 0.5,
  };
}
