import type * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      // Nome acessível em português, como a documentação que o cerca. `{...props}`
      // vem depois de propósito: quem tem mais de uma paginação na página passa
      // `aria-label` e vence, que é o que evita o `landmark-unique` do axe.
      aria-label="Paginação"
      data-slot="pagination"
      className={cn("nds-pagination", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("nds-pagination-list", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  onClick,
  tabIndex,
  "aria-disabled": ariaDisabled,
  ...props
}: PaginationLinkProps) {
  // O React escreve booleano em atributo ARIA como a string "false", então
  // `aria-disabled={false}` deixava o atributo NO elemento com valor negativo —
  // `[aria-disabled]` passava a casar o controle habilitado. Aqui ele só existe
  // quando é verdade.
  const disabled = ariaDisabled === true || ariaDisabled === "true"

  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          aria-disabled={disabled ? "true" : undefined}
          data-slot="pagination-link"
          // `data-active` só existe quando é verdade, pelo mesmo motivo.
          data-active={isActive ? "true" : undefined}
          role="link"
          // Em `<a>` não existe `disabled`: o par correto é aria-disabled mais
          // a saída da ordem de tabulação.
          tabIndex={disabled ? -1 : tabIndex}
          onClick={(evento) => {
            // `.nds-button[aria-disabled="true"]` já barra o PONTEIRO com
            // `pointer-events: none`. Isto fecha os outros caminhos — Enter no
            // teclado, clique disparado por script e o `click()` de um teste —
            // que continuavam chamando o handler de quem consome.
            if (disabled) {
              evento.preventDefault()
              evento.stopPropagation()
              return
            }
            onClick?.(evento)
          }}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  text = "Anterior",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Ir para a página anterior"
      size="default"
      data-slot="pagination-previous"
      className={cn("nds-pagination-prev", className)}
      {...props}
    >
      <ChevronLeftIcon data-icon="inline-start" />
      <span className="nds-pagination-label">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Próxima",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Ir para a próxima página"
      size="default"
      data-slot="pagination-next"
      className={cn("nds-pagination-next", className)}
      {...props}
    >
      <span className="nds-pagination-label">{text}</span>
      <ChevronRightIcon data-icon="inline-end" />
    </PaginationLink>
  )
}

/**
 * Indicador de páginas omitidas.
 *
 * O caractere `…` (U+2026) como TEXTO do elemento — não um ícone de três pontos,
 * e sem texto `sr-only` dentro. Um `sr-only` sob `aria-hidden` não é lido por
 * leitor de tela nenhum: era conteúdo invisível para todo mundo, e em inglês.
 * O número que as reticências escondem já está nos links vizinhos.
 */
function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("nds-pagination-ellipsis", className)}
      {...props}
    >
      …
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
