# Sistema de Design - Tema Padrão

## Organização CSS com @layer
* **@layer base**: Elementos HTML base e reset do tema
* **@layer components**: Componentes reutilizáveis (.card, .btn, etc.)
* **@layer utilities**: Classes utilitárias (.font-*, .animate-*, etc.)
* **Evite !important**: Use especificidade adequada em vez de forçar estilos

## Cores e Variáveis

### Formato Obrigatório: HSL

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

1. **Composição de opacidade**: HSL sem vírgulas permite compor opacidade diretamente no CSS (`hsl(var(--primary) / 0.5)`)
2. **Consistência do design system**: HSL é o formato padrão dos tokens do design system
3. **Facilidade de manipulação**: HSL permite ajustar luminosidade e saturação sem recalcular o valor
4. **Sintaxe moderna**: HSL sem vírgulas (`220 44% 57%`) é o padrão CSS moderno

#### Aplicação em Inline Styles

Quando usar cores em inline styles, envolva com `hsl()`:

```vue
<!-- ✅ CORRETO -->
<div :style="{ background: 'hsl(var(--primary))' }">
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
* **Aplicação**: `font-family: var(--font-token-name)` na folha, nunca em `style` inline — inline vence a folha, e a declaração deixa de acompanhar a troca de fonte pela barra de ferramentas
* **Fallbacks**: Todas as fontes incluem fallbacks do sistema automaticamente

## Classes Utilitárias Customizadas

O vocabulário é `.nds-*`, definido em `docs/shared/styles/nds/` — uma folha por componente, mais `utilities.css`, `typography.css`, `spacing.css`, `colors.css` e `layout.css`.

* **Classe de componente**: `.nds-card`, `.nds-button`, `.nds-input`, `.nds-badge` — é ela que lê os tokens de superfície. Não existe utilitária de cor de fundo em opacidade cheia
* **Estado semântico**: não é classe própria, é variante do componente — `variant="success"` no Alert, `data-variant="destructive"` no item de menu
* **Animações**: `.nds-animate-pulse`, `.nds-animate-spin`, `.nds-animate-in`, `.nds-animate-out`. Só o par `in`/`out` para sozinho sob `prefers-reduced-motion`; para as outras duas, quem desliga é `.nds-motion-reduce-none`, que zera animação e transição sob a preferência. Vale saber a diferença antes de assumir que o sistema cobre — a folha de cada componente costuma trazer o próprio `@media`, mas a utilitária avulsa não
* **Tipografia**: `.nds-font-normal`, `.nds-font-medium`, `.nds-font-semibold`, `.nds-font-bold`, `.nds-font-mono`; a escada de tamanho é `.nds-text-*`
* **Layout**: `.nds-stack` e `.nds-cluster`, com `data-spacing` / `data-align` / `data-justify` — em vez de utilitária de gap por valor, que o sistema não tem
* **Foco**: `.nds-focus-ring` e `.nds-focus-ring-inset`

Esta seção já listou `.card`, `.btn`, `.input`, `.success`, `.animate-pulse` e a família `.font-*` sem prefixo, agrupadas por `@layer`. **Nenhuma delas existe** — eram nomes da era anterior à migração, e a folha que as definia saiu do projeto.

## Responsividade Integrada
* **Mobile-first**: Design responsivo integrado
* **Media queries**: Integradas nas classes do tema para consistência

---

## Temas Personalizados

### Tema Personalizado
* **OBRIGATÓRIO**: Para o tema personalizado, reaproveite as variáveis de estilo do componente Link e aplique o mesmo estilo visual nos links do componente Breadcrumb
* **Justificativa**: Garante consistência visual entre componentes de navegação
* **Aplicação**: Os links dentro do Breadcrumb devem herdar as mesmas propriedades de cor, hover, e transição definidas para o componente Link no tema personalizado