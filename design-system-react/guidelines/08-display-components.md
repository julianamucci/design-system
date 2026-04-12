# Display Components

---

## Avatar

**Propósito**: representação visual de um usuário via foto de perfil ou iniciais como fallback.

**Estrutura de subcomponentes**:
```
Avatar
├── AvatarImage    (imagem — exibida quando carregada com sucesso)
└── AvatarFallback (fallback — exibido enquanto carrega ou quando falha)
```

**Implementação**:
```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

{/* Tamanho padrão do projeto: h-8 w-8 */}
<Avatar className="h-8 w-8">
  <AvatarImage
    src="https://github.com/shadcn.png"
    alt="Foto de perfil de João da Silva"
  />
  <AvatarFallback delayMs={600}>JS</AvatarFallback>
</Avatar>

{/* Tamanhos via className — não existe prop size */}
<Avatar className="h-6 w-6">...</Avatar>   {/* Pequeno */}
<Avatar className="h-8 w-8">...</Avatar>   {/* Padrão — preferência obrigatória */}
<Avatar className="h-10 w-10">...</Avatar>  {/* Médio */}
<Avatar className="h-12 w-12">...</Avatar>  {/* Grande */}

{/* Com indicador de status — elemento posicionado absolutamente */}
<div className="relative">
  <Avatar className="h-8 w-8">
    <AvatarImage src="..." alt="Foto de perfil de Maria" />
    <AvatarFallback>MS</AvatarFallback>
  </Avatar>
  <span
    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background"
    aria-label="Online"
  />
</div>

{/* Grupo de avatares sobrepostos */}
<div className="flex -space-x-2">
  <Avatar className="h-8 w-8 ring-2 ring-background">
    <AvatarImage src="..." alt="João" />
    <AvatarFallback>JS</AvatarFallback>
  </Avatar>
  <Avatar className="h-8 w-8 ring-2 ring-background">
    <AvatarImage src="..." alt="Maria" />
    <AvatarFallback>MS</AvatarFallback>
  </Avatar>
  <Avatar className="h-8 w-8 ring-2 ring-background bg-muted">
    <AvatarFallback className="text-xs">+3</AvatarFallback>
  </Avatar>
</div>
```

**Regras**:
- Tamanho padrão obrigatório: `h-8 w-8` — não existe prop `size`
- `AvatarFallback` obrigatório — sem ele, falha de imagem resulta em elemento vazio
- `delayMs={600}` no `AvatarFallback` — previne flash do fallback durante carregamento normal de rede
- Formato circular padrão: `rounded-full` já aplicado internamente pelo componente
- Indicador de status: elemento separado posicionado absolutamente — não é prop do Avatar

**Geração de iniciais**:
```tsx
// Regra: primeira letra do nome + primeira letra do sobrenome
function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// "João da Silva" → "JS"  (não "JO")
// "Maria"        → "MA"
// "Ana Lima"     → "AL"
```

**Acessibilidade** (ver `11-acessibilidade.md`):
- `alt` obrigatório no `AvatarImage` — sem ele, leitores de tela anunciam a URL da imagem
- Avatar informativo: `alt="Foto de perfil de [Nome]"`
- Avatar decorativo (aparência, sem identidade): `alt=""`
- `AvatarFallback` com `aria-hidden="true"` quando o nome do usuário já está visível na interface

```tsx
{/* Avatar com nome visível — fallback é decorativo */}
<div className="flex items-center gap-2">
  <Avatar className="h-8 w-8">
    <AvatarImage src="..." alt="" />
    <AvatarFallback aria-hidden="true">JS</AvatarFallback>
  </Avatar>
  <span>João da Silva</span>
</div>

{/* Avatar sem nome visível — alt descritivo obrigatório */}
<Avatar className="h-8 w-8">
  <AvatarImage src="..." alt="Foto de perfil de João da Silva" />
  <AvatarFallback>JS</AvatarFallback>
</Avatar>
```

**Analytics**: Avatar sem ação não dispara eventos. Avatar clicável (link para perfil): `button_click` ou `navigation_click` com `label`.

---

## Carousel

**Propósito**: exibição sequencial de itens (imagens, cards) em container com navegação.

**Estrutura de subcomponentes**:
```
Carousel (opts, plugins, orientation, setApi)
├── CarouselContent
│   ├── CarouselItem
│   └── CarouselItem
├── CarouselPrevious
└── CarouselNext
```

> O Carousel do Shadcn é construído sobre **Embla Carousel**. Auto-play e dots de navegação **não são nativos** — requerem implementações separadas documentadas abaixo.

**Implementação básica**:
```tsx
import {
  Carousel, CarouselContent, CarouselItem,
  CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel"

{/* Preferência obrigatória: sempre exibir controles de navegação */}
<Carousel className="w-full max-w-lg">
  <CarouselContent>
    <CarouselItem>
      <div className="p-4">Item 1</div>
    </CarouselItem>
    <CarouselItem>
      <div className="p-4">Item 2</div>
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>
```

**Tamanho dos itens** — via `basis-*` no `CarouselItem`:
```tsx
{/* 1 item por vez — padrão */}
<CarouselItem>...</CarouselItem>

{/* 2 itens por vez */}
<CarouselItem className="basis-1/2">...</CarouselItem>

{/* 3 itens por vez */}
<CarouselItem className="basis-1/3">...</CarouselItem>

{/* Responsivo */}
<CarouselItem className="md:basis-1/2 lg:basis-1/3">...</CarouselItem>
```

**Espaçamento entre itens** — padrão específico do Embla:
```tsx
{/* Espaçamento: pl-* no item + -ml-* no content */}
<CarouselContent className="-ml-4">
  <CarouselItem className="pl-4">...</CarouselItem>
  <CarouselItem className="pl-4">...</CarouselItem>
</CarouselContent>
```

**Auto-play** — requer plugin externo:
```tsx
import Autoplay from "embla-carousel-autoplay"

<Carousel
  plugins={[
    Autoplay({ delay: 3000, stopOnInteraction: true })
  ]}
  opts={{ loop: true }}
>
  ...
</Carousel>
```

**Dots de navegação** — implementação via `CarouselApi`:
```tsx
import { type CarouselApi } from "@/components/ui/carousel"

const [api, setApi] = useState<CarouselApi>()
const [current, setCurrent] = useState(0)
const [count, setCount] = useState(0)

useEffect(() => {
  if (!api) return
  setCount(api.scrollSnapList().length)
  setCurrent(api.selectedScrollSnap())
  api.on("select", () => setCurrent(api.selectedScrollSnap()))
}, [api])

<Carousel setApi={setApi} opts={{ loop: true }}>
  <CarouselContent>...</CarouselContent>
  <CarouselPrevious aria-label="Item anterior" />
  <CarouselNext aria-label="Próximo item" />
</Carousel>

{/* Dots de navegação — implementação customizada */}
<div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Slides do carrossel">
  {Array.from({ length: count }).map((_, i) => (
    <button
      key={i}
      role="tab"
      aria-selected={i === current}
      aria-label={`Ir para slide ${i + 1} de ${count}`}
      onClick={() => api?.scrollTo(i)}
      className={cn(
        "h-2 w-2 rounded-full transition-colors",
        i === current ? "bg-primary" : "bg-muted-foreground/30"
      )}
    />
  ))}
</div>
```

**Opções do Embla** (via prop `opts`):
```tsx
<Carousel opts={{ loop: true, align: "start" }}>
```

**Regras**:
- Sempre exibir `CarouselPrevious` e `CarouselNext` — exceto instrução específica
- `loop: true` para carrosséis com auto-play — evita parada abrupta no último item
- `stopOnInteraction: true` no Autoplay — para ao usuário interagir
- `aria-label` obrigatório nos botões de navegação

**Acessibilidade** (ver `11-acessibilidade.md`):
- O Shadcn aplica `role="group"` e `aria-roledescription="slide"` em cada `CarouselItem`
- `CarouselPrevious` e `CarouselNext` devem ter `aria-label` descritivo
- Touch/swipe nativo do Embla — alternativa por teclado via Arrow keys nos botões de navegação
- `motion-reduce`: o Embla respeita `prefers-reduced-motion` automaticamente para transições

**Analytics** (ver `21-analytics.md`):
```tsx
useEffect(() => {
  if (!api) return
  api.on("select", () => {
    track("slide_change", {
      component: "carousel",
      location: currentPage,
      index: api.selectedScrollSnap(),
      total: api.scrollSnapList().length,
      trigger: "button" // ou "swipe" — detectar via evento de pointer
    })
  })
}, [api])
```

---

## Chart

**Propósito**: visualização de dados quantitativos via gráficos construídos com Recharts, integrados ao sistema de design via tokens de cor.

> O Shadcn Chart é uma **camada de componentes sobre Recharts** — não substitui o Recharts, complementa com integração de tema e acessibilidade. É necessário usar `ChartContainer` e `ChartConfig` do Shadcn; usar Recharts diretamente não aplica os tokens de cor.

**Estrutura obrigatória**:
```tsx
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartConfig, ChartContainer,
  ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
} from "@/components/ui/chart"
```

**`ChartConfig`** — objeto de configuração de cores e labels (desacoplado dos dados):
```tsx
const chartConfig = {
  desktop: {
    label: "Desktop",         // Label exibida no tooltip e na legenda
    color: "var(--chart-1)", // Token de cor do projeto
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig
```

**Implementação — BarChart**:
```tsx
<ChartContainer
  config={chartConfig}
  className="h-[300px] w-full"
  aria-label="Gráfico de barras: acessos mensais por dispositivo"
>
  <BarChart accessibilityLayer data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis
      dataKey="month"
      tickLine={false}
      tickMargin={10}
      axisLine={false}
      tickFormatter={(value) => value.slice(0, 3)}
    />
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend content={<ChartLegendContent />} />
    {/* Cores via var(--color-[key]) — gerado pelo ChartContainer a partir do ChartConfig */}
    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
    <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
  </BarChart>
</ChartContainer>

{/* Alternativa textual para leitores de tela — obrigatória */}
<p className="sr-only">
  Gráfico de barras mostrando acessos mensais. Janeiro: 186 desktop, 80 mobile.
  Fevereiro: 305 desktop, 200 mobile. Maior valor em fevereiro com 305 acessos desktop.
</p>
```

**Tokens de cor** (definidos no projeto — ver `16-padroes-design-sistema.md`):

| Token | Uso |
|-------|-----|
| `var(--chart-1)` | Primeira série de dados |
| `var(--chart-2)` | Segunda série |
| `var(--chart-3)` | Terceira série |
| `var(--chart-4)` | Quarta série |
| `var(--chart-5)` | Quinta série |

> As variáveis `var(--color-[key])` dentro do gráfico são **geradas automaticamente** pelo `ChartContainer` a partir do `ChartConfig`. Não usar os tokens `--chart-*` diretamente dentro do SVG — usar `var(--color-desktop)`, `var(--color-mobile)` etc.

**Regras**:
- `ChartContainer` obrigatório — sem ele os tokens de cor não funcionam
- `ChartConfig` obrigatório — define labels e mapeia chaves de dados para cores do tema
- `accessibilityLayer` obrigatório no componente Recharts raiz (BarChart, LineChart, etc.) — ativa navegação por teclado no gráfico
- `ChartTooltip` com `ChartTooltipContent` — usa o estilo do design system automaticamente
- `ChartLegend` com `ChartLegendContent` — consistente com o tema
- Legends sempre visíveis para gráficos com múltiplas séries

**Acessibilidade** (ver `11-acessibilidade.md`):
- `aria-label` no `ChartContainer` descrevendo o gráfico
- `<p className="sr-only">` com resumo textual dos dados principais — obrigatório para gráficos complexos
- `accessibilityLayer` no componente Recharts ativa navegação por Arrow keys
- **Daltonismo**: nunca diferenciar séries apenas por cor — usar também padrões visuais (tracejado, pontilhado em linhas) ou `ChartLegend` com labels claros
- `motion-reduce`: animações do Recharts podem ser desativadas via prop `isAnimationActive={false}` nos elementos de dados

```tsx
{/* Gráfico sem animação para prefers-reduced-motion */}
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

<Bar
  dataKey="desktop"
  fill="var(--color-desktop)"
  isAnimationActive={!prefersReducedMotion}
/>
```

**Analytics**: gráfico em si não dispara eventos padrão. Interações específicas (hover de tooltip, clique em legenda) podem ser rastreadas via callbacks do Recharts quando relevante para o produto.

---

## Table

**Propósito**: exibição de dados tabulares estruturados com semântica HTML correta.

**Estrutura de subcomponentes**:
```
Table
├── TableCaption    (descrição da tabela — lida por leitores de tela)
├── TableHeader
│   └── TableRow
│       └── TableHead (th — cabeçalho de coluna)
├── TableBody
│   └── TableRow
│       └── TableCell (td — célula de dados)
└── TableFooter
    └── TableRow
        └── TableCell (totais, sumários)
```

**Implementação**:
```tsx
import {
  Table, TableBody, TableCaption, TableCell,
  TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

{/* Wrapper obrigatório para scroll horizontal em mobile */}
<div className="overflow-x-auto rounded-md border border-border">
  <Table>
    {/* Caption: obrigatório — pode ser sr-only se visualmente redundante */}
    <TableCaption className="sr-only">
      Lista de faturas recentes do usuário
    </TableCaption>

    <TableHeader>
      <TableRow>
        {/* scope="col" obrigatório para acessibilidade */}
        <TableHead scope="col" className="w-[120px]">Fatura</TableHead>
        <TableHead scope="col">Status</TableHead>
        <TableHead scope="col">Método</TableHead>
        <TableHead scope="col" className="text-right">Valor</TableHead>
        <TableHead scope="col" className="w-[80px]">
          <span className="sr-only">Ações</span>
        </TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      {data.length === 0 ? (
        {/* Estado vazio — obrigatório */}
        <TableRow>
          <TableCell
            colSpan={5}
            className="h-24 text-center text-muted-foreground"
          >
            Nenhuma fatura encontrada.
          </TableCell>
        </TableRow>
      ) : (
        data.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Ações para fatura ${invoice.id}`}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                ...
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>

    <TableFooter>
      <TableRow>
        <TableCell colSpan={3} className="font-medium">Total</TableCell>
        <TableCell className="text-right font-medium">R$1.250,00</TableCell>
        <TableCell />
      </TableRow>
    </TableFooter>
  </Table>
</div>
```

**Regras**:
- `<div className="overflow-x-auto">` envolvendo a tabela — scroll horizontal em mobile obrigatório
- `TableCaption` obrigatório — pode ser `sr-only` quando o contexto visual já é claro
- `scope="col"` em todos os `TableHead` — associa cabeçalhos às células para leitores de tela
- Estado vazio obrigatório — nunca tabela vazia sem mensagem
- `aria-label` contextual nos botões de ação por linha — "Ações para fatura INV001"
- `TableFooter` para totais e sumários — não usar linha de body para isso

**Ordenação e filtros** — requer `@tanstack/react-table`:

O `Table` do Shadcn é apenas a camada visual (HTML semântico + estilo). Para ordenação, filtragem, seleção de linhas e paginação robustas, usar `@tanstack/react-table` em conjunto. O Shadcn documenta o padrão completo em sua seção **Data Table**.

```tsx
// Integração básica com @tanstack/react-table
import { useReactTable, getCoreRowModel, getSortedRowModel } from "@tanstack/react-table"

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

// TableHead com aria-sort dinâmico — obrigatório para acessibilidade
{table.getHeaderGroups().map((headerGroup) => (
  <TableRow key={headerGroup.id}>
    {headerGroup.headers.map((header) => {
      const sorted = header.column.getIsSorted()
      return (
        <TableHead
          key={header.id}
          scope="col"
          aria-sort={
            sorted === "asc" ? "ascending"
            : sorted === "desc" ? "descending"
            : header.column.getCanSort() ? "none"
            : undefined
          }
          onClick={header.column.getToggleSortingHandler()}
          className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {sorted === "asc" && <ChevronUp className="ml-1 h-3 w-3 inline" aria-hidden="true" />}
          {sorted === "desc" && <ChevronDown className="ml-1 h-3 w-3 inline" aria-hidden="true" />}
        </TableHead>
      )
    })}
  </TableRow>
))}
```

**Paginação**: acima de 20 linhas, usar `Pagination` com `getPaginationRowModel()` do TanStack Table.

**Acessibilidade** (ver `11-acessibilidade.md`):
- `TableCaption` lida pelos leitores de tela antes das células — descreve o propósito da tabela
- `scope="col"` em `TableHead` — obrigatório para mapear cabeçalhos às células
- Botões de ação por linha: `aria-label` contextual incluindo o identificador da linha
- Ordenação: `aria-sort="ascending"` / `"descending"` / `"none"` nos `TableHead` com ordenação ativa
- Tabela dentro de `overflow-x-auto`: adicionar `tabIndex={0}` no wrapper para scroll horizontal por teclado

**UX Writing** (ver `19-tom-de-voz.md`):
- Cabeçalhos de coluna: substantivos curtos, sem ponto final, capitalização na primeira palavra
- Estado vazio: "Nenhum [item] encontrado." — tom encorajador quando há CTA disponível
- Botão de ação: `aria-label` contextual — "Editar fatura INV001", não apenas "Editar"

**Analytics**: a tabela em si não dispara eventos. Ações dentro da tabela (botões, ordenação) seguem os eventos do componente correspondente (`button_click`, `navigation_click`).

---

## Regras transversais de Display Components

**Acessibilidade transversal** (ver `11-acessibilidade.md`):
- `AvatarImage`: `alt` obrigatório em todos os casos (descritivo ou vazio para decorativo)
- `Chart`: `aria-label` no `ChartContainer` + `<p className="sr-only">` com resumo dos dados
- `Table`: `TableCaption` obrigatório + `scope="col"` nos cabeçalhos
- Carousel: `aria-label` nos botões de navegação
- `motion-reduce`: Chart via `isAnimationActive={false}`, Carousel via comportamento nativo do Embla

**Analytics transversal** (ver `21-analytics.md`):

| Componente | Evento | Quando |
|------------|--------|--------|
| Carousel | `slide_change` | A cada mudança de slide |
| Avatar clicável | `button_click` ou `navigation_click` | Ao clicar |
| Chart | — | Passivo, sem eventos padrão |
| Table | — | Passivo; ações internas rastreadas pelos componentes de ação |