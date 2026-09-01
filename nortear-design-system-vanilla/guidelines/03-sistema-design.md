# Sistema de Design — Tema Padrão (Nortear)

## Organização CSS com @layer

* **@layer base**: Elementos HTML base e reset do tema
* **@layer components**: Componentes reutilizáveis (.card, .btn, etc.)
* **@layer utilities**: Classes utilitárias (.font-*, .animate-*, etc.)
* **Evite !important**: Use especificidade adequada em vez de forçar estilos

## Cores e Variáveis

### Formato Obrigatório: HSL sem vírgulas

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

### Aplicação em JavaScript

```ts
// ✅ CORRETO — envolver com hsl() quando necessário
element.style.background = `hsl(var(--primary))`;

// Para bibliotecas externas (canvas, SVG inline)
canvas.style.color = `hsl(var(--chart-1))`;
```

### Variáveis Disponíveis

* **Cores principais**: `--primary`, `--secondary`, `--accent`, `--muted`
* **Estados**: `--success`, `--warning`, `--destructive`
* **Superfícies**: `--background`, `--card`, `--popover`
* **Bordas**: `--border`, `--input`, `--ring`

## Tokens de superfície — uso obrigatório

**Não existe utilitária de cor de superfície.** Cor de fundo mora na folha do
componente, e é ela que lê o token. Aplicar a classe do componente é o que
aplica a superfície correta; não há classe avulsa a acrescentar.

| Contexto | Quem lê o token | Tokens |
|----------|-----------------|--------|
| Painéis de conteúdo (Dialog, Sheet, Drawer, Card) | `.nds-dialog-content`, `.nds-sheet-content`, `.nds-card` | `--card` / `--card-foreground` |
| Menus e overlays flutuantes (Dropdown, Popover, Tooltip) | `.nds-dropdown-menu-content`, `.nds-popover-content`, `.nds-tooltip-content` | `--popover` / `--popover-foreground` |
| Inputs | `.nds-input` | `--input` (fundo) / `--border` (contorno) |
| Página principal | `.nds-page` sobre o `<body>` do tema | `--background` / `--foreground` |

Superfícies auxiliares seguem o mesmo desenho: o trilho de abas é
`.nds-tabs-list`, o fallback de avatar é `.nds-avatar-fallback` e o placeholder
de carregamento é `.nds-skeleton` — todos leem `--muted` / `--muted-foreground`
por conta própria.

## Tokens de cor de estado

Aplicar via `className` — não via atributo especial:

```ts
// ✅ CORRETO — variante é opção da factory (desde PATCHES.md#alert-five-variants)
createAlert({ variant: 'warning' });

// ❌ ERRADO — classes soltas (bg-warning/10 etc. nem existem mais no CSS)
alert.className = cn(alert.className, 'bg-warning/10 text-warning border-warning/30');
```

## Temas

```css
/* globals.css */
html.tema-um {
  --primary: /* HSL sem vírgulas */;
}

html.dark.tema-um {
  --background: /* HSL */;
}
```

Gerenciado pelo toolbar do Storybook via decorators — não via código manual.

> **Atenção**: Para o tema personalizado, reaproveite as variáveis de estilo dos links e aplique o mesmo estilo visual nos links de Breadcrumb — garante consistência visual entre componentes de navegação.
