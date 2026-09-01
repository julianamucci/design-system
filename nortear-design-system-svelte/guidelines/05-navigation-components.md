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

## Stepper

**Propósito**: mostrar a posição num fluxo de ordem obrigatória, e quanto ainda falta. Para seções acessíveis em qualquer ordem, use Tabs; para a posição numa hierarquia de páginas, Breadcrumb; para uma operação única de duração mensurável, Progress.

**Peças**: `Stepper`, `StepperItem`, `StepperTrigger`, `StepperIndicator`, `StepperTitle`, `StepperDescription`, `StepperSeparator`.

Sem primitivo headless: o `bits-ui` não tem Stepper, e não há foco a governar nem ARIA a gerar que a marcação nativa já não anuncie. O estado de cada etapa é derivado por `setContext`/`getContext` com getters — a raiz publica o valor, o item compara e resolve.

**Estrutura**:

```
ol.nds-stepper                       (aria-label, data-value)
└── li.nds-stepper-item              (data-step, data-state, data-completed, data-disabled)
    ├── button.nds-stepper-trigger   (type="button", aria-current="step" só na atual)
    │   ├── span.nds-sr-only         (palavra de estado)
    │   ├── span.nds-stepper-indicator   (aria-hidden)
    │   ├── span.nds-stepper-title
    │   └── span.nds-stepper-description
    └── div.nds-stepper-separator    (aria-hidden)
```

O traço mora DENTRO do item, depois do gatilho — é isso que o faz herdar o estado do item que o precede sem regra de CSS extra.

**Props**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `Stepper` | `value` | `1` | Número da etapa atual, contando de 1 |
| `Stepper` | `aria-label` | — | Nome acessível do fluxo; obrigatório |
| `Stepper` | `labels` | `{}` | Palavras de estado (`completed`, `current`) lidas só por leitor de tela |
| `Stepper` | `onStepSelect` | — | Recebe o número da etapa quando um gatilho disponível é acionado |
| `StepperItem` | `step` | — | Número desta etapa; obrigatório |
| `StepperItem` | `completed` | `false` | Conta como concluída mesmo estando depois da atual |
| `StepperItem` | `disabled` | `false` | Indisponível: o gatilho sai da ordem de tabulação |

Os rótulos de estado moram na RAIZ, e não no gatilho: o estado de uma etapa muda quando o fluxo avança, e uma palavra fixa por gatilho estaria errada no passo seguinte.

**Regras**:
- Entre três e seis etapas; com duas o indicador não informa nada, e acima de seis o rótulo não cabe
- O estado é DERIVADO do valor do fluxo — marcar `completed` à mão só cabe quando o fluxo aceita ordem fora do comum
- Etapa que ainda não pode ser aberta é `disabled`, não um controle focável sem destino
- Sem `onStepSelect`, os gatilhos continuam focáveis e sem efeito: declare o callback ou marque as etapas como indisponíveis

**Acessibilidade**:
- A raiz é lista ordenada: a ordem e a contagem das etapas são anunciadas pela própria estrutura
- `aria-current="step"` — o token da WAI-ARIA para posição num processo — só no gatilho da etapa atual
- Estado nunca depende só de cor: a concluída troca o número por uma marca de verificação (forma) e a palavra de `labels` vai ao leitor de tela (programático)
- Indicador e traço são desenho e levam `aria-hidden="true"`
- Não há região viva: quem anuncia o avanço é o painel que trocou de conteúdo, e é para ele que a aplicação move o foco
- Etapa indisponível usa o `disabled` nativo — aqui não há navegação por setas em que ela precise ser alcançada para ser anunciada

**O gatilho é sempre um botão, e a lacuna que isso deixa**: a folha declara UMA forma de gatilho, e ela é de controle — `cursor: pointer`, `border: 0`, anel de `:focus-visible` (que só faz sentido em quem recebe foco) e `pointer-events: none` no item indisponível (regra que só existe para quem recebe ponteiro). Não há nela uma segunda forma, inerte.

Segue disso que **o design system NÃO oferece um indicador de etapas não navegável**. Oferecê-lo exigiria uma segunda forma declarada em `stepper.css`, e inventá-la sem consumidor seria desenho especulativo — hoje a única composição do catálogo que usa stepper (`onboarding`, §5.1 da guideline 17) trata a forma interativa como vantagem, e não como custo. Enquanto essa segunda forma não existir, a alternativa para um fluxo sem navegação é marcar as etapas como indisponíveis; um Stepper sem callback de seleção rende N paradas de tabulação que não levam a lugar nenhum, e isso é defeito de uso, não modo suportado.

**Analytics**: `step_change` com o número da etapa e o total no payload — valores estáveis, nunca o título traduzido.

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
- Aba desabilitada: marcada com `aria-disabled`, nunca com o atributo `disabled` nativo — o botão nativamente desabilitado sai do alcance do foco e a aba nunca é anunciada. Ela permanece no percurso das setas, para ser anunciada como indisponível, e nem o clique nem Enter/Espaço a ativam.
