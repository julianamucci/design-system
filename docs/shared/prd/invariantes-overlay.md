# Invariantes da categoria Overlay — onde moram e quem os cobra

Levantado em 2026-09-10, sobre os **nove PRDs de overlay** (`dialog`,
`alert-dialog`, `sheet`, `drawer`, `popover`, `hover-card`, `tooltip`,
`dropdown-menu`, `command`) e as **115 regras** de `scripts/audit.mjs` — 122
depois das sete que este levantamento produziu: as seis dos invariantes que
estavam descobertos, mais o `elevacao_fora_do_mapa`, que nasceu depois, quando a
regra de elevação foi fixada.

> O cabeçalho dizia "121 depois das seis" enquanto a tabela abaixo já listava o
> sétimo portão — corrigido em 2026-09-10, contando no arquivo.

> A primeira redação dizia 111, e o número saiu de um `grep` cujo conjunto de
> caracteres não tinha dígitos: nomes como `ga4_in_preview_head` ficaram de fora
> da contagem. Fica registrado porque é a mesma família dos dois cuidados da
> seção de método — um padrão que erra por menos parece confirmar o que se
> esperava, e ninguém confere um número que já bate com a expectativa.

## Por que este arquivo existe

O `README.md` deste diretório descreve dois eixos, e eles são reais:

- o **PRD** é *um componente × cinco stacks*;
- a **guideline** é *uma stack × muitos componentes*.

Falta o terceiro, e é dele que vem a repetição: **uma regra × muitos componentes
× cinco stacks**. Um invariante desse eixo não tem casa em documento nenhum —
ele aparece pedaço a pedaço, num D de cada PRD, e o que o mantém verdadeiro em
todos ao mesmo tempo só pode ser um portão.

O sintoma medido, entre 2026-09-03 e 2026-09-10: os oito componentes de overlay
foram reabertos entre 20 e 64 vezes cada, e **três achados voltaram como
"defeito novo" duas ou três vezes**, por agentes diferentes — a cadeia de
`transform-origin`, a guarda de movimento reduzido e o nome da opção de nível de
título. Nenhuma das rodadas errou: cada uma consertou a instância que via, e o
eixo continuou sem dono.

No mesmo período entraram **28 regras novas** no audit. A campanha produz
portão; o que faltava era saber **quais invariantes ainda não têm um**, que é a
única forma de responder "quando isto acaba" com uma lista em vez de uma
impressão.

## Método, para poder ser refeito

1. Extrair os títulos `### D<n>` dos nove PRDs — **87 decisões fixadas**.
2. Agrupar por ASSUNTO e contar em quantos PRDs cada assunto aparece. Assunto
   que aparece em um só é decisão do componente, e sai da lista.
3. Para cada assunto restante, procurar regra no `audit.mjs` por nome e por
   implementação.

Dois cuidados que mudaram o resultado, e valem para quem refizer: `grep -E` trata
`\|` como barra LITERAL, então padrões alternados escritos com `\|` devolvem zero
e parecem confirmar ausência — dois assuntos deste levantamento (nível de título
e desfoque do véu) deram zero por isso na primeira passada. E "aparece no PRD"
não é o mesmo que "é uma decisão fixada": movimento reduzido aparece nos nove,
mas como parágrafo de seção, nunca como `D`.

## O inventário

Ordenado por quantos componentes o invariante atravessa — que é a ordem de
prioridade, porque é a ordem do custo quando ele quebra.

| invariante | PRDs que o escrevem | portão |
|---|---|---|
| Movimento para sob `prefers-reduced-motion` | 9 | `movimento_sem_guarda_eficaz` |
| Elevação por tipo de superfície | 9 | `elevacao_fora_do_mapa` — e `prd_token_sem_lastro` confere cada PRD contra a folha |
| `reason` no evento de fechamento | 5 | `reason_parcial_entre_stacks` |
| Nível do cabeçalho do título | 5 | `nivel_de_titulo_divergente` |
| Cadeia de `transform-origin` por lib | 4 | `cadeia_transform_origin_sem_bits` · `_premissa` · `_nao_declarada` |
| Largura como custom property com default em `:root` | 3 | não é invariante da categoria — ver abaixo |
| Anel de foco | 4 | `focus_ring_sobrescrito` · `focus_ring_translucido` |
| Modalidade (`aria-modal`) e o que ela liga | 3 | `modalidade_sem_condicao` (metade — ver abaixo) |
| O `<form>` e o rodapé | 3 | `submit_fora_do_form` no conteúdo compartilhado · play lendo `button.form` no código, nas cinco |
| Vocabulário do payload | 2+ | `i18n_text_in_payload` · `component_nao_kebab` · `campo_gatilho_divergente` · `location_fora_do_vocabulario` · `campo_de_payload_morto` |
| O véu não desfoca o fundo | 2 | `veu_com_desfoque` |
| Corpo é `flex: 1 1 auto`, nunca o atalho | 2 | `corpo_com_atalho_flex` |
| Ordem dos botões no rodapé | 2 | play, nas cinco — **só no dialog**; no drawer, o DOM renderizado não é asserido em stack nenhuma (o snippet é, no vue) |

### Os três que estavam marcados "parcial", relidos em 2026-09-10

O rótulo tinha saído do NOME das regras vizinhas, não do que elas cobram. Lidas
as regras, eram três casos diferentes:

- **O `<form>` e o rodapé nunca foi parcial.** O `submit_fora_do_form` cobra o
  conteúdo compartilhado, onde cada chave de snippet é um bloco contíguo e a
  contagem de `<form>` é confiável. A varredura do código das stacks foi escrita
  e RETIRADA em 2026-09-08 (16 achados, a maioria falsa), e o próprio audit diz
  que essa metade ficou com a suíte, lendo `button.form`. Conferido: essa
  asserção existe nas cinco. É o mesmo desenho da ordem do rodapé — audit onde a
  checagem estática é confiável, suíte onde não é.
- **A elevação era parcial de verdade, porque a regra não estava escrita.** Os
  degraus seguiam um padrão, mas ele só existia espalhado em nove PRDs, cada um
  dizendo o próprio valor; o `prd_token_sem_lastro` conferia cada documento
  contra a própria folha, que é coerência de documento, não de categoria. A dona
  fixou a regra no mesmo dia — card `sm`, flutuante interativo `md`, flutuante
  passivo `lg`, modal e drawer `xl` — e ela divergia do código em SEIS folhas
  (dialog, alert-dialog e sheet estavam em `lg`; hover-card e tooltip em `xl`; o
  drawer não tinha sombra). As seis foram alinhadas, a regra foi para
  `04-padroes-design-sistema.md`, e o portão `elevacao_fora_do_mapa` passou a
  cobrá-la. Medido em Chromium com o tema ativo: os dez painéis pintam o degrau
  do seu tipo.
- **A largura não é invariante da categoria.** Só três dos nove têm largura como
  custom property (`sheet`, `drawer`, `hover-card`), e o popover é exceção
  declarada (D6). Os outros cinco não fixam largura desse jeito. É um padrão de
  três painéis — e o `undocumented_component_var` cobra só que um gancho
  DECLARADO seja documentado, não que ele exista. Fica aqui como decisão de três
  PRDs, sem portão de categoria, porque não há categoria para cobrar.

### O que cada portão novo NÃO cobre

Declarado aqui porque metade coberta que se anuncia inteira é o defeito que este
arquivo existe para evitar.

- **`modalidade_sem_condicao`** cobre um lado só: a família NÃO-modal não pode
  atribuir `aria-modal` ao literal `true` sem condição. O inverso — a família
  modal ter de anunciá-lo — não é conferível assim, porque o React também
  escreve o atributo sob condição (`modal === true ? …`), e ali "sem condição"
  deixa de separar as duas famílias. Naquele lado quem mede é a suíte, que já
  assere `toHaveAttribute('aria-modal', 'true')`.
- **`nivel_de_titulo_divergente`** lê o default no vanilla, que é onde ele está
  ESCRITO. Nas outras quatro o default vem da lib e não há linha para conferir.
- **Ordem do rodapé** não ganhou regra de audit de propósito: a asserção de
  ordem de DOM na play é mais forte que qualquer regex, e já existe nas cinco
  para o dialog. Escrever uma regra estática ao lado dela seria duplicar por
  baixo. O que falta é a mesma asserção no drawer, que hoje nenhuma stack faz.

## O que sobrou aberto

Os sete que estavam sem portão foram fechados em 2026-09-10 — seis com regra
nova no `audit.mjs`, cada uma provada replantando o defeito, e o sétimo medido
como já coberto pela suíte. Sobra uma, e ela é de conteúdo, não de mecanismo:

1. **A ordem do rodapé do drawer** não é asserida no DOM renderizado em stack
   nenhuma, enquanto a do dialog é asserida nas cinco. É play, não regra de
   audit. O que existe é a metade do SNIPPET, e só no vue:
   `drawer.source.test.ts` ("a saída vem PRIMEIRO no rodapé, e a ação primária
   depois") — é o mesmo caso que o D3 do `drawer.md` registra como tendo cobrado
   a ordem INVERTIDA, virado para a certa. Snippet certo não prova story certa:
   foi exatamente a divergência entre superfícies que o D3 mediu.

O `reason` parcial, que o portão acusou no dia em que nasceu (7 achados), foi
fechado no mesmo dia pelas duas metades: o hover-card perdeu o campo, e o popover
passou a mandá-lo nas cinco — obrigatório, fechado, com as quatro palavras do
drawer. `reason_parcial_entre_stacks` em zero.

O Toast, que ficou pendente na regra de elevação, foi decidido pela dona no
mesmo dia: `xl`. O motivo é de camada, não de interação — `--z-toast` (1080)
fica acima de `--z-modal` (1050), então ele aparece por cima de um diálogo
aberto e é a superfície mais alta da tela.

## O que este arquivo NÃO promete

Que a lista esteja completa. Ela sai dos títulos `D<n>` dos PRDs, e um invariante
que nunca virou decisão fixada em PRD nenhum não aparece aqui — foi exatamente o
caso do movimento reduzido até 2026-09-09, que vivia só em comentário de CSS e
por isso foi relatado duas vezes como defeito.

O teste de que a lista fechou não é ela ficar sem linhas vermelhas: é **um
relato novo cair num assunto que já está aqui**. Enquanto chegar achado de
assunto que não está na tabela, o levantamento está incompleto e a tabela ganha
uma linha.
