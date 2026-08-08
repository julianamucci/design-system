import type * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "@/lib/utils"
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn("nds-breadcrumb", className)}
      {...props}
    />
  )
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "nds-breadcrumb-list",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("nds-breadcrumb-item", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn("nds-breadcrumb-link", className),
      },
      props
    ),
    render,
    state: {
      slot: "breadcrumb-link",
    },
  })
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    // A anatomia documentada é literal: "último item com aria-current='page'; nunca é
    // link". O role="link" com aria-disabled fazia o leitor de tela anunciar
    // justamente o contrário — "link, desabilitado" — para um texto que nunca foi
    // navegável. Quem marca a página atual é o aria-current, e ele vale em
    // qualquer elemento.
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn("nds-breadcrumb-page", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("nds-breadcrumb-separator", className)}
      {...props}
    >
      {children ?? (
        <ChevronRightIcon />
      )}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  label,
  ...props
}: React.ComponentProps<"span"> & {
  /**
   * Nome acessível do indicador de níveis ocultos. Com rótulo, as reticências
   * são anunciadas; sem ele, ficam decorativas — que é o certo quando um
   * gatilho as envolve e já carrega o próprio nome.
   */
  label?: string
}) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      className={cn(
        "nds-breadcrumb-ellipsis",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
