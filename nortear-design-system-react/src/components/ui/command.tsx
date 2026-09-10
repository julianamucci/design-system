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
//     interno com `aria-labelledby` no cabeçalho. Sem cabeçalho, o papel
//     interno sai (ver `CommandGroup` abaixo): grupo anônimo não nomeia nada.
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
//      useCommandState`, medido em `cmdk/dist/index.d.ts`) — sem fork.
//
// As duas juntas ENCERRARAM a exceção que as stories carregavam: em 2026-09-03,
// com `aria-required-children` religada nos quatro arquivos e a suíte de
// navegador executada, as stories do Command passam — inclusive a que termina
// sem resultados, que é o caso do listbox vazio. Histórico da medida em
// PATCHES.md#command-listbox-children.

import type * as React from "react"
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
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

/*
 * ─── O nome acessível da lista é o placeholder do campo ──────────────────────
 *
 * Contrato das cinco stacks (PRD §2, fixado em 2026-09-10): o campo e a lista
 * se chamam pelo que o campo pede — "Buscar componente..." —, que é a forma do
 * Vanilla. Sem isto, o `Command.List` do cmdk se anuncia pelo default da lib,
 * "Suggestions", em inglês e igual em toda paleta da página; e o rótulo oculto
 * do campo (`<label cmdk-label>`, alvo do `aria-labelledby` dele) fica vazio.
 *
 * Quem sabe o placeholder é o `CommandInput`, e quem precisa dele são o
 * `Command` (que o repassa como `label` ao primitivo — é o texto do rótulo
 * oculto do campo) e o `CommandList`. O campo o publica no contexto da paleta
 * ao montar e a cada troca. `label` explícito em qualquer um dos dois continua
 * vencendo.
 */
type CommandPlaceholderContextValue = {
  placeholder: string | undefined
  setPlaceholder: (placeholder: string | undefined) => void
}

const CommandPlaceholderContext =
  createContext<CommandPlaceholderContextValue | null>(null)

function Command({
  className,
  label,
  /*
   * Atalhos de estilo vim DESLIGADOS por padrão (PRD §7, 2026-09-10). O cmdk
   * liga Ctrl+N/J para descer e Ctrl+P/K para subir o destaque (medido em
   * `cmdk/dist/index.mjs`, no `onKeyDown` da raiz). Ctrl+K é o atalho que abre
   * a paleta: com o foco num campo inline, a mesma tecla subia o destaque E
   * abria a paleta da página ao mesmo tempo. As outras stacks nunca tiveram os
   * quatro atalhos; quem os quiser liga a prop no call site.
   */
  vimBindings = false,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  const [placeholder, setPlaceholder] = useState<string | undefined>(undefined)

  return (
    <CommandPlaceholderContext.Provider value={{ placeholder, setPlaceholder }}>
      <CommandPrimitive
        data-slot="command"
        className={cn(
          "nds-command",
          className
        )}
        label={label ?? placeholder}
        vimBindings={vimBindings}
        {...props}
      />
    </CommandPlaceholderContext.Provider>
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
  placeholder,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  const context = useContext(CommandPlaceholderContext)
  const setPlaceholder = context?.setPlaceholder

  // Efeito de LAYOUT: o nome chega antes da primeira pintura, e o leitor de
  // tela nunca encontra a lista com o default da lib. Ao desmontar, o nome sai
  // junto — lista sem campo não tem pedido nenhum para repetir.
  useLayoutEffect(() => {
    if (!setPlaceholder) return
    setPlaceholder(placeholder)
    return () => setPlaceholder(undefined)
  }, [setPlaceholder, placeholder])

  return (
    <div data-slot="command-input-wrapper" className="nds-command-input-wrapper">
      <SearchIcon />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn("nds-command-input", className)}
        placeholder={placeholder}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  label,
  onMouseDown,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const placeholder = useContext(CommandPlaceholderContext)?.placeholder

  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "nds-command-list",
        className
      )}
      label={label ?? placeholder}
      {...props}
      /*
       * O ponteiro não tira o foco do campo — a forma do Vanilla. A lib dá
       * `tabIndex={-1}` à lista (medido em `cmdk/dist/index.mjs`), e elemento
       * com tabindex negativo recebe foco ao clique: clicar num comando, ou no
       * desabilitado (que deixa o clique cair no grupo embaixo), levava o foco
       * para a LISTA. Dali a letra digitada não chegava mais à busca. Cancelar
       * o padrão do `mousedown` segura o foco onde ele mora; o `click`, que é
       * quem escolhe o comando, continua disparando.
       */
      onMouseDown={(event) => {
        onMouseDown?.(event)
        event.preventDefault()
      }}
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

/*
 * ─── Grupo sem cabeçalho é só caixa, não `role="group"` ──────────────────────
 *
 * Itens sem grupo moram num grupo SEM cabeçalho (contrato das cinco stacks,
 * 2026-09-10): é a caixa `.nds-command-group` que dá os 4px de padding de que
 * o raio aninhado do item depende (PRD D10). O vanilla e o vue desenham essa
 * caixa sem papel nenhum.
 *
 * O cmdk não: medido em `cmdk/dist/index.mjs`, o `Command.Group` monta um
 * wrapper `role="presentation"` e, dentro dele, um `[cmdk-group-items]` com
 * `role="group"` FIXO — o `aria-labelledby` só entra quando há `heading`. Sem
 * cabeçalho sobrava um grupo anônimo, que o leitor de tela anuncia como
 * "grupo" sem dizer de quê. A lib não expõe props para esse nó interno.
 *
 * Por isso o papel é tirado depois de montar, e só quando falta cabeçalho. O
 * React não o devolve: ele só reescreve atributo cuja prop MUDOU, e o
 * `role="group"` da lib é constante. O efeito também faz o caminho inverso — se
 * o cabeçalho chega depois, o papel volta, porque o React não o reescreveria.
 * O nó interno sem papel é o mesmo desenho do wrapper `role="presentation"` que
 * a lib já põe em volta de todo grupo, e o axe atravessa os dois até as opções.
 */
function CommandGroup({
  className,
  heading,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const hasHeading = Boolean(heading)

  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  useLayoutEffect(() => {
    const items = rootRef.current?.querySelector(":scope > [cmdk-group-items]")
    if (!items) return
    if (hasHeading) items.setAttribute("role", "group")
    else items.removeAttribute("role")
  }, [hasHeading])

  return (
    <CommandPrimitive.Group
      ref={setRoot}
      data-slot="command-group"
      className={cn(
        "nds-command-group",
        className
      )}
      heading={heading}
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

/*
 * ─── O filtro casa com o valor E com o rótulo — nunca com o atalho (C9) ──────
 *
 * Contrato das cinco stacks, decidido em 2026-09-10. O cmdk pontua a busca
 * contra o `value` do item e as `keywords` (medido em `cmdk/dist`: o texto que
 * vai ao `commandScore` é `value + " " + keywords.join(" ")`). Com `value`
 * explícito, o texto que se LÊ no item fica de fora: "arq" não achava "Novo
 * arquivo", cujo valor é `novo`.
 *
 * O rótulo entra como keyword, somado às que quem consome passar. Ele sai das
 * PROPS, e não do DOM: é o texto dos filhos com o `CommandShortcut` pulado.
 * Pelo DOM seria preciso ler o nó depois de montar e renderizar de novo; pelos
 * filhos o rótulo existe já na primeira renderização. O atalho fica de fora de
 * propósito — com ele, "ctrl" casaria com todo comando que tem atalho.
 */
function labelOf(node: React.ReactNode): string {
  let text = ""
  Children.forEach(node, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      text += ` ${child}`
    } else if (
      isValidElement<{ children?: React.ReactNode }>(child) &&
      child.type !== CommandShortcut
    ) {
      text += ` ${labelOf(child.props.children)}`
    }
  })
  return text.replace(/\s+/g, " ").trim()
}

function CommandItem({
  className,
  children,
  checked,
  keywords,
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
  const label = labelOf(children)

  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "nds-command-item",
        className
      )}
      {...(checked === undefined ? {} : { "data-checked": String(checked) })}
      keywords={label ? [...(keywords ?? []), label] : keywords}
      {...props}
    >
      {children}
      {/*
       * A marca só existe no item MARCÁVEL, como nas outras quatro stacks. Com
       * ela em todo item, a folha a deixava transparente mas não a tirava do
       * fluxo: cada comando reservava 16px à direita para uma escolha que ele
       * nem representa. No marcável ela fica nos dois estados (a opacidade é
       * que muda), para a largura não pular a cada troca.
       */}
      {checked !== undefined && <CheckIcon className="nds-command-item-check" />}
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
