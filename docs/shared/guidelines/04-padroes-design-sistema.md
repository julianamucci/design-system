# Padrões de Design Sistema - Implementação Prática

Este documento fornece **exemplos práticos de implementação** dos design tokens definidos no arquivo `03-sistema-design.md`. Para a lista completa de tokens disponíveis, consulte aquele arquivo.

---

## Princípio Fundamental

**NUNCA use valores hardcoded. SEMPRE use variáveis CSS.**

❌ **INCORRETO**:
```tsx
<div className="bg-white text-black border-gray-200">
  <h1 className="text-4xl font-bold">Título</h1>
</div>
```

✅ **CORRETO**:
```tsx
<div className="bg-background text-foreground border-border">
  <h1>Título</h1> {/* Tipografia definida no CSS base */}
</div>
```

---

## ⚠️ REGRA CRÍTICA: Formato HSL para Cores

**OBRIGATÓRIO**: Todos os tokens de cores em arquivos CSS devem usar **EXCLUSIVAMENTE formato HSL**.

### Definição nos Arquivos CSS

```css
/* ✅ CORRETO - Formato HSL (sem vírgulas) */
:root {
  --primary: 220 44% 57%;
  --background: 0 0% 100%;
  --destructive: 0 84% 60%;
}

/* ❌ INCORRETO - Formatos proibidos */
--primary: rgba(94, 177, 239, 1.00);  /* RGBA não funciona */
--primary: oklch(71.6% 0.16 237.8);   /* OKLCH não funciona */
--primary: #5eb1ef;                    /* HEX não funciona */
```

### Uso em Componentes

**Classes CSS standalone `.nds-*` (automático):**
```tsx
// A classe aplica hsl() a partir do token automaticamente
<div className="nds-bg-primary nds-text-primary-foreground">
```

**Inline Styles (manual):**
```tsx
// Você deve envolver com hsl() manualmente
<div style={{ background: `hsl(var(--primary))` }}>

// Para bibliotecas externas (ex: Recharts)
<Bar dataKey="value" fill="hsl(var(--chart-1))" />
```

**Referência completa**: Consulte `03-sistema-design.md` → "Formato Obrigatório: HSL"

---

## Exemplos Práticos por Categoria

### 1. Cores Semânticas

**Uso**: Aplicar cor com significado contextual

| Token | Uso | Exemplo |
|-------|-----|---------|
| `--background` | Fundo principal da aplicação | `nds-bg-background` |
| `--foreground` | Texto sobre background | `nds-text-foreground` |
| `--card` | Fundo de cards/containers | `nds-bg-card` |
| `--card-foreground` | Texto sobre cards | `nds-text-card-foreground` |
| `--primary` | Ações principais | `nds-bg-primary`, `nds-text-primary` |
| `--primary-foreground` | Texto sobre primary | `nds-text-primary-foreground` |
| `--secondary` | Ações secundárias | `nds-bg-secondary` |
| `--muted` | Elementos desabilitados | `nds-bg-muted`, `nds-text-muted-foreground` |
| `--accent` | Destaques e hover | `nds-bg-accent`, `nds-hover-bg-accent` |
| `--destructive` | Ações destrutivas | `nds-bg-destructive` |
| `--success` | Sucesso/confirmação | `nds-bg-success` |
| `--warning` | Avisos | `nds-bg-warning` |
| `--info` | Informações | `nds-bg-info` |
| `--border` | Bordas padrão | `nds-border-default` |
| `--input` | Bordas de inputs | `nds-border-default` |
| `--ring` | Focus rings | `--ring` (focus-visible no CSS do componente) |

#### Exemplos de Uso

**Card com texto**:
```tsx
<Card className="bg-card text-card-foreground border-border">
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Texto secundário</p>
  </CardContent>
</Card>
```

**Botão primário**:
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Ação Principal
</Button>
```

**Alert de sucesso**:
```tsx
<Alert className="bg-success text-success-foreground border-success">
  <CheckCircle className="h-4 w-4" />
  <AlertDescription>Operação concluída com sucesso!</AlertDescription>
</Alert>
```

---

### 2. Tipografia

**REGRA CRÍTICA**: NÃO use classes de tamanho de fonte arbitrário a menos que explicitamente solicitado. Prefira as escalas semânticas `.nds-text-h1`/`.nds-text-body`/`.nds-text-caption` e os elementos HTML base.

#### Elementos HTML Base

A tipografia é aplicada automaticamente via CSS base:

```css
/* globals.css */
@layer base {
  h1 { font-size: var(--text-h1); font-weight: var(--font-weight-extra-bold); }
  h2 { font-size: var(--text-h2); font-weight: var(--font-weight-semi-bold); }
  h3 { font-size: var(--text-h3); font-weight: var(--font-weight-semi-bold); }
  h4 { font-size: var(--text-h4); font-weight: var(--font-weight-medium); }
  p  { font-size: var(--text-p); font-weight: var(--font-weight-regular); }
  label { font-size: var(--text-label); font-weight: var(--font-weight-medium); }
}
```

✅ **USO CORRETO**:
```tsx
<h1>Título Principal</h1>           {/* 48px, font-weight: 800 */}
<h2>Subtítulo</h2>                  {/* 30px, font-weight: 600 */}
<h3>Seção</h3>                      {/* 20px, font-weight: 600 */}
<h4>Subseção</h4>                   {/* 16px, font-weight: 500 */}
<p>Parágrafo de texto</p>           {/* 14px, font-weight: 400 */}
<label>Label de formulário</label>  {/* 12px, font-weight: 500 */}
```

❌ **EVITAR** (a menos que explicitamente solicitado):
```tsx
<h1 className="text-4xl font-bold">Título</h1>
<p className="text-sm font-normal">Parágrafo</p>
```

#### Famílias de Fonte

**Tokens disponíveis**:
- `--font-display`: Gabriela (títulos decorativos)
- `--font-body-inter`: Inter (sans-serif padrão)
- `--font-body-lxgw`: LXGW WenKai TC (asiáticos)
- `--font-body-pt-serif`: PT Serif (serif clássica)
- `--font-body-lexend`: Lexend (legibilidade otimizada)

**Aplicação via inline styles** (quando necessário customizar):
```tsx
<h1 style={{ fontFamily: 'var(--font-display)' }}>
  Título Decorativo
</h1>

<p style={{ fontFamily: 'var(--font-body-pt-serif)' }}>
  Texto longo em serif para melhor leitura.
</p>
```

---

### 3. Espaçamento

**Sistema Base**: Múltiplos de 8px

**Classes de padding disponíveis** (`.nds-p-*`):
- `nds-p-1` = 4px
- `nds-p-2` = 8px
- `nds-p-4` = 16px
- `nds-p-6` = 24px
- `nds-p-8` = 32px

**Padrões de Layout**:

```tsx
// Container de página de documentação
<div className="nds-page nds-p-8">
  {/* nds-stack aplica o espaçamento vertical entre seções via data-spacing */}
  <div className="nds-stack" data-spacing="2xl">
    {/* Seções */}
  </div>
</div>

// Card com padding interno
<div className="nds-card nds-p-6">
  {/* Conteúdo com 24px de padding */}
</div>

// Grid com gap
<div className="nds-grid" data-cols="2" data-spacing="lg">
  {/* Gap de 24px entre itens */}
</div>
```

---

### 4. Bordas e Raios

**Tokens de Raio**:
- `--radius`: 8px (padrão)
- `--radius-button`: 8px
- `--radius-card`: 8px

**Aplicação**:
```tsx
// Via classe utilitária .nds-* (usa --radius automaticamente)
<div className="nds-rounded-md">   {/* var(--radius) */}
<div className="nds-rounded-lg">   {/* var(--radius) * 1.5 */}

// Via inline style (customização específica)
<div style={{ borderRadius: 'var(--radius-card)' }}>
```

**Bordas**:
```tsx
// Borda padrão
<div className="nds-border-default">

// Borda de input (o CSS do componente já aplica --input)
<input className="nds-input" />

// Borda de destaque temática
<div className="nds-border-primary-soft">
```

---

## Temas Personalizados

### Estrutura de um Tema

Cada tema é um conjunto de valores para os tokens definidos.

**Exemplo: Tema Personalizado**

```css
/* Tema Personalizado - Light Mode */
html.tema-personalizado {
  /* Cores principais */
  --background: 0 0% 100%;
  --foreground: 0 0% 12%;

  /* Cards e containers */
  --card: 0 0% 100%;
  --card-foreground: 0 0% 12%;

  /* Primary brand color */
  --primary: 220 44% 57%;
  --primary-foreground: 0 0% 100%;

  /* Secondary */
  --secondary: 36 100% 79%;
  --secondary-foreground: 0 0% 12%;

  /* Estados */
  --success: 165 35% 48%;
  --warning: 220 44% 57%;
  --destructive: 319 39% 48%;

  /* Bordas e inputs */
  --border: 0 0% 87%;
  --input: 237 27% 72%;
  --ring: 239 38% 46%;

  /* ... outros tokens */
}

/* Tema Personalizado - Dark Mode */
html.tema-personalizado.dark {
  --background: 223 26% 9%;
  --foreground: 252 33% 97%;

  --card: 223 26% 9%;
  --card-foreground: 210 40% 98%;

  --primary: 238 50% 87%;
  --primary-foreground: 0 0% 100%;

  --secondary: 36 100% 79%;
  --secondary-foreground: 253 11% 24%;

  --success: 165 28% 51%;
  --warning: 36 100% 79%;
  --destructive: 319 39% 48%;

  --border: 236 19% 31%;
  --input: 240 67% 98%;
  --ring: 252 33% 97%;

  /* ... outros tokens */
}
```

### Criando um Novo Tema

**Passo 1**: Definir as variáveis CSS do tema

```css
/* Um tema é apenas um seletor de classe que redefine os tokens. */
.meu-tema {
  /* Definir TODOS os tokens usados no tema padrão */
  --background: ...;
  --foreground: ...;
  /* etc */
}
```

**Passo 2**: Registrar no ThemeSelector

```tsx
// ThemeSelector.tsx
const themes = [
  { value: "default", label: "Default" },
  { value: "tema-personalizado", label: "Tema Personalizado" },
  { value: "meu-tema", label: "Meu Tema" }
];
```

**Passo 3**: Atualizar App.tsx

```tsx
useEffect(() => {
  document.documentElement.classList.remove('default', 'tema-personalizado', 'meu-tema', 'dark');
  
  if (currentTheme === 'meu-tema') {
    document.documentElement.classList.add('meu-tema');
  }
  
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
}, [isDark, currentTheme]);
```

---

## Dark Mode

### Implementação

**Variante CSS**:
```css
html.dark {
  --background: 0 0% 4%;
  --foreground: 0 0% 98%;
  /* Inverter cores conforme necessário */
}
```

**Ativação**:
```tsx
// App.tsx
const [isDark, setIsDark] = useState(false);

useEffect(() => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [isDark]);
```

**Combinação com Temas Personalizados**:
- Tema personalizado define cores base
- Dark mode modifica essas cores base
- Classes aplicadas: `.tema-personalizado.dark` ou apenas `.dark`

---

## Padrões de Composição

### Layout de Página de Documentação

**Estrutura Obrigatória**:

```tsx
export function ComponentDocs() {
  return (
    <div className="flex-1 h-full overflow-auto">
      <div className="p-8 max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="space-y-4">
          <Badge variant="outline" className="border-primary/20 text-primary">
            Categoria
          </Badge>
          <h1>Componente</h1>
          <p className="text-muted-foreground">
            Descrição do componente
          </p>
        </header>

        {/* Seções */}
        <section className="space-y-4">
          <h2>Seção</h2>
          {/* Conteúdo */}
        </section>

        {/* Notas e Dicas - ver padrão canônico em 12-documentacao-componentes.md, seção 14 */}
        <section className="space-y-4">
          <h2 className="mb-4">Notas e Dicas</h2>
          <ComponentDemo>
            <div className="text-sm text-muted-foreground space-y-4">
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground">Título da Dica</p>
                  <p>Descrição detalhada da dica.</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground">Título do Aviso</p>
                  <p>Descrição detalhada do aviso ou cuidado.</p>
                </div>
              </div>
            </div>
          </ComponentDemo>
        </section>

      </div>
    </div>
  );
}
```

**Classes Obrigatórias**:
- Wrapper externo: `flex-1 h-full overflow-auto`
- Container interno: `p-8 max-w-4xl mx-auto space-y-12`
- Header: `space-y-4`
- Seções: `space-y-4` (entre título e conteúdo)
- Espaçamento entre seções: `space-y-12` no container

### Alinhamento de Grupos de Botões

Regra transversal aplicada a qualquer contexto onde dois ou mais botões aparecem juntos — cards, formulários, dialogs, drawers, sheets e footers de seção.

**Regra obrigatória**: botão primário sempre à direita. Os demais botões ordenados da direita para esquerda por ordem de importância decrescente.

```tsx
{/* ✅ CORRETO — primário à direita, secundários à esquerda */}
<div className="flex justify-end gap-2">
  <Button variant="outline">Cancelar</Button>
  <Button variant="outline">Editar</Button>
  <Button>Salvar</Button>
</div>

{/* ✅ Alternativa com ml-auto para empurrar o grupo à direita */}
<div className="flex gap-2 ml-auto">
  <Button variant="ghost">Cancelar</Button>
  <Button>Confirmar</Button>
</div>

{/* ❌ INCORRETO — primário à esquerda */}
<div className="flex gap-2">
  <Button>Salvar</Button>
  <Button variant="outline">Cancelar</Button>
</div>
```

**Regras específicas**:
- Use `justify-end` no container para alinhar o grupo inteiro à direita
- Use `ml-auto` no grupo quando ele compartilha uma linha com outro conteúdo
- Nunca use `flex-row-reverse` — inverte a ordem visual sem inverter a ordem do DOM, prejudicando navegação por teclado e leitores de tela
- Em dialogs e overlays, aplicar a mesma regra no `DialogFooter` / `DrawerFooter`

> **Referência detalhada por componente**: arquivo `06-form-components.md` (Button) e arquivo `10-overlay-components.md` (Dialog, Drawer, Sheet).

### Seção "Notas e Dicas" - Padrão Visual

> **O padrão canônico desta seção está definido em `12-documentacao-componentes.md`, seção 14. O arquivo 12 é a fonte da verdade — consulte-o para o template completo.**

**Estrutura obrigatória** (conforme arquivo 12):

```tsx
import { CheckCircle2, XCircle } from 'lucide-react';

<section>
  <h2 className="mb-4">Notas e Dicas</h2>
  <ComponentDemo>
    <div className="text-sm text-muted-foreground space-y-4">

      {/* Dica positiva */}
      <div className="flex gap-2 items-start">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground">Título da Dica</p>
          <p>Descrição detalhada. Use <code>código inline</code> quando necessário.</p>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex gap-2 items-start">
        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground">Título do Aviso</p>
          <p>Descrição detalhada do aviso ou cuidado.</p>
        </div>
      </div>

    </div>
  </ComponentDemo>
</section>
```

**Regras obrigatórias**:
- Container externo: `text-sm text-muted-foreground space-y-4`
- Dicas positivas: ícone `CheckCircle2` com `text-primary`
- Avisos/cuidados: ícone `XCircle` com `text-destructive`
- Título de cada item: `<p className="text-foreground">`
- Descrição: herda `text-sm text-muted-foreground` do container
- Envolva sempre em `<ComponentDemo>`

---

## Componentes com Design Tokens

### Card

```tsx
<Card className="bg-card text-card-foreground border-border">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription className="text-muted-foreground">
      Descrição
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Conteúdo */}
  </CardContent>
  <CardFooter className="border-t border-border">
    {/* Footer */}
  </CardFooter>
</Card>
```

### Button

```tsx
{/* Primary */}
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</Button>

{/* Secondary */}
<Button variant="secondary" className="bg-secondary text-secondary-foreground">
  Secondary Action
</Button>

{/* Destructive */}
<Button variant="destructive" className="bg-destructive text-destructive-foreground">
  Delete
</Button>

{/* Outline */}
<Button variant="outline" className="border-border text-foreground hover:bg-accent">
  Outline
</Button>
```

### Input

```tsx
<Input 
  className="bg-input-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
  placeholder="Digite algo..."
/>
```

### Alert

```tsx
{/* Info */}
<Alert className="bg-info text-info-foreground border-info">
  <Info className="h-4 w-4" />
  <AlertTitle>Informação</AlertTitle>
  <AlertDescription>Detalhes importantes...</AlertDescription>
</Alert>

{/* Success */}
<Alert className="bg-success text-success-foreground border-success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Sucesso</AlertTitle>
  <AlertDescription>Operação concluída!</AlertDescription>
</Alert>

{/* Warning */}
<Alert className="bg-warning text-warning-foreground border-warning">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>Verifique os dados antes de prosseguir.</AlertDescription>
</Alert>

{/* Destructive */}
<Alert className="bg-destructive text-destructive-foreground border-destructive">
  <XCircle className="h-4 w-4" />
  <AlertTitle>Erro</AlertTitle>
  <AlertDescription>Algo deu errado.</AlertDescription>
</Alert>
```

---

## Focus States - Acessibilidade Obrigatória

### Regra Fundamental

**TODOS os componentes interativos DEVEM ter**:
```tsx
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

**Ring sempre com 100% da cor** (sem opacidade):
```css
--ring: 239 38% 46%;  /* ✅ CORRETO - HSL sem opacidade */
--ring: 239 38% 46% / 0.5;  /* ❌ ERRADO - com opacidade */
```

### Exemplos

**Button**:
```tsx
<Button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Click me
</Button>
```

**Link**:
```tsx
<a 
  href="#" 
  className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
>
  Link
</a>
```

**Custom Interactive Element**:
```tsx
<div 
  role="button"
  tabIndex={0}
  className="cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
>
  Interactive Element
</div>
```

---

## Layout, Grid e Responsividade

### Breakpoints

O projeto adota uma abordagem **mobile-first**: defina o comportamento base para mobile e sobrescreva em telas maiores. Os breakpoints canônicos abaixo valem tanto para media queries em CSS quanto para as classes utilitárias responsivas `.nds-*`.

| Prefixo | Largura mínima | Contexto típico |
|---------|---------------|-----------------|
| *(base)* | 0px | Mobile — layout de coluna única |
| `sm` | 640px | Mobile largo / landscape |
| `md` | 768px | Tablet — primeira quebra de grid |
| `lg` | 1024px | Desktop — layout completo |
| `xl` | 1280px | Desktop largo |
| `2xl` | 1536px | Widescreen — raramente necessário |

> **Regra prática**: a maioria das decisões de layout ocorre em três pontos — base (mobile), `md` (tablet) e `lg` (desktop). Evite usar `sm`, `xl` e `2xl` sem necessidade real.

---

### Containers Canônicos

O projeto define dois tipos de container de conteúdo. Use sempre um deles — nunca invente larguras arbitrárias.

| Container | Classes | Largura máx. | Uso |
|-----------|---------|-------------|-----|
| **Docs** | `max-w-4xl mx-auto` | 896px | Páginas de documentação de componente |
| **Showcase** | `max-w-6xl mx-auto` | 1152px | Páginas Showcase de categoria |

```tsx
{/* Página de documentação de componente */}
<div className="flex-1 h-full overflow-auto">
  <div className="p-8 max-w-4xl mx-auto space-y-12">
    {/* conteúdo */}
  </div>
</div>

{/* Página Showcase de categoria */}
<div className="flex-1 h-full">
  <div className="p-8 max-w-6xl mx-auto space-y-12">
    {/* conteúdo */}
  </div>
</div>
```

---

### Layout Principal da Aplicação

O layout raiz combina sidebar fixa com área de conteúdo fluida. Este padrão é gerenciado pelo componente de Sidebar do design system (app-shell `.nds-sidebar-layout` + `SidebarProvider` da stack) e **não deve ser replicado manualmente**.

```
┌─────────────────────────────────────────┐
│  Sidebar (280px fixo)  │  SidebarInset  │
│                        │  (flex-1)      │
│  - Navegação           │  - Header      │
│  - ThemeSelector       │  - Conteúdo    │
└─────────────────────────────────────────┘
```

```tsx
{/* Estrutura raiz — App.tsx */}
<SidebarProvider>
  <Sidebar />                    {/* 280px — gerenciado pelo componente Sidebar */}
  <SidebarInset className="flex-1 min-w-0">  {/* min-w-0 evita overflow */}
    <header />
    <main className="flex-1 overflow-auto">
      {renderCurrentPage()}
    </main>
  </SidebarInset>
</SidebarProvider>
```

> **`min-w-0` é obrigatório** no `SidebarInset`. Sem ele, colunas flex com conteúdo longo podem ultrapassar o container.

---

### Sistema de Grid para Conteúdo

Use `grid` para layouts de múltiplas colunas com itens de tamanho previsível (cards, métricas, opções). Use `flex` para alinhamento linear onde os itens têm tamanhos variáveis.

#### Padrões de Colunas

```tsx
{/* 2 colunas — comparações, formulários lado a lado */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

{/* 3 colunas — cards de feature, métricas */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

{/* 4 colunas — ícones, avatares, badges */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

{/* Auto-fit — número de colunas adaptado ao espaço disponível */}
<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
```

> **Prefira colunas explícitas** (`grid-cols-2`, `grid-cols-3`) a `auto-fit` em layouts de documentação — o resultado é mais previsível entre breakpoints.

#### Gap Padrão por Densidade

| Contexto | Gap | Classe |
|----------|-----|--------|
| Cards e seções espaçosas | 24px | `gap-6` |
| Grids de itens compactos | 16px | `gap-4` |
| Ícones, badges, chips | 8px | `gap-2` |
| Botões em grupo | 8px | `gap-2` |

```tsx
{/* Cards de documentação — espaçoso */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

{/* Grade de badges — compacto */}
<div className="flex flex-wrap gap-2">
  <Badge>Tag 1</Badge>
  <Badge>Tag 2</Badge>
</div>
```

---

### Flex vs. Grid — Quando Usar Cada Um

| Situação | Use | Exemplo |
|----------|-----|---------|
| Itens em linha com tamanhos variáveis | `flex` | Botões, badges, breadcrumb |
| Colunas de tamanho igual ou definido | `grid` | Cards de feature, galeria |
| Alinhamento vertical + horizontal | `flex` | Header, toolbar, item de lista |
| Layout de página com áreas distintas | `grid` | Dashboard com aside |
| Wrap automático de itens | `flex flex-wrap` | Tags, chips, ícones |

```tsx
{/* ✅ flex — botões em grupo */}
<div className="flex items-center gap-2">
  <Button variant="outline">Cancelar</Button>
  <Button>Salvar</Button>
</div>

{/* ✅ grid — cards de métricas */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card>Métrica 1</Card>
  <Card>Métrica 2</Card>
  <Card>Métrica 3</Card>
</div>

{/* ❌ grid desnecessário — use flex */}
<div className="grid grid-cols-2 gap-2">
  <Button variant="outline">Cancelar</Button>
  <Button>Salvar</Button>
</div>
```

---

### Overflow e Truncamento

Problemas de overflow são comuns em layouts flex e grid. Aplique as seguintes regras preventivamente:

```tsx
{/* Texto longo dentro de flex/grid — sempre truncar ou quebrar */}
<p className="truncate">Título muito longo que pode vazar do container</p>
<p className="break-words">URL ou string sem espaços que pode vazar</p>

{/* Coluna flex que pode encolher abaixo do conteúdo mínimo */}
<div className="flex-1 min-w-0">
  <p className="truncate">Conteúdo</p>
</div>

{/* Tabela que pode ultrapassar o container em mobile */}
<div className="w-full overflow-x-auto">
  <table className="w-full">...</table>
</div>
```

---

### Acessibilidade em Layouts

- **Ordem do DOM deve refletir a ordem visual** — não use utilitários de reordenação (`order-*`) para reordenar visualmente sem reordenar no DOM, pois isso confunde leitores de tela e navegação por teclado.
- **Regiões semânticas**: use `<header>`, `<main>`, `<nav>`, `<aside>`, `<section>` em vez de `<div>` para estrutura de página.
- **Landmarks ARIA**: quando não for possível usar elementos semânticos, adicione `role="main"`, `role="navigation"`, etc.
- **Foco em mobile**: em layouts de coluna única, garanta que a ordem de foco (Tab) siga o fluxo visual de cima para baixo.

```tsx
{/* ✅ Estrutura semântica correta */}
<SidebarProvider>
  <nav aria-label="Navegação principal">
    <Sidebar />
  </nav>
  <main>
    <header>...</header>
    {renderCurrentPage()}
  </main>
</SidebarProvider>
```

---

### Padrões Mobile-First

```tsx
{/* Padding de página — mais compacto em mobile */}
<div className="p-4 md:p-6 lg:p-8">

{/* Ocultar sidebar em mobile (gerenciado pelo SidebarProvider) */}
{/* Não reimplemente — use o comportamento nativo do componente Sidebar */}

{/* Stack vertical em mobile, horizontal em desktop */}
<div className="flex flex-col md:flex-row gap-4">
  <aside className="md:w-64">Filtros</aside>
  <main className="flex-1 min-w-0">Conteúdo</main>
</div>

{/* Tipografia responsiva — apenas quando explicitamente solicitado */}
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  {/* Somente se o usuário pedir */}
</h1>
```

---

## Elevação e Sombras

### Tokens de Elevação

```css
/* Elevação usa rgba pois box-shadow não é uma cor de tema — é uma sombra com transparência */
--elevation-sm: 0px 1px 2px 0px rgba(0, 0, 0, 0.1);
```

> **Nota**: `--elevation-*` é a única exceção ao padrão HSL. Box-shadows com transparência requerem `rgba()` por não serem cores de tema, e sim camadas de sombra sobrepostas.

### Aplicação

```tsx
{/* Via classe utilitária .nds-* */}
<div className="nds-card nds-shadow-sm">  {/* Usa elevation-sm */}

{/* Via inline style (customização) */}
<div style={{ boxShadow: 'var(--elevation-sm)' }}>

{/* Hover elevation — via CSS do componente, ex.: .nds-card:hover { box-shadow: var(--elevation-md) } */}
<div className="nds-card nds-shadow-sm">
```

---

## Motion e Animações

### Tokens de Transição

A escada de durações e easings vive em `docs/shared/tokens/motion.css` e deve ser usada via `var()` no CSS do componente. Nunca use valores literais de duração/easing.

```css
/* Escada de durações (motion.css) — durações zeram sob prefers-reduced-motion */
--duration-instant:  0ms;      /* trocas sem animação */
--duration-fast:     120ms;    /* hover, focus ring, press feedback, micro-interações */
--duration-base:     200ms;    /* default — opacity, transforms pequenos, painéis de menu */
--duration-moderate: 320ms;    /* enter/exit de overlays maiores (toast, popover) */
--duration-slow:     500ms;    /* mudanças de layout, transforms grandes */
--duration-stately:  800ms;    /* transições de página, reveal em tela cheia */

/* Easings */
--ease-standard: cubic-bezier(0.2, 0, 0, 1);   /* default — transições contínuas */
--ease-emphasis: cubic-bezier(0.3, 0, 0, 1);   /* chegada mais dramática */
--ease-entrance: cubic-bezier(0, 0, 0, 1);     /* elementos entrando */
--ease-exit:     cubic-bezier(0.3, 0, 1, 1);   /* elementos saindo */
```

### Mapeamento de Situações para Tokens

Aplique o degrau adequado no CSS `.nds-*` do componente:

| Situação | Propriedade / duração | Token |
|----------|----------------------|-------|
| Hover de cor/opacidade | `transition: color var(--duration-fast)` | `--duration-fast` |
| Hover de sombra/borda | `transition: box-shadow var(--duration-fast)` | `--duration-fast` |
| Estado ativo/selecionado | `transition: all var(--duration-base)` | `--duration-base` |
| Enter/exit de overlay | `animation: ... var(--duration-moderate)` | `--duration-moderate` |
| Expansão de painel grande | `transition: all var(--duration-slow)` | `--duration-slow` |

### Quando Usar Cada Duração

```css
/* Fast (120ms): reações a hover e focus — devem ser quase imperceptíveis */
.nds-button {
  transition: background-color var(--duration-fast) var(--ease-standard);
}

/* Base (200ms): mudanças de estado visíveis, mas não bloqueiam o usuário */
.nds-collapsible [data-slot="collapsible-content"] {
  transition: height var(--duration-base) ease-out;
}

/* Slow (500ms): entradas de elementos grandes — use com parcimônia */
.nds-sheet-content {
  transition: transform var(--duration-slow) var(--ease-entrance);
}
```

### Animações de Loading

Use apenas os utilitários `.nds-*` já definidos no CSS do design system:

```tsx
{/* Skeleton / conteúdo carregando — o pulse vem do próprio .nds-skeleton */}
<Skeleton className="nds-skeleton" />

{/* Spinner / ação em andamento */}
<Loader2 className="nds-animate-spin nds-icon-sm" />
```

> **Não crie novas animações CSS** para loading. O pulse do Skeleton e `.nds-animate-spin` são os únicos padrões aprovados.

### Componentes do Design System: Não Sobrescrever Animações

Os componentes do design system (Accordion, Dialog, Popover, Sheet, etc.) já têm animações de entrada/saída definidas no CSS `.nds-*`, disparadas pelos atributos `data-[state]` das libs primitivas (`@base-ui/react`, `reka-ui`, `bits-ui`). **Nunca sobrescreva essas animações diretamente.**

```tsx
{/* ✅ CORRETO: deixar o componente gerenciar as animações */}
<Dialog>
  <DialogContent>Conteúdo</DialogContent>
</Dialog>

{/* ❌ INCORRETO: sobrescrever as animações do componente */}
<DialogContent style={{ animation: 'none', transition: 'none' }}>
  Conteúdo
</DialogContent>
```

### Acessibilidade: prefers-reduced-motion

**Obrigatório** para qualquer animação adicionada fora dos componentes do design system:

```css
/* Reset global de tokens — já deve estar presente */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Para animações específicas de um componente, guarde a transição atrás da media query:

```css
/* A animação só ocorre se o usuário não preferir movimento reduzido */
@media (prefers-reduced-motion: no-preference) {
  .nds-animated {
    transition: all var(--duration-base) var(--ease-standard);
  }
}
```

### Checklist de Motion

Ao adicionar qualquer transição ou animação:

- [ ] Usa a escada de tokens (`--duration-*` + `--ease-*` de motion.css)
- [ ] Respeita `prefers-reduced-motion` (media query `reduce`)
- [ ] Não sobrescreve animações dos componentes do design system
- [ ] Loading usa apenas os padrões aprovados (pulse do Skeleton ou `.nds-animate-spin` no ícone)
- [ ] Nenhuma animação tem duração superior a 500ms em fluxos de uso frequente

---

## Charts e Gráficos

### Tokens de Cores

```css
--chart-1: 207 88% 68%;
--chart-2: 220 44% 57%;
--chart-3: 13 100% 68%;
--chart-4: 36 100% 79%;
--chart-5: 165 35% 48%;
```

### Uso com Recharts

```tsx
import { BarChart, Bar } from 'recharts';

<BarChart data={data}>
  <Bar dataKey="value1" fill="hsl(var(--chart-1))" />
  <Bar dataKey="value2" fill="hsl(var(--chart-2))" />
  <Bar dataKey="value3" fill="hsl(var(--chart-3))" />
</BarChart>
```

---

## Tokens de Componente — o padrão de duas camadas

Um componente consome cor, raio e dimensão por **duas camadas de token**, com
papéis diferentes. O Alert é o exemplo canônico:

```css
/* Camada 1 — TEMA (docs/shared/themes/default.css) */
--radius-alert: var(--radius-lg);        /* o tema tem contrato de variar isto */

/* Camada 2 — VAR INTERNA (docs/shared/styles/nds/alert.css) */
.nds-alert {
  --alert-bg: hsl(var(--card));          /* default PERSEGUE o tema */
  --alert-fg: hsl(var(--card-foreground));
  background-color: var(--alert-bg);
}
.nds-alert-destructive {
  --alert-bg: hsl(var(--destructive) / 0.1);   /* variante re-aponta, não redeclara */
}
```

### Quando usar cada camada

| Camada | Vive em | Use quando |
|---|---|---|
| Token de tema (`--radius-<comp>`) | `themes/*.css` | o TEMA tem contrato de variar o valor (raio, densidade) |
| Var interna (`--<comp>-bg/fg/…`) | `nds/<comp>.css`, no seletor raiz | variantes re-apontam o valor, e o default deve seguir a paleta |

O ganho da var interna é duplo: a variante troca N propriedades re-apontando
2–3 vars, e **um tema que muda `--card` recolore todo Alert sem saber que Alert
existe**. É por isso que um tema completo tem ~20 linhas.

### Regras

1. **Var interna SEMPRE tem default perseguindo token de tema** —
   `--alert-bg: hsl(var(--card))`, nunca valor cru.
2. **O override é ESCOPADO, nunca em `:root`**: como a var é declarada no
   próprio elemento, a declaração dele vence a herdada. Customização é
   `.meu-tema .nds-alert { --alert-bg: … }`.
3. **Toda var interna é documentada na seção Tokens da docs page**, com o
   escopo de override no `customizationCode`. Var não documentada é superfície
   de customização invisível — o `audit.mjs` acusa
   (`undocumented_component_var`).
4. **Temas não declaram vars internas.** Elas não constam de `themes/*.css`;
   quem quiser customizar componente específico o faz escopado, por cima do
   tema.

CSS utilitário sem docs page própria (`layout.css`, `pill.css`) documenta as
vars nas foundation pages correspondentes.

---

## Validação de Design Tokens

### Checklist de Implementação

Ao criar/editar componentes, verifique:

- [ ] ✅ Cores usam variáveis CSS (ex: `bg-background`, `text-foreground`)
- [ ] ✅ Tipografia usa elementos HTML padrão (`<h1>`, `<p>`) ou escalas semânticas `.nds-text-*`, sem tamanhos arbitrários
- [ ] ✅ Espaçamento usa múltiplos de 8px
- [ ] ✅ Bordas usam `border-border` ou variantes temáticas
- [ ] ✅ Focus states têm `ring-2 ring-ring ring-offset-2`
- [ ] ✅ Variável `--ring` está com 100% de opacidade
- [ ] ✅ Cards usam `bg-card text-card-foreground`
- [ ] ✅ Dialogs/modals usam `bg-card`
- [ ] ✅ Nenhum valor hardcoded (ex: `#ffffff`, `rgb(0,0,0)`)
- [ ] ✅ Transições usam `duration-150`, `duration-300` ou `duration-500`
- [ ] ✅ Animações têm `motion-reduce:transition-none` ou `motion-reduce:animate-none`
- [ ] ✅ Animações dos componentes do design system não foram sobrescritas
- [ ] ✅ Container usa `max-w-4xl` (docs) ou `max-w-6xl` (showcase) — nunca largura arbitrária
- [ ] ✅ Grids de múltiplas colunas são mobile-first (base: 1 coluna, `md`/`lg`: mais colunas)
- [ ] ✅ Gap usa `gap-2`, `gap-4` ou `gap-6` conforme densidade do contexto
- [ ] ✅ Colunas flex com texto têm `min-w-0` para evitar overflow
- [ ] ✅ Tabelas têm wrapper `overflow-x-auto` para scroll horizontal em mobile
- [ ] ✅ Estrutura da página usa elementos semânticos (`<header>`, `<main>`, `<section>`)

---

## Exemplos Completos

### Página de Documentação Completa

```tsx
import React from 'react';
import { ComponentDemo } from '../ComponentDemo';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';

export function ExampleDocs() {
  return (
    <div className="flex-1 h-full overflow-auto">
      <div className="p-8 max-w-4xl mx-auto space-y-12">
        
        <header className="space-y-4">
          <Badge variant="outline" className="border-primary/20 text-primary">
            Categoria
          </Badge>
          <h1>Exemplo de Componente</h1>
          <p className="text-muted-foreground">
            Demonstração completa de uso de design tokens
          </p>
        </header>

        <section className="space-y-4">
          <h2>Demonstração</h2>
          <ComponentDemo>
            <Card className="bg-card text-card-foreground border-border">
              <CardContent className="p-6">
                <p>Conteúdo do card usando tokens</p>
              </CardContent>
            </Card>
          </ComponentDemo>
        </section>

        {/* Notas e Dicas — padrão canônico: 12-documentacao-componentes.md, seção 14 */}
        <section>
          <h2 className="mb-4">Notas e Dicas</h2>
          <ComponentDemo>
            <div className="text-sm text-muted-foreground space-y-4">
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground">Sempre use variáveis CSS para cores</p>
                  <p>Utilize tokens como <code>bg-primary</code> e <code>text-foreground</code> em vez de valores hardcoded.</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground">Não use cores hardcoded</p>
                  <p>Evite <code>#ffffff</code>, <code>rgb(0,0,0)</code> ou qualquer valor fora do sistema de tokens.</p>
                </div>
              </div>
            </div>
          </ComponentDemo>
        </section>

      </div>
    </div>
  );
}
```

---

## Resumo Executivo

### DO ✅
- Usar variáveis CSS para TODAS as cores
- Usar elementos HTML padrão para tipografia
- Aplicar focus-visible em componentes interativos
- Manter `--ring` com 100% de opacidade
- Usar múltiplos de 8px para espaçamento
- Preservar estrutura de 15 seções em páginas de documentação (conforme `12-documentacao-componentes.md`)
- Aplicar estilo padronizado em "Notas e Dicas"
- Usar `duration-150/300/500` mapeados aos tokens `--transition-*`
- Adicionar `motion-reduce:transition-none` em transições customizadas
- Deixar os componentes do design system gerenciarem suas próprias animações
- Usar `max-w-4xl` para docs e `max-w-6xl` para showcases
- Construir grids mobile-first: base 1 coluna, expandir em `md` e `lg`
- Usar `grid` para colunas de tamanho previsível, `flex` para alinhamento linear
- Adicionar `min-w-0` em colunas flex que contêm texto ou conteúdo dinâmico
- Usar elementos semânticos (`<header>`, `<main>`, `<section>`, `<nav>`) na estrutura de página

### DON'T ❌
- Usar valores hardcoded de cores
- Usar tamanhos de tipografia arbitrários sem solicitação
- Omitir focus-visible
- Usar opacidade em `--ring` (ex: `/50`)
- Modificar componentes em `/components/ui`
- Alterar estrutura de design tokens sem documentar
- Criar animações CSS novas para loading (usar apenas `animate-pulse` e `animate-spin`)
- Sobrescrever animações de componentes do design system com `animation: none` ou `transition: none`
- Usar durações acima de 500ms em fluxos de uso frequente
- Usar `max-w-*` arbitrário fora dos containers canônicos (`max-w-4xl`, `max-w-6xl`)
- Usar `order-*` para reordenar visualmente sem reordenar no DOM
- Omitir `overflow-x-auto` em tabelas dentro de containers de largura fixa

---

**Referência Rápida de Tokens**:
- Cores: `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`, `--success`, `--warning`, `--info`
- Superfícies: `--card`, `--popover`, `--input-background`
- Bordas: `--border`, `--input`, `--ring`
- Tipografia: `--text-h1` a `--text-label`, `--font-weight-*`
- Raios: `--radius`, `--radius-button`, `--radius-card`
- Motion: `--duration-instant/fast/base/moderate/slow/stately` (0–800ms), `--ease-standard/emphasis/entrance/exit`