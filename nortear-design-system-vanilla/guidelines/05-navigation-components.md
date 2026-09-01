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
- Cor: itens navegáveis em `--muted-foreground`; item atual em `--foreground` — ambos resolvidos pela folha `breadcrumb.css`, não por classe no call site. O item atual se distingue pela cor mais forte e por `aria-current`, não por peso de fonte
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
| `items` | — | Array `{ value, label, content, disabled? }` |
| `defaultValue` | — | Tab ativo inicial |
| `variant` | `default` | `default` desenha o trilho; `line` marca o ativo por um traço |
| `orientation` | `horizontal` | Direção do conjunto; define também qual par de setas navega |
| `aria-label` | — | **Obrigatório.** Nome da lista de abas — escrito no `role="tablist"` |
| `onValueChange` | — | Recebe o valor da aba ativada |
| `class` | — | Classes `.nds-*` adicionais na raiz |

**Regras**:
- O trilho é `.nds-tabs-list`: a folha `tabs.css` resolve o `inline-flex`, o fundo em `--muted` e o respiro interno de 8-grid. `data-variant="line"` troca o trilho pelo traço sob a aba ativa
- Cada Tab com `aria-selected` e `aria-controls` apontando ao painel
- Cada TabPanel com `aria-labelledby` apontando ao botão da tab
- Painel inativo: `hidden = true` (não usar apenas `display: none` via classe)
- Conteúdos de painel devem ter mesma altura mínima quando possível, evitando jumps no layout
- Navegação por teclado: Setas ← → entre tabs, Home/End para primeira/última

**Acessibilidade**:
- `role="tablist"`, `role="tab"`, `role="tabpanel"` obrigatórios
- Foco visível no tab ativo
- `aria-selected="true"` apenas no tab atual
- Nome da lista de abas obrigatório, pela opção `aria-label` da factory — nunca por um `setAttribute` depois de construir, que some na primeira refatoração
- Aba desabilitada: marcada com `aria-disabled`, nunca com o atributo `disabled` nativo — o botão nativamente desabilitado sai do alcance do foco e a aba nunca é anunciada. Ela permanece no percurso das setas, para ser anunciada como indisponível, e nem o clique nem Enter/Espaço a ativam.

**Analytics**: emitir `tab_change` com `{ from, to, label }` no clique.

---

## Stepper

**Propósito**: mostrar a posição num fluxo de ordem obrigatória, e quanto ainda falta. Para seções acessíveis em qualquer ordem, use Tabs; para a posição numa hierarquia de páginas, Breadcrumb; para uma operação única de duração mensurável, Progress.

**Peças**: `createStepper`, `createStepperItem`, `createStepperTrigger`, `createStepperIndicator`, `createStepperTitle`, `createStepperDescription`, `createStepperSeparator`, mais `setStepperValue` e `getStepperValue`.

Esta stack não tem runtime reativo, e é por isso que a montagem é de DUAS FASES: monta-se a árvore e depois se chama `setStepperValue(raiz, valor)`, que resolve o estado de cada etapa, o `aria-current`, o `disabled`, a palavra de estado e o conteúdo do indicador. É a divergência de API desta stack, e é declarada — as outras quatro derivam por reatividade.

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
| `setStepperValue` | `value` | `1` | Número da etapa atual, contando de 1 — aplicado depois de montar a árvore |
| `createStepper` | `aria-label` | — | Nome acessível do fluxo; obrigatório |
| `createStepper` | `labels` | `{}` | Palavras de estado (`completed`, `current`) lidas só por leitor de tela |
| `createStepper` | `onStepSelect` | — | Recebe o número da etapa quando um gatilho disponível é acionado |
| `createStepperItem` | `step` | — | Número desta etapa; obrigatório |
| `createStepperItem` | `completed` | `false` | Conta como concluída mesmo estando depois da atual |
| `createStepperItem` | `disabled` | `false` | Indisponível: o gatilho sai da ordem de tabulação |

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
| `total` | — | Total de páginas |
| `current` | — | Página atual (1-indexed) |
| `onPageChange` | — | Avisado quando outra página é pedida. Opcional: uma paginação inteiramente de rota não precisa dele |
| `hrefForPage` | — | Endereço real de cada página. Com ele o link é destino de verdade e o clique SEGUE — é o ponto de integração com roteador de cliente. Sem ele todo link nasce `#` e o clique é anulado |
| `showPrevNext` | `true` | Exibe os controles Anterior/Próxima |
| `aria-label` | `'Paginação'` | Nome acessível do landmark. `label` segue aceito como apelido depreciado; quando os dois vêm, `aria-label` vence |
| `align` | — | `start`/`end` encolhem a faixa e a encostam na ponta; sem valor ela ocupa a linha e fica centrada |
| `class` | — | Classes adicionais |

**Regras**:
- `<nav>` com `aria-label` descritivo
- Botões Anterior/Próxima sempre presentes; `disabled` nos extremos (não esconder)
- Página atual com `aria-current="page"`
- Altura mínima dos botões em `--size-lg` (36px na densidade padrão, e é piso de alvo de toque, não teto); gap em `--spacing-1`
- Nunca usar emojis literais — usar ícones SVG (`ChevronLeft`, `ChevronRight`)
- Em mobile, exibir apenas controles "Anterior / X de Y / Próxima"

**Acessibilidade**:
- `aria-label` em todos os botões (ex: "Página anterior", "Página 3")
- Botões `disabled` nos extremos (não somente visualmente desativados)

**Analytics**: emitir `pagination_change` com `{ from, to, total }`.
