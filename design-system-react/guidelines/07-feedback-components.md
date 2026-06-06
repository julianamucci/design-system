# Feedback Components

---

## Alert

**Propósito**: mensagem estática e persistente que comunica informações importantes ao usuário dentro do fluxo da página. Use para mensagens que o usuário precisa ver e potencialmente agir — erros de validação de página, avisos de prazo, confirmações de estado. Para mensagens temporárias que dispensam atenção, usar **Sonner**.

**API e exemplos**: `src/components/ui/alert.tsx` + stories + `AlertDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão — Alert vs Sonner**:

| Situação | Componente |
|----------|------------|
| Mensagem persistente, requer atenção ou ação | Alert |
| Confirmação temporária de ação (salvo, enviado) | Sonner |
| Erro crítico que bloqueia o fluxo | Alert |
| Notificação não bloqueante, dispensável | Sonner |

**Estrutura de subcomponentes**:
```
Alert
├── [ícone Lucide]    (filho direto, sem wrapper)
├── AlertTitle        (título — opcional)
└── AlertDescription  (descrição do conteúdo)
```

**Variantes**:

| Variante | Tipo | Uso |
|---|---|---|
| `default` | nativa | Informativo, neutro |
| `destructive` | nativa | Erro / destrutivo |
| Success | via `className` (`bg-success/10 text-success border-success/30`) | Confirmação |
| Warning | via `className` (`bg-warning/10 text-warning border-warning/30`) | Aviso |

> As variantes `warning` e `success` não existem na API oficial — são implementadas via `className` com tokens do projeto.

**Ícones recomendados por contexto** (Lucide React):

| Contexto | Ícone |
|----------|-------|
| Sucesso / confirmação | `CheckCircle2` |
| Aviso / atenção | `AlertTriangle` |
| Erro / destrutivo | `XCircle` |
| Informativo / neutro | `Info` |

**Regras**:
- Ícone colocado como **filho direto** do `<Alert>`, antes de `AlertTitle` — sem `<div>` wrapper.
- `AlertTitle` é opcional — omitir quando a `AlertDescription` já é autoexplicativa.
- Para variantes success e warning, usar `bg-*/10` e `border-*/30` para fundo suave — não fundo sólido.

**Divergência de implementação cross-stack (intencional)**:
O posicionamento do ícone difere entre stacks por razões de versão do Shadcn/UI — **não corrigir**:
- React: `[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4` + `[&>svg~*]:pl-7` (seletor de irmão)
- Vue/Svelte: `has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]` (CSS grid, Shadcn mais recente)
- Basecoat: classe CSS `.alert` definida em `globals.css`

**Acessibilidade** (ver `11-acessibilidade.md`):
- O componente aplica `role="alert"` automaticamente — o leitor de tela anuncia o conteúdo ao ser inserido no DOM.
- Para alerts inseridos dinamicamente (não renderizados na montagem), adicionar `aria-live="polite"` no container pai.
- `aria-live="assertive"` apenas para erros críticos que exigem atenção imediata (ex.: falha de pagamento).
- Ícones com `aria-hidden="true"` — o texto já descreve o estado.
- Nunca usar cor como único indicador de estado — sempre acompanhar com ícone + texto (ver arquivo 11, seção daltonismo).

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Sucesso: passado simples, breve, sem exclamação — "Perfil atualizado."
- Aviso: consequência + ação disponível — "Assinatura expira em 3 dias. Renove agora."
- Erro: causa + orientação, sem culpar — "Não foi possível salvar. Verifique sua conexão."
- `AlertTitle`: frase nominal curta, sem ponto final.
- `AlertDescription`: frase completa com ponto final, máximo 2 linhas.

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
- Raramente rastreado — apenas quando o alerta tem ação relevante para o produto.
- Quando o usuário descarta um alerta importante: `alert_dismiss` com `label` (título do alerta).

---

## Alert Dialog

> **Documentação completa em `10-overlay-components.md`** — o AlertDialog é um componente de overlay e está documentado junto com Dialog, Sheet, Drawer e os demais overlays.

**Resumo de uso**: modal de confirmação para ações destrutivas ou irreversíveis. Diferencia-se do `Dialog` por não ter botão X de fechar — exige resposta explícita do usuário (confirmar ou cancelar).

---

## Badge

**Propósito**: rótulo compacto para indicar status, categoria, contagem ou atributo de um elemento.

**API e exemplos**: `src/components/ui/badge.tsx` + stories + `BadgeDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Variantes nativas** (únicas disponíveis via prop `variant`):

| Variante | Uso |
|----------|-----|
| `default` | Destaque principal — categoria, tag ativa |
| `secondary` | Informativo secundário — categoria neutra |
| `destructive` | Estado de erro ou alerta crítico |
| `outline` | Sutil, sem preenchimento — tag opcional |

> O Badge **não tem prop `size`**. Variações de tamanho são feitas via `className` customizado. Variantes `success` / `warning` via tokens (`bg-success/10 text-success border-success/30`, idem warning).

**Regras**:
- Texto máximo: 2 palavras — para mais contexto, usar outro componente.
- **Cor não é o único indicador de estado** — sempre acompanhar cor de status com ícone ou texto descritivo (ver arquivo 11, seção daltonismo).
- Contadores: limitar exibição a "99+" — não exibir números exatos acima de 99.
- Consistência obrigatória: mesma semântica de cor em todo o produto (não usar `destructive` para promoções).
- Badge clicável (link ou filtro): usar `asChild` com `<a>` ou `<button>` para semântica correta.

**Acessibilidade** (ver `11-acessibilidade.md`):
- Badge puramente decorativo (repetindo informação já visível): `aria-hidden="true"`.
- Badge de status sem contexto visual adjacente: `aria-label` descritivo — ex.: `aria-label="Status: Ativo"`.
- Ícones dentro do badge: `aria-hidden="true"` — o texto do badge já descreve o estado.

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Adjetivo ou substantivo de estado, 1–2 palavras, sem verbo, sem ponto final.
- Correto: "Ativo", "Pendente", "Em análise", "Novo", "Pro".
- Incorreto: "Está ativo", "Aguardando análise", "É novo".

**Analytics**: Badge sem ação não dispara eventos. Badge clicável (filtro, tag): `button_click` com `label`.

---

## Progress

**Propósito**: indicador visual de progresso de uma operação com duração mensurável. Use para operações de 3+ segundos com progresso mensurável — upload, processamento, carregamento. Para duração desconhecida, usar indeterminate. Para loading instantâneo, usar `Skeleton`.

**API e exemplos**: `src/components/ui/progress.tsx` + stories + `ProgressDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**:

| Prop | Função |
|---|---|
| `value` | Número 0–100. `undefined` para indeterminate (animar via CSS) |
| `className` | Cor do indicador via `[&>div]:bg-*` (sem variantes nativas de cor) |

**Regras**:
- `value` aceita número de 0 a 100.
- Para indeterminate: omitir `value` ou passar `undefined` e animar o indicador via CSS (`[&>div]:animate-indeterminate`).
- Sempre exibir porcentagem ou rótulo textual próximo ao componente — o Progress não exibe texto por padrão.
- Cor do indicador customizada via `[&>div]:bg-*` — o componente não tem variantes de cor nativas.

**Acessibilidade** (ver `11-acessibilidade.md`):
- Aplica `role="progressbar"`, `aria-valuenow`, `aria-valuemin` e `aria-valuemax` automaticamente via prop `value`.
- `aria-label` obrigatório — descreve o que está sendo medido.
- `aria-live="polite"` no elemento que exibe o valor textual — anuncia mudanças.
- `aria-busy="true"` no container durante o carregamento.

**Analytics**: passivo — não dispara eventos. Para rastrear conclusão de upload ou processo, disparar evento customizado no callback de conclusão.

---

## Skeleton

**Propósito**: placeholder visual que replica a estrutura do conteúdo enquanto ele carrega, reduzindo a percepção de tempo de espera. Use para loading de conteúdo com estrutura conhecida — cards, listas, perfis, tabelas. Para operações com progresso mensurável, usar `Progress`. Para loading < 300ms, não usar Skeleton.

**API e exemplos**: `src/components/ui/skeleton.tsx` + stories + `SkeletonDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- Dimensões do Skeleton devem aproximar as do conteúdo final — evita layout shift ao carregar.
- `rounded-full` para avatares e ícones circulares, `rounded-md` para retângulos.
- Não aninhar Skeletons em estruturas muito complexas — 2–3 elementos por bloco são suficientes.
- Animação padrão: `animate-pulse` — aplicada automaticamente pelo componente.

**Acessibilidade** (ver `11-acessibilidade.md`):
- `aria-hidden="true"` nos Skeletons — são decorativos.
- `aria-busy="true"` no container pai enquanto o conteúdo carrega — anuncia o estado de loading.
- `aria-label` no container descrevendo o que está carregando — "Carregando lista de usuários".
- `motion-reduce:animate-none` obrigatório — usuários com distúrbios vestibulares podem desativar animações.

**Analytics**: passivo — não dispara eventos. Rastrear tempo de carregamento no callback que substitui o Skeleton pelo conteúdo real.

---

## Sonner

**Propósito**: notificação toast temporária e não bloqueante para feedback de ações do usuário. Use para confirmações temporárias (salvo, enviado, copiado), notificações de sistema não críticas, feedback de operações em background. Para mensagens persistentes que exigem atenção ou ação, usar `Alert`.

**API e exemplos**: `src/components/ui/sonner.tsx` + stories + `SonnerDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Setup obrigatório**: o `<Toaster position="top-right" richColors />` deve ser adicionado uma vez no root da aplicação. Sem isso, os toasts não aparecem.

**API de uso** (importar de `sonner`):

| Função | Quando |
|---|---|
| `toast.success(msg, opts?)` | Confirmação de ação |
| `toast.error(msg, opts?)` | Erro recuperável |
| `toast.warning(msg, opts?)` | Aviso não-crítico |
| `toast.info(msg, opts?)` | Informação neutra |
| `toast(msg, opts?)` | Toast sem tipo semântico |
| `toast.promise(promise, { loading, success, error })` | Operações assíncronas |

**Opções relevantes**: `description`, `action: { label, onClick }`, `duration` (default 4000ms; `Infinity` para erros críticos), `dismissible`.

**Posições disponíveis**:
- `top-right` — **padrão do projeto**, não conflita com conteúdo fixo inferior.
- `bottom-right` — padrão do Sonner; evitar quando há footer fixo ou bottom navigation.
- `bottom-center` — mobile e layouts centralizados.
- `top-center`, `top-left`, `bottom-left` — casos específicos.

> Especificar `top-right` explicitamente no `<Toaster />` para evitar diferenças entre versões.

**Regras**:
- Máximo 3 toasts visíveis simultaneamente — o Sonner gerencia a fila automaticamente.
- Duração padrão: 4000ms — não alterar para mensagens de sucesso e informativas.
- `duration: Infinity` apenas para erros críticos que exigem ação do usuário.
- `toast.promise()` para qualquer operação assíncrona — evita toasts manuais de loading.
- Nunca usar toast para mensagens que exigem leitura longa — máximo 1 frase.
- `richColors` no `<Toaster />` para aplicar as cores do tema automaticamente.

**Acessibilidade** (ver `11-acessibilidade.md`):
- O Sonner usa `aria-live="polite"` internamente — toasts são anunciados ao leitor de tela sem interromper o fluxo.
- Toasts com ação (`action.label`) são focáveis por teclado.
- Não usar Sonner para erros de formulário — usar `FormMessage`.

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Máximo 1 frase no título, sem pontuação de ênfase.
- Passado simples para confirmações: "Perfil atualizado." não "Perfil atualizado com sucesso!".
- Causa + orientação para erros: "Não foi possível salvar. Tente novamente."
- Label da ação: verbo no infinitivo — "Desfazer", "Ver detalhes".

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
- O toast em si não dispara evento — o evento é da ação que o originou.
- Botão de ação dentro do toast: `toast_action_click` com `label`.

---

## Regras transversais de Feedback Components

**Critério Alert vs Sonner** (resumo):

| Alert | Sonner |
|-------|--------|
| Persistente, visível até ação | Temporário, auto-dismiss |
| Requer leitura e possível ação | Confirma ação já realizada |
| Inserido no fluxo da página | Sobreposto, não bloqueia |
| Erros críticos, avisos importantes | Sucesso, info, avisos não-críticos |

**Acessibilidade transversal** (ver `11-acessibilidade.md`):
- Cor nunca é o único indicador de estado — sempre acompanhar com ícone + texto
- `aria-hidden="true"` em Skeleton e em ícones decorativos dentro de Alerts e Badges
- `aria-busy="true"` no container durante loading (Skeleton, Progress)
- `aria-live="polite"` para mudanças dinâmicas não críticas; `aria-live="assertive"` apenas para erros críticos
- `motion-reduce:animate-none` obrigatório em Skeleton

**Analytics transversal** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Componente | Evento | Quando |
|------------|--------|--------|
| Alert | `alert_dismiss` | Usuário descarta alerta com botão (opcional) |
| Alert Dialog | `dialog_open` / `dialog_confirm` / `dialog_close` | Abertura, confirmação e cancelamento |
| Sonner | `toast_action_click` | Clique no botão de ação do toast |
| Badge, Progress, Skeleton | — | Componentes passivos, sem eventos |

**UX Writing transversal** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Sucesso: afirmativo, passado, breve — "Salvo.", "Enviado."
- Erro: causa + orientação — "Não foi possível conectar. Verifique sua rede."
- Aviso: consequência + opção — "Sessão expira em 5 min. Salve seu trabalho."
- Badge: adjetivo de estado, 1–2 palavras — "Ativo", "Pendente"
