import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"

// ─── ScrollArea ───────────────────────────────────────────────────────────────
//
// SEM `type` e SEM `scrollHideDelay`. As duas props estavam declaradas aqui e
// não existem em `@base-ui/react/scroll-area` — conferido no
// `root/ScrollAreaRoot.d.ts`, cuja única prop própria é `overflowEdgeThreshold`.
// Declaradas, elas caíam no `{...props}` e chegavam ao `<div>`: `scrollHideDelay`
// virava erro de console do React a cada render e `type` virava atributo inválido
// no elemento. Prop que a lib ignora em silêncio é contrato falso — quem passava
// `type="always"` recebia o comportamento padrão e não tinha como saber.
//
// Nesta stack a barra é montada sempre que há transbordo, e o estado de ponteiro
// e de rolagem é publicado como `data-hovering` / `data-scrolling` na própria
// barra, para o CSS decidir a aparência. Não há tempo de espera a configurar.

// A altura é obrigatória: sem limite não há transbordo, e sem transbordo não há
// rolagem. `size` é a escada de janela (`--box-height-*`), e existe porque a
// alternativa praticada era cada página escolher o próprio número em `style`
// inline — 60 alturas cravadas, 20 valores distintos para dizer a mesma coisa.
// Altura fora da escada continua possível pela custom property `--box-height`,
// que a folha governa.
type ScrollAreaSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Nome acessível da região rolável. SEM PADRÃO, de propósito.
 *
 * O design system não tem como saber o que rola aqui — este é o container
 * genérico, e o nome é do CONTEÚDO que quem monta pôs dentro. Um padrão
 * genérico ("Área de rolagem") anunciaria sem informar: quem chegou por Tab
 * já sabe que rola, o que não sabe é onde entrou. Sem nome NÃO emitimos papel
 * nenhum: `aria-label` em elemento sem papel é atributo proibido, e o axe
 * acusa `aria-prohibited-attr`.
 *
 * `role="group"` e NÃO `region`, e esta escolha MUDOU — medida, não herdada.
 * Até aqui esta fábrica emitia `region`, e três das cinco stacks não emitiam
 * nome nenhum. `region` é papel de MARCO: a especificação pede que ele fique
 * reservado a seções que a pessoa vá querer navegar diretamente, e um viewport
 * que rola é recurso de layout, não seção de conteúdo. Três medidas decidiram:
 *
 * 1. o próprio conteúdo compartilhado deste componente já ensinava o contrário
 *    (`accessibility.aria.label` manda pôr o `aria-label` no container PAI
 *    quando o ScrollArea define uma região) — implementação e documentação
 *    discordavam, e quem estava certo era a documentação;
 * 2. este é o primitivo mais repetido do sistema, e só as stories de
 *    composição nomeiam cinco instâncias — cinco marcos onde não há cinco
 *    seções;
 * 3. a story de composição põe uma área nomeada DENTRO de um `<nav>` que já
 *    carrega nome, o que produzia marco dentro de marco descrevendo o mesmo
 *    conteúdo.
 *
 * O prejuízo também é assimétrico: `group` de menos custa só a entrada na
 * lista de marcos, e o nome continua sendo anunciado ao focar; `region` de
 * mais suja a navegação por marcos, que é mecanismo primário de quem lê
 * ouvindo, e quem consome não tinha como desligar. Quem quiser marco de
 * verdade envolve a área num `<section>` ou `<nav>` nomeado — que é
 * exatamente o que a documentação já manda e o que as stories já fazem.
 *
 * Quando a página tem mais de uma área nomeada, os nomes precisam ser
 * DISTINTOS: dois grupos de mesmo nome são indistinguíveis para quem navega
 * ouvindo.
 */
function ScrollArea({
  className,
  children,
  size,
  "aria-label": ariaLabel,
  ...props
}: ScrollAreaPrimitive.Root.Props & { size?: ScrollAreaSize; "aria-label"?: string }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      data-size={size}
      className={cn("nds-scroll-area", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="nds-scroll-area-viewport"
        role={ariaLabel ? "group" : undefined}
        aria-label={ariaLabel}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn("nds-scroll-area-scrollbar", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="nds-scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
