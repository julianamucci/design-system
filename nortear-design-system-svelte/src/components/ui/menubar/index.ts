import Root from "./menubar.svelte";
import Menu from "./menubar-menu.svelte";
import Sub from "./menubar-sub.svelte";
import RadioGroup from "./menubar-radio-group.svelte";
import CheckboxItem from "./menubar-checkbox-item.svelte";
import Content from "./menubar-content.svelte";
import Item from "./menubar-item.svelte";
import Group from "./menubar-group.svelte";
import RadioItem from "./menubar-radio-item.svelte";
import Separator from "./menubar-separator.svelte";
import Shortcut from "./menubar-shortcut.svelte";
import SubContent from "./menubar-sub-content.svelte";
import SubTrigger from "./menubar-sub-trigger.svelte";
import Trigger from "./menubar-trigger.svelte";
import Label from "./menubar-label.svelte";
import GroupHeading from "./menubar-group-heading.svelte";
import Portal from "./menubar-portal.svelte";

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
	Root,
	CheckboxItem,
	Content,
	Item,
	RadioItem,
	Separator,
	Shortcut,
	SubContent,
	SubTrigger,
	Trigger,
	Menu,
	Group,
	Sub,
	RadioGroup,
	Label,
	GroupHeading,
	Portal,
	//
	Root as Menubar,
	CheckboxItem as MenubarCheckboxItem,
	Content as MenubarContent,
	Item as MenubarItem,
	RadioItem as MenubarRadioItem,
	Separator as MenubarSeparator,
	Shortcut as MenubarShortcut,
	SubContent as MenubarSubContent,
	SubTrigger as MenubarSubTrigger,
	Trigger as MenubarTrigger,
	Menu as MenubarMenu,
	Group as MenubarGroup,
	Sub as MenubarSub,
	RadioGroup as MenubarRadioGroup,
	Label as MenubarLabel,
	GroupHeading as MenubarGroupHeading,
	Portal as MenubarPortal,
};
