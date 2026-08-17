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
//
// ─── Por que o `disabled` nativo é trocado por `aria-disabled` ───────────────
//
// Decisão da dona, a mesma já tomada no tabs: a caixa desabilitada continua
// alcançável pelo Tab e é ANUNCIADA como indisponível, em vez de sumir da
// navegação. Quem navega lendo a tela precisa saber que a opção existe e está
// bloqueada — `disabled` nativo apaga as duas informações de uma vez.
//
// O caminho não é uma prop: `CheckboxRoot` chama `useButton({ disabled, native })`
// sem repassar `focusableWhenDisabled`, então o único ramo que emitiria
// `aria-disabled` (em `useFocusableWhenDisabled`) é inalcançável a partir da API
// pública. Verificado na fonte, não na documentação.
//
// O que se faz então é retirar o atributo do DOM aqui, no render prop — que é
// ponto de extensão suportado — e MANTER `disabled` verdadeiro na lib. Isso não
// é contenção cosmética: a lib bloqueia a ativação em dois lugares que não
// dependem do atributo, e ambos foram lidos na fonte —
// `useButton().getButtonProps().onClick` faz `preventDefault(); return` e o
// `onClick` do próprio `CheckboxRoot` faz `if (readOnly || disabled) return`.
// Como no <button> nativo o Espaço vira `click` no keyup, a mesma guarda cobre
// ponteiro e teclado. Não foi preciso ouvinte em fase de captura.
function Checkbox({ className, indeterminate, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn("nds-checkbox", className)}
      indeterminate={indeterminate}
      nativeButton
      render={(rootProps, state) => {
        // `disabled` sai do DOM; `state.disabled` continua verdadeiro na lib, e
        // é ele que bloqueia a alternância. O `tabIndex={0}` que a lib já
        // escreve passa a valer, porque nada mais tira o botão da tabulação.
        const { disabled: _semAtributoNativo, ...semDisabled } =
          rootProps as typeof rootProps & { disabled?: boolean }
        return (
          <button
            type="button"
            data-state={
              state.indeterminate ? "indeterminate" : state.checked ? "checked" : "unchecked"
            }
            {...semDisabled}
            aria-disabled={state.disabled || undefined}
          />
        )
      }}
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
