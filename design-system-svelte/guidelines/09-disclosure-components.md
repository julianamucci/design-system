# Disclosure Components

---

## Accordion

**Propósito**: mostrar e ocultar seções de conteúdo relacionado para reduzir densidade visual — FAQs, configurações avançadas, conteúdo agrupável. Não usar para conteúdo que o usuário precisará sempre — prefira seções visíveis.

**API e exemplos**: `src/components/ui/accordion/accordion.svelte` + stories + `AccordionDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Tipos**:

| Tipo | Comportamento |
|---|---|
| `single` | Apenas um item expandido por vez |
| `multiple` | Vários itens expandidos simultaneamente |

**Estrutura**:

```
Accordion (type, collapsible?)
└── AccordionItem (value)
    ├── AccordionTrigger
    └── AccordionContent
```

**Regras**:
- `collapsible` obrigatório em `type="single"` — permite fechar o item aberto (UX acessível)
- Animações de expand/collapse: `motion-reduce:animate-none` em animações customizadas

**Acessibilidade**:
- Bits UI aplica automaticamente `role="region"`, `aria-expanded`, `aria-controls`, `aria-labelledby`

**Analytics**: `track('accordion_expand', { label })` ao expandir e `track('accordion_collapse', { label })` ao colapsar, via `onValueChange`. Ver `../../docs/shared/guidelines/07-analytics.md`.

---

## Collapsible

**Propósito**: mostrar e ocultar um único bloco de conteúdo — "Ver mais" de texto longo, seção colapsável de filtros, detalhe expandível de um item. Accordion para múltiplas seções agrupadas; Collapsible para um item isolado.

**API e exemplos**: `src/components/ui/collapsible/collapsible.svelte` + stories + `CollapsibleDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Collapsible (bind:open)
├── CollapsibleTrigger (asChild → Button)
└── CollapsibleContent
```

**Regras**:
- `CollapsibleTrigger` com `asChild` para usar o `Button` semanticamente correto
- `aria-label` descritivo no trigger — indica o estado atual: "Exibir X" / "Ocultar X"

**Acessibilidade**:
- Bits UI aplica `aria-expanded` e `aria-controls` automaticamente
