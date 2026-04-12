# Arquitetura do Projeto - Shadcn/UI Documentation

Este documento descreve a arquitetura técnica, estrutura de pastas e padrões organizacionais do projeto de documentação Shadcn/UI.

---

## Estrutura de Diretórios

```
/
├── App.tsx                          # Entry point e roteamento principal
├── styles/
│   └── globals.css                  # Design system, variáveis CSS, temas
├── components/
│   ├── HomePage.tsx                 # Página inicial
│   ├── ComponentDemo.tsx            # Wrapper para demos de componentes
│   ├── ThemeSelector.tsx            # Seletor de temas (default/Tema Personalizado)
│   ├── figma/
│   │   └── ImageWithFallback.tsx    # Componente protegido para imagens
│   ├── ui/                          # Componentes Shadcn/UI base
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── sidebar.tsx
│   │   └── ...                      # 40+ componentes base
│   └── docs/                        # Páginas de documentação
│       ├── AccordionDocs.tsx
│       ├── ButtonDocs.tsx
│       ├── CardDocs.tsx
│       ├── DesignTokensDocs.tsx
│       ├── ThemingDocs.tsx
│       └── ...                      # 50+ páginas de documentação
└── guidelines/                      # Guidelines e padrões do projeto
    ├── Guidelines.md                # Índice principal
    ├── 01-regras-gerais.md
    ├── 02-jsx-caracteres-especiais.md
    ├── 03-sistema-design.md
    ├── 04-layout-components.md
    ├── 05-navigation-components.md
    ├── 06-form-components.md
    ├── 07-feedback-components.md
    ├── 08-display-components.md
    ├── 09-disclosure-components.md
    ├── 10-overlay-components.md
    ├── 11-acessibilidade.md
    ├── 12-documentacao-componentes.md
    ├── 13-alinhamento-botoes.md
    ├── 14-edicoes-parciais.md
    └── 15-arquitetura-projeto.md    # Este arquivo
```

---

## Componentes Principais

### 1. App.tsx - Entry Point

**Responsabilidades**:
- Gerenciamento de roteamento baseado em estado (`currentPage`)
- Controle de tema claro/escuro (`isDark`)
- Controle de tema personalizado (`currentTheme`: default | tema-personalizado)
- Renderização da sidebar e conteúdo principal
- Aplicação de classes de tema no `<html>`

**Estrutura**:
```tsx
<SidebarProvider>
  <Sidebar>
    <SidebarHeader />     {/* Logo e título */}
    <SidebarContent>      {/* Navegação por categorias */}
      <Accordion>         {/* Categorias colapsáveis */}
        {/* Componentes por categoria */}
      </Accordion>
      <ThemeSelector />   {/* Seletor de tema */}
    </SidebarContent>
  </Sidebar>
  
  <SidebarInset>
    <header />            {/* Toggle dark/light mode */}
    <div>                 {/* Área de conteúdo principal */}
      {renderCurrentPage()}
    </div>
  </SidebarInset>
</SidebarProvider>
```

**Categorias de Componentes**:
1. **Foundations** (Sparkles) - Design Tokens, Theming, Icons, Utils
2. **Layout** (LayoutGrid) - Aspect Ratio, Card, Resizable, Scroll Area, Separator, Sidebar
3. **Navigation** (MousePointer) - Breadcrumb, Menubar, Navigation Menu, Pagination, Stepper, Tabs
4. **Form** (FileText) - Button, Calendar, Checkbox, Form, Input, Label, Radio Group, Select, Slider, Switch, Textarea, Toggle
5. **Feedback** (MessageSquare) - Alert, Alert Dialog, Badge, Progress, Skeleton, Sonner
6. **Display** (Palette) - Avatar, Carousel, Chart, Table
7. **Overlay** (Settings) - Command, Context Menu, Dialog, Drawer, Dropdown Menu, Hover Card, Popover, Sheet, Tooltip
8. **Utilities** (Database) - Accordion, Collapsible, useIsMobile

---

### 2. HomePage.tsx - Landing Page

**Responsabilidades**:
- Apresentação do projeto
- Destaque de componentes populares
- Guia de navegação para novos usuários
- CTAs para exploração da documentação

**Seções**:
1. Header com logo e descrição
2. "Por que usar Shadcn/UI?" (3 cards: Rápido, Personalizável, Acessível)
3. Componentes Populares (grid de 6 componentes)
4. Como Navegar na Documentação (4 etapas)
5. CTA final

---

### 3. ComponentDemo.tsx - Wrapper para Demos

**Responsabilidades**:
- Container padronizado para demonstrações de componentes
- Aplicação de estilos consistentes
- Centralização e espaçamento adequado

**Uso**:
```tsx
<ComponentDemo>
  <Button>Exemplo</Button>
</ComponentDemo>
```

---

### 4. ThemeSelector.tsx - Seletor de Temas

**Responsabilidades**:
- Seleção entre tema "default" e "Tema Personalizado"
- UI dropdown usando Select do Shadcn/UI
- Callback para atualização de tema no App.tsx

**Props**:
```tsx
interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}
```

---

### 5. /components/ui/* - Componentes Base Shadcn/UI

**Características**:
- Componentes reutilizáveis baseados em Radix UI
- Estilizados com Tailwind CSS e variáveis CSS personalizadas
- **NUNCA** devem ser substituídos ou sobrescritos
- Sempre importados das páginas de documentação

**Importação Padrão**:
```tsx
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardContent } from "./components/ui/card";
```

---

### 6. /components/docs/* - Páginas de Documentação

**Estrutura Padrão** (conforme template em `12-documentacao-componentes.md`):

Cada página de documentação DEVE seguir **15 seções obrigatórias**, organizadas em 4 blocos. Consulte o arquivo `12-documentacao-componentes.md` para o template completo de cada seção.

```tsx
export function ComponentDocs() {
  return (
    <div className="flex-1 h-full overflow-auto">
      <div className="p-8 max-w-4xl mx-auto space-y-12">

        {/* Bloco 1 — Visão Geral */}
        {/* 1. Header */}
        {/* 2. Demonstração Padrão */}
        {/* 3. Anatomia */}
        {/* 4. Quando e Como Usar */}
        {/* 5. Do & Don't */}

        {/* Bloco 2 — Referência Técnica */}
        {/* 6. Importação */}
        {/* 7. Exemplos de Código */}
        {/* 8. Variantes */}
        {/* 9. Estados */}
        {/* 10. Propriedades */}
        {/* 11. Design Tokens */}

        {/* Bloco 3 — Contexto e Orientação */}
        {/* 12. Acessibilidade */}
        {/* 13. Componentes Relacionados */}
        {/* 14. Notas e Dicas */}

        {/* Bloco 4 — Qualidade */}
        {/* 15. Critérios de Teste */}

      </div>
    </div>
  );
}
```

**Regras das Páginas de Documentação**:
- Wrapper externo: `className="flex-1 h-full overflow-auto"`
- Container interno: `className="p-8 max-w-4xl mx-auto space-y-12"`
- As 15 seções seguem o template canônico definido em `12-documentacao-componentes.md`
- Seção "Notas e Dicas" usa ícones `CheckCircle2` (dicas) e `XCircle` (avisos) do lucide-react — ver padrão completo no arquivo 12

---

## Sistema de Roteamento

### Roteamento Baseado em Estado

O projeto NÃO usa React Router ou similar. O roteamento é gerenciado por estado local:

```tsx
const [currentPage, setCurrentPage] = useState('home');

const renderCurrentPage = () => {
  if (currentPage === 'home') return <HomePage />;
  
  for (const category of componentCategories) {
    const component = category.items.find(item => item.path === currentPage);
    if (component) {
      return <component.component />;
    }
  }
  
  return <HomePage />;
};
```

**Paths de Componentes**:
- `home` → HomePage
- `button` → ButtonDocs
- `card` → CardDocs
- `design-tokens` → DesignTokensDocs
- etc.

**Complexidade**: O(n) onde n = número total de componentes (~60)

**Por que não React Router?** Veja detalhes no arquivo `17-system-design.md`.

---

## Temas e Dark Mode

**Temas Disponíveis**:
1. **default** - Tema padrão do sistema
2. **tema-personalizado** - Tema personalizado Tema Personalizado

**Modos**:
- Light (padrão)
- Dark

**Estado Gerenciado**:
```tsx
const [isDark, setIsDark] = useState(false);
const [currentTheme, setCurrentTheme] = useState('default');
```

**Implementação técnica detalhada**: Consulte o arquivo `17-system-design.md` para detalhes sobre gerenciamento de temas, aplicação de classes CSS e performance.

**Variáveis CSS**: Consulte o arquivo `03-sistema-design.md` para lista completa de tokens disponíveis.

---

## Padrões de Código

### Importações

**Ordem de Imports**:
```tsx
// 1. React e hooks
import React, { useState, useEffect } from 'react';

// 2. Componentes Shadcn/UI
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

// 3. Componentes customizados
import { ComponentDemo } from '../ComponentDemo';

// 4. Ícones Lucide
import { Check, X, Info } from 'lucide-react';

// 5. Tipos e interfaces (se separados)
import type { ComponentProps } from './types';
```

### Convenções de Nomenclatura

**Arquivos**:
- Componentes: `PascalCase.tsx` (ex: `ButtonDocs.tsx`)
- Utilitários: `camelCase.ts` (ex: `utils.ts`)
- Estilos: `kebab-case.css` (ex: `globals.css`)

**Componentes**:
- Function components com export named ou default
- Props com sufixo `Props` (ex: `ButtonProps`)

**CSS**:
- Variáveis CSS: `--kebab-case` (ex: `--primary-foreground`)
- Classes Tailwind: padrão Tailwind

---

## Fluxo de Dados

### Estado Global

**Gerenciado em App.tsx**:
```tsx
const [currentPage, setCurrentPage] = useState('home');
const [isDark, setIsDark] = useState(false);
const [currentTheme, setCurrentTheme] = useState('default');
```

**Propagação**:
- `currentPage`: Controlado por sidebar navigation e HomePage CTAs
- `isDark`: Controlado por toggle no header
- `currentTheme`: Controlado por ThemeSelector na sidebar

### Estado Local

Cada página de documentação gerencia seu próprio estado local (ex: tabs ativas, accordions abertos, formulários).

---

## Performance e Otimização

### Code Splitting
- Componentes carregados dinamicamente via imports no App.tsx
- Cada página de documentação é um componente separado

### Renderização
- Apenas a página ativa é renderizada
- Sidebar sempre montada (280px fixa)
- Conteúdo principal tem scroll independente

### CSS
- Variáveis CSS para temas dinâmicos sem re-renderização
- Tailwind CSS para estilos utilitários
- @layer para organização e prioridade

---

## Acessibilidade

### Navegação por Teclado
- Todos os botões e links focáveis
- Accordions navegáveis por teclado
- Focus visible com `focus-visible:ring-2 focus-visible:ring-ring`

### ARIA
- Roles apropriados em componentes Shadcn/UI
- Labels e descrições para screen readers
- Estados (expanded, selected) gerenciados automaticamente

### Contraste
- WCAG 2.1 AA compliance
- Variável `--ring` com 100% opacidade (sem /50 ou /30)

---

## Convenções de Commits (Recomendadas)

```
feat: Adiciona página de documentação do componente X
fix: Corrige importação de ícones na página Y
docs: Atualiza guidelines de acessibilidade
style: Ajusta estilo visual da seção Notas e Dicas
refactor: Refatora estrutura de ComponentDemo
```

---

## Expansão e Manutenção

### Adicionar Novo Componente

1. **Criar página de documentação**:
   ```tsx
   // /components/docs/NewComponentDocs.tsx
   export function NewComponentDocs() {
     // Seguir template de 15 seções — ver 12-documentacao-componentes.md
   }
   ```

2. **Registrar no App.tsx**:
   ```tsx
   import { NewComponentDocs } from './components/docs/NewComponentDocs';
   
   // Adicionar em componentCategories
   {
     name: "Categoria",
     icon: Icon,
     items: [
       { name: "New Component", path: "new-component", component: NewComponentDocs }
     ]
   }
   ```

3. **Criar guideline (se necessário)**:
   ```md
   # /guidelines/NN-new-component.md
   ```

### Adicionar Novo Tema

1. **Definir variáveis no globals.css**:
   ```css
   /* Seletor obrigatório com prefixo html. */
   html.novo-tema {
     --primary: ...;
     --secondary: ...;
     /* etc — valores em formato HSL sem vírgulas */
   }

   html.novo-tema.dark {
     --primary: ...;
     /* valores para dark mode */
   }
   ```

2. **Atualizar ThemeSelector**:
   ```tsx
   const themes = [
     { value: "default", label: "Default" },
     { value: "tema-personalizado", label: "Tema Personalizado" },
     { value: "novo-tema", label: "Novo Tema" }
   ];
   ```

3. **Atualizar App.tsx**:
   ```tsx
   useEffect(() => {
     document.documentElement.classList.remove('default', 'tema-personalizado', 'novo-tema', 'dark');
     
     if (currentTheme === 'novo-tema') {
       document.documentElement.classList.add('novo-tema');
     }
     // ...
   }, [isDark, currentTheme]);
   ```

---

## Troubleshooting Comum

### Problema: Dupla barra de rolagem
**Causa**: Wrappers aninhados com `overflow-auto`
**Solução**: Apenas o wrapper externo deve ter `overflow-auto`

### Problema: Ícones não aparecem após edição
**Causa**: Imports removidos ao editar seção específica
**Solução**: Seguir guideline 14-edicoes-parciais.md

### Problema: Tema não aplica
**Causa**: Classe não adicionada ao `<html>`
**Solução**: Verificar useEffect no App.tsx e variante CSS

### Problema: Focus ring não aparece
**Causa**: Falta `focus-visible:ring-2 focus-visible:ring-ring`
**Solução**: Adicionar classes obrigatórias de acessibilidade

---

## Referências Técnicas

- **React**: 18+
- **Tailwind CSS**: 4.0
- **Radix UI**: Base dos componentes Shadcn/UI
- **Lucide React**: Biblioteca de ícones
- **TypeScript**: Suporte completo

---

## Resumo Executivo

**Arquitetura**:
- SPA com roteamento baseado em estado
- Sidebar fixa de 280px com categorias
- 8 categorias de componentes
- 50+ páginas de documentação
- Sistema de temas com variáveis CSS

**Estrutura**:
- `/App.tsx` - Entry point
- `/components/ui/*` - Componentes Shadcn/UI (protegidos)
- `/components/docs/*` - Páginas de documentação (15 seções — ver arquivo 12)
- `/styles/globals.css` - Design system e temas
- `/guidelines/*` - Padrões e regras do projeto

**Fluxo**:
1. App.tsx gerencia estado global (página, tema, dark mode)
2. Sidebar renderiza navegação por categorias
3. Conteúdo principal renderiza página ativa
4. Temas aplicados via classes CSS no `<html>`