// Andaime compartilhado pelas stories do InputOTP.
//
// Arquivo à parte porque num `*.stories.ts` TODO export nomeado vira uma story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// `wrap` estava copiada em quatro arquivos. Três delas reservavam a altura pela
// classe `nds-min-h-30`; a das composições cravava 180px em `style`, porque as
// composições montam rótulo, campo e mensagem numa coluna só e não cabem em
// 120px. Não existe utilitário nessa altura — a escala salta de 120px (30) para
// 200px (50) —, e trocar pela classe encolheria a moldura. A medida entra por
// parâmetro: sem argumento vale a classe, com argumento vale o que veio.

/**
 * A moldura da story: reserva o espaço do campo no canvas e mantém o conjunto
 * centrado, para a foto do Chromatic sair sempre do mesmo tamanho.
 *
 * `alturaMinima` é o caminho de exceção. Ela vai para `style` por falta de
 * utilitário nessa medida, e por isso entra por variável — nunca cravada aqui.
 */
export function wrap(child: HTMLElement, alturaMinima?: string): HTMLElement {
  const wrapper = document.createElement('div');
  // `contain` é mecânica de layout, não valor de design: segura o reflow dentro
  // da moldura sem sair do tema nem da escala.
  wrapper.style.contain = 'layout';
  wrapper.className = alturaMinima
    ? 'nds-cluster nds-w-full'
    : 'nds-cluster nds-w-full nds-min-h-30';
  wrapper.dataset.justify = 'center';
  if (alturaMinima) wrapper.style.minHeight = alturaMinima;
  wrapper.appendChild(child);
  return wrapper;
}
