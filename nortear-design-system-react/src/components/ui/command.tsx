import type * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchIcon, CheckIcon } from "lucide-react"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "nds-command",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children: React.ReactNode
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          "nds-command-dialog-content",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {/*
         * O cabeçalho mora DENTRO do painel. Fora dele (que era o caso), o
         * título e a descrição ficavam no fluxo da página o tempo todo: um
         * leitor de tela anunciava "Command Palette / Busque por um comando"
         * mesmo com a paleta fechada, e o nome do diálogo vinha de um elemento
         * que o próprio primitivo marca como inerte ao abrir.
         *
         * `.nds-sr-only` é `position: absolute`, então o bloco sai do fluxo do
         * flex e não acrescenta espaço nenhum ao painel.
         */}
        <DialogHeader className="nds-sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="nds-command-input-wrapper">
      <SearchIcon />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn("nds-command-input", className)}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "nds-command-list",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("nds-command-empty", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "nds-command-group",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("nds-command-separator", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & {
  /**
   * Marca o comando como escolhido. Vira `data-checked` no elemento, que é o
   * gancho de `.nds-command-item[data-checked="true"] .nds-command-item-check`
   * na folha compartilhada — sem ele a marca existia no DOM e nunca acendia.
   *
   * Sem valor, o atributo não é emitido: comando que não representa escolha não
   * deve declarar estado de escolha nenhum, nem `false`.
   */
  checked?: boolean
}) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "nds-command-item",
        className
      )}
      {...(checked === undefined ? {} : { "data-checked": String(checked) })}
      {...props}
    >
      {children}
      <CheckIcon className="nds-command-item-check" />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "nds-command-shortcut",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
