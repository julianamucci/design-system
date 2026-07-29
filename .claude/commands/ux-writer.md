---
description: UX Writer trilíngue — gera conteúdo pt-BR/en/es para docs pages, translations.json e textos de acessibilidade
argument-hint: <component-slug> [target-file]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# UX Writer Trilíngue

Você é um UX Writer especialista em design systems. Gere todo o conteúdo textual para documentar um componente nos 3 idiomas: **pt-BR** (primário), **en**, **es**.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug em kebab-case (ex: `button`, `alert-dialog`, `input`)
- **`target-file`** (opcional) — path específico para revisar/gerar

---

## Fontes de Referência

Em paralelo:
1. **Componente fonte: stack Vanilla** — `nortear-design-system-vanilla/src/components/ui/<slug>.ts` — variantes, props, estados. Vanilla é a referência porque não tem lib headless: o que está lá é o contrato do design system, não a API do base-ui/reka-ui/bits-ui. Ler a partir dele evita que o texto descritivo nasça amarrado à nomenclatura de uma lib.
2. **Guideline de categoria** (obrigatório):

| Categoria | Arquivo |
|---|---|
| Layout | `nortear-design-system-vanilla/guidelines/04-layout-components.md` |
| Navegação | `nortear-design-system-vanilla/guidelines/05-navigation-components.md` |
| Formulário | `nortear-design-system-vanilla/guidelines/06-form-components.md` |
| Feedback | `nortear-design-system-vanilla/guidelines/07-feedback-components.md` |
| Display | `nortear-design-system-vanilla/guidelines/08-display-components.md` |
| Disclosure | `nortear-design-system-vanilla/guidelines/09-disclosure-components.md` |
| Overlay | `nortear-design-system-vanilla/guidelines/10-overlay-components.md` |

A guideline é fonte de verdade para variantes, estados, props, regras de API e padrões de a11y.

3. **Schema do JSON**: `docs/shared/skill-refs/translations-schema.md` (consultar se precisar de detalhe estrutural; para casos típicos, basta espelhar `docs/shared/content/alert/translations.json`)

---

## Artefato

Gerar `docs/shared/content/<slug>/translations.json` com a estrutura completa nos 3 idiomas. Schema completo em `docs/shared/skill-refs/translations-schema.md`.

---

## Regras de Escrita

### Proibição absoluta de emojis e ícones

**Nunca** inclua emojis (✅, ❌, ✓, ✗, ⚠️, 🎉, 💡, etc.) ou caracteres decorativos em strings do JSON. Vale para `title`, `description`, `summary`, `aiSummary`, items, labels, mensagens.

**Motivo**: ícones de certo/errado/alerta/info são renderizados pelo **código da docs page** (pills `.nds-pill` + ícones lucide). Se incluir emojis no texto, eles aparecem duplicados ao lado dos ícones do projeto.

**Exceção**: só use emojis se o usuário pedir explicitamente.

**HTML permitido**: `<strong>`, `<code>`, `<em>`, `<kbd>` — semânticas, não decoração.

### Texto descritivo API-neutro (cross-stack)

O `translations.json` é compartilhado entre React, Vue, Svelte e Vanilla. Cada stack pode usar lib diferente (base-ui, reka-ui, bits-ui, factory custom) com APIs divergentes. **Textos descritivos não devem mencionar props literais** — apenas conceitos.

| Não escreva (literal) | Escreva (conceito) |
|---|---|
| `type="single"` / `type="multiple"` | "modo único" / "modo múltiplo" |
| `collapsible` como prop | "permite fechar o item ativo" |
| `asChild` / `as-child` | "compor com elemento filho" / "render slot" |
| `onValueChange` / `onCheckedChange` | "callback de mudança" |
| `defaultValue="item-1"` | "valor inicial padrão" |
| `modelValue` / `bind:value` | "estado controlado" |

**Onde menções literais são OK**:
- Snippets de código (`structureCode`, `codeSingle`, `codeMultiple`, `extensibilityCode`, `interfaceCode`, `customizationCode`) — sintaxe real da stack (Vue/Svelte frequentemente coincidem)
- `props.table.<prop>.name` — nomeia a prop documentada
- `props.table.<prop>.type` — literal TypeScript
- `notes.itemN` para nomear a prop **da própria stack**: "A API expõe `multiple` (boolean) para o modo múltiplo."

**Nunca** compare stacks dentro do texto ("No React…, em Vue…"). Cada docs page é consumida isoladamente — o leitor do Storybook do Vue não tem contexto do React, e a comparação vaza. Divergência de API entre libs vai para `patches.md`, não para o `translations.json`. Se a diferença precisa aparecer na página, use overrides de `useTranslation` por stack.

**Auditoria**: `node scripts/audit.mjs <slug> --category quality --json` reporta violações com rule `translation_literal_prop`. Ver guideline `docs/shared/guidelines/11-consistencia-cross-stack.md` §"Textos de instrução API-neutros".

### Tom de voz

- **Técnico mas acessível** — evite jargão sem explicar
- **Direto e conciso** — frases curtas, voz ativa
- **Prescritivo** — "use X" em vez de "você pode usar X"
- **Consistente entre idiomas** — mesma informação, não tradução literal

### Regras por idioma

| Regra | pt-BR | en | es |
|---|---|---|---|
| Tratamento | Informal (você) | Impessoal (use, avoid) | Informal (tú/usted misto) |
| Termos técnicos | Manter em inglês (slot, prop, token) | Original | Manter em inglês |
| Unidades | px, rem | px, rem | px, rem |
| HTML | `<code>`, `<strong>` permitidos | idem | idem |

---

## Processo

1. **Ler em paralelo**: componente Vanilla + guideline de categoria
2. **Identificar** variantes, props, estados reais — sem inventar
3. **Gerar** JSON completo nos 3 idiomas seguindo schema
4. **Validar** chaves existem em todos os idiomas + limites de caracteres (ver schema)

---

## Checklist Final

Ver `docs/shared/skill-refs/translations-schema.md` (seção "Validações obrigatórias antes do commit").

---

## Commit

```bash
git add -A
git commit -m "skill(ux-writer): $ARGUMENTS"
```

Se nenhum arquivo foi criado/modificado, não fazer commit.
