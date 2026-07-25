---
name: create-showcase
description: Cria uma página Showcase de categoria do design system, exibindo todas as variantes de todos os componentes da categoria em uma única página navegável. Usar quando o usuário pedir para criar um showcase, uma página de demonstração de categoria, ou uma visão geral visual de componentes de uma categoria (Layout, Navigation, Form, Feedback, Display, Disclosure ou Overlay).
---

# Skill: Create Showcase

Cria páginas `[Categoria]ShowcaseDocs.tsx` que exibem todas as variantes de todos os componentes de uma categoria.

## Antes de criar

1. Ler `references/showcase-structure.md` — contém a estrutura obrigatória, função exportada e padrões de seção
2. Ler **todos** os arquivos de guideline dos componentes da categoria (ex: para Overlay, ler `10-overlay-components.md` inteiro)
3. Identificar todas as variantes de cada componente — nunca inventar variantes não documentadas

## Estrutura obrigatória

**Nome do arquivo**: `/components/docs/[Categoria]ShowcaseDocs.tsx`

**Função exportada**: `export default function [Categoria]ShowcaseDocs()`

**Estrutura interna**:
```tsx
export default function [Categoria]ShowcaseDocs() {
  return (
    <div className="space-y-16">
      {/* Cabeçalho da categoria */}
      <section>
        <h1>[Categoria] Components</h1>
        <p>Descrição da categoria.</p>
      </section>

      {/* Uma seção por componente */}
      <section id="[componente]">
        <h2>[Componente]</h2>
        <p>Propósito em 1 frase.</p>
        {/* Grid de variantes */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {/* Cada variante com label */}
        </div>
      </section>
    </div>
  )
}
```

## Regras de conteúdo

- **Todas as variantes** de todos os componentes da categoria — não selecionar apenas algumas
- Cada variante com label textual identificando o que é
- Estados interativos (hover, focus, disabled) quando relevantes
- Exemplos funcionais — não apenas visuais estáticos
- Nenhuma variante inventada — apenas as documentadas nos guidelines

## Regras de código

- Imports apenas de `./components/ui` e `lucide-react`
- Tokens de cor corretos (não inventar classes)
- `aria-label` contextual em elementos interativos do showcase
- Sem lógica de negócio — apenas demonstração visual

## Categorias e seus arquivos de referência

| Categoria | Guideline | Componentes |
|-----------|-----------|-------------|
| Layout | 04 | AspectRatio, Card, Resizable, ScrollArea, Separator, Sidebar |
| Navigation | 05 | Breadcrumb, Menubar, NavigationMenu, Pagination, Stepper, Tabs |
| Form | 06 | Button, Calendar, Checkbox, Combobox, DatePicker, Form, Input, InputOTP, Label, RadioGroup, Select, Slider, Switch, Textarea, Toggle |
| Feedback | 07 | Alert, AlertDialog*, Badge, Progress, Skeleton, Sonner |
| Display | 08 | Avatar, Carousel, Chart, Table |
| Disclosure | 09 | Accordion, Collapsible |
| Overlay | 10 | AlertDialog, Command, ContextMenu, Dialog, Drawer, DropdownMenu, HoverCard, Popover, Sheet, Tooltip |

*AlertDialog documentado em 10-overlay-components.md
