# translations.json — Schema completo

Referência usada por `/ux-writer` e validada pelas dev-skills. **Leia apenas se precisar do schema completo** — para casos típicos, use `docs/shared/content/alert/translations.json` como exemplo direto.

---

## Estrutura obrigatória (todas as chaves nos 3 idiomas: pt-BR, en, es)

```json
{
  "pt-BR": {
    "title": "NomeDoComponente",
    "category": "Categoria",
    "type": "Componente",
    "description": "Descrição concisa (≤155 chars) para SEO",
    "seo": {
      "title": "NomeDoComponente — Categoria · Design System",
      "description": "Documentação do NomeDoComponente: variantes, estados, acessibilidade WCAG. (≤155 chars)",
      "aiSummary": "Frase específica descrevendo o componente e seus recursos principais.",
      "aiEntities": "ComponenteName, React, Vue, Svelte, Vanilla, WCAG 2.2"
    },
    "demonstration": {
      "title": "Demonstração Padrão",
      "labels": { /* labels dos exemplos interativos */ }
    },
    "anatomy": {
      "title": "Anatomia",
      "item1": "<strong>Parte</strong> — descrição funcional",
      "item2": "...",
      "structureLabel": "Estrutura básica:",
      "structureCode": { "react": "…", "vue": "…" }   // uma variante por stack — ver seção abaixo
    },
    "usage": {
      "title": "Quando e Como Usar",
      "guidelines": { "title": "...", "item1": "...", "itemN": "..." },
      "scenarios": {
        "title": "Tabela de Cenários",
        "cols": { "scenario": "...", "use": "...", "alternative": "..." },
        "item1": { "s": "...", "u": "...", "a": "..." }
      },
      "uxWriting": {
        "title": "UX Writing",
        "table": {
          "element": "...", "rules": "...", "correct": "...", "avoid": "...",
          "<itemKey>": { "name": "...", "format": "...", "good": "...", "bad": "..." }
        }
      },
      "do": { "title": "Use quando", "item1": "...", "itemN": "..." },
      "dont": { "title": "Não use quando", "item1": "...", "itemN": "..." }
    },
    "doDont": {
      "title": "Boas práticas",
      "pair1": { "do": "Descrição do uso correto.", "dont": "Descrição do uso incorreto." },
      "pair2": { "do": "...", "dont": "..." }
    },
    "import": { "title": "Importação" },
    // O que entra em cada uma das três seções: guideline 14-taxonomia-secoes.md.
    // Resumo: Estado = alcançável sem mudar código; Variante = o autor escolhe,
    // sem nada de fora; Composição = aparece junto de algo que não é do
    // componente. Não repita entre seções — 22% desta seção era duplicata.
    "variants": {
      "title": "Variantes",                    // título livre ("Modos", "Linguagens"…)
      // Duas formas convivem. String é o legado (42 componentes) e só carrega a
      // descrição — o rótulo do card fica hardcoded na docs page, fora do i18n.
      // Objeto é a forma preferida: rotula e explica quando usar, nos 3 idiomas.
      // Componente novo usa objeto.
      "items": {
        "<keyLegado>": "Descrição da variante",
        "<key>": { "name": "...", "description": "...", "use": "..." }
      },
      "sizes": { "<key>": "Descrição do tamanho" },
      "compositionsTitle": "Composições",
      // Toda composição NOMEIA na description com o que o componente é combinado.
      "compositions": { "<key>": { "name": "...", "description": "...", "use": "..." } }
    },
    "states": {
      "title": "Estados",
      "cols": { "state": "Estado", "trigger": "Como ativar", "behavior": "Comportamento" },
      // Sempre as 3 chaves. Sem `trigger`, a docs page hardcoda a coluna e o
      // texto some em en/es.
      "<key>": { "label": "...", "trigger": "...", "behavior": "..." }
    },
    "props": {
      "title": "Propriedades",
      "table": {
        "prop": "Prop", "type": "Tipo", "default": "Padrão",
        "required": "Obrigatório", "description": "Descrição",
        "<propName>": {
          "type": "string", "default": "—", "required": "Não",
          "description": "Descrição da prop."
        }
      },
      "extensibilityTitle": "Extensibilidade",
      "extensibilityCode": { "react": "…" }   // uma variante por stack
    },
    "tokens": {
      "title": "Design Tokens",
      "table": {
        "token": "Token", "class": "Classe", "part": "Aplicação",
        "<tokenKey>": { "class": "bg-popover", "part": "Descrição da aplicação" }
      },
      "customizationTitle": "Customização",
      "customizationCode": { "web": "/* CSS de customização */" }
    },
    "accessibility": {
      "title": "Acessibilidade",
      "summary": "Resumo WCAG (critérios atendidos)",
      "items": { "item1": "...", "itemN": "..." },
      "keyboard": {
        "title": "Navegação por Teclado",
        "<keyName>": "Descrição do que faz a tecla"
      },
      "aria": { "title": "Atributos ARIA", "<key>": "..." },
      "screenReader": { "title": "Leitor de Tela", "<key>": "..." }
    },
    "related": {
      "title": "Componentes Relacionados",
      "items": { "<key>": { "name": "Nome", "description": "..." } }
    },
    "notes": {
      "title": "Notas de Implementação",
      "item1": "<strong>Lib upstream</strong>: ...",
      "itemN": "..."
    },
    "analytics": {
      "title": "Analytics",
      "description": "Eventos relevantes do componente."
    },
    "testes": {
      "title": "Critérios de Teste",
      "functional": {
        "title": "Comportamento Funcional",
        "description": "...",
        "item1": { "action": "...", "result": "...", "priority": "high" }
      },
      "accessibility": {
        "title": "Acessibilidade Verificável",
        "description": "...",
        "item1": "Sem violações reportadas pelo axe-core no estado padrão"
      },
      "visual": {
        "title": "Regressão Visual",
        "description": "...",
        "required": "Obrigatório",
        "item1": { "story": "Default", "priority": "high" }
      }
    },
    "nav": {
      "overview": "Visão Geral",
      "demonstration": "Demonstração",
      "anatomy": "Anatomia",
      "usage": "Quando Usar",
      "doDont": "Boas práticas",
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

---

## Notas críticas sobre estrutura

- **`seo.title`** formato: `"{Componente} — {Categoria} · Design System"` (≤60 chars)
- **`doDont`** é seção de primeiro nível — **separada** de `usage.do`/`usage.dont`. Contém pares de previews visuais.
- **`testes.functional.priority`**: `"high"` ou `"medium"` — **NUNCA** localizar, sempre string literal em inglês.
- **`anatomy.structureCode`**: snippet multiline com `\n` mostrando composição. As dev-skills lerão isso direto via `t('anatomy.structureCode')` — **sem** hardcode duplicado nas docs pages.

### Chaves de código (`*Code`) — uma variante por stack

Toda chave terminada em `Code` aceita duas formas:

```jsonc
// string — mesmo snippet em qualquer stack
"structureCode": "npm i @nortear/ds"

// objeto — um snippet por stack
"structureCode": {
  "react":   "<Button>Salvar</Button>",
  "vue":     "<Button>Salvar</Button>",
  "svelte":  "<Button>Salvar</Button>",
  "vanilla": "<button class=\"nds-button\">Salvar</button>",
  "flutter": "NdsButton(child: Text('Salvar'))",
  "web":     "/* CSS — cobre os 4 stacks de navegador de uma vez */"
}
```

Chaves aceitas: `react`, `vue`, `svelte`, `vanilla`, `flutter` e o grupo `web`
(= os quatro de navegador). A lista canônica vive em
`docs/shared/primitives/code-variants.ts`.

Regras ao escrever:

- **CSS vai em `web`**, nunca replicado nos quatro stacks.
- **Markup e chamada de API vão no stack específico** — JSX em `react`,
  `<template>` em `vue`, factory `createX()` em `vanilla`, Dart em `flutter`.
- **Não misture CSS e markup no mesmo snippet.** Sem variante possível, o
  snippet fica preso na forma de string e serve o stack errado a todo mundo.
- **Nunca coloque snippet em `override` de `useTranslation`** — o código some do
  conteúdo compartilhado. Override é para nome de prop e rótulo.

Sem variante para o stack que lê, o fallback é `web` → `react` → primeira
definida. Ninguém vê bloco vazio, mas a lacuna é contada por
`node scripts/audit-translation-literals.mjs --only cobertura`.

---

## Validações obrigatórias antes do commit

- [ ] Todas as chaves existem em pt-BR, en e es (sem chave faltante)
- [ ] `seo.title` ≤60 chars e `seo.description` ≤155 chars nos 3 idiomas
- [ ] `testes.functional.priority` usa `"high"` / `"medium"` — nunca localizado
- [ ] Seção `doDont` presente como nível 1 (separada de `usage.do`/`usage.dont`)
- [ ] Seção `accessibility` completa (keyboard, aria, screenReader)
- [ ] Seção `nav` com todas as labels de navegação
- [ ] Sem traduções literais — cada idioma soa natural
- [ ] Termos técnicos mantidos em inglês nos 3 idiomas
- [ ] **Zero emojis** ou ícones decorativos em qualquer string

---

## Limites de caracteres por campo

| Campo | Limite |
|---|---|
| `title` | ≤30 chars |
| `seo.title` | ≤60 chars |
| `description` (SEO) | ≤155 chars |
| `anatomy.itemN` | 1 frase, ≤100 chars sem HTML |
| `guidelines.itemN` | 1 frase, ≤120 chars |
| `do.itemN` / `dont.itemN` | 1 frase, ≤80 chars |
| `scenarios.itemN` | 3 colunas, ≤50 chars cada |
| Story descriptions | 1-2 frases, ≤200 chars |
