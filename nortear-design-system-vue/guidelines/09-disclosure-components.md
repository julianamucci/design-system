# Disclosure Components

---

## Accordion

**Propósito**: exibição de múltiplas seções de conteúdo colapsáveis e relacionadas entre si, onde o usuário expande apenas o que precisa.

**Quando usar**: FAQ, documentação com seções, especificações de produto, configurações agrupadas. Para uma única seção isolada, usar `Collapsible`. Para alternância entre views paralelas, usar `Tabs`.

**API e exemplos**: `src/components/ui/accordion/accordion.vue` + stories + `AccordionDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

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
    ├── AccordionTrigger  (título — chevron aplicado automaticamente)
    └── AccordionContent
```

**Props relevantes**:

| Prop | Default | Função |
|------|---------|--------|
| `type` | — | `single` (um item por vez) ou `multiple` (vários abertos) |
| `collapsible` | `false` | Em `type="single"`, permite fechar o item ativo clicando nele |
| `defaultValue` | — | Item(s) aberto(s) por padrão sem controlar |
| `value` / `onValueChange` | — | Modo controlado |

**Regras**:
- `AccordionItem` requer prop `value` obrigatória e única — é o identificador interno
- `type="single"` com `collapsible` para FAQ e documentação — permite fechar o item ativo
- `type="single"` **sem** `collapsible` apenas quando é obrigatório ter sempre um item aberto
- `type="multiple"` para especificações ou configurações onde o usuário compara seções
- `defaultValue` para abrir um item por padrão sem tornar o componente controlado
- O chevron rotativo no `AccordionTrigger` é aplicado automaticamente — não adicionar manualmente
- Máximo de 8–10 itens por Accordion — acima disso, considerar organização por categorias ou busca

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- Aplicados automaticamente: `role="button"`, `aria-expanded`, `aria-controls` no trigger e `role="region"` no content — não reimplementar
- `AccordionTrigger` renderiza um `<button>` — acessibilidade por teclado nativa
- Navegação por teclado nativa: `Tab` move entre triggers, `Enter`/`Space` expande/colapsa, `Arrow Down`/`Up` move entre triggers
- Animação de abertura respeita `prefers-reduced-motion` automaticamente

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- `AccordionTrigger`: pergunta direta (FAQ) ou frase nominal (documentação)
- FAQ: frase interrogativa completa — "Como faço para redefinir minha senha?"
- Documentação: substantivo ou frase nominal — "Especificações técnicas", "Política de devolução"
- Sem ponto final em frases nominais; com ponto de interrogação em perguntas
- `AccordionContent`: resposta objetiva, máximo 3–4 linhas — conteúdo longo sugere que o item deveria ser uma página própria

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
- `accordion_expand` ao abrir, `accordion_collapse` ao fechar, ambos com `label` (texto do trigger)
- Detectar direção do toggle via `data-state` do trigger antes do clique

---

## Collapsible

**Propósito**: mostrar ou ocultar uma única seção de conteúdo de forma independente, controlada por um trigger explícito.

**Quando usar**: seção de "ver mais", filtros avançados opcionais, detalhes secundários, configurações raramente acessadas. Para múltiplas seções relacionadas, usar `Accordion`.

**API e exemplos**: `src/components/ui/collapsible/collapsible.vue` + stories + `CollapsibleDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

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
├── CollapsibleTrigger  (as-child + Button — padrão recomendado)
└── CollapsibleContent
```

**Regras**:
- `CollapsibleTrigger as-child` com `<Button>` — aproveita estilos, estados de foco e acessibilidade do Button
- Modo controlado (`open + onOpenChange`) quando o estado influencia outros elementos da UI
- Modo não-controlado (`defaultOpen`) quando a seção é independente e o estado não precisa ser compartilhado
- Sempre incluir um elemento com texto no trigger, visível ou visualmente oculto com `.nds-sr-only` — nunca trigger apenas com ícone sem nome acessível
- Ícone deve indicar visualmente o estado atual: chevron para baixo (fechado) / para cima (aberto)
- Ícone giratório: `.nds-chevron` no chevron. A folha gira 180° quando o ancestral está em `data-state="open"` ou `aria-expanded="true"`, e traz a transição — não reimplementar a rotação por estado

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `aria-expanded` e `aria-controls` aplicados automaticamente no `CollapsibleTrigger` — não reimplementar
- Trigger com apenas ícone: um `<span class="nds-sr-only">` descrevendo a ação e o objeto — "Exibir filtros avançados"
- `aria-label` no Button quando o estado muda o label: `isOpen ? "Ocultar..." : "Exibir..."`
- Animação de abertura: a folha já para sob `prefers-reduced-motion`. Animação personalizada acrescentada por cima tem de parar sob a mesma condição — se vier de utilitária de animação avulsa, somar `.nds-motion-reduce-none`

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Label do trigger: verbo no infinitivo + objeto — "Exibir filtros avançados", "Ocultar detalhes"
- Alternar o label com o estado: "Exibir" quando fechado, "Ocultar" quando aberto
- Evitar labels genéricos: "Ver mais", "Toggle", "Expandir" sem contexto
- Header da seção: substantivo ou frase nominal que descreve o conteúdo — "Filtros avançados", "Informações técnicas"

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
- `collapsible_toggle` com `label` e `value` ("open"|"closed")
- Rastrear apenas quando a seção tem importância na jornada do usuário — não rastrear colapsáveis decorativos

---

## Regras transversais de Disclosure Components

**Critério de decisão consolidado**:

| Situação | Componente |
|----------|------------|
| N seções relacionadas, expansão independente | Accordion |
| 1 seção isolada com trigger explícito | Collapsible |
| Alternância entre views paralelas | Tabs |
| Etapas sequenciais obrigatórias | Stepper |

**Acessibilidade transversal** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `aria-expanded` e `aria-controls` aplicados automaticamente em ambos — nunca adicionar manualmente
- Triggers sempre são `<button>` — navegação por teclado nativa garantida
- Ícones de estado (`ChevronDown`) sempre com `aria-hidden="true"` — o estado é comunicado via `aria-expanded`
- Labels de trigger devem descrever o conteúdo, não a ação mecânica: "Detalhes do pedido" em vez de "Clique para expandir"
- As folhas `.nds-*` já param a animação sob `prefers-reduced-motion`; animação personalizada acrescentada por cima tem de parar sob a mesma condição

**Analytics transversal** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Componente | Evento | Payload |
|------------|--------|---------|
| Accordion | `accordion_expand` | `label` (texto do trigger) |
| Accordion | `accordion_collapse` | `label` |
| Collapsible | `collapsible_toggle` | `label`, `value` ("open"\|"closed") |

**UX Writing transversal** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Triggers de Accordion: frase interrogativa (FAQ) ou frase nominal (documentação)
- Triggers de Collapsible: verbo + objeto alternado com o estado ("Exibir" / "Ocultar")
- Conteúdo expansível: objetivo e conciso — conteúdo longo sugere que o item merece página própria
