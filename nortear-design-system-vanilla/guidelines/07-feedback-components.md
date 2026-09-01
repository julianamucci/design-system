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
.nds-alert role=(alert | status | note — default alert)
├── svg icon (opcional, aria-hidden — a folha o põe na coluna da esquerda)
├── h5.nds-alert-title (opcional)
└── section.nds-alert-description
    └── p (texto corrido)
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
| `warning` | `--warning` | Pendência ou risco que ainda não é erro |
| `success` | `--success` | Estado concluído ou aprovado |
| `info` | `--border` | A borda mais discreta — contexto que não compete por atenção |

> Uma das cinco **não** lê o token de mesmo nome, e é decisão registrada na
> folha: `info` assumiu a **hairline neutra** `--border`, a mesma que input e
> card desenham. A `warning` já trouxe um valor literal, escolhido quando o
> traço de 2px ficava a menos de 3:1 de distância da destructive — e a exceção
> reprovava o piso que o token cumpre: 2,61:1 contra a página, contra 4,66:1 do
> `--warning`. A separação das duas veio da paleta. O anel de foco acompanha: o
> da `warning` usa o token da variante, e o da `info` usa `--ring`, porque
> hairline não desenha foco visível.

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
div.nds-skeleton (data-shape, data-width)
```

**Regras**:
- A caixa deve aproximar o conteúdo real (evita layout shift), e a escolha entra por `data-shape` e `data-width` — atributo, nunca medida escrita no call site
- Fundo e pulsação são da folha `skeleton.css`: fundo em `--primary / 0.1` e a animação própria dela. Não criar gradiente customizado nem trocar a animação
- O esqueleto não recebe `height`: a altura sai de padding + tipografia, para o bloco crescer junto quando a pessoa aumenta a fonte do navegador (WCAG 1.4.4). `data-shape="avatar"` é a exceção prevista — peça sem fluxo de texto tem medida
- A pulsação já para em `prefers-reduced-motion: reduce`, pela própria folha. A redução de movimento é regra do sistema, cumprida em cada folha — não é uma classe a pendurar no elemento. Só animação autoral, fora das folhas, precisa se declarar, e para isso existe `.nds-motion-reduce-none`
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
div.nds-toaster (data-position)                     ← a região, uma por página
└── div.nds-toast role="status" aria-live="polite" (data-type)
    ├── span.nds-toast-icon (opcional)
    ├── div.nds-toast-content
    │   ├── p.nds-toast-title
    │   ├── p.nds-toast-description (opcional)
    │   └── button.nds-toast-action (opcional)
    └── button.nds-toast-close (aria-label)
```

**Tipos**: `default`, `success`, `error`, `warning` — saem como `data-type` no aviso.

**Regras**:
- Quem posiciona é a REGIÃO, não o aviso: `.nds-toaster` é fixa e escolhe o canto por `data-position` (`top-right`, `top-left`, `top-center`, `bottom-right`, `bottom-left`, `bottom-center`). O aviso individual não carrega posição
- A camada vem do token `--z-toast`, lido pela folha. Número de empilhamento escrito no call site sai do sistema de camadas e passa por cima de overlay modal sem que ninguém veja
- Duração default 4000ms; nunca inferior a 3000ms (acessibilidade de leitura)
- Erros críticos: usar Alert ou Dialog, não Toast
- Não empilhar mais de 3 toasts simultâneos — enfileirar

**Acessibilidade**:
- `role="status"` + `aria-live="polite"` para mensagens neutras/sucesso
- `role="alert"` + `aria-live="assertive"` apenas para erros
- Não capturar foco (não bloqueante)

**Analytics**: emitir `toast_shown` com `{ type, message_key }`.
