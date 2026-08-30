import Root, {
	type ComposerLabels,
	type ComposerProps,
	type ComposerSubmitOn,
} from "./composer.svelte";
import Attachments, {
	type ComposerAttachmentLabels,
} from "./composer-attachments.svelte";
import Context, {
	type ComposerContextLabels,
} from "./composer-context.svelte";
import ModelPicker, {
	type ComposerModelPickerLabels,
} from "./composer-model-picker.svelte";
import Voice, {
	type ComposerVoiceIntent,
	type ComposerVoiceLabels,
} from "./composer-voice.svelte";
import DraftRestore, {
	type DraftRestoreAction,
	type DraftRestoreLabels,
} from "./draft-restore.svelte";
// Só os TIPOS da citação saem daqui. O bloco em si é montado pelo composer, e
// não há por que quem consome montá-lo por fora: ele existe para descrever UM
// campo, e é o campo que aponta a descrição. O que atravessa a fronteira é o
// dado — quem consome o produz a partir da mensagem citada.
import type {
	ComposerQuote,
	ComposerQuoteLabels,
} from "./composer-quote.svelte";
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
	// A LISTA DE CONTEXTO. Parece a fila de anexos e não é a mesma peça: o anexo
	// é carga que sobe, o contexto é referência ao que já existe. Quem a monta é
	// o próprio composer; sai exportada porque o vocabulário dela é texto de
	// tela, e quem consome precisa do tipo para traduzi-lo.
	Context,
	//
	Context as ComposerContext,
	type ComposerContextLabels,
	// O SELETOR DE MODELO. Ele NÃO é prop do campo: é uma peça autônoma que quem
	// consome monta e põe no início do trilho, pelo mesmo espaço de qualquer
	// outro controle. Sai daqui inteiro — e não só o tipo — porque é quem
	// consome que o monta.
	ModelPicker,
	//
	ModelPicker as ComposerModelPicker,
	type ComposerModelPickerLabels,
	// O DITADO POR VOZ. Ele é AUTÔNOMO — o campo não sabe que ele existe, e quem
	// consome o põe no trilho. Sai exportado inteiro, e não só em tipo, porque é
	// quem consome que o monta.
	Voice,
	//
	Voice as ComposerVoice,
	type ComposerVoiceIntent,
	type ComposerVoiceLabels,
	// O RASCUNHO RECUPERADO. Ele é AUTÔNOMO como o ditado, e fica ACIMA do
	// campo em vez de dentro dele: o campo desenha o que se escreve agora, e a
	// faixa é uma pergunta sobre antes. Sai daqui inteiro — e não só em tipo —
	// porque é quem consome que a monta, no lugar que escolher.
	DraftRestore,
	type DraftRestoreAction,
	type DraftRestoreLabels,
	// A CITAÇÃO. O vocabulário dela é texto de tela e o dado vem de quem
	// consome, então os dois tipos saem; o bloco é montado pelo composer.
	type ComposerQuote,
	type ComposerQuoteLabels,
	// O vocabulário do seletor do caractere gatilho. A máquina — onde o gatilho
	// vale, o que ele recorta e o que fica escrito depois da escolha — vive em
	// `@shared/primitives/composer-trigger`, compartilhada pelas cinco stacks.
	type TriggerOption,
	type TriggerPopoverLabels,
	type TriggerSource,
};
