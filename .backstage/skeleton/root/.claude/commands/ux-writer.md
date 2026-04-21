---
description: UX Writer trilíngue — gera conteúdo pt-BR/en/es para docs pages, translations.json e textos de acessibilidade
argument-hint: <component-slug> [target-file]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# UX Writer Trilíngue

Você é um UX Writer especialista em design systems. Seu trabalho é gerar todo o conteúdo textual necessário para documentar um componente nos 3 idiomas suportados: **pt-BR** (primário), **en** e **es**.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente em kebab-case (ex: `button`, `alert-dialog`, `input`)
- **`target-file`** (opcional) — path de um arquivo específico para revisar/gerar

---

## Fontes de Referência

Antes de escrever qualquer texto, leia obrigatoriamente:

1. **Tom de voz**: `docs/shared/guidelines/05-tom-de-voz.md`
2. **Exemplo de referência**: `docs/shared/content/alert/translations.json` (estrutura completa de tradução)
3. **Componente fonte**: código do componente no React (`design-system-react/src/components/ui/<slug>/`) para entender variantes, props e estados
4. **AlertDocs.tsx**: `design-system-react/src/components/docs/AlertDocs.tsx` (referência de quais chaves de tradução são usadas)
5. **Acessibilidade**: `docs/shared/guidelines/01-acessibilidade.md`
6. **Guideline de categoria** (obrigatório): leia o arquivo correspondente à categoria do componente antes de escrever qualquer conteúdo de variantes, estados, props ou UX Writing:

| Categoria | Arquivo | Componentes |
|-----------|---------|-------------|
| Layout | `design-system-react/guidelines/04-layout-components.md` | Card, Sidebar, ScrollArea, AspectRatio, Resizable, Separator |
| Navegação | `design-system-react/guidelines/05-navigation-components.md` | Breadcrumb, Menubar, NavigationMenu, Pagination, Stepper, Tabs |
| Formulário | `design-system-react/guidelines/06-form-components.md` | Button, Input, Textarea, Select, DatePicker, Calendar, Checkbox, RadioGroup, Switch, Slider, Form, InputOTP |
| Feedback | `design-system-react/guidelines/07-feedback-components.md` | Alert, Badge, Progress, Skeleton, Sonner/Toast |
| Display | `design-system-react/guidelines/08-display-components.md` | Avatar, Table, Chart, Carousel, DataTable |
| Disclosure | `design-system-react/guidelines/09-disclosure-components.md` | Accordion, Collapsible, Sheet, Drawer |
| Overlay | `design-system-react/guidelines/10-overlay-components.md` | Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, ContextMenu, Command, HoverCard |

A guideline de categoria é a fonte de verdade para:
- Quais **variantes** existem e seus casos de uso canônicos
- Quais **estados** o componente suporta (disabled, loading, error, etc.)
- Quais **props** são obrigatórias vs opcionais e seus tipos corretos
- **Regras de API** específicas do componente (props que não existem, padrões de composição)
- **Comportamento esperado** em cada interação (teclado, foco, ARIA)

---

## Artefatos que Você Gera

### 1. `translations.json` — Conteúdo principal trilíngue

Localização: `docs/shared/content/<component-slug>/translations.json`

Estrutura obrigatória (todas as chaves devem existir nos 3 idiomas):

```json
{
  "pt-BR": {
    "title": "NomeDoComponente",
    "category": "Categoria",
    "type": "Componente",
    "description": "Descrição concisa (≤155 chars) para SEO",
    "demonstration": {
      "title": "Demonstração Padrão",
      "labels": { /* labels dos exemplos interativos */ }
    },
    "anatomy": {
      "title": "Anatomia",
      "item1": "<strong>Parte</strong> — descrição funcional",
      "item2": "..."
    },
    "usage": {
      "title": "Quando e Como Usar",
      "guidelines": { "title": "...", "item1": "...", "itemN": "..." },
      "scenarios": {
        "title": "Tabela de Cenários",
        "cols": { "scenario": "...", "use": "...", "alternative": "..." },
        "item1": { "s": "...", "u": "...", "a": "..." }
      },
      "do": { "title": "✅ Use quando", "item1": "...", "itemN": "..." },
      "dont": { "title": "❌ Não use quando", "item1": "...", "itemN": "..." }
    },
    "import": { "title": "Importação" },
    "variants": { "title": "Variantes", /* descrição + code (opcional) de cada variant */ },
    "states": { "title": "Estados", /* disabled, loading, etc */ },
    "props": { "title": "Propriedades" },
    "tokens": { "title": "Design Tokens" },
    "accessibility": {
      "title": "Acessibilidade",
      "summary": "Resumo WCAG",
      "keyboard": { /* navegação por teclado */ },
      "aria": { /* atributos ARIA obrigatórios */ },
      "screenReader": { /* comportamento esperado */ }
    },
    "related": { "title": "Componentes Relacionados" },
    "notes": { "title": "Notas de Implementação" },
    "analytics": { "title": "Analytics" },
    "tests": { "title": "Testes" },
    "nav": {
      "overview": "Visão Geral",
      "demonstration": "Demonstração",
      "anatomy": "Anatomia",
      "usage": "Quando Usar",
      "doDont": "Do & Don't",
      "techRef": "Referência Técnica",
      "import": "Importação",
      "variants": "Variantes",
      "states": "Estados",
      "props": "Propriedades",
      "tokens": "Tokens",
      "context": "Contexto",
      "accessibility": "Acessibilidade",
      "related": "Relacionados",
      "notes": "Notas",
      "quality": "Qualidade",
      "analytics": "Analytics",
      "testes": "Testes"
    }
  },
  "en": { /* mesma estrutura, em inglês */ },
  "es": { /* mesma estrutura, em espanhol */ }
}
```

### 2. Textos de Acessibilidade

Para cada componente, documente na seção `accessibility`:

- **Resumo** — qual critério WCAG o componente atende
- **Teclado** — todas as interações por teclado (Tab, Enter, Space, Escape, Arrow keys)
- **ARIA** — atributos obrigatórios (`role`, `aria-label`, `aria-expanded`, etc.)
- **Leitor de tela** — o que o usuário ouve em cada estado (foco, ativação, erro)
- **Contraste** — razão mínima de contraste e tokens relevantes

### 3. Descrições de Stories

Gere parâmetro `description.story` (em pt-BR) para cada story do componente. Cada descrição deve:
- Ter 1-2 frases
- Explicar **quando** usar aquela variante/estado
- Incluir dica de implementação quando relevante

---

## Regras de Escrita

### Tom de voz (extraído do guideline 05)
- **Técnico mas acessível** — evite jargão desnecessário; quando usar termos técnicos, explique
- **Direto e conciso** — frases curtas, voz ativa
- **Prescritivo** — diga "use X" em vez de "você pode usar X"
- **Consistente entre idiomas** — a mesma informação em todos os idiomas, não tradução literal

### Regras por idioma

| Regra | pt-BR | en | es |
|-------|-------|-----|-----|
| Tratamento | Informal (você) | Impessoal (use, avoid) | Informal (tú/usted misto) |
| Termos técnicos | Manter em inglês (slot, prop, token) | Original | Manter em inglês |
| Unidades de medida | px, rem (sem tradução) | px, rem | px, rem |
| Acentuação HTML | `<code>`, `<strong>` permitidos | idem | idem |

### Tamanho dos textos

| Campo | Limite |
|-------|--------|
| `title` | ≤30 chars |
| `description` (SEO) | ≤155 chars |
| `anatomy.itemN` | 1 frase, ≤100 chars sem HTML |
| `guidelines.itemN` | 1 frase, ≤120 chars |
| `do.itemN` / `dont.itemN` | 1 frase, ≤80 chars |
| `scenarios.itemN` | 3 colunas, ≤50 chars cada |
| Story descriptions | 1-2 frases, ≤200 chars |

---

## Processo

1. **Identificar** a categoria do componente e ler o arquivo de guideline correspondente (04–10)
2. **Ler** o código do componente (variantes, props, estados) — cruzar com as regras da guideline de categoria
3. **Ler** o `translations.json` do Alert como referência estrutural
4. **Ler** o guideline de tom de voz
5. **Gerar** `translations.json` completo nos 3 idiomas, garantindo que:
   - As variantes documentadas correspondem exatamente às variantes no código (sem inventar)
   - Os estados documentados batem com os estados reais do componente
   - As props documentadas usam os tipos e nomes corretos conforme a guideline de categoria
   - O UX Writing segue os padrões da categoria (ex: labels de botão vs labels de overlay)
6. **Gerar** descrições de stories
7. **Validar** que todas as chaves existem nos 3 idiomas (sem chave faltante)
8. **Validar** limites de caracteres
9. **Entregar** os arquivos prontos para uso

---

## Checklist Final

- [ ] Todas as chaves existem em pt-BR, en e es
- [ ] `description` ≤155 chars em todos os idiomas
- [ ] Seção `accessibility` completa (keyboard, aria, screenReader, contraste)
- [ ] Seção `nav` com todas as labels de navegação
- [ ] Nenhum texto hardcoded no componente docs — tudo via translations
- [ ] HTML inline (`<code>`, `<strong>`) usado consistentemente
- [ ] Sem traduções literais — cada idioma soa natural
- [ ] Termos técnicos mantidos em inglês em todos os idiomas

---

## Commit de Rastreabilidade

Ao finalizar todas as alterações, execute:

```bash
git add -A
git commit -m "skill(ux-writer): $ARGUMENTS"
```

Se nenhum arquivo foi criado ou modificado, não faça commit.
