// `PrevButton`/`NextButton` foram removidos: eram exportados como "old", nada os
// renderizava — nem story, nem docs page, nem outro componente — e duplicavam
// `Previous`/`Next` com markup divergente. Peça exportada que ninguém entrega é
// promessa que o produto não cumpre.
//
// `First`/`Last` nasceram em 2026-09-23 já com produtor: o rodapé do DataTable
// compõe esta faixa e precisa dos saltos nas pontas.
import Root from "./pagination.svelte";
import Content from "./pagination-content.svelte";
import Item from "./pagination-item.svelte";
import Link from "./pagination-link.svelte";
import Ellipsis from "./pagination-ellipsis.svelte";
import First from "./pagination-first.svelte";
import Last from "./pagination-last.svelte";
import Previous from "./pagination-previous.svelte";
import Next from "./pagination-next.svelte";

export {
	Root,
	Content,
	Item,
	Link,
	Ellipsis,
	First,
	Last,
	Previous,
	Next,
	//
	Root as Pagination,
	Content as PaginationContent,
	Item as PaginationItem,
	Link as PaginationLink,
	Ellipsis as PaginationEllipsis,
	First as PaginationFirst,
	Last as PaginationLast,
	Previous as PaginationPrevious,
	Next as PaginationNext,
};
