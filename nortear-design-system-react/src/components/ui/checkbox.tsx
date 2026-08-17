import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon, MinusIcon } from "lucide-react"

// Estilo via .nds-checkbox (docs/shared/styles/nds/checkbox.css) — estados
// base-ui (data-checked/data-disabled) e hit-area expandida no CSS.
//
// `indeterminate` é lido aqui (não só repassado) porque o Indicator do
// base-ui não desenha um traço sozinho no estado misto — ele mantém o mesmo
// filho montado. Sem essa leitura, o indeterminate pintava o fundo certo
// (CSS) mas exibia a marca de seleção em vez do traço.
//
// ─── Por que `nativeButton` + `render={<button>}` ────────────────────────────
//
// Por padrão o CheckboxRoot renderiza um <span role="checkbox"> e um <input>
// escondido ao lado — e manda o `id` do consumidor para o INPUT, não para o
// span (`id: nativeButton ? inputId : id` em CheckboxRoot). O efeito medido:
// `label[for]` caía no input oculto, o nome acessível só existia porque a lib
// injetava um `aria-labelledby` de reserva escrevendo um `id` no <label> alheio,
// e `getElementById` devolvia um elemento que ninguém vê.
//
// Com `nativeButton`, a mesma linha da lib passa a aplicar o `id` no elemento
// visível, e a associação volta a ser a nativa do HTML: o <button> é controle
// rotulável, então o rótulo o nomeia, o clique no texto move o foco para ele e
// dispara a ativação. É o mesmo elemento que Vue, Svelte e Angular já usavam.
//
// `data-state` vem do render prop porque o base-ui é a única das cinco stacks
// que não o emite (ele usa data-checked/data-indeterminate). O CSS aceita os
// dois, mas a paridade de markup é o que a auditoria cross-stack compara.
function Checkbox({ className, indeterminate, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn("nds-checkbox", className)}
      indeterminate={indeterminate}
      nativeButton
      render={(rootProps, state) => (
        <button
          type="button"
          data-state={
            state.indeterminate ? "indeterminate" : state.checked ? "checked" : "unchecked"
          }
          {...rootProps}
        />
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="nds-checkbox-indicator"
      >
        {indeterminate ? <MinusIcon /> : <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
