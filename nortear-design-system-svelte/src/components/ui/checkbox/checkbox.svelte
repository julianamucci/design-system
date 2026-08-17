<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import CheckIcon from '@lucide/svelte/icons/check';
	import MinusIcon from '@lucide/svelte/icons/minus';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<!--
  ─── Por que o botão é renderizado aqui, e não pelo primitivo ────────────────

  Decisão da dona, a mesma já tomada no tabs: a caixa desabilitada continua
  alcançável pelo Tab e é ANUNCIADA como indisponível, em vez de sumir da
  navegação. `disabled` nativo apaga as duas informações de uma vez.

  O primitivo escreve `disabled: trueDisabled` nos próprios props e é ele quem
  monta o <button>; o merge dele resolve conflito pelo ÚLTIMO valor, e os props
  do primitivo entram por último — não há como sobrescrever de fora. O ponto de
  extensão suportado para isso é o snippet `child`, que entrega os props e passa
  a montagem do elemento para cá.

  O `disabled` continua VERDADEIRO na lib de propósito: a guarda que bloqueia a
  alternância não é o atributo, é `if (this.trueDisabled || this.trueReadonly)
  return` no `onclick` E no `onkeydown` do estado do primitivo — lido na fonte.
  Só o atributo sai do DOM; o bloqueio fica.
-->
<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		"nds-checkbox",
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet child({ props, checked, indeterminate })}
		{@const { disabled: desabilitado, ...semDisabled } = props}
		<button
			{...semDisabled}
			aria-disabled={desabilitado ? 'true' : undefined}
		>
			<div
				data-slot="checkbox-indicator"
				class="nds-checkbox-indicator"
			>
				{#if checked}
					<CheckIcon  />
				{:else if indeterminate}
					<MinusIcon  />
				{/if}
			</div>
		</button>
	{/snippet}
</CheckboxPrimitive.Root>
