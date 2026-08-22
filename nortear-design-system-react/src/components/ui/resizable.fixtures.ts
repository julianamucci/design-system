// Fixture compartilhada pelas stories do Resizable.
//
// Fica fora dos `*.stories.tsx` porque no CSF todo export nomeado é lido como
// story: um helper exportado de um arquivo de story vira story fantasma no
// indexador, sem nada para renderizar.

/**
 * Fração do eixo principal que o PRIMEIRO painel ocupa na tela.
 *
 * Nunca `style.width`: o painel vive de `flex-grow` sobre `flex-basis: 0`, e a
 * medida inline não decide nada. Só a geometria diz onde o divisor parou.
 *
 * `horizontal` tem padrão porque a divergência entre as duas cópias tinha
 * motivo: `resizable-estados.stories.tsx` só media largura, e podia — todas as
 * stories dele são horizontais. Só o Playground, que expõe `direction` como
 * controle, precisa medir altura quando o grupo vira vertical. O padrão é o
 * eixo que a maioria das stories usa; quem varia de eixo passa o argumento.
 */
export function firstFraction(canvasElement: HTMLElement, horizontal = true): number {
  const panels = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')];
  const measurements = panels.map((p) =>
    horizontal ? p.getBoundingClientRect().width : p.getBoundingClientRect().height,
  );
  return measurements[0] / measurements.reduce((a, b) => a + b, 0);
}
