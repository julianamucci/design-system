import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

/**
 * Número em porcentagem, e não em pixel.
 *
 * A lib de painéis interpreta `defaultSize={30}` como **30 pixels**; só uma
 * STRING sem unidade (`"30"`) é lida como 30% do grupo (ver `PanelProps` em
 * `node_modules/react-resizable-panels/dist/react-resizable-panels.d.ts`). O
 * design system documenta as três medidas como porcentagem do grupo nas cinco
 * stacks, e as stories passavam números — o painel de `defaultSize={30}` nascia
 * com 30px de largura, encostado no `maxSize={60}` (60px), e o layout aparecia
 * 13%/87% em vez de 30%/70%. Nenhuma asserção olhava a geometria, então a suíte
 * ficou verde o tempo todo.
 *
 * A conversão fica aqui, e não nas stories, porque quem consome o design system
 * escreve o número documentado.
 */
function emPorcentagem(v: number | string | undefined): string | undefined {
  if (v === undefined) return undefined
  return typeof v === "number" ? String(v) : v
}

/**
 * O mapa de layout da lib vira a lista de porcentagens que o design system
 * documenta. As chaves são ids gerados (`:r1:`), nunca inteiros, então a ordem
 * de inserção do objeto — que é a ordem dos painéis no grupo — é preservada.
 */
function comoLista(layout: ResizablePrimitive.Layout): number[] {
  return Object.values(layout).map((v) => Math.round(v * 10) / 10)
}

type GrupoProps = Omit<ResizablePrimitive.GroupProps, "orientation"> & {
  direction?: "horizontal" | "vertical"
  orientation?: "horizontal" | "vertical"
  /** Tamanhos finais, em porcentagem, ao fim de cada gesto. */
  onLayout?: (sizes: number[]) => void
  /**
   * Persiste o layout no `localStorage` sob esta chave. Vazio desliga — gravar
   * sem o consumidor pedir deixaria a próxima visita com o tamanho de uma
   * sessão anterior sem que ninguém tivesse escolhido isso.
   */
  autoSaveId?: string
}

/**
 * Persistência: o grupo com chave é OUTRO componente.
 *
 * `useDefaultLayout` é um hook, e hook não se chama condicionalmente. A versão
 * anterior declarava `autoSaveId` no tipo e o repassava adiante como atributo:
 * a lib não conhece mais essa prop (a persistência migrou para o hook), então
 * ela caía no `<div>`, o React reclamava no console e nada era gravado. Uma
 * story inteira — PersistedLayout — demonstrava um recurso que não existia.
 */
function GrupoPersistido({
  autoSaveId,
  onLayout,
  ...props
}: GrupoProps & { autoSaveId: string }) {
  const { defaultLayout, onLayoutChanged } = ResizablePrimitive.useDefaultLayout({
    id: autoSaveId,
    storage: typeof window === "undefined" ? undefined : window.localStorage,
    // Só o que a pessoa fez. Redimensionar a janela não é escolha de layout.
    onlySaveAfterUserInteractions: true,
  })

  return (
    <ResizablePrimitive.Group
      defaultLayout={defaultLayout}
      onLayoutChanged={(layout, meta) => {
        onLayoutChanged(layout, meta)
        onLayout?.(comoLista(layout))
      }}
      {...props}
    />
  )
}

function ResizablePanelGroup({
  className,
  direction,
  orientation,
  onLayout,
  autoSaveId,
  ...props
}: GrupoProps) {
  const comuns = {
    "data-slot": "resizable-panel-group",
    orientation: orientation ?? direction,
    className: cn("nds-resizable", className),
    ...props,
  }

  if (autoSaveId) {
    return <GrupoPersistido autoSaveId={autoSaveId} onLayout={onLayout} {...comuns} />
  }

  return (
    <ResizablePrimitive.Group
      // `onLayoutChanged`, e não `onLayoutChange`: dispara uma vez por gesto
      // concluído, e não a cada pixel do arrasto.
      onLayoutChanged={onLayout ? (layout) => onLayout(comoLista(layout)) : undefined}
      {...comuns}
    />
  )
}

function ResizablePanel({
  tabIndex = 0,
  className,
  defaultSize,
  minSize,
  maxSize,
  collapsedSize,
  ...props
}: ResizablePrimitive.PanelProps & { tabIndex?: number }) {
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      // O painel rola; região rolável precisa estar na ordem de tabulação
      // (WCAG 2.1.1). A classe é que traz o `overflow: auto` do contrato.
      tabIndex={tabIndex}
      className={cn("nds-resizable-panel", className)}
      defaultSize={emPorcentagem(defaultSize)}
      minSize={emPorcentagem(minSize)}
      maxSize={emPorcentagem(maxSize)}
      collapsedSize={emPorcentagem(collapsedSize)}
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn("nds-resizable-handle", className)}
      {...props}
    >
      {withHandle && (
        <div className="nds-resizable-grip-bar" />
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
