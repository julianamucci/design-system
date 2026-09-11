// Arquivo próprio, e não dentro de um arquivo de componente: exportar função de
// um `.tsx` de componente quebra o fast refresh
// (`react-refresh/only-export-components`).
//
// Neutro de propósito: servem o ContextMenu, o DropdownMenu e — pelo
// DropdownMenu, que ele compõe — o Menubar. Os três fecham no Tab e mandam o
// foco ao vizinho da âncora (C2 do `prd/dropdown-menu.md`); a âncora é o que
// muda: a área no menu de contexto, o gatilho nos outros dois.
import type { Ref, RefObject } from "react"

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=\"hidden\"])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable=\"false\"])",
  "[tabindex]",
].join(",")

/**
 * O que NUNCA é destino do Tab que fecha o menu: os painéis de menu (o raiz e o
 * do submenu, que estão fechando), as âncoras de foco que a base-ui pendura em
 * volta do portal e do gatilho (`data-base-ui-focus-guard`, `tabindex="0"`) e o
 * que estiver inerte ou oculto.
 */
const NOT_A_DESTINATION = "[role=\"menu\"], [data-base-ui-focus-guard], [inert], [hidden]"

/**
 * O próximo (ou o anterior) ponto de tabulação da PÁGINA, a partir da âncora.
 *
 * A âncora é o ponto de onde o menu foi aberto — a área do menu de contexto, o
 * gatilho do DropdownMenu e do Menubar —, e não o item em foco: o painel vive
 * em portal no fim do `<body>`, então "o próximo depois do item" seria uma
 * âncora de foco da lib — que devolve o foco ao painel — ou o fim do documento.
 * Quem aperta Tab num menu segue de onde estava ANTES de abri-lo (C2: "Tab
 * fecha e segue o percurso da página"). Sem próximo, devolve `null`, e quem
 * chama deixa a lib devolver o foco à âncora.
 *
 * Ficam de fora o próprio painel, as âncoras de foco e o que estiver oculto,
 * inerte ou fora do percurso (`tabindex` negativo — é assim que os outros
 * gatilhos de uma barra de menus, com tabulação itinerante, saem da conta e o
 * destino fica FORA da barra). `tabindex` positivo não é reordenado: a ordem é
 * a do documento.
 */
export function tabbableBeside(anchor: HTMLElement, direction: "next" | "prev"): HTMLElement | null {
  const candidates = Array.from(
    anchor.ownerDocument.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (el) =>
      el !== anchor &&
      el.tabIndex >= 0 &&
      !el.closest(NOT_A_DESTINATION) &&
      el.getClientRects().length > 0,
  )
  if (direction === "next") {
    return (
      candidates.find(
        (el) => anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
      ) ?? null
    )
  }
  // Para trás, um ANCESTRAL da âncora não conta: ele vem antes no documento,
  // mas o Shift+Tab nativo a partir da âncora não pousaria nele.
  const before = candidates.filter(
    (el) =>
      anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING &&
      !el.contains(anchor),
  )
  return before[before.length - 1] ?? null
}

/**
 * Entrega `value` a um `ref` de quem consome, seja função ou objeto.
 *
 * A área e o gatilho precisam do próprio nó (é a âncora do `tabbableBeside`)
 * sem tomar o `ref` de quem os usa; a lib só aceita um `ref` de fora, então os
 * dois são alimentados pelo mesmo callback.
 */
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value)
  } else if (ref) {
    ;(ref as RefObject<T | null>).current = value
  }
}
