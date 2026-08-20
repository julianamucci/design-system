// Fixture compartilhada pelas quatro stories do Popover.
//
// `painel()` estava copiado nos quatro arquivos, idêntico nos quatro. Idêntico
// HOJE: o dia em que o seletor do painel mudar, quatro cópias significam três
// stories mentindo — a busca que não encontra nada devolve `null`, e `null` é
// exatamente o que as asserções de "fechado" esperam ver. Um construtor só.
//
// Módulo à parte porque num `*.stories.ts` TODO export nomeado vira story: um
// helper exportado apareceria na sidebar como se fosse um exemplo.

/**
 * O painel aberto, ou `null`.
 *
 * Consulta o DOCUMENTO, nunca o `canvasElement`: o conteúdo é portalizado para
 * o `<body>` e uma busca presa ao canvas nunca acharia nada — passando por
 * engano em toda asserção de "está fechado".
 *
 * Procura pelo contrato de markup (`data-slot`) e não por texto, que segue o
 * idioma escolhido na toolbar.
 */
export function painel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="popover-content"]');
}
