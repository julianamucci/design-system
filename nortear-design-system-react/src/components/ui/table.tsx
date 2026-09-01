import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Nome acessível do container que rola. SEM PADRÃO, de propósito.
 *
 * O container é o WRAPPER, e não a `<table>`: são elementos diferentes e cada um
 * tem o seu nome. Por isso a prop tem nome próprio e não é `aria-label` — um
 * `aria-label` escrito aqui nomeia a TABELA, que é o comportamento certo e que
 * não se quer roubar. O wrapper é o que quem monta não alcança, e é ele que entra
 * na ordem de tabulação.
 *
 * O nome é do CONTEÚDO ("Faturas de 2026"), e o design system não tem como
 * sabê-lo. Padrão genérico ("Tabela") anunciaria sem informar: quem chegou por Tab
 * já sabe que rola, o que não sabe é o que rola. Sem nome NÃO emitimos papel
 * nenhum — `aria-label` em elemento sem papel é atributo proibido, e o axe acusa
 * `aria-prohibited-attr`.
 *
 * `group` e não `region`: `region` com nome vira marco de página, e uma tela de
 * relatório empilha várias tabelas — seriam vários marcos onde não há várias
 * seções. Quem quiser marco envolve a tabela num `<section>` nomeado.
 */
type TableProps = React.ComponentProps<"table"> & { regionLabel?: string }

function Table({ className, regionLabel, ...props }: TableProps) {
  return (
    <div
      data-slot="table-container"
      className="nds-table-wrapper"
      // .nds-table-wrapper tem overflow-x: auto — região rolável precisa ser
      // alcançável por teclado (WCAG 2.1.1 / axe scrollable-region-focusable)
      // E precisa de papel e nome, que é a outra metade da regra: foco sozinho
      // faz uma parada que o leitor de tela não sabe anunciar.
      tabIndex={0}
      role={regionLabel ? "group" : undefined}
      aria-label={regionLabel}
    >
      <table
        data-slot="table"
        className={cn("nds-table", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(className)}
      {...props}
    />
  )
}

// `scope` nasce em "col" porque é o caso de longe mais comum e porque uma tabela
// sem `scope` é uma grade muda: o leitor de tela lê os valores sem dizer de que
// coluna vieram (WCAG 1.3.1). Quem tem cabeçalho de linha passa `scope="row"` e
// sobrescreve — a forma nativa continua sendo a forma certa de escrever.
function TableHead({ className, scope = "col", ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope={scope}
      className={cn(className)}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
