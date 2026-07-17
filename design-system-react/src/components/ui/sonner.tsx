import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster"
      icons={{
        success: (
          <CircleCheckIcon className="nds-toast-icon" />
        ),
        info: (
          <InfoIcon className="nds-toast-icon" />
        ),
        warning: (
          <TriangleAlertIcon className="nds-toast-icon" />
        ),
        error: (
          <OctagonXIcon className="nds-toast-icon" />
        ),
        loading: (
          <Loader2Icon className="nds-toast-icon nds-toast-icon-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
