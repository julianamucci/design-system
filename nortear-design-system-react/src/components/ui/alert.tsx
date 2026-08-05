/* v8 ignore next -- os dois ramos que o coverage marca aqui são do helper de
   interop do transform para `import * as`, não código do componente. */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * As classes `.nds-animate-in` / `.nds-animate-out` vivem em `utilities.css` e
 * servem a qualquer componente que apareça/suma em runtime.
 *
 * Os timeouts NÃO são redundância defensiva genérica: sem eles o alert nunca
 * sai da tela em dois cenários reais — `prefers-reduced-motion`, onde a
 * animação é suprimida e `animationend` jamais dispara, e ambiente sem
 * composição de quadros (Chromium headless dos testes), onde a animação fica
 * presa no primeiro quadro. Quem vencer a corrida finaliza a fase.
 */
const EXIT_FALLBACK_MS = 300 // --duration-base (200ms) + folga
const ENTER_FALLBACK_MS = 450 // --duration-spring (400ms) + folga

/**
 * Corre `animationend` do próprio elemento contra um timeout e chama `done`
 * uma vez só, seja quem for o vencedor. Devolve o cleanup do efeito.
 */
function raceAnimationEnd(
  el: HTMLElement,
  timeoutMs: number,
  done: () => void,
): () => void {
  let finalizado = false
  const finalizar = (event?: AnimationEvent) => {
    // Animações de filhos (o botão de fechar, por exemplo) borbulham até aqui.
    if (event && event.target !== el) return
    /* v8 ignore next -- guarda de dupla finalização: os dois caminhos que
       chamam (animationend e timeout) removem listener e timer antes de sair,
       então não há ordem de eventos que a alcance. Fica como rede se um deles
       deixar de limpar. */
    if (finalizado) return
    finalizado = true
    window.clearTimeout(timer)
    el.removeEventListener("animationend", finalizar)
    done()
  }

  el.addEventListener("animationend", finalizar)
  const timer = window.setTimeout(finalizar, timeoutMs)

  return () => {
    finalizado = true
    window.clearTimeout(timer)
    el.removeEventListener("animationend", finalizar)
  }
}

const alertVariants = cva("nds-alert", {
  variants: {
    variant: {
      default: "",
      destructive: "nds-alert-destructive",
      success: "nds-alert-success",
      warning: "nds-alert-warning",
      info: "nds-alert-info",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Alert({
  className,
  variant,
  role = "alert",
  dismissible = false,
  onDismiss,
  dismissLabel = "Fechar alerta",
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "role"> &
  VariantProps<typeof alertVariants> & {
    /**
     * Semântica de anúncio da raiz. `alert` (default) é live region
     * ASSERTIVA — só para mensagem urgente que surge em tempo de execução.
     * `status` é live region polida. `note` NÃO é live region e é o valor
     * correto para conteúdo estático, já presente quando a página carrega.
     */
    role?: "alert" | "status" | "note"
    /** Renderiza o botão de fechar no canto superior direito. */
    dismissible?: boolean
    /** Disparado uma única vez quando o usuário aciona o botão de fechar. */
    onDismiss?: () => void
    /** aria-label do botão de fechar. */
    dismissLabel?: string
  }) {
  const ref = React.useRef<HTMLDivElement>(null)

  // Fechar remove o alert da tela. Consumidor que quiser modo controlado
  // renderiza condicionalmente por conta própria.
  const [dismissed, setDismissed] = React.useState(false)
  const [exiting, setExiting] = React.useState(false)
  // Entrada: a classe é TRANSITÓRIA. Fica no DOM só enquanto a animação roda e
  // sai em seguida — se ficasse, um ambiente que não avança a animação
  // (headless) manteria o alert preso em opacity: 0, invisível para sempre.
  // Só o dismissible entra animado: ele é o único que aparece em runtime.
  const [entering, setEntering] = React.useState(dismissible)

  // onDismiss por ref: o efeito que o dispara depende só de `dismissed`, para
  // não re-disparar quando o consumidor recria a função a cada render.
  const onDismissRef = React.useRef(onDismiss)
  React.useEffect(() => {
    onDismissRef.current = onDismiss
  })

  React.useEffect(() => {
    const el = ref.current
    if (!entering || !el) return
    return raceAnimationEnd(el, ENTER_FALLBACK_MS, () => setEntering(false))
  }, [entering])

  React.useEffect(() => {
    const el = ref.current
    if (!exiting || !el) return
    return raceAnimationEnd(el, EXIT_FALLBACK_MS, () => setDismissed(true))
  }, [exiting])

  // Depois da remoção do nó (o commit que devolve null já rodou) e uma vez só.
  React.useEffect(() => {
    if (!dismissed) return
    onDismissRef.current?.()
  }, [dismissed])

  if (dismissed) return null

  return (
    <div
      ref={ref}
      data-slot="alert"
      role={role}
      className={cn(
        alertVariants({ variant }),
        // Fechar antes da entrada terminar deixaria as duas classes no
        // elemento — a saída sempre substitui a entrada.
        exiting ? "nds-animate-out" : entering && "nds-animate-in",
        className,
      )}
      {...props}
    >
      {children}
      {dismissible && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="nds-alert-dismiss"
          type="button"
          aria-label={dismissLabel}
          data-slot="alert-dismiss"
          onClick={() => {
            // Anima a saída antes de remover; `onDismiss` só dispara no fim.
            if (exiting) return
            setExiting(true)
          }}
        >
          <X className="nds-icon" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}

function AlertTitle({
  className,
  as: As = "h5",
  ...props
}: React.ComponentProps<"h5"> & {
  /**
   * Elemento heading a renderizar. Default `h5`. Passe o nível (`h1`..`h6`)
   * que preserva a hierarquia de headings da página onde o Alert está.
   */
  as?: React.ElementType
}) {
  return (
    // heading/<section>: mesma marcação nas 4 stacks e a que o alert.css
    // documenta (seletores .nds-alert > h1..h6 e .nds-alert > section). <div>
    // perdia a semântica de cabeçalho e de landmark da descrição.
    <As
      data-slot="alert-title"
      className={cn("nds-alert-title", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="alert-description"
      className={cn("nds-alert-description", className)}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("nds-alert-action", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
