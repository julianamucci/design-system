# Navigation Components

---

## Breadcrumb

**Propósito**: indica a posição do usuário dentro da hierarquia de navegação e permite retornar a níveis anteriores.

**Quando usar**: páginas com hierarquia de 2 ou mais níveis. Não usar em páginas de nível único (home, login) onde não há hierarquia a representar.

**Implementação**:
```tsx
<nav aria-label="Localização na página">
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Início</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </BreadcrumbSeparator>
      <BreadcrumbItem>
        <BreadcrumbLink href="/componentes">Componentes</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </BreadcrumbSeparator>
      <BreadcrumbItem>
        {/* Último item: página atual — não é link */}
        <BreadcrumbPage aria-current="page">Button</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</nav>
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
- O Shadcn/UI aplica `role="list"` e `role="listitem"` automaticamente no `BreadcrumbList`

**Tema personalizado** (ver `03-sistema-design.md`):
- Os links dentro do Breadcrumb devem herdar as variáveis de cor, hover e transição definidas para o componente Link no tema personalizado — garantir consistência visual entre todos os links da aplicação

**UX Writing** (ver `19-tom-de-voz.md`):
- Labels dos itens: substantivos ou frases nominais curtas, sem verbo, sem ponto final
- Evitar abreviações — "Visão geral" em vez de "Vis. geral"
- O item atual deve refletir exatamente o `<h1>` da página

**SEO** (ver `20-seo-geo.md`):
O Breadcrumb é o único componente de navegação com impacto direto em rich snippets — o Google exibe o caminho de navegação nos resultados de busca quando o Schema.org `BreadcrumbList` está presente.

```tsx
// Injetar via useEffect junto com as demais metatags da página
useEffect(() => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Início",
        "item": "https://exemplo.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Componentes",
        "item": "https://exemplo.com/componentes"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Button"
        // Sem "item" no último nível — é a página atual
      }
    ]
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "breadcrumb-schema";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);

  return () => {
    document.getElementById("breadcrumb-schema")?.remove();
  };
}, [currentPage]);
```

**Analytics** (ver `21-analytics.md`):
- Rastrear apenas os itens clicáveis — nunca o item atual (último)
- Evento: `navigation_click` com `label` (texto do link) e `destination` (path)

```tsx
<BreadcrumbLink
  href="/componentes"
  onClick={() => track("navigation_click", {
    component: "breadcrumb",
    location: currentPage,
    label: "Componentes",
    destination: "/componentes"
  })}
>
  Componentes
</BreadcrumbLink>
```

---

## Menubar

**Propósito**: barra de menus estilo aplicação desktop, com categorias de comandos organizadas horizontalmente.

**Quando usar**: aplicações com muitas ações organizáveis em categorias — editores, ferramentas, dashboards complexos. Não usar para navegação entre páginas (usar `NavigationMenu` ou `Sidebar`).

**Implementação**:
```tsx
<Menubar aria-label="Menu principal">
  <MenubarMenu>
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
      <MenubarItem>Abrir <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Salvar <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
      <MenubarItem>Refazer <MenubarShortcut>⌘Y</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

**Regras**:
- Máximo 6 menus principais na barra
- Estilo obrigatório: minimalista, sem ícones — exceto instrução específica
- Sempre implementar atalhos de teclado via `MenubarShortcut` para as ações principais
- Agrupar comandos relacionados com `MenubarSeparator` dentro de cada menu
- Labels dos menus: substantivos que categorizam os comandos ("Arquivo", "Editar", "Exibir")

**Acessibilidade**:
- `aria-label="Menu principal"` na `<Menubar>` — diferencia de outros elementos de navegação
- O Shadcn/UI aplica `role="menubar"`, `role="menu"` e `role="menuitem"` automaticamente
- Navegação por teclado — o Radix UI gerencia automaticamente:

| Tecla | Ação |
|-------|------|
| `Tab` / `Shift+Tab` | Move entre os menus da barra |
| `Arrow Right` / `Arrow Left` | Move entre menus na barra (quando aberto) |
| `Arrow Down` / `Enter` / `Space` | Abre o menu e foca no primeiro item |
| `Arrow Up` / `Arrow Down` | Navega entre itens do menu aberto |
| `Escape` | Fecha o menu, retorna foco ao trigger |
| `Home` / `End` | Vai para o primeiro/último item do menu |

- Atalhos de teclado documentados no `MenubarShortcut` são apenas visuais — a lógica do atalho deve ser implementada separadamente via `useEffect` + `addEventListener`

**UX Writing** (ver `19-tom-de-voz.md`):
- Triggers da barra: substantivos, sem verbo, sem ponto final. Ex: "Arquivo", "Editar", "Exibir"
- Itens do menu: verbos no infinitivo descrevendo a ação. Ex: "Salvar", "Abrir novo", "Exportar como PDF"
- Atalhos: usar símbolos padrão do sistema (`⌘`, `Ctrl`, `⇧`, `⌥`)

**Analytics** (ver `21-analytics.md`):
- Evento: `menu_item_click` com `label` (texto do item) e `menu` (nome do menu pai)

```tsx
<MenubarItem
  onClick={() => track("menu_item_click", {
    component: "menubar",
    location: currentPage,
    label: "Salvar",
    menu: "Arquivo"
  })}
>
  Salvar
</MenubarItem>
```

---

## Navigation Menu

**Propósito**: navegação horizontal top-level com suporte a submenus em painel expandido.

**Quando usar**: navegação principal em layouts sem sidebar — portais, sites institucionais, landing pages. Para aplicações com sidebar persistente, usar a `Sidebar` em vez do `NavigationMenu`.

**Critério de decisão — Navigation Menu vs Sidebar**:

| Situação | Componente |
|----------|------------|
| Layout sem sidebar, navegação horizontal no topo | Navigation Menu |
| Aplicação com painel lateral persistente | Sidebar |
| Poucos itens (≤ 5) sem submenus | Links simples ou Tabs |
| Hierarquia profunda com muitas categorias | Sidebar com Accordion |

**Implementação**:
```tsx
<nav aria-label="Navegação principal">
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuLink
          href="/componentes"
          aria-current={currentPage === "componentes" ? "page" : undefined}
          className={navigationMenuTriggerStyle()}
        >
          Componentes
        </NavigationMenuLink>
      </NavigationMenuItem>

      {/* Item com submenu */}
      <NavigationMenuItem>
        <NavigationMenuTrigger>Design Tokens</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid gap-2 p-4 w-[300px]">
            <li>
              <NavigationMenuLink href="/tokens/cores">Cores</NavigationMenuLink>
            </li>
            <li>
              <NavigationMenuLink href="/tokens/tipografia">Tipografia</NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</nav>
```

**Regras**:
- Máximo 7 itens no nível principal
- Sem ícones nos itens — exceto instrução específica
- Implementar estados `hover`, `active` e `focus` em todos os itens

**Acessibilidade**:
- `<nav aria-label="Navegação principal">` envolvendo o componente
- `aria-current="page"` no item da página ativa — obrigatório, atualizar dinamicamente
- O Shadcn/UI aplica `role="navigation"`, `aria-expanded` e gerencia foco nos submenus automaticamente
- Submenus fecham com `Escape` — comportamento nativo do Radix UI, não sobrescrever

**UX Writing** (ver `19-tom-de-voz.md`):
- Labels: substantivos ou frases nominais curtas, sem verbo, sem ponto final
- Máximo 2 palavras por item de nível principal
- Itens de submenu podem ser mais descritivos: "Cores do sistema", "Escala tipográfica"

**Analytics** (ver `21-analytics.md`):
- Evento: `navigation_click` com `label` e `destination`

```tsx
<NavigationMenuLink
  href="/componentes"
  aria-current={currentPage === "componentes" ? "page" : undefined}
  onClick={() => track("navigation_click", {
    component: "navigation_menu",
    location: currentPage,
    label: "Componentes",
    destination: "/componentes"
  })}
>
  Componentes
</NavigationMenuLink>
```

---

## Pagination

**Propósito**: navegação entre páginas de um conjunto de resultados ou conteúdo paginado.

**Quando usar**: listas com mais de 10 itens onde carregar tudo de uma vez prejudicaria a performance ou a experiência. Abaixo de 10 itens, exibir tudo sem paginação.

**Implementação**:

> **Nota de arquitetura**: o `PaginationPrevious`, `PaginationNext` e `PaginationLink` do Shadcn/UI renderizam elementos `<a>` por padrão. Em SPAs com roteamento baseado em estado (sem URLs reais por página), use o padrão `asChild` para renderizar um `<button>` semanticamente correto.

```tsx
<nav aria-label="Navegação de páginas">
  <Pagination>
    <PaginationContent>

      {/* Anterior — desabilitado apenas na primeira página */}
      <PaginationItem>
        <PaginationPrevious asChild>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Página anterior"
            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationPrevious>
      </PaginationItem>

      {/* Páginas numeradas */}
      {pages.map((page) => (
        <PaginationItem key={page}>
          <PaginationLink asChild>
            <button
              onClick={() => handlePageChange(page)}
              aria-label={`Ir para página ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              className={page === currentPage ? "font-medium border-primary" : ""}
            >
              {page}
            </button>
          </PaginationLink>
        </PaginationItem>
      ))}

      {/* Ellipsis para muitas páginas */}
      {showEllipsis && (
        <PaginationItem>
          <PaginationEllipsis aria-hidden="true" />
        </PaginationItem>
      )}

      {/* Próxima — desabilitado apenas na última página */}
      <PaginationItem>
        <PaginationNext asChild>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Próxima página"
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationNext>
      </PaginationItem>

    </PaginationContent>
  </Pagination>
</nav>
```

> **Alternativa com URLs reais**: se o projeto migrar para Next.js ou React Router com URLs por página, substituir `asChild + button` por `href` direto nas props — `<PaginationPrevious href={`/pagina/${currentPage - 1}`} />`. O `aria-disabled` funciona corretamente em `<a>` com `href` ausente, mas `disabled` só funciona em `<button>`.

**Regras**:
- Sempre mostrar página atual e total (ex: "Página 3 de 12")
- Usar ellipsis (`...`) quando houver mais de 7 páginas — exibir primeira, última e as adjacentes à atual
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

```tsx
const handlePageChange = (page: number) => {
  track("page_change", {
    component: "pagination",
    location: currentSection,
    page,
    total_pages: totalPages
  });
  setCurrentPage(page);
};
```

---

## Stepper

**Propósito**: guia visual de progresso em processos sequenciais com etapas definidas.

**Quando usar**: fluxos com 3–7 etapas obrigatórias em ordem — onboarding, checkout, formulários multi-etapa, wizards de configuração. Para etapas opcionais ou em qualquer ordem, considerar `Tabs`.

**Critério de decisão — Stepper vs Tabs vs Accordion**:

| Situação | Componente |
|----------|------------|
| Etapas sequenciais obrigatórias | Stepper |
| Views paralelas sem ordem definida | Tabs |
| Conteúdo que pode ser expandido independentemente | Accordion |

**Implementação**:

> **Componente customizado**: o Stepper não faz parte do Shadcn/UI oficial — é um componente criado especificamente para este projeto. A API abaixo (`Stepper`, `StepperItem`, `StepperSeparator`, `Step`) refere-se à implementação local em `@/components/ui/stepper`. Verificar se o componente instalado suporta as props usadas, especialmente `aria-label` no `StepperItem` — se não houver suporte nativo, aplicar o atributo via `data-*` e usar CSS/JS para expô-lo, ou contribuir o suporte diretamente no componente.

```tsx
const steps: Step[] = [
  { title: "Dados pessoais",   description: "Nome e contato" },
  { title: "Endereço",         description: "Localização de entrega" },
  { title: "Pagamento",        description: "Forma de pagamento" },
  { title: "Confirmação",      description: "Revisão do pedido" },
];

{/* Container com anúncio de progresso para leitores de tela */}
<div
  role="group"
  aria-label={`Etapa ${currentStep + 1} de ${steps.length}: ${steps[currentStep].title}`}
>
  <Stepper steps={steps} currentStep={currentStep} orientation="horizontal">
    {steps.map((step, index) => (
      <React.Fragment key={index}>
        <StepperItem step={index} />
        {index < steps.length - 1 && (
          <StepperSeparator aria-hidden="true" />
        )}
      </React.Fragment>
    ))}
  </Stepper>

  {/* Anúncio complementar para leitores de tela — visualmente oculto */}
  <p className="sr-only" aria-live="polite">
    {`Etapa ${currentStep + 1} de ${steps.length}: ${steps[currentStep].title}`}
  </p>

  {/* Conteúdo da etapa atual */}
  <div
    role="region"
    aria-label={`Conteúdo: ${steps[currentStep].title}`}
  >
    {renderStepContent(currentStep)}
  </div>

  {/* Botões de navegação */}
  <div className="flex justify-end gap-2 mt-6">
    <Button
      variant="outline"
      onClick={handlePrev}
      disabled={currentStep === 0}
      aria-label="Voltar para etapa anterior"
    >
      Anterior
    </Button>
    <Button
      onClick={handleNext}
      aria-label={
        currentStep === steps.length - 1
          ? "Finalizar processo"
          : `Avançar para ${steps[currentStep + 1].title}`
      }
    >
      {currentStep === steps.length - 1 ? "Finalizar" : "Próximo"}
    </Button>
  </div>
</div>
```

> **Estratégia de acessibilidade**: como o `StepperItem` pode não repassar `aria-label` internamente, o `role="group"` com `aria-label` dinâmico no container e o `<p aria-live="polite" className="sr-only">` garantem que o progresso seja anunciado ao leitor de tela em qualquer implementação do componente.

**Regras**:
- 3–7 etapas — menos de 3 não justifica Stepper, mais de 7 sobrecarrega cognitivamente
- Orientação `horizontal` por padrão; `vertical` para etapas com descrições longas ou mobile
- Sempre fornecer botões "Anterior" e "Próximo" além da navegação visual
- "Anterior" com `disabled` na primeira etapa
- "Próximo" substituído por "Finalizar" na última etapa
- Não permitir navegação para etapas futuras não liberadas — usar `disabled` no `StepperItem`

**Estados visuais obrigatórios** (tokens do `16-padroes-design-sistema.md`):

| Estado | Classes |
|--------|---------|
| Concluída | `border-primary bg-primary text-primary-foreground` + ícone `Check` |
| Atual | `border-primary bg-background text-primary` + número da etapa |
| Futura | `border-muted-foreground/25 bg-background text-muted-foreground` + número da etapa |

**Acessibilidade**:
- `role="group"` com `aria-label` dinâmico no container indicando etapa atual e total — anuncia ao leitor de tela onde o usuário está no processo
- `aria-label` em cada `StepperItem` descrevendo número, título e estado ("concluída", "atual", "pendente")
- `StepperSeparator` com `aria-hidden="true"` — é decorativo
- `role="region"` com `aria-label` no container do conteúdo da etapa — separa semanticamente o indicador do conteúdo
- `aria-label` contextual nos botões: "Voltar para etapa anterior", "Avançar para [nome da próxima etapa]", "Finalizar processo"

**UX Writing** (ver `19-tom-de-voz.md`):
- Títulos de etapa: frase nominal curta, máximo 3 palavras, sem verbo, sem ponto. Ex: "Dados pessoais", "Endereço", "Pagamento"
- Descrição opcional: complemento direto do título, máximo 1 linha
- Botão final: sempre "Finalizar" — não "Concluir", "Enviar" ou "Confirmar"
- Botão de retorno: sempre "Anterior" — não "Voltar" nem "← Anterior"

**Importação**:
```tsx
import { Stepper, StepperItem, StepperSeparator, Step } from "@/components/ui/stepper";
```

**Analytics** (ver `21-analytics.md`):
- Evento: `step_change` com `step` (índice de destino, base 0), `total_steps` e `direction` ("next" ou "prev")
- Disparar ao confirmar a mudança de etapa — não ao clicar, pois pode haver validação bloqueando

```tsx
const handleNext = () => {
  if (!validateCurrentStep()) return; // Validar antes de rastrear
  track("step_change", {
    component: "stepper",
    location: currentPage,
    step: currentStep + 1,
    total_steps: steps.length,
    direction: "next"
  });
  setCurrentStep((s) => s + 1);
};

const handlePrev = () => {
  track("step_change", {
    component: "stepper",
    location: currentPage,
    step: currentStep - 1,
    total_steps: steps.length,
    direction: "prev"
  });
  setCurrentStep((s) => s - 1);
};
```

> **Nota**: o evento `step_change` não está no catálogo do `21-analytics.md` — adicionar ao catálogo e ao `EventName` do `lib/analytics.ts`.

---

## Tabs

**Propósito**: alterna entre views paralelas do mesmo nível hierárquico.

**Quando usar**: conteúdos alternativos relacionados sem ordem obrigatória — detalhes de um produto, configurações por categoria, diferentes visualizações de um dado. Para sequências obrigatórias, usar `Stepper`. Para conteúdo expansível independentemente, usar `Accordion`.

**Critério de decisão — Tabs vs Stepper vs Accordion**:

| Situação | Componente |
|----------|------------|
| Views paralelas, qualquer ordem, sem dependência | Tabs |
| Etapas sequenciais obrigatórias | Stepper |
| Seções expansíveis independentemente | Accordion |
| Muitas seções (> 6) | Accordion ou Sidebar |

**Implementação**:
```tsx
<Tabs defaultValue="visao-geral" onValueChange={(value) => handleTabChange(value)}>
  <TabsList aria-label="Seções do componente">
    <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
    <TabsTrigger value="propriedades">Propriedades</TabsTrigger>
    <TabsTrigger value="exemplos">Exemplos</TabsTrigger>
  </TabsList>

  <TabsContent value="visao-geral">
    {/* Conteúdo da aba */}
  </TabsContent>
  <TabsContent value="propriedades">
    {/* Conteúdo da aba */}
  </TabsContent>
  <TabsContent value="exemplos">
    {/* Conteúdo da aba */}
  </TabsContent>
</Tabs>
```

**Regras**:
- Máximo 6 tabs por conjunto — acima disso, considerar `Accordion` ou dividir em seções
- Estilo obrigatório: tab simples padrão — exceto instrução específica
- Sem ícones nas tabs — exceto instrução específica
- A tab ativa deve ter estado visual claramente distinguível por cor e por indicador adicional (underline ou fundo) — não apenas cor

**Acessibilidade**:
- `aria-label` no `TabsList` descrevendo o que as tabs representam
- O Shadcn/UI aplica `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` e `aria-controls` automaticamente — não sobrescrever
- Navegação por teclado gerenciada automaticamente pelo Radix UI:

| Tecla | Ação |
|-------|------|
| `Arrow Right` / `Arrow Left` | Move entre tabs (roving tabindex) |
| `Home` / `End` | Vai para a primeira/última tab |
| `Enter` / `Space` | Ativa a tab focada |
| `Tab` | Move para o conteúdo do painel ativo |

- O foco vai automaticamente para o `TabsContent` ativo ao pressionar `Tab` — não adicionar `tabIndex` manual nos painéis

**UX Writing** (ver `19-tom-de-voz.md`):
- Labels: substantivos ou gerúndios curtos, máximo 2 palavras, sem ponto final
- Exemplos corretos: "Visão geral", "Propriedades", "Exemplos", "Configurações"
- Exemplos incorretos: "Ver a visão geral", "Clique para ver propriedades", "Exemplos de uso do componente"
- Evitar labels genéricos: "Aba 1", "Tab A", "Outros"

**Analytics** (ver `21-analytics.md`):
- Evento: `tab_change` com `label` (texto da tab), `index` (posição base 0) e `total` (total de tabs)
- Não disparar na tab inicial — apenas nas mudanças subsequentes

```tsx
const handleTabChange = (value: string) => {
  const index = tabs.findIndex((t) => t.value === value);
  track("tab_change", {
    component: "tabs",
    location: currentPage,
    label: tabs[index].label,
    index,
    total: tabs.length
  });
};
```

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