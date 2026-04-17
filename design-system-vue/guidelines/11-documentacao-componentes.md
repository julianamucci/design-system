# Estrutura Padronizada de Documentação de Componentes - Regras Obrigatórias

## Template de 15 Seções - Obrigatório para Todos os Componentes

**IMPORTANTE**: Use EXATAMENTE esta estrutura para todos os componentes da documentação, seguindo a ordem e organização estabelecida.

As seções foram organizadas em quatro blocos com propósitos e públicos distintos:

- **Bloco 1 — Visão Geral** (seções 1–5): para quem está avaliando ou conhecendo o componente pela primeira vez. Cobre identidade, demonstração, anatomia e decisão de uso.
- **Bloco 2 — Referência Técnica** (seções 6–11): para quem vai implementar. Cobre importação, exemplos de código, variantes, estados, propriedades e tokens.
- **Bloco 3 — Contexto e Orientação** (seções 12–14): para aprofundar. Cobre acessibilidade, componentes relacionados e boas práticas.
- **Bloco 4 — Qualidade** (seção 15): para dev e QA. Define os critérios que qualquer forma de teste deve verificar — funcional, acessibilidade e regressão visual.

**Navegação rápida neste arquivo:**
[Header](#1-header) · [Demonstração](#2-demonstração-padrão) · [Anatomia](#3-anatomia) · [Quando Usar](#4-quando-e-como-usar) · [Do & Don't](#5-do--dont) · [Importação](#6-importação) · [Exemplos](#7-exemplos-de-código) · [Variantes](#8-variantes) · [Estados](#9-estados) · [Propriedades](#10-propriedades) · [Tokens](#11-design-tokens) · [Acessibilidade](#12-acessibilidade) · [Relacionados](#13-componentes-relacionados) · [Notas](#14-notas-e-dicas) · [Testes](#15-critérios-de-teste)

---

## Navegação Lateral do ComponentDocs (Obrigatória)

A navegação lateral (`DocsNav`) é uma **sidebar sticky** posicionada à esquerda do conteúdo principal. Ela permite ao usuário saltar diretamente para qualquer seção, permanece **visível durante todo o scroll**, indica a **seção ativa** via IntersectionObserver e é **acessível** com `<nav>` semântico.

### Layout obrigatório — duas colunas

```vue
<template>
  <div class="ds-docs p-8 max-w-5xl mx-auto">

    <!-- Header (sem id — é o topo da página) -->
    <header class="mb-12 border-b pb-8 border-border/50">
      <!-- badges, LanguageSwitcher, h1, description -->
    </header>

    <!-- Layout de duas colunas: nav lateral + conteúdo -->
    <div class="flex gap-16 items-start">

      <!-- OBRIGATÓRIO: wrapper <nav> com sticky -->
      <nav
        aria-label="Navegação das seções do componente"
        class="sticky top-8 w-52 shrink-0 self-start space-y-5"
      >
        <DocsNav :groups="navGroups" :active-section="activeSection" />
      </nav>

      <!-- Conteúdo principal -->
      <div class="ds-docs flex-1 min-w-0 space-y-12">
        <section id="demonstracao">...</section>
        <section id="anatomia">...</section>
        <section id="quando-usar">...</section>
        <!-- demais seções -->
      </div>

    </div>
  </div>
</template>
```

**Regras da navegação lateral:**
- **`<nav>` wrapper obrigatório** com `sticky top-8` — sem ele, o `DocsNav` rola junto com o conteúdo e perde a função de navegação persistente
- `w-52 shrink-0 self-start` — largura fixa de 13rem, não encolhe, alinha ao topo do flex container
- `space-y-5` — espaçamento entre grupos de seções
- `aria-label` no `<nav>` — diferencia esta navegação de outras `<nav>` na página
- `flex-1 min-w-0` no conteúdo — ocupa o espaço restante, `min-w-0` previne overflow de tabelas/código
- `flex gap-16 items-start` no container — gap de 4rem entre sidebar e conteúdo, alinhamento ao topo

**⚠️ Erro comum:** usar `<DocsNav>` diretamente sem o wrapper `<nav>` sticky. Isso faz a navegação rolar junto com a página, perdendo a referência visual.

**IDs obrigatórios nas seções:** cada `<section>` deve ter o `id` correspondente ao array de `navGroups`:

```vue
<section id="demonstracao">
  <h2 class="text-xl font-semibold mb-4">{{ tContent('demonstration.title') }}</h2>
  ...
</section>

<section id="anatomia">
  <h2 class="text-xl font-semibold mb-4">{{ tContent('anatomy.title') }}</h2>
  ...
</section>

<!-- Continuar para todas as seções presentes -->

      </div>
    </div>
  );
}
```

---

## Bloco 1 — Visão Geral

### 1. **Header (Obrigatório)**

O header identifica o componente e fornece metadados de contexto imediato.

```tsx
<header className="space-y-4">
  <div className="flex items-center gap-2">
    <Badge variant="outline" className="border-primary/20 text-primary">
      {/* Categoria: Layout | Navigation | Form | Feedback | Display | Overlay */}
    </Badge>
    <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground">
      {/* Complexidade: Simples | Composto | Complexo */}
    </Badge>
  </div>
  <h1>Nome do Componente</h1>
  <p className="text-muted-foreground">
    Descrição clara e concisa do propósito do componente em uma ou duas frases.
  </p>
  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
    <span>Shadcn/UI: <code>npx shadcn@latest add nome-componente</code></span>
    {/* <span>Figma: <a href="..." className="text-primary underline">Ver no Figma</a></span> */}
    {/* <span>Atualizado em: MM/AAAA — [descrição da última mudança significativa]</span> */}
  </div>
</header>
```

**Metadados do Header:**

| Campo | Obrigatório | Valores |
|-------|-------------|---------|
| Categoria | Sim | Layout, Navigation, Form, Feedback, Display, Overlay |
| Complexidade | Sim | Simples (1 elemento), Composto (subcomponentes), Complexo (dependências externas) |
| Comando Shadcn | Sim | Comando exato de instalação |
| Link Figma | Não | Link direto para o componente na biblioteca Figma |
| Última atualização | Não | Data + frase descritiva da mudança. Ex: `Jan/2025 — nova prop asChild` |

> **Changelog mínimo**: o campo "Atualizado em" não é um histórico completo — registra apenas a última mudança significativa (nova prop, variante depreciada, mudança de comportamento). Para histórico completo, consultar o git log do arquivo de componente.

---

### 2. **Demonstração Padrão (Obrigatório)**

Exemplo interativo imediato — o caso de uso mais comum e representativo do componente.

```tsx
<section>
  <h2 className="mb-4">Demonstração Padrão</h2>
  <ComponentDemo>
    {/* Exemplo prático e representativo do uso mais comum */}
    {/* Deve ser autocontido: sem props externas, sem estado externo ao exemplo */}
  </ComponentDemo>
</section>
```

**Regras:**
- O exemplo deve funcionar sem contexto adicional
- Preferir dados mock realistas (não "Lorem ipsum" ou "Exemplo 1")
- Para componentes com estado, usar `useState` dentro do próprio exemplo

---

### 3. **Anatomia (Obrigatório)**

Nomeia as partes do componente com vocabulário compartilhado entre design e desenvolvimento.

```tsx
<section>
  <h2 className="mb-4">Anatomia</h2>
  <ComponentDemo>
    <div className="space-y-6">
      {/* Para componentes simples: lista numerada das regiões */}
      <div className="space-y-2">
        <ol className="space-y-2 text-sm">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
            <span><strong>Nome da Parte</strong> — descrição e subcomponente React correspondente (<code>SubComponente</code>)</span>
          </li>
          {/* Repetir para cada parte nomeada */}
        </ol>
      </div>

      {/* Para componentes compostos: mostrar a estrutura de subcomponentes */}
      <div className="bg-muted p-4 rounded-md">
        <p className="text-sm text-muted-foreground mb-2">Estrutura de subcomponentes:</p>
        <code className="text-sm block whitespace-pre">
{`<ComponenteRaiz>          {/* Wrapper e contexto */}
  <ComponenteTrigger />   {/* Elemento de ativação */}
  <ComponenteContent>     {/* Conteúdo principal */}
    <ComponenteItem />    {/* Item individual */}
  </ComponenteContent>
</ComponenteRaiz>`}
        </code>
      </div>
    </div>
  </ComponentDemo>
</section>
```

**Regras:**
- Numerar cada parte visível do componente
- Mapear cada parte para o subcomponente React correspondente
- Para componentes simples (Button, Badge), a anatomia pode ser uma lista de 2–3 itens
- Para componentes compostos (Select, Dialog, Form), mostrar obrigatoriamente a árvore de subcomponentes

---

### 4. **Quando e Como Usar (Obrigatório)**

Direciona a decisão de uso com guidelines obrigatórias, critérios de aplicação e regras de UX writing específicas do componente.

```tsx
<section>
  <h2 className="mb-4">Quando e Como Usar</h2>
  <ComponentDemo>
    <div className="space-y-6">

      {/* Guidelines obrigatórias vindas dos arquivos 04–10 */}
      <div className="bg-muted p-4 rounded-md space-y-2">
        <h4>📋 Guidelines Obrigatórias</h4>
        <ul className="space-y-1 text-sm">
          {/* Regras específicas do componente */}
        </ul>
      </div>

      {/* Critérios de uso — sempre presentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border rounded-md p-4">
          <h4 className="mb-2">✅ Use quando</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {/* Casos de uso recomendados */}
          </ul>
        </div>
        <div className="bg-card border rounded-md p-4">
          <h4 className="mb-2">❌ Não use quando</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {/* Casos onde outro componente é mais adequado */}
          </ul>
        </div>
      </div>

      {/* UX Writing — presente sempre que o componente tem texto visível ao usuário */}
      {/* Omitir apenas para componentes sem texto: Separator, ResizableHandle, ScrollArea, AspectRatio */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h4>✍️ UX Writing</h4>
          <span className="text-xs text-muted-foreground">
            {/* Tom de voz: consultar arquivo 19-tom-de-voz.md (quando disponível) */}
          </span>
        </div>

        {/* Tabela de elementos de texto do componente */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 bg-muted/50 border-r border-border">Elemento</th>
                <th className="text-left p-3 bg-muted/50 border-r border-border">Regras de formato</th>
                <th className="text-left p-3 bg-muted/50 border-r border-border">✅ Correto</th>
                <th className="text-left p-3 bg-muted/50">❌ Evitar</th>
              </tr>
            </thead>
            <tbody>
              {/*
                Preencher uma linha por elemento de texto visível no componente.
                Exemplos de elementos por tipo de componente:

                BUTTON:
                Label | Verbo no infinitivo · máx. 3 palavras · sem pontuação | "Salvar" / "Enviar pedido" | "Clique aqui" / "OK"

                INPUT:
                Label      | Substantivo · maiúscula inicial · sem dois-pontos   | "Nome completo"     | "nome completo:" / "Informe seu nome"
                Placeholder| Exemplo real · formato esperado · tom neutro        | "ex: joao@email.com"| "Digite seu email" / "Email"
                Helper text| Frase curta · voz ativa · explica restrição         | "Mínimo 8 caracteres"| "Campo obrigatório" (genérico demais)
                Erro       | Frase completa · causa + orientação · sem culpar    | "Email inválido. Use o formato nome@dominio.com" | "Erro!" / "Campo inválido"

                SELECT:
                Label        | Igual ao Input                                    | "Estado"            | "Selecione um estado"
                Placeholder  | Instrução clara de ação                           | "Selecione..."      | "-- Escolha --" / nada
                Opção de lista| Substantivo · consistente entre si                | "São Paulo"         | "SP" (misturar siglas e nomes)

                DIALOG:
                Título    | Frase nominal · descreve a ação · sem ponto final   | "Excluir conta"     | "Tem certeza?" / "Atenção!"
                Descrição | Consequência clara · sem jargão técnico              | "Esta ação não pode ser desfeita." | "Isso irá deletar permanentemente..."
                Botão primário | Confirma a ação do título · verbo no infinitivo | "Excluir"           | "Sim" / "OK" / "Confirmar"
                Botão secundário | Cancela sem drama                             | "Cancelar"          | "Não" / "Fechar"

                ALERT / TOAST:
                Título    | Frase curta · estado + contexto                     | "Alterações salvas" | "Sucesso!" / "Erro"
                Descrição | Detalhe útil · próximo passo quando necessário       | "Suas preferências foram atualizadas." | "Operação realizada com sucesso."

                BADGE:
                Label | 1–2 palavras · substantivo ou adjetivo · sem verbo      | "Ativo" / "Em análise" | "Está ativo" / "Aguardando análise"

                TOOLTIP:
                Texto | Frase informativa · sem repetir o label do trigger · máx. 2 linhas | "Abre em nova aba" | "Link" / "Clique para abrir"

                EMPTY STATE (quando o componente suporta estado vazio):
                Título    | Tom encorajador · o que ainda não existe             | "Nenhum item ainda" | "Lista vazia" / "Sem resultados"
                Descrição | O que o usuário pode fazer                          | "Adicione seu primeiro item para começar." | "Não há dados."
                CTA       | Verbo de ação direta                                | "Adicionar item"    | "Clique aqui"
              */}

              <tr className="border-b border-border">
                <td className="p-3 border-r border-border">Elemento 1</td>
                <td className="p-3 border-r border-border">Regras</td>
                <td className="p-3 border-r border-border text-success">Exemplo correto</td>
                <td className="p-3 text-destructive">Exemplo a evitar</td>
              </tr>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-3 border-r border-border">Elemento 2</td>
                <td className="p-3 border-r border-border">Regras</td>
                <td className="p-3 border-r border-border text-success">Exemplo correto</td>
                <td className="p-3 text-destructive">Exemplo a evitar</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mensagens de feedback — presente em componentes que comunicam estado do sistema */}
        {/* Incluir para: Alert, Toast/Sonner, Form (erros de validação), Progress, Dialog de confirmação */}
        {/* <div className="bg-muted p-4 rounded-md space-y-3">
          <h4>Mensagens de feedback</h4>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-success/5 border border-success/20 rounded-md p-3">
                <p className="font-medium text-success mb-1">Sucesso</p>
                <p className="text-muted-foreground">Confirma o que aconteceu · passado · sem exagero</p>
                <p className="mt-1">ex: "Perfil atualizado."</p>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3">
                <p className="font-medium text-destructive mb-1">Erro</p>
                <p className="text-muted-foreground">Causa + orientação · sem culpar o usuário · sem "por favor"</p>
                <p className="mt-1">ex: "Não foi possível salvar. Tente novamente."</p>
              </div>
              <div className="bg-warning/5 border border-warning/20 rounded-md p-3">
                <p className="font-medium mb-1">Aviso</p>
                <p className="text-muted-foreground">Alerta antecipado · consequência clara · ação opcional</p>
                <p className="mt-1">ex: "Suas alterações não foram salvas."</p>
              </div>
            </div>
          </div>
        </div> */}

      </div>

    </div>
  </ComponentDemo>
</section>
```

**Regras gerais da seção:**
- As guidelines obrigatórias devem replicar as regras do arquivo de componentes correspondente (04–10)
- O bloco "Não use quando" deve sempre apontar o componente alternativo correto

**Regras da subcategoria UX Writing:**

A subcategoria está presente sempre que o componente tem texto visível ao usuário. A tabela de elementos cobre cada tipo de texto com suas regras e exemplos. O bloco de mensagens de feedback é adicionado para componentes que comunicam estado do sistema.

**Componentes com UX Writing obrigatório:**

| Componente | Elementos obrigatórios | Feedback |
|------------|------------------------|----------|
| Button | Label | — |
| Input | Label, Placeholder, Helper text, Erro | — |
| Textarea | Label, Placeholder, Helper text, Erro | — |
| Select | Label, Placeholder, Opções de lista, Erro | — |
| Checkbox / Switch | Label, Helper text | — |
| Label | Texto do label | — |
| Dialog | Título, Descrição, Botão primário, Botão secundário | Erro (quando aplicável) |
| Alert | Título, Descrição | Sucesso, Erro, Aviso |
| Toast / Sonner | Título, Descrição | Sucesso, Erro, Aviso |
| Badge | Label | — |
| Tooltip | Texto | — |
| Form | — | Erro de validação (via FormMessage) |
| Card (com título) | Título, Descrição | — |
| Pagination | Labels de navegação ("Anterior", "Próxima") | — |
| Empty State | Título, Descrição, CTA | — |

**Componentes sem UX Writing (omitir a subcategoria):**

Separator, ResizableHandle, ScrollArea, AspectRatio, Skeleton, Progress (barra apenas, sem label), Avatar (sem nome visível).

**Regras universais de escrita — aplicar em todos os componentes:**

- **Capitalização**: maiúscula apenas na primeira palavra da frase. Nunca Title Case em frases completas
- **Pontuação**: sem ponto final em labels, títulos e badges de 1–3 palavras. Ponto final em frases completas (helper text, descrições, mensagens de feedback)
- **Voz**: ativa e direta. "Salvar alterações" em vez de "Alterações serão salvas"
- **"Por favor"**: não usar. Cria distância desnecessária e é redundante
- **Tom de erro**: descrever o problema e orientar a solução. Nunca culpar ("você digitou errado") nem ser vago ("Erro inesperado")
- **Limite de caracteres**: labels ≤ 3 palavras, títulos ≤ 6 palavras, mensagens de feedback ≤ 2 frases

> **Referência de tom de voz**: as regras acima são estruturais e válidas para qualquer produto. Regras de personalidade, nível de formalidade e terminologia específica do produto serão definidas em `19-tom-de-voz.md`.

---

### 5. **Do & Don't (Obrigatório)**

Exemplos visuais lado a lado de implementação correta e incorreta.

```tsx
<section>
  <h2 className="mb-4">Do &amp; Don&apos;t</h2>
  <ComponentDemo>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* DO */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-sm font-medium text-success">Faça isso</span>
        </div>
        <div className="border border-success/30 rounded-md p-4 bg-success/5">
          {/* Exemplo visual correto */}
        </div>
        <p className="text-sm text-muted-foreground">
          {/* Explicação do porquê é correto */}
        </p>
      </div>

      {/* DON'T */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">Não faça isso</span>
        </div>
        <div className="border border-destructive/30 rounded-md p-4 bg-destructive/5">
          {/* Exemplo visual incorreto */}
        </div>
        <p className="text-sm text-muted-foreground">
          {/* Explicação do porquê é incorreto */}
        </p>
      </div>

    </div>
    {/* Adicionar mais pares Do/Don't conforme necessário */}
  </ComponentDemo>
</section>
```

**Regras:**
- Mínimo 2 pares Do/Don't por componente
- O exemplo visual incorreto deve ser renderizado (não apenas descrito em texto)
- Sempre explicar o motivo, não apenas mostrar o resultado
- Pares adicionais podem cobrir: conteúdo (label incorreto), composição (uso incorreto com outros componentes) e acessibilidade (falta de aria-label)

---

## Bloco 2 — Referência Técnica

### 6. **Importação (Obrigatório)**

Fornece os imports necessários para cada nível de uso do componente.

```tsx
<section>
  <h2 className="mb-4">Importação</h2>
  <ComponentDemo>
    <div className="space-y-4">

      {/* Import básico */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Import básico (uso mínimo):</p>
        <div className="bg-muted p-4 rounded-md">
          <code className="text-sm">
            import {'{ ComponentePrincipal }'} from &quot;@/components/ui/nome-componente&quot;
          </code>
        </div>
      </div>

      {/* Import completo — apenas para componentes compostos */}
      {/* <div>
        <p className="text-sm text-muted-foreground mb-2">Import completo (todos os subcomponentes):</p>
        <div className="bg-muted p-4 rounded-md">
          <code className="text-sm">
            import {'{ Comp, CompTrigger, CompContent, CompItem }'} from "@/components/ui/nome"
          </code>
        </div>
      </div> */}

      {/* Dependências externas — apenas quando existirem */}
      {/* <div className="bg-warning/10 border border-warning/30 rounded-md p-4">
        <p className="text-sm font-medium mb-2">⚠️ Dependências externas obrigatórias:</p>
        <div className="space-y-2 text-sm">
          <p>Instalar:</p>
          <code className="block bg-muted p-2 rounded text-xs">npm install nome-pacote</code>
          <p>Configurar no root da aplicação:</p>
          <code className="block bg-muted p-2 rounded text-xs">
            {"// App.tsx ou layout.tsx\n<Provider>\n  <App />\n</Provider>"}
          </code>
        </div>
      </div> */}

    </div>
  </ComponentDemo>
</section>
```

**Regras:**
- Import básico é obrigatório para todos os componentes
- Import completo é obrigatório para componentes compostos (Dialog, Select, Form, etc.)
- O bloco de dependências externas é obrigatório para: `Form` (react-hook-form + zod), `Chart` (recharts), `Sonner` (provider no root)
- Usar sempre o path alias `@/components/ui/` em vez de caminhos relativos

---

### 7. **Exemplos de Código (Obrigatório)**

Exemplos funcionais nomeados descritivamente — cada nome vira um Story no Storybook.

```tsx
<section>
  <h2 className="mb-4">Exemplos de Código</h2>
  <ComponentDemo>
    <div className="space-y-8">

      {/* Cada exemplo deve ter: título descritivo, preview e código */}
      <div className="space-y-3">
        <h3>Uso Básico</h3>
        {/* Preview do componente */}
        <div className="border border-border rounded-md p-4">
          {/* Componente renderizado */}
        </div>
        {/* Código correspondente */}
        <div className="bg-muted p-4 rounded-md">
          <code className="text-sm block whitespace-pre">
{`<NomeComponente>
  Conteúdo
</NomeComponente>`}
          </code>
        </div>
      </div>

      {/* Exemplo: Com Estado Controlado */}
      {/* <div className="space-y-3">
        <h3>Com Estado Controlado</h3>
        ...
      </div> */}

      {/* Exemplo: Composto com Outros Componentes */}
      {/* <div className="space-y-3">
        <h3>Integrado com Form</h3>
        ...
      </div> */}

    </div>
  </ComponentDemo>
</section>
```

**Regras de nomenclatura dos exemplos** (nomes viram Stories no Storybook):
- `Uso Básico` — caso mais simples possível
- `Com Estado Controlado` — quando o componente suporta `value` + `onValueChange`
- `Não Controlado` — quando suporta `defaultValue`
- `Com Ícone` — quando relevante
- `Desabilitado` — estado disabled
- `Com Erro` — estado de validação
- `Integrado com Form` — para componentes de formulário

**Regras gerais:**
- Todo exemplo deve ser autocontido e renderizável
- Mostrar obrigatoriamente o par controlado/não controlado para inputs, selects, switches e checkboxes
- O código exibido deve ser exatamente o que renderiza o preview acima dele
- Para componentes de formulário (Input, Select, Checkbox, Switch, Textarea), o exemplo `Integrado com Form` é **obrigatório** e deve mostrar o `FormField` completo com schema Zod e mensagem de erro:

```tsx
{/* Exemplo obrigatório para componentes de formulário */}
<div className="space-y-3">
  <h3>Integrado com Form</h3>
  <div className="border border-border rounded-md p-4">
    {/* Preview com Form, FormField, FormItem, FormLabel, FormControl, FormMessage */}
  </div>
  <div className="bg-muted p-4 rounded-md">
    <code className="text-sm block whitespace-pre">
{`// Schema Zod
const schema = z.object({
  campo: z.string().min(1, "Campo obrigatório"),
})

// Uso no formulário
<Form {...form}>
  <FormField
    control={form.control}
    name="campo"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl>
          <NomeComponente {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>`}
    </code>
  </div>
</div>
```

---

### 8. **Variantes (Obrigatório)**

Demonstração visual de todas as variantes disponíveis via prop `variant`.

```tsx
<section>
  <h2 className="mb-4">Variantes</h2>
  <ComponentDemo>
    <div className="space-y-6">

      {/* Grade de variantes visuais */}
      <div>
        <h3 className="mb-3">Variantes Disponíveis</h3>
        <div className="flex flex-wrap gap-3">
          {/* Uma instância por variante, com label abaixo */}
          <div className="flex flex-col items-center gap-2">
            {/* <ComponentePrincipal variant="default">Default</ComponentePrincipal> */}
            <span className="text-xs text-muted-foreground">default</span>
          </div>
          {/* Repetir para cada variante */}
        </div>
      </div>

      {/* Tamanhos, quando aplicável */}
      {/* <div>
        <h3 className="mb-3">Tamanhos</h3>
        <div className="flex flex-wrap items-center gap-3">
          ...
        </div>
      </div> */}

    </div>
  </ComponentDemo>
</section>
```

**Regras:**
- Mostrar obrigatoriamente todas as variantes definidas no componente Shadcn/UI
- Mostrar tamanhos separados das variantes (são props distintas)
- Usar label textual abaixo de cada variante com o valor exato da prop (`"default"`, `"outline"`, etc.)
- Não misturar variantes com estados (hover, disabled) — estados ficam na seção 9

---

### 9. **Estados (Obrigatório para componentes interativos)**

Documenta os estados visuais do componente separados das variantes de aparência.

```tsx
<section>
  <h2 className="mb-4">Estados</h2>
  <ComponentDemo>
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-3 bg-muted/50 border-r border-border">Estado</th>
            <th className="text-left p-3 bg-muted/50 border-r border-border">Visual</th>
            <th className="text-left p-3 bg-muted/50">Como ativar</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="p-3 border-r border-border font-medium">Default</td>
            <td className="p-3 border-r border-border">
              {/* Componente no estado padrão */}
            </td>
            <td className="p-3 text-sm text-muted-foreground">Estado inicial sem props adicionais</td>
          </tr>
          <tr className="border-b border-border bg-muted/20">
            <td className="p-3 border-r border-border font-medium">Hover</td>
            <td className="p-3 border-r border-border">
              <span className="text-sm text-muted-foreground">Passar o cursor sobre o componente</span>
            </td>
            <td className="p-3 text-sm text-muted-foreground">CSS: <code>hover:*</code> via Tailwind</td>
          </tr>
          <tr className="border-b border-border">
            <td className="p-3 border-r border-border font-medium">Focus</td>
            <td className="p-3 border-r border-border">
              {/* Componente com className de foco visível */}
            </td>
            <td className="p-3 text-sm text-muted-foreground"><code>focus-visible:ring-2 focus-visible:ring-ring</code></td>
          </tr>
          <tr className="border-b border-border bg-muted/20">
            <td className="p-3 border-r border-border font-medium">Disabled</td>
            <td className="p-3 border-r border-border">
              {/* <ComponentePrincipal disabled>Texto</ComponentePrincipal> */}
            </td>
            <td className="p-3 text-sm text-muted-foreground">Prop: <code>disabled</code></td>
          </tr>
          <tr className="border-b border-border">
            <td className="p-3 border-r border-border font-medium">Error</td>
            <td className="p-3 border-r border-border">
              {/* Componente em estado de erro */}
            </td>
            <td className="p-3 text-sm text-muted-foreground">Classe: <code>border-destructive</code> ou prop de validação do Form</td>
          </tr>
          {/* Adicionar Loading quando o componente suportar */}
          {/* <tr className="border-b border-border bg-muted/20">
            <td className="p-3 border-r border-border font-medium">Loading</td>
            <td className="p-3 border-r border-border">
              <Loader2 className="h-4 w-4 animate-spin" />
            </td>
            <td className="p-3 text-sm text-muted-foreground">Substituir conteúdo por Skeleton ou Loader2</td>
          </tr> */}
        </tbody>
      </table>
    </div>
  </ComponentDemo>
</section>
```

**Estados obrigatórios por tipo de componente:**

| Tipo | Estados obrigatórios |
|------|---------------------|
| Botões e links | Default, Hover, Focus, Disabled |
| Inputs e Selects | Default, Focus, Disabled, Error |
| Toggles e Switches | Default (on/off), Disabled |
| Overlays (Dialog, Popover) | Fechado, Aberto |
| Componentes estáticos (Badge, Separator) | Esta seção pode ser omitida |

**Responsividade — componentes com comportamento diferente em mobile:**

Para componentes que mudam de comportamento ou layout em telas menores, adicionar uma linha extra na tabela de estados documentando o comportamento mobile:

| Componente | Comportamento mobile | Como ativar |
|------------|---------------------|-------------|
| Drawer | Abre pela base da tela (bottom) em vez de lateral | Automático via `useIsMobile()` |
| Menubar | Colapsa em menu hamburguer | Implementar manualmente com Sheet |
| Carousel | Suporte a swipe touch nativo | Embutido via Embla |
| Sidebar | Modo overlay (sobrepõe o conteúdo) | Gerenciado pelo `SidebarProvider` |

Para os demais componentes, garantir que o touch target mínimo de **44×44px** está respeitado.

---

### 10. **Propriedades (Obrigatório)**

Referência completa das props aceitas pelo componente e seus subcomponentes.

```tsx
<section>
  <h2 className="mb-4">Propriedades</h2>
  <ComponentDemo>
    <div className="space-y-8">

      {/* Interface TypeScript — sempre acima da primeira tabela */}
      <div>
        <h3 className="mb-3">Interface TypeScript</h3>
        <div className="bg-muted p-4 rounded-md overflow-x-auto">
          <code className="text-sm block whitespace-pre">
{`interface NomeComponenteProps {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  disabled?: boolean
  className?: string
  children?: React.ReactNode
  // Callbacks — sempre com assinatura completa
  onChange?: (value: string) => void
}`}
          </code>
        </div>
      </div>

      {/* Tabela do componente principal */}
      <div>
        <h3 className="mb-3">NomeComponente</h3>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 bg-muted/50 border-r border-border">Propriedade</th>
                <th className="text-left p-3 bg-muted/50 border-r border-border">Tipo</th>
                <th className="text-left p-3 bg-muted/50 border-r border-border">Padrão</th>
                <th className="text-left p-3 bg-muted/50 border-r border-border">Obrigatório</th>
                <th className="text-left p-3 bg-muted/50">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3 border-r border-border"><code>variant</code></td>
                <td className="p-3 border-r border-border"><code>"default" | "outline"</code></td>
                <td className="p-3 border-r border-border"><code>"default"</code></td>
                <td className="p-3 border-r border-border">Não</td>
                <td className="p-3">Variante visual do componente</td>
              </tr>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-3 border-r border-border"><code>onChange</code></td>
                <td className="p-3 border-r border-border"><code>(value: string) =&gt; void</code></td>
                <td className="p-3 border-r border-border">—</td>
                <td className="p-3 border-r border-border">Não</td>
                <td className="p-3">Callback disparado ao alterar o valor</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Subtabelas de subcomponentes — obrigatório para componentes compostos */}
      {/* <div>
        <h3 className="mb-3">NomeSubComponente</h3>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            ...mesma estrutura com 5 colunas...
          </table>
        </div>
      </div> */}

    </div>
  </ComponentDemo>
</section>
```

**Regras:**
- Coluna **Obrigatório** (Sim / Não) em todas as tabelas de propriedades
- Para componentes compostos, criar uma **subtabela por subcomponente** com `<h3>` de separação
- Callbacks devem exibir a **assinatura TypeScript completa** na coluna Tipo
- A interface TypeScript acima da tabela é obrigatória e facilita a migração para Storybook Autodocs

**Nota fixa sobre extensibilidade — incluir sempre que o componente suportar:**

```tsx
{/* Adicionar após as tabelas de props */}
<div className="bg-muted p-4 rounded-md space-y-3 text-sm">
  <h4>Extensibilidade</h4>
  <div className="space-y-2 text-muted-foreground">
    <p>
      <code>className</code> — todos os componentes aceitam className para sobrescrever estilos Tailwind.
      Prefer extensão via tokens CSS; use className apenas para ajustes pontuais que não pertencem ao tema.
    </p>
    {/* Incluir apenas se o componente suportar asChild */}
    {/* <p>
      <code>asChild</code> — substitui o elemento raiz pelo filho direto via padrão Radix Slot.
      Use para renderizar o componente como outro elemento sem perder comportamento.
      Ex: <code>&lt;Button asChild&gt;&lt;a href="..."&gt;Link&lt;/a&gt;&lt;/Button&gt;</code>
    </p> */}
  </div>
</div>
```

---

### 11. **Design Tokens (Obrigatório)**

Documenta quais variáveis CSS o componente consome e como personalizá-lo via tema.

```tsx
<section>
  <h2 className="mb-4">Design Tokens</h2>
  <ComponentDemo>
    <div className="space-y-4">

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 bg-muted/50 border-r border-border">Token CSS</th>
              <th className="text-left p-3 bg-muted/50 border-r border-border">Classe Tailwind</th>
              <th className="text-left p-3 bg-muted/50 border-r border-border">Parte do componente</th>
              <th className="text-left p-3 bg-muted/50 border-r border-border">Valor padrão (HSL)</th>
              <th className="text-left p-3 bg-muted/50">Valor dark mode (HSL)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="p-3 border-r border-border"><code>--primary</code></td>
              <td className="p-3 border-r border-border"><code>bg-primary</code></td>
              <td className="p-3 border-r border-border">Fundo (variante default)</td>
              <td className="p-3 border-r border-border"><code>220 44% 57%</code></td>
              <td className="p-3"><code>238 50% 87%</code></td>
            </tr>
            <tr className="border-b border-border bg-muted/20">
              <td className="p-3 border-r border-border"><code>--primary-foreground</code></td>
              <td className="p-3 border-r border-border"><code>text-primary-foreground</code></td>
              <td className="p-3 border-r border-border">Texto (variante default)</td>
              <td className="p-3 border-r border-border"><code>0 0% 100%</code></td>
              <td className="p-3"><code>0 0% 100%</code></td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-3 border-r border-border"><code>--radius</code></td>
              <td className="p-3 border-r border-border"><code>rounded-md</code></td>
              <td className="p-3 border-r border-border">Border radius</td>
              <td className="p-3 border-r border-border"><code>8px</code></td>
              <td className="p-3"><code>8px</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-muted p-4 rounded-md">
        <p className="text-sm font-medium mb-2">Como personalizar via tema:</p>
        <code className="text-sm block whitespace-pre">
{`/* Em globals.css ou theme-custom.css */
html.meu-tema {
  --primary: 262 80% 58%; /* Roxo — light mode */
}
html.meu-tema.dark {
  --primary: 262 60% 75%; /* Roxo — dark mode */
}`}
        </code>
      </div>

    </div>
  </ComponentDemo>
</section>
```

**Regras:**
- Listar apenas os tokens que o componente efetivamente consome
- Valores em formato HSL sem `hsl()` (ex: `220 44% 57%`)
- A coluna "Valor dark mode" é obrigatória quando o token muda entre modos. Quando o valor é idêntico, repetir o valor para deixar explícito
- Para componentes simples sem tokens significativos, reduzir a uma nota textual

---

## Bloco 3 — Contexto e Orientação

### 12. **Acessibilidade (Obrigatório)**

Documenta os recursos de acessibilidade implementados e o comportamento com tecnologias assistivas.

```tsx
<section>
  <h2 className="mb-4">Acessibilidade</h2>
  <ComponentDemo>
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-md space-y-2">
        <h4>♿ Recursos de Acessibilidade</h4>
        <ul className="space-y-1 text-sm">
          {/* Itens específicos do componente */}
          <li>✓ Navegação por teclado (Tab, Arrow keys, Enter, Space, Escape)</li>
          <li>✓ Atributos ARIA apropriados (<code>role</code>, <code>aria-label</code>, <code>aria-describedby</code>, etc.)</li>
          <li>✓ Estados de foco visíveis com <code>focus-visible:ring-2 focus-visible:ring-ring</code></li>
          <li>✓ Suporte a leitores de tela</li>
          <li>✓ Contraste adequado conforme WCAG 2.1 AA</li>
        </ul>
      </div>
    </div>
  </ComponentDemo>
</section>
```

**Conteúdo obrigatório:**
- Navegação por teclado específica do componente (quais teclas fazem o quê)
- Atributos ARIA relevantes
- Confirmação de `focus-visible:ring-2 focus-visible:ring-ring`
- O que é anunciado por leitores de tela e em que ordem
- Touch targets para mobile (mínimo 44×44px para elementos interativos)

---

### 13. **Componentes Relacionados (Obrigatório)**

Orienta a escolha entre alternativas e aponta integrações comuns.

```tsx
<section>
  <h2 className="mb-4">Componentes Relacionados</h2>
  <ComponentDemo>
    <div className="space-y-4">

      <div className="space-y-3">
        <h4>Alternativas</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 border border-border rounded-md">
            <div>
              <p className="text-sm font-medium">NomeAlternativa</p>
              <p className="text-sm text-muted-foreground">
                Use em vez deste quando: [critério de decisão claro e específico].
              </p>
            </div>
          </div>
          {/* Repetir para cada alternativa relevante */}
        </div>
      </div>

      {/* Costuma ser usado com — opcional */}
      {/* <div className="space-y-3">
        <h4>Costuma ser usado com</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">NomeComponente</Badge>
        </div>
      </div> */}

    </div>
  </ComponentDemo>
</section>
```

**Regras:**
- Mínimo 1 alternativa documentada por componente
- A frase "Use em vez deste quando" deve ser específica (contexto, quantidade, urgência)
- "Costuma ser usado com" é opcional — incluir apenas para integrações não óbvias

---

### 14. **Notas e Dicas (Obrigatório)**

Boas práticas, armadilhas comuns e observações específicas do componente.

```tsx
<section>
  <h2 className="mb-4">Notas e Dicas</h2>
  <ComponentDemo>
    <div className="text-sm text-muted-foreground space-y-4">

      {/* Dicas positivas - Use CheckCircle2 do lucide-react */}
      <div className="flex gap-2 items-start">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground">Título da Dica</p>
          <p>Descrição detalhada da dica. Use <code>código inline</code> quando necessário.</p>
        </div>
      </div>

      {/* Avisos/Cuidados - Use XCircle do lucide-react */}
      <div className="flex gap-2 items-start">
        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground">Título do Aviso</p>
          <p>Descrição detalhada do aviso ou cuidado específico deste componente.</p>
        </div>
      </div>

    </div>
  </ComponentDemo>
</section>
```

**Estrutura Visual Obrigatória:**
- Container externo: `<div className="text-sm text-muted-foreground space-y-4">`
- Dicas positivas: `<CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />`
- Avisos/cuidados: `<XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />`
- Título de cada item: `<p className="text-foreground">Título</p>`

**Importações necessárias:**
```tsx
import { CheckCircle2, XCircle } from 'lucide-react';
```

---

## Bloco 4 — Qualidade

### 15. **Critérios de Teste (Obrigatório para componentes interativos)**

Define os comportamentos que qualquer forma de verificação deve confirmar — Jest/RTL, Storybook play functions, testes manuais ou E2E. Não contém código de teste: contém o **contrato** que os testes devem validar.

> Esta seção pode ser omitida para componentes puramente estáticos (Badge, Separator, Avatar sem interação). Para todos os demais, é obrigatória.

```tsx
<section>
  <h2 className="mb-4">Critérios de Teste</h2>
  <ComponentDemo>
    <div className="space-y-6">

      {/* 1. Comportamento Funcional */}
      <div className="space-y-3">
        <h3>Comportamento Funcional</h3>
        <p className="text-sm text-muted-foreground">
          O que deve acontecer em resposta a cada interação. Base para testes Jest/RTL e Storybook play functions.
        </p>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 bg-muted/50 border-r border-border">Ação do usuário</th>
                <th className="text-left p-3 bg-muted/50 border-r border-border">Resultado esperado</th>
                <th className="text-left p-3 bg-muted/50">Prioridade</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3 border-r border-border">Clicar no trigger</td>
                <td className="p-3 border-r border-border">Conteúdo abre; foco move para o primeiro item interativo</td>
                <td className="p-3">Alta</td>
              </tr>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-3 border-r border-border">Pressionar Escape com o componente aberto</td>
                <td className="p-3 border-r border-border">Componente fecha; foco retorna ao trigger</td>
                <td className="p-3">Alta</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 border-r border-border">Clicar fora do componente</td>
                <td className="p-3 border-r border-border">Componente fecha sem disparar onChange</td>
                <td className="p-3">Alta</td>
              </tr>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-3 border-r border-border">Navegar com Tab</td>
                <td className="p-3 border-r border-border">Foco percorre todos os elementos interativos na ordem correta</td>
                <td className="p-3">Alta</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 border-r border-border">Interagir com componente disabled</td>
                <td className="p-3 border-r border-border">Nenhum evento disparado; cursor não-permitido visível</td>
                <td className="p-3">Média</td>
              </tr>
              {/* Adicionar linhas específicas do componente */}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Acessibilidade Verificável */}
      <div className="space-y-3">
        <h3>Acessibilidade Verificável</h3>
        <p className="text-sm text-muted-foreground">
          Critérios que ferramentas automatizadas (jest-axe, axe-core) devem confirmar.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2 items-start">
            <span className="text-muted-foreground mt-0.5">•</span>
            <span>Sem violações de acessibilidade reportadas pelo axe-core no estado padrão</span>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-muted-foreground mt-0.5">•</span>
            <span>Contraste mínimo de 4.5:1 entre texto e fundo em todos os estados (WCAG 2.1 AA)</span>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-muted-foreground mt-0.5">•</span>
            <span>Focus ring visível (<code>focus-visible:ring-2</code>) em todos os elementos interativos</span>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-muted-foreground mt-0.5">•</span>
            <span>Atributos ARIA corretos anunciados pelo leitor de tela no estado aberto/fechado</span>
          </li>
          {/* Adicionar critérios específicos do componente */}
        </ul>
      </div>

      {/* 3. Regressão Visual */}
      <div className="space-y-3">
        <h3>Regressão Visual</h3>
        <p className="text-sm text-muted-foreground">
          Estados que devem ter snapshot capturado pelo Storybook/Chromatic. Qualquer mudança visual nesses estados exige revisão de design antes do merge.
        </p>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 bg-muted/50 border-r border-border">Story / Estado</th>
                <th className="text-left p-3 bg-muted/50 border-r border-border">Tema light</th>
                <th className="text-left p-3 bg-muted/50 border-r border-border">Tema dark</th>
                <th className="text-left p-3 bg-muted/50">Prioridade</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3 border-r border-border">Default (variante padrão)</td>
                <td className="p-3 border-r border-border">✓ Obrigatório</td>
                <td className="p-3 border-r border-border">✓ Obrigatório</td>
                <td className="p-3">Alta</td>
              </tr>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-3 border-r border-border">Todas as variantes</td>
                <td className="p-3 border-r border-border">✓ Obrigatório</td>
                <td className="p-3 border-r border-border">✓ Obrigatório</td>
                <td className="p-3">Alta</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 border-r border-border">Estado disabled</td>
                <td className="p-3 border-r border-border">✓ Obrigatório</td>
                <td className="p-3 border-r border-border">✓ Obrigatório</td>
                <td className="p-3">Alta</td>
              </tr>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-3 border-r border-border">Estado de erro (quando aplicável)</td>
                <td className="p-3 border-r border-border">✓ Obrigatório</td>
                <td className="p-3 border-r border-border">✓ Obrigatório</td>
                <td className="p-3">Média</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 border-r border-border">Com conteúdo longo (truncamento)</td>
                <td className="p-3 border-r border-border">✓ Obrigatório</td>
                <td className="p-3 border-r border-border">Opcional</td>
                <td className="p-3">Média</td>
              </tr>
              {/* Adicionar estados específicos do componente */}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Para o tema personalizado (light e dark), aplicar os mesmos snapshots de alta prioridade.
        </p>
      </div>

    </div>
  </ComponentDemo>
</section>
```

**Regras:**
- A tabela de Comportamento Funcional deve conter no mínimo os 5 cenários do template, acrescidos dos cenários específicos do componente
- A coluna Prioridade usa: **Alta** (bloqueia merge se falhar), **Média** (deve ser corrigido na mesma sprint), **Baixa** (registrar como debt)
- A tabela de Regressão Visual define o contrato visual com o time de design — qualquer mudança nos estados de Alta prioridade requer aprovação de design antes do merge
- Esta seção documenta **o que testar**, não **como implementar os testes**. O código de teste vive em arquivos `.test.tsx` seguindo as diretrizes do arquivo `17-system-design.md`

---

## Regras Gerais de Implementação

### Estrutura do Container Principal

```tsx
<div className="flex-1 h-full overflow-auto">
  <div className="p-8 space-y-12 max-w-4xl mx-auto">
    {/* Todas as 15 seções aqui */}
  </div>
</div>
```

### Importações Obrigatórias

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useTranslation } from '@/lib/i18n'
import { useSeoEffect } from '@/lib/use-seo'
import { track } from '@/lib/analytics'
import { sanitizeHtml } from '@/lib/sanitize-html'
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue'
import DocsNav from '@/components/docs/shared/DocsNav.vue'
import uiTranslations from '@/i18n/ui.json'
import componentTranslations from '@shared/content/{slug}/translations.json'

// ⚠️ OBRIGATÓRIO: locale vem de useTranslation, NÃO de store/pinia
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...componentTranslations })

useSeoEffect(computed(() => ({
  title: `${tContent('title')} — ${tContent('category')}`,
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: '{slug}',
})))
</script>
```

**Regra crítica:** o `locale` reativo deve vir do retorno de `useTranslation()`, **nunca** de `useLocaleStore()` ou Pinia direto. O `useTranslation` já encapsula o estado de locale e garante reatividade correta com `useSeoEffect`.

### Padrões de Nomenclatura

| Item | Padrão | Exemplo |
|------|--------|---------|
| Arquivo | `ComponenteNomeDocs.tsx` | `ButtonDocs.tsx` |
| Export | `export function ComponenteNomeDocs()` | `export function ButtonDocs()` |
| Exemplos de código | Nomes descritivos em PascalCase | `UsoBasico`, `ComIcone`, `Desabilitado` |

### Regras Específicas para Tabelas

Estrutura obrigatória para todas as tabelas:

```tsx
<div className="w-full overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b border-border">
        <th className="text-left p-3 bg-muted/50 border-r border-border">Coluna</th>
        {/* demais colunas com border-r, exceto a última */}
        <th className="text-left p-3 bg-muted/50">Última Coluna</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-border">
        {/* linhas pares — sem bg adicional */}
      </tr>
      <tr className="border-b border-border bg-muted/20">
        {/* linhas ímpares — com bg-muted/20 */}
      </tr>
    </tbody>
  </table>
</div>
```

---

## Seções Opcionais por Tipo de Componente

| Seção | Simples (Button, Badge) | Composto (Dialog, Select) | Com dependência externa (Form, Chart) |
|-------|------------------------|---------------------------|---------------------------------------|
| 3. Anatomia | Lista de 2–3 partes | Árvore de subcomponentes obrigatória | Árvore + configuração de provider |
| 9. Estados | Default, Hover, Focus, Disabled | + estados open/closed | + estados loading/error |
| 10. Propriedades | 1 tabela | 1 tabela por subcomponente | 1 tabela + opções da lib externa |
| 6. Importação | Import básico | Import completo | Import + bloco de pré-requisitos |
| 11. Design Tokens | Tabela completa | Tabela completa | Tabela completa |
| 15. Critérios de Teste | Pode ser omitida | Obrigatória | Obrigatória |

---

## Problemas Comuns a Evitar

1. **❌ Seções fora de ordem** — sempre seguir a sequência de 1–15
2. **❌ `DocsNav` sem wrapper `<nav>` sticky** — deve estar envolvido por `<nav class="sticky top-8 w-52 shrink-0 self-start space-y-5">` dentro do layout `flex gap-16 items-start`
3. **❌ Seção sem `id` correspondente** — cada `<section>` precisa do `id` que aparece no array `sections` da navegação
2. **❌ Tabelas sem coluna "Obrigatório"** — adicionar em todas as tabelas de propriedades
3. **❌ Callbacks sem assinatura TypeScript** — sempre exibir `(value: string) => void`, nunca apenas `function`
4. **❌ Exemplos de código sem nome descritivo** — o nome facilita a migração para Storybook
5. **❌ Componentes compostos sem subtabelas** — cada subcomponente tem sua própria tabela na seção 10
6. **❌ Do & Don't apenas com texto** — o exemplo incorreto deve ser renderizado visualmente
7. **❌ Seção de Estados omitida em componentes interativos** — obrigatória para tudo com hover/focus/disabled
8. **❌ Design Tokens sem coluna de dark mode** — sempre informar o valor em ambos os modos
9. **❌ Tabelas sem bordas verticais** — sempre usar `border-r border-border`
10. **❌ Tabelas sem zebrado** — alternar `bg-muted/20` nas linhas ímpares
11. **❌ Seção 15 com código de teste** — critérios de teste descrevem o quê verificar, nunca o como implementar
12. **❌ Seção 15 omitida em componentes interativos** — obrigatória para tudo que tem eventos, estados ou comportamento de teclado
13. **❌ UX Writing omitido em componentes com texto visível** — presente sempre que o componente expõe texto ao usuário
14. **❌ Labels de Button com "Clique aqui", "OK" ou "Sim"** — sempre usar verbo de ação específico no infinitivo
15. **❌ Mensagens de erro sem causa e orientação** — nunca apenas "Erro" ou "Campo inválido"
16. **❌ Placeholder usado como substituto de label** — label e placeholder têm funções distintas e ambos são obrigatórios quando o componente tem input

---

## Validação Final Obrigatória

Antes de considerar uma página de documentação completa, verificar:

**Estrutura:**
- [ ] 15 seções na ordem correta (ou seções omitidas com justificativa)
- [ ] Container usa `flex-1 h-full overflow-auto` + `p-8 max-w-4xl mx-auto space-y-12`
- [ ] `DocsNav` envolvido por `<nav>` com `sticky top-8 w-52 shrink-0 self-start` no layout flex de duas colunas
- [ ] Todas as `<section>` têm `id` correspondente ao array `sections` da navegação
- [ ] Seções omitidas removidas também do array `sections`

**Bloco 1 — Visão Geral:**
- [ ] Header tem: categoria, complexidade e comando Shadcn
- [ ] Demonstração usa dados mock realistas
- [ ] Anatomia mapeia partes visuais para subcomponentes React
- [ ] "Quando e Como Usar" tem os dois lados: usar e não usar
- [ ] UX Writing presente para todos os componentes com texto visível ao usuário
- [ ] Tabela de elementos de texto cobre todos os tipos de texto do componente
- [ ] Bloco de mensagens de feedback presente para Alert, Toast, Form e Dialog
- [ ] Regras universais de escrita aplicadas (capitalização, pontuação, voz, tom de erro)
- [ ] Do & Don't tem mínimo 2 pares com exemplos visuais renderizados

**Bloco 2 — Referência Técnica:**
- [ ] Importação tem import básico + completo (compostos) + pré-requisitos (quando necessário)
- [ ] Exemplos de código têm nomes descritivos em PascalCase
- [ ] Par controlado/não controlado documentado para inputs e selects
- [ ] Componentes de formulário têm o exemplo "Integrado com Form" com schema Zod completo
- [ ] Variantes cobrem todas as opções da prop `variant`
- [ ] Seção de Estados presente para componentes interativos
- [ ] Responsividade documentada para componentes com comportamento mobile diferente
- [ ] Tabela de propriedades tem coluna "Obrigatório"
- [ ] Componentes compostos têm subtabela por subcomponente
- [ ] Callbacks mostram assinatura TypeScript completa
- [ ] Interface TypeScript exibida acima da tabela de props
- [ ] Nota de extensibilidade (className / asChild) presente quando aplicável
- [ ] Design Tokens lista tokens consumidos com valores HSL em light e dark mode

**Bloco 3 — Contexto e Orientação:**
- [ ] Acessibilidade lista navegação por teclado específica do componente
- [ ] Componentes Relacionados tem mínimo 1 alternativa com critério de decisão
- [ ] Notas e Dicas usa CheckCircle2 (dicas) e XCircle (avisos)
- [ ] Ícones decorativos têm `aria-hidden="true"`

**Bloco 4 — Qualidade:**
- [ ] Seção 15 presente para componentes interativos
- [ ] Tabela de Comportamento Funcional tem mínimo 5 cenários
- [ ] Critérios de acessibilidade verificável listados
- [ ] Tabela de Regressão Visual cobre variante padrão, todas as variantes e estado disabled
- [ ] Nenhum código de teste na seção 15 (apenas critérios descritivos)

**Qualidade geral:**
- [ ] Todas as tabelas têm `overflow-x-auto`, zebrado e bordas verticais
- [ ] Nenhum valor hardcoded de cor (usar tokens CSS)
- [ ] Exemplos de código são autocontidos e renderizáveis

---

## Componentes Presentacionais Compostos (padrão Table)

Componentes como **Table** expõem múltiplos sub-componentes independentes (9 no Vue: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`, `TableEmpty`), cada um envolvendo um elemento HTML semântico via `<script setup>` com classes estáticas (sem `cva()`). Seguem o mesmo template de 15 seções, com as seguintes adaptações:

1. **Anatomia** — uma entrada por sub-componente (`anatomy.item1` a `anatomy.item8`). `structureCode` mostra a árvore aninhada com `&lt;Table&gt;` na raiz usando sintaxe Vue (`v-for`, `:key`).

2. **Variantes → Composições** — sem `cva()`. `variants.items` lista composições recorrentes (`basic`, `withCaption`, `withFooter`, `empty`). Título da seção: `"Composições e Tamanhos"` (`variants.title`). Cards seguem §11.1 do guideline 08, mas a área de preview renderiza a composição montada (`<Table><TableHeader>…<TableBody>…`) em vez de passar uma prop `variant`.

3. **Tamanhos → Padrões de Densidade** — `variants.sizes` descreve convenções de altura aplicadas via `class` no `TableHead`/`TableCell` (`h-8` compact, `h-10` default, `h-12` comfortable) — **não** são props do componente. Cards seguem o mesmo layout de 3 linhas de §11.2 do guideline 08.

4. **Estados** — apenas estados estruturais: `hover` (automático via `hover:bg-muted/50`), `selected` (via `data-state="selected"`), `empty` (renderização condicional com `colspan`), `scroll` (automático via `overflow-x-auto`). **Omitir** `disabled`/`loading` — tabelas não são interativas.

5. **Propriedades** — cada sub-componente aceita atributos HTML nativos via `defineProps` com `HTMLAttributes`. Documentar chaves `props.table.*`: `class`, slot default (`children` em React), `colspan`, `rowspan`, `scope` (em `TableHead`), `data-state` (em `TableRow`). Interface TypeScript exibe `HTMLAttributes<HTMLTableElement>` (e variantes para section/row/cell/caption). **Sem** props customizadas (`variant`, `size`).

6. **Analytics** — componente estrutural; dispara apenas eventos da docs page (`docs_page_view`, `docs_section_viewed`, `language_switched`). Eventos de domínio (`table_sorted`, `row_selected`) pertencem a wrappers (ex: futuro `DataTable`), não à Table pura. A chave `analytics.description` deve explicitar: "Table é estrutural — não dispara eventos próprios".

7. **Estrutura de stories**:
   ```
   src/components/ui/table/
     ├── Table.vue                                 (wrapper div + <table>)
     ├── TableHeader.vue, TableBody.vue, TableFooter.vue
     ├── TableRow.vue, TableHead.vue, TableCell.vue
     ├── TableCaption.vue, TableEmpty.vue
     └── index.ts                                  (barrel export)

   src/components/ui/
     ├── table.stories.ts                          (meta + Playground com invoice demo)
     ├── table-composicoes.stories.ts              (basic, withCaption, withFooter, withSelection)
     ├── table-estados.stories.ts                  (hover, selected, empty, scroll)
     └── table-densidades.stories.ts               (compact, default, comfortable via class)
   ```
   **Omitir** `table-variantes` e `table-tamanhos` — não existem props `variant`/`size`.

8. **Play functions** — focam em estrutura semântica (não em interações):
   - `<caption>` presente e visível (caption-bottom)
   - Headers usam `<th>` com atributo `scope`
   - `data-state="selected"` aplica `bg-muted` persistente
   - `colspan` em footer cobre colunas corretas
   - Overflow horizontal aparece em viewport estreito
   - Estado vazio renderiza linha única com colspan total

9. **Render functions das stories** — `render: (args) => ({ components: { Table, TableHeader, ... }, setup() { return { args }; }, template: '...' })`. Registrar TODOS os sub-componentes usados no template. Para demos com dados, declarar arrays no `setup()` e iterar com `v-for`.