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

| Contexto | Classes `.nds-*` |
|----------|-----------------|
| Painéis de conteúdo (Dialog, Sheet, Drawer, Card) | `bg-card text-card-foreground` |
| Menus e overlays flutuantes (Dropdown, Popover, Tooltip) | `bg-popover text-popover-foreground` |
| Inputs | `bg-input border-input` |
| Página principal | `bg-background text-foreground` |

## Tokens de cor de estado

Aplicar via `className` — não via atributo especial:

```ts
// ✅ CORRETO — via className com tokens
const alert = createAlert({ message: 'Atenção' });
alert.className = cn(alert.className, 'bg-warning/10 text-warning border-warning/30');

// ❌ ERRADO — atributo inexistente
createAlert({ variant: 'warning', message: 'Atenção' });
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
