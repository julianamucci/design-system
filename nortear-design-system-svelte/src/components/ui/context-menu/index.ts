import Root from "./context-menu.svelte";
import Sub from "./context-menu-sub.svelte";
import Trigger from "./context-menu-trigger.svelte";
import Group from "./context-menu-group.svelte";
import RadioGroup from "./context-menu-radio-group.svelte";
import Item from "./context-menu-item.svelte";
import GroupHeading from "./context-menu-group-heading.svelte";
import Content from "./context-menu-content.svelte";
import Shortcut from "./context-menu-shortcut.svelte";
import RadioItem from "./context-menu-radio-item.svelte";
import Separator from "./context-menu-separator.svelte";
import SubContent from "./context-menu-sub-content.svelte";
import SubTrigger from "./context-menu-sub-trigger.svelte";
import CheckboxItem from "./context-menu-checkbox-item.svelte";
import Label from "./context-menu-label.svelte";

// `Portal` não é reexportado: o `Content` já portaliza por dentro, então a peça
// solta só serviria para portalizar duas vezes. Nenhuma outra stack a expõe e a
// anatomia do conteúdo compartilhado não lista peça de portal.
export {
	Root,
	Sub,
	Item,
	GroupHeading,
	Label,
	Group,
	Trigger,
	Content,
	Shortcut,
	Separator,
	RadioItem,
	SubContent,
	SubTrigger,
	RadioGroup,
	CheckboxItem,
	//
	Root as ContextMenu,
	Sub as ContextMenuSub,
	Item as ContextMenuItem,
	GroupHeading as ContextMenuGroupHeading,
	Group as ContextMenuGroup,
	Content as ContextMenuContent,
	Trigger as ContextMenuTrigger,
	Shortcut as ContextMenuShortcut,
	RadioItem as ContextMenuRadioItem,
	Separator as ContextMenuSeparator,
	RadioGroup as ContextMenuRadioGroup,
	SubContent as ContextMenuSubContent,
	SubTrigger as ContextMenuSubTrigger,
	CheckboxItem as ContextMenuCheckboxItem,
	Label as ContextMenuLabel,
};
