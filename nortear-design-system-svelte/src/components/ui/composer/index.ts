import Root, {
	type ComposerLabels,
	type ComposerProps,
	type ComposerSubmitOn,
} from "./composer.svelte";
import type {
	TriggerOption,
	TriggerPopoverLabels,
	TriggerSource,
} from "./composer-trigger-popover.svelte";

export {
	Root,
	//
	Root as Composer,
	type ComposerLabels,
	type ComposerProps,
	type ComposerSubmitOn,
	// O vocabulário do seletor do caractere gatilho. A máquina — onde o gatilho
	// vale, o que ele recorta e o que fica escrito depois da escolha — vive em
	// `@shared/primitives/composer-trigger`, compartilhada pelas cinco stacks.
	type TriggerOption,
	type TriggerPopoverLabels,
	type TriggerSource,
};
