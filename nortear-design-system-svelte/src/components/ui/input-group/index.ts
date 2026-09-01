import Root from "./input-group.svelte";
import Addon from "./input-group-addon.svelte";
import Button from "./input-group-button.svelte";
import Input from "./input-group-input.svelte";
import Text from "./input-group-text.svelte";
import Textarea from "./input-group-textarea.svelte";

export {
	Root,
	Addon,
	Button,
	Input,
	Text,
	Textarea,
	//
	Root as InputGroup,
	Addon as InputGroupAddon,
	Button as InputGroupButton,
	Input as InputGroupInput,
	Text as InputGroupText,
	Textarea as InputGroupTextarea,
};

// Os tipos saem do bloco `module` de cada peça, e não de um `cva`: a posição do
// addon e a medida do botão não têm classe própria por variante — a primeira
// mora em `[data-align]`, que a folha lê, e a segunda é repassada ao Button.
export type { InputGroupAlign } from "./input-group-addon.svelte";
export type { InputGroupButtonSize } from "./input-group-button.svelte";
