# Navigation Components

---

## Breadcrumb

**Propósito**: indica a posição do usuário dentro da hierarquia de navegação e permite retornar a níveis anteriores.

**Quando usar**: páginas com hierarquia de 2 ou mais níveis. Não usar em páginas de nível único (home, login) onde não há hierarquia a representar.

**API e exemplos**: `src/components/ui/breadcrumb/breadcrumb.vue` + stories + `BreadcrumbDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
nav[aria-label="Localização na página"]
└── Breadcrumb
    └── BreadcrumbList
        ├── BreadcrumbItem
        │   └── BreadcrumbLink
        ├── BreadcrumbSeparator (ChevronRight, aria-hidden)
        └── BreadcrumbItem
            └── BreadcrumbPage (último item, aria-current="page")
```

**Regras**:
- Máximo 4 níveis visíveis — para hierarquias maiores, usar ellipsis nos níveis intermediários
- Sempre incluir link para a página inicial como primeiro item
- O último item representa a página atual — nunca é um link, nunca tem `href`
- Separador padrão: `ChevronRight` com `aria-hidden="true"` — é decorativo

**Acessibilidade**:
- `<nav aria-label="Localização na página">` envolvendo o componente — diferencia do `<nav>` da sidebar
- `aria-current="page"` no `BreadcrumbPage` — anuncia ao leitor de tela que é a página atual
- Ícones de separador com `aria-hidden="true"` — são decorativos e não devem ser lidos
- `role="list"` e `role="listitem"` aplicados automaticamente no `BreadcrumbList`

**Tema personalizado** (ver `03-sistema-design.md`):
- Os links dentro do Breadcrumb devem herdar as variáveis de cor, hover e transição definidas para o componente Link no tema personalizado — garantir consistência visual entre todos os links da aplicação

**UX Writing** (ver `19-tom-de-voz.md`):
- Labels dos itens: substantivos ou frases nominais curtas, sem verbo, sem ponto final
- Evitar abreviações — "Visão geral" em vez de "Vis. geral"
- O item atual deve refletir exatamente o `<h1>` da página

**SEO** (ver `20-seo-geo.md`):
O Breadcrumb é o único componente de navegação com impacto direto em rich snippets — o Google exibe o caminho de navegação nos resultados quando o Schema.org `BreadcrumbList` está presente. Injetar o JSON-LD via `useSeoEffect` junto com as demais metatags. O último item deve omitir o campo `item` (é a página atual).

**Analytics** (ver `21-analytics.md`):
- Rastrear apenas os itens clicáveis — nunca o item atual (último)
- Evento: `navigation_click` com `label` (texto do link) e `destination` (path)

---

## Menubar

**Propósito**: barra de menus estilo aplicação desktop, com categorias de comandos organizadas horizontalmente.

**Quando usar**: aplicações com muitas ações organizáveis em categorias — editores, ferramentas, dashboards complexos. Não usar para navegação entre páginas (usar `NavigationMenu` ou `Sidebar`).

**API e exemplos**: `src/components/ui/menubar/menubar.vue` + stories + `MenubarDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
Menubar[aria-label]
└── MenubarMenu
    ├── MenubarTrigger
    └── MenubarContent
        ├── MenubarItem
        │   └── MenubarShortcut
        └── MenubarSeparator
```

**Regras**:
- Máximo 6 menus principais na barra
- Estilo obrigatório: minimalista, sem ícones — exceto instrução específica
- Sempre implementar atalhos de teclado via `MenubarShortcut` para as ações principais
- Agrupar comandos relacionados com `MenubarSeparator` dentro de cada menu
- Labels dos menus: substantivos que categorizam os comandos ("Arquivo", "Editar", "Exibir")

**Acessibilidade**:
- `aria-label="Menu principal"` na `<Menubar>` — diferencia de outros elementos de navegação
- `role="menubar"`, `role="menu"` e `role="menuitem"` aplicados automaticamente
- Navegação por teclado gerenciada automaticamente:

| Tecla | Ação |
|-------|------|
| `Tab` / `Shift+Tab` | Move entre os menus da barra |
| `Arrow Right` / `Arrow Left` | Move entre menus na barra (quando aberto) |
| `Arrow Down` / `Enter` / `Space` | Abre o menu e foca no primeiro item |
| `Arrow Up` / `Arrow Down` | Navega entre itens do menu aberto |
| `Escape` | Fecha o menu, retorna foco ao trigger |
| `Home` / `End` | Vai para o primeiro/último item do menu |

- Atalhos no `MenubarShortcut` são apenas visuais — a lógica deve ser implementada separadamente via listener global de teclado

**UX Writing** (ver `19-tom-de-voz.md`):
- Triggers da barra: substantivos, sem verbo, sem ponto final. Ex: "Arquivo", "Editar", "Exibir"
- Itens do menu: verbos no infinitivo descrevendo a ação. Ex: "Salvar", "Abrir novo", "Exportar como PDF"
- Atalhos: usar símbolos padrão do sistema (`⌘`, `Ctrl`, `⇧`, `⌥`)

**Analytics** (ver `21-analytics.md`):
- Evento: `menu_item_click` com `label` (texto do item) e `menu` (nome do menu pai)

---

## Navigation Menu

**Propósito**: navegação horizontal top-level com suporte a submenus em painel expandido.

**Quando usar**: navegação principal em layouts sem sidebar — portais, sites institucionais, landing pages. Para aplicações com sidebar persistente, usar a `Sidebar`.

**API e exemplos**: `src/components/ui/navigation-menu/navigation-menu.vue` + stories + `NavigationMenuDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — Navigation Menu vs Sidebar**:

| Situação | Componente |
|----------|------------|
| Layout sem sidebar, navegação horizontal no topo | Navigation Menu |
| Aplicação com painel lateral persistente | Sidebar |
| Poucos itens (≤ 5) sem submenus | Links simples ou Tabs |
| Hierarquia profunda com muitas categorias | Sidebar com Accordion |

**Estrutura de subcomponentes**:

```
nav[aria-label="Navegação principal"]
└── NavigationMenu
    └── NavigationMenuList
        └── NavigationMenuItem
            ├── NavigationMenuLink (item simples)
            ├── NavigationMenuTrigger (item com submenu)
            └── NavigationMenuContent (painel do submenu)
```

**Regras**:
- Máximo 7 itens no nível principal
- Sem ícones nos itens — exceto instrução específica
- Implementar estados `hover`, `active` e `focus` em todos os itens

**Acessibilidade**:
- `<nav aria-label="Navegação principal">` envolvendo o componente
- `aria-current="page"` no item da página ativa — obrigatório, atualizar dinamicamente
- `role="navigation"`, `aria-expanded` e gerenciamento de foco nos submenus aplicados automaticamente
- Submenus fecham com `Escape` — comportamento nativo, não sobrescrever

**UX Writing** (ver `19-tom-de-voz.md`):
- Labels: substantivos ou frases nominais curtas, sem verbo, sem ponto final
- Máximo 2 palavras por item de nível principal
- Itens de submenu podem ser mais descritivos: "Cores do sistema", "Escala tipográfica"

**Analytics** (ver `21-analytics.md`):
- Evento: `navigation_click` com `label` e `destination`

---

## Pagination

**Propósito**: navegação entre páginas de um conjunto de resultados ou conteúdo paginado.

**Quando usar**: listas com mais de 10 itens onde carregar tudo de uma vez prejudicaria a performance ou a experiência. Abaixo de 10 itens, exibir tudo sem paginação.

**API e exemplos**: `src/components/ui/pagination/pagination.vue` + stories + `PaginationDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
nav[aria-label="Navegação de páginas"]
└── Pagination
    └── PaginationContent
        ├── PaginationItem
        │   └── PaginationPrevious
        ├── PaginationItem
        │   └── PaginationLink (aria-current="page" no ativo)
        ├── PaginationItem
        │   └── PaginationEllipsis (aria-hidden)
        └── PaginationItem
            └── PaginationNext
```

> **Nota de arquitetura**: `PaginationPrevious`, `PaginationNext` e `PaginationLink` renderizam elementos `<a>` por padrão. Em SPAs com roteamento baseado em estado (sem URLs reais por página), usar o padrão `asChild` para renderizar `<button>` semanticamente correto.

**Regras**:
- Sempre mostrar página atual e total (ex: "Página 3 de 12")
- Usar ellipsis (`…`) quando houver mais de 7 páginas — exibir primeira, última e as adjacentes à atual
- "Anterior" desabilitado apenas quando estiver na **primeira** página
- "Próxima" desabilitado apenas quando estiver na **última** página
- Todo o texto em português: "Anterior", "Próxima" — sem abreviações

**Acessibilidade**:
- `<nav aria-label="Navegação de páginas">` envolvendo o componente
- `aria-label="Ir para página N"` em cada botão numerado — o número sozinho não tem contexto para leitores de tela
- `aria-current="page"` na página ativa
- `aria-label="Página anterior"` e `aria-label="Próxima página"` nos botões de direção
- `aria-disabled` + `pointer-events-none` em vez de `disabled` — mantém o elemento no fluxo do Tab com feedback visual correto
- `PaginationEllipsis` com `aria-hidden="true"` — é decorativo

**UX Writing** (ver `19-tom-de-voz.md`):
- "Anterior" e "Próxima" — sem abreviações, sem ponto final
- Botões numerados: apenas o número — o contexto vem do `aria-label`
- Ellipsis: `…` (reticências tipográficas), não `...` (três pontos)

**Analytics** (ver `21-analytics.md`):
- Evento: `page_change` com `page` (página de destino) e `total_pages`
- Disparar ao confirmar a mudança, não ao clicar — evitar disparos em cliques rápidos

---

## Stepper

**Propósito**: mostrar a posição num fluxo de ordem obrigatória, e quanto ainda falta. Para seções acessíveis em qualquer ordem, use Tabs; para a posição numa hierarquia de páginas, Breadcrumb; para uma operação única de duração mensurável, Progress.

**Peças**: `Stepper`, `StepperItem`, `StepperTrigger`, `StepperIndicator`, `StepperTitle`, `StepperDescription`, `StepperSeparator`.

Sem primitivo headless: o `reka-ui` tem Stepper, e ele foi RETIRADO, e não há foco a governar nem ARIA a gerar que a marcação nativa já não anuncie. O estado de cada etapa é derivado por `provide`/`inject` — a raiz publica o valor, o item compara e resolve.

O wrapper anterior era `reka-ui`, e saiu por quatro divergências medidas no fonte compilado, duas delas intransponíveis por prop: o `StepperRoot` emite uma região viva fixa (`aria-live="polite" role="status"`, "Step N of M", em inglês cravado) que nenhuma prop desliga; o item marca `aria-current="true"` onde o token correto é `step`; a raiz e o item saíam como `div` onde a folha declara `ol`/`li`; e o nome acessível vinha cravado como "progress".

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
| `Stepper` | `@step-select` | — | Emite o número da etapa quando um gatilho disponível é acionado |
| `StepperItem` | `step` | — | Número desta etapa; obrigatório |
| `StepperItem` | `completed` | `false` | Conta como concluída mesmo estando depois da atual |
| `StepperItem` | `disabled` | `false` | Indisponível: o gatilho sai da ordem de tabulação |

Os rótulos de estado moram na RAIZ, e não no gatilho: o estado de uma etapa muda quando o fluxo avança, e uma palavra fixa por gatilho estaria errada no passo seguinte.

**Regras**:
- Entre três e seis etapas; com duas o indicador não informa nada, e acima de seis o rótulo não cabe
- O estado é DERIVADO do valor do fluxo — marcar `completed` à mão só cabe quando o fluxo aceita ordem fora do comum
- Etapa que ainda não pode ser aberta é `disabled`, não um controle focável sem destino
- Sem ouvinte de `step-select`, os gatilhos continuam focáveis e sem efeito: declare o ouvinte ou marque as etapas como indisponíveis

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

**Propósito**: alterna entre views paralelas do mesmo nível hierárquico.

**Quando usar**: conteúdos alternativos relacionados sem ordem obrigatória — detalhes de um produto, configurações por categoria, diferentes visualizações de um dado. Para sequências obrigatórias, usar `Stepper`. Para conteúdo expansível independentemente, usar `Accordion`.

**API e exemplos**: `src/components/ui/tabs/tabs.vue` + stories + `TabsDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — Tabs vs Stepper vs Accordion**:

| Situação | Componente |
|----------|------------|
| Views paralelas, qualquer ordem, sem dependência | Tabs |
| Etapas sequenciais obrigatórias | Stepper |
| Seções expansíveis independentemente | Accordion |
| Muitas seções (> 6) | Accordion ou Sidebar |

**Estrutura de subcomponentes**:

```
Tabs (defaultValue, onValueChange)
├── TabsList[aria-label]
│   └── TabsTrigger (value)
└── TabsContent (value)
```

**Regras**:
- Máximo 6 tabs por conjunto — acima disso, considerar `Accordion` ou dividir em seções
- Estilo obrigatório: tab simples padrão — exceto instrução específica
- Sem ícones nas tabs — exceto instrução específica
- A tab ativa deve ter estado visual claramente distinguível por cor e por indicador adicional (underline ou fundo) — não apenas cor

**Acessibilidade**:
- `aria-label` no `TabsList` descrevendo o que as tabs representam
- `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` e `aria-controls` aplicados automaticamente
- Navegação por teclado gerenciada automaticamente:

| Tecla | Ação |
|-------|------|
| `Arrow Right` / `Arrow Left` | Move entre tabs (roving tabindex) |
| `Home` / `End` | Vai para a primeira/última tab |
| `Enter` / `Space` | Ativa a tab focada |
| `Tab` | Move para o conteúdo do painel ativo |

- O foco vai automaticamente para o `TabsContent` ativo ao pressionar `Tab` — não adicionar `tabIndex` manual nos painéis
- Aba desabilitada: marcada com `aria-disabled`, nunca com o atributo `disabled` nativo — o botão nativamente desabilitado sai do alcance do foco e a aba nunca é anunciada. Ela permanece no percurso das setas, para ser anunciada como indisponível, e nem o clique nem Enter/Espaço a ativam.

**UX Writing** (ver `19-tom-de-voz.md`):
- Labels: substantivos ou gerúndios curtos, máximo 2 palavras, sem ponto final
- Exemplos corretos: "Visão geral", "Propriedades", "Exemplos", "Configurações"
- Exemplos incorretos: "Ver a visão geral", "Clique para ver propriedades", "Exemplos de uso do componente"
- Evitar labels genéricos: "Aba 1", "Tab A", "Outros"

**Analytics** (ver `21-analytics.md`):
- Evento: `tab_change` com `label` (texto da tab), `index` (posição base 0) e `total` (total de tabs)
- Não disparar na tab inicial — apenas nas mudanças subsequentes

---

## Regras transversais de Navigation Components

**Acessibilidade transversal**:
- Todo componente de navegação vive dentro de um `<nav>` com `aria-label` único e descritivo — nunca dois `<nav>` sem `aria-label` na mesma página
- `aria-current="page"` no item que representa a página ou estado ativo — obrigatório em Breadcrumb, Navigation Menu, Pagination e Sidebar
- Ícones decorativos dentro de componentes de navegação: sempre `aria-hidden="true"`
- Focus ring obrigatório em todos os elementos interativos: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

**Analytics transversal**:

| Componente | Evento | Payload obrigatório |
|------------|--------|---------------------|
| Breadcrumb | `navigation_click` | `label`, `destination` |
| Menubar | `menu_item_click` | `label`, `menu` |
| Navigation Menu | `navigation_click` | `label`, `destination` |
| Pagination | `page_change` | `page`, `total_pages` |
| Stepper | `step_change` | `step`, `total_steps`, `direction` |
| Tabs | `tab_change` | `label`, `index`, `total` |

**UX Writing transversal**:
- Todos os labels de navegação em português
- Substantivos e frases nominais para categorias e seções
- Verbos no infinitivo apenas em ações diretas (botões "Anterior", "Próximo", "Finalizar")
- Sem ponto final em labels de navegação
