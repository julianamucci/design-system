import Root from "./drawer.svelte";
import Body from "./drawer-body.svelte";
import Content from "./drawer-content.svelte";
import Description from "./drawer-description.svelte";
import Overlay from "./drawer-overlay.svelte";
import Footer from "./drawer-footer.svelte";
import Header from "./drawer-header.svelte";
import Title from "./drawer-title.svelte";
import Close from "./drawer-close.svelte";
import Trigger from "./drawer-trigger.svelte";
import Portal from "./drawer-portal.svelte";

// `NestedRoot` saiu daqui junto com `drawer-nested.svelte`: era peça exportada
// que nada renderizava — nenhuma story, nenhum outro componente, nenhuma docs
// page, e drawer aninhado não aparece no conteúdo compartilhado nem em stack
// nenhuma. Promessa de API que o produto não cumpria (rule `export_sem_story`).

export {
	Root,
	Body,
	Content,
	Description,
	Overlay,
	Footer,
	Header,
	Title,
	Trigger,
	Portal,
	Close,

	//
	Root as Drawer,
	Body as DrawerBody,
	Content as DrawerContent,
	Description as DrawerDescription,
	Overlay as DrawerOverlay,
	Footer as DrawerFooter,
	Header as DrawerHeader,
	Title as DrawerTitle,
	Trigger as DrawerTrigger,
	Portal as DrawerPortal,
	Close as DrawerClose,
};
