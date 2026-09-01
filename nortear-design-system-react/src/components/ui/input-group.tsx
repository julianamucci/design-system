"use client"

import type * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// ─── InputGroup — moldura única em volta de campo + acompanhamentos ──────────
//
// Visual: classes .nds-input-group* de `docs/shared/styles/nds/input-group.css`.
//
// A FOLHA É O CONTRATO. O que ela declara, e que este componente só transcreve:
//
//   • `.nds-input-group` é a MOLDURA: borda, arredondamento e transição são
//     dela. Ela acende no foco por `:has(.nds-input-group-control:focus-visible)`,
//     fica vermelha em `:has([aria-invalid="true"])` e esmaece em
//     `:has(:disabled)` — nenhum desses três estados é escrito por JS aqui.
//   • `.nds-input-group-control` é o campo NU: `border: 0` e `box-shadow: none`.
//     Duas molduras concêntricas no foco é o que essa regra existe para evitar.
//   • `.nds-input-group-addon` tem `cursor: text` e `user-select: none`, e as
//     quatro posições saem de `[data-align]`. As duas em bloco (mais a simples
//     presença de um `<textarea>`) trocam a linha por coluna via `:has()`.
//   • `.nds-input-group-button` só APERTA a medida; o visual de botão continua
//     vindo de `.nds-button`.
//
// ─── Decisões de acessibilidade, escritas porque são a parte difícil ─────────
//
// 1. A RAIZ DECLARA `role="group"`, E O NOME É DE QUEM COMPÕE — mas o papel
//    está declarado aqui de propósito, e não deixado implícito. Em `drawer` e
//    `sheet` o corpo era um `<div>` sem papel, e `aria-label` num elemento
//    genérico é simplesmente descartado (`aria-prohibited-attr`): a promessa
//    "o nome é de quem compõe" não se cumpria. `role="group"` é justamente um
//    dos papéis que ACEITAM nome, então aqui ela se cumpre.
//
// 2. O NOME DO GRUPO É OPCIONAL, e nunca inventado. Com um campo só dentro da
//    moldura, quem tem nome é o campo, pelo `<label>`; nomear o grupo também
//    faz o leitor de tela dizer as mesmas palavras duas vezes. O nome ganha
//    utilidade quando a moldura guarda MAIS DE UM controle — campo mais botão
//    de limpar, por exemplo —, porque aí "grupo" sozinho não diz de que o
//    botão é vizinho.
//
// 3. O ADDON NÃO TEM PAPEL NENHUM. É um compartimento de decoração, e a folha
//    diz isso na cara: `cursor: text` e `user-select: none` são de quem não é
//    controle. Um `role="group"` sem nome, aninhado dentro do grupo de
//    verdade, acrescenta um degrau que anuncia "grupo" e não informa nada.
//
// 4. CLICAR NO ADDON LEVA O FOCO AO CAMPO, e isso NÃO faz do addon um controle.
//    É atalho de PONTEIRO para o que o campo já oferece ao teclado: quem
//    navega por Tab chega ao campo direto, e não perde função nenhuma por o
//    addon não ser focável. Por isso ele não recebe `tabindex` — parada de
//    tabulação que não leva a lugar nenhum foi o custo declarado do `stepper`.
//
//    O campo é procurado pela CLASSE `.nds-input-group-control`, e não pelo
//    elemento `input`: é o que faz o atalho alcançar também a área de texto.
//
// 5. CLIQUE EM BOTÃO É DO BOTÃO. Sem essa guarda, apertar "limpar" devolveria
//    o foco ao campo no meio da ação, e o botão perderia o próprio foco.
//
// 6. SEM REGIÃO VIVA. Nada aqui se reanuncia. Quem conta o erro é o texto
//    ligado ao campo por `aria-describedby`, no momento da validação.
//
// 7. SEM ALTURA FIXA (WCAG 1.4.4). A folha usa `height: auto` no addon e tira a
//    altura do espaço interno mais a entrelinha, então a moldura cresce com o
//    tamanho de fonte do navegador. Nada aqui escreve altura.
//
// 8. ESTADO É PALAVRA, NUNCA SÓ COR (WCAG 1.4.1). Inválido é `aria-invalid` no
//    CAMPO mais um texto ligado a ele — a moldura vermelha é o eco, não o
//    aviso. Desabilitado é `disabled` de verdade, que já sai da ordem de
//    tabulação. Nada disso é aparência escrita à mão.

/** Onde o addon fica. As duas em bloco fazem o grupo virar coluna. */
export type InputGroupAlign =
  | "inline-start"
  | "inline-end"
  | "block-start"
  | "block-end"

/** Medidas do botão apertado que cabem dentro da moldura. */
export type InputGroupButtonSize = "xs" | "sm" | "icon-xs" | "icon-sm"

/** Classe do campo interno — o gancho que a folha usa para acender a moldura. */
const CONTROL_CLASS = "nds-input-group-control"

/** Seletor da moldura, usado pelo atalho de ponteiro do addon. */
const GROUP_SELECTOR = '[data-slot="input-group"]'

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      // Decisão 1: o papel fica declarado, e é ele que faz o `aria-label` de
      // quem compõe ser aceito em vez de descartado em silêncio.
      role="group"
      className={cn("nds-input-group", className)}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  align = "inline-start",
  onClick,
  ...props
}: React.ComponentProps<"div"> & { align?: InputGroupAlign }) {
  return (
    <div
      // Correção: o addon NÃO declara papel. Um agrupamento sem nome aninhado
      // dentro do grupo de verdade acrescenta um degrau que anuncia "grupo" e
      // não informa nada — decisão 3. A folha já o trata como decoração
      // (`cursor: text`, `user-select: none`).
      data-slot="input-group-addon"
      // A posição sai só de `data-align`, que é o que a folha lê. Não há classe
      // por alinhamento a escrever aqui — por isso o `cva` de variantes vazias
      // saiu: ele fingia existir uma classe por posição.
      data-align={align}
      className={cn("nds-input-group-addon", className)}
      onClick={(event) => {
        // O `onClick` de quem compõe continua valendo: declarado depois do
        // espalhamento, ele seria apagado, e o atalho sumiria sem aviso.
        onClick?.(event)

        // Decisão 5: clique em botão é do botão.
        if ((event.target as HTMLElement).closest("button")) return

        // Correção dupla, e as duas mudam o comportamento:
        //  • a busca é pela CLASSE do controle, e não pelo elemento `input` —
        //    sem isso o atalho não alcança `<textarea>`, e a composição de
        //    área de texto fica sem ele (decisão 4);
        //  • o ponto de partida é a MOLDURA por `closest`, e não
        //    `parentElement`, que quebra assim que alguém aninha um wrapper
        //    entre o addon e o grupo.
        event.currentTarget
          .closest(GROUP_SELECTOR)
          ?.querySelector<HTMLElement>(`.${CONTROL_CLASS}`)
          ?.focus()
      }}
      {...props}
    />
  )
}

/**
 * Botão apertado dentro da moldura.
 *
 * `size` é REPASSADO ao `Button` — é ele que rende `nds-button-xs` e companhia.
 * O `data-size` que estava aqui era atributo inerte: nenhuma folha do design
 * system lê `[data-size]` para `.nds-input-group-button`, então a prop prometia
 * uma medida que nunca aplicava.
 */
function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> & {
  size?: InputGroupButtonSize
  type?: "button" | "submit" | "reset"
}) {
  return (
    <Button
      data-slot="input-group-button"
      type={type}
      variant={variant}
      size={size}
      className={cn("nds-input-group-button", className)}
      {...props}
    />
  )
}

/** Palavra ou ícone dentro do addon, em cor de apoio. Decoração, sem foco. */
function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn("nds-input-group-text", className)}
      {...props}
    />
  )
}

/**
 * O campo dentro da moldura.
 *
 * A classe do controle é o que zera a moldura própria do campo, e o `data-slot`
 * é o que o `FormField` desta casa usa para achar o campo e ligar rótulo e
 * descrição. Os dois andam juntos, e por isso saem daqui juntos.
 */
function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(CONTROL_CLASS, className)}
      {...props}
    />
  )
}

/** A alternativa de várias linhas. Presente, a folha faz o grupo empilhar. */
function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(CONTROL_CLASS, className)}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
