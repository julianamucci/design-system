// A conta de posicionamento de painel flutuante, presa sem navegador.
//
// Por que unitário e não story: o projeto `unit` do vitest desta stack roda em
// `environment: 'node'` e não há jsdom no `package.json`, e a suíte de navegador
// não abre submenu por conta própria — foi assim que o painel saindo da tela
// perto da borda direita viveu tanto tempo sem nada reprovar. A geometria é
// pura de propósito para caber aqui.
//
// Os dois envoltórios de DOM (`positionFloating`, `positionFloatingAtPoint`)
// também são exercitados, com âncora e painel FALSOS: eles só tocam
// `getBoundingClientRect`, `offsetWidth`/`offsetHeight`, `style` e `dataset`, e
// é isso que prova o anúncio do lado final no `data-side` — o defeito que
// compila, renderiza e nenhum outro portão desta casa reprovaria.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  computeFloatingPosition,
  computePointPosition,
  positionFloating,
  positionFloatingAtPoint,
  type FloatingAnchorRect,
  type FloatingViewport,
} from '@/lib/floating';

/** O respiro que a conta mantém entre o painel e a borda da janela. */
const RESPIRO = 8;

/** Janela de 1000×800, sem rolagem, salvo quando o caso pedir outra. */
const viewport = (over: Partial<FloatingViewport> = {}): FloatingViewport => ({
  scrollX: 0,
  scrollY: 0,
  width: 1000,
  height: 800,
  ...over,
});

/** Retângulo de âncora a partir do canto e do tamanho. */
const rect = (left: number, top: number, width: number, height: number): FloatingAnchorRect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

describe('computeFloatingPosition — sem flip, o contrato de antes', () => {
  it('mantém o lado pedido mesmo sem espaço, e não trava o eixo principal', () => {
    // Item colado na borda direita: o painel de 200px não cabe à direita.
    const { left, side } = computeFloatingPosition({
      anchor: rect(940, 300, 50, 30),
      panelWidth: 200,
      panelHeight: 120,
      side: 'right',
      align: 'start',
      offset: 4,
      viewport: viewport(),
    });

    // 940 + 50 + 4 = 994. Excede, e é ASSIM que tem de ser sem `flip`: encaixar
    // o eixo principal empurraria o painel por cima do gatilho.
    expect(side).toBe('right');
    expect(left).toBe(994);
  });

  it('trava o eixo CRUZADO na área visível', () => {
    // O caso medido em 2026-09-06: painel de 288px centrado num gatilho a x=53
    // ia parar em x=-91.
    const { left } = computeFloatingPosition({
      anchor: rect(53, 100, 40, 30),
      panelWidth: 288,
      panelHeight: 100,
      side: 'bottom',
      align: 'center',
      offset: 8,
      viewport: viewport(),
    });

    expect(left).toBe(RESPIRO);
  });

  it('soma a rolagem do documento nas duas coordenadas', () => {
    const { top, left } = computeFloatingPosition({
      anchor: rect(100, 200, 40, 30),
      panelWidth: 100,
      panelHeight: 60,
      side: 'bottom',
      align: 'start',
      offset: 8,
      viewport: viewport({ scrollX: 30, scrollY: 500 }),
    });

    expect(left).toBe(130);
    expect(top).toBe(200 + 500 + 30 + 8);
  });
});

describe('computeFloatingPosition — flip', () => {
  /** O caso do submenu: item perto da borda direita, painel de 200px. */
  const submenuNaBorda = (anchorLeft: number) =>
    computeFloatingPosition({
      anchor: rect(anchorLeft, 300, 50, 30),
      panelWidth: 200,
      panelHeight: 120,
      side: 'right',
      align: 'start',
      offset: 4,
      viewport: viewport(),
      flip: true,
    });

  it('vira para a esquerda quando a direita não cabe e a esquerda cabe', () => {
    const { left, side } = submenuNaBorda(940);

    expect(side).toBe('left');
    // 940 - 200 - 4 = 736, e cabe inteiro na janela.
    expect(left).toBe(736);
    expect(left).toBeGreaterThanOrEqual(RESPIRO);
    expect(left + 200).toBeLessThanOrEqual(1000 - RESPIRO);
  });

  it('NÃO vira quando o lado pedido já cabe', () => {
    const { left, side } = submenuNaBorda(100);

    expect(side).toBe('right');
    expect(left).toBe(154);
  });

  it('NÃO vira quando o oposto cabe IGUALMENTE mal — empate mantém o pedido', () => {
    // Painel de 900px numa janela de 1000: nenhum dos dois lados cabe. Trocar
    // aqui só perderia previsibilidade.
    const { side } = computeFloatingPosition({
      anchor: rect(475, 300, 50, 30),
      panelWidth: 900,
      panelHeight: 120,
      side: 'right',
      align: 'start',
      offset: 4,
      viewport: viewport(),
      flip: true,
    });

    expect(side).toBe('right');
  });

  it('vira quando o oposto cabe MELHOR, ainda que também não caiba', () => {
    // Âncora deslocada para a direita: sobram 100px à direita e 700 à esquerda,
    // e o painel quer 800. Os dois estouram; o menor déficit é o da esquerda.
    const { side } = computeFloatingPosition({
      anchor: rect(710, 300, 180, 30),
      panelWidth: 800,
      panelHeight: 120,
      side: 'right',
      align: 'start',
      offset: 4,
      viewport: viewport(),
      flip: true,
    });

    expect(side).toBe('left');
  });

  it('vira no eixo vertical também, e trava o cruzado do lado NOVO', () => {
    // Gatilho perto do rodapé: `bottom` não cabe, `top` cabe. Depois da troca o
    // eixo cruzado continua sendo o horizontal, e o painel largo tem de ser
    // encaixado nele.
    const { top, left, side } = computeFloatingPosition({
      anchor: rect(20, 740, 40, 30),
      panelWidth: 400,
      panelHeight: 300,
      side: 'bottom',
      align: 'center',
      offset: 8,
      viewport: viewport(),
      flip: true,
    });

    expect(side).toBe('top');
    // 740 - 300 - 8 = 432.
    expect(top).toBe(432);
    // Centrado daria 20 + 20 - 200 = -160; o travamento do cruzado o traz.
    expect(left).toBe(RESPIRO);
  });

  it('leva a rolagem em conta ao decidir — o déficit é de JANELA, não de documento', () => {
    // Mesmo gatilho do primeiro caso, com a página rolada: a decisão não pode
    // mudar, porque `getBoundingClientRect` já devolve coordenadas de janela.
    const { side, left } = computeFloatingPosition({
      anchor: rect(940, 300, 50, 30),
      panelWidth: 200,
      panelHeight: 120,
      side: 'right',
      align: 'start',
      offset: 4,
      viewport: viewport({ scrollX: 250, scrollY: 600 }),
      flip: true,
    });

    expect(side).toBe('left');
    expect(left).toBe(736 + 250);
  });
});

describe('computePointPosition — o menu de contexto desliza, não vira', () => {
  it('deixa o canto no ponto quando o painel cabe', () => {
    const { top, left } = computePointPosition({
      x: 120,
      y: 200,
      panelWidth: 220,
      panelHeight: 160,
      viewport: viewport(),
    });

    expect(left).toBe(120);
    expect(top).toBe(200);
  });

  it('desliza nos DOIS eixos no clique perto do canto inferior direito', () => {
    const { top, left } = computePointPosition({
      x: 980,
      y: 790,
      panelWidth: 220,
      panelHeight: 160,
      viewport: viewport(),
    });

    // 1000 - 220 - 8 = 772 · 800 - 160 - 8 = 632.
    expect(left).toBe(772);
    expect(top).toBe(632);
    expect(left + 220).toBeLessThanOrEqual(1000 - RESPIRO);
    expect(top + 160).toBeLessThanOrEqual(800 - RESPIRO);
  });

  it('encosta na margem de INÍCIO quando o painel é maior que a janela', () => {
    const { top, left } = computePointPosition({
      x: 500,
      y: 400,
      panelWidth: 1200,
      panelHeight: 900,
      viewport: viewport(),
    });

    expect(left).toBe(RESPIRO);
    expect(top).toBe(RESPIRO);
  });

  it('soma a rolagem, porque o ponto vem em coordenada de janela', () => {
    const { top, left } = computePointPosition({
      x: 100,
      y: 150,
      panelWidth: 200,
      panelHeight: 100,
      viewport: viewport({ scrollX: 40, scrollY: 900 }),
    });

    expect(left).toBe(140);
    expect(top).toBe(1050);
  });
});

// ─── Os envoltórios de DOM, com elementos falsos ─────────────────────────────

type FakePanel = HTMLElement & {
  style: Record<string, string>;
  dataset: Record<string, string>;
};

function fakePanel(width: number, height: number): FakePanel {
  return {
    style: {} as Record<string, string>,
    dataset: {} as Record<string, string>,
    offsetWidth: width,
    offsetHeight: height,
  } as unknown as FakePanel;
}

function fakeAnchor(anchor: FloatingAnchorRect): HTMLElement {
  return { getBoundingClientRect: () => anchor } as unknown as HTMLElement;
}

function stubJanela(over: Partial<FloatingViewport> = {}): void {
  const vp = viewport(over);
  vi.stubGlobal('window', { scrollX: vp.scrollX, scrollY: vp.scrollY });
  vi.stubGlobal('document', {
    documentElement: { clientWidth: vp.width, clientHeight: vp.height },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('positionFloating — escrita no painel', () => {
  it('escreve top/left em px e devolve o lado', () => {
    stubJanela();
    const panel = fakePanel(200, 120);

    const side = positionFloating(fakeAnchor(rect(100, 300, 50, 30)), panel, 'right', 'start', 4);

    expect(side).toBe('right');
    expect(panel.style.left).toBe('154px');
    expect(panel.style.top).toBe('300px');
    expect(panel.style.position).toBe('absolute');
    // A visibilidade volta ao normal depois da medida — o painel fica escondido
    // só durante ela, para não piscar na posição antiga.
    expect(panel.style.visibility).toBe('');
  });

  it('sem flip, NÃO toca em data-side — quem o escreve é o chamador', () => {
    stubJanela();
    const panel = fakePanel(200, 120);
    panel.dataset.side = 'right';

    positionFloating(fakeAnchor(rect(940, 300, 50, 30)), panel, 'right', 'start', 4);

    expect(panel.dataset.side).toBe('right');
    expect(panel.style.left).toBe('994px');
  });

  it('com flip, ANUNCIA o lado final em data-side', () => {
    stubJanela();
    const panel = fakePanel(200, 120);
    // O menubar crava `right` na construção do painel do submenu, antes de
    // existir medida. Depois da troca esse valor estaria mentindo, e é a folha
    // que o lê para desenhar a seta e o `transform-origin`.
    panel.dataset.side = 'right';

    const side = positionFloating(
      fakeAnchor(rect(940, 300, 50, 30)),
      panel,
      'right',
      'start',
      4,
      { flip: true },
    );

    expect(side).toBe('left');
    expect(panel.dataset.side).toBe('left');
    expect(panel.style.left).toBe('736px');
  });

  it('com flip e espaço de sobra, o anúncio confirma o lado pedido', () => {
    stubJanela();
    const panel = fakePanel(200, 120);

    const side = positionFloating(
      fakeAnchor(rect(100, 300, 50, 30)),
      panel,
      'right',
      'start',
      4,
      { flip: true },
    );

    expect(side).toBe('right');
    expect(panel.dataset.side).toBe('right');
  });
});

describe('positionFloatingAtPoint — escrita no painel', () => {
  it('encaixa o clique do canto inferior direito e não anuncia lado nenhum', () => {
    stubJanela();
    const panel = fakePanel(220, 160);

    positionFloatingAtPoint(980, 790, panel);

    expect(panel.style.left).toBe('772px');
    expect(panel.style.top).toBe('632px');
    expect(panel.style.position).toBe('absolute');
    // Um ponto não tem lado: não há `data-side` a escrever.
    expect(panel.dataset.side).toBeUndefined();
  });

  it('preserva o ponto quando o painel cabe', () => {
    stubJanela();
    const panel = fakePanel(220, 160);

    positionFloatingAtPoint(120, 200, panel);

    expect(panel.style.left).toBe('120px');
    expect(panel.style.top).toBe('200px');
  });
});
