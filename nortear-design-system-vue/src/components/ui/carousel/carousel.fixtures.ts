// Medição de posição compartilhada pelas stories do Carousel.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado vira story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// Existiam DUAS cópias desta função, e elas já tinham divergido: a do arquivo
// principal recebia o eixo, a das composições media só a largura. Enquanto o
// mesmo nome cobria as duas, corrigir a medição num arquivo deixava o outro
// para trás — e o defeito só aparece no eixo vertical, que é exatamente o que a
// cópia sem parâmetro não sabia medir.

/**
 * Índice do slide que ocupa a maior parte do viewport.
 *
 * O embla NÃO rola o viewport: ele aplica `transform` no trilho, e o
 * `scrollLeft` fica em zero do começo ao fim — então a prova de movimento é
 * geométrica. Mas medir PIXEL não fecha, e errou de duas formas antes de virar
 * isto: "andou em relação à medida de agora" resolve no primeiro quadro da
 * transição, com o trilho ainda correndo, e a medida seguinte parte de um
 * número em movimento (-342 contra -17). E um alvo absoluto em passos de slide
 * também não serve: o slide é mais largo que o viewport (a margem negativa do
 * trilho mais o respiro entre slides), então o embla não desloca um "passo"
 * inteiro por snap — esperar dois passos de `offsetLeft` errava por 174px.
 *
 * Qual slide está à vista não depende de nenhuma dessas suposições — nem do
 * alinhamento do embla, nem do respiro entre slides, nem da cauda da animação.
 * E é literalmente o que a story afirma.
 *
 * @param eixo Em qual direção o trilho anda. O padrão é `'x'`, que cobre as
 * stories cujo carrossel é sempre horizontal; quem oferece a orientação como
 * control lê o eixo do DOM renderizado (`data-orientation` do trilho) e passa
 * aqui, porque é o trilho que decide para onde o carrossel anda — não o arg.
 */
export function slideEmFoco(canvasElement: HTMLElement, eixo: 'x' | 'y' = 'x'): number {
  const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
  const slides = Array.from(
    canvasElement.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'),
  );
  const v = viewport.getBoundingClientRect();
  let melhor = 0;
  let maior = -Infinity;
  slides.forEach((slide, i) => {
    const r = slide.getBoundingClientRect();
    const visivel = eixo === 'y'
      ? Math.min(r.bottom, v.bottom) - Math.max(r.top, v.top)
      : Math.min(r.right, v.right) - Math.max(r.left, v.left);
    if (visivel > maior) { maior = visivel; melhor = i; }
  });
  return melhor;
}
