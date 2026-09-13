# Feedback — as regras da categoria

Vale para os cinco componentes de feedback, nas cinco stacks: **Alert, Badge,
Progress, Skeleton** e **Sonner** (a torrada, que a folha chama de `toast`).

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
- três cópias fechavam a seção Badge mandando disparar `button_click`; o evento
  tipado nas cinco é `badge_click`;
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
| Sonner | `polite`, nunca `assertive`: as cinco plays afirmam a AUSÊNCIA de `assertive` | a lib, nas três que têm lib |
| Badge | não anuncia nada: não é interativo, não tem papel e não recebe foco | — |

- **Alert que já está na tela quando a página carrega usa `note`.** Estático não
  é região viva: `alert` e `status` existem para conteúdo que APARECE depois.
- **Alert não se envolve em outro `aria-live`.** A raiz já é a região; envolvê-la
  aninha duas. Medido em 2026-09-13: a story `DynamicInsertion` das cinco stacks
  renderiza `role="alert"` dentro de um `aria-live="polite"`, e o conteúdo
  compartilhado ensina isso em três chaves — texto anterior ao `role`
  configurável.
- **A espera do Skeleton é anunciada por QUEM COMPÕE**, não pelo esqueleto: a
  região que vai receber o conteúdo leva `role="status"`, `aria-busy` e nome
  acessível. As cinco docs pages montam isso à mão, e é exatamente aí que
  divergiram em cinco formas (uma delas sem papel nenhum) — ver a §"O que está
  aberto".
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
| `skeleton.css` | o pulso | **literal, 1,5s** | própria, e vence porque nenhuma regra de atributo declara `animation` |
| `toast.css` e a folha da lib | entrada e saída | por token nas duas à mão | duas guardas diferentes, as duas vencendo |

**O pulso do esqueleto é o caso que a camada de token não alcança**, e é
deliberado: não existe degrau de `--duration-*` para ciclo contínuo. Enquanto não
existir, a guarda da folha é a única coisa que para o pulso — e a suíte mede por
outra porta, o `data-reduced-motion` com `!important` de `motion.css`. Está na
§"O que está aberto".

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
| `badge_click` | quem envolve a etiqueta num botão | `component`, `label`, `variant?`, `location?` |
| `toast_action_click` | a ação interna da torrada | `component: 'toast'`, `label`, `location` |
| `toast_demo_triggered` | a demonstração da docs page | `toast_type`, `locale` |
| `task_progress` · `task_complete` | quem controla a tarefa que a barra mostra | ver a §9 de [`progress.md`](../prd/progress.md) |

- **Componente passivo não dispara nada.** Skeleton não tem evento próprio, e o
  Progress só é medido por quem CONTROLA a tarefa — a barra não sabe o que está
  progredindo.
- **Quatro divergências estão medidas e abertas**, todas na §"O que está aberto":
  `badge_click` existe nas cinco e é disparado por uma; `toast_action_click`
  manda três valores diferentes de `label`, um deles texto traduzido;
  `toast_demo_triggered` é o único evento da casa com `locale` no lugar de
  `component` e `location`; e `task_progress`/`task_complete` são anunciados pelo
  Angular sem serem disparados por ele.

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

1. **A região de espera do Skeleton não é peça do design system.** As cinco docs
   pages a montam à mão, e divergiram em cinco formas — uma delas, no Svelte, sem
   `role="status"`. Ou ela vira peça, ou a guideline passa a ditar a forma.
2. **O pulso do esqueleto tem duração literal** porque não há degrau de token para
   ciclo contínuo. Criar o degrau resolve as três animações contínuas da casa
   (pulso, `animate-pulse`, `animate-spin`) de uma vez.
3. **`badge_click` é tipado nas cinco e disparado por uma.** Ou as outras quatro
   passam a disparar, ou o evento sai da tabela e do tipo.
4. **`toast_demo_triggered` foge do vocabulário**: leva `locale` e não leva
   `component` nem `location`.
5. **`toast_action_click` manda três valores de `label`**, e um deles é o rótulo
   traduzido da ação — exatamente o que a regra do payload proíbe.
6. **A posição padrão da torrada está escrita duas vezes de formas opostas**:
   `bottom-right` no código das cinco, `top-right` em toda story, docs page e na
   guideline que chamava isso de "padrão do projeto".
7. **O nome do componente tem três formas** — `Sonner` (slug, título das stories,
   nome da lib de uma stack), `Toast` (folha, classes `.nds-*`, e a palavra em
   português) e `Toaster` (a região). O payload manda `component: "toast"` com
   slug `sonner`.
8. **`aria-live` da torrada mora em três lugares diferentes** entre as cinco, e
   em duas stacks aparece aninhado.
9. **Progresso fora da faixa não é limitado em duas stacks**, e ali a barra
   renderiza vazia anunciando o número fora da faixa.
10. **O Angular anuncia `task_progress` e `task_complete` na tabela e não dispara
    nenhum dos dois.**
