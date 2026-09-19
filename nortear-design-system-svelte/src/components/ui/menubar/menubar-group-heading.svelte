<script lang="ts">
	import type { ComponentProps } from "svelte";
	import MenubarLabel from "./menubar-label.svelte";

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof MenubarLabel> = $props();
</script>

<!--
	`GroupHeading` é o nome que a lib dá ao cabeçalho de grupo, e esta stack o
	publica desde antes do `Label` nomear o grupo. Hoje as duas peças são UMA:
	este arquivo delega ao `Label`, que dentro de `Group`/`RadioGroup` já é o
	cabeçalho da lib (ver `menu-group-context.ts`). Mesmo markup e mesmo
	`data-slot` (`menubar-label`, o das outras quatro stacks) — antes o cabeçalho
	saía como `menubar-group-heading` e com `role="group"` no próprio rótulo, e o
	mesmo menu tinha dois desenhos de rótulo conforme a peça escolhida.

	Segue exportado porque é API publicada; fora de um grupo não lança erro, como
	o cabeçalho cru da lib lançaria — desenha o rótulo solto, igual ao `Label`.
	Mesma forma do `context-menu-group-heading.svelte`.
-->
<MenubarLabel bind:ref {...restProps} />
