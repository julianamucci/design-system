# Feedback Components

---

## Alert

**Propósito**: mensagem estática e persistente que comunica informações importantes ao usuário dentro do fluxo da página. Use para mensagens que o usuário precisa ver e potencialmente agir — erros de validação de página, avisos de prazo, confirmações de estado. Para mensagens temporárias que dispensam atenção, usar **Sonner**.

**API e exemplos**: `src/components/ui/alert.tsx` + stories + `AlertDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — Alert vs Sonner**:

| Situação | Componente |
|----------|------------|
| Mensagem persistente, requer atenção ou ação | Alert |
| Confirmação temporária de ação (salvo, enviado) | Sonner |
| Erro crítico que bloqueia o fluxo | Alert |
| Notificação não bloqueante, dispensável | Sonner |

**Estrutura de subcomponentes**:
```
Alert
├── [ícone Lucide]    (filho direto, sem wrapper)
├── AlertTitle        (título — opcional)
└── AlertDescription  (descrição do conteúdo)
```

**Variantes**:

| Variante | Tipo | Uso |
|---|---|---|
| `default` | nativa | Informativo, neutro |
| `destructive` | nativa | Erro / destrutivo |
| `success` | nativa | Confirmação |
| `warning` | nativa | Aviso |
| `info` | nativa | Dica / contexto adicional |

> As 5 variantes são valores da prop `variant` desde PATCHES.md#alert-five-variants — **nunca** aplicar variante via `className`. Há também a opção `dismissible` (botão de fechar, PATCHES.md#alert-dismissible).

**Ícones recomendados por contexto** (Lucide React):

| Contexto | Ícone |
|----------|-------|
| Sucesso / confirmação | `CheckCircle2` |
| Aviso / atenção | `AlertTriangle` |
| Erro / destrutivo | `XCircle` |
| Informativo / neutro | `Info` |

**Regras**:
- Ícone colocado como **filho direto** do `<Alert>`, antes de `AlertTitle` — sem `<div>` wrapper.
- `AlertTitle` é opcional — omitir quando a `AlertDescription` já é autoexplicativa.
- Fundo suave, nunca sólido: a variante troca as vars escopadas `--alert-bg`, `--alert-fg`, `--alert-body-fg` e `--alert-border`, e a folha aplica a cor semântica com as opacidades de `--alert-bg-alpha` e `--alert-border-alpha`. Escolher a variante é tudo o que se faz; não repintar o alerta por fora.

**Posicionamento do ícone (unificado via `.nds-alert`)**:
O ícone é o **filho direto** do `.nds-alert`, antes do título. O seletor `.nds-alert:has(> svg)` abre automaticamente uma coluna de grid para o ícone (16px + `column-gap` de 8px) — sem posicionamento manual. O SVG recebe um `translate` vertical leve para alinhar com a primeira linha do título. Todas as stacks compartilham o mesmo CSS `.nds-alert` (`docs/shared/styles/nds/alert.css`).

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- O componente aplica `role="alert"` automaticamente — o leitor de tela anuncia o conteúdo ao ser inserido no DOM.
- Para alerts inseridos dinamicamente (não renderizados na montagem), adicionar `aria-live="polite"` no container pai.
- `aria-live="assertive"` apenas para erros críticos que exigem atenção imediata (ex.: falha de pagamento).
- Ícones com `aria-hidden="true"` — o texto já descreve o estado.
- Nunca usar cor como único indicador de estado — sempre acompanhar com ícone + texto (ver arquivo 11, seção daltonismo).

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Sucesso: passado simples, breve, sem exclamação — "Perfil atualizado."
- Aviso: consequência + ação disponível — "Assinatura expira em 3 dias. Renove agora."
- Erro: causa + orientação, sem culpar — "Não foi possível salvar. Verifique sua conexão."
- `AlertTitle`: frase nominal curta, sem ponto final.
- `AlertDescription`: frase completa com ponto final, máximo 2 linhas.

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
- Raramente rastreado — apenas quando o alerta tem ação relevante para o produto.
- Quando o usuário descarta um alerta importante: `alert_dismiss` com `label` (título do alerta).

---

## Alert Dialog

> **Documentação completa em `10-overlay-components.md`** — o AlertDialog é um componente de overlay e está documentado junto com Dialog, Sheet, Drawer e os demais overlays.

**Resumo de uso**: modal de confirmação para ações destrutivas ou irreversíveis. Diferencia-se do `Dialog` por não ter botão X de fechar — exige resposta explícita do usuário (confirmar ou cancelar).

---

## Badge

**Propósito**: rótulo compacto para indicar status, categoria, contagem ou atributo de um elemento.

**API e exemplos**: `src/components/ui/badge.tsx` + stories + `BadgeDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**A etiqueta não é preenchida.** Fundo e texto são sempre neutros — `--background` e `--foreground` —, e quem carrega a variante é a **borda, de 2px sólidos**. Foi decisão de desenho para separar a etiqueta do botão, que continua preenchido: duas formas parecidas na mesma tela faziam o badge parecer clicável. Em 1px a diferença entre duas cores próximas some na tela, e por isso a espessura dobrou. Efeito colateral bem-vindo: o texto sai do par semântico, e o contraste do rótulo deixa de depender da variante escolhida.

**Variantes nativas** (únicas disponíveis via prop `variant`) — cada uma reaponta uma coisa só, a cor da borda:

| Variante | Cor da borda | Uso |
|----------|--------------|-----|
| `default` | `--primary` | Destaque principal — categoria, tag ativa |
| `destructive` | `--destructive` | Estado de erro ou alerta crítico |
| `warning` | `--warning` | Pendência ou risco que ainda não é erro |
| `success` | `--success` | Estado concluído ou aprovado |
| `info` | `--border` | Baixa ênfase — a borda mais discreta do conjunto |

> São **cinco**. `secondary` saiu por ser quase indistinguível da `default`, e `outline` saiu porque a `info` passou a fazer o mesmo trabalho — a hairline neutra que input e card já desenham.

> `warning` **lê `--warning`**, como as outras. Já teve valor literal, escolhido quando o traço de 2px da variante ficava a menos de 3:1 de distância da `destructive` — duas etiquetas de significado oposto com a mesma cara —, e a própria regra do CSS registra por que a exceção resolvia o problema errado: o literal estava a 5° de matiz do próprio `--warning` no claro e a 1° no escuro (o mesmo laranja, só mais claro e menos cromático) e, como traço de 2px, media 2,61:1 contra a página — abaixo do piso de 3:1 do WCAG 1.4.11 —, enquanto o token mede 4,66:1 e passa. A separação veio de onde tinha de vir, da paleta: o `--destructive` do tema Default ganhou croma e 23° a 32° de distância de matiz.

> `info` **não lê `--info`**: ela assumiu a borda neutra `--border` que era da `outline`. Mede 1,22–1,99 contra o fundo, também abaixo do piso — é contorno de baixa ênfase por decisão, não por descuido. O anel de foco dela usa `--ring`, e não a cor da variante, porque não existe cor de variante a usar.

**Composições** (três, e nenhuma delas é variante):

| Composição | Forma | Quando |
|------------|-------|--------|
| Com ícone | SVG `aria-hidden="true"` antes do texto, com `data-icon="inline-start"` | Status que ganha com reforço visual; quem nomeia continua sendo o texto |
| Como gatilho clicável | Badge dentro de `<button>` | Filtro, chip ativável, gatilho de menu — o botão gerencia foco, teclado e evento |
| Com contador | Rótulo + `BadgeCounter` dentro da mesma borda | Etiqueta que soma quantidade ao rótulo — "Urgente 12" |

**Subpeça**:

| Peça | Marcação | Função |
|------|----------|--------|
| `BadgeCounter` | `data-slot="badge-counter"`, classe `.nds-badge-counter` | Número à direita do rótulo, dentro da mesma etiqueta |

> O contador é **neutro de propósito** (fundo `--secondary`, texto `--foreground`) e não é uma variante: qualquer variante o aceita. Preenchê-lo com a cor da variante derruba o número abaixo de 4,5:1 em parte dos temas — contra `--warning` do tema warm nenhum dos dois neutros alcança o piso. A cor não se perde: quem a carrega é a borda, ao redor.

> O Badge **não tem prop `size`** (tamanho via `className` customizado). Caso pontual sobrescreve as vars internas escopadas (`--badge-border` etc., guideline 04 §Tokens de Componente); demanda recorrente vira patch de API, como o #alert-five-variants.

**Regras**:
- Texto máximo: 2 palavras — para mais contexto, usar outro componente.
- **Cor não é o único indicador de estado** — sempre acompanhar cor de status com ícone ou texto descritivo (ver arquivo 11, seção daltonismo).
- Contadores: limitar exibição a "99+" — não exibir números exatos acima de 99. Vale para o `BadgeCounter` e para a etiqueta que é só um número.
- Consistência obrigatória: mesma semântica de cor em todo o produto (não usar `destructive` para promoções).
- Badge clicável (link ou filtro): **nunca** pôr o manipulador de clique no Badge — envolvê-lo em `<a>` ou `<button>`, que é quem recebe foco, teclado e nome acessível.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- Badge puramente decorativo (repetindo informação já visível): `aria-hidden="true"`.
- Badge de status sem contexto visual adjacente: `aria-label` descritivo — ex.: `aria-label="Status: Ativo"`.
- Ícones dentro do badge: `aria-hidden="true"` — o texto do badge já descreve o estado.

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Adjetivo ou substantivo de estado, 1–2 palavras, sem verbo, sem ponto final.
- Correto: "Ativo", "Pendente", "Em análise", "Novo", "Pro".
- Incorreto: "Está ativo", "Aguardando análise", "É novo".

**Analytics**: Badge sem ação não dispara eventos. Badge clicável (filtro, tag): `button_click` com `label`.

---

## Progress

**Propósito**: indicador visual de progresso de uma operação com duração mensurável. Use para operações de 3+ segundos com progresso mensurável — upload, processamento, carregamento. Para duração desconhecida, usar indeterminate. Para loading instantâneo, usar `Skeleton`.

**API e exemplos**: `src/components/ui/progress.tsx` + stories + `ProgressDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**:

| Prop | Função |
|---|---|
| `value` | Número 0–100. Omitir (ou `undefined`) para o estado indeterminado |

**Estrutura de subcomponentes** (a raiz monta trilha e indicador sozinha quando ninguém os compõe):
```
Progress (value)
├── ProgressLabel      (opcional — nomeia o que está sendo medido)
├── ProgressValue      (opcional — o número, alinhado à direita)
└── ProgressTrack
    └── ProgressIndicator
```

**Estado por atributo** (a folha `.nds-progress` é quem desenha):

| Atributo | Efeito |
|---|---|
| `data-variant="success"` | Barra em `--success`; a trilha permanece neutra |
| `data-variant="destructive"` | Barra em `--destructive`; a trilha permanece neutra |
| `data-indeterminate` | Traço curto percorrendo a trilha, sem `aria-valuenow` |

**Regras**:
- `value` aceita número de 0 a 100.
- Indeterminado: omitir `value` e marcar `data-indeterminate`. A animação é da folha; não escrever uma própria, e não deixar `aria-valuenow` no elemento — número que ninguém sabe é pior que "ocupado".
- Sempre exibir porcentagem ou rótulo textual próximo ao componente — o Progress não exibe texto por padrão.
- Cor da barra: só pelas variantes acima. **Não existe variante `warning`**, e é decisão medida: no tema claro padrão o amarelo não alcança os 3:1 exigidos entre a parte cheia e a vazia (WCAG 1.4.11), e uma barra que não se distingue da trilha não informa nada.
- A trilha nunca acompanha a cor da variante — é o que garante que o contraste barra-contra-trilha não dependa de qual variante alguém escolheu.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- Aplica `role="progressbar"`, `aria-valuenow`, `aria-valuemin` e `aria-valuemax` automaticamente via prop `value`.
- `aria-label` obrigatório — descreve o que está sendo medido.
- `aria-live="polite"` no elemento que exibe o valor textual — anuncia mudanças.
- `aria-busy="true"` no container durante o carregamento.

**Analytics**: passivo — não dispara eventos. Para rastrear conclusão de upload ou processo, disparar evento customizado no callback de conclusão.

---

## Skeleton

**Propósito**: placeholder visual que replica a estrutura do conteúdo enquanto ele carrega, reduzindo a percepção de tempo de espera. Use para loading de conteúdo com estrutura conhecida — cards, listas, perfis, tabelas. Para operações com progresso mensurável, usar `Progress`. Para loading < 300ms, não usar Skeleton.

**API e exemplos**: `src/components/ui/skeleton.tsx` + stories + `SkeletonDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- Dimensões do Skeleton devem aproximar as do conteúdo final — evita layout shift ao carregar.
- Forma e largura vêm por atributo, não por classe de medida: `data-shape="text|heading|avatar|fill"` e `data-width="full|3-4|2-3|1-2|1-3"`. O esqueleto circular é o `data-shape="avatar"`.
- O Skeleton **não recebe altura**: `text` e `heading` derivam da escada de texto por `padding-block`, para o bloco crescer junto quando a pessoa aumenta a fonte do navegador (WCAG 1.4.4). Cravar altura reintroduz o salto de layout que o esqueleto existia para evitar.
- Não aninhar Skeletons em estruturas muito complexas — 2–3 elementos por bloco são suficientes.
- A pulsação é da folha `.nds-skeleton`, aplicada automaticamente.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- O Skeleton já nasce com `aria-hidden="true"` — é ruído para leitor de tela, e quem anuncia é a região que o contém.
- `aria-busy="true"` no container pai enquanto o conteúdo carrega — anuncia o estado de loading.
- `aria-label` no container descrevendo o que está carregando — "Carregando lista de usuários".
- A pulsação para sozinha sob `prefers-reduced-motion: reduce`: a folha já traz a regra. Qualquer animação **personalizada** acrescentada por cima precisa parar sob a mesma preferência — quem tem distúrbio vestibular sente o movimento que a folha não conhece.

**Analytics**: passivo — não dispara eventos. Rastrear tempo de carregamento no callback que substitui o Skeleton pelo conteúdo real.

---

## Sonner

**Propósito**: notificação toast temporária e não bloqueante para feedback de ações do usuário. Use para confirmações temporárias (salvo, enviado, copiado), notificações de sistema não críticas, feedback de operações em background. Para mensagens persistentes que exigem atenção ou ação, usar `Alert`.

**API e exemplos**: `src/components/ui/sonner.tsx` + stories + `SonnerDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Setup obrigatório**: o `<Toaster position="top-right" richColors />` deve ser adicionado uma vez no root da aplicação. Sem isso, os toasts não aparecem.

**API de uso** (importar de `sonner`):

| Função | Quando |
|---|---|
| `toast.success(msg, opts?)` | Confirmação de ação |
| `toast.error(msg, opts?)` | Erro recuperável |
| `toast.warning(msg, opts?)` | Aviso não-crítico |
| `toast.info(msg, opts?)` | Informação neutra |
| `toast(msg, opts?)` | Toast sem tipo semântico |
| `toast.promise(promise, { loading, success, error })` | Operações assíncronas |

**Opções relevantes**: `description`, `action: { label, onClick }`, `duration` (default 4000ms; `Infinity` para erros críticos), `dismissible`.

**Posições disponíveis**:
- `top-right` — **padrão do projeto**, não conflita com conteúdo fixo inferior.
- `bottom-right` — padrão do Sonner; evitar quando há footer fixo ou bottom navigation.
- `bottom-center` — mobile e layouts centralizados.
- `top-center`, `top-left`, `bottom-left` — casos específicos.

> Especificar `top-right` explicitamente no `<Toaster />` para evitar diferenças entre versões.

**Regras**:
- Máximo 3 toasts visíveis simultaneamente — o Sonner gerencia a fila automaticamente.
- Duração padrão: 4000ms — não alterar para mensagens de sucesso e informativas.
- `duration: Infinity` apenas para erros críticos que exigem ação do usuário.
- `toast.promise()` para qualquer operação assíncrona — evita toasts manuais de loading.
- Nunca usar toast para mensagens que exigem leitura longa — máximo 1 frase.
- `richColors` no `<Toaster />` para aplicar as cores do tema automaticamente.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- O Sonner usa `aria-live="polite"` internamente — toasts são anunciados ao leitor de tela sem interromper o fluxo.
- Toasts com ação (`action.label`) são focáveis por teclado.
- Não usar Sonner para erros de formulário — usar `FormMessage`.

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Máximo 1 frase no título, sem pontuação de ênfase.
- Passado simples para confirmações: "Perfil atualizado." não "Perfil atualizado com sucesso!".
- Causa + orientação para erros: "Não foi possível salvar. Tente novamente."
- Label da ação: verbo no infinitivo — "Desfazer", "Ver detalhes".

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
- O toast em si não dispara evento — o evento é da ação que o originou.
- Botão de ação dentro do toast: `toast_action_click` com `label`.

---

## Regras transversais de Feedback Components

**Critério Alert vs Sonner** (resumo):

| Alert | Sonner |
|-------|--------|
| Persistente, visível até ação | Temporário, auto-dismiss |
| Requer leitura e possível ação | Confirma ação já realizada |
| Inserido no fluxo da página | Sobreposto, não bloqueia |
| Erros críticos, avisos importantes | Sucesso, info, avisos não-críticos |

**Acessibilidade transversal** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- Cor nunca é o único indicador de estado — sempre acompanhar com ícone + texto
- `aria-hidden="true"` em Skeleton e em ícones decorativos dentro de Alerts e Badges
- `aria-busy="true"` no container durante loading (Skeleton, Progress)
- `aria-live="polite"` para mudanças dinâmicas não críticas; `aria-live="assertive"` apenas para erros críticos
- Animação personalizada acrescentada a Skeleton, Progress ou Toast tem de parar sob `prefers-reduced-motion: reduce` — as folhas `.nds-*` já param as suas

**Analytics transversal** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Componente | Evento | Quando |
|------------|--------|--------|
| Alert | `alert_dismiss` | Usuário descarta alerta com botão (opcional) |
| Alert Dialog | `dialog_open` / `dialog_confirm` / `dialog_close` | Abertura, confirmação e cancelamento |
| Sonner | `toast_action_click` | Clique no botão de ação do toast |
| Badge, Progress, Skeleton | — | Componentes passivos, sem eventos |

**UX Writing transversal** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Sucesso: afirmativo, passado, breve — "Salvo.", "Enviado."
- Erro: causa + orientação — "Não foi possível conectar. Verifique sua rede."
- Aviso: consequência + opção — "Sessão expira em 5 min. Salve seu trabalho."
- Badge: adjetivo de estado, 1–2 palavras — "Ativo", "Pendente"
