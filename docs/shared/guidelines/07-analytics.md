# Analytics — Rastreamento de Componentes

Este arquivo define o sistema de eventos de analytics para os componentes do design system. O objetivo é garantir que todos os produtos que utilizam estes componentes rastreiem interações de forma consistente, comparável e fácil de consultar.

> **Relação com o arquivo 12**: o arquivo 12 (seção 15) documenta *quais eventos* cada componente deve disparar. Este arquivo define *como* nomear, estruturar e implementar esses eventos.

---

## Princípios

**Consistência acima de completude** — é melhor rastrear poucos eventos com nomenclatura consistente do que muitos eventos com nomes arbitrários. Um evento mal nomeado hoje cria um problema de migração no futuro.

**O componente não sabe que está sendo rastreado** — a lógica de analytics nunca deve viver dentro do componente. O tracking é responsabilidade da camada de produto (página ou feature), não do componente de UI.

**Rastrear intenção, não mecânica** — `button_click` é mecânica. `checkout_started` é intenção. Para eventos de produto, prefira o contexto de negócio. Para eventos de design system (instrumentação de componentes), use a convenção de mecânica definida aqui — o contexto de negócio é adicionado via `location` e `label` no payload.

**Docs pages são camada de produto** — eventos `docs_*` são legítimos em `*Docs.tsx` porque rastreiam comportamento do usuário na documentação. Não confundir com rastreamento dentro de componentes de UI primitivos — esses nunca devem ter analytics.

---

## Convenção de Nomenclatura

### Formato

```
[objeto]_[ação]
```

- **Objeto**: o componente ou elemento que foi interagido — sempre em inglês, singular, snake_case
- **Ação**: o que aconteceu — verbo no passado, snake_case

### Exemplos

| Objeto | Ação | Evento completo |
|--------|------|----------------|
| `button` | `click` | `button_click` |
| `form` | `submit` | `form_submit` |
| `dialog` | `open` | `dialog_open` |
| `tab` | `change` | `tab_change` |
| `docs` | `page_view` | `docs_page_view` |

### Regras de nomenclatura

- Sempre em inglês e snake_case — nunca camelCase, PascalCase ou kebab-case
- Sempre no passado (`click`, `submit`, `open`) — nunca no infinitivo (`clicking`, `to_submit`)
- Objeto sempre no singular (`button`, não `buttons`)
- Sem abreviações: `navigation` e não `nav`, `dropdown` e não `dd`
- Máximo 3 palavras: `form_field_error` é o limite

---

## Estrutura do Payload

Todo evento deve enviar um payload com duas camadas: propriedades globais (presentes em todos os eventos) e propriedades específicas do componente.

### Propriedades globais (obrigatórias em todos os eventos)

```typescript
interface AnalyticsBasePayload {
  component: string      // Nome do componente em snake_case. Ex: "button", "dialog", "select"
  variant?: string       // Variante ativa no momento do evento. Ex: "default", "outline", "destructive"
  location: string       // Identificador da página ou seção onde o componente está. Ex: "header", "checkout_form"
}
```

### Propriedades específicas (adicionadas conforme o componente)

```typescript
interface WithLabel {
  label?: string         // Texto visível do elemento. Ex: "Salvar", "Cancelar"
}

interface WithValue {
  value?: string         // Valor selecionado ou inserido. Ex: "option_1", "true"
}

interface WithPosition {
  index?: number         // Posição baseada em 0
  total?: number         // Total de itens disponíveis
}

interface WithFieldName {
  field_name: string     // Nome do campo no schema. Ex: "email", "password"
}
```

---

## Catálogo de Eventos por Componente

### Componentes interativos — rastrear sempre

#### Button

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `button_click` | Ao clicar em qualquer botão habilitado | `label` (texto do botão) |

> **Atenção**: não rastrear cliques em botões disabled.

---

#### Form

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `form_submit` | Ao submeter com sucesso (sem erros de validação) | `field_count` |
| `form_error` | Quando a validação falha ao tentar submeter | `error_fields` (array) |
| `form_abandon` | Quando o usuário sai sem submeter após ter interagido | — |

---

#### Campos de Formulário (Input, Textarea, Select, Checkbox, Switch)

| Evento | Quando disparar | Payload adicional | Quando usar |
|--------|----------------|-------------------|-------------|
| `field_focus` | Ao focar no campo | `field_name` | Funis onde medir abandono |
| `field_blur` | Ao perder foco com valor preenchido | `field_name` | Medir taxa de preenchimento |
| `field_change` | Ao alterar o valor (Checkbox, Switch, Select, Calendar, RadioGroup, Slider, Toggle) | `field_name`, `value` | Componentes de seleção — não inputs de texto livre. Para Calendar, `value` é ISO string |
| `field_error` | Quando o campo exibe erro de validação | `field_name`, `error_type` | Identificar campos com alta taxa de erro |

> **Regra importante**: nunca rastrear o `value` de campos sensíveis — senha, CPF, cartão de crédito.

---

#### Dialog / Sheet / Drawer

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `dialog_open` | Quando o overlay é exibido | `label` (título) |
| `dialog_close` | Quando fechado sem confirmar | `label`, `trigger` ("escape" \| "backdrop" \| "cancel_button") |
| `dialog_confirm` | Quando a ação principal é confirmada | `label` |

---

#### Tabs

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `tab_change` | Ao selecionar uma aba diferente da atual | `label`, `index`, `total` |

---

#### Accordion

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `accordion_expand` | Ao abrir um item | `label` |
| `accordion_collapse` | Ao fechar um item | `label` |

---

#### Select / Dropdown Menu / Command

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `option_select` | Ao selecionar uma opção | `label`, `value` |

---

#### Pagination

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `page_change` | Ao navegar para outra página | `page`, `total_pages` |

---

#### Carousel

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `slide_change` | Ao mudar de slide | `index`, `total`, `trigger` ("button" \| "swipe" \| "auto") |

---

#### Card (quando envolvido em `<a>`/`<button>`)

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `card_click` | Clique em Card totalmente navegável (envolvido em `<a>`/`<button>`) | `label` (CardTitle), `destination` |

> **Regra**: rastreie `card_click` apenas quando o Card inteiro é um target navegável. Se há botões dentro do footer, rastreie `button_click` neles individualmente.

---

#### Breadcrumb / Navigation Menu

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `navigation_click` | Ao clicar em um link de navegação | `label`, `destination` |
| `breadcrumb_ellipsis_open` | Ao abrir o DropdownMenu dentro de `BreadcrumbEllipsis` (mobile/colapso) | `hidden_count` |

> **Nunca rastrear `BreadcrumbPage`** — o item atual não é navegável. Trackear apenas cliques em `BreadcrumbLink`.

---

### Docs pages — eventos de instrumentação da documentação

Estes eventos rastreiam comportamento do usuário nas páginas de documentação do design system. São implementados nos `*Docs.tsx`, não nos componentes de UI primitivos.

#### Eventos automáticos (mount e scroll)

| Evento | Onde disparar | Payload obrigatório |
|--------|--------------|---------------------|
| `docs_page_view` | No mount de qualquer `*Docs.tsx` | `{ component, locale }` |
| `docs_section_viewed` | Quando uma seção fica visível (IntersectionObserver) | `{ component, section, locale }` |
| `language_switched` | No `LanguageSwitcher` ao trocar idioma | `{ previous_language, new_language }` |

#### Eventos de interação (tracking automático via `data-track*`)

Todos os elementos interativos das docs pages ganham `data-track*` attributes. O helper `docs-tracking.ts` (único por stack) monta um click listener global no root do `DocsPageLayout` e emite o evento correto com base em `data-track`.

**Padrão de identificador estruturado (3 partes):** `{component}:{section}:{element}` — ex: `alert:demo:variant-destructive`, `breadcrumb:nav:anatomia`, `calendar:code:copy-single`.

| Evento | Onde disparar | Payload obrigatório | `data-track` |
|--------|--------------|---------------------|--------------|
| `docs_nav_click` | Clique em link do `DocsNav` (sidebar) | `{ component, section_id, label }` | `nav` |
| `docs_demo_click` | Clique em botão/trigger dentro de `DocsDemonstration` | `{ component, element_id, label }` | `demo` |
| `docs_variant_click` | Clique em card/botão dentro de `DocsVariants` | `{ component, variant_name, label }` | `variant` |
| `docs_code_copy` | Clique em botão "copiar" de bloco de código (`DocsImport`, `DocsVariants`, etc.) | `{ component, snippet_id }` | `code` |
| `docs_related_click` | Clique em card do `DocsRelated` | `{ component, target_slug, label }` | `related` |
| `docs_link_click` | Clique em link externo em notas, UX writing ou outros textos | `{ component, section_id, href }` | `link` |

#### Como instrumentar (padrão obrigatório)

Cada elemento interativo recebe 2-3 atributos:

```html
<!-- DocsNav link -->
<a
  href="#anatomia"
  data-track="nav"
  data-track-id="alert:nav:anatomia"
  data-track-label="Anatomia"
>Anatomia</a>

<!-- DocsDemonstration botão -->
<Button
  data-track="demo"
  data-track-id="alert:demo:variant-destructive"
  data-track-label="Ver variant destructive"
>Destructive</Button>

<!-- DocsVariants card/código com copy button -->
<button
  data-track="code"
  data-track-id="alert:code:copy-destructive"
>Copiar</button>

<!-- DocsRelated card -->
<a
  href="?path=/docs/ui-badge--docs"
  data-track="related"
  data-track-id="alert:related:badge"
  data-track-label="Badge"
>Badge</a>
```

**Regra de id:** o 3º segmento (`element`) **deve** ser único dentro da seção — permite distinguir "qual botão de demo" foi clicado numa página com múltiplos botões do mesmo tipo.

**Onde chamar `track()`:** NUNCA dentro do componente de seção ou da docs page. O helper `src/lib/docs-tracking.ts` (único por stack) é quem chama `track()` — os section containers só adicionam os `data-track*`.

```typescript
// docs_page_view — no topo do ComponentDocs, junto com useSeoEffect
useEffect(() => {
  track("docs_page_view", {
    component: "button",
    location: "storybook_docs",
    locale: currentLocale,
  });
}, [currentLocale]);

// docs_section_viewed — no IntersectionObserver do DocsNav
track("docs_section_viewed", {
  component: "button",
  location: "storybook_docs",
  section: "variantes",
  locale: currentLocale,
});

// language_switched — no LanguageSwitcher ao trocar locale
track("language_switched", {
  component: "language_switcher",
  location: "docs_header",
  previous_language: prevLocale,
  new_language: nextLocale,
});
```

---

### Componentes raramente rastreados — avaliar caso a caso

| Componente | Evento possível | Quando faz sentido |
|------------|----------------|-------------------|
| Tooltip | `tooltip_view` | Medir se usuários precisam de ajuda contextual |
| Alert | `alert_dismiss` | Medir taxa de descarte de alertas importantes |
| Sonner / Toast | `toast_action_click` | Quando o toast tem ação (ex: "Desfazer") |
| Collapsible | `collapsible_toggle` | Quando o conteúdo tem importância na jornada |
| Menubar | `menu_item_click` | `label`, `menu` (nome do menu pai) |

---

### Componentes que não devem ser rastreados

Skeleton, Progress, Separator, AspectRatio, ScrollArea, ResizableHandle, Avatar (sem ação), Badge (sem ação), Card (o container, não o conteúdo).

> **Rastrear o container vs. o conteúdo**: um Card com um Button dentro tem o Button rastreado, não o Card. O evento sempre fica no elemento interativo.

---

## Como Implementar sem Acoplar ao Componente

### Padrão recomendado: wrapper na camada de produto

O componente de UI não deve importar ou chamar nenhuma função de analytics. O tracking é adicionado na camada de produto.

```typescript
// ✅ CORRETO — tracking na camada de produto
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function CheckoutForm() {
  return (
    <Button
      onClick={() => {
        track("button_click", {
          component: "button",
          variant: "default",
          location: "checkout_form",
          label: "Finalizar compra"
        });
        handleSubmit();
      }}
    >
      Finalizar compra
    </Button>
  );
}

// ❌ INCORRETO — tracking dentro do componente de UI
// components/ui/button.tsx
export function Button({ onClick, ...props }) {
  const handleClick = () => {
    track("button_click", { ... }); // Nunca aqui
    onClick?.();
  };
}
```

### Padrão alternativo: data attributes para tracking automático

```typescript
// Configurar um observador global (uma vez, na inicialização)
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const tracked = target.closest("[data-track]") as HTMLElement;
  if (!tracked) return;

  track(tracked.dataset.track!, {
    component: tracked.dataset.trackComponent,
    variant: tracked.dataset.trackVariant,
    location: tracked.dataset.trackLocation,
    label: tracked.dataset.trackLabel,
  });
});
```

---

## Interface TypeScript da Função de Track

```typescript
// lib/analytics.ts

type ComponentName =
  | "button" | "form" | "input" | "textarea" | "select"
  | "checkbox" | "switch" | "dialog" | "sheet" | "drawer"
  | "tabs" | "accordion" | "pagination" | "carousel"
  | "navigation_menu" | "breadcrumb" | "dropdown_menu"
  | "command" | "collapsible" | "tooltip" | "alert" | "toast"
  | "language_switcher";

type EventName =
  | "button_click" | "card_click"
  | "form_submit" | "form_error" | "form_abandon"
  | "field_focus" | "field_blur" | "field_change" | "field_error"
  | "dialog_open" | "dialog_close" | "dialog_confirm"
  | "tab_change"
  | "accordion_expand" | "accordion_collapse"
  | "option_select"
  | "page_change"
  | "slide_change"
  | "navigation_click" | "breadcrumb_ellipsis_open"
  | "tooltip_view" | "alert_dismiss" | "toast_action_click"
  | "collapsible_toggle" | "menu_item_click"
  | "docs_page_view" | "docs_section_viewed" | "language_switched"
  | "docs_nav_click" | "docs_demo_click" | "docs_variant_click"
  | "docs_code_copy" | "docs_related_click" | "docs_link_click";

interface TrackPayload {
  component: ComponentName;
  variant?: string;
  location: string;
  label?: string;
  value?: string;
  index?: number;
  total?: number;
  field_name?: string;
  error_type?: string;
  error_fields?: string[];
  trigger?: string;
  destination?: string;
  field_count?: number;
  page?: number;
  total_pages?: number;
  hidden_count?: number;
  locale?: string;
  section?: string;
  previous_language?: string;
  new_language?: string;
}

export function track(event: EventName, payload: TrackPayload): void {
  // Substituir pelo SDK da ferramenta de analytics escolhida
  // Ex: posthog.capture(event, payload)
  // Ex: gtag("event", event, payload)
  console.log("[Analytics]", event, payload);
}
```

---

## Integração com Ferramentas de Analytics

| Ferramenta | Implementação do corpo de `track` |
|------------|----------------------------------|
| PostHog | `posthog.capture(event, payload)` |
| Mixpanel | `mixpanel.track(event, payload)` |
| Amplitude | `amplitude.track(event, payload)` |
| Google Analytics 4 | `gtag("event", event, { ...payload })` |
| Segment | `analytics.track(event, payload)` |

> Use uma camada de abstração (`lib/analytics.ts`) em vez de chamar o SDK diretamente nos componentes. Isso permite trocar a ferramenta sem alterar nenhum componente de produto.

---

## Checklist de Implementação

**Nomenclatura:**
- [ ] Nome do evento segue o padrão `objeto_ação` em snake_case
- [ ] Objeto está no singular e em inglês
- [ ] Ação está no passado
- [ ] Máximo de 3 palavras no nome do evento

**Payload:**
- [ ] `component` presente e com valor do catálogo
- [ ] `location` presente e identifica a página ou seção
- [ ] `variant` presente quando o componente tem variantes
- [ ] Campos sensíveis não têm `value` no payload
- [ ] Componente disabled não dispara eventos

**Implementação:**
- [ ] Tracking na camada de produto — nunca dentro de `/components/ui/`
- [ ] Função `track` importada de `@/lib/analytics` — nunca o SDK diretamente
- [ ] Evento disparado antes da ação de negócio

**Docs pages:**
- [ ] `docs_page_view` disparado no mount com `{ component, locale }`
- [ ] `docs_section_viewed` disparado no IntersectionObserver das seções
- [ ] `language_switched` disparado no `LanguageSwitcher`
