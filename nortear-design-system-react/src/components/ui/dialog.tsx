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
 * ─── Conteúdo mais alto que a janela: uma saída só ──────────────────────────
 *
 * CORPO ROLÁVEL. O painel fica parado e centralizado, o cabeçalho e o rodapé
 * não saem da tela, e a rolagem acontece dentro do corpo. Nada muda no
 * componente: quem compõe pendura `.nds-dialog-body-scroll` no elemento do
 * corpo, com `tabindex="0"`, `role="group"` e nome.
 *
 * Houve uma segunda saída — o painel inteiro entrava no fluxo do véu e a
 * PÁGINA rolava, com o cabeçalho subindo junto. Foi retirada em 2026-09-08:
 * um modal que rola com a página desfaz a própria promessa de interromper, e
 * duas saídas opostas para o mesmo problema obrigavam cada tela a escolher sem
 * critério. O par de classes que a sustentava já não é declarado em
 * `dialog.css`, então nem pintar ela pinta mais.
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
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn("nds-dialog-overlay", className)}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeLabel = "Fechar",
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  /**
   * Nome acessível do X do canto. Vai num `<span class="nds-sr-only">` e não
   * num `aria-label`: é o mecanismo que o conteúdo compartilhado documenta, e
   * texto real sobrevive à tradução automática da página, que ignora
   * `aria-label`.
   *
   * A prop existe porque o rótulo estava CRAVADO em português aqui dentro:
   * quem consome o design system noutro idioma tinha de reescrever o
   * primitivo para trocar uma palavra. O default preserva todo call site.
   */
  closeLabel?: string
}) {
  const modal = React.useContext(DialogModalContext)

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn("nds-dialog-content", className)}
        aria-modal={modal === true ? "true" : undefined}
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
            <XIcon />
            <span className="nds-sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
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

/*
 * ─── A ordem do rodapé é a INVERSA da que parece ────────────────────────────
 *
 * `.nds-dialog-footer` é `column-reverse` empilhado e, a partir de 40rem,
 * `row` + `justify-content: flex-end`. As duas leituras saem da MESMA ordem de
 * DOM: **secundários primeiro, primário por último**. Empilhado, o primário
 * sobe ao topo; deitado, vai para a direita — que é a regra de
 * `04-padroes-design-sistema.md`, "Alinhamento de Grupos de Botões", e o §D9
 * do PRD do dialog.
 *
 * Escrever o primário por último é contraintuitivo, e por isso o defeito era
 * reincidente: o botão de `showCloseButton` — que é ação SECUNDÁRIA — era
 * renderizado DEPOIS de `{children}`, o que o punha exatamente na posição do
 * primário. Nenhum compilador alcança isso e nenhuma asserção por papel
 * tampouco: a ordem só existe como posição entre irmãos.
 */
function DialogFooter({
  className,
  showCloseButton = false,
  closeLabel = "Fechar",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
  /**
   * Rótulo VISÍVEL do botão de fechar do rodapé — aqui ele fica lado a lado
   * com as ações e é texto normal, não `nds-sr-only`. Mesma razão da prop
   * homônima do Content: o literal em português prendia o primitivo a um
   * idioma.
   */
  closeLabel?: string
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
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          {closeLabel}
        </DialogPrimitive.Close>
      )}
      {children}
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
