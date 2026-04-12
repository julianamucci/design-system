# Analytics — Rastreamento de Componentes

Este arquivo define o sistema de eventos de analytics para os componentes do design system. O objetivo é garantir que todos os produtos que utilizam estes componentes rastreiem interações de forma consistente, comparável e fácil de consultar.

> **Relação com o arquivo 12**: o arquivo 12 (seção 15) documenta *quais eventos* cada componente deve disparar. Este arquivo define *como* nomear, estruturar e implementar esses eventos.

---

## Princípios

**Consistência acima de completude** — é melhor rastrear poucos eventos com nomenclatura consistente do que muitos eventos com nomes arbitrários. Um evento mal nomeado hoje cria um problema de migração no futuro.

**O componente não sabe que está sendo rastreado** — a lógica de analytics nunca deve viver dentro do componente. O tracking é responsabilidade da camada de produto (página ou feature), não do componente de UI.

**Rastrear intenção, não mecânica** — `button_click` é mecânica. `checkout_started` é intenção. Para eventos de produto, prefira o contexto de negócio. Para eventos de design system (instrumentação de componentes), use a convenção de mecânica definida aqui — o contexto de negócio é adicionado via `location` e `label` no payload.

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
| `field` | `focus` | `field_focus` |

### Regras de nomenclatura

- Sempre em inglês e snake_case — nunca camelCase, PascalCase ou kebab-case
- Sempre no passado (`click`, `submit`, `open`) — nunca no infinitivo (`clicking`, `to_submit`)
- Objeto sempre no singular (`button`, não `buttons`)
- Sem abreviações: `navigation` e não `nav`, `dropdown` e não `dd`
- Máximo 3 palavras: `form_field_error` é o limite — `user_profile_form_field_validation_error` é inaceitável

---

## Estrutura do Payload

Todo evento deve enviar um payload com duas camadas: propriedades globais (presentes em todos os eventos) e propriedades específicas do componente.

### Propriedades globais (obrigatórias em todos os eventos)

```typescript
interface AnalyticsBasePayload {
  component: string      // Nome do componente em snake_case. Ex: "button", "dialog", "select"
  variant?: string       // Variante ativa no momento do evento. Ex: "default", "outline", "destructive"
  location: string       // Identificador da página ou seção onde o componente está. Ex: "header", "checkout_form", "settings_page"
}
```

### Propriedades específicas (adicionadas conforme o componente)

```typescript
// Componentes com label textual
interface WithLabel {
  label?: string         // Texto visível do elemento. Ex: "Salvar", "Cancelar", "Ver detalhes"
}

// Componentes com valor selecionável
interface WithValue {
  value?: string         // Valor selecionado ou inserido. Ex: "option_1", "true", "2"
}

// Componentes com posição (listas, carrosséis, tabs)
interface WithPosition {
  index?: number         // Posição baseada em 0. Ex: 0 para o primeiro item
  total?: number         // Total de itens disponíveis
}

// Componentes de formulário
interface WithFieldName {
  field_name: string     // Nome do campo no schema. Ex: "email", "password", "birth_date"
}
```

### Exemplo de payload completo

```typescript
// Evento: button_click num formulário de checkout
{
  component: "button",
  variant: "default",
  location: "checkout_form",
  label: "Finalizar compra"
}

// Evento: tab_change numa página de configurações
{
  component: "tabs",
  variant: "default",
  location: "settings_page",
  label: "Notificações",
  index: 2,
  total: 4
}

// Evento: form_field_error num formulário de cadastro
{
  component: "input",
  variant: "default",
  location: "signup_form",
  field_name: "email",
  label: "Email"
}
```

---

## Catálogo de Eventos por Componente

### Componentes interativos — rastrear sempre

Estes componentes têm interações diretas do usuário e devem ser instrumentados em qualquer produto que os utilize.

#### Button

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `button_click` | Ao clicar em qualquer botão | `label` (texto do botão) |

```typescript
// Implementação no produto (não no componente)
<Button
  onClick={() => {
    track("button_click", {
      component: "button",
      variant: "default",
      location: "checkout_form",
      label: "Finalizar compra"
    });
    handleCheckout();
  }}
>
  Finalizar compra
</Button>
```

> **Atenção**: não rastrear cliques em botões disabled. Verificar `disabled` antes de disparar o evento.

---

#### Form

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `form_submit` | Ao submeter o formulário com sucesso (sem erros de validação) | `field_count` (número de campos) |
| `form_error` | Quando a validação falha ao tentar submeter | `error_fields` (array com nomes dos campos com erro) |
| `form_abandon` | Quando o usuário fecha/navega sem submeter após ter interagido | — |

```typescript
// form_submit — disparar no onSubmit após validação bem-sucedida
const onSubmit = (data: FormData) => {
  track("form_submit", {
    component: "form",
    variant: "default",
    location: "signup_page",
    field_count: Object.keys(data).length
  });
  handleSubmit(data);
};

// form_error — disparar quando o RHF rejeita a submissão
const onError = (errors: FieldErrors) => {
  track("form_error", {
    component: "form",
    variant: "default",
    location: "signup_page",
    error_fields: Object.keys(errors)
  });
};
```

---

#### Campos de Formulário (Input, Textarea, Select, Checkbox, Switch)

Campos de formulário são rastreados de forma mais seletiva — não rastrear cada keystroke. Use os eventos abaixo conforme a necessidade do produto.

| Evento | Quando disparar | Payload adicional | Quando usar |
|--------|----------------|-------------------|-------------|
| `field_focus` | Ao focar no campo | `field_name` | Funis onde medir onde o usuário abandona |
| `field_blur` | Ao perder foco com valor preenchido | `field_name` | Medir taxa de preenchimento |
| `field_change` | Ao alterar o valor (Checkbox, Switch, Select) | `field_name`, `value` | Componentes de seleção — não inputs de texto livre |
| `field_error` | Quando o campo exibe erro de validação | `field_name`, `error_type` | Identificar campos com alta taxa de erro |

> **Regra importante**: nunca rastrear o `value` de campos sensíveis — senha, CPF, cartão de crédito, dados bancários. Omitir a propriedade `value` nesses casos.

```typescript
// field_change para Select (valor não sensível)
<Select
  onValueChange={(value) => {
    track("field_change", {
      component: "select",
      variant: "default",
      location: "profile_form",
      field_name: "country",
      value
    });
    field.onChange(value);
  }}
/>

// field_change para Switch
<Switch
  onCheckedChange={(checked) => {
    track("field_change", {
      component: "switch",
      variant: "default",
      location: "notification_settings",
      field_name: "email_notifications",
      value: String(checked)
    });
    field.onChange(checked);
  }}
/>
```

---

#### Dialog / Sheet / Drawer

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `dialog_open` | Quando o overlay é exibido | `label` (título do dialog) |
| `dialog_close` | Quando fechado sem confirmar (Escape, clique fora, botão Cancelar) | `label`, `trigger` ("escape" \| "backdrop" \| "cancel_button") |
| `dialog_confirm` | Quando a ação principal é confirmada | `label` |

```typescript
// dialog_open — no onOpenChange quando open passa a true
<Dialog onOpenChange={(open) => {
  if (open) {
    track("dialog_open", {
      component: "dialog",
      variant: "default",
      location: "user_settings",
      label: "Excluir conta"
    });
  }
}}>
```

---

#### Tabs

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `tab_change` | Ao selecionar uma aba diferente da atual | `label` (texto da aba), `index`, `total` |

---

#### Accordion

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `accordion_expand` | Ao abrir um item | `label` (texto do trigger) |
| `accordion_collapse` | Ao fechar um item | `label` |

---

#### Select / Dropdown Menu / Command

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `option_select` | Ao selecionar uma opção | `label` (texto da opção), `value` |

---

#### Pagination

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `page_change` | Ao navegar para outra página | `page` (número da página), `total_pages` |

---

#### Carousel

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `slide_change` | Ao mudar de slide (por swipe, botão ou auto-play) | `index`, `total`, `trigger` ("button" \| "swipe" \| "auto") |

---

#### Breadcrumb / Navigation Menu

| Evento | Quando disparar | Payload adicional |
|--------|----------------|-------------------|
| `navigation_click` | Ao clicar em um link de navegação | `label` (texto do link), `destination` (path ou identificador) |

---

### Componentes raramente rastreados — avaliar caso a caso

Estes componentes podem ser rastreados em contextos específicos, mas não há obrigatoriedade.

| Componente | Evento possível | Quando faz sentido |
|------------|----------------|-------------------|
| Tooltip | `tooltip_view` | Medir se usuários precisam de ajuda contextual em uma feature |
| Alert | `alert_dismiss` | Medir taxa de descarte de alertas importantes |
| Sonner / Toast | `toast_action_click` | Quando o toast tem uma ação (ex: "Desfazer") |
| Collapsible | `collapsible_toggle` | Quando o conteúdo colapsável tem importância na jornada |
| Menubar | `menu_item_click` | `label`, `menu` (nome do menu pai) |

---

### Componentes que não devem ser rastreados

Estes componentes são passivos, decorativos ou de infraestrutura — não representam intenção do usuário.

Skeleton, Progress, Separator, AspectRatio, ScrollArea, ResizableHandle, Avatar (sem ação), Badge (sem ação), Card (o container, não o conteúdo).

> **Rastrear o container vs. o conteúdo**: um Card com um Button dentro tem o Button rastreado, não o Card. O evento sempre fica no elemento interativo, não no container que o envolve.

---

## Como Implementar sem Acoplar ao Componente

### Padrão recomendado: wrapper na camada de produto

O componente de UI não deve importar ou chamar nenhuma função de analytics. O tracking é adicionado na camada de produto — na página ou no feature component.

```typescript
// ✅ CORRETO — tracking na camada de produto
// pages/checkout/CheckoutForm.tsx
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
  return <button onClick={handleClick} {...props} />;
}
```

### Padrão alternativo: data attributes para tracking automático

Para produtos com alto volume de componentes, é possível usar data attributes que um observador global captura automaticamente.

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

// Uso nos componentes de produto
<Button
  data-track="button_click"
  data-track-component="button"
  data-track-variant="default"
  data-track-location="checkout_form"
  data-track-label="Finalizar compra"
>
  Finalizar compra
</Button>
```

> **Quando usar cada padrão**: use callbacks explícitos quando o evento precisa de dados dinâmicos (valores de campo, índices calculados). Use data attributes quando o evento é simples e os dados são estáticos.

---

## Interface TypeScript da Função de Track

Implemente a função `track` com tipagem completa para garantir consistência entre equipes.

```typescript
// lib/analytics.ts

type ComponentName =
  | "button" | "form" | "input" | "textarea" | "select"
  | "checkbox" | "switch" | "dialog" | "sheet" | "drawer"
  | "tabs" | "accordion" | "pagination" | "carousel"
  | "navigation_menu" | "breadcrumb" | "dropdown_menu"
  | "command" | "collapsible" | "tooltip" | "alert" | "toast";

type EventName =
  | "button_click"
  | "form_submit" | "form_error" | "form_abandon"
  | "field_focus" | "field_blur" | "field_change" | "field_error"
  | "dialog_open" | "dialog_close" | "dialog_confirm"
  | "tab_change"
  | "accordion_expand" | "accordion_collapse"
  | "option_select"
  | "page_change"
  | "slide_change"
  | "navigation_click"
  | "tooltip_view" | "alert_dismiss" | "toast_action_click"
  | "collapsible_toggle" | "menu_item_click";

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
}

export function track(event: EventName, payload: TrackPayload): void {
  // Substituir pelo SDK da ferramenta de analytics escolhida
  // Ex: posthog.capture(event, payload)
  // Ex: analytics.track(event, payload)
  // Ex: gtag("event", event, payload)
  console.log("[Analytics]", event, payload);
}
```

---

## Integração com Ferramentas de Analytics

A função `track` acima é uma abstração — o corpo dela muda conforme a ferramenta. A nomenclatura de eventos e payloads permanece a mesma independente da ferramenta.

| Ferramenta | Implementação do corpo de `track` |
|------------|----------------------------------|
| PostHog | `posthog.capture(event, payload)` |
| Mixpanel | `mixpanel.track(event, payload)` |
| Amplitude | `amplitude.track(event, payload)` |
| Google Analytics 4 | `gtag("event", event, { ...payload })` |
| Segment | `analytics.track(event, payload)` |

> **Recomendação**: use uma camada de abstração (`lib/analytics.ts`) em vez de chamar o SDK diretamente nos componentes. Isso permite trocar a ferramenta de analytics sem alterar nenhum componente de produto.

---

## Checklist de Implementação

Ao instrumentar um novo componente ou feature:

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
- [ ] Evento disparado antes da ação de negócio (não depois — garante que o evento não seja perdido se a ação falhar)

**Consistência:**
- [ ] Mesmo componente com mesmo `location` usa o mesmo nome de evento em toda a aplicação
- [ ] Eventos documentados na seção 15 do arquivo `12-documentacao-componentes.md` do componente