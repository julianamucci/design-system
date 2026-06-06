# Display Components

---

## Avatar

**Propósito**: representação visual de um usuário ou entidade (foto, iniciais, ícone).

**Implementação**:
```svelte
<script lang="ts">
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
</script>

<!-- Com foto — fallback obrigatório -->
<Avatar class="h-10 w-10">
  <AvatarImage src="/foto.jpg" alt="Ana Paula Silva" />
  <AvatarFallback>AP</AvatarFallback>
</Avatar>

<!-- Sem foto — fallback com iniciais -->
<Avatar class="h-10 w-10">
  <AvatarFallback aria-label="Usuário João Souza">JS</AvatarFallback>
</Avatar>

<!-- Tamanhos customizados via class — não existe prop size -->
<Avatar class="h-6 w-6">...</Avatar>
<Avatar class="h-16 w-16">...</Avatar>
```

**Regras**:
- `AvatarImage`: `alt` obrigatório e descritivo
- `AvatarFallback`: iniciais do nome ou `aria-label` descritivo
- Tamanho: via `class="h-X w-X"` — **nunca** prop `size` (não existe)

---

## Carousel

**Propósito**: galeria horizontal de itens com navegação por slides.

**Implementação**:
```svelte
<script lang="ts">
  import {
    Carousel, CarouselContent, CarouselItem,
    CarouselNext, CarouselPrevious
  } from '$lib/components/ui/carousel';
</script>

<Carousel class="w-full max-w-sm" aria-label="Galeria de produtos">
  <CarouselContent>
    {#each items as item (item.id)}
      <CarouselItem class="basis-1/3">
        <div class="p-1">
          <Card>
            <CardContent class="flex aspect-square items-center justify-center p-6">
              {item.nome}
            </CardContent>
          </Card>
        </div>
      </CarouselItem>
    {/each}
  </CarouselContent>
  <CarouselPrevious aria-label="Slide anterior" />
  <CarouselNext aria-label="Próximo slide" />
</Carousel>
```

**Acessibilidade**:
- `aria-label` descritivo no `<Carousel>`
- `aria-label` nos botões de navegação
- `motion-reduce:animate-none` em animações personalizadas

---

## Table

**Propósito**: dados tabulares com linhas e colunas.

**Implementação**:
```svelte
<script lang="ts">
  import {
    Table, TableBody, TableCaption, TableCell,
    TableHead, TableHeader, TableRow
  } from '$lib/components/ui/table';
</script>

<Table>
  <!-- TableCaption obrigatório — pode ser sr-only -->
  <TableCaption class="sr-only">Lista de produtos disponíveis</TableCaption>
  <TableHeader>
    <TableRow>
      <!-- scope="col" obrigatório em cabeçalhos de coluna -->
      <TableHead scope="col">Produto</TableHead>
      <TableHead scope="col">Preço</TableHead>
      <TableHead scope="col">Estoque</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each produtos as produto (produto.id)}
      <TableRow>
        <TableCell>{produto.nome}</TableCell>
        <TableCell>R$ {produto.preco}</TableCell>
        <TableCell>{produto.estoque}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
```

**Acessibilidade obrigatória**:
- `TableCaption` em toda tabela (pode ser `sr-only`)
- `scope="col"` em todo `TableHead` de coluna
- `scope="row"` em `TableHead` de linha (quando aplicável)

---

## Chart

**Propósito**: visualização de dados numéricos (barras, linhas, pizza).

**Stack**: usar a biblioteca de charts configurada no projeto (por ex. Chart.js via adapter).

**Acessibilidade**:
- `aria-label` descritivo no container do chart
- Alternativa textual obrigatória (tabela de dados ou descrição no `aria-describedby`)
- Cores: nunca o único diferenciador — usar padrões (pattern, labels, legenda)

---

## DataTable

**Propósito**: tabela avançada para datasets que exigem interação — ordenação, filtros, seleção, paginação, redimensionamento, reordenação, fixação, edição inline e virtualização.

**Stack**: construída sobre **`@tanstack/table-core`** (engine headless v8) + **`@tanstack/svelte-virtual`**. Não usa o adapter `@tanstack/svelte-table` (incompatível com Svelte 5); um wrapper local em `data-table.svelte` consome `createTable` direto e expõe state via runes (`$state`).

**Implementação básica**:
```svelte
<script lang="ts">
  import { DataTable } from '$lib/components/ui/data-table';
  import type { DataTableColumn } from '$lib/components/ui/data-table';

  type Invoice = { id: string; customer: string; status: 'Pago' | 'Pendente'; amount: number };

  const invoices: Invoice[] = [/* ... */];

  const statusVariant = {
    Pago: 'default',
    Pendente: 'secondary',
  } as const;

  const columns: DataTableColumn<Invoice>[] = [
    { accessorKey: 'id', header: 'Fatura', size: 110 },
    { accessorKey: 'customer', header: 'Cliente' },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: { badgeVariant: (v) => statusVariant[v as Invoice['status']] ?? 'default' },
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      meta: {
        format: (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        cellClass: 'font-medium tabular-nums',
      },
    },
  ];
</script>

<DataTable {columns} data={invoices} enableRowSelection />
```

**Flags principais**: `enableGlobalFilter` (default `true`), `enableColumnVisibility` (default `true`), `enableColumnFilters`, `enableRowSelection`, `enableColumnResizing`, `enableColumnOrdering`, `enableColumnPinning`, `enablePagination` (default `true`), `virtualized` (desliga paginação).

**Estende `ColumnMeta` (Svelte-only)**:
- `filter?: { type: 'text' | 'select'; options?: string[] }` — input/select por coluna
- `editable?: boolean` — clique entra em edição inline
- `format?: (value, row) => string` — formata texto (sem JSX/snippet)
- `badgeVariant?: (value, row) => 'default' | 'secondary' | 'destructive' | 'outline'` — envolve a célula em `<Badge>` com a variant retornada (substitui o cell renderer de outras stacks, que esperam Snippet/JSX)
- `cellClass?: string` — classes Tailwind extras no `<td>`

**Edição inline** — marque `meta.editable` e use `onCellEdit`. O componente **não muta** o array `data`:
```svelte
<script lang="ts">
  let data = $state<Invoice[]>(invoices);

  function handleEdit(rowIndex: number, columnId: string, value: unknown) {
    data = data.map((row, i) => (i === rowIndex ? { ...row, [columnId]: value } : row));
  }
</script>

<DataTable
  columns={editableColumns}
  {data}
  onCellEdit={handleEdit}
/>
```

`Enter` confirma; `Esc` cancela.

**Virtualização** — para datasets &gt; 500 linhas:
```svelte
<DataTable
  {columns}
  data={bigData}
  virtualized
  maxHeight="400px"
  virtualRowHeight={36}
  enableColumnVisibility={false}
/>
```

**Regras**:
- Defina `columns` no top-level do `<script>` ou em `$derived` — recriar em cada update zera o estado
- Selects de filtro recebem `filterFn: 'equals'` automaticamente
- Aplica `table-fixed` em `enableColumnResizing`, `enableColumnOrdering` ou `virtualized` — evita travamento em datasets grandes
- Para markup rico (ícones, links), use `meta.badgeVariant` ou `meta.cellClass`. `cell` Snippet ainda não é suportado pelo wrapper local

**Acessibilidade**:
- Tabela semântica via `<Table>` primitive
- `aria-sort` no `<th>` ordenável (`ascending` / `descending` / `none`)
- `aria-label` contextual em todos os botões: "Ordenar por <em>coluna</em>", "Filtrar <em>coluna</em>", "Selecionar linha", "Próxima página"
- Checkbox de cabeçalho usa `indeterminate` em seleção parcial
- Handle de resize: `role="separator"` + `aria-orientation="vertical"`
