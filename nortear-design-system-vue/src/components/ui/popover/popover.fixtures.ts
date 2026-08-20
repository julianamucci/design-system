// Consulta ao painel compartilhada pelas quatro stories do Popover.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado vira story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// Eram QUATRO cópias idênticas — ainda idênticas por sorte, não por método. O
// dia em que o painel deixasse de ser `[data-slot="popover-content"]` seriam
// quatro edições, e a que ficasse para trás quebraria uma suíte inteira por um
// motivo que não tem nada a ver com a story.
//
// A busca é pelo CONTRATO de markup (`data-slot`), nunca por texto: o rótulo
// visível segue o idioma da toolbar, e uma play presa a "Editar perfil"
// quebraria em inglês e espanhol sem nada de errado no componente.

/** O painel vive no `<body>`, fora do `canvasElement` — o portal é o ponto. */
export function painel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="popover-content"]');
}
