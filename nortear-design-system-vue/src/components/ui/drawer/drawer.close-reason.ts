/**
 * Por qual caminho a gaveta fechou, no vocabulário do DESIGN SYSTEM — as mesmas
 * quatro palavras do `dialog_close` e do `popover_close`, para a família ser uma
 * dimensão só no GA4. É o `reason` do `drawer_close`
 * (`docs/shared/guidelines/18-overlay.md` §Analytics).
 *
 *   escape        tecla Escape
 *   overlay       saiu do painel sem decidir nada: clique no véu, ou o arraste
 *                 que dispensa o painel
 *   close-button  um controle de saída explícito — o `DrawerClose` do rodapé
 *   api           fechou por decisão de DENTRO: a ação que confirma, ou o código
 *
 * Até 2026-09-12 esta stack declarava o tipo dentro da `DrawerDocs.vue`, junto
 * com a anotação do gesto: a página deduzindo o que é do componente, que é o
 * contrato ao contrário, e uma dedução sem teste nenhum. Três portões leem isto
 * por eixos diferentes — `reason_entre_stacks_divergente`,
 * `reason_da_familia_divergente` e `motivo_sintetizado_na_docs_page` —, e é por
 * isso que o nome do tipo e as quatro palavras importam.
 *
 * Irmão do `drawer-close-reason.ts` do React, que tem o mesmo corte.
 */
export type DrawerCloseReason = 'escape' | 'overlay' | 'close-button' | 'api'

/**
 * O gesto OBSERVADO, com o nome que o primitivo lhe dá.
 *
 * A vaul-vue não publica motivo nenhum em `update:open` — ela avisa QUE o painel
 * fechou, nunca POR QUÊ. O gesto, porém, é observável: o conteúdo emite
 * `escape-key-down` e `pointer-down-outside`, e a raiz emite `drag`. Quem vê o
 * gesto ANOTA; quem emite a mudança de estado lê a anotação e a traduz com
 * `drawerCloseReason`.
 *
 * `confirm` não é gesto de saída: é a ação primária (ou o código) avisando que o
 * fechamento seguinte foi decisão de dentro. Nenhuma prévia da docs page fecha
 * assim hoje, e a palavra existe porque a família inteira a tem — sem ela,
 * "confirmou e fechou" sairia como "apertou o botão de sair".
 *
 * Não há gesto para o botão de sair: ele é o que SOBRA (ver `drawerCloseReason`).
 */
export type DrawerCloseGesture =
  | 'escape-key-down'
  | 'pointer-down-outside'
  | 'drag-dismiss'
  | 'confirm'

/**
 * Traduz o gesto observado para o vocabulário do design system.
 *
 * O default é `close-button`, e AQUI ele é o certo: o que sobra depois de
 * Escape, véu e arraste é o `DrawerClose` do rodapé, que a lib não anuncia por
 * evento próprio. Na família do Dialog o default é `api`, porque lá o controle
 * de fechar TEM anúncio (a delegação do clique no `data-slot`) e o que sobra é o
 * fechamento por código.
 *
 * Função pura e exportada de propósito: o evento `drawer_close` nasce na camada
 * de produto (docs page, app), nunca aqui dentro — primitivo de UI que importa
 * `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe.
 */
export function drawerCloseReason(gesture?: DrawerCloseGesture | null): DrawerCloseReason {
  switch (gesture) {
    case 'escape-key-down':
      return 'escape'
    // Clique no véu e arraste que dispensa o painel são o mesmo gesto do ponto
    // de vista de quem usa: "saí do painel sem decidir nada".
    case 'pointer-down-outside':
    case 'drag-dismiss':
      return 'overlay'
    case 'confirm':
      return 'api'
    default:
      return 'close-button'
  }
}

/** O que `createDrawerCloseWatch` devolve, pronto para `v-bind` no DrawerContent. */
export interface DrawerCloseWatch {
  onEscapeKeyDown: () => void
  onPointerDownOutside: () => void
}

/**
 * Os ouvintes do CONTEÚDO: a tecla de escape e o clique no véu.
 *
 * Nada aqui importa analytics: a função devolve ouvintes, e o que fazer com o
 * gesto é decisão de quem chama.
 */
export function createDrawerCloseWatch(
  note: (gesture: DrawerCloseGesture | null) => void,
): DrawerCloseWatch {
  return {
    onEscapeKeyDown: () => note('escape-key-down'),
    onPointerDownOutside: () => note('pointer-down-outside'),
  }
}

/** O que `createDrawerDragWatch` devolve, pronto para `v-bind` na raiz Drawer. */
export interface DrawerDragWatch {
  onDrag: () => void
  onRelease: (open: boolean) => void
}

/**
 * Os ouvintes da RAIZ: o arraste que dispensa o painel.
 *
 * O motivo é anotado no ARRASTE, e não na soltura, porque a lib fecha antes de
 * anunciar a soltura (`closeDrawer(); emit('release', false)`): anotado ali, o
 * `update:open` já teria passado.
 *
 * Arraste curto, que volta ao repouso, é anunciado com `open = true` e LIMPA a
 * anotação — sem isso, o próximo fechamento pelo botão de sair herdaria um
 * motivo que não é o dele e seria relatado como `overlay`.
 */
export function createDrawerDragWatch(
  note: (gesture: DrawerCloseGesture | null) => void,
): DrawerDragWatch {
  return {
    onDrag: () => note('drag-dismiss'),
    onRelease: (open: boolean) => {
      if (open) note(null)
    },
  }
}
