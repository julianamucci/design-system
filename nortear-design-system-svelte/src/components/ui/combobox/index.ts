import Root from './combobox.svelte';
import Label from './combobox-label.svelte';
import InputWrapper from './combobox-input-wrapper.svelte';
import Input from './combobox-input.svelte';
import Chips from './combobox-chips.svelte';
import Chip from './combobox-chip.svelte';
import ChipRemove from './combobox-chip-remove.svelte';
import Clear from './combobox-clear.svelte';
import Trigger from './combobox-trigger.svelte';
import Icon from './combobox-icon.svelte';
import Positioner from './combobox-positioner.svelte';
import Popup from './combobox-popup.svelte';
import List from './combobox-list.svelte';
import Item from './combobox-item.svelte';
import ItemIndicator from './combobox-item-indicator.svelte';
import Empty from './combobox-empty.svelte';
import Group from './combobox-group.svelte';
import GroupLabel from './combobox-group-label.svelte';
import Separator from './combobox-separator.svelte';

export {
	Root,
	Label,
	InputWrapper,
	Input,
	Chips,
	Chip,
	ChipRemove,
	Clear,
	Trigger,
	Icon,
	Positioner,
	Popup,
	List,
	Item,
	ItemIndicator,
	Empty,
	Group,
	GroupLabel,
	Separator,
	//
	Root as Combobox,
	Label as ComboboxLabel,
	InputWrapper as ComboboxInputWrapper,
	Input as ComboboxInput,
	Chips as ComboboxChips,
	Chip as ComboboxChip,
	ChipRemove as ComboboxChipRemove,
	Clear as ComboboxClear,
	Trigger as ComboboxTrigger,
	Icon as ComboboxIcon,
	Positioner as ComboboxPositioner,
	Popup as ComboboxPopup,
	List as ComboboxList,
	Item as ComboboxItem,
	ItemIndicator as ComboboxItemIndicator,
	Empty as ComboboxEmpty,
	Group as ComboboxGroup,
	GroupLabel as ComboboxGroupLabel,
	Separator as ComboboxSeparator,
};

export {
	defaultFilter,
	filterItems,
	normalizeText,
	type ComboboxFilter,
	type ComboboxOption,
} from './combobox-context.js';
