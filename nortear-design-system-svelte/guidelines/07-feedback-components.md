# Feedback Components

---

## Alert

**Propósito**: mensagem estática e persistente que comunica informações importantes ao usuário. Para mensagens temporárias, usar **Sonner**.

**API e exemplos**: `src/components/ui/alert/alert.svelte` + stories + `AlertDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Quando usar**:

| Situação | Componente |
|----------|------------|
| Mensagem persistente, requer atenção ou ação | Alert |
| Confirmação temporária (salvo, enviado) | Sonner |
| Erro crítico que bloqueia o fluxo | Alert |
| Notificação não bloqueante | Sonner |

**Estrutura**:

```
Alert (variant)
├── <Icon aria-hidden />
├── AlertTitle
└── AlertDescription
```

**Variantes**:

| Variante | Fonte | Classe emitida |
|---|---|---|
| `default` | prop `variant` | `.nds-alert` |
| `destructive` | prop `variant` | `.nds-alert-destructive` |
| `success` | prop `variant` | `.nds-alert-success` |
| `warning` | prop `variant` | `.nds-alert-warning` |
| `info` | prop `variant` | `.nds-alert-info` |

> As 5 variantes são valores da prop `variant` desde PATCHES.md#alert-five-variants — **nunca** aplicar variante via `class`. Há também a opção `dismissible` (PATCHES.md#alert-dismissible).

**Regras**:
- Sempre acompanhado de ícone + texto — a cor nunca é o único indicador de estado
- Em containers semânticos, mantenha `AlertDescription` em `--foreground` para WCAG AA 4.5:1

**Acessibilidade**:
- `role="alert"` aplicado automaticamente pelo Bits UI
- Ícone sempre `aria-hidden="true"`

---

## Badge

**Propósito**: rótulo compacto para status, categorias ou metadados.

**API e exemplos**: `src/components/ui/badge/badge.svelte` + stories + `BadgeDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Badge                      <span data-slot="badge">
├── ícone (opcional)       aria-hidden="true"
├── texto                  1 a 3 palavras, ou um número
└── BadgeCounter           <span data-slot="badge-counter"> — opcional
```

**A badge NÃO é preenchida**. Fundo é sempre `--background` e texto sempre `--foreground`; quem carrega a variante é a **borda**, de 2px sólidos. Foi decisão de desenho para separá-la do botão, que continua preenchido — duas formas parecidas na mesma tela faziam a etiqueta parecer clicável. Efeito colateral bem-vindo: o texto saiu do par semântico e passou a ter sempre o mesmo contraste, então ele não depende mais da variante escolhida.

**Variantes** — cada uma escreve UMA coisa, a cor da borda:

| Variante | Cor da borda | Nota |
|---|---|---|
| `default` | `--primary` | também é o que `.nds-badge` sozinho pinta |
| `destructive` | `--destructive` | |
| `warning` | `--warning` | já foi um literal, escolhido quando a variante colava na destructive; o conserto veio da paleta, e não do componente — como traço de 2px o literal media 2.61:1 contra a página, abaixo do piso de 3:1, e o token mede 4.66:1 |
| `success` | `--success` | |
| `info` | `--border` | a hairline neutra do projeto, a mesma que input e card desenham; é o traço mais discreto do conjunto |

O piso é 3:1 contra `--background` (WCAG 1.4.11): a borda é o contorno que identifica a variante, e desde o redesenho é a única coisa que a identifica. Alcançam o piso a `default`, a `destructive` e a `success`. A `warning` e a `info` ficam abaixo dele de propósito, medidas e registradas na própria regra da folha compartilhada — mudar isso é assunto da paleta, não do badge. Em troca, a `warning` responde por outra promessa: não se confundir com a `destructive`.

**Composições** — três, e nenhuma delas é variante:

| Composição | Forma | Nota |
|---|---|---|
| com ícone | ícone `aria-hidden="true"` antes do texto, dentro da etiqueta | o respiro é do container (`gap` + `data-icon`), nunca margem à mão |
| com contador | `BadgeCounter` à direita do texto, dentro da mesma etiqueta | o rótulo já diz de que é a contagem, então o número não pede nome próprio |
| como gatilho | etiqueta envolvida em `<button>` | quem recebe o foco é o botão; a etiqueta fica decorativa dentro dele |

**Subpartes**:

| Peça | Exportada como | `data-slot` | Classe |
|---|---|---|---|
| raiz | `Badge` / `Root` | `badge` | `.nds-badge` |
| contador | `BadgeCounter` / `Counter` | `badge-counter` | `.nds-badge-counter` |

O contador é o número à direita do texto, **dentro** da mesma etiqueta. Ele é neutro de propósito — fundo `--secondary`, texto `--foreground` — e isso foi medido: preenchê-lo com a cor da variante derruba o número abaixo dos 4.5:1 que texto pequeno exige em parte dos temas. Não é variante, é peça que **qualquer** variante aceita; fosse variante, o número de combinações dobrava para dizer a mesma coisa.

**Regras**:
- Máximo 2-3 palavras — badges são rótulos, não frases
- Nunca usar prop `size` (não existe) — customizar tamanho via `class`
- Cor nunca é o único indicador de estado — incluir texto significativo
- Nunca altura fixa em primitivos (WCAG 1.4.4)
- Nunca pintar o contador com a cor da variante — a cor já está na borda ao redor
- Nunca pôr `onclick` na etiqueta: envolver em `<button>`, que é quem recebe o foco
- Nunca aproximar a `warning` da `destructive`: a distância entre as duas é decisão de paleta, e exceção no componente já foi tentada — reprovava o piso de 3:1 que o token cumpre

---

## Progress

**Propósito**: indicador visual de progresso de um processo mensurável.

**API e exemplos**: `src/components/ui/progress/progress.svelte` + stories + `ProgressDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**: `value` (0-100).

**Acessibilidade**:
- `aria-label` descritivo do processo
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` no elemento de progresso

---

## Skeleton

**Propósito**: placeholder animado enquanto o conteúdo está carregando.

**API e exemplos**: `src/components/ui/skeleton/skeleton.svelte` + stories + `SkeletonDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- Estrutura do skeleton deve refletir a estrutura do conteúdo final (preserva layout)
- Animação respeita `motion-reduce`

**Acessibilidade**:
- `aria-busy="true"` no container pai enquanto carregando
- `role="status"` ou `aria-label="Carregando..."` no wrapper

---

## Sonner (Toast)

**Propósito**: notificações temporárias não bloqueantes.

**API e exemplos**: `src/components/ui/sonner/` + stories + `SonnerDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Stack**: `svelte-sonner` — `<Toaster />` montado no root do app; emissão via `toast.success`, `toast.error`, etc.

**Regras**:
- Posição obrigatória: `top-right`
- Mensagens curtas e acionáveis — para conteúdo que requer ação, usar Alert
- Duração padrão respeita `prefers-reduced-motion`
