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
 * Canto padrão da pilha — decisão da dona em 2026-09-13.
 *
 * O default da lib é `bottom-right`, e toda story e docs page desta casa já
 * ensinavam `top-right`: o código passa a dizer o mesmo que a página. Como a
 * região é montada uma vez só, o canto se decide uma vez só.
 */
export const DEFAULT_POSITION: NonNullable<ToasterProps["position"]> = "top-right"

/**
 * A região que desenha a fila. Vai UMA VEZ no root da aplicação.
 *
 * `containerAriaLabel` e `toastOptions` entram DEPOIS do spread de `props`
 * porque quem consome precisa poder sobrepô-los — dois Toasters na mesma tela
 * exigem nomes distintos. O `toastOptions` é mesclado, e não substituído: passar
 * só `classNames` não pode apagar o rótulo do botão de fechar.
 *
 * `position` é desestruturado para o default do design system valer sem apagar a
 * escolha de quem compõe: fora do spread, `position={position}` já recebe o que
 * foi passado, ou `DEFAULT_POSITION` quando nada foi.
 */
const Toaster = ({
  containerAriaLabel,
  toastOptions,
  position = DEFAULT_POSITION,
  ...props
}: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={position}
      icons={{
        success: (
          <CircleCheckIcon className="nds-sonner-icon" />
        ),
        info: (
          <InfoIcon className="nds-sonner-icon" />
        ),
        warning: (
          <TriangleAlertIcon className="nds-sonner-icon" />
        ),
        error: (
          <OctagonXIcon className="nds-sonner-icon" />
        ),
        loading: (
          <Loader2Icon className="nds-sonner-icon nds-sonner-icon-spin" />
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
