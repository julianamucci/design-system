import { describe, it, expect } from 'vitest';
import {
  DRAWER_SWIPE_CLOSE_THRESHOLD,
  DRAWER_SWIPE_VELOCITY_THRESHOLD,
  dampenDrawerSwipe,
  drawerDismissSign,
  drawerSwipeTranslate,
  isVerticalDrawerSwipe,
  resolveDrawerDragGuard,
  resolveDrawerRelease,
  type DrawerDragGuardFlags,
  type DrawerSwipeDirection,
} from '@shared/primitives/drawer-swipe';

/**
 * O motor do arraste do Drawer, na parte que EXISTE fora do navegador.
 *
 * Divisão deliberada: a decisão (dispensar ou voltar), a curva de resistência e
 * o sinal de cada direção são aritmética pura e cabem aqui; a instalação dos
 * ouvintes, a captura de ponteiro e o `transform` escrito a cada quadro só
 * existem em execução e são cobertos pelas stories de `drawer-states`.
 *
 * O que estes casos guardam é a EQUIVALÊNCIA com a lib de gaveta que as outras
 * três stacks usam: os limiares e a fórmula foram lidos na fonte publicada dela,
 * e é aqui que uma mudança neles reprova.
 */

const DIRECOES: DrawerSwipeDirection[] = ['bottom', 'top', 'left', 'right'];

describe('os limiares são os da lib', () => {
  /*
   * Os números aparecem CRUS aqui, e é de propósito.
   *
   * A primeira versão deste arquivo media a distância com
   * `tamanho * DRAWER_SWIPE_CLOSE_THRESHOLD` — a constante dos dois lados da
   * asserção. Trocar 0,25 por 0,5 na fonte passava verde: o teste media
   * coerência interna, não equivalência com a lib. Foi pego plantando o defeito,
   * e a lição é a de sempre: portão que deriva a expectativa do que ele guarda
   * não guarda nada.
   */
  it('velocidade a 0,4 px/ms e distância a 25% do painel', () => {
    expect(DRAWER_SWIPE_VELOCITY_THRESHOLD).toBe(0.4);
    expect(DRAWER_SWIPE_CLOSE_THRESHOLD).toBe(0.25);
  });
});

describe('eixo e sentido', () => {
  it('vertical é só bottom e top', () => {
    expect(DIRECOES.filter(isVerticalDrawerSwipe)).toEqual(['bottom', 'top']);
  });

  it('o sinal aponta para fora da tela em cada direção', () => {
    // Painel de baixo sai descendo (+Y); o de cima, subindo (−Y). O da direita
    // sai para +X; o da esquerda, para −X.
    expect(drawerDismissSign('bottom')).toBe(1);
    expect(drawerDismissSign('top')).toBe(-1);
    expect(drawerDismissSign('right')).toBe(1);
    expect(drawerDismissSign('left')).toBe(-1);
  });
});

describe('translação', () => {
  it('no sentido de dispensar, segue o ponteiro 1:1', () => {
    expect(drawerSwipeTranslate(120, 'bottom')).toBe(120);
    expect(drawerSwipeTranslate(120, 'top')).toBe(-120);
    expect(drawerSwipeTranslate(120, 'right')).toBe(120);
    expect(drawerSwipeTranslate(120, 'left')).toBe(-120);
  });

  it('no sentido de abrir mais, resiste — e os primeiros pixels não andam nada', () => {
    // A curva da lib só cruza o zero perto de e² − 1 ≈ 6,39 px; antes disso o
    // resultado é travado em zero, e é por isso que o painel parece firme.
    expect(drawerSwipeTranslate(-3, 'bottom')).toBe(0);
    expect(drawerSwipeTranslate(-6, 'bottom')).toBe(0);
    const puxao = drawerSwipeTranslate(-200, 'bottom');
    expect(puxao).toBeLessThan(0);
    // Duzentos pixels de dedo viram menos de trinta de painel.
    expect(Math.abs(puxao)).toBeLessThan(30);
  });

  it('a resistência é a mesma curva da lib', () => {
    expect(dampenDrawerSwipe(0)).toBeCloseTo(-16, 10);
    expect(dampenDrawerSwipe(Math.E ** 2 - 1)).toBeCloseTo(0, 10);
  });

  it('com menos movimento pedido, a elasticidade some e o resto fica', () => {
    // Puxar além do aberto é movimento sem intenção correspondente: some.
    expect(drawerSwipeTranslate(-200, 'bottom', true)).toBe(0);
    // Seguir o dedo no sentido de dispensar É a intenção: continua.
    expect(drawerSwipeTranslate(120, 'bottom', true)).toBe(120);
  });
});

describe('decisão ao soltar', () => {
  const tamanho = 400;

  it('movimento no sentido de abrir volta ao repouso, por mais rápido que seja', () => {
    expect(resolveDrawerRelease({ travel: -300, elapsed: 10, size: tamanho })).toBe('reset');
    expect(resolveDrawerRelease({ travel: 0, elapsed: 10, size: tamanho })).toBe('reset');
  });

  it('velocidade acima do limiar dispensa mesmo com pouca distância', () => {
    // 30px em 50ms = 0,6 px/ms, acima dos 0,4 da lib; e 30px é 7,5% de 400,
    // longe do limiar de distância. Só a velocidade pode ter decidido.
    expect(resolveDrawerRelease({ travel: 30, elapsed: 50, size: tamanho })).toBe('dismiss');
    // 30px em 100ms = 0,3 px/ms, logo abaixo: a mesma distância não dispensa.
    expect(resolveDrawerRelease({ travel: 30, elapsed: 100, size: tamanho })).toBe('reset');
  });

  it('devagar e perto, volta ao repouso', () => {
    expect(resolveDrawerRelease({ travel: 30, elapsed: 2000, size: tamanho })).toBe('reset');
  });

  it('distância acima do limiar dispensa mesmo devagar', () => {
    // 100px de 400 é exatamente o quarto que a lib usa; 99 não é.
    expect(resolveDrawerRelease({ travel: 100, elapsed: 5000, size: tamanho })).toBe('dismiss');
    expect(resolveDrawerRelease({ travel: 99, elapsed: 5000, size: tamanho })).toBe('reset');
  });

  it('gesto de duração zero não vira velocidade infinita', () => {
    // Um toque de um quadro só: dividir por zero daria Infinity, que passaria
    // pelo limiar e fecharia o painel sem que ninguém tenha arrastado.
    expect(resolveDrawerRelease({ travel: 5, elapsed: 0, size: tamanho })).toBe('reset');
  });

  it('painel sem tamanho medido não fecha por distância', () => {
    expect(resolveDrawerRelease({ travel: 5, elapsed: 5000, size: 0 })).toBe('reset');
  });
});

describe('guarda de rolagem', () => {
  const base: DrawerDragGuardFlags = {
    optedOut: false,
    sideways: false,
    hasSelection: false,
    openingWards: false,
    scrollOwnsIt: false,
  };

  it('sem nenhum impedimento, o movimento vira arraste', () => {
    expect(resolveDrawerDragGuard(base)).toBe(true);
  });

  it('quem se declara fora do arraste vence tudo, inclusive o painel lateral', () => {
    // A ordem importa: `optedOut` é consultado ANTES do atalho lateral, senão um
    // <select> dentro de um painel da direita nunca abriria a lista de opções.
    expect(resolveDrawerDragGuard({ ...base, optedOut: true })).toBe(false);
    expect(resolveDrawerDragGuard({ ...base, optedOut: true, sideways: true })).toBe(false);
  });

  it('painel lateral não arbitra nada: o eixo do arraste não é o da rolagem', () => {
    // Também é ordem: o atalho lateral vem antes de seleção, sentido e rolagem,
    // e é isso que faz o arraste horizontal existir sobre conteúdo já rolado.
    expect(
      resolveDrawerDragGuard({
        ...base,
        sideways: true,
        hasSelection: true,
        openingWards: true,
        scrollOwnsIt: true,
      }),
    ).toBe(true);
  });

  it('texto já selecionado é gesto de seleção, não de arraste', () => {
    expect(resolveDrawerDragGuard({ ...base, hasSelection: true })).toBe(false);
  });

  it('movimento no sentido de abrir cede a vez para a rolagem', () => {
    expect(resolveDrawerDragGuard({ ...base, openingWards: true })).toBe(false);
  });

  it('região rolável fora do topo fica com o movimento', () => {
    expect(resolveDrawerDragGuard({ ...base, scrollOwnsIt: true })).toBe(false);
  });
});
