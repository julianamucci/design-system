# Navigation Components

---

## Breadcrumb

**Propósito**: indica a posição do usuário dentro da hierarquia de navegação e permite retornar a níveis anteriores.

**Quando usar**: páginas com hierarquia de 2 ou mais níveis.

**Implementação**:
```svelte
<script lang="ts">
  import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator
  } from '$lib/components/ui/breadcrumb';
  import { ChevronRight } from 'lucide-svelte';
</script>

<nav aria-label="Localização na página">
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Início</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator>
        <ChevronRight class="h-4 w-4" aria-hidden="true" />
      </BreadcrumbSeparator>
      <BreadcrumbItem>
        <BreadcrumbPage aria-current="page">Button</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</nav>
```

**Regras**:
- Máximo 4 níveis visíveis — para hierarquias maiores, usar ellipsis
- Último item: página atual — nunca é link
- Separador: `ChevronRight` com `aria-hidden="true"`

**Acessibilidade**:
- `<nav aria-label="Localização na página">` envolvendo o componente
- `aria-current="page"` no item atual

---

## Menubar

**Propósito**: barra de menus horizontais, estilo aplicativo desktop (File, Edit, View).

**Implementação**:
```svelte
<script lang="ts">
  import {
    Menubar, MenubarContent, MenubarItem, MenubarMenu,
    MenubarSeparator, MenubarShortcut, MenubarTrigger
  } from '$lib/components/ui/menubar';
</script>

<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo<MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Sair</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

---

## Navigation Menu

**Propósito**: menu de navegação horizontal para sites com múltiplas seções de nível superior.

**Quando usar**: navegação principal de sites (não de apps). Para apps, preferir Sidebar.

**Implementação**:
```svelte
<script lang="ts">
  import {
    NavigationMenu, NavigationMenuContent, NavigationMenuItem,
    NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger
  } from '$lib/components/ui/navigation-menu';
</script>

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Componentes</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink href="/button">Button</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

---

## Pagination

**Propósito**: navegar entre páginas de uma lista paginada.

**Implementação**:
```svelte
<script lang="ts">
  import {
    Pagination, PaginationContent, PaginationItem,
    PaginationLink, PaginationNext, PaginationPrevious
  } from '$lib/components/ui/pagination';

  let paginaAtual = $state(1);
</script>

<nav aria-label="Paginação dos resultados">
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious
          onclick={() => paginaAtual = Math.max(1, paginaAtual - 1)}
          aria-disabled={paginaAtual === 1}
        />
      </PaginationItem>
      <PaginationItem>
        <PaginationLink aria-current={paginaAtual === 1 ? 'page' : undefined}>1</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationNext onclick={() => paginaAtual++} />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</nav>
```

**Acessibilidade**:
- `<nav aria-label="Paginação dos resultados">` envolvendo o componente
- `aria-current="page"` na página atual
- `aria-disabled="true"` em Anterior/Próximo quando no limite

---

## Tabs

**Propósito**: organizar conteúdo em seções alternáveis sem navegar para outra página.

**Implementação**:
```svelte
<script lang="ts">
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
</script>

<Tabs defaultValue="geral">
  <TabsList>
    <TabsTrigger value="geral">Geral</TabsTrigger>
    <TabsTrigger value="avancado">Avançado</TabsTrigger>
  </TabsList>
  <TabsContent value="geral">
    <!-- Conteúdo da aba Geral -->
  </TabsContent>
  <TabsContent value="avancado">
    <!-- Conteúdo da aba Avançado -->
  </TabsContent>
</Tabs>
```

**Acessibilidade**:
- `role="tablist"`, `role="tab"`, `role="tabpanel"` aplicados automaticamente pelo Bits UI
- Navegação por teclado: Arrow Left/Right entre tabs; Tab entra no conteúdo
