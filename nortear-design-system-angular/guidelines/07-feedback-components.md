# Feedback Components (Nortear — Angular)

---

## Alert

**Propósito**: mensagem estática e persistente que comunica informação importante. Para confirmação temporária, Toaster.

**Peças**: `div[ndsAlert]`, `[ndsAlertTitle]` (h1–h6), `[ndsAlertDescription]`, `div[ndsAlertAction]`, `svg[ndsAlertIcon]`.

**Quando usar**:

| Situação | Componente |
|---|---|
| Mensagem persistente que pede atenção ou ação | Alert |
| Confirmação temporária (salvo, enviado) | Toaster |
| Erro crítico que bloqueia o fluxo | Alert |
| Decisão que exige resposta antes de seguir | Alert Dialog |

**Estrutura**:

```
div[ndsAlert]                       (role configurável)
├── svg[ndsAlertIcon]               (decorativo)
├── h2..h6[ndsAlertTitle]           (opcional — o nível é o elemento)
├── [ndsAlertDescription]
├── div[ndsAlertAction]             (opcional — canto superior direito)
└── botão de fechar                 (quando dismissible)
```

**Variantes**: `default`, `destructive`, `success`, `warning`, `info`.

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsAlert` | `variant` | `default` | Variante semântica |
| `ndsAlert` | `role` | `alert` | `alert`, `status` ou `note` |
| `ndsAlert` | `dismissible` | `false` | Mostra o botão de fechar |
| `ndsAlert` | `dismissLabel` | rótulo padrão | Nome acessível do botão de fechar |
| `ndsAlertIcon` | `kind` | obrigatório | `info`, `error`, `success`, `warning` |

**Saída**: fechamento, emitido **uma única vez**, depois que o alert sai da tela.

**Regras**:
- O `role` do raiz é configurável e o default é `alert`. Alert que **já está na tela quando a página carrega** usa `note`: estático não é live region, e anunciar assertivamente algo que sempre esteve ali interrompe a leitura sem motivo
- Cor nunca é o único indicador — sempre ícone mais texto (WCAG 1.4.1)
- **Descrição sempre em `--foreground`.** Ícone e título podem carregar a cor da variante; corpo do texto não
- O botão de ação vai no slot `ndsAlertAction`, não dentro da descrição: o slot é posicionado no canto e a descrição tem calha reservada para ele
- Fechar remove o alert; não deixar um alert fechado ocupando espaço

**Acessibilidade**:

| `role` | Live region | Quando usar |
|---|---|---|
| `alert` (default) | Assertiva — interrompe e anuncia na hora | Mensagem urgente que **surge em tempo de execução** |
| `status` | Polida — anuncia sem interromper | Atualização não urgente inserida em runtime |
| `note` | Nenhuma | Alert estático, já presente quando a página carrega |

- Nível do heading do título é **o elemento** em que a diretiva foi aplicada. Nível fixo pula degrau sob seções e falha `heading-order` no axe
- Ícone decorativo; contraste mínimo de 4.5:1 em todo texto

**Analytics**: `alert_dismiss` no fechamento, com valores estáveis no payload.

---

## Badge

**Propósito**: rótulo curto para status, contagem ou categoria.

**Peças**: `span[ndsBadge]`, `span[ndsBadgeCounter]`.

**A etiqueta não é preenchida.** Fundo e texto são sempre neutros — `--background` e `--foreground` —, e quem carrega a variante é a **borda, de 2px sólidos**. Foi decisão de desenho para separar a etiqueta do botão, que continua preenchido: duas formas parecidas na mesma tela faziam o badge parecer clicável. Em 1px a diferença entre duas cores próximas some na tela, e por isso a espessura dobrou. Efeito colateral bem-vindo: o texto sai do par semântico, e o contraste do rótulo deixa de depender da variante escolhida.

**Estrutura**:

```
span[ndsBadge]
├── svg                       (opcional, decorativo)
├── rótulo (texto curto)
└── span[ndsBadgeCounter]     (opcional — número à direita do rótulo)
```

**Variantes** — cada uma reaponta uma coisa só, a cor da borda:

| Variante | Cor da borda | Uso |
|---|---|---|
| `default` | `--primary` | Destaque principal |
| `destructive` | `--destructive` | Erro ou alerta crítico |
| `warning` | `--warning` | Pendência ou risco que ainda não é erro |
| `success` | `--success` | Concluído ou aprovado |
| `info` | `--border` | Contexto neutro que não deve competir por atenção |

> São **cinco**. `secondary` saiu por ficar quase idêntica à default, e `outline` saiu porque a borda neutra dela passou a ser a da `info`.

> A `warning` **aponta para `--warning`**, como as demais. Já apontou para um valor literal, escolhido quando o traço de 2px ficava a menos de 3:1 de distância da `destructive` — duas etiquetas de significado oposto com a mesma cara. O CSS compartilhado registra o que a exceção custava: o literal estava a 5° de matiz do próprio `--warning` no claro e a 1° no escuro, e media 2,61:1 contra a página, abaixo do piso de 3:1 do WCAG 1.4.11, enquanto o token mede 4,66:1. A separação veio da paleta: o `--destructive` do tema Default ganhou croma e 23° a 32° de distância de matiz. O anel de foco acompanha o token da variante.

> A `info` usa `--border`, a mesma hairline que input e card já desenham (1,22 a 1,99 contra o fundo, também abaixo do piso). Por não ter cor própria, o anel de foco dela é o `--ring` do sistema, e não o da variante.

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `variant` | `default` | Cor da borda |

**Subpeça**:

| Peça | Marcação | Função |
|---|---|---|
| `NdsBadgeCounter` | `span[ndsBadgeCounter]` — classe `.nds-badge-counter`, `data-slot="badge-counter"` | Número à direita do rótulo, dentro da mesma etiqueta |

> `@Directive` e não `@Component`: o número já é conteúdo do próprio `<span>`, não há markup a montar nem nada a projetar — mesma escolha de `NdsAlertTitle`. O seletor exige `span` porque o contador mora dentro de uma etiqueta inline.

> O contador é **neutro de propósito** (fundo `--secondary`, texto `--foreground`) e não é variante: qualquer variante o aceita. Preenchê-lo com a cor da variante derruba o número abaixo de 4,5:1 em parte dos temas — contra `--warning` do tema warm nenhum dos dois neutros alcança o piso. A cor não se perde: quem a carrega é a borda, ao redor.

**Composições** — são **três**, e nenhuma delas é prop:

| Composição | Como se monta | Quando usar |
|---|---|---|
| Com ícone | `svg` decorativo como primeiro filho, antes do rótulo | Status que ganha com reforço icônico; o ícone é sempre `aria-hidden="true"` |
| Com contador | Rótulo + `span[ndsBadgeCounter]` dentro da mesma borda | Etiqueta que soma quantidade ao rótulo — "Urgente 12" |
| Como trigger | Etiqueta dentro de um `<button>` | Filtro, chip ativável, gatilho de menu — o botão é quem tem foco, teclado e evento |

> O contador **avulso** — badge que era só um número ao lado de um ícone solto — saiu do sistema: era redundante com a composição do contador, e o número sem rótulo já dependia de um `aria-label` no elemento pai para significar alguma coisa. A composição "como link" também saiu; a etiqueta clicável é o gatilho em `<button>`. Envolver num `<a>` continua sendo markup válido, e é o que a linha do `Enter` na tabela de teclado descreve — só não é mais uma composição documentada.

**Regras**:
- Altura não é cravada: nasce de `padding-block` mais tipografia
- Sem `size`: um badge só tem um tamanho no sistema
- Não é interativo. Para clicável, envolva num `<button>` ou `<a>` — o badge não recebe foco por conta própria
- Sem emoji dentro: o ícone vem do conjunto do design system
- Contador acima de 99 exibe `99+`, e não o número exato — vale para o `ndsBadgeCounter` e para a etiqueta que é só um número
- Ajuste pontual sobrescreve as vars internas escopadas (`--badge-border`, `--badge-bg`, `--badge-fg`); a que cada variante reaponta é só a primeira

**Acessibilidade**:
- Badge que representa status precisa que o **texto** diga o status ("Ativo"), não só a cor
- Badge de contagem visível só como número precisa de nome acessível no elemento pai que dê o significado
- O número do contador é texto no DOM, nunca desenho de `content:` do CSS — leitor de tela precisa alcançá-lo

---

## Progress

**Propósito**: indicar progresso **determinado** de uma operação. Para progresso indeterminado, Skeleton ou indicador de carregamento.

**Peças**: `div[ndsProgress]`, `div[ndsProgressTrack]`, `div[ndsProgressIndicator]`, `span[ndsProgressLabel]`, `span[ndsProgressValue]`.

**Estrutura**:

```
div[ndsProgress]                    (role="progressbar", valores mín/atual/máx)
├── span[ndsProgressLabel]          (opcional — o que está progredindo)
├── span[ndsProgressValue]          (opcional — o número em texto)
└── div[ndsProgressTrack]
    └── div[ndsProgressIndicator]
```

Valor, mínimo, máximo e o texto do valor acessível vêm do primitivo no host do raiz.

**Regras**:
- Altura da barra é dimensão de elemento gráfico, não de texto: token de tamanho, e aqui valor fixo é legítimo
- O valor acessível reflete o progresso **real**, não a posição da animação
- Sem valor conhecido, o componente é o errado — troque por Skeleton
- Barra sem rótulo não diz o que está acontecendo; o rótulo é a informação

**Acessibilidade**:
- `role="progressbar"` com os três valores
- Nome acessível contextual obrigatório
- Texto do valor visível ajuda quem não distingue a proporção pelo desenho

---

## Skeleton

**Propósito**: reservar o espaço do conteúdo durante o carregamento, evitando salto de layout.

**Diretiva**: `div[ndsSkeleton]`. Sem inputs — a forma vem de classe utilitária e de `data-*` do CSS compartilhado.

**Estrutura**:

```
div[ndsSkeleton]      (bloco pulsante, sem conteúdo)
```

**Regras**:
- Dimensões aproximam o conteúdo real; esqueleto que não tem a forma do que vem depois é pior que fundo vazio
- A pulsação vem da regra do design system e respeita `prefers-reduced-motion`
- Em lista, repetir o esqueleto com a forma do item real
- **Não invente classe de esqueleto.** `nds-skeleton-line` tem cara de válida e não pinta nada — confira em `docs/shared/styles/nds/` antes de usar

**Acessibilidade**:
- O container que está carregando é marcado como ocupado, e o rótulo de carregamento vai **nele**, não em cada esqueleto — dez esqueletos anunciados são dez interrupções
- Esqueleto não recebe foco

---

## Toaster

**Propósito**: notificação temporária e não bloqueante confirmando uma ação.

**Componente**: `div[ndsToaster]` — a região que hospeda as torradas — mais a API imperativa `toast` que as dispara. Uma região por aplicação.

**Estrutura**:

```
div[ndsToaster]                     (região com live region, posicionada)
└── torrada
    ├── svg[ndsToastIcon]           (decorativo)
    ├── título
    ├── descrição                   (opcional)
    ├── botão de ação               (opcional)
    └── botão de fechar             (quando closeButton)
```

**Tipos**: `default`, `success`, `error`, `warning`, `info`, `loading`.

**Entradas da região**:

| Nome | Default | Função |
|---|---|---|
| `position` | `bottom-right` | Um dos seis cantos/centros |
| `richColors` | `false` | Aplica a cor semântica ao fundo da torrada |
| `expand` | `false` | Mantém a pilha expandida em vez de empilhada |
| `duration` | padrão do sistema | Milissegundos até fechar |
| `closeButton` | `false` | Mostra o botão de fechar em todas |
| `label` | rótulo padrão | Nome acessível da região |
| `closeLabel` | rótulo padrão | Nome acessível do botão de fechar |

**Opções por torrada**: descrição, duração, ação (rótulo mais callback), e o par de mensagens para acompanhar uma promessa.

**Regras**:
- **Erro crítico não é torrada** — é Alert ou Alert Dialog. Torrada desaparece, e o que desaparece não pode ser a única via de uma informação que bloqueia
- Duração `Infinity` deixa a torrada até alguém fechar; é reservada a erro crítico e **sempre** acompanhada do botão de fechar. Sem ele, a torrada é uma prisão
- Duração mínima respeita tempo de leitura — torrada que some antes de ser lida é ruído
- Não empilhar muitas ao mesmo tempo: enfileirar
- Rótulo de ação é verbo no infinitivo, no máximo duas palavras
- A torrada não captura foco: ela é não bloqueante, e roubar o foco de quem está digitando é pior que a notificação

**Acessibilidade**:
- Região com live region **polida** para mensagem neutra ou de sucesso; assertiva só para erro
- Botão de ação e botão de fechar são alcançáveis por teclado enquanto a torrada existe — o que é a razão de erro precisar de duração longa ou infinita
- Ícone decorativo; o tipo é dito pelo texto

**Analytics**: `toast_action_click` no botão de ação, com rótulo, componente e local.

---

## Alert Dialog

**Propósito**: decisão que **precisa** de resposta antes de seguir — confirmar exclusão, descartar alteração. Para formulário ou conteúdo navegável, Dialog.

**Peças**: `nds-alert-dialog`, `button[ndsAlertDialogTrigger]`, `ng-template[ndsAlertDialogContent]`, e as diretivas de estrutura: `div[ndsAlertDialogHeader]`, `div[ndsAlertDialogMedia]`, `h2|h3[ndsAlertDialogTitle]`, `p[ndsAlertDialogDescription]`, `div[ndsAlertDialogFooter]`, `button[ndsAlertDialogCancel]`, `button[ndsAlertDialogAction]`.

**Estrutura**:

```
nds-alert-dialog
├── button[ndsAlertDialogTrigger]           (fica na página)
└── ng-template[ndsAlertDialogContent]      ← portalizado ao abrir
    ├── fundo escurecido
    └── painel (role="alertdialog", modal)
        ├── div[ndsAlertDialogHeader]
        │   ├── div[ndsAlertDialogMedia]    (opcional)
        │   ├── h2|h3[ndsAlertDialogTitle]
        │   └── p[ndsAlertDialogDescription] (opcional)
        └── div[ndsAlertDialogFooter]
            ├── button[ndsAlertDialogCancel]
            └── button[ndsAlertDialogAction]
```

**Entradas**: aberto e aberto inicial, no host do `nds-alert-dialog`. Saídas: mudança de aberto, e mudança concluída depois da animação.

**Regras**:
- **O perfil é fixo, não configurável**: papel de `alertdialog`, sempre modal, e dispensa por clique fora e por perda de foco desligada. Isso é o que distingue este componente do Dialog — não há input para afrouxar. **O Escape continua fechando, de propósito**: barrar o Escape prende quem navega por teclado
- Título obrigatório: é a base do nome acessível do painel. Descrição **opcional e recomendada** — quando existe, é a base da descrição acessível; quando não existe, o painel omite o atributo em vez de referenciar um id ausente. Omitir só se justifica quando o próprio título já diz o que se perde
- Ordem no rodapé: `[Cancelar] [Confirmar]` — o primário à direita, e a ordem do DOM é a ordem visual
- O rótulo do botão de ação **repete o verbo** do título ("Excluir", não "OK"): botão genérico faz a pessoa reler o diálogo
- Não aninhar Alert Dialog dentro de Alert Dialog

**Acessibilidade**:
- Papel de `alertdialog` com modal, nome pelo título e descrição pela descrição
- Foco entra no painel ao abrir e volta ao gatilho ao fechar; Tab circula dentro
- O resto da página fica inerte enquanto está aberto
- Em teste, o painel **não está no canvas** — é portalizado para o corpo do documento, e afirmar sobre ele antes de a animação assentar produz falsa violação de contraste

**Analytics**: `dialog_open`, `dialog_confirm` e `dialog_close` com a origem do fechamento (botão de cancelar, Escape) em valor estável.
