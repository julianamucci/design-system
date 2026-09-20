import type { PointerEvent } from "react"

/**
 * Caminho que fechou a gaveta, no vocabulário do design system.
 *
 * É o mesmo conjunto fechado que `AnalyticsEvents["drawer_close"]` cobra: quatro
 * palavras, iguais nas cinco stacks. Um quinto valor aqui partiria a mesma
 * dimensão do GA4 em duas leituras.
 */
export type DrawerCloseReason = "escape" | "overlay" | "close-button" | "api"

/**
 * O motivo do fechamento, guardado até o `onOpenChange` chegar.
 *
 * O primitivo desta stack avisa QUE o painel fechou (`onOpenChange` recebe um
 * booleano e nada mais), nunca POR QUÊ — e o payload de `drawer_close` promete
 * `reason`. Cada caminho que a lib anuncia por evento próprio deixa o motivo
 * anotado aqui antes de o fechamento acontecer; o que sobra é o botão de saída
 * do rodapé, que é o default.
 *
 * Uma variável para a página inteira basta: os painéis são modais, e nunca há
 * dois abertos ao mesmo tempo.
 *
 * Isto morava DENTRO da `DrawerDocs.tsx` até 2026-09-12, e mudou de casa pela
 * regra de `18-overlay.md` §Analytics: quem deduz o motivo fica ao lado do
 * primitivo, porque é o componente que sabe por onde o painel fechou — a página
 * só repassa a palavra. Enquanto morava lá, a dedução não tinha teste.
 */
let pendingCloseReason: DrawerCloseReason | null = null

/** Anota o motivo antes de o fechamento acontecer. */
export function markDrawerClose(reason: DrawerCloseReason): void {
  pendingCloseReason = reason
}

/** Esquece a anotação — a gaveta abriu, ou o arraste voltou ao repouso. */
export function resetDrawerCloseReason(): void {
  pendingCloseReason = null
}

/**
 * Consome a anotação.
 *
 * O default é `close-button`, e AQUI ele é o certo: o que sobra depois de
 * Escape, véu e arraste é o botão de saída do rodapé, que a lib não anuncia por
 * evento próprio. Na família do Dialog o default é `api`, porque lá o botão de
 * fechar TEM anúncio e o que sobra é o fechamento por código.
 */
export function takeDrawerCloseReason(): DrawerCloseReason {
  const reason = pendingCloseReason ?? "close-button"
  pendingCloseReason = null
  return reason
}

/**
 * Fechamento por CÓDIGO — o produtor de `api`, e o único que esta stack não
 * tinha.
 *
 * Sem ele, um painel recolhido pelo programa chegava ao GA4 indistinguível de
 * um clique no botão de saída do rodapé, porque motivo não anotado cai em
 * `close-button` (ver `takeDrawerCloseReason`). "Desistiu" e "o sistema
 * recolheu" viravam a mesma barra no relatório.
 *
 * A ordem importa e é o que esta função garante: a anotação entra ANTES de o
 * estado mudar, porque quem consome o motivo é o `onOpenChange`, que corre
 * síncrono dentro do fechamento.
 *
 * **Por que não há chamador nesta stack, e isso é medição.** O caminho
 * programático aqui passa pela prop `open` controlada, e a lib de gaveta usa
 * `useControllableState` (`vaul/dist/index.mjs:480,881`): mudança VINDA DE FORA
 * do valor controlado não chama `onOpenChange` — ele só anuncia pedido interno.
 * Ou seja, quem fecha por código nesta stack também é quem tem de contar o
 * fechamento, e é para esse consumidor que este produtor existe. Mesma situação
 * do `markProgrammatic` do svelte e do gesto `confirm` do vue, que também são
 * produtores sem chamador (`drawer.md` §7, inconsistência 21).
 */
export function closeDrawerByApi(close: () => void): void {
  markDrawerClose("api")
  close()
}

/** Ouvintes para o `DrawerContent`: tecla de escape e clique no véu. */
export const drawerCloseReasonWatch = {
  onEscapeKeyDown: () => markDrawerClose("escape"),
  onPointerDownOutside: () => markDrawerClose("overlay"),
}

/**
 * Ouvintes para a raiz: o arraste que dispensa o painel.
 *
 * Arrastar para fora fecha por `overlay` — para quem usa, é a mesma decisão de
 * "saí sem decidir nada" do clique no véu.
 *
 * O motivo é anotado no ARRASTE, e não na soltura, porque a lib fecha antes de
 * anunciar a soltura (`closeDrawer(); onRelease(event, false)`): anotado ali, o
 * `onOpenChange` já teria passado. Arraste curto, que volta ao repouso, é
 * anunciado com `open = true` e limpa a anotação — sem isso, o próximo
 * fechamento por botão herdaria um motivo que não é o dele.
 */
export const drawerDragWatch = {
  onDrag: () => markDrawerClose("overlay"),
  onRelease: (_event: PointerEvent<HTMLDivElement>, open: boolean) => {
    if (open) resetDrawerCloseReason()
  },
}
