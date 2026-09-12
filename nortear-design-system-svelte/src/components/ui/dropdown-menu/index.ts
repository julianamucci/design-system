import Root from "./dropdown-menu.svelte";
import Sub from "./dropdown-menu-sub.svelte";
import CheckboxItem from "./dropdown-menu-checkbox-item.svelte";
import Content from "./dropdown-menu-content.svelte";
import Group from "./dropdown-menu-group.svelte";
import Item from "./dropdown-menu-item.svelte";
import Label from "./dropdown-menu-label.svelte";
import RadioGroup from "./dropdown-menu-radio-group.svelte";
import RadioItem from "./dropdown-menu-radio-item.svelte";
import Separator from "./dropdown-menu-separator.svelte";
import Shortcut from "./dropdown-menu-shortcut.svelte";
import Trigger from "./dropdown-menu-trigger.svelte";
import SubContent from "./dropdown-menu-sub-content.svelte";
import SubTrigger from "./dropdown-menu-sub-trigger.svelte";
import GroupHeading from "./dropdown-menu-group-heading.svelte";
import Portal from "./dropdown-menu-portal.svelte";

// O motivo do fechamento é contrato do componente, não da página que o usa: sai
// pelo mesmo barril das peças. O tradutor é UM para a família inteira — o
// ContextMenu, o DropdownMenu e o Menubar fecham pelos mesmos caminhos e
// escrevem a mesma palavra no GA4.
export {
	createMenuCloseWatch,
	menuCloseReason,
	type MenuCloseReason,
	type MenuCloseSignal,
	type MenuCloseWatch,
	type MenuCloseWatchOptions,
} from "../menu-close-reason";

export {
	CheckboxItem,
	Content,
	Portal,
	Root as DropdownMenu,
	CheckboxItem as DropdownMenuCheckboxItem,
	Content as DropdownMenuContent,
	Portal as DropdownMenuPortal,
	Group as DropdownMenuGroup,
	Item as DropdownMenuItem,
	Label as DropdownMenuLabel,
	RadioGroup as DropdownMenuRadioGroup,
	RadioItem as DropdownMenuRadioItem,
	Separator as DropdownMenuSeparator,
	Shortcut as DropdownMenuShortcut,
	Sub as DropdownMenuSub,
	SubContent as DropdownMenuSubContent,
	SubTrigger as DropdownMenuSubTrigger,
	Trigger as DropdownMenuTrigger,
	GroupHeading as DropdownMenuGroupHeading,
	Group,
	GroupHeading,
	Item,
	Label,
	RadioGroup,
	RadioItem,
	Root,
	Separator,
	Shortcut,
	Sub,
	SubContent,
	SubTrigger,
	Trigger,
};
