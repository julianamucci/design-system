# System Design - Arquitetura de Software

Este documento descreve o **System Design** (Design de Sistemas) do projeto, focando em decisões técnicas de arquitetura, performance, escalabilidade e padrões de código avançados.

**Para estrutura de pastas e componentes principais, consulte**: `15-arquitetura-projeto.md`
**Para tokens CSS e padrões visuais, consulte**: `16-padroes-design-sistema.md`

---

## Visão Geral da Arquitetura

### Tipo de Aplicação
- **SPA (Single Page Application)** - Cliente-side rendering
- **Frontend-only** - Sem backend ou servidor
- **Static** - Pode ser deployado em qualquer CDN/hosting estático

### Stack Tecnológica

```
┌─────────────────────────────────────────┐
│         Browser (Cliente)                │
├─────────────────────────────────────────┤
│  React 18+ (UI Framework)               │
│  ├── State Management (useState)        │
│  ├── Effects (useEffect)                │
│  └── Component Composition              │
├─────────────────────────────────────────┤
│  Tailwind CSS 4.0 (Styling)             │
│  ├── Design Tokens (CSS Variables)      │
│  ├── Utility Classes                    │
│  └── Custom Variants                    │
├─────────────────────────────────────────┤
│  Radix UI (Primitivos Acessíveis)       │
│  ├── Accordion, Dialog, Dropdown, etc.  │
│  └── WAI-ARIA Compliance                │
├─────────────────────────────────────────┤
│  Lucide React (Ícones)                  │
│  Recharts (Gráficos)                    │
│  React Hook Form (Formulários)          │
└─────────────────────────────────────────┘
```

---

## Padrão de Composição

**Princípio**: Composition over Inheritance

```tsx
// ✅ CORRETO: Composição de componentes
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>

// ❌ EVITAR: Componente monolítico com muitas props
<Card 
  title="Título"
  description="Descrição"
  content="Conteúdo"
  footer={<Button>Ação</Button>}
/>
```

---

## Gerenciamento de Estado

### Estado Global (App.tsx)

```tsx
// Estado gerenciado no componente raiz
const [currentPage, setCurrentPage] = useState('home');
const [isDark, setIsDark] = useState(false);
const [currentTheme, setCurrentTheme] = useState('default');
```

**Decisão de Design**: 
- ✅ **Não usar Redux, Zustand ou Context API global**
- ✅ **useState no componente raiz é suficiente**
- ✅ **Props drilling é aceitável para 2-3 níveis**

**Justificativa**:
- Projeto simples sem necessidade de state management complexo
- Apenas 3 estados globais
- Performance não é impactada
- Menos dependências = menos complexidade

### Estado Local

Cada página de documentação gerencia seu próprio estado:

```tsx
export function ComponentDocs() {
  // Estado local para controle de UI
  const [activeTab, setActiveTab] = useState('preview');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('default');
  
  // Não polui o estado global
  // Isolado e fácil de testar
}
```

**Regra**: Estado local quando possível, global apenas quando necessário.

---

## Fluxo de Dados

### Unidirecional (Top-down)

```
App.tsx (Source of Truth)
    ↓
  Props
    ↓
Sidebar / SidebarInset
    ↓
  Props / Callbacks
    ↓
Child Components
    ↓
Event Handlers
    ↓
setState (Bubble up via callbacks)
    ↓
App.tsx (Update state)
    ↓
Re-render (Top-down)
```

### Exemplo de Fluxo

```tsx
// 1. App.tsx - Estado inicial
const [currentPage, setCurrentPage] = useState('home');

// 2. Passa callback para Sidebar
<Sidebar onNavigate={setCurrentPage} />

// 3. Sidebar usa callback ao clicar
<Button onClick={() => onNavigate('button')}>
  Button
</Button>

// 4. Estado atualizado em App.tsx
// 5. Re-render com nova página
{renderCurrentPage()} // Renderiza ButtonDocs
```

---

## Roteamento

### Decisão: State-based Routing (Sem React Router)

**Por que não usar React Router?**

❌ **Overkill para este projeto**:
- Apenas navegação interna entre componentes
- Não precisa de URL deep linking
- Não precisa de browser history
- Não precisa de route guards

✅ **Vantagens do State-based**:
- Simples e direto
- Menos dependências
- Mais rápido (sem parsing de URL)
- Menos bundle size
- Controle total sobre navegação

### Implementação

```tsx
const componentCategories = [
  {
    name: "Layout",
    icon: LayoutGrid,
    items: [
      { name: "Card", path: "card", component: CardDocs },
      { name: "Sidebar", path: "sidebar", component: SidebarDocs }
    ]
  }
];

const renderCurrentPage = () => {
  if (currentPage === 'home') return <HomePage />;
  
  for (const category of componentCategories) {
    const component = category.items.find(item => item.path === currentPage);
    if (component) {
      return <component.component />;
    }
  }
  
  return <HomePage />; // Fallback
};
```

**Complexidade**: O(n) onde n = número total de componentes (~60)
**Performance**: Negligível (executa em microsegundos)

---

## Performance e Otimizações

### Estratégias Implementadas

#### 1. Lazy Loading de Componentes

❌ **Não implementado** (Decisão consciente)

**Por quê?**
- Componentes são leves (JSX + algumas variáveis)
- Custo de lazy loading > benefício para componentes pequenos
- Prefetch natural pelo browser
- Melhor DX (Developer Experience)

✅ **Se o projeto crescer (>200 componentes)**:
```tsx
const ButtonDocs = lazy(() => import('./components/docs/ButtonDocs'));
const CardDocs = lazy(() => import('./components/docs/CardDocs'));

// Wrap no renderCurrentPage
<Suspense fallback={<LoadingSpinner />}>
  <component.component />
</Suspense>
```

#### 2. Memoization

**Não usado excessivamente** (Anti-pattern evitado)

```tsx
// ❌ EVITAR: Memoization prematura
const MemoizedComponent = React.memo(SimpleComponent);
const memoizedValue = useMemo(() => value, [deps]);

// ✅ USAR APENAS SE:
// - Componente renderiza frequentemente
// - Cálculos pesados (loops, recursão)
// - Medido e comprovado como bottleneck
```

**Regra de Ouro**: Otimize quando medido, não por suposição.

#### 3. CSS-in-CSS (Tailwind + CSS Variables)

✅ **Benefícios**:
- Atomic CSS = reutilização máxima
- Purge CSS remove classes não usadas
- Variáveis CSS = mudança de tema sem re-render
- Paint performance otimizado

```tsx
// ✅ Mudança de tema sem re-render
document.documentElement.classList.add('dark');
// CSS recalcula cores automaticamente
```

#### 4. Event Handler Optimization

```tsx
// ❌ EVITAR: Arrow function inline (cria nova função a cada render)
<Button onClick={() => setCurrentPage('button')}>

// ✅ MELHOR: Callback estável
<Button onClick={handleNavigate}>

// ✅ ACEITÁVEL: Para projetos pequenos, impacto negligível
// Preferimos DX e legibilidade
```

#### 5. List Rendering

```tsx
// ✅ SEMPRE: key única e estável
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}

// ❌ NUNCA: index como key (se ordem pode mudar)
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}
```

---

## Renderização

### Client-Side Rendering (CSR)

**Estratégia**: Tudo renderizado no cliente

**Trade-offs**:

| Aspecto | CSR (Escolhido) | SSR/SSG (Não usado) |
|---------|-----------------|---------------------|
| **Time to Interactive** | Moderado | Rápido |
| **SEO** | Limitado | Excelente |
| **Complexidade** | Baixa | Alta |
| **Hosting** | Simples (CDN) | Servidor Node.js |
| **Custo** | Baixo | Médio/Alto |

**Decisão**: CSR suficiente para documentação interna/ferramentas

**Se precisar de SEO** (futuro):
- Migrar para Next.js (SSG)
- Gerar HTML estático de todas as páginas
- Manter mesma arquitetura de componentes

---

## Gerenciamento de Temas

### Arquitetura Multi-tema

```
Theme Layer
├── Base Theme (default)
│   ├── Light Mode Variables
│   └── Dark Mode Variables
└── Custom Themes (tema-personalizado, etc.)
    ├── Light Mode Variables
    └── Dark Mode Variables
```

### Implementação Técnica

**1. Definição via CSS Variables**

```css
/* Base — formato HSL obrigatório (sem vírgulas) */
:root {
  --primary: 0 0% 9%;
  --background: 0 0% 100%;
}

/* Dark Mode */
html.dark {
  --primary: 0 0% 98%;
  --background: 0 0% 4%;
}

/* Custom Theme */
html.tema-personalizado {
  --primary: 220 44% 57%;
}

/* Custom Theme + Dark Mode */
html.tema-personalizado.dark {
  --primary: 238 50% 87%;
}
```

> **Formato obrigatório**: variáveis de cor sempre em HSL sem vírgulas (ex: `220 44% 57%`). Seletores de tema sempre com prefixo `html.` (ex: `html.tema-personalizado`). Consulte `16-padroes-design-sistema.md` → "Formato Obrigatório: HSL".

**2. Aplicação via JavaScript**

```tsx
useEffect(() => {
  const root = document.documentElement;
  
  // Remove todos os temas
  root.classList.remove('default', 'tema-personalizado', 'dark');
  
  // Aplica tema selecionado
  if (currentTheme !== 'default') {
    root.classList.add(currentTheme);
  }
  
  // Aplica dark mode
  if (isDark) {
    root.classList.add('dark');
  }
}, [isDark, currentTheme]);
```

**3. Performance**

- ✅ Zero re-render de componentes
- ✅ Apenas CSS recalcula (GPU-optimized)
- ✅ Transição suave com CSS transitions
- ✅ Armazenamento futuro em localStorage

---

## Escalabilidade

### Adicionar Novos Componentes

**Complexidade**: O(1) - Tempo constante

**Processo**:

```tsx
// 1. Criar arquivo de documentação
// /components/docs/NewComponentDocs.tsx
export function NewComponentDocs() {
  return (
    <div className="flex-1 h-full overflow-auto">
      <div className="p-8 max-w-4xl mx-auto space-y-12">
        {/* 15 seções obrigatórias — ver 12-documentacao-componentes.md */}
      </div>
    </div>
  );
}

// 2. Importar no App.tsx
import { NewComponentDocs } from './components/docs/NewComponentDocs';

// 3. Registrar na categoria apropriada
{
  name: "Form",
  icon: FileText,
  items: [
    // ... componentes existentes
    { name: "New Component", path: "new-component", component: NewComponentDocs }
  ]
}
```

**Limites de Escalabilidade**:

| Métrica | Limite Atual | Limite Prático | Solução se Exceder |
|---------|--------------|----------------|-------------------|
| Componentes | ~60 | ~200 | Code splitting, lazy loading |
| Categorias | 8 | ~15 | Subcategorias, search |
| Temas | 2 | ~10 | Theme builder UI |
| Bundle Size | ~500KB | ~2MB | Dynamic imports, tree shaking |

---

## Padrões de Código

### Component Patterns

#### 1. Functional Components (Sempre)

```tsx
// ✅ SEMPRE: Function components
export function ComponentName() {
  return <div>Content</div>;
}

// ❌ NUNCA: Class components
class ComponentName extends React.Component {
  render() {
    return <div>Content</div>;
  }
}
```

#### 2. Named Exports (Páginas) + Default Export (App)

```tsx
// ✅ Páginas de documentação: Named export
export function ButtonDocs() { }

// ✅ App.tsx: Default export (entry point)
export default function App() { }
```

#### 3. Props Typing (TypeScript)

```tsx
// ✅ Interface para props
interface ComponentProps {
  title: string;
  onAction: () => void;
  isActive?: boolean; // Opcional
}

export function Component({ title, onAction, isActive = false }: ComponentProps) {
  // ...
}
```

#### 4. Conditional Rendering

```tsx
// ✅ PREFERIR: Early return
if (!data) return <Loading />;
return <Content data={data} />;

// ❌ EVITAR: Nested ternários profundos
{data ? (
  isLoading ? <Loading /> : hasError ? <Error /> : <Content />
) : <Empty />}
```

---

## Anti-Patterns Evitados

### 1. Props Drilling Excessivo

❌ **Problema**: Passar props por 5+ níveis

```tsx
<App prop={x}>
  <Layout prop={x}>
    <Page prop={x}>
      <Section prop={x}>
        <Component prop={x} /> {/* Finalmente usado aqui */}
      </Section>
    </Page>
  </Layout>
</App>
```

✅ **Solução**: Context API ou composição

```tsx
<ThemeProvider theme={x}>
  <Layout>
    <Page>
      <Section>
        <Component /> {/* Usa useContext(ThemeContext) */}
      </Section>
    </Page>
  </Layout>
</ThemeProvider>
```

### 2. Estado Desnecessário

❌ **Problema**: Estado para valores derivados

```tsx
const [firstName, setFirstName] = useState('John');
const [lastName, setLastName] = useState('Doe');
const [fullName, setFullName] = useState('John Doe'); // ❌ Redundante

// Manter sincronizado é complexo
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

✅ **Solução**: Calcular na renderização

```tsx
const [firstName, setFirstName] = useState('John');
const [lastName, setLastName] = useState('Doe');
const fullName = `${firstName} ${lastName}`; // ✅ Derivado
```

### 3. useEffect para Sincronização

❌ **Problema**: useEffect para estado derivado

```tsx
const [count, setCount] = useState(0);
const [doubleCount, setDoubleCount] = useState(0);

useEffect(() => {
  setDoubleCount(count * 2); // ❌ Anti-pattern
}, [count]);
```

✅ **Solução**: Calcular diretamente

```tsx
const [count, setCount] = useState(0);
const doubleCount = count * 2; // ✅ Simples e correto
```

### 4. Componentes Gigantes

❌ **Problema**: Componente com 500+ linhas

✅ **Solução**: Quebrar em componentes menores

```tsx
// ✅ Componente principal pequeno
export function PageDocs() {
  return (
    <div className="flex-1 h-full overflow-auto">
      <div className="p-8 max-w-4xl mx-auto space-y-12">
        <HeaderSection />
        <DemoSection />
        <GuidelinesSection />
        <ExamplesSection />
        <PropertiesSection />
      </div>
    </div>
  );
}

// Cada seção é um componente separado
function HeaderSection() { }
function DemoSection() { }
```

---

## Decisões Técnicas e Trade-offs

### 1. React vs. Outras Frameworks

**Escolhido**: React 18+

**Alternativas consideradas**:
- Vue.js
- Svelte
- Solid.js

**Razões**:
- ✅ Ecossistema maduro (Radix UI, Recharts)
- ✅ Shadcn/UI é React-native
- ✅ Maior pool de desenvolvedores
- ✅ Melhor integração com Tailwind

### 2. Tailwind vs. CSS-in-JS

**Escolhido**: Tailwind CSS 4.0

**Alternativas consideradas**:
- Styled Components
- Emotion
- CSS Modules

**Razões**:
- ✅ Performance (zero runtime)
- ✅ Bundle size menor
- ✅ Design System via CSS Variables
- ✅ PurgeCSS automático
- ✅ Melhor DX com autocomplete

### 3. State Management

**Escolhido**: useState local

**Alternativas consideradas**:
- Redux Toolkit
- Zustand
- Jotai
- Recoil

**Razões**:
- ✅ Simplicidade
- ✅ Menos boilerplate
- ✅ Estado local suficiente
- ✅ Fácil de entender e manter

### 4. Roteamento

**Escolhido**: State-based routing

**Alternativas consideradas**:
- React Router
- TanStack Router
- Wouter

**Razões**:
- ✅ Sem necessidade de URLs
- ✅ Menos dependências
- ✅ Controle total
- ✅ Mais simples

---

## Segurança

### Frontend Security Checklist

#### 1. XSS Protection

✅ **React escapa automaticamente**:
```tsx
const userInput = "<script>alert('xss')</script>";
<div>{userInput}</div> // Renderiza como texto, não executa
```

❌ **Cuidado com dangerouslySetInnerHTML**:
```tsx
// ❌ NUNCA com input do usuário
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ OK com conteúdo confiável
<div dangerouslySetInnerHTML={{ __html: sanitizedMarkdown }} />
```

#### 2. Dependency Security

✅ **Manter dependências atualizadas**:
```bash
npm audit
npm audit fix
```

✅ **Usar apenas dependências confiáveis**:
- React (oficial)
- Radix UI (mantido)
- Tailwind CSS (mantido)
- Lucide React (mantido)

#### 3. Content Security Policy (Futuro)

```html
<meta 
  http-equiv="Content-Security-Policy" 
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
>
```

---

## Testing Strategy (Recomendado para Produção)

### Pirâmide de Testes

```
        /\
       /  \  E2E (Poucos)
      /----\
     / Unit \ Integration (Médio)
    /--------\
   /   Unit   \ (Muitos)
  /------------\
```

### 1. Unit Tests (Componentes Isolados)

```tsx
// ButtonDocs.test.tsx
import { render, screen } from '@testing-library/react';
import { ButtonDocs } from './ButtonDocs';

test('renderiza título corretamente', () => {
  render(<ButtonDocs />);
  expect(screen.getByText('Button')).toBeInTheDocument();
});
```

**Tools**: Jest + React Testing Library

### 2. Integration Tests (Fluxo de Navegação)

```tsx
// Navigation.test.tsx
test('navegação entre páginas funciona', () => {
  render(<App />);
  
  fireEvent.click(screen.getByText('Button'));
  expect(screen.getByText('Demonstração')).toBeInTheDocument();
  
  fireEvent.click(screen.getByText('Card'));
  expect(screen.getByText('Containers para agrupar conteúdo')).toBeInTheDocument();
});
```

### 3. E2E Tests (Fluxos Críticos)

```typescript
// e2e/theme-switching.spec.ts
test('alternância de tema funciona', async ({ page }) => {
  await page.goto('/');
  
  // Alterna para dark mode
  await page.click('[aria-label="Toggle dark mode"]');
  await expect(page.locator('html')).toHaveClass(/dark/);
  
  // Alterna para Tema Personalizado
  await page.selectOption('[aria-label="Theme selector"]', 'tema-personalizado');
  await expect(page.locator('html')).toHaveClass(/tema-personalizado/);
});
```

**Tools**: Playwright ou Cypress

---

## Monitoramento e Observabilidade (Produção)

### Métricas Importantes

#### 1. Performance Metrics

```typescript
// Measure component render time
const startTime = performance.now();
// Component render
const endTime = performance.now();
console.log(`Render time: ${endTime - startTime}ms`);
```

#### 2. User Analytics

```typescript
// Track page views
analytics.track('PageView', {
  page: currentPage,
  timestamp: Date.now()
});

// Track interactions
analytics.track('ComponentInteraction', {
  component: 'Button',
  action: 'click',
  variant: 'primary'
});
```

**Tools Recomendados**:
- Google Analytics 4
- Plausible (privacy-focused)
- PostHog (open-source)

#### 3. Error Tracking

```typescript
// Error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to error tracking service
    errorTracker.captureException(error, { extra: errorInfo });
  }
}
```

**Tools**: Sentry, LogRocket, BugSnag

---

## Deployment e CI/CD

### Build Process

```bash
# 1. Install dependencies
npm install

# 2. Build (Vite/Create React App/etc)
npm run build

# 3. Output
# dist/
#   ├── index.html
#   ├── assets/
#   │   ├── index-[hash].js
#   │   ├── index-[hash].css
#   │   └── [images]
```

### Deployment Targets

| Platform | Complexidade | Custo | CDN |
|----------|--------------|-------|-----|
| **Vercel** | Baixa | Free/Paid | ✅ |
| **Netlify** | Baixa | Free/Paid | ✅ |
| **GitHub Pages** | Média | Free | ✅ |
| **AWS S3 + CloudFront** | Alta | Pay-as-go | ✅ |
| **Firebase Hosting** | Baixa | Free/Paid | ✅ |

**Recomendação**: Vercel ou Netlify (zero-config)

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## Diagramas de Arquitetura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                        App.tsx                          │
│  - currentPage: string                                  │
│  - isDark: boolean                                      │
│  - currentTheme: string                                 │
│  - renderCurrentPage(): ReactNode                       │
└────────────────┬─────��──────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼────────┐  ┌────▼──────────────────────┐
│   Sidebar      │  │    SidebarInset           │
│                │  │                           │
│ - Categories   │  │  - Header (Dark Toggle)   │
│ - Navigation   │  │  - Content Area           │
│ - ThemeSelector│  │    └─ [Current Page]      │
└────────────────┘  └───────────────────────────┘
```

### Diagrama de Fluxo de Dados

```
┌──────────┐
│  User    │
└────┬─────┘
     │ Click
     ▼
┌─────────────┐
│  Sidebar    │
│  MenuItem   │
└────┬────────┘
     │ onClick(path)
     ▼
┌──────────────────┐
│ setCurrentPage   │
│   (setState)     │
└────┬─────────────┘
     │ Update State
     ▼
┌──────────────────┐
│    App.tsx       │
│  currentPage =   │
│    "button"      │
└────┬─────────────┘
     │ Re-render
     ▼
┌──────────────────┐
│renderCurrentPage │
│   ()             │
└────┬─────────────┘
     │ Returns
     ▼
┌──────────────────┐
│  ButtonDocs      │
│  Component       │
└──────────────────┘
```

### Diagrama de Tema

```
┌─────────────────────┐
│  User Action        │
│  - Toggle Dark Mode │
│  - Select Theme     │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│  setState            │
│  - setIsDark(true)   │
│  - setTheme('mais-  │
│    rotina')          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  useEffect           │
│  - Remove classes    │
│  - Add classes       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  document.           │
│  documentElement     │
│  .classList          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  CSS Recalculate     │
│  - Apply new         │
│    variables         │
│  - GPU Paint         │
└──────────────────────┘
```

---

## Evolução Futura

### Roadmap Técnico

#### Fase 1: Atual (MVP)
- ✅ SPA com roteamento básico
- ✅ Sistema de temas
- ✅ 60+ componentes documentados

#### Fase 2: Melhorias (3-6 meses)
- [ ] Search functionality
- [ ] localStorage para preferências
- [ ] Lazy loading de componentes
- [ ] Code copy-to-clipboard
- [ ] Modo offline (Service Worker)

#### Fase 3: Escala (6-12 meses)
- [ ] SSG com Next.js (para SEO)
- [ ] API de busca (Algolia/Meilisearch)
- [ ] Versionamento de documentação
- [ ] Analytics e tracking
- [ ] A/B testing de UI

#### Fase 4: Plataforma (12+ meses)
- [ ] Backend para user accounts
- [ ] Favoritos e bookmarks
- [ ] Notas personalizadas
- [ ] Compartilhamento de temas
- [ ] Component playground interativo

---

## Resumo Executivo

### Decisões Arquiteturais Principais

| Decisão | Escolha | Alternativa | Razão |
|---------|---------|-------------|-------|
| **Framework** | React 18 | Vue, Svelte | Ecossistema, Shadcn/UI |
| **Styling** | Tailwind CSS 4.0 | CSS-in-JS | Performance, DX |
| **State** | useState local | Redux, Zustand | Simplicidade |
| **Routing** | State-based | React Router | Sem URL necessário |
| **Rendering** | CSR | SSR/SSG | Simplicidade, custo |
| **Icons** | Lucide React | Font Awesome | Leve, tree-shakeable |
| **Components** | Radix UI + Shadcn | Headless UI, MUI | Acessibilidade, customização |

### Métricas de Qualidade

- **Bundle Size**: ~500KB (gzipped: ~150KB)
- **First Contentful Paint**: <1s
- **Time to Interactive**: <2s
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices)
- **Componentes**: 60+
- **Linhas de Código**: ~15,000
- **Dependências**: ~20 (core)

### Princípios de Design

1. **Simplicidade sobre Complexidade**
2. **Developer Experience (DX) importante**
3. **Performance medida, não assumida**
4. **Composição sobre Herança**
5. **Estado local quando possível**
6. **Otimização quando necessário, não prematura**
7. **Acessibilidade obrigatória**
8. **Documentação como código**

---

**Última Atualização**: Este documento reflete a arquitetura atual e deve ser atualizado conforme o projeto evolui.