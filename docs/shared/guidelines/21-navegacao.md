# Navegação — as regras da categoria

Vale para os seis componentes de navegação, nas cinco stacks: **Breadcrumb**,
**Menubar**, **NavigationMenu**, **Pagination**, **Stepper** e **Tabs**. A lista não
é escolha deste arquivo: é a categoria que o conteúdo compartilhado declara
(`"category": "Navegação"` em `docs/shared/content/<slug>/translations.json`) e o
grupo `Components/Navigation` que as cinco stacks usam no Storybook.

Este arquivo guarda o que ATRAVESSA os seis. O que cada um É — contrato, decisões
com data e medição, tokens, peças das cinco stacks — está no PRD dele:

| componente | PRD |
|---|---|
| Breadcrumb | [breadcrumb.md](../prd/breadcrumb.md) |
| Menubar | [dropdown-menu.md](../prd/dropdown-menu.md) — PRD da FAMÍLIA de menus |
| NavigationMenu | [navigation-menu.md](../prd/navigation-menu.md) |
| Pagination | [pagination.md](../prd/pagination.md) |
| Stepper | [stepper.md](../prd/stepper.md) |
| Tabs | [tabs.md](../prd/tabs.md) |

**O Menubar não tem PRD próprio, e a classificação dele está em disputa.** O
contrato mora no PRD da família de menus, que declara `prd-familia: context-menu
menubar` e o trata como menu de COMANDOS da categoria Overlay
([`18-overlay.md`](18-overlay.md)). O conteúdo compartilhado e o Storybook o põem em
Navegação, e as guidelines de react e vue diziam "não usar para navegação entre
páginas". As três leituras não cabem juntas; está no primeiro item de §O que está
aberto.

**O Pagination esteve na categoria Tabelas por um dia**, com a justificativa de que
o único consumidor dele seria o rodapé de uma tabela. A justificativa não tinha sido
medida: o DataTable não o usa, e o projeto o classifica como navegação em três
lugares. O que ficou em [`20-tabelas.md`](20-tabelas.md) é só a fronteira entre ele
e o rodapé do DataTable.

## Por que este arquivo existe

Até 2026-09-17 a regra da categoria vivia em **seções de `05-navigation-components.md`
nas cinco stacks**, e divergiam como as de overlay, feedback e tabelas antes das
unificações. Medido naquele dia, conferindo cada afirmação no código ou na folha:

- **144 linhas no vanilla e 149 no Svelte contra 298 no Vue** para a categoria
  inteira. No Svelte, Menubar e NavigationMenu tinham só propósito e árvore — nenhuma
  regra, nenhuma linha de acessibilidade — e o Tabs não tinha regra;
- **o vanilla, que é a stack de REFERÊNCIA, não tinha seção de Menubar nem de
  NavigationMenu**, e os dois componentes existem nele, com 903 e 455 linhas,
  stories, fixtures e docs page. Lacuna de guideline, não de componente;
- a **seção do Stepper era cópia literal nas cinco** — propósito, regras, os seis
  bullets de acessibilidade e a linha de analytics —, e as de Breadcrumb, Menubar,
  NavigationMenu e Tabs eram a mesma redação entre react e vue;
- react e vue tinham "Regras transversais de Navigation Components", que **não
  valiam nas cinco e erravam em seis pontos**: mandavam envolver todo componente de
  navegação num `<nav>` (Tabs é `role="tablist"`, Stepper é `<ol>`, Menubar é
  `role="menubar"`, e Breadcrumb e NavigationMenu JÁ SÃO o `<nav>`); tornavam
  `aria-current="page"` obrigatório sem lembrar que o Stepper usa `step`; declaravam
  obrigatório o anel `.nds-focus-ring`, que nenhuma folha da categoria lê; davam ao
  evento do Stepper campos que o tipo não tem; e chamavam "Anterior" e "Próximo" de
  verbos no infinitivo, com o masculino contra o "Próxima" de
  [`05-tom-de-voz.md`](05-tom-de-voz.md);
- react, vue e svelte mandavam **envolver o Breadcrumb num `<nav aria-label>`**, e o
  NavigationMenu também: nas cinco stacks os dois já renderizam o `<nav>`, então
  seguir a instrução cria marco dentro de marco;
- o nome **"Localização na página" não existe fora das guidelines**, onde aparecia
  oito vezes; o nome padrão do Breadcrumb nas cinco stacks é `breadcrumb`, em
  inglês — e a cópia do Angular dizia que o padrão era português;
- o **react** dizia que Tab anda entre os menus do Menubar, e a barra é UMA parada
  — os outros gatilhos têm `tabindex="-1"` e o Tab sai dela; e dizia que o Menubar
  não dispara evento, e ele dispara desde 2026-09-11;
- o **Angular** dizia que o Radix NG não tem Stepper, e ele tem — com um
  `rdxStepperItem` que escreve `aria-current = true`, o mesmo defeito que tirou o
  primitivo da reka-ui da stack Vue;
- vanilla e Angular ensinavam payloads de `tab_change` com origem e destino, que o
  tipo não tem; o vanilla desenhava um contêiner `TabPanels` que não existe, e o
  vue uma prop `onValueChange` que a stack não publica;
- o **vanilla** dizia que o Breadcrumb rola na horizontal em caminho longo, e a
  folha quebra linha (`breadcrumb.css:28,34`); e dava o espaçamento como
  `--spacing-1.5`, token que não existe (é `--spacing-1-5`).

Aqui a regra fica UMA vez, e a última seção diz qual portão cobra cada uma. O que é
mecânica de uma stack só — as fábricas do vanilla, as diretivas do Angular, o
`reason` como segundo argumento no Vue, o `bind:value` do Svelte, o `MenubarGroup`
obrigatório do React — continua na `05-navigation-components.md` daquela stack.
Catálogo de componente não fica em guideline nenhuma: vai para o PRD.

---

## Qual componente de navegação

| Situação | Componente |
|---|---|
| Mostrar onde a página está numa hierarquia, com volta aos níveis de cima | Breadcrumb |
| Seções do site, com painéis de links agrupados | NavigationMenu |
| Trocar o painel visível dentro da MESMA página, sem mudar de endereço | Tabs |
| Percorrer uma sequência de etapas com ordem | Stepper |
| Percorrer uma lista longa por páginas | Pagination |
| Barra de comandos de aplicação, no padrão de menu de desktop (Arquivo, Editar) | Menubar — ver §O que está aberto |
| Um gatilho com uma lista de ações, sem sair da página | DropdownMenu — categoria Overlay, [`18-overlay.md`](18-overlay.md) |
| Rodapé de página de uma tabela explorável | o rodapé do DataTable, não o Pagination — ver [`20-tabelas.md`](20-tabelas.md) |

**Tabs não é navegação entre páginas.** A aba troca o painel e mantém o endereço;
destino que muda o endereço é link, e mora no NavigationMenu ou no Breadcrumb.

---

## Marco e nome

**Três componentes SÃO o marco, e nenhum se envolve em outro `<nav>`.** Breadcrumb,
NavigationMenu e Pagination renderizam o `<nav>` na raiz, nas cinco stacks. O nome
acessível vai na RAIZ do componente; envolvê-lo num `<nav aria-label>` de quem monta
produz marco dentro de marco, e o leitor de tela anuncia duas regiões de navegação
para uma.

**Os outros três não são marco.** Tabs é `role="tablist"`, Stepper é lista ordenada,
Menubar é `role="menubar"`. Nenhum deles vira região de navegação por estar nesta
categoria.

**Nome único por tela.** Duas regiões de navegação com o mesmo nome são o mesmo que
nenhum nome, porque a lista de marcos não distingue uma da outra. Medido em
2026-09-17, há uma colisão pronta no próprio repositório: o NavigationMenu do vanilla
tem nome padrão "Navegação principal" (`navigation-menu.ts:148`), e os exemplos de
marco da Sidebar em [`01-acessibilidade.md`](01-acessibilidade.md) e
[`04-padroes-design-sistema.md`](04-padroes-design-sistema.md) usam o mesmo nome.

---

## Estado atual: o vocabulário de `aria-current`

| valor | quem usa | significa |
|---|---|---|
| `page` | Breadcrumb (o último item), NavigationMenu, Pagination | este é o destino em que a pessoa está |
| `step` | Stepper | esta é a etapa em que a pessoa está |
| não se usa | Tabs | a aba ativa se anuncia por `aria-selected`, que é o estado do padrão de abas |

**`aria-current="true"` não entra na categoria.** Ele não diz de QUE é o estado atual.
É o que os primitivos de stepper da reka-ui (2.10.4) e do Radix NG (1.1.2) escrevem —
junto com `role="group"`, `aria-label="progress"` e o anúncio "Step N of M" cravado
em inglês —, e é por isso que nenhuma das cinco stacks os usa. O valor `location` não
é usado por componente nenhum.

**Um `aria-current` por vez, sempre no controle, e ele sai quando a posição muda.**
Não fica no item da lista nem no contêiner: fica no link ou no botão que representa o
lugar.

---

## Teclado na navegação

Dois modelos, e o componente escolhe pelo que ele é, não por gosto:

- **Widget composto é UMA parada, e as setas andam dentro.** Tabs e Menubar: Tab
  entra no widget, as setas percorrem os itens — inclusive os indisponíveis, que não
  ativam —, e Tab SAI do widget. É o que faz
  a barra de menus não custar uma parada por menu. No Menubar isso é o contrato C2 do
  PRD da família.
- **Lista de destinos é uma parada por destino.** Breadcrumb e Pagination: cada link
  é alcançável por Tab, porque cada um é um lugar para onde ir.
- **O NavigationMenu fica no meio, e é padrão de divulgação, não de menu.** O vanilla
  registra a escolha em `navigation-menu.ts:5-22`: sem `role="menu"`, porque o painel
  contém links e não comandos; com setas e Home/End entre os gatilhos
  (`navigation-menu.ts:239-254`).

O teclado de cada componente, tecla a tecla e por stack, está na §8 do PRD dele.

---

## Link ou botão

**Destino é `<a href>`; ação é `<button>`.** O critério não é a aparência, é o que
acontece: se o clique leva a outro endereço, é link — ele abre em nova aba, copia o
endereço e aparece no histórico. Se o clique muda algo na própria tela, é botão.

A justificativa mais completa está em código, no docblock de
`nortear-design-system-vanilla/src/components/ui/navigation-menu.ts:9-18`, e em
guideline nenhuma até esta. Divergência conhecida contra a regra: o link numerado do
Pagination no Svelte é `<button>` (ver [`pagination.md`](../prd/pagination.md)).

**O indisponível se trata conforme o modelo de teclado do componente**, e errar o modelo
produz o defeito oposto:

- **Em lista de destinos, sai da tabulação.** Cada controle é uma parada de Tab, então
  o indisponível deixa de ser parada. No `<button>`, `disabled` nativo — é o que as
  etapas do Stepper usam. No `<a>`, que não tem `disabled`, são três coisas juntas:
  `aria-disabled="true"`, `tabindex="-1"` e a guarda no tratamento do clique — sem a
  segunda o link segue tabulável, sem a terceira o Enter navega. É o que os controles
  do Pagination usam.
- **Em widget composto, continua alcançável pelas setas e não ativa.** Numa lista de
  abas ou numa barra de menus, o item indisponível fica no percurso das setas, com
  `aria-disabled`, e é o clique, o Enter, o Espaço e a ativação por foco que ficam
  barrados. Medido nas cinco stacks do Tabs, em 2026-09-17: a aba indisponível é
  alcançável por seta nas cinco. `disabled` nativo aqui tiraria o item do percurso, e
  quem navega por teclado deixaria de saber que ele existe.

**Controle focável que não leva a lugar nenhum é defeito.** Etapa clicável sem seleção
ligada, aba sem painel e item de menu sem destino ocupam uma parada de Tab e prometem
uma ação que não acontece.

---

## Anel de foco na navegação

**Não há um anel da categoria: há cinco formas em seis folhas.** Medido em
2026-09-17:

| folha | anel de foco |
|---|---|
| `breadcrumb.css:57-60` | contorno translúcido, `--ring` a 50% |
| `tabs.css:81` | sombra, `--ring` a 50% |
| `menubar.css:130-132` e `navigation-menu.css:176-180` | contorno interno em `--accent-foreground` |
| `stepper.css:49` e `pagination.css:94` | 3px de `--ring` opaco |

O utilitário `.nds-focus-ring` (`utilities.css:420-423`), que as guidelines de react e
vue declaravam obrigatório, não é lido por nenhuma das seis. Qual é a forma certa é
decisão, e está em §O que está aberto; o que não se faz é declarar uma regra que o
código não cumpre.

---

## Paginar

**O alinhamento da faixa é atributo, e governa três propriedades de uma vez.**
`data-align="start"` ou `"end"` muda largura, margem e `justify-content`
simultaneamente (`pagination.css:26-46`), porque quem alinha a faixa a uma ponta quer
que ela ocupe só o necessário — os três defaults (largura total, margem automática,
centralizado) trabalham contra o uso num rodapé.

**Desabilitar prev/next é coisa de DOIS atributos.** `aria-disabled` bloqueia o
PONTEIRO via `pointer-events: none` (`pagination.css:134-138`); o teclado sai por
`tabindex="-1"` no link ou pelo `disabled` nativo no botão. Sem um dos dois o
controle continua tabulável e o Enter navega.

**A página atual não tem `pointer-events: none`.** Ele existia e foi removido
(`pagination.css:97-109`): valia só para a forma standalone, e nas quatro stacks que
compõem o link sobre o botão o mesmo link seguia clicável. Quem impede a página
atual de navegar para si mesma é a guarda de quem trata o clique.

**O alvo mínimo é piso, não altura**: `min-height: --size-lg` (`pagination.css:70`).
E o rótulo textual de prev/next some abaixo de 40rem (`pagination.css:164-173`),
ficando só o chevron — o nome acessível não pode depender desse texto.

**A fronteira com a tabela**: o DataTable tem rodapé próprio, com outro vocabulário de
classe, e não compõe o Pagination em stack nenhuma. Está em
[`20-tabelas.md`](20-tabelas.md).

---

## Tela estreita

**Nenhum componente da categoria recolhe em menu de hambúrguer**, e nenhuma
guideline pede isso. O que existe, medido nas folhas:

- o NavigationMenu muda de layout a partir de 48rem (`navigation-menu.css:354-373`);
- o Pagination esconde o rótulo de prev/next abaixo de 40rem;
- o Breadcrumb QUEBRA LINHA em caminho longo (`breadcrumb.css:28,34`) — não rola;
- Tabs, Menubar e Stepper não declaram regra de tela estreita.

---

## Movimento e elevação na navegação

**Elevação**, pelo mapa de [`04-padroes-design-sistema.md`](04-padroes-design-sistema.md)
§Qual degrau: Menubar e Tabs são relevo de controle, `xs`; o painel do NavigationMenu
é flutuante interativo, `md`. Breadcrumb, Stepper e Pagination vivem no plano da
página e não leem elevação.

**Origem da animação do painel**: o `navigation-menu.css` é exceção declarada na
regra de `transform-origin` do auditor, e o vanilla usa uma terceira forma de painel
que nenhuma regra confere — ver §O que está aberto. A guarda de movimento reduzido de
cada folha está na §5 do PRD do componente.

---

## Analytics de navegação

O vocabulário do payload — `component` em kebab-case, valor estável e nunca texto
traduzido, `location` no formato `docs_<section-id>` — é regra de todos os eventos,
em [`07-analytics.md`](07-analytics.md). O que é desta categoria:

| evento | quem dispara | payload tipado |
|---|---|---|
| `page_change` | o Pagination, ao CONFIRMAR a mudança de página | `page`, `total_pages` |
| `tab_change` | o Tabs, ao trocar de aba | `component`, `label`, `index`, `total`, `location` — ver a divergência abaixo |
| `breadcrumb_ellipsis_open` | o Breadcrumb, ao abrir os níveis recolhidos | tipado nas cinco stacks |
| `navigation_click` | quem escolhe um destino no Breadcrumb ou no NavigationMenu | tipado; o `label` é id estável, nunca o texto do link — ver §O que está aberto |
| eventos de menu da barra | o Menubar | §9 de [`dropdown-menu.md`](../prd/dropdown-menu.md) |
| `step_change` | o Stepper, ao trocar de etapa | `component: 'stepper'`, `step`, `total`, `location` — §9 de [`stepper.md`](../prd/stepper.md) |

- **`pagination_change` não existe**, e `tab_change` não tem campos de origem e
  destino. Os dois eram ensinados por guidelines de stack; evento anunciado em
  guideline e não tipado não é visto por portão nenhum.
- **O `tab_change` diverge no tipo e no valor**: `component` é opcional em react, vue
  e svelte e obrigatório (`'tabs'`) em vanilla e angular; o `label` carrega o texto
  visível da aba em react, vue e vanilla, e o `value` estável em svelte e angular; e o
  `location` do angular é `docs-demonstration`, contra `docs_demo` nas outras quatro.
  Texto visível é texto traduzido, que a regra do payload proíbe.
- **Nunca se rastreia a página atual do Breadcrumb**: ela não é destino.

---

## Tom de voz na navegação

A regra é de [`05-tom-de-voz.md`](05-tom-de-voz.md), que hoje tem linha só para o
Pagination. O que a categoria fixa:

| onde | forma |
|---|---|
| prev/next do Pagination | "Anterior" e "Próxima", no feminino (página), sem abreviação |
| nome acessível de prev/next | completa o alvo: "Ir para a próxima página" |
| rótulo de aba | substantivo curto, sem ponto final — a aba nomeia um painel |
| item de NavigationMenu e de Breadcrumb | o nome do destino, substantivo — o item leva a um lugar |
| item de comando do Menubar | verbo, como os termos de ação de [`05-tom-de-voz.md`](05-tom-de-voz.md) ("Salvar", "Excluir") — o item faz algo |
| nome da região de navegação | diz QUAL navegação é, e é único na tela |

---

## Invariantes — quem cobra cada regra

A regra que atravessa componentes e stacks não se mantém verdadeira por instrução: o
que a mantém é um **portão**. Esta tabela diz qual, e o que ele não cobre — metade
coberta que se anuncia inteira é o defeito que ela existe para evitar.

| invariante | onde a regra está | portão | o que o portão NÃO cobre |
|---|---|---|---|
| Catálogo de componente mora no PRD, não na guideline | aqui, §Por que este arquivo existe | `catalogo_duplicado_com_prd` | ele exige `docs/shared/prd/<slug>.md` e **não lê `prd-familia`**: como o Menubar não tem PRD com o próprio nome, as seções `## Menubar` das guidelines de stack não são vistas por ele. E o regex é `^## <Título>$` exato, nível 2 |
| A regra de categoria não volta a ser copiada por stack | aqui | `guideline_de_stack_repete_categoria` | o mapa dele não tem entrada para esta categoria (§O que está aberto). Aqui a entrada CABE no formato — a categoria mora num arquivo só por stack, a `05` —, mas acrescentá-la é alterar portão |
| Breadcrumb, NavigationMenu e Pagination não se envolvem em outro `<nav>`; nome único por tela | aqui, §Marco e nome | nenhum | nenhuma regra do auditor olha marco de componente; o `landmark-unique` do axe só roda nas stories |
| `aria-current` com valor que diz de quê | aqui, §Estado atual | nenhum | o auditor só cita `aria-current` como estado de `play`; valor e presença não são conferidos |
| Widget composto é uma parada; lista de destinos é uma por item | aqui, §Teclado na navegação | nenhum de auditor | o Tab do Menubar é cobrado pelo contrato de família e pelas plays; Tabs e NavigationMenu, só por story |
| Anel de foco visível e opaco | [`01-acessibilidade.md`](01-acessibilidade.md) | `anel_de_foco_ausente` · `focus_ring_sobrescrito` · `focus_ring_translucido` | o translúcido só lê `box-shadow`, então o contorno a 50% do `breadcrumb.css` passa; e o teste de opacidade casa na faixa de `--background`, então o anel a 50% do `tabs.css` também passa |
| Elevação por tipo de superfície | [`04-padroes-design-sistema.md`](04-padroes-design-sistema.md) §Qual degrau | `elevacao_fora_do_mapa` | Breadcrumb, Stepper e Pagination ficam fora por não lerem elevação — correto aqui, porque não flutuam |
| Origem da animação do painel flutuante | [`18-overlay.md`](18-overlay.md) | a regra de cadeia de `transform-origin` | `navigation-menu.css` é exceção declarada, e a forma de painel do vanilla não é conferida |
| Vocabulário do payload | [`07-analytics.md`](07-analytics.md) | `event_not_typed` · `i18n_text_in_payload` · `component_nao_kebab` · `location_fora_do_vocabulario` | `event_not_typed` lê só o conteúdo compartilhado: nome de evento em guideline ou em snippet de docs page não é lido. Foi o caso de `pagination_change` |
| Token citado no PRD existe na folha | [`docs/shared/prd/README.md`](../prd/README.md) | `prd_token_sem_lastro` | lê só a seção de geometria do PRD |
| Guideline de componente não carrega código de implementação | [`CLAUDE.md`](../../../CLAUDE.md) §Conventions | `auditGuidelineCode` | vale para os arquivos 04 a 10 de cada stack, inclusive a `05` |

### O que está aberto

Cada item aqui tem medição e espera decisão. Nenhum é defeito de texto.

1. **Em que categoria mora o Menubar.** Conteúdo e Storybook dizem Navegação; o PRD
   da família e a [`18-overlay.md`](18-overlay.md) o tratam como menu de comandos; e
   as guidelines de react e vue diziam para não usá-lo em navegação entre páginas.
   Decidir a categoria, e com ela se as seções `## Menubar` migram para o PRD da
   família — que hoje não descreve nome acessível da barra nem uso como navegação.
2. **O nome padrão do Breadcrumb é `breadcrumb`, em inglês, nas cinco stacks.** A
   página é pt-BR, en e es; o nome não segue o idioma.
3. **O nome padrão do NavigationMenu no vanilla colide com o da Sidebar** nos
   exemplos das guidelines de acessibilidade e de padrões ("Navegação principal").
4. **Cinco formas de anel de foco em seis folhas**, duas delas translúcidas e
   invisíveis ao portão que existe para pegá-las.
5. **O Tabs do vanilla só tem ativação automática.** As outras quatro publicam
   ativação manual (`activationMode`), que é o que se quer quando o painel carrega
   dado. A referência não tem o recurso que as outras têm.
6. **O `label` do `tab_change` é texto traduzido em três stacks e `value` estável em
   duas.** A regra do payload já decide a forma; a decisão é se o evento passa a
   levar o `value` nas cinco. O `component` também é opcional em três.
7. **Os dois sistemas de controle do Pagination.** O vanilla, que é a referência,
   veste `.nds-pagination-link` standalone; as outras quatro compõem sobre
   `.nds-button`. Não é API de framework: é markup e classe, e tem fonte de verdade.
   A folha afirma que a convivência "está registrada como material de cross-stack",
   e esse registro não existe.
8. **`pagination_change` ainda é ensinado** pelo snippet de importação da docs page
   do vanilla, e não compila para quem copiar. É código de docs page, da revisão.
9. **O limiar para paginar tem quatro números no repositório** — 10 em duas
   guidelines de navegação antigas, 20 em outras duas. A categoria não tem o seu.
10. **A cadeia de origem da animação do painel do NavigationMenu** é exceção
    declarada no auditor, e a terceira forma de painel, a do vanilla, não é
    conferida por nada.
11. **Só o Breadcrumb tem entrada no mapa do Figma**
    (`docs/shared/figma/design-links.ts`); NavigationMenu, Stepper e Tabs não têm, e
    o arquivo do Figma não tem página para eles.
12. **A entrada desta categoria no `guideline_de_stack_repete_categoria` não foi
    feita.** O formato do mapa comporta — a categoria mora inteira na `05` —, mas
    alterar o mapa é alterar portão, o que pede prova com defeito replantado e
    comparação regra a regra contra o HEAD, ou seja varredura `--all`, que é decisão
    da dona. Os cabeçalhos deste arquivo levam "na navegação" ou "de navegação" para
    não colidir com títulos legítimos de stack quando a entrada vier.
13. **`breadcrumb_ellipsis_open` é tipado nas cinco stacks e disparado em duas**
    (react e svelte). Disparar nas cinco ou tirar das tabelas — é a forma do
    `badge_click` da categoria Feedback, que foi removido. Medição na §9 de
    [`breadcrumb.md`](../prd/breadcrumb.md).
14. **O `label` do `navigation_click` é texto traduzido em react, vue e vanilla**, e
    chave estável em svelte e angular. Texto traduzido parte a série do evento em
    três; a regra do payload já decide a forma, falta o conserto.
15. **Os níveis escondidos do Breadcrumb viram item de COMANDO em quatro stacks e
    LINK no Angular.** Pela regra de §Link ou botão, nível do caminho é destino e o
    Angular é quem está certo — mas é maioria contra regra, e o conserto passa por
    quatro stacks.
16. **O Figma do Breadcrumb confere com o código** (nós `353:298` e `353:12`:
    medidas e os três estados do link), menos as reticências, que a trilha montada
    não tem.
17. **O Stepper é controle, e o texto o chama de indicador.** Nas cinco stacks as
    etapas são `<button>` com `aria-current="step"`, e a folha e o conteúdo o
    descrevem como "indicador de progresso". As cinco docs pages mostram prévias sem
    seleção ligada — o uso que o próprio componente trata como defeito. Decidir se
    nasce uma variante só de leitura, ou se as prévias passam a ter seleção.
18. **O número da etapa futura calcula de 2.00:1 a 3.01:1** nos três temas e nos
    dois modos, e a folha não declara o tamanho da fonte dele — então não se sabe
    se o piso é 3:1 ou 4.5:1. Aritmética sobre as folhas de tema, não medição em
    navegador: confirmar antes de corrigir.
19. **Mover o foco para o painel ao trocar de etapa é contrato ou escolha de quem
    compõe?** Vanilla e svelte movem, react, vue e angular não, e o conteúdo promete
    que sempre move.
20. **`docs_composition` não está no vocabulário de `location`**, e o
    `step_change` o usa — com três vocabulários diferentes entre as stacks.
21. **Em widget composto, onde fica o `tabindex="0"` quando foco e seleção se
    separam?** No Tabs, vanilla e svelte o mantêm na aba ATIVA; react, vue e angular
    o levam para a aba FOCADA. É a única parada de Tab do widget, então a escolha
    decide para onde a pessoa volta — e o conteúdo afirma a primeira forma.
22. **`aria-orientation="horizontal"` é escrito pelas libs de vue e svelte.** É o
    valor implícito de uma lista de abas; o vanilla o omite e tem teste que reprova se
    ele aparecer. Remover nas duas ou registrar como mecânica de lib.
23. **O svelte expõe `disabled` na raiz do Tabs**, o que poria `disabled` nativo em
    todas as abas — e tiraria todas do percurso de setas, contra a regra de
    indisponível em widget composto.
24. **O conteúdo do Tabs promete estilo de hover, e a folha não tem `:hover`.**
25. **Os eventos do NavigationMenu têm dois vocabulários.** O tipado nas cinco
    `analytics.ts` e escrito em [`07-analytics.md`](07-analytics.md) é
    `navigation_click`, e só o Angular o dispara. O conteúdo compartilhado e quatro
    docs pages anunciam `nav_menu_open` e `nav_link_click`, que nenhuma stack tipa —
    são os dez `event_not_typed` do slug. Decidir qual vocabulário fica.
26. **O vanilla é minoria duas vezes no NavigationMenu.** Só ele tem nome acessível
    padrão (e o nome colide com o da Sidebar, item 3), e só ele NÃO fecha o painel
    quando o ponteiro sai — as quatro libs fecham.
27. **As paradas de Tab da barra do NavigationMenu divergem**: uma parada no angular,
    uma por item no vanilla e no vue, não medido em react e svelte. O modelo de
    divulgação admite os dois; a categoria precisa de um.
28. **O fundo do gatilho aberto do NavigationMenu** é pintado em react e angular; em
    vanilla, vue e svelte só o chevron gira.
29. **O comentário de cabeçalho de `navigation-menu.css` ensina `role="menubar"`,
    `role="menu"` e `aria-haspopup`**, que o vanilla recusa de propósito e nenhuma
    stack emite. É a folha documentando o padrão que a categoria proíbe para
    navegação — ver §Teclado na navegação.
