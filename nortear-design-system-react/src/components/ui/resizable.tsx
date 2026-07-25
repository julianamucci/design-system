import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  direction,
  orientation,
  ...props
}: Omit<ResizablePrimitive.GroupProps, "orientation"> & {
  direction?: "horizontal" | "vertical"
  orientation?: "horizontal" | "vertical"
  autoSaveId?: string
}) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      orientation={orientation ?? direction}
      className={cn("nds-resizable", className)}
      {...props}
    />
  )
}

function ResizablePanel({ tabIndex = 0, ...props }: ResizablePrimitive.PanelProps & { tabIndex?: number }) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" tabIndex={tabIndex} {...props} />
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
