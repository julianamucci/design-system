import Root from "./dialog.svelte";
import Portal from "./dialog-portal.svelte";
import Title from "./dialog-title.svelte";
import Footer from "./dialog-footer.svelte";
import Header from "./dialog-header.svelte";
import Overlay from "./dialog-overlay.svelte";
import Content from "./dialog-content.svelte";
import Description from "./dialog-description.svelte";
import Trigger from "./dialog-trigger.svelte";
import Close from "./dialog-close.svelte";

// O motivo do fechamento é contrato do componente, não da página que o usa: sai
// pelo mesmo barril das peças, como o `dialogCloseReason()` do Vanilla sai do
// próprio `dialog.ts`.
export {
	createDialogCloseWatch,
	dialogCloseReason,
	type DialogCloseReason,
	type DialogCloseSignal,
	type DialogCloseWatch,
} from "./close-reason";

export {
	Root,
	Title,
	Portal,
	Footer,
	Header,
	Trigger,
	Overlay,
	Content,
	Description,
	Close,
	//
	Root as Dialog,
	Title as DialogTitle,
	Portal as DialogPortal,
	Footer as DialogFooter,
	Header as DialogHeader,
	Trigger as DialogTrigger,
	Overlay as DialogOverlay,
	Content as DialogContent,
	Description as DialogDescription,
	Close as DialogClose,
};
