// ─── DECISÃO DE ACESSIBILIDADE — versão curta ─────────────────────────────────
//
// Bloco canônico no `command.ts` do Vanilla. Em uma frase: a paleta é um
// COMBOBOX com listbox, e o que a define é o foco NUNCA sair do campo de busca
// — as setas movem o destaque, e quem conta ao leitor de tela onde ele está é o
// `aria-activedescendant`. É o que a separa do dropdown-menu (que move o foco
// de verdade), do popover (que recebe foco) e do tooltip (que nem recebe).
//
// ─── O mecanismo NESTA stack ─────────────────────────────────────────────────
//
// Medido em `cmdk/dist/index.mjs` (2026-09-02), e o cmdk entrega quase tudo:
//
//   · `Command.Input` → `role="combobox"` + `aria-autocomplete="list"` +
//     `aria-expanded={true}` + `aria-controls={listId}` +
//     `aria-activedescendant={selectedItemId}`, com o id REAL da lista;
//   · `Command.List` → `role="listbox"` com `tabIndex={-1}` (a lista não é
//     parada de tabulação numa combobox — o foco fica no campo);
//   · `Command.Item` → `role="option"` + `aria-selected` + `aria-disabled`, e o
//     item fora do filtro é DESMONTADO (outras stacks o escondem com `hidden`);
//   · `Command.Group` → wrapper `role="presentation"` e um `role="group"`
//     interno com `aria-labelledby` no cabeçalho.
//
// Duas divergências, e nenhuma é escolha desta casa:
//
//   1. O DIVISOR sai como `role="separator"`, papel que a lib crava DEPOIS do
//      espalhamento das props e não deixa sobrescrever. Filho não permitido de
//      `listbox`. Resolvido com `aria-hidden="true"` no wrapper (ver
//      `CommandSeparator` abaixo) — medido em axe-core: nó invisível ao leitor
//      de tela sai da conta de `aria-required-children`.
//   2. O VAZIO precisava de uma região viva, e o `Command.Empty` do cmdk não
//      serve para isso: ele monta `role="presentation"` DENTRO da lista, e só
//      enquanto o filtro não casa — nó criado no instante em que a busca
//      esvazia não anuncia nada. Fechado em 2026-09-02: `CommandEmpty` deixou
//      de embrulhar o primitivo e virou um `<div role="status">` próprio,
//      montado o tempo todo e IRMÃO do `CommandList`, que é a forma do Vanilla.
//      O estado vem de `useCommandState`, exportado pelo cmdk (`useCmdk as
//      useCommandState`, medido em `cmdk/dist/index.d.ts`) — sem fork. Ver
//      PATCHES.md#command-listbox-children.

import type * as React from "react"
import { Command as CommandPrimitive, useCommandState } from "cmdk"

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

/**
 * "Nenhum resultado" — e o ponto não é desenhar a frase, é ANUNCIÁ-LA.
 *
 * É a única região viva do componente, e o único ponto da paleta em que a
 * mudança acontece FORA do foco e sem outro canal: o foco fica no campo de
 * busca, a lista esvazia, e não sobra item nenhum para onde navegar. Sem o
 * anúncio, quem lê de ouvido digita no vazio sem saber que a busca não achou
 * nada.
 *
 * Duas condições, e são elas que explicam por que este componente não embrulha
 * mais o `Command.Empty` do cmdk:
 *
 *   · o elemento fica MONTADO o tempo todo. Região viva criada no instante em
 *     que a busca esvazia não anuncia nada — o leitor de tela lê a mudança de
 *     conteúdo DENTRO de uma região que já existia. O primitivo monta e
 *     desmonta o nó, então ele desenhava a frase sem nunca anunciá-la;
 *   · o elemento fica FORA do `CommandList`. `role="status"` não é filho
 *     permitido de `role="listbox"` (só `option` e `group` são), e um `<div>`
 *     sem papel ali é pior: o `ariaRequiredChildrenEvaluate` do axe desce até o
 *     nó de texto, `isContent` devolve verdadeiro, e a regra reprova.
 *
 * O que entra e sai é o CONTEÚDO e a classe. `.nds-command-empty` traz 24px de
 * `padding-block`, e mantê-la com a lista cheia deixaria um vão embaixo dos
 * resultados. Sem a classe e sem conteúdo o nó continua no DOM e na árvore de
 * acessibilidade, com altura zero — o oposto de `display: none`, e é o que
 * preserva o anúncio da PRÓXIMA busca sem resultado.
 *
 * A condição é a mesma que o primitivo usava (`filtered.count === 0`), lida do
 * mesmo estado por `useCommandState`: o que a paleta DESENHA não mudou. Mudou
 * onde a frase mora e o fato de ela passar a ser anunciada.
 */
function CommandEmpty({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const isEmpty = useCommandState((state) => state.filtered.count === 0)

  return (
    <div
      data-slot="command-empty"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      {...(isEmpty ? { "data-empty": "" } : {})}
      className={cn(isEmpty && "nds-command-empty", className)}
      {...props}
    >
      {isEmpty ? children : null}
    </div>
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
      /*
       * Divisor DECORATIVO, como no Vanilla (referência cross-stack).
       *
       * A lib desta stack crava `role="separator"` DEPOIS do espalhamento das
       * props (medido em `cmdk/dist/index.mjs`), então o papel não se
       * sobrescreve daqui. O que se sobrescreve é a visibilidade: medido em
       * `axe-core`, `ariaRequiredChildrenEvaluate` descarta todo nó que não
       * seja visível para leitor de tela antes de julgar filho permitido —
       * então `aria-hidden` tira o divisor da conta sem precisar de fork.
       *
       * E é o desenho certo de qualquer forma: uma linha de 1px não carrega
       * informação; quem separa os blocos para quem não vê a tela é o rótulo
       * de cada grupo.
       */
      aria-hidden="true"
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
