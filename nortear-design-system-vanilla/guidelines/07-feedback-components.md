# Feedback Components (Nortear — Vanilla TypeScript)

---

## Alert

**Propósito**: mensagem estática e persistente que comunica informações importantes ao usuário. Para mensagens temporárias, usar **Toast**.

**API e exemplos**: `src/components/ui/alert.ts` + stories + `AlertDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Quando usar**:

| Situação | Componente |
|---|---|
| Mensagem persistente, requer atenção ou ação | Alert |
| Confirmação temporária (salvo, enviado) | Toast |
| Erro crítico que bloqueia o fluxo | Alert |

**Estrutura**:

```
div role=(alert | status | note — default alert)
├── icon (opcional, aria-hidden, posicionado absolute left)
└── content (pl-7 quando há icon)
    ├── h5 title (opcional)
    └── div description
```

**Variantes**:

| Variante | Uso |
|---|---|
| `default` | Informativo neutro |
| `destructive` | Erro / atenção crítica |
| `success` | Sucesso (ex: dados salvos) |
| `warning` | Alerta não bloqueante |

**Regras**:
- O `role` do container raiz é configurável e sai como atributo no elemento — default `alert`
- Alert que já está na tela quando a página carrega usa `note`: estático não é live region
- Padding fixo em `--spacing-4`; gap interno em `--spacing-1` entre título e descrição
- Cor nunca é o único indicador — sempre acompanhar com ícone + texto (WCAG 1.4.1)
- Description sempre em `--foreground` (ver memória "Containers coloridos: texto corrido sempre foreground")
- Ícone e título podem usar cor da variante; corpo do texto não

**Acessibilidade**:

| `role` | Live region | Quando usar |
|---|---|---|
| `alert` (default) | Assertiva — interrompe e anuncia na hora | Mensagem urgente que **surge em tempo de execução** |
| `status` | Polida — anuncia sem interromper | Atualização não urgente inserida em runtime |
| `note` | Nenhuma | Alert estático, já presente quando a página carrega |

- Ícone com `aria-hidden="true"`
- Contraste mínimo 4.5:1 em todo texto

---

## Badge

**Propósito**: rótulo compacto para indicar status, categoria, contagem ou atributo de um elemento.

**API e exemplos**: `src/components/ui/badge.ts` (`createBadge`, `createBadgeCounter`) + stories + `BadgeDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Desenho**: a etiqueta **não é preenchida**. Fundo e texto são sempre neutros
(`--background` e `--foreground`), e quem carrega a variante é a **borda**, de
2px sólidos. Foi decisão de desenho para separá-la do botão, que continua
preenchido — duas formas parecidas na mesma tela faziam a etiqueta parecer
clicável. Efeito colateral bem-vindo: o contraste do texto deixou de depender da
variante escolhida.

**Estrutura**:

```
span[data-slot="badge"] (inline-flex, borda de 2px, radius-badge)
├── ícone opcional (aria-hidden, antes do rótulo)
├── rótulo (texto curto)
└── span[data-slot="badge-counter"] (opcional, à direita do rótulo)
```

**Variantes** — cada uma escreve UMA coisa, a cor da borda:

| Variante | Borda | Uso |
|---|---|---|
| `default` | `--primary` | Destaque principal — categoria, tag ativa |
| `destructive` | `--destructive` | Estado de erro ou alerta crítico |
| `warning` | `hsl(22 55% 62%)` | Pendência ou risco que ainda não é erro |
| `success` | `--success` | Estado concluído ou aprovado |
| `info` | `--border` | A borda mais discreta — contexto que não compete por atenção |

> Duas das cinco **não** leem o token de mesmo nome, e é decisão registrada na
> folha. `warning` traz um **valor literal**: com `--warning` o traço de 2px
> ficava a menos de 3:1 de distância da destructive, e duas etiquetas de
> significado oposto tinham a mesma cara. É literal porque a decisão de paleta
> ainda não foi tomada — quando for, vira token de tema. `info` assumiu a
> **hairline neutra** `--border`, a mesma que input e card desenham. O anel de
> foco acompanha: o da `warning` usa o mesmo literal, e o da `info` usa
> `--ring`, porque hairline não desenha foco visível.

**Composições** — três, e nenhuma delas é variante:

| Composição | Forma | Quando |
|---|---|---|
| Com ícone | SVG `aria-hidden` antes do rótulo, no mesmo `children` | Status que ganha com reforço icônico |
| Como gatilho clicável | Etiqueta dentro de `<button>` | Filtro, chip ativável, gatilho de menu |
| Com contador | `createBadgeCounter` à direita do rótulo, no mesmo `children` | Etiqueta que soma quantidade ao rótulo |

> O Badge **não tem opção `size`** — a dimensão é única. Caso pontual sobrescreve
> as vars internas escopadas (`--badge-bg`, `--badge-fg`, `--badge-border`;
> guideline 04 §Tokens de Componente); demanda recorrente vira patch de API,
> como o #alert-five-variants.

**Subpeças** — subfábrica própria, como `createAlertTitle` e `createCardTitle`:

| Subpeça | Fábrica | Slot | Papel |
|---|---|---|---|
| Etiqueta | `createBadge` | `badge` | Elemento inline (`<span>`), para caber em frase e em célula |
| Contador | `createBadgeCounter` | `badge-counter` | Número à direita do texto, dentro da mesma etiqueta |

> O contador é **neutro de propósito** — fundo `--secondary`, texto
> `--foreground` — em qualquer variante. Pintá-lo com a cor da variante derruba
> o número abaixo de 4.5:1 em parte dos temas; a cor não se perde, porque quem a
> carrega é a borda ao redor. E **não é variante**: é peça que qualquer variante
> aceita, e tratá-la como variante dobraria as combinações para dizer o mesmo.
> O elemento devolvido entra na lista `children` de `createBadge`, junto do
> rótulo — a fábrica da etiqueta não ganha ramo novo por causa dele.

**Regras**:
- Padding horizontal em `--spacing-2`, vertical em `--spacing-0-5`; nunca altura fixa
- Texto máximo: 2 palavras — para mais contexto, usar outro componente
- **Cor não é o único indicador de estado** — sempre acompanhar cor de status com ícone ou texto descritivo
- Contadores: limitar exibição a "99+" — não exibir números exatos acima de 99. O truncamento é da aplicação; `createBadgeCounter` recebe o texto já formatado e não trata isso
- Número dentro da etiqueta usa `createBadgeCounter`, nunca a classe escrita à mão nem um segundo badge aninhado
- Consistência obrigatória: mesma semântica de cor em todo o produto (não usar `destructive` para promoções)
- Não usar emojis dentro do badge — usar ícone lucide antes do rótulo se necessário; o tamanho vem de `.nds-badge > svg`
- Badge clicável (filtro, chip ativável): envolver em `<button>`; nunca pendurar handler de clique no elemento devolvido pela fábrica

**Acessibilidade**:
- Badge puramente decorativo (repetindo informação já visível): `aria-hidden="true"`
- Badge de status sem contexto visual adjacente: `aria-label` descritivo — ex: `aria-label="Status: Ativo"`
- Badge informativo em que só o número é visível: `aria-label` no elemento pai, dizendo do que é a contagem
- Ícones dentro do badge: `aria-hidden="true"` — o texto do badge já descreve o estado
- Quem recebe foco é o `<button>` em volta, e é dele o nome acessível

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Adjetivo ou substantivo de estado, 1–2 palavras, sem verbo, sem ponto final
- Correto: "Ativo", "Pendente", "Em análise", "Novo", "Pro"
- Incorreto: "Está ativo", "Aguardando análise", "É novo"

**Analytics**: Badge sem ação não dispara eventos. Badge clicável (filtro, tag): `button_click` com `label`.

---

## Progress

**Propósito**: indicar progresso determinado de uma operação (0–100%).

**API e exemplos**: `src/components/ui/progress.ts` + stories + `ProgressDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div role="progressbar" (aria-valuenow, aria-valuemin=0, aria-valuemax=100)
└── bar interno (largura = valor%)
```

**Regras**:
- Altura fixa em `--spacing-2` (8px) — é elemento gráfico, não textual
- `aria-label` obrigatório descrevendo o que está progredindo — opção da factory, não retoque no elemento retornado
- `aria-valuenow` reflete progresso real (não animação visual)
- Para progresso indeterminado, usar Skeleton ou Spinner — não Progress

**Acessibilidade**:
- `role="progressbar"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax`
- `aria-label` contextual obrigatório

---

## Skeleton

**Propósito**: placeholder visual durante carregamento de conteúdo.

**API e exemplos**: `src/components/ui/skeleton.ts` + stories + `SkeletonDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div (animate-pulse, bg-muted, rounded-md)
```

**Regras**:
- Dimensões devem aproximar o conteúdo real (evita layout shift)
- Usar `bg-muted` + `animate-pulse` (não criar gradientes customizados)
- `motion-reduce`: respeitar `prefers-reduced-motion` — usar `.nds-animate-pulse` ou keyframe próprio que zere a animação dentro de `@media (prefers-reduced-motion: reduce)`
- Para listas, repetir Skeleton com o mesmo shape do item real

**Acessibilidade**:
- Container pai com `aria-busy="true"`
- `aria-label="Carregando..."` no wrapper da seção (não em cada skeleton)

---

## Toast

**Propósito**: notificação temporária não bloqueante (3–5s) confirmando uma ação.

**API e exemplos**: `src/components/ui/toast.ts` + stories + `ToastDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div role="status" aria-live="polite" (fixed top-4 right-4, z-50)
├── icon opcional
└── message
```

**Tipos**: `default`, `success`, `error`, `warning`.

**Regras**:
- Posição padrão: `fixed top-4 right-4` (top-right)
- Duração default 4000ms; nunca inferior a 3000ms (acessibilidade de leitura)
- Erros críticos: usar Alert ou Dialog, não Toast
- Z-index `50` (acima de overlays normais, abaixo de Dialog modal)
- Não empilhar mais de 3 toasts simultâneos — enfileirar

**Acessibilidade**:
- `role="status"` + `aria-live="polite"` para mensagens neutras/sucesso
- `role="alert"` + `aria-live="assertive"` apenas para erros
- Não capturar foco (não bloqueante)

**Analytics**: emitir `toast_shown` com `{ type, message_key }`.
