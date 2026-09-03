import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

/*
 * ─── Dialog ─────────────────────────────────────────────────────────────────
 *
 * Diálogo modal comum. O bloco canônico da decisão de acessibilidade (dez
 * itens, medidos na fonte das cinco libs) está no cabeçalho do `dialog.ts` do
 * Vanilla; aqui fica a versão curta mais o mecanismo desta stack.
 *
 * Prende o foco, trava a rolagem da página, fecha por Escape E por clique no
 * véu, e devolve o foco ao gatilho. Mecanismo: `useDialogRoot` chama
 * `useScrollLock(open && modal === true)`, `useDismiss` com
 * `escapeKey: isTopmost`, e o `FloatingFocusManager` do Popup prende o foco
 * enquanto `modal !== false`. O `DialogTrigger` do primitivo emite
 * `aria-haspopup="dialog"` e `aria-expanded` sozinho.
 *
 * ─── O que o separa do AlertDialog ──────────────────────────────────────────
 *
 * Papel: `dialog` aqui, `alertdialog` lá — o leitor de tela anuncia o
 * segundo com urgência e lê a descrição junto do título.
 *
 * Dispensa: aqui o clique no véu FECHA; no AlertDialog não fecha, porque a
 * decisão é crítica e exige escolha explícita. No primitivo desta stack isso
 * não é configuração: `useRenderDialogRoot` liga
 * `disablePointerDismissal` quando o modo é `alert-dialog`.
 *
 * Escape: fecha NOS DOIS, e no AlertDialog equivale a cancelar. Tirar a única
 * saída de teclado seria pior que o risco de dispensa acidental — que é
 * justamente o que o clique-fora bloqueado já cobre.
 *
 * ─── Conteúdo mais alto que a janela: as DUAS rotas ─────────────────────────
 *
 * Rota A — CORPO ROLÁVEL. O painel fica parado e centralizado, o cabeçalho e o
 * rodapé não saem da tela, e a rolagem acontece dentro do corpo. Nada muda no
 * componente: quem compõe pendura `.nds-dialog-body-scroll` no elemento do
 * corpo, com `tabindex="0"`, `role="group"` e nome.
 *
 * Rota B — OVERLAY ROLANDO. O painel entra no FLUXO do overlay, e quem rola é
 * o overlay: o cabeçalho sobe junto com o conteúdo e sai da tela. Serve para
 * conteúdo que se lê de ponta a ponta (um contrato, um artigo), em que fixar o
 * cabeçalho rouba altura útil. Liga-se com `scroll` no Content, que põe
 * `.nds-dialog-overlay-scroll` e `.nds-dialog-content-scroll` — o par que
 * `dialog.css` declara para as cinco stacks.
 *
 * A FORMA da rota B diverge por stack, e isso é divergência de API de
 * framework: não há fonte de verdade e não se "alinha". Aqui é uma prop
 * booleana do Content, que é como React expõe uma variação de render sem
 * duplicar componente. Nesse modo o Popup é renderizado DENTRO do Backdrop —
 * a rolagem só chega ao painel se ele for filho de quem rola.
 *
 * Clique na barra de rolagem do overlay NÃO fecha: o `useDismiss` do primitivo
 * desta stack já compara `offsetX` com `clientWidth` antes de dispensar
 * (`floating-ui-react/hooks/useDismiss.js`), então aqui não é preciso guarda
 * própria — nas stacks cujo primitivo não faz essa conta, é.
 */

// O primitivo desta stack isola o resto do documento com `inert`/`aria-hidden`
// e NÃO emite `aria-modal` (conferido em node_modules). O contrato de markup do
// design system promete o atributo, então quem o emite é este wrapper — e para
// isso o Content precisa saber se a raiz é modal. O valor `'trap-focus'` prende
// o foco mas deixa a página interativa: não é modal para o leitor de tela.
const DialogModalContext = React.createContext<boolean | "trap-focus">(true)

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return (
    <DialogModalContext.Provider value={props.modal ?? true}>
      <DialogPrimitive.Root data-slot="dialog" {...props} />
    </DialogModalContext.Provider>
  )
}

type DialogTriggerProps = DialogPrimitive.Trigger.Props & {
  asChild?: boolean
  children?: React.ReactNode
}
function DialogTrigger({ asChild, children, ...props }: DialogTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <DialogPrimitive.Trigger
        data-slot="dialog-trigger"
        render={children as React.ReactElement}
        {...(props as DialogPrimitive.Trigger.Props)}
      />
    )
  }
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...(props as DialogPrimitive.Trigger.Props)}
    >
      {children}
    </DialogPrimitive.Trigger>
  )
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  scroll = false,
  ...props
}: DialogPrimitive.Backdrop.Props & {
  /** Rota B: o overlay vira a área de rolagem e recebe o painel como filho. */
  scroll?: boolean
}) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "nds-dialog-overlay",
        scroll && "nds-dialog-overlay-scroll",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  scroll = false,
  ref,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  /**
   * Rota B — o painel sai do centro fixo e entra no fluxo do overlay, que
   * passa a ser quem rola. O cabeçalho sobe junto com o conteúdo.
   *
   * Para manter cabeçalho e rodapé parados (rota A), deixe em `false` e
   * pendure `.nds-dialog-body-scroll` no corpo. Ver o docblock do arquivo.
   */
  scroll?: boolean
}) {
  const modal = React.useContext(DialogModalContext)

  /*
   * O painel precisa de ref PRÓPRIO por causa da rota B, e o de quem chama não
   * pode ser perdido no caminho — daí a composição abaixo.
   */
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const registerPanel = React.useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = node
    },
    [ref]
  )

  const popup = (
    <DialogPrimitive.Popup
      ref={registerPanel}
      data-slot="dialog-content"
      className={cn(
        "nds-dialog-content",
        scroll && "nds-dialog-content-scroll",
        className
      )}
      aria-modal={modal === true ? "true" : undefined}
      /*
       * Rota B: o foco inicial pousa no PAINEL, e não no primeiro tabulável.
       *
       * O default do base-ui é "primeiro elemento tabulável dentro do popup".
       * Na rota A isso é inofensivo — o painel é `position: fixed` e não rola,
       * então tanto faz onde o foco pousa. Na rota B o painel está no fluxo do
       * overlay, que É a área de rolagem: o primeiro tabulável de um contrato
       * longo é o botão do RODAPÉ, e o navegador rola até ele para trazê-lo à
       * vista. Medido nesta stack: overlay de 3116px em janela de 900px abria
       * com `scrollTop` 2216 — o máximo. Quem abria o contrato caía na última
       * cláusula, e a rota existe justamente para ler da primeira.
       *
       * O painel já é alvo válido: o base-ui lhe dá `tabindex="-1"`. Focá-lo
       * também é o que a APG recomenda para diálogo de muito conteúdo, e deixa
       * o Tab seguinte cair no primeiro controle, na ordem natural.
       *
       * Antes do espalhamento de propósito: quem compõe pode passar o seu.
       */
      initialFocus={scroll ? panelRef : undefined}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          data-slot="dialog-close"
          render={
            <Button
              variant="ghost"
              className="nds-dialog-close-position"
              size="icon-sm"
            />
          }
        >
          <XIcon
          />
          <span className="nds-sr-only">Fechar</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Popup>
  )

  // Na rota B o painel é FILHO do overlay: rolagem de um elemento só alcança o
  // que está dentro dele. Na rota A eles seguem irmãos, que é o arranjo em que
  // o painel fica fixo no centro sem depender do overlay para posicionar.
  return (
    <DialogPortal>
      {scroll ? (
        <DialogOverlay scroll>{popup}</DialogOverlay>
      ) : (
        <>
          <DialogOverlay />
          {popup}
        </>
      )}
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("nds-dialog-header", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "nds-dialog-footer",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Fechar
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "nds-dialog-title",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "nds-dialog-description",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
