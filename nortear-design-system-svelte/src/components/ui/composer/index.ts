import Root, {
	type ComposerLabels,
	type ComposerProps,
	type ComposerSubmitOn,
} from "./composer.svelte";
import Attachments, {
	type ComposerAttachmentLabels,
} from "./composer-attachments.svelte";
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
	// A FILA DE ANEXOS. Ela mora dentro da moldura do campo, e quem a monta é o
	// próprio composer; sai exportada porque o vocabulário dela é texto de tela,
	// e quem consome precisa do tipo para traduzi-lo.
	Attachments,
	//
	Attachments as ComposerAttachments,
	type ComposerAttachmentLabels,
	// O vocabulário do seletor do caractere gatilho. A máquina — onde o gatilho
	// vale, o que ele recorta e o que fica escrito depois da escolha — vive em
	// `@shared/primitives/composer-trigger`, compartilhada pelas cinco stacks.
	type TriggerOption,
	type TriggerPopoverLabels,
	type TriggerSource,
};
