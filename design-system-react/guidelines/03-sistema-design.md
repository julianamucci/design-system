# Sistema de Design - Tema Padrão

## Organização CSS com @layer
* **@layer base**: Elementos HTML base e reset do tema
* **@layer components**: Componentes reutilizáveis (.card, .btn, etc.)
* **@layer utilities**: Classes utilitárias (.font-*, .animate-*, etc.)
* **Evite !important**: Use especificidade adequada em vez de forçar estilos

## Cores e Variáveis

### Formato Obrigatório: HSL (Shadcn/UI Standard)

**REGRA CRÍTICA**: Todos os valores de cores nos arquivos CSS devem ser armazenados **EXCLUSIVAMENTE no formato HSL**.

#### ✅ Formato Correto (HSL)
```css
:root {
  --primary: 220 44% 57%;
  --background: 0 0% 100%;
  --destructive: 0 84% 60%;
}
```

#### ❌ Formatos Proibidos

**RGBA:**
```css
/* ❌ INCORRETO - NÃO USE */
--primary: rgba(94, 177, 239, 1.00);
--background: rgba(255, 255, 255, 1);
```

**OKLCH:**
```css
/* ❌ INCORRETO - NÃO USE */
--primary: oklch(71.6% 0.16 237.8);
--background: oklch(100% 0 0);
```

**Hex:**
```css
/* ❌ INCORRETO - NÃO USE */
--primary: #5eb1ef;
--background: #ffffff;
```

#### Justificativa Técnica

1. **Compatibilidade Tailwind v4**: Tailwind espera valores HSL para gerar classes utilitárias corretamente
2. **Consistência com Shadcn/UI**: O padrão oficial do Shadcn/UI é HSL
3. **Facilidade de manipulação**: HSL permite ajustes de opacidade via Tailwind (`bg-primary/50`)
4. **Sintaxe moderna**: HSL sem vírgulas (`220 44% 57%`) é o padrão CSS moderno

#### Aplicação em Inline Styles

Quando usar cores em inline styles (ex: gráficos, bibliotecas externas), envolva com `hsl()`:

```tsx
// ✅ CORRETO
<div style={{ background: `hsl(var(--primary))` }}>

// Para Recharts
<Bar dataKey="value" fill="hsl(var(--chart-1))" />
```

#### Arquivos Afetados

Esta regra se aplica a:
- `/styles/globals.css` (tema padrão)
- `/styles/theme-tema-personalizado.css` (temas personalizados)
- Qualquer arquivo CSS de tema futuro

### Variáveis Disponíveis

* **Use SEMPRE as variáveis CSS do tema padrão** definidas em `./styles/globals.css`
* **Cores principais**: `--primary`, `--secondary`, `--accent`, `--muted`
* **Estados**: `--success`, `--warning`, `--destructive`
* **Superfícies**: `--background`, `--card`, `--popover`
* **Bordas**: `--border`, `--input`, `--ring`

## Tipografia
* **Tamanhos disponíveis**: `--text-h1`, `--text-h2`, `--text-h3`, `--text-h4`, `--text-p`, `--text-label`
* **Pesos disponíveis**: `--font-weight-extra-bold` (800), `--font-weight-semi-bold` (600), `--font-weight-medium` (500), `--font-weight-regular` (400)
* **Classes base**: Elementos HTML (h1, h2, p, etc.) já têm estilos base aplicados

## Famílias de Fonte - Regras Obrigatórias
* **Fonte Display**: `--font-display` (Gabriela) - Use para títulos decorativos e elementos de destaque
* **Fontes Corpo de Texto**:
  - `--font-body-inter` (Inter) - Sans-serif moderna e legível
  - `--font-body-lxgw` (LXGW WenKai TC) - Sans-serif com suporte a caracteres asiáticos
  - `--font-body-pt-serif` (PT Serif) - Serif clássica para textos longos
  - `--font-body-lexend` (Lexend) - Sans-serif otimizada para legibilidade
* **Importação automática**: Todas as fontes são carregadas via Google Fonts no `globals.css`
* **Aplicação**: Use `font-family: var(--font-token-name)` em CSS ou inline styles
* **Fallbacks**: Todas as fontes incluem fallbacks do sistema automaticamente

## Classes Utilitárias Customizadas
* **@layer components** (reutilizáveis):
  - **Componentes**: `.card`, `.btn`, `.input`
  - **Estados**: `.success`, `.warning`, `.error`
* **@layer utilities** (modificadores):
  - **Animações**: `.animate-pulse`, `.animate-spin`
  - **Tipografia**: `.font-normal`, `.font-medium`, `.font-semibold`, `.font-bold`

## Responsividade Integrada
* **Mobile-first**: Design responsivo integrado
* **Media queries**: Integradas nas classes do tema para consistência

---

## Temas Personalizados

### Tema Personalizado
* **OBRIGATÓRIO**: Para o tema personalizado, reaproveite as variáveis de estilo do componente Link e aplique o mesmo estilo visual nos links do componente Breadcrumb
* **Justificativa**: Garante consistência visual entre componentes de navegação
* **Aplicação**: Os links dentro do Breadcrumb devem herdar as mesmas propriedades de cor, hover, e transição definidas para o componente Link no tema personalizado