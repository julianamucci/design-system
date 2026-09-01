# Sistema de Design — Tema Padrão (Svelte)

## Organização CSS com @layer

* **@layer base**: Elementos HTML base e reset do tema
* **@layer components**: Folhas de componente do sistema (`.nds-card`, `.nds-button`, etc.)
* **@layer utilities**: Classes utilitárias do sistema (`.nds-font-medium`, `.nds-animate-spin`, etc.)
* **Evite !important**: Use especificidade adequada em vez de forçar estilos

## Cores e Variáveis

### Formato Obrigatório: HSL

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

Cor de superfície **não tem classe utilitária**: ela mora na folha do componente,
que lê o token. Por isso a regra nomeia o par token + seletor, e não uma classe
de fundo — não existe utilitária de fundo em opacidade cheia no sistema.

| Contexto | Tokens | Seletor que os lê |
|----------|--------|-------------------|
| Painéis de conteúdo (Dialog, Sheet, Drawer, Card) | `--card` / `--card-foreground` | `.nds-card` e a folha de painel de cada overlay |
| Menus e overlays flutuantes (Dropdown, Popover, Tooltip) | `--popover` / `--popover-foreground` | `.nds-popover-content`, `.nds-dropdown-menu-content`, `.nds-tooltip-content` |
| Inputs | `--input` (fundo) / `--border` (contorno) | `.nds-input` |
| Superfície de página | `--background` / `--foreground` | folha de shell da aplicação |

## Tokens de cor de estado

Variantes semânticas são valores da prop `variant` (desde
PATCHES.md#alert-five-variants) — nunca classes soltas:

```svelte
<!-- ✅ CORRETO — prop de variante -->
<Alert variant="warning">
  Atenção
</Alert>

<!-- ❌ ERRADO — classes soltas (bg-warning/10 etc. nem existem mais no CSS) -->
<Alert class="bg-warning/10 border-warning text-warning">Atenção</Alert>
```

> O bloco errado fica registrado de propósito: essas classes vieram da lib de
> utilitárias que saiu do projeto e **não existem mais** na folha. Escritas hoje
> não pintam nada — o alerta sai sem cor de estado e ninguém vê erro.

## Tipografia

* **Tamanhos disponíveis**: `--text-h1`, `--text-h2`, `--text-h3`, `--text-h4`, `--text-p`, `--text-label`
* **Pesos disponíveis**: `--font-weight-extra-bold` (800), `--font-weight-semi-bold` (600), `--font-weight-medium` (500), `--font-weight-regular` (400)
* **Elementos HTML** (h1, h2, p, etc.) já têm estilos base aplicados — não sobrescrever com classes utilitárias

## Famílias de Fonte

* **Fonte Display**: `--font-display` (Gabriela) — títulos decorativos
* **Fontes Corpo**:
  - `--font-body-inter` (Inter)
  - `--font-body-lxgw` (LXGW WenKai TC)
  - `--font-body-pt-serif` (PT Serif)
  - `--font-body-lexend` (Lexend)
* **Como a família chega ao componente**: a classe `fonte-*` no `<html>` resolve
  `--font-family`, e as folhas `.nds-*` já leem `var(--font-family)`. Trocar a
  fonte é trocar essa classe — nenhum componente declara família própria.
* **Amostra de uma família específica** (vitrine de tipografia): classe
  `.nds-font-sample`, que lê `--font-family-active`. Texto em fonte monoespaçada:
  `.nds-font-mono`.
* **Não há utilitária de família por token** (`--font-display`, `--font-body-*`
  não têm classe equivalente). Enquanto não houver, `style="font-family:
  var(--font-display)"` é **último recurso declarado**, não a recomendação:
  `var(--token)` em estilo inline é a exceção tolerada da regra da casa, e o
  inline continua vencendo a folha — a declaração deixa de acompanhar tema,
  densidade e escala tipográfica.

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
