# Disclosure Components

---

## Accordion

**Propósito**: exibição de múltiplas seções de conteúdo colapsáveis e relacionadas entre si, onde o usuário expande apenas o que precisa. Use em FAQ, documentação com seções, especificações de produto, configurações agrupadas. Para uma única seção isolada, usar `Collapsible`. Para alternância entre views paralelas, usar `Tabs`.

**API e exemplos**: `src/components/ui/accordion.tsx` + stories + `AccordionDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras. Em caso de divergência entre esta guideline e o código, **o código vence**.

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
Accordion (multiple?, defaultValue?, value?, onValueChange?)
└── AccordionItem (value — obrigatório, único)
    ├── AccordionTrigger  (título — chevron aplicado automaticamente)
    └── AccordionContent  (conteúdo expansível)
```

**Props essenciais** (decisões de design — para a tabela completa veja `AccordionDocs.tsx`):

| Prop | Default | Quando usar |
|------|---------|-------------|
| `multiple` | `false` | Habilita abrir vários itens simultaneamente (especificações, comparação). Omitido = modo single, padrão para FAQ. |
| `defaultValue` | — | Array de `value`s iniciais (`["item-1"]`). Para abrir um item na montagem sem virar controlado. |
| `value` + `onValueChange` | — | Modo controlado. Estado externo (URL, store). Sempre array, mesmo no modo single. |
| `disabled` (em `AccordionItem`) | `false` | Bloqueia interação no item — emite `aria-disabled`. |

> **API base-ui**: o componente usa `@base-ui/react/accordion`. Não existem props `type="single|multiple"` nem `collapsible` (esses eram do `@radix-ui` legado). O modo single é o default; `multiple` é boolean. No modo single, fechar o item ativo é sempre permitido (não há flag `collapsible`).

**Regras de uso**:
- `AccordionItem` exige `value` único — é o identificador interno
- Modo single (padrão) para FAQ e documentação onde uma seção por vez é a leitura natural
- `multiple` para especificações ou configurações onde o usuário compara seções
- `defaultValue={["item-1"]}` para abrir um item por padrão sem tornar o componente controlado
- O chevron no `AccordionTrigger` é aplicado pelo próprio componente — não adicionar manualmente
- Máximo de 8–10 itens — acima disso, considere categorizar ou adicionar busca
- Não aninhar Accordions

**Acessibilidade** (ver `11-acessibilidade.md`):
- O base-ui aplica automaticamente `role="button"`, `aria-expanded`, `aria-controls` no trigger e `role="region"` no content — não reimplementar
- `AccordionTrigger` renderiza um `<button>` nativo — teclado funciona out of the box
- Navegação por teclado: `Tab` move entre triggers, `Enter`/`Space` expande/colapsa, `↓`/`↑` movem entre triggers quando o foco está dentro do accordion
- Animação respeita `prefers-reduced-motion` automaticamente (via CSS)

**UX Writing** (ver `19-tom-de-voz.md`):
- `AccordionTrigger`: pergunta direta (FAQ) ou frase nominal (documentação)
- FAQ: frase interrogativa completa — "Como faço para redefinir minha senha?"
- Documentação: substantivo ou frase nominal — "Especificações técnicas", "Política de devolução"
- Sem ponto final em frases nominais; com ponto de interrogação em perguntas
- `AccordionContent`: resposta objetiva, máximo 3–4 linhas — conteúdo longo sugere que o item deveria ser uma página própria

**Analytics** (ver `21-analytics.md`):
- Dispare eventos no consumidor via `onValueChange` — não monkey-patch `onClick` no trigger.
- Eventos: `accordion_expand` / `accordion_collapse` com `label` e `value`.
- No modo single o array tem 0 ou 1 elemento; no modo multiple pode ter N. Compare o tamanho antes/depois para detectar expand vs collapse.

**Testes**:
- **Especificação**: [`docs/shared/content/accordion/translations.json`](../../docs/shared/content/accordion/translations.json) → `testes.{functional,accessibility,visual}` (cada item tem `priority` e a `story` que cobre)
- **Implementação**: play functions em [`accordion*.stories.tsx`](../src/components/ui/) (Playground + modos + estados + composições)
- **Validação de cobertura**: `/quality accordion` (Fase 2.5 cruza spec ↔ play steps; ausência de step para item documentado = bug)
- **Mínimo obrigatório de categoria Disclosure**: aria-expanded sincronizado, navegação por teclado (Tab/Enter/Space/↑↓), zero violations axe-core em estado fechado E aberto

---

## Collapsible

**Propósito**: mostrar ou ocultar uma única seção de conteúdo de forma independente, controlada por um trigger explícito. Use em "ver mais", filtros avançados opcionais, detalhes secundários, configurações raramente acessadas. Para múltiplas seções relacionadas, usar `Accordion`.

**API e exemplos**: `src/components/ui/collapsible.tsx` + stories + `CollapsibleDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras. Em caso de divergência entre esta guideline e o código, **o código vence**.

**Critério de decisão — Collapsible vs Accordion**:

| Situação | Componente |
|----------|------------|
| Uma única seção expansível, isolada no layout | Collapsible |
| Grupo de seções relacionadas com expansão independente | Accordion |
| Seção com conteúdo sempre visível + parte ocultável | Collapsible |
| FAQ, documentação com N seções | Accordion |

**Estrutura de subcomponentes**:
```
Collapsible (open?, onOpenChange?, defaultOpen?)
├── CollapsibleTrigger (renderiza <button>; usar render={<Button />} para reuso do Button)
└── CollapsibleContent (conteúdo expansível)
```

**Props essenciais**:

| Prop | Default | Quando usar |
|------|---------|-------------|
| `open` + `onOpenChange` | — | Modo controlado. Use quando o estado influencia outros elementos (URL, store, UI vizinha). |
| `defaultOpen` | `false` | Modo não-controlado. Use quando a seção é autossuficiente e o consumidor não precisa do estado. |
| `disabled` | `false` | Bloqueia interação. |

> **API base-ui**: o componente usa `@base-ui/react/collapsible`. A prop `asChild` foi removida na migração base-nova — para usar um Button como trigger, use `render={<Button />}`. O trigger emite `data-state="open"|"closed"` (CSS pode usar `[data-state=open]:rotate-180`).

**Regras de uso**:
- `CollapsibleTrigger` deve ter label acessível — texto visível ou `<span className="sr-only">` quando for só ícone
- Ícone do trigger deve indicar o estado: chevron para baixo (fechado) / para cima (aberto) — via classe condicional ou seletor `[data-state=open]`
- Modo controlado quando o estado precisa ser sincronizado com outro elemento da UI
- Modo não-controlado para seções independentes (filtros, detalhes opcionais)
- Não usar para múltiplas seções relacionadas — esse é o caso do Accordion

**Acessibilidade** (ver `11-acessibilidade.md`):
- O base-ui aplica `aria-expanded` e `aria-controls` automaticamente — não reimplementar
- Trigger apenas com ícone: incluir `<span className="sr-only">` descrevendo a ação completa ("Exibir filtros avançados", não apenas "Expandir")
- Alterar o label conforme o estado: "Exibir" quando fechado, "Ocultar" quando aberto
- Animações customizadas no `CollapsibleContent` precisam de `motion-reduce:animate-none` ou `motion-reduce:transition-none`

**UX Writing** (ver `19-tom-de-voz.md`):
- Label do trigger: verbo no infinitivo + objeto — "Exibir filtros avançados", "Ocultar detalhes"
- Alternar o label com o estado: "Exibir" quando fechado, "Ocultar" quando aberto
- Evitar labels genéricos: "Ver mais", "Toggle", "Expandir" sem contexto
- Header da seção (texto irmão do trigger): substantivo ou frase nominal — "Filtros avançados", "Informações técnicas"

**Analytics** (ver `21-analytics.md`):
- Evento `collapsible_toggle` via `onOpenChange`, com `label` e `value` ("open" / "closed").
- Rastreie apenas quando a seção tem importância na jornada — não rastreie colapsáveis decorativos ou de baixo valor de negócio.

**Testes**:
- **Especificação**: [`docs/shared/content/collapsible/translations.json`](../../docs/shared/content/collapsible/translations.json) → `testes.{functional,accessibility,visual}`
- **Implementação**: play functions em [`collapsible*.stories.tsx`](../src/components/ui/)
- **Validação de cobertura**: `/quality collapsible` (Fase 2.5 cruza spec ↔ play steps)
- **Mínimo obrigatório de categoria Disclosure**: aria-expanded sincronizado, trigger acessível por teclado (Enter/Space), zero violations axe-core em estado fechado E aberto

---

## Regras transversais de Disclosure Components

**Use, não recrie**: ambos os componentes estão implementados em `src/components/ui/`. Importe — não copie HTML/JSX equivalente. Se algum padrão visual usado num lugar não existir no componente, abra um patch (ver `PATCHES.md`) em vez de divergir.

**Critério de decisão consolidado**:

| Situação | Componente |
|----------|------------|
| N seções relacionadas, expansão independente | Accordion |
| 1 seção isolada com trigger explícito | Collapsible |
| Alternância entre views paralelas | Tabs |
| Etapas sequenciais obrigatórias | Stepper |

**Acessibilidade transversal** (ver `11-acessibilidade.md`):
- `aria-expanded` e `aria-controls` aplicados automaticamente pelo base-ui em ambos — nunca adicionar manualmente
- Triggers sempre são `<button>` — navegação por teclado nativa garantida
- Ícones de estado (`ChevronDown`) sempre com `aria-hidden="true"` — o estado é comunicado via `aria-expanded`
- Labels de trigger devem descrever o conteúdo, não a ação mecânica: "Detalhes do pedido" em vez de "Clique para expandir"
- Animações respeitam `prefers-reduced-motion` por default — animações customizadas adicionadas precisam de `motion-reduce:animate-none`

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

**Testes transversais**:
- Cada componente tem sua especificação em [`docs/shared/content/<slug>/translations.json`](../../docs/shared/content/) → `testes.{functional,accessibility,visual}` e implementação em `<slug>*.stories.tsx`
- Cobertura validada por `/quality <slug>` (cruza spec ↔ play steps automaticamente)
- Para a categoria Disclosure, qualquer story Playground deve testar pelo menos: presença do trigger, click expande, click fecha (single ou multi conforme o componente), aria-expanded sincronizado, teclado Enter/Space funcional