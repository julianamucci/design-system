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
