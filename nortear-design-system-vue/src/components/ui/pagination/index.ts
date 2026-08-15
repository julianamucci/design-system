// `PaginationFirst` e `PaginationLast` foram removidos: eram exportados e nada
// os renderizava — nem story, nem docs page, nem outro componente — e a anatomia
// do conteúdo compartilhado não os lista. Peça exportada que ninguém entrega é
// promessa que o produto não cumpre.
export { default as Pagination } from './Pagination.vue'
export { default as PaginationContent } from './PaginationContent.vue'
export { default as PaginationEllipsis } from './PaginationEllipsis.vue'
export { default as PaginationItem } from './PaginationItem.vue'
export { default as PaginationLink } from './PaginationLink.vue'
export { default as PaginationNext } from './PaginationNext.vue'
export { default as PaginationPrevious } from './PaginationPrevious.vue'
