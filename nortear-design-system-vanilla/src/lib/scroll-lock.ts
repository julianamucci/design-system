/**
 * Trava de rolagem da página, contada.
 *
 * ─── Por que não é "guarda o valor e devolve" ────────────────────────────────
 *
 * A forma ingênua — cada painel guarda `document.body.style.overflow` ao abrir
 * e devolve ao fechar — parece certa e tem um defeito que só aparece com dois
 * painéis. Sheet e Drawer portalizam para o `body` e podem coexistir: se o
 * segundo abre com a rolagem já travada pelo primeiro, ele guarda `hidden` como
 * "valor anterior" e devolve `hidden` ao fechar. A partir daí `hidden` é o
 * estado que todo mundo restaura, e a página nunca mais rola — sem erro, sem
 * exceção, sem nada vermelho.
 *
 * Foi assim que apareceu: a suíte do Sheet reprovou porque a story anterior
 * deixara a trava de pé, e o valor "anterior" lido pela seguinte já era
 * `hidden`. O defeito não era do teste.
 *
 * O contador resolve pela raiz: o valor original é lido UMA vez, na primeira
 * trava, e devolvido UMA vez, quando a última solta. Quantos painéis passaram
 * pelo meio não importa.
 *
 * ─── Por que mora no `lib` e não em cada fábrica ─────────────────────────────
 *
 * Porque o estado é do DOCUMENTO, não do componente. Dois contadores em módulos
 * diferentes voltam a ter exatamente o problema acima, um nível acima. As outras
 * quatro stacks recebem isto da lib headless que usam; esta não tem lib, então o
 * lugar é aqui.
 */

let locks = 0;
let originalOverflow = '';

/** Trava a rolagem do `body`. Reentrante: conte uma solta para cada trava. */
export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (locks === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  locks += 1;
}

/**
 * Solta uma trava. A rolagem só volta quando a última sai.
 *
 * Chamar sem trava pendente é no-op — fechar duas vezes é caminho comum
 * (`close()` explícito e depois o `destroy()` do consumidor), e um contador
 * negativo faria a próxima trava nunca soltar.
 */
export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (locks === 0) return;
  locks -= 1;
  if (locks === 0) document.body.style.overflow = originalOverflow;
}

/**
 * Zera a trava e devolve a rolagem. Existe para o AMBIENTE DE TESTE, onde o
 * decorator do preview varre nós de painel do `body` sem passar pelo caminho de
 * fechamento da fábrica — o nó some, o contador não. Em produto ninguém tira o
 * painel por baixo do componente, e ninguém deve chamar isto.
 */
export function resetBodyScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (locks > 0) document.body.style.overflow = originalOverflow;
  locks = 0;
  originalOverflow = '';
}
