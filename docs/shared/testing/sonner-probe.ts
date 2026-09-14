/**
 * Dois contratos visuais da notificação que só o NAVEGADOR mede — instrumento
 * das cinco stacks.
 *
 * Os dois nasceram de observações que pareciam ter de ficar "a medir no
 * navegador" para sempre, porque nenhum compilador, auditor ou axe os alcança:
 *
 *  1. o rótulo do botão de ação acompanha o tamanho de fonte que a pessoa
 *     escolheu no navegador. Nas três libs a folha delas crava
 *     `font-size: 12px` e `height: 24px`; em px o rótulo não cresce, e altura
 *     cravada corta o texto no dia em que ele crescer. No markup à mão o botão
 *     usa `var(--text-control)`, que é rem;
 *  2. a DESCRIÇÃO continua legível quando o DOCUMENTO está em modo escuro. As
 *     libs pintam a descrição pelo tema DELAS (`#3f3f3f` no claro, `#e8e8e8` no
 *     escuro), e o tema delas só concorda com a página se o wrapper o tirar da
 *     classe `dark` do documento. O navegador de teste é claro, e a story de
 *     tema escuro passava o tema à mão — por isso ninguém tinha visto.
 *
 *     **Só na notificação SEM `richColors`**, e quem chama tem de desligá-lo.
 *     Com `richColors` ligado a descrição herda a cor do texto da notificação,
 *     que vem da ponte de tokens e não depende do tema — a medição deixa de
 *     enxergar o tema. A primeira versão desta sonda foi chamada assim e passou
 *     com o tema plantado em `light`. Medido em 2026-09-14 no react, documento
 *     escuro: tema da lib em `light`, descrição `rgb(63, 63, 63)` sobre
 *     `rgb(36, 49, 56)`; tema do documento, `rgb(232, 232, 232)`.
 *
 * Nenhuma função aqui usa `waitFor` sobre condição que mexe no DOM: trocar a
 * fonte da raiz ou a classe do documento é feito UMA vez, e a espera é de
 * quadro. Ver a regra do `waitFor` que pendura, no CLAUDE.md.
 */

// @ts-expect-error -- resolvido pelo bundler de cada stack, não pelo tsconfig
// que inclui este arquivo compartilhado: daqui o caminho de node_modules é o de
// docs/shared, que não tem as libs de teste. Mesmo marcador do slider-probe.
import { expect } from 'storybook/test';
import { backgroundEffective, darkLigarTheme, ratio } from './cor';

function frames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    let left = count;
    const tick = () => {
      left -= 1;
      if (left <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/**
 * O rótulo da ação cresce quando a fonte da RAIZ dobra, e não é cortado.
 *
 * Dobrar a fonte da raiz é o que a preferência de tamanho de fonte do navegador
 * faz: tudo em rem acompanha, tudo em px fica parado. Por isso a asserção é de
 * CRESCIMENTO e não de valor — zoom escalaria px também, e passaria com o
 * defeito de pé.
 *
 * O estilo inline da raiz é devolvido como estava, mesmo se a asserção reprovar.
 */
export async function expectActionGrowsWithFont(button: HTMLElement): Promise<void> {
  const root = button.ownerDocument.documentElement;
  const previous = root.style.fontSize;
  const before = Number.parseFloat(getComputedStyle(button).fontSize);
  try {
    root.style.fontSize = '200%';
    await frames(3);
    const after = Number.parseFloat(getComputedStyle(button).fontSize);
    expect(
      after,
      `o rótulo da ação ficou em ${after}px com a fonte da raiz dobrada (antes ${before}px) — ` +
        'fonte em px não acompanha a preferência de tamanho do navegador (WCAG 1.4.4)',
    ).toBeGreaterThan(before * 1.5);
    expect(
      button.scrollHeight,
      `o rótulo transborda o botão (${button.scrollHeight}px de conteúdo em ${button.clientHeight}px) — ` +
        'altura cravada corta o texto quando a fonte cresce',
    ).toBeLessThanOrEqual(button.clientHeight + 1);
  } finally {
    root.style.fontSize = previous;
    await frames(2);
  }
}

/**
 * Roda `run` com o DOCUMENTO em modo escuro e devolve o tema como estava.
 *
 * Liga a classe pelo mesmo caminho das sondas de contraste da casa
 * (`darkLigarTheme`), que também a põe em quem carrega `tema-*`. A classe entra
 * ANTES de `run` disparar a notificação, para a medição não pegar a cor no meio
 * de uma transição.
 */
export async function withDarkDocument<T>(run: () => Promise<T>): Promise<T> {
  const undo = darkLigarTheme(document);
  try {
    await frames(3);
    return await run();
  } finally {
    undo();
    await frames(2);
  }
}

/**
 * A descrição tem contraste de texto corrido (4.5:1) sobre o fundo real da
 * notificação.
 */
export function expectDescriptionReadable(description: HTMLElement, toast: HTMLElement): void {
  const background = backgroundEffective(toast);
  expect(background, 'a notificação não tem fundo opaco para medir').not.toBeNull();
  const measured = ratio(getComputedStyle(description).color, background!);
  expect(measured, 'não foi possível ler a cor da descrição').not.toBeNull();
  expect(
    measured!.ratio,
    `descrição ${measured!.frente} sobre ${measured!.background} = ${measured!.ratio}:1 — o tema ` +
      'que pinta a descrição não é o do documento',
  ).toBeGreaterThanOrEqual(4.5);
}
