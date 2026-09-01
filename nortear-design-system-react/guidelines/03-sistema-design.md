# Sistema de Design - Tema Padrão

## Organização CSS
O `src/styles/globals.css` não define estilo próprio de componente: ele importa, nesta ordem, as fontes, `@shared/tokens/tokens.css`, `@shared/themes/index.css` e `@shared/styles/nds/index.css` — e só então acrescenta o reset de base e a blindagem contra o CSS que o Storybook injeta.
* **Tokens antes de tudo**: as custom properties e os temas precisam existir antes de qualquer folha que as leia
* **`nds/index.css` tem ordem sensível à cascata**: os `@import` de lá seguem a ordem da stack de referência; não reordenar
* **Evite `!important`**: use especificidade adequada em vez de forçar estilos

## Cores e Variáveis

### Formato Obrigatório: HSL (canais crus)

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

1. **Composição com `hsl()`**: os tokens são consumidos como `hsl(var(--token))` no CSS `.nds-*` — o formato precisa dos três canais crus, sem função de cor
2. **Ajuste de opacidade**: HSL sem vírgulas permite `hsl(var(--primary) / 0.5)` diretamente no CSS, sem utilitários extras
3. **Sintaxe moderna**: HSL sem vírgulas (`220 44% 57%`) é o padrão CSS moderno

#### Aplicação em Inline Styles

Quando usar cores em inline styles, envolva com `hsl()`:

```tsx
// ✅ CORRETO
<div style={{ background: `hsl(var(--primary))` }}>
```

Biblioteca que desenha fora do CSS — a de gráfico, por exemplo — recebe cor por
objeto de configuração em JavaScript. Ali `var(--chart-1)` chega como string
literal e não é resolvido: leia o token do `<html>` e passe o valor computado
(`hsl(${raw})`). O `ChartContainer` do design system já faz isso e registra um
tema a partir dos tokens; consumir a lib direto pula esse registro.

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
* **Aplicação**: `font-family: var(--font-token-name)` na folha de estilo — nunca no atributo `style`, que passa por cima do tema e da densidade
* **Fallbacks**: Todas as fontes incluem fallbacks do sistema automaticamente

## Classes Utilitárias Customizadas
Todas vivem em `docs/shared/styles/nds/` e carregam o prefixo `.nds-`. Antes de escrever qualquer classe, procure a utilitária lá: se não existir, **nomeie a falta** em vez de escrever o valor à mão.
* **Componentes**: cada um tem folha própria (`.nds-card`, `.nds-button`, `.nds-input`, `.nds-alert`…), que é quem lê os tokens de cor e de medida
* **Composição de layout**: `.nds-stack` e `.nds-cluster`, ajustados por `data-spacing`, `data-align` e `data-justify` — não há utilitária avulsa de `gap`, de alinhamento nem de grade de colunas
* **Animações** (`utilities.css`): `.nds-animate-pulse`, `.nds-animate-spin`, `.nds-animate-in`, `.nds-animate-out` — todas já param sob `prefers-reduced-motion: reduce`
* **Tipografia** (`typography.css`): escada de texto em `.nds-text-h1`…`.nds-text-h4`, `.nds-text-lead`, `.nds-text-body`, `.nds-text-caption`, `.nds-text-label`, `.nds-text-code`; pesos em `.nds-font-normal`, `.nds-font-medium`, `.nds-font-semibold`, `.nds-font-bold`; monoespaçada em `.nds-font-mono`
* **Cor** (`colors.css`): utilitárias de texto, fundo, borda e sombra, todas lendo token. Servem para composição pontual — nunca para repintar um componente que já tem folha

## Responsividade Integrada
* **Mobile-first**: Design responsivo integrado
* **Media queries**: Integradas nas classes do tema para consistência

---

## Temas Personalizados

### Tema Personalizado
* **OBRIGATÓRIO**: Para o tema personalizado, reaproveite as variáveis de estilo do componente Link e aplique o mesmo estilo visual nos links do componente Breadcrumb
* **Justificativa**: Garante consistência visual entre componentes de navegação
* **Aplicação**: Os links dentro do Breadcrumb devem herdar as mesmas propriedades de cor, hover, e transição definidas para o componente Link no tema personalizado