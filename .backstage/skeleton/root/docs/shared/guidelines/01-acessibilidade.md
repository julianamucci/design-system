# Acessibilidade — WCAG 2.2 AA

A acessibilidade é a primeira premissa do projeto e a base das outras duas: um produto que não pode ser usado por todos não pode ser rastreado por todos nem indexado com precisão. Este arquivo define as regras obrigatórias para garantir que cada produto construído com estes componentes seja acessível a qualquer pessoa, independente de deficiência ou contexto de uso.

> **Relação com outros arquivos**: `12-documentacao-componentes.md` define como documentar acessibilidade por componente (seções 12 e 15). `16-padroes-design-sistema.md` define a implementação técnica de focus, motion e layout acessível. `19-tom-de-voz.md` define linguagem simples. `21-analytics.md` define rastreamento. Este arquivo é a referência conceitual e de regras — os outros implementam.

---

## Premissa fundamental: aria-label contextual, não duplicado

Esta é a regra mais importante do arquivo e a mais frequentemente violada.

O `aria-label` de um elemento interativo **não deve repetir o texto visível** — deve acrescentar o contexto que o usuário vidente obtém da estrutura visual da página e que o usuário de leitor de tela não tem.

Um usuário de leitor de tela navega a página em ordem linear, sem a percepção visual do layout ao redor. Quando chega a um botão "Excluir", não sabe automaticamente que está num card de usuário chamado "Maria Silva" — precisa que o botão diga isso.

```tsx
{/* ❌ ERRADO — aria-label repete o texto visível, não acrescenta nada */}
<Button aria-label="Excluir">Excluir</Button>

{/* ❌ ERRADO — aria-label está ausente num contexto ambíguo */}
<Button>Excluir</Button>  {/* Excluir o quê? */}

{/* ✅ CORRETO — aria-label adiciona o contexto que o layout visual fornece */}
<Button aria-label="Excluir usuário Maria Silva">Excluir</Button>

{/* ✅ CORRETO — o contexto vem do aria-labelledby quando já existe texto estrutural */}
<Card>
  <CardHeader id="user-card-maria">Maria Silva</CardHeader>
  <Button aria-labelledby="user-card-maria" aria-label="Excluir usuário Maria Silva">
    Excluir
  </Button>
</Card>
```

### Regras de construção do aria-label contextual

**Verbos de ação + objeto + identificador específico:**

```
aria-label = "[verbo] [o quê] [qual/quem]"
```

| Label visível | Contexto visual | aria-label correto |
|---------------|----------------|--------------------|
| `Excluir` | Card do produto "Cadeira Gamer" | `"Excluir produto Cadeira Gamer"` |
| `Editar` | Linha da tabela com usuário "João" | `"Editar usuário João"` |
| `Ver mais` | Card de notícia "Lançamento 2025" | `"Ver mais sobre Lançamento 2025"` |
| `Fechar` | Dialog de confirmação de compra | `"Fechar confirmação de compra"` |
| `Anterior` | Carousel de imagens do produto | `"Imagem anterior do produto"` |
| `Próxima` | Paginação de resultados | `"Próxima página de resultados"` |
| `♥` (favorito) | Item da lista "Camisa Azul" | `"Adicionar Camisa Azul aos favoritos"` |

**Quando o texto visível já é suficientemente descritivo**, o `aria-label` pode ser omitido:

```tsx
{/* Suficiente — o texto já inclui o objeto e a ação */}
<Button>Salvar alterações do perfil</Button>

{/* Suficiente — botão único na página, sem ambiguidade de contexto */}
<Button>Criar nova conta</Button>
```

**Botões com apenas ícone** — o `aria-label` é obrigatório e deve descrever a ação completa:

```tsx
{/* ✅ CORRETO */}
<Button size="icon" aria-label="Abrir menu de configurações">
  <Settings className="h-4 w-4" aria-hidden="true" />
</Button>

{/* ❌ ERRADO — ícone sem descrição */}
<Button size="icon">
  <Settings className="h-4 w-4" />
</Button>

{/* ❌ ERRADO — aria-label descreve o ícone, não a ação */}
<Button size="icon" aria-label="Engrenagem">
  <Settings className="h-4 w-4" aria-hidden="true" />
</Button>
```

**Regra do `aria-hidden` em ícones**: todo ícone dentro de um elemento com texto ou `aria-label` deve ter `aria-hidden="true"` — o leitor de tela não deve ler o nome do ícone SVG além do label do botão.

---

## Cobertura por tipo de deficiência

### 1. Deficiência visual — cegueira e baixa visão

**Leitores de tela (NVDA, VoiceOver, TalkBack, JAWS):**

- HTML semântico obrigatório: usar `<button>`, `<a>`, `<nav>`, `<main>`, `<header>`, `<section>`, `<article>` — nunca `<div>` ou `<span>` para elementos interativos ou estruturais
- `aria-label` contextual conforme regra acima — nunca repetitivo
- `aria-labelledby` quando o label já existe como texto estrutural na página
- `aria-describedby` para complementar com instruções adicionais (ex: requisitos de senha)
- Ordem de leitura determinada pelo DOM — a ordem visual não importa para o leitor de tela
- Anúncio de mudanças dinâmicas via `aria-live` (ver seção de estados ARIA)

**Contraste:**
- Texto normal: mínimo 4.5:1 entre texto e fundo (WCAG 1.4.3)
- Texto grande (18px+ regular ou 14px+ bold): mínimo 3:1
- Elementos de interface (bordas de input, ícones funcionais): mínimo 3:1 (WCAG 1.4.11)
- Verificar contraste em light e dark mode — os dois devem atingir os mínimos

**Imagens e ícones:**
- Imagem decorativa: `alt=""` — leitor de tela ignora
- Imagem com função informativa: `alt` descritivo do conteúdo, não da aparência
- Imagem complexa (gráfico, Chart): `alt` com resumo + `aria-describedby` apontando para descrição longa em texto
- Ícone decorativo (dentro de botão com texto): `aria-hidden="true"`
- Ícone funcional (sem texto visível): `aria-label` no elemento pai

```tsx
{/* Avatar decorativo */}
<Avatar>
  <AvatarImage src="..." alt="" />
  <AvatarFallback>MR</AvatarFallback>
</Avatar>

{/* Avatar identificador */}
<Avatar>
  <AvatarImage src="..." alt="Foto de perfil de Maria Rodrigues" />
  <AvatarFallback aria-hidden="true">MR</AvatarFallback>
</Avatar>

{/* Chart — alternativa textual obrigatória */}
<div>
  <BarChart data={data} aria-describedby="chart-desc" aria-label="Vendas mensais 2025" />
  <p id="chart-desc" className="sr-only">
    Janeiro: R$12.000. Fevereiro: R$15.400. Março: R$11.200. Maior valor em fevereiro.
  </p>
</div>
```

**Zoom e reflow (WCAG 1.4.4 e 1.4.10):**
- Layout deve funcionar com zoom de até 200% sem perda de conteúdo
- A 320px de largura (equivalente a 400% de zoom em 1280px), o conteúdo deve ser legível sem scroll horizontal
- Nunca usar `user-scalable=no` no viewport meta — impede zoom em mobile

---

### 2. Deficiência visual — daltonismo

Daltonismo afeta aproximadamente 8% dos homens e 0.5% das mulheres. Os tipos mais comuns são deuteranopia (verde) e protanopia (vermelho) — o par verde/vermelho é o mais problemático.

**Regra fundamental — WCAG 1.4.1:** cor nunca pode ser o único meio de transmitir informação, estado ou ação.

```tsx
{/* ❌ ERRADO — só a cor diferencia sucesso de erro */}
<Badge className="bg-success">Aprovado</Badge>
<Badge className="bg-destructive">Reprovado</Badge>

{/* ✅ CORRETO — ícone + cor + texto */}
<Badge className="bg-success/10 text-success border border-success/30">
  <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
  Aprovado
</Badge>
<Badge className="bg-destructive/10 text-destructive border border-destructive/30">
  <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
  Reprovado
</Badge>

{/* ❌ ERRADO — campo com erro apenas com borda vermelha */}
<Input className="border-destructive" />

{/* ✅ CORRETO fora de FormField — adicionar aria-invalid manualmente */}
<Input className="border-destructive" aria-invalid="true" aria-errormessage="email-error" />
<p id="email-error" className="text-destructive text-sm flex gap-1 items-center">
  <AlertCircle className="h-3 w-3" aria-hidden="true" />
  Email inválido. Use o formato nome@dominio.com
</p>
```

**Padrões visuais complementares à cor:**
- Ícones diferenciadores por estado (CheckCircle, XCircle, AlertCircle, Info)
- Texto de label descritivo além da cor (não apenas "campo vermelho")
- Padrões ou traços em gráficos quando as séries são diferenciadas apenas por cor
- Sublinhado em links — não depender apenas da cor para identificar que é clicável

> **`aria-invalid` — manual vs automático**: dentro de `FormField + FormControl` (arquivo 06), o `FormControl` injeta `aria-invalid` e `aria-describedby` automaticamente — não adicionar manualmente. Fora de `FormField` (campo avulso, sem React Hook Form), adicionar `aria-invalid="true"` e `aria-errormessage="id-da-mensagem"` manualmente conforme o exemplo acima.

---

### 3. Deficiência motora

**Navegação por teclado — obrigatória em todos os componentes interativos:**

| Tecla | Ação esperada |
|-------|--------------|
| `Tab` | Avança para o próximo elemento focável |
| `Shift+Tab` | Volta para o elemento focável anterior |
| `Enter` | Ativa botões, links, abre dropdowns e dialogs |
| `Space` | Ativa checkboxes, switches e botões |
| `Escape` | Fecha overlays (Dialog, Sheet, Drawer, Popover, Tooltip) e cancela ações |
| `Arrow keys` | Navega dentro de componentes (Select, RadioGroup, Tabs, Menu) |
| `Home` / `End` | Vai para o primeiro/último item em listas e menus |

**Foco visível obrigatório em todos os elementos interativos:**
```tsx
// Padrão obrigatório — nunca remover
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Para elementos com fundo escuro, ajustar o offset
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
```

**Focus Not Obscured — WCAG 2.4.11 (novo no WCAG 2.2):**
O elemento com foco não pode estar completamente oculto por elementos fixos (headers, banners, notificações). Se houver um header sticky, garantir scroll automático ou padding que mantenha o elemento focado visível.

**Target Size Minimum — WCAG 2.5.8 (novo no WCAG 2.2):**
Alvo mínimo de 24×24px para qualquer elemento interativo. Para elementos menores, garantir espaçamento equivalente. Touch targets em mobile: mínimo 44×44px (área de toque, não necessariamente o elemento visual).

**Dragging Movements — WCAG 2.5.7 (novo no WCAG 2.2):**
Toda ação que requer arrastar (Resizable, Carousel via swipe, Slider) deve ter alternativa por clique ou teclado. O Slider do Shadcn/UI aceita Arrow keys — documentar e manter.

**Skip link obrigatório na aplicação:**
```tsx
{/* Primeiro elemento do <body> — visível apenas no foco */}
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
>
  Pular para o conteúdo principal
</a>

{/* Conteúdo principal com o id correspondente */}
<main id="main-content" tabIndex={-1}>
  {renderCurrentPage()}
</main>
```

---

### 4. Deficiência auditiva

Deficiência auditiva impacta principalmente conteúdo de mídia. Para interfaces de design system sem vídeo/áudio nativo, as regras são:

- Notificações e alertas nunca devem depender apenas de som — sempre ter representação visual (Toast, Alert)
- Se o produto implementar sons de notificação no futuro, ter alternativa visual equivalente
- Vídeos e áudios embutidos (quando adicionados): legenda obrigatória, transcrição recomendada
- Player de mídia com controles acessíveis por teclado e labels descritivos nos botões

---

### 5. Deficiência cognitiva

A maior parcela de usuários — dislexia, TDAH, deficiência intelectual, demência, ansiedade, autismo. As regras abaixo beneficiam todos os usuários, não apenas quem tem diagnóstico.

**Linguagem simples:**
- Seguir as regras de tom e vocabulário do arquivo `19-tom-de-voz.md`
- Mensagens de erro: causa + orientação, sem jargão técnico (ver arquivo 19, seção "Tom de erro")
- Labels descritivos — nunca depender apenas de placeholder para identificar o campo

**Consistência:**
- Componentes na mesma posição em todas as páginas (sidebar, header, footer)
- Mesma ação sempre com o mesmo label (não usar "Enviar" em um formulário e "Submeter" em outro)
- Mesma interação sempre com o mesmo resultado (botão de fechar sempre fecha)

**Controle do usuário:**
- Sem mudança de contexto automática — não redirecionar sem ação explícita do usuário
- Sem auto-submit de formulário ao selecionar uma opção (Select não deve submeter ao escolher)
- Sem time-out sem aviso e opção de extensão (quando aplicável)
- Confirmação antes de ações destrutivas — Dialog obrigatório para excluir, não apenas Toast

**Prevenção de erros:**
- Labels sempre visíveis — placeholder some ao digitar e não substitui label
- Campos obrigatórios marcados visualmente e com `aria-required="true"`
- Revisão antes de ações críticas (formulários longos, compras, exclusões)

---

### 6. Deficiência situacional

Inclui qualquer condição temporária ou ambiental: braço quebrado, sol sobre a tela, ruído intenso, contexto de uso com uma mão. As mesmas regras de acessibilidade motora, visual e cognitiva cobrem esses casos — mas vale explicitar:

- Interface funcional com uma mão no mobile (elementos de ação alcançáveis no terço inferior da tela)
- Contraste suficiente mesmo em luz solar intensa (preferir contraste acima do mínimo, almejando 7:1)
- Componentes utilizáveis sem mouse (teclado, touch, voz)

---

## Estrutura acessível da SPA

Este projeto usa roteamento baseado em estado — não há navegação real entre URLs. Leitores de tela não percebem automaticamente a troca de "página". É obrigatório anunciar a mudança e gerenciar o foco.

### Estrutura de landmarks

```tsx
// App.tsx — estrutura obrigatória
<html lang="pt-BR">
  <body>
    {/* Skip link — primeiro elemento */}
    <a href="#main-content" className="sr-only focus:not-sr-only ...">
      Pular para o conteúdo principal
    </a>

    <SidebarProvider>
      <nav aria-label="Navegação principal">
        <Sidebar />
      </nav>

      <SidebarInset>
        <header role="banner">
          {/* Toggle dark/light, ThemeSelector */}
        </header>

        <main id="main-content" tabIndex={-1}>
          {renderCurrentPage()}
        </main>
      </SidebarInset>
    </SidebarProvider>

    {/* Região de anúncio para leitores de tela */}
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="page-announcer"
    />
  </body>
</html>
```

### Anúncio de mudança de página

Ao trocar de página em `renderCurrentPage()`, duas ações obrigatórias:

```tsx
const [currentPage, setCurrentPage] = useState('home');

const navigateTo = (page: string, pageTitle: string) => {
  setCurrentPage(page);

  // 1. Anunciar a nova página para leitores de tela
  const announcer = document.getElementById('page-announcer');
  if (announcer) {
    announcer.textContent = ''; // Limpar para forçar re-anúncio
    requestAnimationFrame(() => {
      announcer.textContent = `Página carregada: ${pageTitle}`;
    });
  }

  // 2. Mover o foco para o início do conteúdo principal
  requestAnimationFrame(() => {
    const main = document.getElementById('main-content');
    main?.focus();
  });

  // 3. Registrar como pageview no analytics (ver 21-analytics.md)
  track('page_view', {
    component: 'spa_navigation',
    location: page,
    label: pageTitle
  });
};
```

### ThemeSelector acessível

```tsx
{/* Anunciar mudança de tema para leitores de tela */}
<Select
  value={currentTheme}
  onValueChange={(theme) => {
    onThemeChange(theme);
    // Anunciar via aria-live
    const announcer = document.getElementById('page-announcer');
    if (announcer) {
      announcer.textContent = `Tema alterado para ${theme}`;
    }
  }}
  aria-label="Selecionar tema visual"
>
  ...
</Select>
```

---

## Estados ARIA dinâmicos

Mudanças de estado que devem ser anunciadas por leitores de tela:

| Atributo | Quando usar | Componentes |
|----------|------------|-------------|
| `aria-live="polite"` | Mudanças não urgentes — aguarda o usuário terminar a ação atual | Toast de sucesso, mudança de página, resultado de busca |
| `aria-live="assertive"` | Interrompe imediatamente — apenas para erros críticos | Erro de autenticação, falha de pagamento |
| `aria-expanded="true/false"` | Elemento que expande/colapsa conteúdo | Accordion, Dropdown, Collapsible, Dialog trigger |
| `aria-selected="true/false"` | Item selecionado em lista ou tab | Tabs, Select options, Combobox |
| `aria-checked="true/false"` | Estado de checkbox ou switch | Checkbox, Switch, RadioGroup |
| `aria-pressed="true/false"` | Botão de toggle com estado persistente | Toggle, botão de modo dark |
| `aria-current="page"` | Item de navegação da página ativa | Sidebar nav items, Breadcrumb último item |
| `aria-invalid="true"` | Campo com erro de validação | Input, Select, Textarea com erro |
| `aria-errormessage="id"` | Aponta para o elemento que descreve o erro | Par com `aria-invalid` |
| `aria-required="true"` | Campo obrigatório | Todos os campos required do formulário |
| `aria-busy="true"` | Conteúdo sendo carregado | Skeleton, botão de submit durante loading |
| `aria-disabled="true"` | Elemento desabilitado sem remoção do DOM | Botões disabled que mantêm foco para explicação |

### Toast / Notificações (Sonner)

Toasts são notificações não-bloqueantes que aparecem temporariamente. Regras de acessibilidade específicas:

- Container do toaster: `role="region"` + `aria-label="Notifications"`
- Cada toast individual: `role="status"` + `aria-live="polite"` (default/success/info/warning) ou `aria-live="assertive"` (erros críticos)
- **Auto-dismiss timing (WCAG 2.2.1):** duration mínimo de 4000ms para mensagens curtas; erros devem usar 8000ms+ ou `closeButton` habilitado para permitir dismiss manual
- Botão de fechar: `aria-label="Close"` ou equivalente contextual (ex: "Fechar notificação de erro")
- Toast com ação (ex: "Desfazer"): o botão de ação deve ser focável via Tab; toast não deve desaparecer enquanto o botão tiver foco
- Múltiplos toasts empilhados são anunciados sequencialmente pelo leitor de tela — evitar disparar mais de 3 simultaneamente

---

## Idioma do documento

**WCAG 3.1.1 — Nível A (obrigatório básico):**

```html
<html lang="pt-BR">
```

Este atributo é obrigatório no elemento raiz. Sem ele, leitores de tela usam o idioma do sistema operacional para pronunciar o conteúdo, tornando o português incompreensível em dispositivos configurados em outro idioma.

Para trechos em outro idioma dentro da página:
```tsx
<code lang="en">border-radius</code>
<span lang="en">Design System</span>
```

---

## Preferências do sistema

### prefers-reduced-motion

`prefers-reduced-motion` não é preferência estética — é necessidade médica para usuários com distúrbios vestibulares, epilepsia fotossensível e enxaqueca. Animações e transições podem causar náusea, desorientação e crises.

**Regra obrigatória**: toda animação ou transição adicionada fora dos componentes Shadcn/UI deve ter `motion-reduce:transition-none` ou `motion-reduce:animate-none`.

```tsx
{/* Transições customizadas */}
<div className="transition-all duration-300 motion-reduce:transition-none">

{/* Skeleton */}
<Skeleton className="animate-pulse motion-reduce:animate-none" />
```

A media query global no `globals.css` protege todos os casos não cobertos por classes individuais (ver `16-padroes-design-sistema.md` → "Motion e Animações").

**Proibição absoluta**: nunca criar conteúdo que pisque mais de 3 vezes por segundo — causa crises epilépticas (WCAG 2.3.1).

### prefers-color-scheme

O dark mode é controlado pela classe `.dark` no projeto. Respeitar a preferência do sistema como valor inicial:

```tsx
const [isDark, setIsDark] = useState(
  window.matchMedia('(prefers-color-scheme: dark)').matches
);
```

### prefers-contrast

Para produtos que targetam públicos com baixa visão, considerar a media query `prefers-contrast: more` para aumentar automaticamente contraste de bordas e textos secundários.

---

## Integração entre as três premissas

### Acessibilidade + Analytics

O rastreamento não pode comprometer a acessibilidade, e deve capturar a experiência de todos os usuários:

- O valor de `data-track-label` deve ser idêntico ao `aria-label` ou ao texto visível — analytics e leitor de tela devem descrever a mesma ação
- O listener global de `click` do arquivo `21-analytics.md` não captura ativações por teclado (`Enter`/`Space`) em elementos não-nativos — adicionar listener de `keydown` para esses casos
- Eventos de analytics devem incluir a navegação virtual da SPA como pageview (ver seção "Anúncio de mudança de página" acima)
- Erros de acessibilidade detectados por axe-core em CI devem bloquear o merge assim como falhas de teste funcional

```tsx
{/* Garantia de consistência aria-label ↔ data-track-label */}
const label = "Excluir produto Cadeira Gamer";

<Button
  aria-label={label}
  data-track="button_click"
  data-track-label={label}  {/* Mesmo valor */}
  data-track-component="button"
  data-track-location="product_list"
>
  Excluir
</Button>
```

### Acessibilidade + SEO/GEO

HTML semântico, atributos ARIA e metadados de SEO se reforçam mutuamente — não são camadas separadas:

- `<main>`, `<nav>`, `<article>`, `<section>` com `aria-label` beneficiam leitores de tela e crawlers de busca
- `alt` descritivo em imagens alimenta `og:image:alt` e é indexado pelo Google Imagens
- `lang="pt-BR"` é requisito de acessibilidade (WCAG 3.1.1) e sinal de geolocalização para SEO
- Schema.org `TechArticle` com `name` e `description` é lido por IAs generativas e por leitores de tela que processam dados estruturados
- Títulos hierárquicos corretos (`h1` → `h2` → `h3`) são obrigatórios para acessibilidade e para indexação semântica

```tsx
{/* Um único elemento que serve acessibilidade, SEO e GEO */}
<article aria-labelledby="component-title" lang="pt-BR">
  <h1 id="component-title">Button</h1>
  {/* O Schema.org TechArticle referencia o mesmo título */}
  {/* O og:title usa o mesmo conteúdo */}
  {/* O aria-labelledby conecta o article ao h1 para leitores de tela */}
</article>
```

---

## Focus visible — padrão obrigatório

```tsx
{/* ✅ CORRETO — padrão obrigatório em todos os elementos interativos */}
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

{/* ❌ ERRADO — muito fino */}
className="focus-visible:ring-1"

{/* ❌ ERRADO — muito grosso */}
className="focus-visible:ring-4"

{/* ❌ ERRADO — opacidade reduz contraste do indicador de foco */}
className="focus-visible:ring-ring/50"
```

A variável `--ring` deve sempre ter 100% de opacidade (sem `/50` ou `/30`) — ver `16-padroes-design-sistema.md`.

---

## Ferramentas de teste

| Ferramenta | O que testa | Quando usar |
|------------|------------|-------------|
| **axe DevTools** (extensão Chrome/Firefox) | Auditoria automática de WCAG — pega ~30% dos problemas | Em todo desenvolvimento, antes de qualquer PR |
| **jest-axe** | Auditoria automática integrada aos testes unitários | Na seção 15 de cada ComponentDocs |
| **Lighthouse** (DevTools) | Auditoria + performance + SEO em conjunto | A cada sprint, nas páginas principais |
| **Colour Contrast Analyser** (app desktop) | Contraste preciso entre duas cores quaisquer | Ao definir novas cores de tema |
| **NVDA + Chrome** (Windows, gratuito) | Leitor de tela mais usado no mundo real | Teste manual dos fluxos principais |
| **VoiceOver + Safari** (Mac/iOS, nativo) | Leitor de tela do ecossistema Apple | Teste manual em mobile (iOS) |
| **Keyboard-only navigation** | Navegação sem mouse | Testar toda interação antes do merge |

**Sequência mínima de teste por componente:**

1. Auditoria automática com axe DevTools — zero violações
2. Navegação por teclado — Tab, Shift+Tab, Enter, Space, Escape, Arrow keys
3. Zoom 200% — layout sem scroll horizontal nem perda de conteúdo
4. Teste com NVDA ou VoiceOver no fluxo principal do componente

**O que testes automatizados não cobrem** (exige teste manual obrigatório):
- Qualidade do texto de `aria-label` — automatizado verifica existência, não adequação
- Contexto e significado dos anúncios de leitor de tela
- Ordem e fluxo de leitura em componentes complexos
- Usabilidade real com leitor de tela (navegação, orientação, eficiência)

---

## Checklist de acessibilidade por componente

Antes de considerar um componente acessível:

**Estrutura e semântica:**
- [ ] Elemento HTML semântico correto (`<button>`, `<a>`, `<nav>`, etc.)
- [ ] `lang="pt-BR"` no documento raiz
- [ ] Landmarks definidos: `<main>`, `<nav>`, `<header>`
- [ ] Skip link presente e funcional

**Labels e descrições:**
- [ ] `aria-label` contextual (não repetitivo) em botões ambíguos
- [ ] Ícones decorativos com `aria-hidden="true"`
- [ ] Imagens com `alt` adequado (descritivo ou vazio se decorativo)
- [ ] Campos de formulário com `<label>` visível associado via `for`/`htmlFor`
- [ ] `aria-required` em campos obrigatórios
- [ ] `aria-invalid` + `aria-errormessage` em campos com erro

**Estados dinâmicos:**
- [ ] `aria-expanded` em elementos que expandem
- [ ] `aria-live="polite"` em regiões com conteúdo dinâmico
- [ ] `aria-current="page"` no item de navegação ativo
- [ ] `aria-busy` em estados de loading

**Visual:**
- [ ] Contraste mínimo 4.5:1 para texto normal
- [ ] Contraste mínimo 3:1 para texto grande e elementos de interface
- [ ] Cor nunca é o único meio de comunicar estado
- [ ] Ícone + texto ou padrão visual complementam a cor em estados de erro/sucesso
- [ ] Focus ring visível em todos os estados

**Motor:**
- [ ] Navegável completamente por teclado
- [ ] Focus ring visível: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- [ ] Touch target mínimo 44×44px em mobile
- [ ] Ações de arrastar têm alternativa por teclado

**Movimento:**
- [ ] `motion-reduce:transition-none` em transições customizadas
- [ ] Sem conteúdo que pisca mais de 3 vezes por segundo

**Integração:**
- [ ] `data-track-label` idêntico ao `aria-label` quando ambos existem
- [ ] Mudança de página anuncia via `aria-live` e move foco para `<main>`
- [ ] Erros de axe-core em CI bloqueiam merge