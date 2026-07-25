# Navigation Components

---

## Breadcrumb

**Propósito**: indica a posição do usuário dentro da hierarquia de navegação e permite retornar a níveis anteriores — usar em páginas com hierarquia de 2 ou mais níveis.

**API e exemplos**: `src/components/ui/breadcrumb/breadcrumb.svelte` + stories + `BreadcrumbDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
<nav aria-label="Localização na página">
└── Breadcrumb
    └── BreadcrumbList
        ├── BreadcrumbItem
        │   └── BreadcrumbLink
        ├── BreadcrumbSeparator (ChevronRight aria-hidden)
        └── BreadcrumbItem
            └── BreadcrumbPage (último item, aria-current="page")
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

**API e exemplos**: `src/components/ui/menubar/menubar.svelte` + stories + `MenubarDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Menubar
└── MenubarMenu
    ├── MenubarTrigger
    └── MenubarContent
        ├── MenubarItem
        │   └── MenubarShortcut
        └── MenubarSeparator
```

---

## Navigation Menu

**Propósito**: menu de navegação horizontal para sites com múltiplas seções de nível superior. Para apps, preferir Sidebar.

**API e exemplos**: `src/components/ui/navigation-menu/navigation-menu.svelte` + stories + `NavigationMenuDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
NavigationMenu
└── NavigationMenuList
    └── NavigationMenuItem
        ├── NavigationMenuTrigger
        └── NavigationMenuContent
            └── NavigationMenuLink
```

---

## Pagination

**Propósito**: navegar entre páginas de uma lista paginada.

**API e exemplos**: `src/components/ui/pagination/pagination.svelte` + stories + `PaginationDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
<nav aria-label="Paginação dos resultados">
└── Pagination
    └── PaginationContent
        ├── PaginationItem → PaginationPrevious
        ├── PaginationItem → PaginationLink (aria-current="page" no atual)
        └── PaginationItem → PaginationNext
```

**Acessibilidade**:
- `<nav aria-label="Paginação dos resultados">` envolvendo o componente
- `aria-current="page"` na página atual
- `aria-disabled="true"` em Anterior/Próximo quando no limite

---

## Tabs

**Propósito**: organizar conteúdo em seções alternáveis sem navegar para outra página.

**API e exemplos**: `src/components/ui/tabs/tabs.svelte` + stories + `TabsDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Tabs (defaultValue)
├── TabsList
│   ├── TabsTrigger (value)
│   └── TabsTrigger (value)
├── TabsContent (value)
└── TabsContent (value)
```

**Acessibilidade**:
- `role="tablist"`, `role="tab"`, `role="tabpanel"` aplicados automaticamente pelo Bits UI
- Navegação por teclado: Arrow Left/Right entre tabs; Tab entra no conteúdo
