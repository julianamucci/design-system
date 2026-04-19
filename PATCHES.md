# PATCHES — Customizações sobre os componentes shadcn/basecoat

Este arquivo registra toda divergência intencional entre os componentes deste design system e suas fontes upstream (shadcn/ui, shadcn-vue, shadcn-svelte, basecoat-css). Serve de checklist obrigatório ao atualizar dependências ou re-gerar componentes via CLI.

## Princípios

1. **Wrapper-first.** Se a customização pode viver em um wrapper sem tocar o arquivo shadcn, é wrapper. Só patche o arquivo upstream quando a mudança é estrutural (tag HTML, role, ordem de nós, comportamento interno).
2. **Todo patch é marcado no código.** Cada linha alterada recebe um comentário imediatamente acima no formato:
   ```
   // PATCH: <categoria> — <motivo curto> (ver PATCHES.md#<anchor>)
   ```
   Categorias permitidas: `a11y`, `i18n`, `theme`, `security`, `bugfix`.
3. **Todo patch é descrito aqui.** Uma entrada por patch, com diff antes/depois, justificativa e link para PR/issue upstream se houver.
4. **Revisão obrigatória no bump.** Ao atualizar `radix-ui`, `reka-ui`, `bits-ui`, `basecoat-css` ou re-gerar componentes via `shadcn@latest`, rode `npm run patches:list` e re-valide cada entrada.

## Fluxo de atualização

```bash
# 1. Antes de bumpar deps
npm run patches:list                          # inventário de patches ativos

# 2. Bump da dep ou re-geração de componente
cd design-system-react && npx shadcn@latest add <component> --overwrite

# 3. Após o bump, reavaliar patches
npm run patches:diff -- --stack react --component alert
#   → mostra o arquivo atual vs. o que shadcn geraria agora
#   → identifica patches que ainda fazem sentido, ficaram redundantes ou precisam ajuste

# 4. Para cada patch redundante (upstream incorporou a fix):
#    - remover marker no código
#    - atualizar entrada aqui com status: "RESOLVIDO UPSTREAM (v X.Y.Z)"
```

## Como adicionar uma nova entrada

1. No arquivo customizado, adicione o comentário `// PATCH: a11y — ...` imediatamente acima da linha alterada.
2. Adicione uma seção abaixo (ordem alfabética por stack/componente) copiando o template abaixo.
3. Inclua sempre: trecho antes, trecho depois, motivo, data, ref. upstream se houver.

### Template

```markdown
### <stack>/<componente> — <título curto>

- **Arquivo:** `design-system-<stack>/src/components/ui/<slug>.<ext>`
- **Categoria:** a11y | i18n | theme | security | bugfix
- **Data:** YYYY-MM-DD
- **Upstream ref:** (issue/PR/discussion ou "—")

**Antes (shadcn upstream):**
```tsx
<div className="text-sm">{children}</div>
```

**Depois (custom):**
```tsx
// PATCH: a11y — grid de basecoat-css aplica col-start-2 só em <section>
<section>{children}</section>
```

**Motivo:** (1–3 frases explicando o problema concreto e por que o wrapper não resolve)

**Verificação após bump:** (o que conferir para saber se o upstream corrigiu — ex: "conferir se `AlertDescription` já usa `<section>` no shadcn v3")
```

---

## Patches ativos

<!-- ordenar alfabeticamente por stack > componente -->

### react/alert — SVG usa `text-current` para herdar cor da variante

- **Arquivo:** `design-system-react/src/components/ui/alert.tsx`
- **Categoria:** a11y (contraste de ícone em variantes semânticas)
- **Data:** 2026-04-18
- **Upstream ref:** shadcn/ui — `new-york/alert.tsx`

**Antes (shadcn upstream):**
```tsx
const alertVariants = cva(
  "... [&>svg]:text-foreground ...",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
  }
)
```

**Depois (custom):**
```tsx
// PATCH: a11y — ...
const alertVariants = cva(
  "... [&>svg]:text-current ...",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive",
      },
    },
  }
)
```

**Motivo:** o upstream trava o SVG em `text-foreground`, o que quebra variantes aplicadas via `className` (ex: `text-success`, `text-warning`). Usando `text-current`, o ícone herda a cor do container — cobrindo default, destructive e qualquer variante customizada. A regra específica `[&>svg]:text-destructive` fica redundante e foi removida.

**Verificação após bump:** abrir o Storybook em `ui-alert-variantes--success` e `--warning`; ícone deve estar verde/amarelo, não cinza. Se o upstream (shadcn v3+) já usar `text-current`, remover marker e marcar entrada como RESOLVIDO UPSTREAM.

### basecoat/alert — descrição como `<section>` para grid do basecoat-css

- **Arquivo:** `design-system-basecoat/src/components/ui/alert.ts`
- **Categoria:** a11y (layout legível)
- **Data:** 2026-04-18
- **Upstream ref:** `basecoat-css` dist/basecoat.css L153–L184

**Antes (factory original):**
```ts
export function createAlertDescription(options: AlertDescriptionOptions = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = 'text-sm [&_p]:leading-relaxed';
  // ...
  return el;
}
```

**Depois (custom):**
```ts
// PATCH: a11y — basecoat-css usa `> section { col-start-2 }`. Com <div>, a descrição
// cai na col 1 (16px, onde o ícone fica) e o texto quebra letra a letra.
export function createAlertDescription(options: AlertDescriptionOptions = {}): HTMLElement {
  const el = document.createElement('section');
  // ...
  return el;
}
```

**Motivo:** `basecoat-css` define `.alert { display: grid; grid-cols: [ícone 16px][1fr] }` e aplica `col-start-2` via seletor `> section` (e `> h5`). A factory original retornava `<div>`, então a descrição ficava fora do selector e renderizava na coluna estreita do ícone, quebrando visualmente quando há SVG presente.

**Verificação após bump:** inspecionar `node_modules/basecoat-css/dist/basecoat.css` — se o seletor `> section` for substituído por `> div` ou `[data-slot="alert-description"]`, ajustar a factory conforme o novo contrato.
