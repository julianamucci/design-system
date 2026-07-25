# Layout Components

---

## Aspect Ratio

**Propósito**: manter proporções fixas de mídia independente do tamanho do container — usar sempre que exibir imagem, vídeo ou iframe com proporção conhecida.

**API e exemplos**: `src/components/ui/aspect-ratio/aspect-ratio.svelte` + stories + `AspectRatioDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
AspectRatio
└── (filho único: img | video | iframe)
```

**Ratios comuns**:

| Ratio | Uso |
|---|---|
| `16/9` | Vídeos e banners paisagem |
| `1/1` | Avatares e thumbnails quadrados |
| `4/3` | Imagens de produto e cards de conteúdo |
| `3/4` | Imagens de retrato |

**Regras**:
- Não aplicar tokens de cor diretamente no `AspectRatio` — estilizar o elemento filho
- Imagens dentro: usar `object-cover` para preencher sem distorcer
- `rounded-md` no elemento filho, não no container

**Acessibilidade**:
- Imagem informativa: `alt` descritivo do conteúdo, não da aparência
- Imagem decorativa: `alt=""` — leitor de tela ignora
- Vídeo: sempre incluir legendas e transcrição
- Nunca usar `user-scalable=no` no viewport

**Analytics**: container passivo — não dispara eventos.

---

## Card

**Propósito**: agrupar conteúdo relacionado em um container visualmente delimitado — produto, perfil, artigo, métrica. Não usar como decoração ou apenas para criar divisão visual.

**API e exemplos**: `src/components/ui/card/card.svelte` + stories + `CardDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Card
├── CardHeader
│   ├── CardTitle
│   └── CardDescription
├── CardContent
└── CardFooter
```

**Tokens obrigatórios**:

| Elemento | Token |
|---|---|
| Fundo | `bg-card` |
| Texto | `text-card-foreground` |
| Borda | `border-border` |
| Texto secundário | `text-muted-foreground` na `CardDescription` |
| Divisor do footer | `border-t border-border` |

**Acessibilidade**:
- Botões dentro do Card com `aria-label` contextual incluindo o identificador do card
- Card clicável inteiro: usar `<a>` como wrapper ou `role="link"` com `tabindex="0"`

---

## Resizable

**Propósito**: painéis redimensionáveis lado a lado, divididos por um handle arrastável.

**API e exemplos**: `src/components/ui/resizable/resizable.svelte` + stories + `ResizableDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
ResizablePaneGroup (direction: horizontal | vertical)
├── ResizablePane (defaultSize)
├── ResizableHandle (withHandle?)
└── ResizablePane (defaultSize)
```

**Acessibilidade**:
- `ResizableHandle` inclui automaticamente `role="separator"` e suporte a teclado (Alt+Arrow)
- Adicionar `aria-label="Redimensionar painéis"` no handle quando o contexto for ambíguo

---

## Scroll Area

**Propósito**: área com scroll customizado, consistente entre browsers e SOs — listas longas, code blocks, painéis com conteúdo variável. Não usar para scroll da página inteira.

**API e exemplos**: `src/components/ui/scroll-area/scroll-area.svelte` + stories + `ScrollAreaDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
ScrollArea
└── (conteúdo arbitrário)
```

---

## Separator

**Propósito**: divisor visual horizontal ou vertical entre seções de conteúdo.

**API e exemplos**: `src/components/ui/separator/separator.svelte` + stories + `SeparatorDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props**:

| Prop | Default | Função |
|---|---|---|
| `orientation` | `horizontal` | Direção do divisor (`horizontal` \| `vertical`) |

**Acessibilidade**:
- Renderiza `role="separator"` automaticamente — é lido por leitores de tela
- Uso puramente decorativo: adicionar `aria-hidden="true"`

---

## Sidebar

**Propósito**: navegação lateral para aplicações com múltiplas seções — persistente em desktop, colapsável em mobile.

**API e exemplos**: `src/components/ui/sidebar/` + stories + `SidebarDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras. Ver também `STORYBOOK-ARCHITECTURE.md`.

**Stack**: estado de colapso via Pinia (`useAppSidebar`); responsiva pelo breakpoint `md`.

**Regras**:
- Link ativo: `aria-current="page"` no item correspondente à rota atual
- Ícones de navegação: `aria-hidden="true"` — o label do item já descreve o destino
- `role="navigation"` com `aria-label` descritivo no `<nav>` raiz
