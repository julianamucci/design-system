import Scrollbar from "./scroll-area-scrollbar.svelte";
import Root from "./scroll-area.svelte";

// `Scrollbar as ScrollAreaScrollbar` saiu: nada importava esse nome — nem
// story, nem outro componente, nem docs page. Alias que ninguém usa é peça
// exportada sem entrega, e some do radar justamente por morar num index.
export {
	Root,
	Scrollbar,
	//
	Root as ScrollArea,
};
