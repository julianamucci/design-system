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
4. **Revisão obrigatória no bump.** Ao atualizar `@base-ui/react`, `reka-ui`, `bits-ui`, `basecoat-css` ou re-gerar componentes via `shadcn@latest`, rode `npm run patches:list` e re-valide cada entrada.

> **Histórico de stack de primitivas (React):**
> - Até 2026-04-21: `@radix-ui/react-*` individuais (modo legado)
> - De 2026-04-21 em diante: `@base-ui/react` (registry `base-nova` do shadcn). **Zero deps `@radix-ui/*`** — `form.tsx`, `toast.tsx`, `toaster.tsx` e `use-toast.ts` foram deletados (órfãos; App.tsx já usava `sonner` há algum tempo).
>
> **Breaking changes de comportamento cross-stack pós-migração nova (2026-04-21):**
> - **React (base-ui):** `asChild` prop removido — usar `render={<Component />}` prop. `Accordion` usa `aria-disabled` em vez de atributo `disabled` nativo.
> - **Svelte (bits-ui 2.18):** `AlertDialogAction` **não fecha automaticamente** o dialog — consumidor precisa fazer `open = false` no handler. `Accordion` não aceita mais `defaultValue` — usar `bind:value`.
> - **Vue (reka-ui 2.9.6):** `AvatarImage` força `role="img"` no `<img>` — alt vazio (`alt=""`) causa violação `aria-allowed-role`. Sempre usar alt descritivo.
> - **Todas stacks:** variante `destructive` agora é soft (`bg-destructive/10 text-destructive`) em vez de sólida. Mudança visual esperada.

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

### button — dimensões tokenizadas (React/Vue/Svelte) {#button-dimension-tokens}

- **Status:** PATCH ATIVO nas 3 stacks que suportam Tailwind v4 arbitrary values com custom properties (`h-(--var)`).
- **Arquivos:**
  - `design-system-react/src/components/ui/button.tsx`
  - `design-system-vue/src/components/ui/button/index.ts`
  - `design-system-svelte/src/components/ui/button/button.svelte`
  - (`design-system-basecoat/src/components/ui/button.ts` — NÃO patchado: Basecoat usa classes `.btn` do pacote `basecoat-css`, não Tailwind)
- **Categoria:** theme (multi-tema com densidades distintas)
- **Data:** 2026-04-21
- **Upstream ref:** shadcn/ui (`base-nova`), shadcn-vue (`reka-nova`), shadcn-svelte (`nova`) — todos hardcodam `h-8`, `h-7`, `h-9`, `size-8` etc. no `cva()`

**Antes (upstream):**
```ts
size: {
  default: "h-8 gap-1.5 px-2.5 ...",
  xs:      "h-6 ...",
  sm:      "h-7 ...",
  lg:      "h-9 ...",
  icon:    "size-8",
  // ...
}
```

**Depois (custom):**
```ts
// PATCH: theme — alturas via tokens (--height-*) ...
size: {
  default: "h-(--height-default) gap-1.5 px-2.5 ...",
  xs:      "h-(--height-xs) ...",
  sm:      "h-(--height-sm) ...",
  lg:      "h-(--height-lg) ...",
  icon:    "size-(--size-default)",
  // ...
}
```

**Motivo:** os 7 temas do design system (Nova, Vega, Maia, Lyra, Mira, Luma, Sera) replicam os 7 styles do shadcn — cada um com **densidade visual distinta**. Sem tokenizar altura/size no componente, seria impossível fazer Vega mostrar Button h-10 (clássico) e Lyra mostrar h-7 (brutalista compacto) a partir do mesmo componente React/Vue/Svelte. A abordagem via `h-(--height-default)` usa o shortcut de Tailwind v4.1+ para consumir custom properties CSS — zero runtime cost, zero dependência JS.

**Verificação após bump:** conferir se o registry do shadcn passa a usar tokens CSS nativos (improvável em curto prazo; shadcn mantém hardcoded para simplicidade de exemplo). Re-aplicar o patch se `shadcn add button` sobrescrever.

### react/alert — SVG usa `text-current` para herdar cor da variante — ✅ RESOLVIDO UPSTREAM (2026-04-21)

- **Status:** Absorvido pelo upstream no registry `radix-nova`, mantido no `base-nova`. O Alert atual usa `*:[svg]:text-current` e `bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90`. Patch não é mais necessário — marker removido do código.
- **Arquivo:** `design-system-react/src/components/ui/alert.tsx`
- **Categoria:** a11y (contraste de ícone em variantes semânticas)
- **Data original:** 2026-04-18
- **Data resolução:** 2026-04-21 (migração shadcn `new-york` → `radix-nova`; consolidada em `base-nova` no mesmo dia)
- **Upstream ref:** shadcn/ui — `base-nova/alert.tsx`

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

### avatar — `object-cover` na imagem (4 stacks) {#avatar-object-cover} — ⚠️ PARCIALMENTE RESOLVIDO UPSTREAM (2026-04-21)

- **Status:** React (`base-nova`), Vue (`reka-nova`) e Svelte (`nova`) absorveram o patch — AvatarImage agora inclui `object-cover` por padrão. Basecoat **ainda precisa do patch** — marker permanece nesse único arquivo.
- **Arquivos:**
  - ~~`design-system-react/src/components/ui/avatar.tsx` (AvatarImage)~~ ✅ absorvido upstream (radix-nova → base-nova)
  - ~~`design-system-vue/src/components/ui/avatar/AvatarImage.vue`~~ ✅ absorvido upstream (reka-nova)
  - ~~`design-system-svelte/src/components/ui/avatar/avatar-image.svelte`~~ ✅ absorvido upstream (shadcn-svelte nova)
  - `design-system-basecoat/src/components/ui/avatar.ts` (`createAvatarImage`) — PATCH ATIVO
- **Categoria:** bugfix (distorção visual)
- **Data original:** 2026-04-21
- **Data resolução React:** 2026-04-21 (migração shadcn `new-york` → `radix-nova` → `base-nova`)
- **Data resolução Vue:** 2026-04-21 (migração shadcn-vue `new-york` → `reka-nova` + bump 2.9.5 → 2.9.6)
- **Data resolução Svelte:** 2026-04-21 (migração shadcn-svelte `new-york` → `nova` + bump bits-ui 2.17.3 → 2.18.0)
- **Upstream ref:** shadcn/ui (base-nova), shadcn-vue (reka-nova) e shadcn-svelte (nova) incluem `object-cover`. basecoat-css — ainda não.

**Antes (upstream):**
```tsx
className={cn("aspect-square h-full w-full", className)}
```

**Depois (custom):**
```tsx
// PATCH: bugfix — object-cover evita distorção de imagens não-quadradas em container circular (ver PATCHES.md#avatar-object-cover)
className={cn("aspect-square h-full w-full object-cover", className)}
```

**Motivo:** o container do Avatar é `rounded-full` com `aspect-square`, mas sem `object-cover` imagens não-quadradas são esticadas/achatadas em vez de cortadas, causando distorção visível no retrato (ex: rosto achatado horizontalmente). `object-cover` preserva a proporção da imagem e corta o excedente — comportamento esperado de avatar em todo produto consumidor. Wrapper não resolve porque o `<img>` é renderizado pelo primitive (Radix/Reka/Bits); a única forma limpa é passar a classe no próprio componente.

**Verificação após bump:** se `shadcn@latest add avatar` passar a incluir `object-cover` por padrão, remover markers e marcar como RESOLVIDO UPSTREAM. Teste visual: usar imagem retangular (ex: `https://picsum.photos/400/600`) — no bom o rosto/objeto mantém proporção; no ruim fica esticado.
