# Invariantes da categoria Overlay — onde moram e quem os cobra

Levantado em 2026-09-10, sobre os **nove PRDs de overlay** (`dialog`,
`alert-dialog`, `sheet`, `drawer`, `popover`, `hover-card`, `tooltip`,
`dropdown-menu`, `command`) e as **111 regras** de `scripts/audit.mjs`.

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
| Movimento para sob `prefers-reduced-motion` | 9 | **nenhum** |
| Elevação e sombra por camada | 9 | parcial — `prd_token_sem_lastro`, `token_table_row_incoerente` |
| `reason` no evento de fechamento | 5 | **nenhum** |
| Nível do cabeçalho do título | 5 | **nenhum** |
| Cadeia de `transform-origin` por lib | 4 | `cadeia_transform_origin_sem_bits` · `_premissa` · `_nao_declarada` |
| Largura como custom property com default em `:root` | 4 | parcial — `undocumented_component_var` |
| Anel de foco | 4 | `focus_ring_sobrescrito` · `focus_ring_translucido` |
| Modalidade (`aria-modal`) e o que ela liga | 3 | **nenhum** |
| O `<form>` e o rodapé | 3 | parcial — `submit_fora_do_form` (metade retratada por falso positivo) |
| Vocabulário do payload | 2+ | `i18n_text_in_payload` · `component_nao_kebab` · `campo_gatilho_divergente` · `location_fora_do_vocabulario` · `campo_de_payload_morto` |
| O véu não desfoca o fundo | 2 | **nenhum** |
| Corpo é `flex: 1 1 auto`, nunca o atalho | 2 | **nenhum** |
| Ordem dos botões no rodapé | 2 | **nenhum** |

## A previsão

**Seis invariantes sem portão nenhum**, e eles são a lista dos próximos relatos.
Dois deles já geraram relato repetido antes de ganharem regra — o padrão não é
hipótese, é histórico.

Por retorno sobre custo:

1. **Movimento reduzido** (9 componentes). O maior alcance e o mais barato de
   cobrar: duração que não vem de `var(--duration-*)` tem de aparecer num bloco
   de `prefers-reduced-motion` que a zere. Estado medido em 2026-09-10: 6
   animações com duração literal e 5 com token, **todas guardadas** — o portão
   é seguro de regressão, não conserto.
2. **`reason` no fechamento** (5). Hoje o `drawer` é o modelo — campo
   obrigatório, vocabulário fechado (`escape | overlay | close-button | api`),
   as cinco stacks disparam. O `hover-card` manda em 1 de 5 e o `popover` em 2
   de 5, com 12 call sites sem o campo só no Svelte. Campo opcional preenchido
   por parte das stacks é pior que campo ausente: no GA4 não há como separar
   "fechou por motivo desconhecido" de "fechou numa stack que não reporta".
3. **Nível do cabeçalho** (5). Importa onde o outline da página continua vivo —
   `popover`, `hover-card`, `dropdown-menu`, `command` —, e quase não importa
   nos quatro painéis com `aria-modal`, onde a tecnologia assistiva escopa a
   pessoa para dentro.
4. **Modalidade** (3), **véu sem desfoque** (2), **`flex: 1 1 auto`** (2) e
   **ordem do rodapé** (2) — os quatro são declarações de uma linha, e nenhum
   tem hoje quem os replante.

## O que este arquivo NÃO promete

Que a lista esteja completa. Ela sai dos títulos `D<n>` dos PRDs, e um invariante
que nunca virou decisão fixada em PRD nenhum não aparece aqui — foi exatamente o
caso do movimento reduzido até 2026-09-09, que vivia só em comentário de CSS e
por isso foi relatado duas vezes como defeito.

O teste de que a lista fechou não é ela ficar sem linhas vermelhas: é **um
relato novo cair num assunto que já está aqui**. Enquanto chegar achado de
assunto que não está na tabela, o levantamento está incompleto e a tabela ganha
uma linha.
