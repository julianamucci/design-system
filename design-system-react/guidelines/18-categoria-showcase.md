# 18. Categoria Showcase - Estrutura e Instruções de Replicação

## Visão Geral

Cada categoria de componentes (Layout, Navigation, Form, Feedback, Display, Disclosure, Overlay) deve ter uma página "Showcase" dedicada que apresenta **todas as variantes** de todos os componentes da categoria em uma única página navegável.

## Propósito

- **Visualização Rápida**: Permite ver todas as variantes de componentes em um só lugar
- **Comparação**: Facilita comparar diferentes estilos e configurações lado a lado
- **Referência Visual**: Serve como guia visual completo da categoria
- **Demonstração Prática**: Mostra exemplos reais de uso combinado dos componentes

## Estrutura Obrigatória

### 1. Nome do Arquivo
```
/components/docs/[Categoria]ShowcaseDocs.tsx
```

**Exemplos:**
- `/components/docs/LayoutShowcaseDocs.tsx` ✅
- `/components/docs/NavigationShowcaseDocs.tsx` ✅
- `/components/docs/FormShowcaseDocs.tsx` ✅
- `/components/docs/FeedbackShowcaseDocs.tsx` ✅
- `/components/docs/DisplayShowcaseDocs.tsx` ✅
- `/components/docs/DisclosureShowcaseDocs.tsx` ✅
- `/components/docs/OverlayShowcaseDocs.tsx` ✅

### 2. Função Exportada
```typescript
export function [Categoria]ShowcaseDocs() { ... }
```

### 3. Container Principal
```tsx
<div className="flex-1 h-full">
  <div className="p-8 space-y-12 max-w-6xl mx-auto">
    {/* Conteúdo */}
  </div>
</div>
```

**Detalhes:**
- `flex-1 h-full` → Container full height responsivo
- `p-8` → Padding consistente de 2rem (32px)
- `space-y-12` → Espaçamento de 3rem (48px) entre seções
- `max-w-6xl mx-auto` → Largura máxima de 72rem (1152px) centralizada

### 4. Header da Página

```tsx
<header>
  <h1>[Categoria] Components - Showcase</h1>
  <p className="text-muted-foreground">
    Visualização completa de todas as variantes dos componentes de [Categoria] em uma única página.
  </p>
</header>
```

**Regras:**
- ❌ **NÃO** usar classes de tipografia (text-*, font-*, leading-*)
- ✅ Usar apenas `text-muted-foreground` para descrição
- ✅ Texto deve ser descritivo e objetivo

### 5. Separator Inicial

```tsx
<Separator />
```

**Obrigatório após o header** para separar visualmente do conteúdo.

## Estrutura de Seções (Para Cada Componente)

### Padrão de Seção

```tsx
<section className="space-y-6">
  <div>
    <h2 className="mb-2">[Nome do Componente]</h2>
    <p className="text-sm text-muted-foreground">
      [Descrição breve do que é mostrado nesta seção]
    </p>
  </div>

  <ComponentDemo>
    <div className="space-y-6">
      {/* Variante 1 */}
      <div>
        <h4 className="mb-2">[Nome da Variante]</h4>
        {/* Demonstração da variante */}
      </div>

      {/* Variante 2 */}
      <div>
        <h4 className="mb-3">[Nome da Variante]</h4>
        {/* Demonstração da variante */}
      </div>

      {/* ... mais variantes */}
    </div>
  </ComponentDemo>
</section>

<Separator />
```

### Detalhes da Estrutura

#### 1. Container da Seção
```tsx
<section className="space-y-6">
```
- `space-y-6` → Espaçamento de 1.5rem (24px) entre elementos

#### 2. Cabeçalho da Seção
```tsx
<div>
  <h2 className="mb-2">[Nome do Componente]</h2>
  <p className="text-sm text-muted-foreground">
    [Descrição]
  </p>
</div>
```

**Regras:**
- `mb-2` → Margem bottom de 0.5rem (8px) no h2
- `text-sm` → Única classe de tamanho permitida (0.875rem / 14px)
- `text-muted-foreground` → Cor para texto secundário

#### 3. ComponentDemo Wrapper
```tsx
<ComponentDemo>
  <div className="space-y-6">
    {/* Variantes */}
  </div>
</ComponentDemo>
```

**Propósito:**
- Envolve as demonstrações visuais
- Fornece fundo e estilo consistente
- `space-y-6` entre variantes

#### 4. Container de Variante
```tsx
<div>
  <h4 className="mb-2">[Nome da Variante]</h4>
  {/* ou */}
  <h4 className="mb-3">[Nome da Variante]</h4>
  
  {/* Demonstração */}
</div>
```

**Margem Bottom:**
- `mb-2` → Para títulos de variantes simples
- `mb-3` → Para títulos de variantes com conteúdo mais complexo

#### 5. Separator Entre Seções
```tsx
<Separator />
```

**Obrigatório:**
- Separador visual entre cada seção de componente
- ❌ **NÃO** colocar após a última seção antes do "Exemplo Combinado"

## Seção Final: Exemplo Combinado

**Obrigatório em todas as páginas Showcase:**

```tsx
<Separator />

<section className="space-y-6">
  <div>
    <h2 className="mb-2">Exemplo Combinado</h2>
    <p className="text-sm text-muted-foreground">
      Demonstração de múltiplos componentes de [Categoria] trabalhando juntos
    </p>
  </div>

  <ComponentDemo>
    {/* 
      Layout complexo demonstrando integração real 
      de vários componentes da categoria
    */}
  </ComponentDemo>
</section>
```

**Propósito:**
- Mostrar como os componentes funcionam juntos
- Exemplo prático de aplicação real
- Demonstrar interoperabilidade

## Quantidade de Variantes

### Mínimo por Componente
- **Pelo menos 3 variantes** diferentes de cada componente
- Mais variantes para componentes complexos

### Exemplos de Variantes Comuns

**Aspect Ratio:**
- 1:1 (Square)
- 4:3 (Standard)
- 16:9 (Widescreen)
- 3:2 (Fotografia)
- 21:9 (Ultrawide)
- 9:16 (Vertical)

**Card:**
- Card Completo (Header + Content + Footer)
- Apenas Conteúdo
- Sem Footer
- Card Interativo (hover)

**Resizable:**
- Handle Padrão
- Handle com Indicador
- Handle Customizado

**ScrollArea:**
- ScrollArea Horizontal
- ScrollArea com Borda Customizada
- ScrollArea Compacto

**Separator:**
- Orientação Horizontal (Padrão)
- Orientação Vertical
- Com Espaçamento Customizado
- Com Estilo Customizado

## Layouts de Grid para Variantes

> **Nota sobre gap**: Pages Showcase usam `gap-4` (16px) para grids de variantes — contexto compacto, adequado para comparação visual lado a lado. Grids de cards de feature em páginas de documentação regulares usam `gap-6` (24px), conforme definido no arquivo `16-padroes-design-sistema.md`.

### Grid Responsivo (Ideal para múltiplas variantes)
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Variantes */}
</div>
```

### Space-y (Ideal para variantes empilhadas)
```tsx
<div className="space-y-6">
  {/* Variantes */}
</div>
```

### Flex com Gap (Ideal para alinhamento horizontal)
```tsx
<div className="flex gap-4">
  {/* Variantes */}
</div>
```

## Regras de Estilos

### ✅ Classes CSS Permitidas

**Container e Layout:**
- `flex`, `flex-1`, `flex-col`, `flex-row`
- `grid`, `grid-cols-*`
- `space-y-*`, `space-x-*`
- `gap-*`
- `p-*`, `px-*`, `py-*`, `pt-*`, `pb-*`, `pl-*`, `pr-*`
- `m-*`, `mx-*`, `my-*`, `mt-*`, `mb-*`, `ml-*`, `mr-*`
- `w-*`, `h-*`, `max-w-*`, `max-h-*`, `min-w-*`, `min-h-*`

**Cores e Background:**
- `bg-muted`, `bg-primary`, `bg-card`, `bg-background`
- `bg-gradient-to-*`
- `text-muted-foreground`, `text-foreground`, `text-primary`, `text-white`
- `border`, `border-*`

**Interação e Estados:**
- `hover:*`, `focus:*`, `active:*`
- `transition-*`, `cursor-*`

**Posicionamento:**
- `items-*`, `justify-*`, `self-*`
- `relative`, `absolute`, `fixed`, `sticky`

**Tamanho de Texto (APENAS text-sm):**
- `text-sm` ✅ (única classe de tamanho permitida)

### ❌ Classes CSS PROIBIDAS

**Tipografia (Guideline 01):**
- ❌ `text-xs`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, etc.

- ❌ `leading-none`, `leading-tight`, `leading-snug`, `leading-normal`, `leading-relaxed`, `leading-loose`
- ✅ **EXCEÇÃO**: `text-sm` é permitido

## Integração com App.tsx

### 1. Importar o Componente
```typescript
import { [Categoria]ShowcaseDocs } from './components/docs/[Categoria]ShowcaseDocs';
```

### 2. Adicionar no Array de Categorias
```typescript
{
  name: "[Categoria]",
  icon: [IconeRelevante],
  items: [
    { 
      name: "[Categoria] Showcase", 
      path: "[categoria]-showcase", 
      component: [Categoria]ShowcaseDocs 
    },
    // ... outros componentes da categoria
  ]
}
```

**Regras:**
- Showcase deve ser **sempre o primeiro item** da categoria
- Path deve seguir padrão kebab-case: `[categoria]-showcase`
- Nome deve seguir padrão: `[Categoria] Showcase`

## Exemplos de Paths e Nomes por Categoria

| Categoria | Path | Nome | Componente |
|-----------|------|------|------------|
| Layout | `layout-showcase` | `Layout Showcase` | `LayoutShowcaseDocs` |
| Navigation | `navigation-showcase` | `Navigation Showcase` | `NavigationShowcaseDocs` |
| Form | `form-showcase` | `Form Showcase` | `FormShowcaseDocs` |
| Feedback | `feedback-showcase` | `Feedback Showcase` | `FeedbackShowcaseDocs` |
| Display | `display-showcase` | `Display Showcase` | `DisplayShowcaseDocs` |
| Disclosure | `disclosure-showcase` | `Disclosure Showcase` | `DisclosureShowcaseDocs` |
| Overlay | `overlay-showcase` | `Overlay Showcase` | `OverlayShowcaseDocs` |

## Template Base para Novas Páginas Showcase

```tsx
import React from 'react';
import { ComponentDemo } from '../ComponentDemo';
import { Separator } from '../ui/separator';
// Importar componentes da categoria

export function [Categoria]ShowcaseDocs() {
  return (
    <div className="flex-1 h-full">
      <div className="p-8 space-y-12 max-w-6xl mx-auto">
        <header>
          <h1>[Categoria] Components - Showcase</h1>
          <p className="text-muted-foreground">
            Visualização completa de todas as variantes dos componentes de [Categoria] em uma única página.
          </p>
        </header>

        <Separator />

        {/* Seção Componente 1 */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-2">[Nome Componente 1]</h2>
            <p className="text-sm text-muted-foreground">
              [Descrição do componente]
            </p>
          </div>

          <ComponentDemo>
            <div className="space-y-6">
              {/* Variantes */}
            </div>
          </ComponentDemo>
        </section>

        <Separator />

        {/* Repetir para cada componente da categoria */}

        <Separator />

        {/* Seção Final: Exemplo Combinado */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-2">Exemplo Combinado</h2>
            <p className="text-sm text-muted-foreground">
              Demonstração de múltiplos componentes de [Categoria] trabalhando juntos
            </p>
          </div>

          <ComponentDemo>
            {/* Layout complexo integrando componentes */}
          </ComponentDemo>
        </section>
      </div>
    </div>
  );
}
```

## Checklist de Implementação

### Estrutura
- [ ] Nome do arquivo segue padrão: `[Categoria]ShowcaseDocs.tsx`
- [ ] Função exportada segue padrão: `export function [Categoria]ShowcaseDocs()`
- [ ] Container principal usa: `flex-1 h-full` + `p-8 space-y-12 max-w-6xl mx-auto`
- [ ] Header com título e descrição
- [ ] Separator após o header

### Seções
- [ ] Uma seção para cada componente da categoria
- [ ] Header da seção com h2 + descrição text-sm
- [ ] Cada seção envolve variantes em `<ComponentDemo>`
- [ ] Pelo menos 3 variantes por componente
- [ ] Titles de variantes usam h4 com mb-2 ou mb-3
- [ ] Separator entre cada seção

### Seção Final
- [ ] Separator antes da seção "Exemplo Combinado"
- [ ] Seção "Exemplo Combinado" está presente
- [ ] Exemplo combinado mostra integração real

### Guidelines
- [ ] ❌ Nenhuma classe de tipografia proibida (text-*, font-*, leading-*)
- [ ] ✅ Exceção: text-sm é permitida
- [ ] ✅ Usa text-muted-foreground para textos secundários
- [ ] ✅ Segue padrão de espaçamento (space-y-12, space-y-6)
- [ ] ✅ Usa variáveis CSS do design system

### Integração
- [ ] Importado corretamente em App.tsx
- [ ] Adicionado como **primeiro item** da categoria
- [ ] Path segue padrão kebab-case
- [ ] Nome segue padrão: "[Categoria] Showcase"

## Ordem de Apresentação

### Dentro de Cada Seção de Componente

1. **Variantes Básicas** → Começar com exemplos simples
2. **Variantes Estilizadas** → Mostrar customizações
3. **Variantes Interativas** → Demonstrar estados (hover, focus, etc.)
4. **Variantes Complexas** → Exemplos avançados

### Ordem das Seções de Componentes

Seguir a **ordem alfabética dos componentes**, exceto quando houver dependência lógica.

**Exemplo (Layout):**
1. Aspect Ratio
2. Card
3. Resizable
4. ScrollArea
5. Separator
6. [Sidebar - se existir]

## Dicas de Implementação

### 1. Iteração com Arrays
Para múltiplos itens similares:
```tsx
{Array.from({ length: 10 }, (_, i) => (
  <div key={i}>Item {i + 1}</div>
))}
```

### 2. Dados Mock
Use dados realistas para demonstrações:
```tsx
const menuItems = ['Dashboard', 'Analytics', 'Reports', 'Settings'];
```

### 3. Responsive Design
Sempre considere breakpoints:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 4. Estados Visuais
Demonstre interatividade:
```tsx
<Card className="hover:shadow-md transition-shadow motion-reduce:transition-none cursor-pointer">
```

### 5. Cores do Design System
Use apenas variáveis do sistema:
```tsx
bg-muted, bg-primary, text-muted-foreground, border-border
```

## Manutenção

### Quando Adicionar Novo Componente à Categoria

1. Criar nova seção seguindo o padrão
2. Adicionar pelo menos 3 variantes
3. Atualizar "Exemplo Combinado" se relevante
4. Inserir na posição alfabética correta

### Quando Atualizar Variantes

1. Manter pelo menos 3 variantes
2. Garantir que exemplos sejam práticos e úteis
3. Documentar casos de uso reais

## Exemplos Práticos

### Bom ✅

```tsx
<section className="space-y-6">
  <div>
    <h2 className="mb-2">Button</h2>
    <p className="text-sm text-muted-foreground">
      Diferentes variantes e tamanhos para ações do usuário
    </p>
  </div>

  <ComponentDemo>
    <div className="space-y-6">
      <div>
        <h4 className="mb-2">Variantes Padrão</h4>
        <div className="flex gap-2">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>
    </div>
  </ComponentDemo>
</section>
```

### Ruim ❌

```tsx
<section>
  {/* ❌ Faltou space-y-6 */}
  <div>
    <h2 className="mb-4 text-2xl font-bold">Button</h2>
    {/* ❌ Classes de tipografia proibidas */}
    <p className="text-base leading-relaxed">
      {/* ❌ Classes proibidas */}
      Diferentes variantes
    </p>
  </div>

  {/* ❌ Faltou ComponentDemo wrapper */}
  <div>
    <h4 className="text-lg font-medium">Variantes</h4>
    {/* ❌ Classes proibidas */}
    <Button>Default</Button>
  </div>
</section>
```

## Resumo das Regras Críticas

1. ✅ **Estrutura consistente**: Header → Separator → Seções → Separators → Exemplo Combinado
2. ✅ **Espaçamentos padronizados**: space-y-12 (seções), space-y-6 (variantes)
3. ✅ **Wrapper obrigatório**: `<ComponentDemo>` para demonstrações
4. ✅ **Mínimo 3 variantes** por componente
5. ✅ **Seção "Exemplo Combinado"** obrigatória ao final
6. ❌ **Sem classes de tipografia** exceto `text-sm`
7. ✅ **Primeiro item da categoria** no App.tsx
8. ✅ **Usar apenas variáveis CSS** do design system

---

**Esta guideline deve ser seguida OBRIGATORIAMENTE ao criar qualquer página Showcase de categoria.**