import type * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

/**
 * Landmark da faixa de paginação.
 *
 * **Não existe `showPages` aqui, e a ausência é o contrato** (V11 do PRD): nesta
 * stack a régua numerada é do CONSUMIDOR — quem chama escreve um
 * `PaginationLink` por página dentro do `PaginationContent`. Não há régua
 * interna para uma opção esconder: quem não quer números não os escreve, que é
 * a mesma razão de `showPrevNext` só existir no vanilla (V24). O rodapé do
 * DataTable, que é o caso que pediu o eixo, compõe os quatro direcionais e
 * nenhum número.
 *
 * Os outros dois eixos da mesma passagem viraram peça e prop: o salto para as
 * pontas é `PaginationFirst` / `PaginationLast`, e a aparência dos controles
 * não ativos é `appearance` no `PaginationLink`.
 */
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
  /**
   * Endereço da página. É ele que decide a TAG do controle.
   *
   * Com endereço o controle é `<a>`: destino de verdade, abre em nova aba e é
   * indexável. Sem endereço ele é `<button type="button">`, porque âncora vazia
   * que age na própria página engana quem navega por teclado e por leitor de
   * tela — e `#` não é endereço.
   */
  href?: string
  /** Controle indisponível. O mecanismo muda com a tag; ver abaixo. */
  disabled?: boolean
  /**
   * Aparência dos controles NÃO ativos. Padrão `ghost`.
   *
   * A página atual continua `outline` sempre: é ela que o realce existe para
   * marcar, e deixá-la seguir o eixo apagaria a marcação justamente quando a
   * faixa inteira fosse `outline`. Num rodapé de tabela, onde não há controle
   * numerado, a regra não compete.
   *
   * Não se resolve por `className`: `buttonVariants` já emite uma variante, e
   * quem chega depois pelo `cn` não desfaz a que veio antes — as duas classes
   * ficariam no elemento e quem venceria seria a ordem da folha.
   */
  appearance?: "ghost" | "outline"
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.HTMLAttributes<HTMLElement>

/** `#` e string vazia não são destino: são a âncora que não leva a lugar nenhum. */
function hasRoute(href: string | undefined): href is string {
  return href !== undefined && href !== "" && href !== "#"
}

function PaginationLink({
  className,
  isActive,
  size = "icon",
  href,
  disabled: disabledProp,
  appearance = "ghost",
  onClick,
  tabIndex,
  "aria-disabled": ariaDisabled,
  ...props
}: PaginationLinkProps) {
  // O React escreve booleano em atributo ARIA como a string "false", então
  // `aria-disabled={false}` deixava o atributo NO elemento com valor negativo —
  // `[aria-disabled]` passava a casar o controle habilitado. Aqui ele só existe
  // quando é verdade. `aria-disabled` continua aceito como entrada porque quem
  // compõe o escrevia assim antes de existir a prop `disabled`.
  const disabled =
    disabledProp === true || ariaDisabled === true || ariaDisabled === "true"
  const variant = isActive ? "outline" : appearance

  // Sem rota o controle age na PRÓPRIA página: é botão, e o indisponível é o
  // `disabled` nativo — o navegador barra o clique, o Enter e a tabulação
  // sozinho, sem precisar de tabindex negativo nem de guarda em JavaScript.
  if (!hasRoute(href)) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(className)}
        disabled={disabled}
        aria-current={isActive ? "page" : undefined}
        data-slot="pagination-link"
        // `data-active` só existe quando é verdade, pelo mesmo motivo.
        data-active={isActive ? "true" : undefined}
        tabIndex={tabIndex}
        onClick={onClick}
        {...props}
      />
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          href={href}
          aria-current={isActive ? "page" : undefined}
          aria-disabled={disabled ? "true" : undefined}
          data-slot="pagination-link"
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

type PaginationDirectionalProps = React.ComponentProps<typeof PaginationLink> & {
  direction: "left" | "right"
  /** Duplo chevron: o controle SALTA para a ponta em vez de andar um passo. */
  double?: boolean
  /** Texto visível ao lado do chevron. Vazio deixa o controle só de ícone. */
  text?: string
}

/**
 * Corpo comum dos quatro controles de direção — passo e salto.
 *
 * A forma do controle segue o TEXTO VISÍVEL, e é essa regra que faz o rodapé do
 * DataTable ficar idêntico ao que ele desenhava à mão:
 *
 * · **com texto** — botão de tamanho `default` mais `.nds-pagination-prev` /
 *   `-next`, cujo recuo assimétrico existe para abrir espaço entre o chevron e
 *   a palavra ao lado;
 * · **sem texto** — botão de tamanho `icon`, quadrado, sem aquelas classes e
 *   sem `<span>` vazio. `.nds-pagination-label` é `display: block` acima de
 *   40rem, então um bloco sem texto ainda ocuparia uma linha inteira dentro do
 *   botão e o quadrado deixaria de ser quadrado. Quem nomeia o controle aí é o
 *   `aria-label`, que os quatro já escrevem.
 */
function PaginationDirectional({
  className,
  direction,
  double = false,
  text = "",
  ...props
}: PaginationDirectionalProps) {
  const Icon = double
    ? direction === "left"
      ? ChevronsLeftIcon
      : ChevronsRightIcon
    : direction === "left"
      ? ChevronLeftIcon
      : ChevronRightIcon
  // O ícone fica do lado para onde o controle leva. O lucide já escreve
  // `aria-hidden="true"` sozinho quando o SVG não recebe prop de acessibilidade.
  const icon = (
    <Icon data-icon={direction === "left" ? "inline-start" : "inline-end"} />
  )

  if (!text) {
    return (
      <PaginationLink size="icon" className={className} {...props}>
        {icon}
      </PaginationLink>
    )
  }

  const caption = <span className="nds-pagination-label">{text}</span>
  return (
    <PaginationLink
      size="default"
      className={cn(
        direction === "left" ? "nds-pagination-prev" : "nds-pagination-next",
        className
      )}
      {...props}
    >
      {direction === "left" ? icon : caption}
      {direction === "left" ? caption : icon}
    </PaginationLink>
  )
}

function PaginationPrevious({
  text = "Anterior",
  ...props
}: Omit<PaginationDirectionalProps, "direction" | "double">) {
  return (
    <PaginationDirectional
      direction="left"
      aria-label="Ir para a página anterior"
      data-slot="pagination-previous"
      text={text}
      {...props}
    />
  )
}

function PaginationNext({
  text = "Próxima",
  ...props
}: Omit<PaginationDirectionalProps, "direction" | "double">) {
  return (
    <PaginationDirectional
      direction="right"
      aria-label="Ir para a próxima página"
      data-slot="pagination-next"
      text={text}
      {...props}
    />
  )
}

/**
 * Salto para a PRIMEIRA página, na ponta esquerda da faixa.
 *
 * Fica FORA da régua numerada de propósito: são eixos independentes, e o rodapé
 * de tabela mostra os quatro direcionais sem número nenhum. Numa faixa com
 * números o salto costuma sobrar — o 1 e o último já estão lá —, e por isso ele
 * é composição de quem chama, nunca peça implícita.
 *
 * Só de ícone: sem texto visível o controle nasce quadrado, como o numerado.
 */
function PaginationFirst({
  ...props
}: Omit<PaginationDirectionalProps, "direction" | "double" | "text">) {
  return (
    <PaginationDirectional
      direction="left"
      double
      aria-label="Ir para a primeira página"
      data-slot="pagination-first"
      {...props}
    />
  )
}

/** Salto para a ÚLTIMA página, na ponta direita. Espelho de `PaginationFirst`. */
function PaginationLast({
  ...props
}: Omit<PaginationDirectionalProps, "direction" | "double" | "text">) {
  return (
    <PaginationDirectional
      direction="right"
      double
      aria-label="Ir para a última página"
      data-slot="pagination-last"
      {...props}
    />
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
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
