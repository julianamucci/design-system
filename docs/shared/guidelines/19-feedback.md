# Feedback — as regras da categoria

Vale para os cinco componentes de feedback, nas cinco stacks: **Alert, Badge,
Progress, Skeleton** e **Sonner** (a torrada; a folha, as classes e o payload usam
esse nome desde 2026-09-13, e só a região se chama `Toaster`).

Este arquivo guarda o que ATRAVESSA os componentes. O que cada um É — contrato,
decisões com data e medição, tokens, peças das cinco stacks — está no PRD dele:

| componente | PRD |
|---|---|
| Alert | [alert.md](../prd/alert.md) |
| Badge | [badge.md](../prd/badge.md) |
| Progress | [progress.md](../prd/progress.md) |
| Skeleton | [skeleton.md](../prd/skeleton.md) |
| Sonner | [sonner.md](../prd/sonner.md) |

O **AlertDialog** não é desta categoria, e aparece aqui porque quem procura por
"confirmação" pensa em feedback: é overlay de decisão obrigatória, com regra em
[`18-overlay.md`](18-overlay.md) e contrato em [`alert-dialog.md`](../prd/alert-dialog.md).

## Por que este arquivo existe

Até 2026-09-13 a regra de categoria vivia em **cinco cópias**, uma
`07-feedback-components.md` por stack, e elas divergiam do mesmo jeito que as de
overlay divergiam antes da unificação de 2026-09-10. Medido naquele dia:

- **149 linhas no Svelte contra 316 no Vue** para o mesmo assunto;
- as regras transversais — critério Alert × Sonner, acessibilidade, analytics,
  tom de voz — existiam **só no React e no Vue**, idênticas entre as duas a menos
  de um caminho de link. As outras três nunca as tiveram;
- o **vanilla**, que é a stack de REFERÊNCIA, documentava **quatro** variantes de
  Alert enquanto as outras quatro documentavam cinco — e o código tem cinco nas
  cinco;
- a cópia do **Svelte** afirmava que o `role="alert"` é "aplicado automaticamente
  pelo Bits UI", e o primitivo daquela stack não importa lib nenhuma;
- a do **vanilla** dizia que o Alert tem "padding fixo em `--spacing-4`" e gap de
  `--spacing-1`; a folha declara `padding-block: --spacing-2` e
  `row-gap: --spacing-0-5`;
- três cópias fechavam a seção Badge mandando disparar `button_click`, contra o
  `badge_click` que estava tipado nas cinco stacks — e a ironia é que elas estavam
  CERTAS pelo motivo errado: em 2026-09-13 a dona removeu o `badge_click`
  justamente porque o clique é do botão. Nenhuma das três dizia por quê, e por isso
  a divergência passava por descuido;
- a do **vanilla** e a do **Angular** mandavam usar Skeleton ou spinner "para
  progresso indeterminado", modo que o Progress entrega nas cinco, com story,
  conteúdo e animação próprios;
- a do **Vue** ensinava trocar a cor do Progress com sintaxe de uma biblioteca
  aposentada e afirmava que o componente "não tem variantes de cor nativas".

Aqui a regra fica UMA vez, e a última seção diz qual portão cobra cada uma. O que
é mecânica de uma stack só — a fábrica do vanilla, a diretiva do Angular —
continua na `07-feedback-components.md` daquela stack, e o portão
`guideline_de_stack_repete_categoria` impede que a cópia volte. Catálogo de
componente não fica em guideline nenhuma: vai para o PRD, e o portão
`catalogo_duplicado_com_prd` cobra isso.

---

## Qual componente

| Situação | Componente |
|---|---|
| Mensagem persistente, que pede leitura e possivelmente ação | Alert |
| Confirmação temporária do que acabou de acontecer | Sonner |
| Erro crítico, que bloqueia o fluxo | Alert — nunca Sonner |
| Decisão obrigatória antes de seguir | AlertDialog (overlay) |
| Rótulo de estado, curto, dentro de frase, célula ou lista | Badge |
| Quanto falta de uma tarefa com fim conhecido | Progress |
| Espera pelo conteúdo que vai ocupar aquele espaço | Skeleton |

**O que separa Alert de Sonner é a permanência, não a gravidade**: o Alert entra
no fluxo da página e fica até alguém agir; a torrada é sobreposta, some sozinha e
não bloqueia. Torrada que desaparece não pode ser o único registro de um erro —
por isso erro crítico é Alert ou AlertDialog nas duas pontas da regra.

**Skeleton e Progress respondem perguntas diferentes**: o esqueleto diz "o que
vem aqui tem esta forma"; a barra diz "falta tanto". Espera sem fim conhecido é
esqueleto, ou é a barra em modo indeterminado — que existe nas cinco stacks, com
`data-indeterminate`, animação própria e story.

---

## Cor, superfície e o que a cor pode dizer

**A cor nunca é o único indicador de estado** (WCAG 1.4.1): a variante semântica
sempre vem acompanhada de ícone e de texto. Vale para Alert, Badge e Progress.

**Em contêiner colorido, o texto corrido é `--foreground`.** Ícone e título podem
carregar a cor semântica — são elementos curtos, com limiar de 3:1 —, e a
descrição não, porque cor semântica sobre fundo suave raramente alcança os 4,5:1
que texto longo exige. O contraste não pode depender da variante escolhida.

Como cada um aplica isso, medido nas folhas em 2026-09-13:

| componente | onde a cor semântica entra | o que fica neutro |
|---|---|---|
| Alert | fundo, borda e **só o ícone** | título e descrição, em `--foreground` |
| Badge | **só a borda**, de 2px | fundo `--background` e texto `--foreground` — nenhum texto do componente carrega cor semântica |
| Progress | o indicador, por `data-variant` (`success`, `destructive`) | a trilha, sempre neutra |
| Skeleton | não tem variante semântica | a superfície é neutra nos dois modos |
| Sonner | o fundo do tipo, e só com `richColors` ligado | o texto, que segue a superfície |

## Anúncio: qual papel, e onde a região viva mora

Esta é a regra mais fácil de errar da categoria, e a que mais divergiu. O
princípio: **quem anuncia é o elemento que o leitor de tela observa**, e ele não
se aninha — região viva dentro de região viva é anúncio duplicado ou anúncio
nenhum.

| componente | o que o código faz nas cinco | quem escolhe |
|---|---|---|
| Alert | a raiz é a própria região viva, pelo papel: `role` configurável com `alert`, `status` ou `note`, default `alert` | quem compõe, pelo `role` |
| Progress | `role="progressbar"` com `aria-valuemin` e `aria-valuemax` sempre presentes, e `aria-valuenow` **omitido** no indeterminado (padrão APG) | o componente |
| Skeleton | `aria-hidden="true"` fixo, não configurável — o esqueleto é decoração | o componente |
| Sonner | `polite`, nunca `assertive`: as cinco plays afirmam a AUSÊNCIA de `assertive`. O atributo mora na REGIÃO, e a notificação não carrega `role` nem `aria-live` — região viva só é observada se já existir ANTES de o conteúdo mudar, e a notificação É o conteúdo | o design system nas duas sem lib; a lib nas três com lib, com patch no svelte para desfazer o aninhamento |
| Badge | não anuncia nada: não é interativo, não tem papel e não recebe foco | — |

- **Alert que já está na tela quando a página carrega usa `note`.** Estático não
  é região viva: `alert` e `status` existem para conteúdo que APARECE depois.
- **Alert não se envolve em outro `aria-live`.** A raiz já é a região; envolvê-la
  aninha duas. Medido em 2026-09-13: a story `DynamicInsertion` das cinco stacks
  renderiza `role="alert"` dentro de um `aria-live="polite"`, e o conteúdo
  compartilhado ensina isso em três chaves — texto anterior ao `role`
  configurável.
- **A espera do Skeleton é anunciada pela REGIÃO, e a região é peça** desde
  2026-09-13, por decisão da dona: `SkeletonRegion` nas quatro stacks de
  framework, `createSkeletonRegion` no vanilla e `div[ndsSkeletonRegion]` no
  Angular, sempre com `role="status"`, `aria-busy="true"`, nome acessível
  obrigatório e `data-slot="skeleton-region"`. Ela não tem CSS próprio: quem
  compõe põe `nds-stack` ou `nds-grid` nela.
  **Até ali as cinco docs pages a montavam à mão**, e tinham divergido em cinco
  formas — no Svelte, a lista da demonstração ficou sem `role="status"`. Regra que
  cada consumidor executa por conta é regra que se perde no quinto consumidor.
- **Erro nunca é `assertive` por reflexo.** Interromper a leitura se justifica
  quando a pessoa perde algo por não ouvir agora; na torrada isso não acontece,
  porque o registro do erro tem de estar também em lugar permanente.

## Movimento

Quem para o movimento nesta casa é a **camada de token**: sob
`prefers-reduced-motion`, `docs/shared/tokens/motion.css` zera a escada de
`--duration-*`. Duração LITERAL escapa disso e precisa de bloco próprio na folha
— e o bloco tem de **vencer por especificidade**, senão fica inerte.

Medido em 2026-09-13, nas duas folhas desta categoria que animam:

| folha | o que anima | duração | guarda |
|---|---|---|---|
| `progress.css` | o indeterminado | por token | própria, (0,2,0) e no fim do arquivo — vence |
| `skeleton.css` | o pulso | por token, `--duration-cycle` | própria, e vence porque nenhuma regra de atributo declara `animation` |
| `sonner.css` e a folha da lib | entrada e saída | por token nas duas à mão | duas guardas diferentes, as duas vencendo |

**A escada ganhou três degraus de CICLO CONTÍNUO em 2026-09-13**, por decisão da
dona: `--duration-cycle-fast` (1000ms, giro), `--duration-cycle` (1500ms, pulso de
espera) e `--duration-cycle-slow` (2000ms, pulso utilitário). Eles existem porque
os degraus de cima descrevem transição que começa e acaba, e espera é loop — sem
degrau, as três animações contínuas da casa tinham duração LITERAL, e literal
escapa da camada que para o movimento. A rede `!important` do fim da `motion.css`
alcança só o override do Storybook, não quem liga a preferência no sistema.

Os três estão no bloco de `prefers-reduced-motion` da `motion.css`, e é isso que
faz a camada de token alcançar o pulso do esqueleto, o giro do spinner
(`button.css`, `utilities.css`, `sonner.css`) e o pulso utilitário. As guardas das
folhas ficam: duas portas para o mesmo movimento é redundância deliberada, e a
mais barata de furar é a do token.

## Elevação

Sai do TIPO de superfície, em
[`04-padroes-design-sistema.md`](04-padroes-design-sistema.md) §Qual degrau:

- **a torrada é `xl`** — ela paira sobre a página inteira, como os modais;
- **Alert, Badge, Progress e Skeleton não têm sombra**: vivem no plano da página,
  dentro do fluxo. Relevo de controle é o degrau `xs`, e nenhum dos quatro o lê.

## Analytics

O vocabulário do payload — `component` em kebab-case, valor estável e nunca texto
traduzido, `location` no formato `docs_<section-id>` — é regra de todos os
eventos, e está em [`07-analytics.md`](07-analytics.md). O que é desta categoria:

| evento | quem dispara | payload |
|---|---|---|
| `alert_dismiss` | quem compõe, ao fechar o alerta | `component`, `label` (id estável), `location` |
| `toast_action_click` | a ação interna da torrada | `component: 'sonner'`, `label` (`with-action-label` nas cinco), `location` |
| `toast_demo_triggered` | TODA torrada disparada na docs page — demonstração, Do/Don't e Variantes, o mesmo conjunto nas cinco | `component: 'sonner'`, `toast_type`, `location` (`docs_demo`, `docs_do_dont` ou `docs_variantes`) |
| `task_progress` · `task_complete` | quem controla a tarefa que a barra mostra | ver a §9 de [`progress.md`](../prd/progress.md) |

- **Componente passivo não dispara nada.** Skeleton e Badge não têm evento
  próprio, e o Progress só é medido por quem CONTROLA a tarefa — a barra não sabe
  o que está progredindo. No Badge, o clique é do `<button>` que envolve a
  etiqueta, com o `button_click` dele: o `badge_click` saiu em 2026-09-13, por
  decisão da dona, depois de medido que estava tipado nas cinco stacks, anunciado
  nas cinco tabelas e disparado por uma. **Evento anunciado e não disparado não é
  visto por portão nenhum** — não é erro de tipo nem violação de axe —, e é essa a
  forma de defeito que a remoção fecha.
- **`locale` não é campo de evento de componente.** Medido em 2026-09-14 nos tipos
  das cinco `analytics.ts`: só os três eventos de PÁGINA o levam (`page_view`,
  `docs_page_view`, `docs_section_viewed`), e os outros 51 não. O
  `toast_demo_triggered` era a exceção, e por decisão da dona passou ao
  vocabulário de todos: `component`, `toast_type` e `location`.
- **Uma divergência segue medida e aberta**, na §"O que está aberto":
  `task_progress`/`task_complete` são anunciados pelo Angular sem serem
  disparados por ele.

## Tom de voz

A regra é de [`05-tom-de-voz.md`](05-tom-de-voz.md); o que a categoria acrescenta
é onde cada tom cai:

| tom | forma | exemplo |
|---|---|---|
| sucesso | afirmativo, no passado, breve | "Salvo." |
| erro | causa mais orientação | "Não foi possível conectar. Verifique sua rede." |
| aviso | consequência mais opção | "Sessão expira em 5 min. Salve seu trabalho." |
| rótulo de Badge | adjetivo de estado, uma ou duas palavras | "Ativo", "Pendente" |
| ação de torrada | verbo no infinitivo, no máximo duas palavras | "Desfazer" |

---

## Invariantes — quem cobra cada regra

A regra que atravessa componentes e stacks não se mantém verdadeira por
instrução: o que a mantém é um **portão**. Esta tabela diz qual, e o que ele não
cobre — metade coberta que se anuncia inteira é o defeito que ela existe para
evitar.

| invariante | onde a regra está | portão | o que o portão NÃO cobre |
|---|---|---|---|
| Catálogo de componente mora no PRD, não na guideline | aqui, §Por que este arquivo existe | `catalogo_duplicado_com_prd` | cabeçalho que não usa o nome do slug: `## Toast` e `## Toaster` escapam do regex, que procura `## Sonner` |
| A regra de categoria não volta a ser copiada por stack | aqui | `guideline_de_stack_repete_categoria` | compara títulos de seção; cópia sem o título escapa |
| Movimento para sob `prefers-reduced-motion` | aqui, §Movimento | `movimento_sem_guarda_eficaz` | duração por token fica de fora de propósito — a camada de token a alcança. E a guarda do pulso do esqueleto é literal: ela é conferida por story, não por portão |
| Elevação por tipo de superfície | `04-padroes-design-sistema.md` | `elevacao_fora_do_mapa` · `prd_token_sem_lastro` confere cada PRD contra a folha | folha que não LÊ `var(--elevation-*)` não é classificada — foi assim que a sombra cravada da barra do Menubar passou calada até 2026-09-12 |
| Vocabulário do payload | `07-analytics.md` | `i18n_text_in_payload` · `component_nao_kebab` · `location_fora_do_vocabulario` · `campo_de_payload_morto` | evento anunciado em tabela e não disparado, ou disparado por uma stack só: nada vê. É o caso de `badge_click` e dos dois eventos de tarefa no Angular |
| Nenhuma altura fixa em peça interativa | `CLAUDE.md` §Conventions | nenhum — é conferido por story, nas cinco | — |
| Nenhum valor de design em `style` inline | `12-tokenizacao-dimensoes.md` | `inline_style_design_value` | — |
| Tabela de tokens da docs page bate com a folha | `14-taxonomia-secoes.md` | `scripts/tabela-tokens.mjs` (instrumento, não portão) | ele lê por regex: o Skeleton do Svelte renderiza as cinco linhas numa forma que o script não casa, e o resultado sai como "svelte: 0" — "não sei ler" saindo como "não tem" |

### O que está aberto

Cada item aqui tem medição no PRD do componente e espera decisão. Nenhum é
defeito de texto: os cinco PRDs já descrevem o que o código faz hoje.

1. **O Angular anuncia `task_progress` e `task_complete` na tabela e não dispara
   nenhum dos dois.**

### O que a dona decidiu em 2026-09-13, e já está no código

| decisão | o que era | o que é |
|---|---|---|
| Nome do componente | três formas: `Sonner`, `Toast`, `Toaster`, mais `component: "toast"` no payload | **Sonner** em tudo — folha `sonner.css`, classes `.nds-sonner*`, payload `component: "sonner"`. A REGIÃO continua `Toaster`, porque é o nome dela |
| Posição padrão da torrada | `bottom-right` no código, `top-right` em toda story e docs page | **`top-right`**, e agora o código diz o mesmo que a página |
| Onde mora o `aria-live` da torrada | três padrões entre as cinco | **na região**, nas cinco. Decidido primeiro "na notificação" e INVERTIDO no mesmo dia pela dona: região viva só é observada se existir antes de o conteúdo mudar, e a notificação é o conteúdo |
| Payload do `toast_demo_triggered` | `{ toast_type, locale }`, único evento de componente com `locale` | **`{ component: 'sonner', toast_type, location }`** (2026-09-14) |
| O que a docs page do Sonner rastreia | 6, 10 ou 12 gatilhos conforme a stack; o Do/Don't rastreado só em duas | **toda torrada disparada na página**, com o mesmo conjunto nas cinco — 10 na demonstração, 4 no Do/Don't e 5 nas Variantes (2026-09-14) |
| `label` do `toast_action_click` | três valores, um deles texto traduzido | **`with-action-label`** nas cinco |
| A região de espera do Skeleton | montada à mão nas cinco docs pages, em cinco formas | **peça do design system**, com papel, `aria-busy` e nome obrigatório |
| Duração de animação contínua | literal nas folhas (1,5s · 2s · 1s) | **três degraus de token**, alcançados pela camada que para o movimento |
| Valor fora da faixa no Progress | limitado em três stacks; nas outras duas a barra renderizava VAZIA anunciando o número | **limitado nas cinco**, antes de anunciar e antes de desenhar (C12) |
| Técnica de desenho do Progress | três: `--value`, `transform` inline, `width` da lib | **`--value` onde dá** — o react fica com `width` por imposição da lib, registrado |
| `badge_click` | tipado nas cinco, anunciado nas cinco tabelas, disparado por uma | **removido**: o clique é do `<button>` que envolve a etiqueta, pelo `button_click` dele |
