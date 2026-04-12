# Estrutura Padronizada de Documentação de Componentes — Regras Obrigatórias

## Visão Geral

Este arquivo define a estrutura obrigatória para documentar componentes no Design System. Ela se divide em duas partes:

1. **ComponentDocs** — o arquivo TSX/Vue com a documentação visual e textual do componente.
2. **Stories** — os arquivos Storybook que expõem o componente para exploração, testes e catálogo visual.

Ambas as partes seguem uma organização padronizada de **14 seções** (agrupadas em 4 blocos) e **5 grupos de stories**.

**Referência de implementação:** `ButtonDocs.tsx` e `button*.stories.tsx`.

---

## Parte 1 — ComponentDocs (arquivo de documentação)

### Arquitetura e Layout

O ComponentDocs é um componente React/Vue que renderiza a documentação completa. Ele é referenciado no Storybook via `parameters.docs.page` no arquivo principal de stories.

#### Layout obrigatório: Header + Sidebar + Conteúdo

```tsx
export function NomeComponenteDocs() {
  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* ── Header (Hero) ──────────────────────────────────────────── */}
      <header className="ds-docs mb-12 border-b pb-8 border-border/50">
        ...
      </header>

      {/* ── Layout: sidebar + conteúdo ─────────────────────────────── */}
      <div className="flex gap-16 items-start">
        <ComponentDocsSidebar />
        <div className="ds-docs flex-1 space-y-12">
          {/* Seções 2–14 aqui */}
        </div>
      </div>

    </div>
  );
}
```

**Regras de layout:**
- Container raiz: `p-8 max-w-5xl mx-auto`
- Header separado do conteúdo com `border-b` e `mb-12`
- Layout de duas colunas: sidebar `sticky` à esquerda + conteúdo `flex-1` à direita
- Gap entre colunas: `gap-16`
- Conteúdo envolvido na classe `.ds-docs` para neutralizar resets de CSS do Storybook

---

### Classe `.ds-docs` — Blindagem contra Storybook

O Storybook injeta CSS-in-JS unlayered com especificidade `(0,1,0)` que reseta margens, fontes e listas. A classe `.ds-docs` no `globals.css` restaura os utilitários do Tailwind com especificidade `(0,2,N)`.

**Regras:**
- O wrapper `.ds-docs` deve envolver o `<header>` e o container de conteúdo `flex-1`
- Toda seção que requeira margens ou fontes controladas deve estar dentro de `.ds-docs`
- As regras CSS estão no bloco unlayered no final do `globals.css`

---

### SEO e GEO (Guideline 20) — useEffect obrigatório

Todo ComponentDocs **deve** incluir um `useEffect` que injeta metadados SEO e GEO dinamicamente na janela pai (manager do Storybook). Isso é necessário porque o componente roda dentro de um iframe.

```tsx
useEffect(() => {
  const isIframe = window.self !== window.top;
  const targetDoc = isIframe ? window.parent.document : document;
  const targetWin = isIframe ? window.parent : window;

  // 1. Title
  const oldTitle = targetDoc.title;
  targetDoc.title = "NomeComponente — Categoria · Design System Personalizado";

  // 2. Meta description (criar se não existir)
  let metaDesc = targetDoc.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = targetDoc.createElement("meta");
    metaDesc.setAttribute("name", "description");
    targetDoc.head.appendChild(metaDesc);
  }
  const oldDesc = metaDesc.getAttribute("content");
  metaDesc.setAttribute("content", "Descrição do componente...");

  // 3. GEO + Open Graph + Twitter (array de metatags)
  const metadata = [
    { name: "ai:summary", content: "..." },
    { name: "ai:entities", content: "..." },
    { name: "ai:intent", content: "informational" },
    { property: "og:title", content: "..." },
    { property: "og:description", content: "..." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: targetWin.location.href },
    { property: "og:site_name", content: "Design System Personalizado" },
    { property: "og:locale", content: "pt_BR" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "..." },
    { name: "twitter:description", content: "..." }
  ];

  // 4. Canonical URL
  // 5. JSON-LD (TechArticle + SoftwareSourceCode)
  // 6. lang="pt-BR" no <html>

  // Cleanup: restaura tudo ao desmontar
  return () => { ... };
}, []);
```

---

### Navegação Interna (Sidebar)

A navegação é uma sidebar vertical `sticky` que usa `IntersectionObserver` para destacar a seção visível (scroll-spy).

```tsx
const navGroups = [
  {
    label: "Visão Geral",
    sections: [
      { id: "demonstracao", label: "Demonstração" },
      { id: "anatomia",     label: "Anatomia"     },
      { id: "quando-usar",  label: "Quando Usar"  },
      { id: "do-dont",      label: "Do & Don't"   },
    ],
  },
  {
    label: "Referência Técnica",
    sections: [
      { id: "importacao",   label: "Importação"   },
      { id: "exemplos",     label: "Exemplos"     },
      { id: "variantes",    label: "Variantes"    },
      { id: "estados",      label: "Estados"      },
      { id: "propriedades", label: "Propriedades" },
      { id: "tokens",       label: "Tokens"       },
    ],
  },
  {
    label: "Contexto",
    sections: [
      { id: "acessibilidade", label: "Acessibilidade" },
      { id: "relacionados",   label: "Relacionados"   },
      { id: "notas",          label: "Notas"          },
    ],
  },
  {
    label: "Qualidade",
    sections: [
      { id: "testes", label: "Testes" },
    ],
  },
] as const;
```

**Regras da sidebar:**
- Container: `sticky top-8 w-52 shrink-0 self-start space-y-5`
- Labels de grupo: `text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground`
- Items: `<ul className="list-none">` com `<button>` para cada seção
- Seção ativa: `font-semibold text-foreground bg-muted`
- Seção inativa: `text-muted-foreground hover:text-foreground hover:bg-muted/50`
- `aria-current="location"` na seção ativa
- `aria-label` no `<nav>` raiz
- **Seções opcionais:** remover do array `navGroups` qualquer seção não aplicável ao componente

---

### Template das 14 Seções

As seções estão organizadas em 4 blocos com propósitos e públicos distintos:

- **Bloco 1 — Visão Geral** (seções 1–5): para quem está avaliando o componente.
- **Bloco 2 — Referência Técnica** (seções 6–11): para quem vai implementar.
- **Bloco 3 — Contexto** (seções 12–14): acessibilidade, componentes relacionados e boas práticas.
- **Bloco 4 — Qualidade** (seção 15): critérios de teste para dev e QA.

---

#### Seção 1 — Header (Hero)

O header identifica o componente. Não possui `id` — é o topo da página.

```tsx
<header className="ds-docs mb-12 border-b pb-8 border-border/50">
  {/* Badges de categoria */}
  <div className="flex items-center gap-2 mb-4">
    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
      {/* Categoria: Layout | Navigation | Form | Feedback | Display | Overlay */}
    </Badge>
    <Badge variant="outline" className="text-muted-foreground font-normal px-2 py-0">
      Componente
    </Badge>
  </div>

  {/* Título + descrição */}
  <div className="space-y-4">
    <h1 className="text-4xl font-bold tracking-tight text-foreground">
      NomeComponente
    </h1>
    <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
      Descrição de uma linha sobre o propósito do componente.
    </p>
  </div>

  {/* Comando de instalação Shadcn */}
  <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground/80">
    <span className="flex items-center gap-1.5">
      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">
        npx shadcn@latest add nome-componente
      </code>
    </span>
  </div>
</header>
```

**Regras do Header:**
- Badge de categoria: `bg-primary/5 text-primary` (sempre a primeira)
- Badge de tipo: `text-muted-foreground font-normal` (segunda)
- Título: `text-4xl font-bold tracking-tight`
- Descrição: `text-lg max-w-3xl leading-relaxed`
- Comando Shadcn: em `<code>` com fundo `bg-muted` e borda sutil

---

#### Seção 2 — Demonstração Padrão

```tsx
<section id="demonstracao">
  <h2 className="text-xl font-semibold mb-4">Demonstração Padrão</h2>
  <ComponentDemo>
    {/* Renderizar o componente nos cenários mais comuns */}
  </ComponentDemo>
</section>
```

---

#### Seção 3 — Anatomia

Diagrama ou tabela mostrando as partes internas do componente (root, trigger, content, etc).

---

#### Seção 4 — Quando e Como Usar

Contém dois subtópicos obrigatórios:

**4a. Tabela de cenários** — Colunas: Cenário | Usar este componente? | Alternativa.

**4b. ✍️ UX Writing** — Tabela de regras de redação para os textos do componente. Obrigatória para todo componente que exibe texto ao usuário (labels, títulos, mensagens, placeholders).

```tsx
<div className="space-y-8 w-full">

  {/* 4a — Tabela de cenários */}
  <div className="w-full overflow-x-auto">
    <table className="w-full border-collapse text-sm">
      {/* Cenário | Usar? | Alternativa */}
    </table>
  </div>

  {/* 4b — UX Writing */}
  <div className="space-y-4">
    <h4 className="font-medium text-sm">✍️ UX Writing</h4>
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-3 bg-muted/50 border-r border-border">Elemento</th>
            <th className="text-left p-3 bg-muted/50 border-r border-border">Regras de formato</th>
            <th className="text-left p-3 bg-muted/50 border-r border-border">✅ Correto</th>
            <th className="text-left p-3 bg-muted/50">❌ Evitar</th>
          </tr>
        </thead>
        <tbody>
          {/* Listar cada elemento textual do componente:
              - Botões: label, tooltip
              - Diálogos: título, descrição, action, cancel
              - Forms: label, placeholder, erro, hint
              - Feedback: título, mensagem
          */}
        </tbody>
      </table>
    </div>
  </div>

</div>
```

**Regras de preenchimento do UX Writing:**
- Uma linha por elemento textual do componente (ex: Label, Título, Descrição, Botão Action)
- Coluna "Regras": tom, comprimento, capitalização, pontuação
- Coluna "Correto": 2-3 exemplos reais em pt-BR
- Coluna "Evitar": 2-3 contra-exemplos comuns
- Para componentes sem texto visível (ex: Separator, AspectRatio): omitir o subtópico


#### Seção 5 — Do & Don't

Grid de 2 colunas comparando uso correto vs incorreto.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="text-green-600 font-bold text-sm">✓</span>
      <span className="text-sm font-medium text-green-600">Faça isso</span>
    </div>
    <div className="border border-green-200 rounded-md p-4 bg-green-50">
      {/* Exemplo correto */}
    </div>
    <p className="text-sm text-muted-foreground">Explicação.</p>
  </div>
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="text-red-600 font-bold text-sm">✗</span>
      <span className="text-sm font-medium text-red-600">Não faça isso</span>
    </div>
    <div className="border border-red-200 rounded-md p-4 bg-red-50">
      {/* Exemplo incorreto */}
    </div>
    <p className="text-sm text-muted-foreground">Explicação.</p>
  </div>
</div>
```

---

#### Seção 6 — Importação

Bloco de código mostrando a importação correta.

---

#### Seção 7 — Exemplos de Código

Código copiável para 2-4 cenários de uso recorrentes.

---

#### Seção 8 — Variantes e Tamanhos

Layout de **grid de cards** — cada card mostra o componente centralizado + metadado técnico abaixo.

```tsx
<section id="variantes">
  <h2 className="text-xl font-semibold mb-6">Variantes e Tamanhos</h2>

  <div className="ds-docs space-y-10 w-full">
    {/* Subseção: título com border-l */}
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-6 px-1 border-l-2 border-primary/20 pl-3">
        Variantes Disponíveis
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {variantes.map(({ variant, label, desc }) => (
          <div key={variant} className="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-colors hover:border-border">
            {/* Área de preview */}
            <div className="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
              <Componente variant={variant} />
            </div>
            {/* Área de metadados */}
            <div className="p-4 border-t border-border/40 bg-muted/10 space-y-1">
              <p className="text-[11px] font-mono text-primary font-bold tracking-tight px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">
                {label}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Repetir para tamanhos com lg:grid-cols-4 */}
  </div>
</section>
```

**Regras dos cards de variante:**
- Grid responsivo: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (variantes) ou `lg:grid-cols-4` (tamanhos)
- Área de preview: `p-8 bg-muted/5 min-h-[140px]` com componente centralizado
- Área de metadados: label em `font-mono text-primary` + descrição em `text-muted-foreground`
- Subtítulos de subseção: `text-sm font-semibold border-l-2 border-primary/20 pl-3` (**sem** caixa alta)
- O wrapper `ds-docs space-y-10` é obrigatório para espaçamento correto no Storybook

---

#### Seção 9 — Estados

Tabela com colunas: Estado | Visual | Como ativar.

---

#### Seção 10 — Propriedades

Tabela de API com colunas: Prop | Tipo | Padrão | Descrição.

---

#### Seção 11 — Design Tokens

Tabela com colunas: Token | Valor Padrão | Contexto.

---

#### Seção 12 — Acessibilidade

Lista de critérios WCAG aplicáveis com `<ul className="list-disc">`.

---

#### Seção 13 — Componentes Relacionados

Lista de componentes que complementam ou substituem o componente atual.

---

#### Seção 14 — Notas e Dicas

Texto corrido com observações, boas práticas e alertas sobre gotchas.

---

#### Seção 15 — Critérios de Teste

Tabela dividida em dois blocos:

1. **Comportamento Funcional** — tabela com colunas: Ação do usuário | Resultado esperado | Prioridade
2. **Acessibilidade Verificável** — lista de critérios para ferramentas automatizadas (jest-axe, axe-core)

**Importante:** os critérios documentados aqui devem estar cobertos pela `play` function do Playground no Storybook (veja Parte 2).

---

## Parte 2 — Stories (arquivos Storybook)

### Estrutura de arquivos obrigatória

Cada componente deve ter **5 arquivos de stories**, organizados em subgrupos na sidebar:

```
src/components/ui/
  ├── nome-componente.tsx                      (componente)
  ├── nome-componente.stories.tsx              (meta + Playground)
  ├── nome-componente-variantes.stories.tsx     (variantes visuais)
  ├── nome-componente-tamanhos.stories.tsx      (tamanhos)
  ├── nome-componente-composicoes.stories.tsx   (composições: ícones, asChild, slots)
  └── nome-componente-estados.stories.tsx       (estados: disabled, loading)
```

**Resultado na sidebar do Storybook:**

```
UI / NomeComponente
  ├── Docs                    ← página de documentação completa
  ├── Playground              ← sandbox com todos os controles + play function
  ├── Variantes/
  │   ├── Default
  │   ├── Secondary
  │   └── ...
  ├── Tamanhos/
  │   ├── Small
  │   ├── Default
  │   └── ...
  ├── Composições/
  │   ├── Com ícone
  │   ├── Como link (asChild)
  │   └── ...
  └── Estados/
      ├── Disabled
      └── Loading
```

---

### Arquivo Principal — `nome-componente.stories.tsx`

Este arquivo contém:
- O `meta` compartilhado com `tags: ["autodocs"]` e `parameters.docs.page: NomeComponenteDocs`
- Todos os `argTypes` com controles e descrições
- `onClick: { action: "clicked" }` em argTypes + `onClick: fn()` em args
- A story **Playground** com a `play` function que cobre os critérios de teste documentados

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "@storybook/test";
import { NomeComponente } from "./nome-componente";
import { NomeComponenteDocs } from "@/components/docs/NomeComponenteDocs";

const meta = {
  title: "UI/NomeComponente",
  component: NomeComponente,
  tags: ["autodocs"],
  parameters: {
    docs: { page: NomeComponenteDocs },
  },
  argTypes: {
    // Todos os controles com description em pt-BR
    onClick: { action: "clicked" },
  },
  args: {
    // Valores padrão
    onClick: fn(),
  },
} satisfies Meta<typeof NomeComponente>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole("...");

    // Os steps devem espelhar os critérios da Seção 15 (Testes) do ComponentDocs.
    // Exemplo para um componente interativo:

    await step("Clica no elemento habilitado", async () => {
      await userEvent.click(element);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });

    await step("Verifica que o elemento continua habilitado", async () => {
      await expect(element).toBeEnabled();
    });

    await step("Elemento recebe foco → focus-visible disponível", async () => {
      element.focus();
      await expect(element).toHaveFocus();
    });

    await step("Enter com foco dispara onClick", async () => {
      element.focus();
      const countBefore = (args.onClick as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.keyboard("{Enter}");
      await expect(args.onClick).toHaveBeenCalledTimes(countBefore + 1);
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Descrição dos critérios cobertos pela play function.",
      },
    },
  },
};
```

**Regras da play function:**
- Usar `button.focus()` em vez de `userEvent.tab()` — o tab navega por elementos internos do iframe do Storybook e produz falsos negativos
- Cada `step` deve ter nome descritivo em pt-BR
- Os steps devem corresponder 1:1 aos critérios da Seção 15 do ComponentDocs
- Para testes de clique: usar `args.onClick` (que é `fn()`) para contar chamadas
- Para componentes sem interação de clique (ex: Badge, Separator): a play function pode ser omitida

---

### Arquivo de Variantes — `nome-componente-variantes.stories.tsx`

```tsx
const meta = {
  title: "UI/NomeComponente/Variantes",
  component: NomeComponente,
  argTypes: {
    onClick: { action: "clicked" },
  },
  args: { /* defaults */ },
} satisfies Meta<typeof NomeComponente>;

// Uma story por variante visual
export const Default: Story = {
  args: { variant: "default" },
  parameters: {
    docs: {
      description: {
        story: "Descrição de quando usar esta variante.",
      },
    },
  },
};
```

---

### Arquivo de Tamanhos — `nome-componente-tamanhos.stories.tsx`

Mesmo modelo, com `title: "UI/NomeComponente/Tamanhos"`.

---

### Arquivo de Composições — `nome-componente-composicoes.stories.tsx`

Para stories que usam `render` customizado (ícones, asChild, slots compostos).

```tsx
const meta = {
  title: "UI/NomeComponente/Composições",
  // ...
};

export const WithIconLeading: Story = {
  name: "Ícone à esquerda",
  render: (args) => (
    <NomeComponente {...args}>
      <IconeExemplo className="h-4 w-4" />
      Label
    </NomeComponente>
  ),
};
```

**Regra:** usar `name` em pt-BR para stories de composição.

---

### Arquivo de Estados — `nome-componente-estados.stories.tsx`

Para estados visuais como `disabled` e `loading`.

```tsx
const meta = {
  title: "UI/NomeComponente/Estados",
  // ...
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  name: "Loading",
  render: (args) => (
    <NomeComponente {...args} disabled>
      <Loader2 className="h-4 w-4 animate-spin" />
      Aguarde…
    </NomeComponente>
  ),
};
```

**Nota sobre Loading:** O Shadcn/UI não possui prop `loading` nativa. O padrão é combinar `disabled` + ícone `Loader2` com `animate-spin`.

---

## Regras Gerais

### Convenções de nomenclatura

| Item | Convenção | Exemplo |
|---|---|---|
| Arquivo docs | `NomeComponenteDocs.tsx` | `ButtonDocs.tsx` |
| Arquivo stories principal | `nome-componente.stories.tsx` | `button.stories.tsx` |
| Arquivos stories secundários | `nome-componente-grupo.stories.tsx` | `button-variantes.stories.tsx` |
| Title do meta principal | `"UI/NomeComponente"` | `"UI/Button"` |
| Title dos subgrupos | `"UI/NomeComponente/Grupo"` | `"UI/Button/Variantes"` |

### Checklist de implementação

Para cada componente novo, verificar:

- [ ] ComponentDocs criado com as 14 seções aplicáveis
- [ ] Header com badges, h1, descrição e comando Shadcn
- [ ] Sidebar de navegação com navGroups correspondentes
- [ ] useEffect para SEO/GEO com target no parent document
- [ ] Wrapper `.ds-docs` aplicado no header e no conteúdo
- [ ] 5 arquivos de stories criados (ou menos se não aplicável)
- [ ] Playground com play function alinhada à Seção 15
- [ ] `onClick: fn()` no meta args e `{ action: "clicked" }` no argTypes
- [ ] Todos os argTypes com description em pt-BR
- [ ] Stories de composição com `name` em pt-BR
- [ ] Estado Loading documentado (se o componente for interativo)

### Componentes sem interação

Para componentes estáticos (Badge, Separator, Avatar):
- Omitir grupos que não se aplicam (Composições, Estados)
- Omitir play function do Playground
- Remover seções da sidebar que foram omitidas
- Manter no mínimo: Header + Demonstração + Variantes + Propriedades + Acessibilidade