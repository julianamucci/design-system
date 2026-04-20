# Disclosure Components

---

## Accordion

**Propósito**: exibição de múltiplas seções de conteúdo colapsáveis e relacionadas entre si, onde o usuário expande apenas o que precisa.

**Quando usar**: FAQ, documentação com seções, especificações de produto, configurações agrupadas. Para uma única seção isolada, usar `Collapsible`. Para alternância entre views paralelas, usar `Tabs`.

**Critério de decisão — Accordion vs Collapsible vs Tabs vs Stepper**:

| Situação | Componente |
|----------|------------|
| Múltiplas seções relacionadas, expansão independente | Accordion |
| Uma única seção expansível isolada | Collapsible |
| Alternância entre views paralelas sem hierarquia | Tabs |
| Etapas sequenciais obrigatórias | Stepper |
| Muitas seções (> 6) | Accordion ou Sidebar com Accordion |
| Hierarquia de navegação com muitas categorias | Sidebar com Accordion |

**Estrutura de subcomponentes**:
```
Accordion (type, collapsible, defaultValue)
└── AccordionItem (value — obrigatório)
    ├── AccordionTrigger  (título da seção — chevron aplicado automaticamente)
    └── AccordionContent  (conteúdo expansível)
```

**Implementação — tipo single (padrão para FAQ)**:
```tsx
import {
  Accordion, AccordionContent,
  AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion"

{/* type="single" + collapsible: permite fechar o item aberto clicando nele novamente */}
<Accordion type="single" collapsible defaultValue="item-1" className="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
    <AccordionContent>
      Acesse a tela de login e clique em "Esqueci minha senha". Você receberá
      um link de redefinição no email cadastrado, válido por 24 horas.
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="item-2">
    <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
    <AccordionContent>
      Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento
      disponível em até 12 vezes sem juros no cartão.
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="item-3">
    <AccordionTrigger>Como cancelo minha assinatura?</AccordionTrigger>
    <AccordionContent>
      Você pode cancelar a qualquer momento em Configurações → Assinatura.
      O acesso permanece ativo até o fim do período já pago.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Implementação — tipo multiple**:
```tsx
{/* type="multiple": permite abrir vários itens simultaneamente */}
<Accordion type="multiple" className="w-full">
  <AccordionItem value="especificacoes">
    <AccordionTrigger>Especificações técnicas</AccordionTrigger>
    <AccordionContent>
      {/* conteúdo */}
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="compatibilidade">
    <AccordionTrigger>Compatibilidade</AccordionTrigger>
    <AccordionContent>
      {/* conteúdo */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Implementação — controlado**:
```tsx
{/* Modo controlado: útil quando o estado precisa ser gerenciado externamente */}
const [value, setValue] = useState<string>("item-1")

<Accordion type="single" collapsible value={value} onValueChange={setValue}>
  ...
</Accordion>
```

**Regras**:
- `AccordionItem` requer prop `value` obrigatória e única — é o identificador interno de cada item
- `type="single"` com `collapsible` para FAQ e documentação — permite fechar o item ativo
- `type="single"` **sem** `collapsible` apenas quando é obrigatório ter sempre um item aberto
- `type="multiple"` para especificações ou configurações onde o usuário compara seções
- `defaultValue` para abrir um item por padrão sem tornar o componente controlado
- O chevron rotativo no `AccordionTrigger` é aplicado automaticamente pelo Shadcn — não adicionar manualmente
- Máximo de 8–10 itens por Accordion — acima disso, considerar organização por categorias ou busca

**Acessibilidade** (ver `11-acessibilidade.md`):
- O Radix aplica automaticamente: `role="button"`, `aria-expanded`, `aria-controls` no trigger e `role="region"` no content — não reimplementar
- `AccordionTrigger` renderiza um `<button>` — mantém acessibilidade por teclado nativa
- Navegação por teclado nativa: `Tab` move entre triggers, `Enter`/`Space` expande/colapsa, `Arrow Down`/`Up` move entre triggers (quando foco está no accordion)
- Animação de abertura: o Shadcn aplica via CSS — respeita `prefers-reduced-motion` automaticamente

**UX Writing** (ver `19-tom-de-voz.md`):
- `AccordionTrigger`: pergunta direta (FAQ) ou frase nominal (documentação)
- FAQ: frase interrogativa completa — "Como faço para redefinir minha senha?"
- Documentação: substantivo ou frase nominal — "Especificações técnicas", "Política de devolução"
- Sem ponto final em frases nominais; com ponto de interrogação em perguntas
- `AccordionContent`: resposta objetiva, máximo 3–4 linhas — conteúdo longo sugere que o item deveria ser uma página própria

**Analytics** (ver `21-analytics.md`):
```tsx
<AccordionItem value="faq-senha">
  <AccordionTrigger
    onClick={(e) => {
      const isOpening = e.currentTarget.getAttribute("data-state") === "closed"
      if (isOpening) {
        track("accordion_expand", {
          component: "accordion",
          location: "faq_page",
          label: "Como faço para redefinir minha senha?"
        })
      } else {
        track("accordion_collapse", {
          component: "accordion",
          location: "faq_page",
          label: "Como faço para redefinir minha senha?"
        })
      }
    }}
  >
    Como faço para redefinir minha senha?
  </AccordionTrigger>
  <AccordionContent>...</AccordionContent>
</AccordionItem>
```

> Usar `data-state="closed"` para detectar se o clique vai abrir ou fechar — o Radix atualiza o estado após o clique, então verificar o estado anterior ao evento.

---

## Collapsible

**Propósito**: mostrar ou ocultar uma única seção de conteúdo de forma independente, controlada por um trigger explícito.

**Quando usar**: seção de "ver mais", filtros avançados opcionais, detalhes secundários, configurações raramente acessadas. Para múltiplas seções relacionadas, usar `Accordion`.

**Critério de decisão — Collapsible vs Accordion**:

| Situação | Componente |
|----------|------------|
| Uma única seção expansível, isolada no layout | Collapsible |
| Grupo de seções relacionadas com expansão independente | Accordion |
| Seção com conteúdo sempre visível + parte ocultável | Collapsible |
| FAQ, documentação com N seções | Accordion |

**Estrutura de subcomponentes**:
```
Collapsible (open, onOpenChange, defaultOpen)
├── CollapsibleTrigger (asChild + Button — padrão recomendado)
└── CollapsibleContent (conteúdo expansível)
```

**Implementação — modo controlado** (padrão recomendado):
```tsx
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

const [isOpen, setIsOpen] = useState(false)

<Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
  {/* Header sempre visível */}
  <div className="flex items-center justify-between">
    <h4 className="text-sm font-medium">Filtros avançados</h4>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm" aria-label={isOpen ? "Ocultar filtros avançados" : "Exibir filtros avançados"}>
        <ChevronDown
          className="h-4 w-4 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        />
      </Button>
    </CollapsibleTrigger>
  </div>

  {/* Conteúdo sempre visível (parte fixa) */}
  <div className="rounded-md border border-border px-4 py-3 text-sm">
    Filtro básico ativo
  </div>

  {/* Conteúdo colapsável */}
  <CollapsibleContent className="space-y-2">
    <div className="rounded-md border border-border px-4 py-3 text-sm">
      Filtro avançado 1
    </div>
    <div className="rounded-md border border-border px-4 py-3 text-sm">
      Filtro avançado 2
    </div>
  </CollapsibleContent>
</Collapsible>
```

**Implementação — modo não-controlado** (quando não é necessário gerenciar o estado):
```tsx
{/* defaultOpen: define o estado inicial sem controle externo */}
<Collapsible defaultOpen={false} className="space-y-2">
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">Detalhes técnicos</span>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm">
        <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Expandir detalhes técnicos</span>
      </Button>
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent>
    {/* conteúdo */}
  </CollapsibleContent>
</Collapsible>
```

**Implementação — ícone giratório via `data-state`** (alternativa CSS pura):
```tsx
{/* O Radix aplica data-state="open"|"closed" no CollapsibleTrigger */}
<CollapsibleTrigger asChild>
  <Button variant="ghost" size="sm">
    <ChevronDown
      className="h-4 w-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180"
      aria-hidden="true"
    />
    <span className="sr-only">
      {isOpen ? "Ocultar" : "Exibir"} filtros avançados
    </span>
  </Button>
</CollapsibleTrigger>
```

**Regras**:
- `CollapsibleTrigger asChild` com `<Button>` — aproveita estilos, estados de foco e acessibilidade do Button
- Modo controlado (`open + onOpenChange`) quando o estado influencia outros elementos da UI
- Modo não-controlado (`defaultOpen`) quando a seção é independente e o estado não precisa ser compartilhado
- Sempre incluir um elemento com texto ou `sr-only` no trigger — nunca trigger apenas com ícone sem label
- Ícone deve indicar visualmente o estado atual: chevron para baixo (fechado) / para cima (aberto)

**Acessibilidade** (ver `11-acessibilidade.md`):
- O Radix aplica `aria-expanded` e `aria-controls` automaticamente no `CollapsibleTrigger` — não reimplementar
- Trigger com apenas ícone: `<span className="sr-only">` descrevendo a ação e o objeto — "Exibir filtros avançados"
- `aria-label` no Button quando o estado muda o label: `isOpen ? "Ocultar..." : "Exibir..."`
- Animação de abertura: aplicar `motion-reduce:animate-none` se adicionar animações customizadas além do padrão do Shadcn

```tsx
{/* Animação customizada com motion-reduce */}
<CollapsibleContent className="overflow-hidden transition-all motion-reduce:transition-none">
  {/* conteúdo */}
</CollapsibleContent>
```

**UX Writing** (ver `19-tom-de-voz.md`):
- Label do trigger: verbo no infinitivo + objeto — "Exibir filtros avançados", "Ocultar detalhes"
- Alternar o label com o estado: "Exibir" quando fechado, "Ocultar" quando aberto
- Evitar labels genéricos: "Ver mais", "Toggle", "Expandir" sem contexto
- Header da seção: substantivo ou frase nominal que descreve o conteúdo — "Filtros avançados", "Informações técnicas"

**Analytics** (ver `21-analytics.md`):
```tsx
<Collapsible
  open={isOpen}
  onOpenChange={(open) => {
    setIsOpen(open)
    track("collapsible_toggle", {
      component: "collapsible",
      location: "search_page",
      label: "Filtros avançados",
      value: open ? "open" : "closed"
    })
  }}
>
  ...
</Collapsible>
```

> Rastrear `collapsible_toggle` apenas quando a seção tem importância na jornada do usuário — não rastrear colapsáveis decorativos ou de baixo valor de negócio.

---

## Regras transversais de Disclosure Components

**Critério de decisão consolidado**:

| Situação | Componente |
|----------|------------|
| N seções relacionadas, expansão independente | Accordion |
| 1 seção isolada com trigger explícito | Collapsible |
| Alternância entre views paralelas | Tabs |
| Etapas sequenciais obrigatórias | Stepper |

**Acessibilidade transversal** (ver `11-acessibilidade.md`):
- `aria-expanded` e `aria-controls` aplicados automaticamente pelo Radix em ambos — nunca adicionar manualmente
- Triggers sempre são `<button>` — navegação por teclado nativa garantida
- Ícones de estado (`ChevronDown`) sempre com `aria-hidden="true"` — o estado é comunicado via `aria-expanded`
- Labels de trigger devem descrever o conteúdo, não a ação mecânica: "Detalhes do pedido" em vez de "Clique para expandir"
- Animações respeitam `prefers-reduced-motion` via Shadcn — animações customizadas adicionadas precisam de `motion-reduce:animate-none`

**Analytics transversal** (ver `21-analytics.md`):

| Componente | Evento | Payload |
|------------|--------|---------|
| Accordion | `accordion_expand` | `label` (texto do trigger) |
| Accordion | `accordion_collapse` | `label` |
| Collapsible | `collapsible_toggle` | `label`, `value` ("open"\|"closed") |

**UX Writing transversal** (ver `19-tom-de-voz.md`):
- Triggers de Accordion: frase interrogativa (FAQ) ou frase nominal (documentação)
- Triggers de Collapsible: verbo + objeto alternado com o estado ("Exibir" / "Ocultar")
- Conteúdo expansível: objetivo e conciso — conteúdo longo sugere que o item merece página própria