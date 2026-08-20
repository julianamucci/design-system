/**
 * Andaime das demonstrações do AspectRatio — dois construtores, dois arquivos.
 *
 * Este módulo existe porque num `*.stories.ts` todo export nomeado vira story:
 * o andaime não pode ser exportado de lá, e a saída fácil é copiar a `function`
 * para cada arquivo. Cópia divergida não é variação — é o defeito, porque
 * corrigir uma delas deixa a outra errada sem nenhum sinal.
 *
 * O que variava entre as cópias:
 *   · `boxed` era idêntica nos dois arquivos — dívida mecânica, veio como está;
 *   · `buildImage` divergia por acidente: a cópia de variantes simplesmente não
 *     tinha o parâmetro `extraClass`. Ficou a versão de composições, que é o
 *     superconjunto — com `extraClass` omitido a saída é a mesma classe de
 *     antes, então nenhuma das duas mudou o que renderiza.
 */

/**
 * Embrulho que limita a largura da demonstração.
 *
 * A caixa cresce com o container, então sem um teto a proporção 21/9 ocuparia
 * a viewport inteira e a captura visual não caberia na página.
 */
export function boxed(el: HTMLElement, maxWidth = '36rem'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full';
  wrap.style.maxWidth = maxWidth;
  wrap.appendChild(el);
  return wrap;
}

/**
 * Imagem que preenche a caixa sem distorcer.
 *
 * `object-fit: cover` e altura cheia são mecânica do recorte, não medida
 * escolhida: é o que faz o filho cobrir a proporção em vez de esticar.
 * `extraClass` entra depois das classes base — as stories de composição a usam
 * para desligar o raio da imagem dentro de um card que já recorta.
 */
export function buildImage(src: string, alt: string, extraClass = ''): HTMLImageElement {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.className = `nds-w-full nds-rounded-md ${extraClass}`.trim();
  img.style.objectFit = 'cover';
  img.style.height = '100%';
  return img;
}
