// `PaginationFirst` e `PaginationLast` voltaram em 2026-09-23, e desta vez com
// produtor: o rodapé do DataTable compõe esta faixa e precisa dos saltos nas
// pontas. Foram removidos antes porque eram exportados e nada os renderizava —
// peça exportada que ninguém entrega é promessa que o produto não cumpre.
export { default as Pagination } from './Pagination.vue'
export { default as PaginationContent } from './PaginationContent.vue'
export { default as PaginationEllipsis } from './PaginationEllipsis.vue'
export { default as PaginationFirst } from './PaginationFirst.vue'
export { default as PaginationItem } from './PaginationItem.vue'
export { default as PaginationLast } from './PaginationLast.vue'
export { default as PaginationLink } from './PaginationLink.vue'
export { default as PaginationNext } from './PaginationNext.vue'
export { default as PaginationPrevious } from './PaginationPrevious.vue'
