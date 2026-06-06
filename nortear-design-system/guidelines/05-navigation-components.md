# Navigation Components (Nortear — Vanilla TypeScript)

---

## Breadcrumb

**Propósito**: indica a posição do usuário na hierarquia de navegação. Use para hierarquias profundas (>2 níveis); para 1-2 níveis, prefira um botão "Voltar".

**API e exemplos**: `src/components/ui/breadcrumb.ts` + stories + `BreadcrumbDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
nav (aria-label="Localização na página")
└── ol (flex, gap em --spacing-1.5)
    ├── li
    │   └── a (item navegável)
    ├── li
    │   ├── span aria-hidden separator (/)
    │   └── a
    └── li (último item)
        ├── span aria-hidden separator
        └── span aria-current="page" (item atual, sem link)
```

**Regras**:
- `<nav>` com `aria-label` descritivo (não apenas "Breadcrumb")
- Lista ordenada (`<ol>`) — a ordem é semanticamente relevante
- Separadores são `aria-hidden="true"` (decorativos)
- Item atual: `<span aria-current="page">`, nunca `<a>`
- Gap entre itens em `--spacing-1.5` (8-grid)
- Cor: itens navegáveis em `text-muted-foreground`; item atual em `text-foreground font-medium`
- Não truncar labels — se necessário, usar overflow horizontal com scroll

**Acessibilidade**:
- `aria-label` no `<nav>` em português contextual (ex: "Localização na página")
- `aria-current="page"` exclusivo no último item

---

## Tabs

**Propósito**: organizar conteúdo em seções alternáveis no mesmo nível hierárquico. Para navegação entre páginas distintas, usar nav links.

**API e exemplos**: `src/components/ui/tabs.ts` + stories + `TabsDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Tabs (container)
├── TabList (role="tablist")
│   ├── Tab (role="tab", aria-selected, aria-controls)
│   └── Tab ...
└── TabPanels
    ├── TabPanel (role="tabpanel", aria-labelledby, hidden quando inativo)
    └── TabPanel ...
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `tabs` | — | Array `{ value, label, content }` |
| `defaultValue` | primeiro item | Tab ativo inicial |

**Regras**:
- TabList em `inline-flex` com `bg-muted` e `p-1` (8-grid)
- Cada Tab com `aria-selected` e `aria-controls` apontando ao painel
- Cada TabPanel com `aria-labelledby` apontando ao botão da tab
- Painel inativo: `hidden = true` (não usar apenas `display: none` via classe)
- Conteúdos de painel devem ter mesma altura mínima quando possível, evitando jumps no layout
- Navegação por teclado: Setas ← → entre tabs, Home/End para primeira/última

**Acessibilidade**:
- `role="tablist"`, `role="tab"`, `role="tabpanel"` obrigatórios
- Foco visível no tab ativo
- `aria-selected="true"` apenas no tab atual

**Analytics**: emitir `tab_change` com `{ from, to, label }` no clique.

---

## Pagination

**Propósito**: navegar entre páginas de uma lista paginada. Para listas curtas (<20 itens), prefira scroll contínuo.

**API e exemplos**: `src/components/ui/pagination.ts` + stories + `PaginationDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
nav (aria-label="Paginação dos resultados")
├── button "Anterior" (aria-label, disabled quando currentPage=1)
├── span / button (números de página)
└── button "Próxima" (aria-label, disabled quando currentPage=totalPages)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `currentPage` | — | Página atual (1-indexed) |
| `totalPages` | — | Total de páginas |
| `onPageChange` | — | Callback ao mudar página |

**Regras**:
- `<nav>` com `aria-label` descritivo
- Botões Anterior/Próxima sempre presentes; `disabled` nos extremos (não esconder)
- Página atual com `aria-current="page"`
- Altura dos botões em `--spacing-9` (36px); gap em `--spacing-1`
- Nunca usar emojis literais — usar ícones SVG (`ChevronLeft`, `ChevronRight`)
- Em mobile, exibir apenas controles "Anterior / X de Y / Próxima"

**Acessibilidade**:
- `aria-label` em todos os botões (ex: "Página anterior", "Página 3")
- Botões `disabled` nos extremos (não somente visualmente desativados)

**Analytics**: emitir `pagination_change` com `{ from, to, total }`.
