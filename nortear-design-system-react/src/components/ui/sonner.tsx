import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/**
 * Rótulos em português — o design system é escrito em pt-BR, e os defaults da
 * lib ("Notifications", "Close toast") chegariam à tela em inglês.
 */
export const REGION_LABEL = "Notificações"
export const CLOSE_LABEL = "Fechar notificação"

/**
 * A região que desenha a fila. Vai UMA VEZ no root da aplicação.
 *
 * `containerAriaLabel` e `toastOptions` entram DEPOIS do spread de `props`
 * porque quem consome precisa poder sobrepô-los — dois Toasters na mesma tela
 * exigem nomes distintos. O `toastOptions` é mesclado, e não substituído: passar
 * só `classNames` não pode apagar o rótulo do botão de fechar.
 */
const Toaster = ({ containerAriaLabel, toastOptions, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
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
      containerAriaLabel={containerAriaLabel ?? REGION_LABEL}
      toastOptions={{ closeButtonAriaLabel: CLOSE_LABEL, ...toastOptions }}
    />
  )
}

export { Toaster }
