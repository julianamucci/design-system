# Navigation Components (Nortear — Angular)

## Breadcrumb

**Propósito**: indicar a posição na hierarquia de navegação. Use para hierarquias de mais de dois níveis; para um ou dois, um botão "Voltar" comunica melhor.

**Peças**: `nav[ndsBreadcrumb]`, `ol[ndsBreadcrumbList]`, `li[ndsBreadcrumbItem]`, `a[ndsBreadcrumbLink]`, `span[ndsBreadcrumbPage]`, `li[ndsBreadcrumbSeparator]`, `span[ndsBreadcrumbEllipsis]`.

**Estrutura**:

```
nav[ndsBreadcrumb]              (aria-label)
└── ol[ndsBreadcrumbList]
    ├── li[ndsBreadcrumbItem]
    │   └── a[ndsBreadcrumbLink]
    ├── li[ndsBreadcrumbSeparator]        (aria-hidden)
    ├── li[ndsBreadcrumbItem]
    │   └── span[ndsBreadcrumbEllipsis]   (níveis recolhidos)
    ├── li[ndsBreadcrumbSeparator]
    └── li[ndsBreadcrumbItem]
        └── span[ndsBreadcrumbPage]       (aria-current="page")
```

**Entradas**:

| Peça | Nome | Função |
|---|---|---|
| `ndsBreadcrumb` | `label` | Nome acessível do `<nav>`; sem valor, um padrão em português |
| `ndsBreadcrumbEllipsis` | `label` | Nome acessível do recolhimento |

**Regras**:
- Lista **ordenada** — a ordem é semanticamente relevante
- Separador é decorativo e vive num `<li>` próprio, não dentro do item que ele separa
- Item atual é `span[ndsBreadcrumbPage]`, nunca link
- Não truncar rótulo por CSS; para caminho longo, recolher níveis do meio com a elipse
- Itens navegáveis em cor atenuada, item atual em `--foreground`

**Acessibilidade**:
- `aria-label` no `<nav>` descreve a função em português contextual, não repete "Breadcrumb"
- `aria-current="page"` exclusivo no último item
- A elipse é foco de teclado só se abrir algo; elipse puramente informativa não entra na ordem de tabulação

---

## Tabs

**Propósito**: alternar seções de conteúdo no mesmo nível hierárquico. Para navegar entre páginas distintas, use links.

**Peças**: `div[ndsTabs]`, `div[ndsTabsList]`, `button[ndsTabsTrigger]`, `div[ndsTabsContent]`, `svg[ndsTabsIcon]`.

**Estrutura**:

```
div[ndsTabs]
├── div[ndsTabsList]                (role="tablist")
│   ├── button[ndsTabsTrigger]      (role="tab", aria-selected, aria-controls)
│   └── button[ndsTabsTrigger]
├── div[ndsTabsContent]             (role="tabpanel", aria-labelledby)
└── div[ndsTabsContent]
```

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsTabsList` | `variant` | `default` | `default` (fundo atenuado) ou `line` (sublinhado) |
| `ndsTabsList` | `activationMode` | `automatic` | `automatic` troca o painel ao mover o foco; `manual` exige Enter/Espaço |

O par valor/mudança de valor vem do primitivo headless nas diretivas raiz e de item.

**Regras**:
- `activationMode: 'manual'` é a escolha certa quando o painel carrega dado: com `automatic`, atravessar as tabs com as setas dispara todas as cargas
- Painel inativo sai do fluxo de verdade — não basta esconder por CSS, ou o conteúdo continua na ordem de tabulação
- Conteúdo dos painéis com altura semelhante evita salto de layout na troca

**Acessibilidade**:
- Setas movem entre tabs, Home e End vão para a primeira e a última
- `aria-selected="true"` só na tab atual
- Foco visível na tab ativa; ícone dentro do gatilho é decorativo
- Aba desabilitada: marcada com `aria-disabled`, nunca com o atributo `disabled` nativo — o botão nativamente desabilitado sai do alcance do foco e a aba nunca é anunciada. Ela permanece no percurso das setas, para ser anunciada como indisponível, e nem o clique nem Enter/Espaço a ativam.

**Analytics**: `tab_change` com origem e destino no payload — valores estáveis, não o rótulo traduzido.

---

## Stepper

**Propósito**: mostrar a posição num fluxo de ordem obrigatória, e quanto ainda falta. Para seções acessíveis em qualquer ordem, use Tabs; para a posição numa hierarquia de páginas, Breadcrumb; para uma operação única de duração mensurável, Progress.

**Peças**: `ol[ndsStepper]`, `li[ndsStepperItem]`, `button[ndsStepperTrigger]`, `span[ndsStepperIndicator]`, `span[ndsStepperTitle]`, `span[ndsStepperDescription]`, `div[ndsStepperSeparator]`.

Sem primitivo headless: o Radix NG não tem Stepper, e não há foco a governar nem ARIA a gerar que a marcação nativa já não anuncie. O estado de cada etapa é derivado por sinal, com a etapa injetando a raiz.

**Estrutura**:

```
ol[ndsStepper]                        (aria-label, data-value)
└── li[ndsStepperItem]                (data-step, data-state, data-completed, data-disabled)
    ├── button[ndsStepperTrigger]     (type="button", aria-current="step" só na atual)
    │   ├── span                      (.nds-sr-only — palavra de estado)
    │   ├── span[ndsStepperIndicator] (aria-hidden)
    │   ├── span[ndsStepperTitle]
    │   └── span[ndsStepperDescription]
    └── div[ndsStepperSeparator]      (aria-hidden)
```

O traço mora DENTRO do item, depois do gatilho — é isso que o faz herdar o estado do item que o precede sem regra de CSS extra.

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsStepper` | `value` | `1` | Número da etapa atual, contando de 1 |
| `ndsStepper` | `labels` | `{}` | Palavras de estado (`completed`, `current`) lidas só por leitor de tela |
| `ndsStepperItem` | `step` | — | Número desta etapa; obrigatório |
| `ndsStepperItem` | `completed` | `false` | Conta como concluída mesmo estando depois da atual |
| `ndsStepperItem` | `disabled` | `false` | Indisponível: o gatilho sai da ordem de tabulação |
| `ndsStepperIndicator` | `custom` | `false` | Libera conteúdo próprio no lugar do número |

**Saídas**:

| Peça | Nome | Carga | Quando |
|---|---|---|---|
| `ndsStepper` | `stepSelect` | `number` | Um gatilho disponível é acionado |

O nome acessível do fluxo é o atributo nativo `aria-label` escrito na raiz, não um input: um input homônimo daria dois jeitos de dizer a mesma coisa, com um vencendo em silêncio.

**Regras**:
- Entre três e seis etapas; com duas o indicador não informa nada, e acima de seis o rótulo não cabe
- O estado é DERIVADO do valor do fluxo — marcar `completed` à mão só cabe quando o fluxo aceita ordem fora do comum
- Etapa que ainda não pode ser aberta é `disabled`, não um controle focável sem destino
- Sem `stepSelect`, os gatilhos continuam focáveis e sem efeito: declare a saída ou marque as etapas como indisponíveis

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

## Pagination — a mecânica desta stack

Contrato, decisões com data e medição, tokens e peças das cinco stacks:
[`docs/shared/prd/pagination.md`](../../docs/shared/prd/pagination.md). A regra da
categoria está em
[`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md) — o Pagination entra
na categoria Tabelas porque o único consumidor dele em todo o repositório é o
rodapé de uma lista ou de uma tabela, e é lá que mora a fronteira entre ele e o
rodapé do DataTable, com o alinhamento da faixa, o mecanismo de desabilitar e o
evento que a faixa dispara. Aqui fica a mecânica de navegação desta stack.

**As oito peças são diretiva de ATRIBUTO no elemento nativo**, num arquivo só e
sem `@radix-ng/primitives` — o pacote não publica um `pagination`, e não haveria o
que compor: a faixa não guarda estado, não gerencia foco e não tem teclado além do
que o `<a>` já traz. As peças são `nav[ndsPagination]`,
`ul[ndsPaginationContent]`, `li[ndsPaginationItem]`, `a[ndsPaginationLink]`,
`a[ndsPaginationPrevious]`, `a[ndsPaginationNext]`,
`span[ndsPaginationEllipsis]` e `svg[ndsPaginationIcon]`. A aparência de botão vem
de `btnClass()`, a mesma função pura que o `NdsButton` usa, sem herdar componente
e sem invólucro no DOM.

**O ícone é peça publicada só aqui**: cada ícone do lucide é uma lista
`[tag, attrs]` com tag variável, e template Angular exige tag estática — os nós
são criados por `createElementNS`, sem `innerHTML` no caminho.

**Desabilitado tem de barrar de verdade, e é por isso que a escuta é em fase de
CAPTURA.** As peças direcionais desta stack são `<a>`, e um listener declarado no
`host` de uma diretiva é registrado **depois** do `(click)` que quem consome
escreve no mesmo elemento — barrar dali não alcança ninguém, porque o handler de
quem usa já disparou. A interceptação é registrada no construtor, na fase de
captura, e o estado desabilitado é lido na hora do clique (ler um `input()` dentro
do construtor devolveria o default). Sintoma quando isso falha: o link
desabilitado continua chamando o callback de página, sem erro nenhum. Ver
[`13-system-design.md`](13-system-design.md) §Eventos.

---

## Navigation Menu

**Propósito**: menu de navegação horizontal com painéis de conteúdo — o menu de cabeçalho de um site, com grupos e descrições.

**Peças**: `nav[ndsNavigationMenu]`, `ul[ndsNavigationMenuList]`, `li[ndsNavigationMenuItem]`, `button[ndsNavigationMenuTrigger]`, `ng-template[ndsNavigationMenuContent]`, `[ndsNavigationMenuPanel]`, `a[ndsNavigationMenuLink]`, `a[ndsNavigationMenuChild]`, `div[ndsNavigationMenuChildLabel]`, `p[ndsNavigationMenuChildDescription]`, `svg[ndsNavigationMenuChevron]`.

**Estrutura**:

```
nav[ndsNavigationMenu]
└── ul[ndsNavigationMenuList]
    ├── li[ndsNavigationMenuItem]
    │   ├── button[ndsNavigationMenuTrigger]      (aria-expanded)
    │   │   └── svg[ndsNavigationMenuChevron]
    │   └── ng-template[ndsNavigationMenuContent]  ← painel portalizado
    │       └── [ndsNavigationMenuPanel]
    │           └── a[ndsNavigationMenuChild]
    │               ├── div[ndsNavigationMenuChildLabel]
    │               └── p[ndsNavigationMenuChildDescription]
    └── li[ndsNavigationMenuItem]
        └── a[ndsNavigationMenuLink]              (item sem painel)
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `align` | `start` | Alinhamento do painel |
| `sideOffset` | `8` | Distância entre gatilho e painel |
| `indicator` | `false` | Mostra a seta que aponta para o gatilho ativo |

**Regras**:
- O conteúdo do painel vive num `<ng-template>` e é instanciado quando abre — é o que evita montar todos os painéis de uma vez
- Item sem painel é link direto; não criar gatilho que só navega
- Um painel aberto por vez

**Acessibilidade**:
- Gatilho reflete `aria-expanded`; painel é rotulado pelo gatilho
- Setas navegam entre itens do topo, Escape fecha o painel e devolve o foco ao gatilho
- Descrição de item é texto de apoio: o nome acessível do link é o rótulo, não a descrição inteira

---

## Menubar

**Propósito**: barra de menus no padrão de aplicação de desktop — Arquivo, Editar, Ver — com submenus, itens de marcação e atalhos.

**Peças**: `nds-menubar`, `nds-menubar-menu` / `nds-menubar-sub`, `button[ndsMenubarTrigger]`, `ng-template[ndsMenubarContent]` / `[ndsMenubarSubContent]`, `div[ndsMenubarItem]`, `div[ndsMenubarCheckboxItem]`, `div[ndsMenubarRadioGroup]`, `div[ndsMenubarRadioItem]`, `div[ndsMenubarSubTrigger]`, `div[ndsMenubarGroup]`, `div[ndsMenubarLabel]`, `div[ndsMenubarSeparator]`, `span[ndsMenubarShortcut]`, `svg[ndsMenubarIcon]`.

**Estrutura**:

```
nds-menubar
└── nds-menubar-menu
    ├── button[ndsMenubarTrigger]
    └── ng-template[ndsMenubarContent]        ← portalizado
        ├── div[ndsMenubarLabel]
        ├── div[ndsMenubarItem]
        │   └── span[ndsMenubarShortcut]
        ├── div[ndsMenubarSeparator]
        ├── div[ndsMenubarCheckboxItem]
        ├── div[ndsMenubarRadioGroup]
        │   └── div[ndsMenubarRadioItem]
        └── nds-menubar-sub
            ├── div[ndsMenubarSubTrigger]
            └── ng-template[ndsMenubarSubContent]
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `side`, `align`, `sideOffset`, `alignOffset` | do primitivo | Posicionamento do painel |
| `variant` (item) | `default` | `default` ou destrutivo |
| `inset` | `false` | Recua o item para alinhar com a calha de ícone dos irmãos |

**Regras**:
- `inset` existe para alinhamento óptico: num menu em que alguns itens têm ícone ou marca e outros não, os sem recuo ficam desalinhados da calha
- Atalho é **rótulo**, não binding de teclado: exibir `Ctrl+S` não registra o atalho; quem consome registra
- Item destrutivo carrega a cor semântica e continua precisando de texto que diga o que faz
- Painel de submenu abre ao lado, não abaixo

**Acessibilidade**:
- Barra e menus seguem semântica de menu: setas navegam, Escape fecha um nível, Tab sai da barra inteira
- Item de marcação anuncia o estado; grupo de opção exclusiva anuncia qual está escolhida
- Nome acessível de cada gatilho é o texto visível dele

**Analytics**: `menubar_open`, `menubar_close` (com `reason`) e `menubar_item_select`, no formato da família de menus — `menu` e `label` são ids estáveis em inglês, nunca o rótulo traduzido, que dividiria o evento por idioma. O contrato está no PRD [`docs/shared/prd/dropdown-menu.md`](../../docs/shared/prd/dropdown-menu.md) §9.
