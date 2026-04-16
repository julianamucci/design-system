# Sistema de Design — Tema Padrão (Svelte)

## Organização CSS com @layer

* **@layer base**: Elementos HTML base e reset do tema
* **@layer components**: Componentes reutilizáveis (.card, .btn, etc.)
* **@layer utilities**: Classes utilitárias (.font-*, .animate-*, etc.)
* **Evite !important**: Use especificidade adequada em vez de forçar estilos

## Cores e Variáveis

### Formato Obrigatório: HSL (shadcn-svelte Standard)

**REGRA CRÍTICA**: Todos os valores de cores nos arquivos CSS devem ser armazenados **EXCLUSIVAMENTE no formato HSL sem vírgulas**.

```css
/* ✅ CORRETO */
:root {
  --primary: 220 44% 57%;
  --background: 0 0% 100%;
  --destructive: 0 84% 60%;
}

/* ❌ PROIBIDO — rgba */
--primary: rgba(94, 177, 239, 1.00);

/* ❌ PROIBIDO — oklch */
--primary: oklch(71.6% 0.16 237.8);

/* ❌ PROIBIDO — hex */
--primary: #5eb1ef;
```

### Aplicação em estilos inline (Svelte)

```svelte
<!-- ✅ CORRETO — envolver com hsl() -->
<div style="background: hsl(var(--primary))">

<!-- Para bibliotecas externas -->
<canvas style="color: {`hsl(var(--chart-1))`}" />
```

### Variáveis Disponíveis

* **Cores principais**: `--primary`, `--secondary`, `--accent`, `--muted`
* **Estados**: `--success`, `--warning`, `--destructive`
* **Superfícies**: `--background`, `--card`, `--popover`
* **Bordas**: `--border`, `--input`, `--ring`

## Tokens de superfície — uso obrigatório

| Contexto | Classes Tailwind |
|----------|-----------------|
| Painéis de conteúdo (Dialog, Sheet, Drawer, Card) | `bg-card text-card-foreground` |
| Menus e overlays flutuantes (Dropdown, Popover, Tooltip) | `bg-popover text-popover-foreground` |
| Inputs | `bg-input border-input` |
| Página principal | `bg-background text-foreground` |

## Tokens de cor de estado

Aplicar via `class` — nunca via prop inexistente:

```svelte
<!-- ✅ CORRETO — via class com tokens -->
<Alert class="bg-warning/10 text-warning border-warning/30">
  Atenção
</Alert>

<!-- ❌ ERRADO — prop inexistente -->
<Alert variant="warning">Atenção</Alert>
```

## Tipografia

* **Tamanhos disponíveis**: `--text-h1`, `--text-h2`, `--text-h3`, `--text-h4`, `--text-p`, `--text-label`
* **Pesos disponíveis**: `--font-weight-extra-bold` (800), `--font-weight-semi-bold` (600), `--font-weight-medium` (500), `--font-weight-regular` (400)
* **Elementos HTML** (h1, h2, p, etc.) já têm estilos base aplicados — não sobrescrever com Tailwind

## Famílias de Fonte

* **Fonte Display**: `--font-display` (Gabriela) — títulos decorativos
* **Fontes Corpo**:
  - `--font-body-inter` (Inter)
  - `--font-body-lxgw` (LXGW WenKai TC)
  - `--font-body-pt-serif` (PT Serif)
  - `--font-body-lexend` (Lexend)
* **Aplicação em Svelte**: `style="font-family: var(--font-token-name)"`

## Temas Personalizados

```css
/* globals.css */
html.tema-um {
  --primary: /* HSL sem vírgulas */;
}

html.dark.tema-um {
  --background: /* HSL */;
}
```

> **Atenção**: Para o tema personalizado, reaproveite as variáveis de estilo do componente Link e aplique o mesmo estilo visual nos links do componente Breadcrumb — garante consistência visual entre componentes de navegação.
