# Invariantes da categoria Overlay — onde moram e quem os cobra

Levantado em 2026-09-10, sobre os **nove PRDs de overlay** (`dialog`,
`alert-dialog`, `sheet`, `drawer`, `popover`, `hover-card`, `tooltip`,
`dropdown-menu`, `command`) e as **115 regras** de `scripts/audit.mjs` — 121
depois das seis que este levantamento produziu.

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
| Elevação e sombra por camada | 9 | parcial — `prd_token_sem_lastro`, `token_table_row_incoerente` |
| `reason` no evento de fechamento | 5 | `reason_parcial_entre_stacks` |
| Nível do cabeçalho do título | 5 | `nivel_de_titulo_divergente` |
| Cadeia de `transform-origin` por lib | 4 | `cadeia_transform_origin_sem_bits` · `_premissa` · `_nao_declarada` |
| Largura como custom property com default em `:root` | 4 | parcial — `undocumented_component_var` |
| Anel de foco | 4 | `focus_ring_sobrescrito` · `focus_ring_translucido` |
| Modalidade (`aria-modal`) e o que ela liga | 3 | `modalidade_sem_condicao` (metade — ver abaixo) |
| O `<form>` e o rodapé | 3 | parcial — `submit_fora_do_form` (metade retratada por falso positivo) |
| Vocabulário do payload | 2+ | `i18n_text_in_payload` · `component_nao_kebab` · `campo_gatilho_divergente` · `location_fora_do_vocabulario` · `campo_de_payload_morto` |
| O véu não desfoca o fundo | 2 | `veu_com_desfoque` |
| Corpo é `flex: 1 1 auto`, nunca o atalho | 2 | `corpo_com_atalho_flex` |
| Ordem dos botões no rodapé | 2 | play, nas cinco — **só no dialog**; o drawer não a assere em stack nenhuma |

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
como já coberto pela suíte. Sobram três coisas, e todas são de conteúdo, não de
mecanismo:

1. **O `reason` está parcial, e o portão novo ACUSA isso** — 7 achados no dia em
   que nasceu: `hover_card_close` falta em quatro stacks e `popover_close` em
   três. O portão está certo e a árvore é que está errada. Fechar tem duas
   metades: o popover adota a forma do drawer (motivos observáveis no wrapper,
   sem apoio de lib — é o que o drawer prova), e o hover-card é decisão da dona,
   entre espalhar o campo ou removê-lo. Remover é defensável: o componente é
   passivo, e fechar é quase sempre "o ponteiro saiu".
2. **A ordem do rodapé do drawer** não é asserida em stack nenhuma, enquanto a
   do dialog é asserida nas cinco. É play, não regra de audit.
3. **Três invariantes com cobertura PARCIAL** — elevação, largura como custom
   property, e o `<form>` com o rodapé. Nenhum é o eixo desta rodada, e cada um
   precisa de medição própria antes de virar regra.

## O que este arquivo NÃO promete

Que a lista esteja completa. Ela sai dos títulos `D<n>` dos PRDs, e um invariante
que nunca virou decisão fixada em PRD nenhum não aparece aqui — foi exatamente o
caso do movimento reduzido até 2026-09-09, que vivia só em comentário de CSS e
por isso foi relatado duas vezes como defeito.

O teste de que a lista fechou não é ela ficar sem linhas vermelhas: é **um
relato novo cair num assunto que já está aqui**. Enquanto chegar achado de
assunto que não está na tabela, o levantamento está incompleto e a tabela ganha
uma linha.
