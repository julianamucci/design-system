# System Design - Arquitetura de Software

Este documento descreve o **System Design** (Design de Sistemas) do projeto, focando em decisões técnicas de arquitetura, performance, escalabilidade e padrões de código avançados.

**Para estrutura de pastas e componentes principais, consulte**: `12-arquitetura-projeto.md`
**Para tokens CSS e padrões visuais, consulte**: `03-sistema-design.md`

---

## Visão Geral da Arquitetura

### Tipo de Aplicação
- **Storybook** — interface principal de documentação (porta 6006)
- **SPA sandbox** (`App.tsx`) — desenvolvimento isolado e rota `?view=admin`
- **Frontend-only** - Sem backend ou servidor
- **Static** - Pode ser deployado em qualquer CDN/hosting estático

> Para arquitetura completa do projeto, ver `12-arquitetura-projeto.md` e `STORYBOOK-ARCHITECTURE.md`.

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

### Estado Global

**i18n e tema** são gerenciados fora do `App.tsx`:
- **i18n**: Zustand store em `@/lib/i18n.ts` — hook `useTranslation` disponível em qualquer componente
- **Tema (light/dark + brand)**: toolbar do Storybook via decorators em `.storybook/preview.ts`

**Decisão de Design**:
- ✅ **i18n via Zustand** — estado leve, fora do App.tsx
- ✅ **Temas via Storybook toolbar** — não via `useState` no App
- ✅ **Props drilling é aceitável para 2-3 níveis** em ComponentDocs
- ✅ **useState no App.tsx** apenas para o sandbox de desenvolvimento

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

Dentro de um ComponentDocs ou feature component, o fluxo padrão é:

```
ComponentDocs (props/args do Storybook)
    ↓
  Props
    ↓
Child Components (DocsSection, DoDont, etc.)
    ↓
Event Handlers
    ↓
setState / Zustand (i18n)
    ↓
Re-render
```

### Navegação

A navegação entre componentes é gerenciada pela **sidebar do Storybook** — não por `setState` no `App.tsx`. O `storySort` em `.storybook/preview.ts` define a ordem; os títulos das stories definem a hierarquia.

```tsx
// ✅ CORRETO — navegação via Storybook sidebar (título da story)
export default {
  title: "UI/Alert",   // → aparece em UI > Alert na sidebar
} satisfies Meta<typeof Alert>;

// ❌ EVITAR — registrar no App.tsx para fins de navegação
// { name: "Alert", path: "alert", component: AlertDocs }
```

---

## Roteamento

### Storybook sidebar como navegação principal

A navegação na interface de documentação é gerenciada pelo **Storybook sidebar** (`storySort` em `.storybook/preview.ts`). Não existe `React Router`, nem state-based routing para fins de documentação.

```ts
// .storybook/preview.ts — ordem da sidebar
storySort: {
  order: [
    'Foundations',
    'UI', ['*', ['Docs', 'Playground', 'Variantes', 'Tamanhos', 'Composições', 'Estados', '*']],
    '*',
  ],
}
```

O `App.tsx` mantém state-based routing **apenas para o sandbox de desenvolvimento** (rota `?view=admin`). Novos componentes não devem ser registrados lá para fins de navegação — o título da story é suficiente.

> Para o processo completo de adicionar um novo componente, ver `12-arquitetura-projeto.md` e `STORYBOOK-ARCHITECTURE.md` Seção 14.

---

## Performance e Otimizações

### Estratégias Implementadas

#### 1. Lazy Loading de Componentes

**Storybook**: code splitting e lazy loading são gerenciados nativamente pelo Storybook via Vite. Cada story file é carregado sob demanda pelo bundler — não é necessário configurar `React.lazy` para as docs pages no Storybook.

**App.tsx sandbox**: o `lazyDocs` em `App.tsx` usa `React.lazy` para carregamento sob demanda das docs pages no sandbox de desenvolvimento:

```tsx
// App.tsx — uso exclusivo do sandbox
const AlertDocs = lazy(() => import('./components/docs/AlertDocs'));
```

Isso não afeta a performance do Storybook.

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

### Storybook — renderização gerenciada pelo framework

O Storybook cuida da renderização das stories e docs pages. Cada story é um módulo independente carregado sob demanda.

**SEO**: metatags são injetadas no documento pai pelo hook `useSeoEffect` em cada ComponentDocs. O Storybook exporta (`storybook build`) um site estático que pode ser deployado em qualquer CDN.

**App.tsx sandbox**: CSR (Client-Side Rendering) puro. Suficiente para o sandbox de desenvolvimento — não é a interface pública do projeto.

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

> **Formato obrigatório**: variáveis de cor sempre em HSL sem vírgulas (ex: `220 44% 57%`). Seletores de tema sempre com prefixo `html.` (ex: `html.tema-personalizado`). Consulte `03-sistema-design.md` → "Formato Obrigatório: HSL".

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

**Complexidade**: O(1) — criar os arquivos, o Storybook registra automaticamente.

**Processo** (5 passos — detalhado em `12-arquitetura-projeto.md`):

```
1. src/components/docs/NovoComponenteDocs.tsx  ← docs page (15 seções)
2. src/components/docs/content/{slug}/translations.json  ← i18n
3. src/components/ui/novo-componente.stories.tsx  ← story principal + Playground
4. src/components/ui/novo-componente-{variantes,tamanhos,estados,composicoes}.stories.tsx
5. Verificar no Storybook: npm run storybook
```

O componente aparece automaticamente na sidebar sob `UI/NovoComponente`. Não é necessário registrá-lo no `App.tsx`.

**Escalabilidade**:

| Métrica | Limite Prático | Solução se Exceder |
|---------|----------------|-------------------|
| Componentes | ~200 | Storybook gerencia nativamente com search |
| Temas | ~10 | Adicionar via `theme-config.ts` + `preview.ts` |
| Bundle Size | ~2MB | Code splitting nativo do Vite |

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
export function AlertDocs() { }

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

**Escolhido**: Storybook sidebar (docs) + state-based routing (sandbox)

**Alternativas consideradas**:
- React Router
- TanStack Router
- Wouter

**Razões**:
- ✅ Storybook sidebar gerencia navegação de docs via `storySort` — zero config
- ✅ State-based routing em `App.tsx` apenas para o sandbox (`?view=admin`)
- ✅ Sem dependência de router para a interface principal
- ✅ Novos componentes aparecem na sidebar automaticamente pelo título da story

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
// AlertDocs.test.tsx
import { render, screen } from '@testing-library/react';
import { AlertDocs } from './AlertDocs';

test('renderiza título corretamente', () => {
  render(<AlertDocs />);
  expect(screen.getByText('Alert')).toBeInTheDocument();
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
┌──────────────────────────────────────────────────────┐
│                   Storybook                          │
│  - Manager (shell, sidebar, toolbar)                 │
│  - Canvas (iframe com a story renderizada)           │
│  - Docs tab (iframe com ComponentDocs)               │
└──────────────┬───────────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────────────┐  ┌─────▼───────────────────────────┐
│  Toolbar       │  │  ComponentDocs.tsx               │
│  - Light/Dark  │  │  - DocsHeader                   │
│  - Brand theme │  │  - DocsNav (sticky sidebar)      │
│  - Language    │  │  - 15 Section containers         │
└───┬────────────┘  │  - useSeoEffect (metatags)       │
    │               │  - useTranslation (i18n)         │
    │ globals       │  - track() (analytics)           │
    ▼               └─────────────────────────────────┘
decorator em
preview.ts
(classNames no <html>)
```

### Diagrama de Fluxo de Dados

```
┌──────────┐
│  User    │
└────┬─────┘
     │ Clica na sidebar do Storybook
     ▼
┌─────────────────────┐
│  Storybook Manager  │
│  (storySort config) │
└────┬────────────────┘
     │ Carrega story / docs page
     ▼
┌──────────────────────────┐
│  Canvas iframe           │
│  ComponentDocs.tsx       │
└────┬─────────────────────┘
     │ Monta
     ▼
┌──────────────────────────┐
│  useSeoEffect            │
│  → metatags no doc pai   │
├──────────────────────────┤
│  useTranslation          │
│  → texto no locale atual │
├──────────────────────────┤
│  track('docs_page_view') │
│  → GA4                   │
└──────────────────────────┘
```

### Diagrama de Tema

```
┌────────────────────────┐
│  User Action           │
│  - Toolbar Light/Dark  │
│  - Toolbar Brand       │
└──────────┬─────────────┘
           │ globals param na URL
           ▼
┌──────────────────────────┐
│  decorator em preview.ts │
│  withThemeByClassName    │
│  + brand decorator       │
└──────────┬───────────────┘
           │ classList no <html>
           ▼
┌──────────────────────────┐
│  document.documentElement│
│  .classList              │
│  add('dark')             │
│  add('tema-um')          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  CSS Variables           │
│  :root[.dark][.tema-um]  │
│  → GPU Paint             │
└──────────────────────────┘
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
| **Docs interface** | Storybook 10 | SPA customizada | Stories + docs integrados, a11y, Chromatic |
| **Framework** | React 18 | Vue, Svelte | Ecossistema, Shadcn/UI |
| **Styling** | Tailwind CSS 4.0 | CSS-in-JS | Performance, DX |
| **State (i18n)** | Zustand | Context API | Leve, sem boilerplate |
| **State (tema)** | Storybook toolbar | useState | Persistido via `globals` na URL |
| **Routing (docs)** | Storybook sidebar | React Router | Zero config, storySort |
| **Icons** | Lucide React | Font Awesome | Leve, tree-shakeable |
| **Components** | Radix UI + Shadcn | Headless UI, MUI | Acessibilidade, customização |
| **Visual regression** | Chromatic | Percy | Integrado ao Storybook |
| **A11y** | axe-playwright | jest-axe | Testes em browser real |

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