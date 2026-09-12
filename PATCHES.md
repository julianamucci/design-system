# PATCHES — Customizações sobre libs primitivas e wrappers upstream

Este arquivo registra toda divergência intencional entre este design system e suas dependências upstream: as libs primitivas (`@base-ui/react`, `reka-ui`, `bits-ui`) e libs externas de componente (`sonner`, `cmdk`, `react-day-picker`, `lucide`, etc.). O stack Vanilla é standalone (factories + CSS `.nds-*`) e não tem upstream. Serve de checklist obrigatório ao atualizar dependências.

## Princípios

1. **Wrapper-first.** Se a customização pode viver em um wrapper sem tocar o código upstream, é wrapper. Só patche o arquivo upstream quando a mudança é estrutural (tag HTML, role, ordem de nós, comportamento interno).
2. **Todo patch é marcado no código.** Cada linha alterada recebe um comentário imediatamente acima no formato:
   ```
   // PATCH: <categoria> — <motivo curto> (ver PATCHES.md#<anchor>)
   ```
   Categorias permitidas: `a11y`, `i18n`, `theme`, `security`, `bugfix`, `api` (extensão de API de factory Vanilla — a stack não tem upstream, mas a mudança de contrato é registrada aqui para rastreabilidade).
3. **Todo patch é descrito aqui.** Uma entrada por patch, com diff antes/depois, justificativa e link para PR/issue upstream se houver.
4. **Revisão obrigatória no bump.** Ao atualizar `@base-ui/react`, `reka-ui`, `bits-ui` ou as libs externas de componente, rode `npm run patches:list` e re-valide cada entrada.
5. **Patch que muda API pública varre TODAS as superfícies que descreviam a API
   antiga — e re-roda `/quality` no componente.** A auditoria anterior ao patch
   validou o mundo velho; ela não protege o patch. Caso registrado: o
   `#alert-five-variants` moveu variantes de className para a prop `variant` e
   declarou isso na própria mensagem, mas deixou a description do `className`
   ensinando o caminho antigo e 7 uniões de tipo em `"default" | "destructive"`
   nas docs pages — descoberto 3 dias depois, por leitura humana. Checklist
   mínimo da varredura: `props.table.*` (descriptions E types), `interfaceCode`,
   `argTypes` das stories, exemplos de `usage`/`doDont`, **as STORIES que
   demonstram a API antiga**, `testes.*` do translations.json, e —
   principalmente — **`guidelines/RULES.md` e as skills**: é a camada que
   REGENERA componente novo, e foi nela que "variante via className" sobreviveu
   mais tempo (as stories erradas de Success/Warning nasceram de agents
   seguindo o RULES.md à risca). O grep pelos nomes dos valores antigos é
   repo-wide, não só no componente.

> **Histórico de stack de primitivas (React):**
> - Até 2026-04-21: `@radix-ui/react-*` individuais (modo legado)
> - De 2026-04-21 em diante: `@base-ui/react`. **Zero deps `@radix-ui/*`** — `form.tsx`, `toast.tsx`, `toaster.tsx` e `use-toast.ts` foram deletados (órfãos; App.tsx já usava `sonner` há algum tempo).
>
> **Breaking changes de comportamento cross-stack pós-migração nova (2026-04-21):**
> - **React (base-ui):** `asChild` prop removido — usar `render={<Component />}` prop. `Accordion` usa `aria-disabled` em vez de atributo `disabled` nativo.
> - **Svelte (bits-ui 2.18):** `AlertDialogAction` **não fecha automaticamente** o dialog — consumidor precisa fazer `open = false` no handler. *(Resolvido no wrapper: hoje a Action renderiza `Dialog.Close` e fecha pelo caminho oficial — `alert-dialog-action.svelte`.)* `Accordion` não aceita mais `defaultValue` — usar `bind:value`.
> - **Vue (reka-ui 2.9.6):** `AvatarImage` força `role="img"` no `<img>` — alt vazio (`alt=""`) causa violação `aria-allowed-role`. Sempre usar alt descritivo.
> - **Todas stacks:** variante `destructive` agora é soft (`bg-destructive/10 text-destructive`) em vez de sólida. Mudança visual esperada.

## Fluxo de atualização

```bash
# 1. Antes de bumpar deps
npm run patches:list                          # inventário de patches ativos

# 2. Bump da lib primitiva/externa
cd nortear-design-system-react && npm update @base-ui/react

# 3. Após o bump, reavaliar cada entrada deste arquivo cujo upstream foi atualizado
#    (rodar os testes de verificação indicados na própria entrada)

# 4. Para cada patch redundante (upstream incorporou a fix):
#    - remover marker no código
#    - atualizar entrada aqui com status: "RESOLVIDO UPSTREAM (v X.Y.Z)"
```

## Como adicionar uma nova entrada

1. No arquivo customizado, adicione o comentário `// PATCH: a11y — ...` imediatamente acima da linha alterada.
2. Adicione uma seção abaixo (ordem alfabética por stack/componente) copiando o template abaixo.
3. Inclua sempre: trecho antes, trecho depois, motivo, data, ref. upstream se houver.

### Template

```markdown
### <stack>/<componente> — <título curto>

- **Arquivo:** `nortear-design-system-<stack>/src/components/ui/<slug>.<ext>`
- **Categoria:** a11y | i18n | theme | security | bugfix
- **Data:** YYYY-MM-DD
- **Upstream ref:** (issue/PR/discussion ou "—")

**Antes (upstream):**
```tsx
<div className="text-sm">{children}</div>
```

**Depois (custom):**
```tsx
// PATCH: a11y — <section> preserva a semântica de landmark exigida pelo grid
<section>{children}</section>
```

**Motivo:** (1–3 frases explicando o problema concreto e por que o wrapper não resolve)

**Verificação após bump:** (o que conferir para saber se o upstream corrigiu — ex: "conferir se o upstream já usa `<section>` na próxima major")
```

---

## Patches ativos

<!-- ordenar alfabeticamente por stack > componente -->

### react/accordion — navegação por setas no wrapper (base-ui não implementa) {#react-accordion-arrow-keys}

- **Arquivo:** `nortear-design-system-react/src/components/ui/accordion.tsx`
- **Categoria:** a11y
- **Data:** 2026-07-28
- **Upstream ref:** — (o `CompositeList` do `AccordionRoot` só registra refs dos itens; não há handler de teclado em nenhum arquivo do módulo `accordion`)

**Antes:**
```tsx
<AccordionPrimitive.Root data-slot="accordion" className={cn("nds-accordion", className)} {...props} />
```

**Depois:**
```tsx
// PATCH: a11y — o @base-ui/react não implementa navegação por setas no Accordion …
<AccordionPrimitive.Root … onKeyDown={handleKeyDown} {...props} />
// handleKeyDown: ArrowDown/ArrowUp com loop + Home/End, agindo só quando o
// foco está num [data-slot="accordion-trigger"] habilitado.
```

**Motivo:** `reka-ui`, `bits-ui` e a factory Vanilla trazem a navegação por setas, e `accessibility.keyboard` do `translations.json` documenta o comportamento nas 3 línguas. No React as setas caíam no scroll da página — divergência funcional e de acessibilidade contra as outras 3 stacks. O tipo do evento é derivado de `AccordionPrimitive.Root.Props["onKeyDown"]` para não depender do caminho interno do `BaseUIEvent`.

**Verificação após bump:** conferir se o `@base-ui/react` passou a tratar ArrowDown/ArrowUp no accordion (`grep -rn "ArrowDown" node_modules/@base-ui/react/accordion/`); se sim, remover o handler e manter só o repasse de `onKeyDown`.

### svelte/hover-card — `defaultOpen` no wrapper (bits-ui LinkPreview não tem) {#svelte-hovercard-defaultopen}

- **Arquivo:** `nortear-design-system-svelte/src/components/ui/hover-card/hover-card.svelte`
- **Categoria:** api
- **Data:** 2026-07-27
- **Upstream ref:** — (`bits-ui` expõe HoverCard como `LinkPreview`, cuja `RootProps` tem `open`/`onOpenChange`, sem `defaultOpen`)

**Antes:**
```svelte
let { open = $bindable(false), openDelay = 0, closeDelay = 0, ...restProps }: HoverCardPrimitive.RootProps = $props();
```

**Depois:**
```svelte
// PATCH: api — `defaultOpen` não existe no LinkPreview do bits-ui …
let {
  defaultOpen = false,
  open = $bindable(defaultOpen),
  openDelay = 0, closeDelay = 0, ...restProps
}: HoverCardPrimitive.RootProps & { defaultOpen?: boolean } = $props();
```

**Motivo:** `defaultOpen` é a API documentada do HoverCard nas 4 stacks (tabela de props e de estados do `HoverCardDocs`) e funciona no React (base-ui). Na Svelte as 8 demos que deveriam nascer abertas passavam `defaultOpen={true}` para uma prop inexistente — não abriam e o svelte-check acusava. O default do destructuring alimenta o valor inicial de `open`, preservando `bind:open` no consumidor (usado em `HoverCardStory.svelte`).

**Verificação após bump:** conferir se o `bits-ui` passou a expor `defaultOpen` no `LinkPreview.RootProps`; se sim, remover o patch e repassar direto.

### vanilla/carousel — `onIndexChange` expõe a origem da navegação {#vanilla-carousel-nav-source}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/carousel.ts`
- **Categoria:** api
- **Data:** 2026-07-27
- **Upstream ref:** — (factory standalone)

**Antes:**
```ts
onIndexChange?: (index: number) => void;
// goTo(index) — chamado por botões, ArrowLeft/Right, autoplay e mount, indistinguíveis
```

**Depois:**
```ts
export type CarouselNavSource = 'init' | 'button' | 'keyboard' | 'autoplay';
onIndexChange?: (index: number, source: CarouselNavSource) => void;
```

**Motivo:** o evento `slide_change` do catálogo tipado distingue `trigger: 'button' | 'swipe' | 'keyboard'`, mas o callback não informava a origem — a fiação de analytics reportava tudo como `button` (inclusive setas do teclado) e também disparava no posicionamento inicial do mount. Mudança aditiva: consumidores que ignoram o 2º parâmetro seguem funcionando.

**Verificação após bump:** n/a (sem upstream). Ao evoluir a factory, manter `'init'` no mount e a origem correta em cada caminho de navegação.

### vanilla/dropdown-menu — `onClose(reason)` com o motivo do fechamento {#vanilla-dropdown-menu-onclose-reason}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/dropdown-menu.ts`
- **Categoria:** api
- **Data:** 2026-09-11
- **Upstream ref:** —

**Antes:** só `onOpenChange(open)`.

**Depois:** tipo `DropdownMenuCloseReason` (`escape | overlay | api`) e a opção `onClose(reason)`, disparada antes do `onOpenChange(false)`; no modo controlado ela carrega o motivo da interação que pediu o fechamento até o `setOpen(false)` rodar. `close()`/`setOpen()` públicos passaram a ser embrulhados, para que entregá-los direto a um ouvinte não passe o evento como motivo. Junto, um conserto: escolher item devolve o foco ao gatilho — antes ele caía no `<body>`, contra o que o `testes.functional.item3` e o `accessibility.item5` prometem.

**Motivo:** o `dropdown_menu_close` passou a exigir `reason` (`prd/dropdown-menu.md` §9), e só a fábrica sabe por qual caminho o menu fechou. A mudança é aditiva.

**Destruir não é fechar** (2026-09-11, vale para o DropdownMenu, o ContextMenu e o Menubar): a fábrica destruída com o menu aberto não avisa nada — nem `onClose` nem `onOpenChange(false)`. Antes ela mandava `api`, e toda troca de idioma de uma docs page com um menu aberto virava um fechamento falso no GA4. As três `ListenerCleanup` conferem que o único aviso foi a abertura.

**Verificação após bump:** a play do `Playground` confere `api` (Enter), `escape` e `overlay` (clique fora).

### vanilla/menubar — abrir e fechar avisados por menu, com o motivo {#vanilla-menubar-open-close}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/menubar.ts`
- **Categoria:** api
- **Data:** 2026-09-11
- **Upstream ref:** —

**Antes:** a barra não avisava nada.

**Depois:** tipo `MenubarCloseReason` e, em cada `MenubarMenu`, `onOpenChange(open)` e `onClose(reason)`: `api` ao escolher item, `escape` no Escape, `overlay` no clique fora, no Tab, no clique no gatilho aberto e na passagem ao menu vizinho — o menu que fecha é avisado antes de o próximo abrir.

**Motivo:** sem isto a página não rastreava `menubar_open`, `menubar_close` nem `menubar_item_select` (decisão da dona em 2026-09-11: o Menubar rastreia no formato da família). A mudança é aditiva.

**Verificação após bump:** `Playground` do menubar confere `overlay` e `escape`; `ControlledOpen` passou a ler o fechamento do `onOpenChange`.

### vanilla/submenu — submenu dentro de submenu, por pilha de níveis {#vanilla-submenu-nested-levels}

- **Arquivo:** `nortear-design-system-vanilla/src/lib/submenu.ts`
- **Categoria:** api
- **Data:** 2026-09-11
- **Upstream ref:** —

**Antes:** um painel só — o gatilho de segundo nível fechava o próprio pai.

**Depois:** o controlador guarda uma pilha dos níveis abertos. Escape fecha só o mais fundo; a seta esquerda fecha o nível que tem o foco; cada um devolve o foco ao item que o abriu; `close()` fecha a pilha inteira. Novo `panelContaining(node)`, e `contains()` cobre todos os níveis. O atraso de fechamento por ponteiro só se cancela quando o ponteiro entra num painel que o fechamento pendente levaria.

**Motivo:** o Do & Don't do Menubar mostra, VIVO, o submenu dentro de submenu que ele desaconselha — o vanilla exibia um `<p>` dizendo que a fábrica não suportava. O comportamento de um nível só não muda.

**Verificação após bump:** a story `NestedSubmenu` do menubar (dois níveis; Escape e seta esquerda fecham um nível cada; escolher no mais fundo fecha tudo).

### vanilla/menubar — o rádio escolhe pelo teclado, e escolher a opção marcada também avisa {#vanilla-menubar-radio-keyboard-onclick}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/menubar.ts`
- **Categoria:** api
- **Data:** 2026-09-11
- **Upstream ref:** —

**Antes:** a opção de rádio só ouvia `click` — Enter e Espaço não a escolhiam (WCAG 2.1.1, na stack de referência), enquanto a marcação tinha `keydown`. E escolher a opção já marcada não avisava nada.

**Depois:** Enter e Espaço escolhem a opção, e `MenubarRadioOption.onClick` dispara em toda escolha, inclusive a da opção já marcada; o `onValueChange` continua só na mudança real. O rótulo abre um grupo nomeado por ele (`role="group"` + `aria-labelledby`), e o grupo de rádio que vem logo depois É esse grupo, sem um segundo aninhado.

**Motivo:** padrão de menu da WAI-ARIA APG, e o evento `menubar_item_select` sai igual ao do DropdownMenu e do ContextMenu. A mudança é aditiva.

**Verificação após bump:** `WithRadioGroup` das composições do menubar (passos de teclado e de reescolha, e o nome do grupo).

### vanilla/dropdown-menu — `inset` no item, no rótulo e no sub-gatilho {#vanilla-dropdown-menu-inset}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/dropdown-menu.ts`
- **Categoria:** api
- **Data:** 2026-09-11
- **Upstream ref:** —

**Depois:** `inset?: boolean` no item, no rótulo e no submenu, escrevendo `data-inset` só quando verdadeiro — como o ContextMenu e o Menubar já faziam. O `anatomy.item4` do conteúdo prometia o recuo, e a fábrica do DropdownMenu era a única da família sem ele.

**Motivo:** mesma folha, mesmo contrato (D9). A mudança é aditiva.

**Verificação após bump:** a story `ItemInset` de dropdown-menu-states.

### vanilla/sheet — `onClose(reason)` espelhando o Dialog {#vanilla-sheet-onclose-reason}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/sheet.ts`
- **Categoria:** api
- **Data:** 2026-07-27
- **Upstream ref:** — (factory standalone)

**Antes:**
```ts
onOpenChange?: (open: boolean) => void;
// close() único — overlay, Escape e botão X indistinguíveis
```

**Depois:**
```ts
export type SheetCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';
onClose?: (reason: SheetCloseReason) => void;
// closeWithReason(reason) interno; cada caminho de fechamento passa seu motivo
```

**Paridade cumprida em 2026-09-11**, e ela tinha uma palavra de atraso: o tipo
nasceu com TRÊS motivos e o `DialogCloseReason` da mesma stack já tinha quatro,
então o fechamento por decisão de dentro — confirmar, ou o programa recolher o
painel — não tinha palavra no Sheet. A docs page tapava o buraco sintetizando o
`api` por fora, que é o inverso da regra da casa: o vanilla é a referência de
contrato, e contrato remendado no consumidor não é contrato. Junto veio o
`close()` público (ver `#vanilla-overlay-close-api`).

**Motivo:** o evento `dialog_close` do catálogo tipado tem campo `reason`, e o Dialog factory já expõe `onClose(reason)` — o Sheet era o único overlay sem isso, deixando o analytics das docs pages sem distinguir escape/overlay/botão. Mudança aditiva; `onOpenChange(false)` continua disparando após `onClose`.

**Verificação após bump:** n/a (sem upstream). Manter paridade de assinatura com `DialogCloseReason` se o Dialog ganhar novos motivos. Obs.: o AlertDialog **não** recebe este patch — ele não fecha por clique no véu (D1 do `prd/alert-dialog.md`), e os três caminhos que fecham são Cancelar (`close-button`), a ação (`api`) e Escape (`escape`, que equivale a cancelar). Esta linha dizia que ele não fechava por Escape, o que nunca foi o comportamento documentado.

### vanilla/sheet+dialog — `close()` público, motivo `api` e fechamento por `data-slot` {#vanilla-overlay-close-api}

- **Arquivos:** `nortear-design-system-vanilla/src/components/ui/sheet.ts`, `nortear-design-system-vanilla/src/components/ui/dialog.ts`
- **Categoria:** api
- **Data:** 2026-09-11, ampliado em 2026-09-12
- **Upstream ref:** — (fábricas standalone)

**Antes:**
```ts
export type SheetCloseReason = 'escape' | 'overlay' | 'close-button';
// createSheet/createDialog devolvem só DestroyableElement: fechar por código
// exige destroy(), que encerra a INSTÂNCIA
// o X liga o próprio ouvinte; botão de fechar do consumidor não existe
```

**Depois:**
```ts
export type SheetCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';
// 2026-09-12: os verbos de ABERTURA entraram, e `trigger` virou opcional
export type SheetElement = DestroyableElement
  & { open: () => void; close: () => void; isOpen: () => boolean };
export type DialogElement = DestroyableElement
  & { open: () => void; close: () => void; isOpen: () => boolean };
// delegação no painel: [data-slot="sheet-close"] / [data-slot="dialog-close"]
// fecham com 'close-button'; o X carrega o slot e perdeu o ouvinte próprio
```

**Motivo:** o vocabulário de fechamento da família é `escape | overlay | close-button | api` (`18-overlay.md` §Analytics), e o `SheetCloseReason` do vanilla — a stack de referência de contrato — tinha três palavras contra as quatro do Dialog, do Drawer e do Sheet do Angular. Sem `api`, a docs page SINTETIZAVA o motivo por fora: fingia um clique no véu para fechar pelo rodapé e sobrescrevia o motivo relatado com uma variável de página. O Dialog tinha o buraco do outro lado: a docs page ensinava marcar o Cancelar do rodapé com `data-slot="dialog-close"` e nada escutava o slot, então o padrão documentado renderizava um Cancelar inerte. Mudança aditiva; `onOpenChange(false)` continua disparando depois de `onClose`. Junto entrou a guarda de fechamento repetido no `sheet.ts` (o `dialog.ts` já a tinha).

**Ampliação de 2026-09-12 — `open()`, `isOpen()` e `trigger` opcional.** A decisão anterior (`open()`/`toggle()`/`isOpen()` seguem FORA, "a abertura comandada ainda passa pelo gatilho interno") foi revista medindo o que aquele gatilho interno CUSTAVA. Ele era um `<button>` com `.nds-sr-only`, `tabindex="-1"` e `aria-hidden="true"`, clicado por código, e existia só porque `trigger` era obrigatório e a fábrica não sabia abrir — um botão que existe para não ser visto, publicado como padrão da casa em quatro pontos: a story `Controlled` do Sheet, o snippet que o painel Code dela publica, a `Controlled` do Dialog e, em outra roupa, o `MouseEvent` sintético do Ctrl+K das duas paletas de comando. `isOpen()` tem consumidor próprio (a atribuição `button`/`keyboard` da paleta) e aposenta o `let isOpen` que cada consumidor mantinha como espelho do estado da fábrica — espelho que era, na prática, a única guarda de reentrância do `open()` do Sheet, que não tinha a sua. **`toggle()` fica FORA, e agora por medição e não por omissão:** zero consumidores, e os dois candidatos reais exigem por escrito "só ABRE" (§9 do PRD do command); num painel modal o gesto que ele serviria já é o Escape, que informa `escape` — um `toggle()` fecharia o mesmo gesto como `api`.

**Verificação após bump:** n/a (sem upstream). Manter os quatro motivos iguais nas cinco stacks — o portão `reason_entre_stacks_divergente` reprova a divergência, e o `reason_da_familia_divergente` reprova o Sheet ficar atrás do Dialog dentro da MESMA stack, que é por onde esta diferença passou seis semanas. A divergência de VERBOS com o `DrawerElement` (que tem `toggle()`) é deliberada e está registrada acima; ao tocar em qualquer uma das três fábricas, conferir se `toggle()` ganhou consumidor antes de reabrir a decisão.

### vanilla/overlay — desmontar não é fechar {#vanilla-desmonte-nao-fecha}

- **Arquivos:** `nortear-design-system-vanilla/src/components/ui/dialog.ts`, `alert-dialog.ts`, `sheet.ts`
- **Categoria:** api
- **Data:** 2026-09-12
- **Upstream ref:** — (fábricas standalone)

**Antes:**
```ts
// callback de limpeza do tornarDestruivel
if (panelEl) close('api');   // = onClose('api') + onOpenChange(false)
```

**Depois:**
```ts
const wasOpen = desmontarPanel(/* animar */ false);
if (wasOpen) onOpenChange?.(false);   // estado sim, motivo não
```

**Motivo:** o callback de limpeza roda quando o wrapper sai do DOM — troca de story, desmonte de docs page, troca de idioma. Cada uma dessas com o painel aberto virava um `dialog_close` que ninguém fez, e com a MESMA palavra de quem confirmou a ação: no GA4 os dois eram indistinguíveis. O Sheet e o Drawer já desmontavam em silêncio; o Dialog e o AlertDialog não. Junto, o `closeOutrosPanels` do Sheet — que recolhe o painel irmão ao abrir um novo — passou a relatar `api` em vez de sumir calado, e a leitura de `previousFocus` subiu para antes dele, senão o painel novo herdava o gatilho do antigo como alvo de retorno.

**Verificação após bump:** n/a (sem upstream). O portão `desmonte_emite_fechamento` lê o callback de limpeza de cada `tornarDestruivel` das fábricas e resolve **um salto** de chamada: nenhum desses callbacks contém a palavra `onClose` — todos chamam uma função local —, então a versão que procurava a palavra achava zero na árvore inteira, com três fábricas defeituosas.

### vanilla/tooltip — `onShow` na exibição real {#vanilla-tooltip-onshow}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/tooltip.ts`
- **Categoria:** api
- **Data:** 2026-07-27
- **Upstream ref:** — (factory standalone)

**Antes:**
```ts
// sem callback de exibição; TooltipDocs espelhava o SHOW_DELAY (300ms) com
// timer local próprio — dessincronizava se a constante do factory mudasse
```

**Depois:**
```ts
onShow?: () => void; // chamado dentro de show(), após o delay interno
```

**Motivo:** `tooltip_view` deve disparar quando o tooltip é de fato exibido. O timer duplicado no TooltipDocs era acoplamento frágil a uma constante privada do factory; o callback elimina a duplicação e fica disponível para qualquer consumidor.

**Verificação após bump:** n/a (sem upstream). Se o factory ganhar animação/portal assíncrono, garantir que `onShow` continue sendo chamado no momento em que o painel fica visível.

### todas/alert — `variant` expõe as 5 variantes semânticas {#alert-five-variants}

- **Arquivos:** `alert.tsx` (react), `alert/index.ts` (vue), `alert.svelte` (svelte), `alert.ts` (vanilla)
- **Categoria:** api
- **Data:** 2026-07-29
- **Upstream ref:** — (o Alert não vem de lib primitiva em nenhuma stack; é markup próprio sobre o CSS `.nds-*`)

**Motivo:** o `alert.css` define cinco variantes — `default`, `destructive`, `success`, `warning` e `info` — mas o `cva` das quatro stacks mapeava só as duas primeiras. `success` e `warning` existiam no CSS e eram alcançáveis apenas passando a classe na mão (`className="nds-alert-success"`), e `info` não era alcançável nem documentado. Capacidade do CSS que a API não expunha: o consumidor precisava conhecer o nome interno da classe.

Além de escondida, a forma manual saiu errada em duas stacks: Vue e Svelte montavam Success e Warning com classes do Tailwind (`bg-success/10`, `border-success/30`), que saíram do projeto e não existem mais. As duas stories renderizavam um alert `default`, e o Chromatic fotografava isso como baseline.

**Depois:** `variant` aceita as cinco em todas as stacks; `className`/`class` volta a ser só override pontual. As docs pages e as stories passaram a usar a prop.

**Verificação após bump:** se o `alert.css` ganhar uma variante nova, adicioná-la ao `cva` das 4 stacks e ao `AlertVariant` do Vanilla no mesmo commit — o descompasso entre CSS e API foi o que criou este caso.

### todas/alert — `<h5>` e `<section>` no título e na descrição {#alert-title-desc-semantics}

- **Arquivos:** `alert.tsx` (react), `AlertTitle.vue` / `AlertDescription.vue` (vue), `alert-title.svelte` / `alert-description.svelte` (svelte)
- **Categoria:** api
- **Data:** 2026-07-29 · **atualizado 2026-08-01**: `as` configurável no
  AlertTitle (default `'h5'`) nas 4 stacks, padrão do CardTitle. Motivo: `h5`
  fixo sob seções `h2` das docs pages violava axe `heading-order` em produção —
  achado por story de fumaça montando a docs page inteira, superfície que
  nenhum teste cobria. Docs pages passam `as="h3"`; axe da página zerou
  (verificado nos dois sentidos: reintroduzir o h5 falha exatamente com
  heading-order).
- **Upstream ref:** — (marcação própria)

**Motivo:** o cabeçalho do `alert.css` documenta a estrutura com `<h5 class="nds-alert-title">` e `<section class="nds-alert-description">`, e o CSS traz seletores `.nds-alert > h1..h6` e `.nds-alert > section` justamente para isso. O Vanilla seguia; React, Vue e Svelte renderizavam `<div>` nos dois, perdendo a semântica de cabeçalho e o landmark da descrição. Alinhadas ao Vanilla, que é a referência cross-stack.

**Verificação após bump:** n/a.

### todas/accordion — `data-type` e `data-collapsible` na raiz {#accordion-config-data-attrs}

- **Arquivos:** `accordion.tsx` (react), `Accordion.vue` (vue), `accordion.svelte` (svelte), `accordion.ts` (vanilla)
- **Categoria:** api
- **Data:** 2026-07-29
- **Upstream ref:** — (nenhuma das libs — base-ui, reka-ui, bits-ui — escreve a configuração na raiz)

**Motivo:** a configuração do accordion vivia só na prop/closure. Depois de montado, nada no DOM distinguia um `single` de um `multiple`: CSS, teste, devtools e o gerador de snippet do Storybook viam exatamente o mesmo HTML. No Vanilla isso tinha efeito visível — o renderer `html` do Storybook monta a caixa de código a partir do `outerHTML` e só reemite quando ele muda, então trocar o modo nos Controls não alterava o snippet.

**Assimetria conhecida e aceita:** `data-type` sai nas 4 stacks. `data-collapsible` sai só em Vue e Vanilla — base-ui e bits-ui não expõem `collapsible` (no modo único, fechar o item ativo é sempre permitido nessas libs). Emitir o atributo onde a prop não existe seria inventar uma configuração.

**Verificação após bump:** se alguma lib passar a escrever um atributo equivalente na raiz, remover o nosso para não duplicar.

### react/chart — `role="img"` no ChartContainer para satisfazer aria-prohibited-attr {#chart-aria-img-role}

- **Arquivo:** `nortear-design-system-react/src/components/ui/chart.tsx` (ChartContainer)
- **Categoria:** a11y
- **Data:** 2026-04-28
- **Upstream ref:** wrapper `chart.tsx` sobre `recharts` — upstream usa `<div data-slot="chart">` sem `role`

**Antes (upstream):**
```tsx
<div
  data-slot="chart"
  data-chart={chartId}
  className={cn("flex aspect-video justify-center text-xs ...", className)}
  {...props}
>
```

**Depois (custom):**
```tsx
// PATCH: a11y — role="img" é necessário em <div> com aria-label para satisfazer
// axe (aria-prohibited-attr). (ver PATCHES.md#chart-aria-img-role)
<div
  data-slot="chart"
  data-chart={chartId}
  role="img"
  className={cn("flex aspect-video justify-center text-xs ...", className)}
  {...props}
>
```

**Motivo:** stories de chart passam `aria-label="Gráfico de barras: ..."` ao ChartContainer para descrever o gráfico ao leitor de tela. Sem `role` explícito, `<div>` tem role implícito `generic`, e `aria-label` em elementos com role generic é proibido pela ARIA spec (`aria-prohibited-attr`). Adicionar `role="img"` torna o ChartContainer um landmark acessível com nome — recharts renderiza `<svg role="application">` internamente para a interatividade do tooltip, mas o landmark de descrição precisa estar no wrapper. Permite usar `getByRole("img", { name: ... })` em testes.

**Verificação após bump:** se o wrapper upstream de chart passar a incluir `role="img"` por padrão, remover marker. Teste com `npx storybook test` na story `ui-chart-estados--uma-serie` — não deve reportar `aria-prohibited-attr`.

### react/collapsible — substituir `asChild` por `className` em stories (base-ui breaking) {#collapsible-trigger-no-aschild}

- **Arquivos:**
  - `nortear-design-system-react/src/components/ui/collapsible.stories.tsx`
  - `nortear-design-system-react/src/components/ui/collapsible-estados.stories.tsx`
  - `nortear-design-system-react/src/components/ui/collapsible-composicoes.stories.tsx`
- **Categoria:** a11y (nested-interactive) + bugfix (migração base-ui)
- **Data:** 2026-04-28
- **Upstream ref:** base-ui v1 — `Collapsible.Trigger` não suporta `asChild` (ver breaking changes 2026-04-21 no topo deste arquivo)

**Antes:**
```tsx
<CollapsibleTrigger asChild>
  <Button variant="ghost" className="...">...</Button>
</CollapsibleTrigger>
```

Renderiza `<button>` (do CollapsibleTrigger) com `<button>` (do Button) aninhado dentro — viola axe `nested-interactive` e quebra hidratação React (`<button> cannot be a descendant of <button>`).

**Depois:**
```tsx
<CollapsibleTrigger
  className={cn(buttonVariants({ variant: "ghost" }), "flex w-full items-center justify-between px-4")}
>...</CollapsibleTrigger>
```

CollapsibleTrigger é o próprio `<button>` semântico, recebe classes de buttonVariants para herdar o visual do Button.

**Motivo:** base-ui (migrado em 2026-04-21) deprecou `asChild` em favor de `render={<Component />}`. Como CollapsibleTrigger já é um `<button>` com handlers do Radix, aplicar visual do Button via `buttonVariants(...)` é a opção mais limpa — evita ambos o nested-interactive e o uso de `render={<Button />}` (que tem inconsistências com props de Button).

**Verificação após bump:** se base-ui v2 reintroduzir `asChild` ou se atualizarem `<Button>` para suportar slot/forwardRef, reavaliar. Teste com `npx storybook test` em `ui-collapsible*` — não deve reportar `nested-interactive`.

### react/calendar — desabilitar `scope-attr-valid` em stories com `showWeekNumber` {#calendar-week-number-scope}

- **Arquivo:** `nortear-design-system-react/src/components/ui/calendar-layouts.stories.tsx` (story `WithWeekNumber`)
- **Categoria:** a11y (escopo limitado)
- **Data:** 2026-04-28
- **Upstream ref:** react-day-picker v9 — gera `<td role="rowheader" scope="row">` para week numbers

**Antes:**
```tsx
export const WithWeekNumber: Story = {
  render: () => <Calendar showWeekNumber ... />,
  // sem config a11y customizada — falha em axe
};
```

**Depois:**
```tsx
export const WithWeekNumber: Story = {
  render: () => <Calendar showWeekNumber ... />,
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'scope-attr-valid', enabled: false }],
      },
    },
  },
};
```

**Motivo:** react-day-picker v9 emite `<td week="..." aria-label="Semana 14" scope="row" role="rowheader">` para week numbers. Pelo HTML5 spec, `scope` só é válido em `<th>`, e axe reporta `scope-attr-valid` (moderate). Porém o uso aqui é semanticamente correto: `role="rowheader"` declara o elemento como cabeçalho de linha para leitores de tela, e `scope="row"` reforça o scope do header.

Não fixamos no upstream (issue/PR no react-day-picker está pendente há meses) e fixar no calendar.tsx exigiria intervir no DOM gerado pela lib via observers. **Restrito apenas à story `WithWeekNumber`** — as outras stories de Calendar continuam validando todas as regras axe.

**Verificação após bump:** se react-day-picker v10+ trocar para `<th scope="row" role="rowheader">`, remover este patch.

### react/sonner — desabilitar `color-contrast` e `aria-prohibited-attr` (lib externa) {#sonner-rich-colors-contrast}

- **Arquivos:**
  - `nortear-design-system-react/src/components/ui/sonner.stories.tsx`
  - `nortear-design-system-react/src/components/ui/sonner-tipos.stories.tsx`
  - `nortear-design-system-react/src/components/ui/sonner-composicoes.stories.tsx`
- **Categoria:** a11y (escopo limitado a stories que renderizam o Toaster)
- **Data:** 2026-04-28
- **Upstream ref:** [emilkowalski/sonner](https://github.com/emilkowalski/sonner) — implementação interna do toast usa `<div data-title aria-label>` e CSS variables com richColors

**Antes:**
```tsx
const meta = {
  title: "UI/Sonner",
  component: Toaster,
  parameters: { ... },
};
```

**Depois:**
```tsx
const meta = {
  title: "UI/Sonner",
  component: Toaster,
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: false },
          { id: 'aria-prohibited-attr', enabled: false },
        ],
      },
    },
  },
};
```

**Motivo:**
- **`color-contrast`**: Sonner com prop `richColors` aplica paletas semi-transparentes definidas pela própria lib (`bg-success-bg`, `text-success-text` etc.). Esses valores RGBA caem fora do nosso controle e podem ficar abaixo de 4.5:1 dependendo do tema do projeto. Auditoria de contraste do Toaster é manual em `foundations/colors`.
- **`aria-prohibited-attr`**: o toast renderizado pelo Sonner usa `<div data-title aria-label="...">` (sem role explícito), gerado pela lib quando o usuário dispara `toast()`.

Limitado **apenas às 3 stories que renderizam Toaster**. Botões e demais primitivos fora dessas stories continuam validando contraste e aria-prohibited normalmente.

**Verificação após bump:** se `sonner` v3+ refatorar para usar `role="status"` + cores acessíveis por padrão, remover este patch. Teste manual: abrir toast, inspecionar contraste com DevTools.

### react/command — `aria-required-children` RESOLVIDO (medido em navegador 2026-09-03) {#command-listbox-children}

- **Arquivos:** nenhum. A exceção saiu dos quatro arquivos de story do Command
  (`command.stories.tsx`, `command-compositions.stories.tsx`,
  `command-states.stories.tsx`, `command-variants.stories.tsx`).
- **Categoria:** a11y · **Status:** **RESOLVIDO — patch removido**
- **Aberto em:** 2026-04-28 · **Reduzido e remedido em:** 2026-09-02 ·
  **Premissa removida em:** 2026-09-02 · **Encerrado em:** 2026-09-03
- **Upstream ref:** [pacocoursey/cmdk](https://github.com/pacocoursey/cmdk)

**O que era:** as quatro stories desligavam `aria-required-children` por
`a11y.config.rules`, porque o listbox do cmdk recebia filhos não permitidos.

**As três causas, e como cada uma caiu:**

- **O divisor.** `ariaRequiredChildrenEvaluate` (axe-core) descarta todo nó em
  que `isVisibleToScreenReaders` é falso ANTES de julgar filho permitido. Um
  `aria-hidden="true"` no `CommandSeparator` resolveu sem tocar na lib: o papel
  `role="separator"` que a lib crava continua lá, o nó é que sai da árvore.
- **O `cmdk-group`.** Nunca foi problema: `role="group"` é filho PERMITIDO de
  `listbox`. A entrada antiga o acusava por engano.
- **O vazio.** `CommandEmpty` montava `role="presentation"` DENTRO da lista e só
  enquanto o filtro não casava; sem nenhuma `option`, o caminho `reviewEmpty`
  do avaliador devolvia falha em vez de "incompleto". Fechado em 2026-09-02:
  `CommandEmpty` deixou de embrulhar o primitivo do cmdk e virou um `<div
  role="status" aria-live="polite" aria-atomic="true">` próprio, montado o tempo
  todo e IRMÃO do `CommandList`. O estado vem de `useCommandState`, exportado
  pelo cmdk (`useCmdk as useCommandState`) — sem fork.

**A medida que encerrou o registro.** Em 2026-09-02 as três causas já estavam
derrubadas no papel, e o patch foi mantido de propósito: quem julga
`aria-required-children` é o axe rodando em navegador, e faltava a rodada. O que
não estava confirmado era se um listbox SEM nenhuma `option` — o que sobra
quando o filtro não casa — sairia como "incomplete" (`reviewEmpty`) ou como
falha.

Medido em 2026-09-03, com a regra RELIGADA nos quatro arquivos e a suíte de
navegador executada: **as stories do Command passam.** Nenhuma violação de
`aria-required-children`, inclusive na story que termina sem resultados
(`Empty state`), que é justamente o caso do listbox vazio. A exceção foi
removida, e este registro fica só como histórico.

**Nota de contraste, e vale para quem for tentado a religar por analogia:** na
mesma rodada a docs page do Menubar reprovou em `aria-required-children` por um
`span[aria-owns]` que a lib injeta como filho direto do `role="menubar"`. É
outra causa, em outro componente, e continua de pé — ver o comentário da story
`Menubar` em `docs-smoke.stories.tsx`.

**Verificação após bump:** se o cmdk voltar a montar a mensagem de vazio dentro
do `role="listbox"`, ou se o divisor deixar de aceitar `aria-hidden`, a regra
volta a reprovar nas quatro stories — e aí é conserto de markup, não exceção
nova. Issue de referência: [cmdk#226](https://github.com/pacocoursey/cmdk/issues/226).

### todas/alert — variante dismissible (`dismissible`/`onDismiss`/`dismissLabel`) {#alert-dismissible}

- **Arquivos:** `alert.tsx` (react), `alert/index.ts` (vue), `alert.svelte` (svelte), `alert.ts` (vanilla)
- **Categoria:** api
- **Data:** 2026-07-31
- **Upstream ref:** — (o Alert não vem de lib primitiva em nenhuma stack; markup próprio sobre o CSS `.nds-*`)

**Depois:** `dismissible?: boolean` (default `false`) renderiza o botão de fechar — Button `ghost` `icon-sm` com `.nds-alert-dismiss`, `data-slot="alert-dismiss"` e ícone X do lucide. Acioná-lo remove o alert da tela e dispara o callback de fechamento (`onDismiss`; Vue: emit `dismiss`) **uma única vez**. `dismissLabel` (default `'Fechar alerta'`) é o aria-label do botão. No Vanilla a raiz também recebe `data-dismissible` (o snippet do Storybook vem do `outerHTML`; config só no closure congela a caixa de código). Mutuamente exclusivo com a composição `AlertAction` por design.

**Motivo:** o evento `alert_dismiss` estava tipado nos 4 `analytics.ts` e documentado na tabela de analytics da doc, mas o componente nunca teve como ser fechado. O CSS já existia no `alert.css` compartilhado (`.nds-alert-dismiss` + `:has()` abrindo o padding). O analytics segue no consumidor via callback — proibido importar `@/lib/analytics` no primitivo.

**Verificação após bump:** n/a (sem upstream no Alert). Se o componente ganhar modo controlado, manter a garantia de `onDismiss` disparar uma única vez por fechamento.

### todas/alert — `role` configurável (`alert` | `status` | `note`) {#alert-role}

- **Arquivos:** `alert.tsx` (react), `alert/index.ts` (vue), `alert.svelte` (svelte), `alert.ts` (vanilla) + `docs/shared/sections/DocsNotes.*` nas 4
- **Categoria:** a11y
- **Data:** 2026-08-02
- **Upstream ref:** — (o Alert não vem de lib primitiva em nenhuma stack; markup próprio sobre o CSS `.nds-*`)

**Antes:** o elemento raiz recebia `role="alert"` **fixo**, sem como desligar.

**Depois:** `role?: 'alert' | 'status' | 'note'`, default `'alert'` — aditivo, nenhum call site existente muda de comportamento. O valor vai direto para o atributo `role` da raiz. `alert` é live region assertiva, `status` é polida, `note` não é live region.

**Motivo:** por WAI-ARIA, `alert` é para mensagem urgente que **surge em tempo de execução**. Com o role fixo, todo Alert estático virava live region assertiva: o `DocsNotes` renderiza Alerts e o NVDA saltava para a seção "Notas de Implementação" no carregamento e ficava preso ali — em 48 docs pages × 4 stacks. Varredura confirmou que essa era a **única** live region das docs pages (zero `aria-live`, zero outro role de live region em `shared/`). O bug vale além das docs: qualquer consumidor do DS com um Alert fixo em tela tinha o mesmo problema. `DocsNotes` passou a usar `role="note"`.

**Verificação após bump:** n/a (sem upstream no Alert). Manter o default em `'alert'` — trocá-lo seria breaking. Story `SemAnuncio` (arquivo de estados do Alert nas 4 stacks) trava as duas pontas: `role="note"` explícito e default `alert` quando a prop é omitida.

### vue/alert-dialog — `aria-label` de fallback no Content — RETIRADO em 2026-09-10 {#vue-alert-dialog-fallback-label}

- **Arquivo:** `nortear-design-system-vue/src/components/ui/alert-dialog/AlertDialogContent.vue`
- **Categoria:** a11y
- **Data:** 2026-08-06 (registro; código de 2026-05, commit f04827e7) · retirado em 2026-09-10
- **Upstream ref:** — (comportamento do `reka-ui`, não bug)

**O que existia:** `v-bind="{ 'aria-label': fallbackLabel, ...$attrs, ...forwarded }"`, com `fallbackLabel = attrs['aria-labelledby'] ? undefined : 'AlertDialog'`.

**Por que saiu:** a premissa estava errada. O `reka-ui` NÃO emite `aria-labelledby` só quando existe um `AlertDialogTitle`: o `DialogContentImpl` gera o id do título sempre e liga `aria-labelledby` a ele em todo painel, com ou sem título (medido por SSR no reka-ui 2.10.4). A condição olhava os atributos de QUEM CONSOME, que nunca trazem `aria-labelledby`, então o "fallback" saía em TODO painel — `aria-label="AlertDialog"`, em inglês, ao lado do `aria-labelledby`. O ramo que o `v8 ignore` chamava de "sem story" era o caminho padrão. Painel sem título é composição fora do contrato (C2, `anatomy.item5`), e a própria lib avisa em desenvolvimento; o vanilla, que é a referência, não emite nome de fallback.

**Verificação após bump:** nenhuma — o wrapper não declara mais nome. A story `Playground` do vue afirma `not.toHaveAttribute('aria-label')` e o nome acessível igual ao título.

### vanilla/alert-dialog — `defaultOpen` na factory {#vanilla-alert-dialog-defaultopen}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/alert-dialog.ts`
- **Categoria:** api
- **Data:** 2026-08-06
- **Upstream ref:** — (stack standalone)

**Depois:** `defaultOpen?: boolean` abre o diálogo assim que o wrapper entra no DOM (microtask + `isConnected`), sem clique no trigger. `open()` passou a ser idempotente: com o painel montado, um segundo clique no trigger não monta outro painel nem deixa o primeiro órfão no body.

**Motivo:** `defaultOpen` está na tabela de props compartilhada e existe em React, Vue e Svelte; só o Vanilla não expunha. As stories abriam o diálogo com `queueMicrotask(() => trigger.click())` — truque que não é API e que nenhuma documentação descrevia. Não há equivalente para `open` controlado: o estado de abertura continua sendo da factory, e a story `Controlled` declara isso em `coversNotApplicable`.

**Verificação após bump:** n/a (sem upstream). Se a factory ganhar modo controlado, rever o `coversNotApplicable` de `functional.item7` nas stories de estados.

### vanilla/alert-dialog — `onClose(reason)`, e `class` na mídia {#vanilla-alert-dialog-onclose}

- **Arquivo:** `nortear-design-system-vanilla/src/components/ui/alert-dialog.ts`
- **Categoria:** api
- **Data:** 2026-09-10
- **Upstream ref:** — (stack standalone)

**Depois:** opção `onClose(reason)`, com `'escape' | 'close-button' | 'api'`, disparada uma vez por fechamento e ANTES de `onOpenChange(false)` — a mesma ordem do `createDialog`. A guarda de "já fechado" subiu para o topo do `close()`: um segundo clique durante a animação de saída disparava o callback de novo. E `createAlertDialogMedia` passou a receber `class`, como `createAlertDialog` e a maioria das fábricas — recebia `className`. **Quebra quem usava `className`**; o único chamador era a story `ExtraClass`.

**Motivo:** o Escape do vanilla fechava sem `dialog_close` nenhum — a docs page rastreava o fechamento à mão nos cliques dos dois botões, e a fábrica era a única peça que sabia qual caminho fechou. O Sheet já tinha `onClose(reason)` (entrada acima).

**Verificação após bump:** n/a (sem upstream). Manter o vocabulário igual ao `DialogCloseReason`, sem o `overlay` (clique no véu não fecha este componente).

### react/alert-dialog — foco inicial no Cancelar por `initialFocus` {#react-alert-dialog-initialfocus}

- **Arquivo:** `nortear-design-system-react/src/components/ui/alert-dialog.tsx`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** comportamento da `@base-ui/react` (`utils/popups/popupStoreUtils.js`)

**Depois:** o Content passa ao `initialFocus` da lib uma ref que o Cancel entrega por um contexto interno, não exportado; quem consome ainda pode trocar.

**Motivo:** a base-ui foca o primeiro tabbable — o Cancelar chegava ao foco pela ORDEM do rodapé, não por escolha (D3 do `prd/alert-dialog.md`) — e, na abertura por toque, foca o painel em vez de um botão.

**Verificação após bump:** a story `Open` abre pelo toque e confere o foco no Cancelar; se a lib mudar a assinatura de `initialFocus`, é ela que reprova.

### vue/alert-dialog — descrição por registro {#vue-alert-dialog-description-registry}

- **Arquivo:** `nortear-design-system-vue/src/components/ui/alert-dialog/AlertDialogContent.vue` e `AlertDialogDescription.vue`
- **Categoria:** a11y
- **Data:** 2026-08-17 (código) · registrado em 2026-09-10 — ficou quase um mês sem entrada
- **Upstream ref:** comportamento do `reka-ui` (`DialogContentImpl`)

**Depois:** a descrição se registra no painel enquanto está montada, e o `aria-describedby` só é ligado quando ela existe.

**Motivo:** a reka gera o id da descrição sempre e liga `aria-describedby` a ele mesmo sem descrição — um id inexistente, que a própria lib avisa em desenvolvimento. É a D4: a descrição é opcional.

**Verificação após bump:** a story `WithoutDescription` confere a ausência do atributo, e a play de remoção com o painel aberto confere que ele some sem deixar id órfão.

### vue/alert-dialog — clique de quem consome antes do fechamento {#vue-alert-dialog-click-order}

- **Arquivos:** `nortear-design-system-vue/src/components/ui/alert-dialog/AlertDialogAction.vue`, `AlertDialogCancel.vue`
- **Categoria:** bugfix
- **Data:** 2026-09-10
- **Upstream ref:** — (ordem de ouvintes do `reka-ui`, não bug da lib)

**Antes:** o `@click` de quem consome chegava ao `AlertDialogAction`/`Cancel` do primitivo como atributo repassado, e o Vue o soma DEPOIS do `onClick` do `DialogClose`, que fecha o diálogo.

**Depois:** o wrapper declara `click` em `defineEmits` e o entrega em `@click.capture` — na captura, antes do ouvinte do primitivo no mesmo elemento.

**Motivo:** no modo controlado, o `useVModel` do `DialogRoot` não é passivo e emite `update:open(false)` SÍNCRONO dentro do fechamento: quem consome recebia o fechamento antes do próprio clique. Marcar a confirmação no clique (a docs page faz isso para o `reason` do `dialog_close`) virava `close-button`. No modo não controlado a lib adia o evento, e a ordem só dava certo por acaso. Alinha também o que `props.table.onClick` promete ("o diálogo fecha depois de disparar").

**Verificação após bump:** a story `Controlled` (estados, vue) confere `invocationCallOrder` do handler da ação contra o `update:open(false)`. Se o `DialogClose` passar a entregar o clique de quem consome primeiro, o `.capture` pode sair.

### svelte/alert-dialog — descrição própria, título pelo `child` e foco no Cancelar {#svelte-alert-dialog-wrappers}

- **Arquivo:** `nortear-design-system-svelte/src/components/ui/alert-dialog/` (`alert-dialog-description.svelte`, `alert-dialog-description-registry.ts`, `alert-dialog-content.svelte`, `alert-dialog-title.svelte`)
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** comportamento do `bits-ui`

**Depois:**
- a descrição é um `<p>` próprio que se registra no painel, e o painel declara `aria-describedby` pelo registro;
- o título sai em `<h2>` por padrão, escrito pelo snippet `child` da lib, com `level` trocando a tag e o `aria-level` juntos;
- o painel procura o botão pelo slot do Cancelar e o foca ao abrir (`focusSafeExit`), dependendo do tempo do FocusScope da lib.

**Motivo:** a bits grava o id da descrição na raiz e não o apaga quando ela sai, e o valor dela vence o de quem consome — descrição removida com o painel aberto deixava `aria-describedby` órfão. O título da lib é `div[role=heading]`, e o padrão prometido é `h2`. O foco inicial precisa ser escolha, não herança (D3).

**Verificação após bump:** `HeadingH3` (tag e `aria-level`), `WithoutDescription` e a play de remoção da descrição, e a story `Open` (foco no Cancelar sem clique).

### angular/alert-dialog — foco inicial no Cancelar pelo `openAutoFocus` {#angular-alert-dialog-focuscancel}

- **Arquivo:** `nortear-design-system-angular/src/components/ui/alert-dialog.ts`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** comportamento do `@radix-ng/primitives` (dialog)

**Depois:** o `NdsAlertDialogCancel` se registra na raiz; a raiz escuta `(openAutoFocus)` no `rdxDialogPopup`, cancela o evento e foca o Cancelar. Sem Cancel montado, vale o padrão da lib.

**Motivo:** o Cancelar chegava ao foco pela ordem do DOM (D3), e na abertura por toque o gerenciador de foco da lib foca o painel.

**Verificação após bump:** a story `Open` confere o foco no Cancelar, inclusive na abertura por toque.

### react/context-menu — Tab fecha o menu e o foco segue a página (a base-ui prende o foco) {#react-context-menu-tab-exit}

- **Arquivos:** `nortear-design-system-react/src/components/ui/context-menu.tsx` (+ `menu-tab-exit.ts`, compartilhado com o DropdownMenu — ver `#react-dropdown-menu-tab-exit`)
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `@base-ui/react` — `menu/popup/MenuPopup.js` passa `modal: isContextMenu` ao `FloatingFocusManager`

**Antes:** Tab no painel do ContextMenu não saía: o item destacado era a única parada de tabulação, e as âncoras de foco do portal devolviam o foco a ele. Shift+Tab fechava só o painel em que estava.

**Depois:** o `ContextMenuContent` ouve Tab e Shift+Tab, faz `preventDefault` e `event.preventBaseUIHandler()`; a raiz calcula o próximo (ou anterior) ponto de tabulação a partir da ÁREA (`tabbableBeside`), fecha pelo `actionsRef` e foca o destino. Sem destino, a lib devolve o foco à área, como no Escape. A raiz troca o motivo `imperative-action` por `focus-out`, e o Tab chega ao analytics como `overlay`. O `modal` da raiz (véu e trava de rolagem) fica intacto.

**Motivo:** C2 e D1 do `prd/dropdown-menu.md` — menu não prende o foco, e Tab segue o percurso da página. O destino sai da área porque o painel vive em portal no fim do `<body>`: o próximo depois do item seria uma âncora de foco da lib.

**Verificação após bump:** `grep -n "modal: isContextMenu" node_modules/@base-ui/react/menu/popup/MenuPopup.js` — se sumiu, ou se o Tab passou a fechar seguindo a página, saem o handler, o `TabExitContext`, `tabbableBeside`, `assignRef` e `withReason`. Portão: o passo "Tab fecha o menu e o foco segue o percurso da página" do Playground.

### react/context-menu — estado misto no item de marcação (a base-ui é de dois estados) {#react-context-menu-mixed-checkbox}

- **Arquivo:** `nortear-design-system-react/src/components/ui/context-menu.tsx`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `@base-ui/react` — `Menu.CheckboxItem` só tem `checked` booleano

**Depois:** prop `indeterminate` (controlada) → `aria-checked="mixed"` só quando mista, `checked={false}` repassado à lib (o primeiro clique resolve para marcado) e o traço no lugar do indicador.

**Motivo:** D8 do `prd/dropdown-menu.md`, e decisão da dona de 2026-09-10 — as outras quatro stacks já tinham o estado misto. `MenuCheckboxItem.js:94-98` aplica as props de fora depois do `aria-checked` interno.

**Verificação após bump:** a story `CheckboxIndeterminate`, primeiro passo (`mixed`/`true`/`false`). Se a lib passar a sobrescrever `aria-checked`, ou ganhar `indeterminate` nativo, rever.

### react/dropdown-menu + menubar — estado misto no item de marcação (a base-ui é de dois estados) {#react-dropdown-menu-mixed-checkbox}

- **Arquivos:** `nortear-design-system-react/src/components/ui/dropdown-menu.tsx` (`DropdownMenuCheckboxItem`) e `nortear-design-system-react/src/components/ui/menubar.tsx` (`MenubarCheckboxItem`)
- **Categoria:** a11y
- **Data:** 2026-09-11
- **Upstream ref:** `@base-ui/react` 1.7.0 — `Menu.CheckboxItem` só tem `checked` booleano

**Depois:** a mesma forma de `#react-context-menu-mixed-checkbox`: prop `indeterminate` (controlada) → `aria-checked="mixed"` só quando mista, `checked={false}` repassado à lib (o primeiro clique resolve para marcado) e o traço no lugar do indicador, dentro do invólucro `*-checkbox-item-indicator`.

**Motivo:** D8 do `prd/dropdown-menu.md` — mesma folha, mesmo contrato do ContextMenu. O DropdownMenu e o Menubar desta stack declaravam `coversNotApplicable` para o estado misto alegando lib de dois estados, enquanto o ContextMenu da mesma stack já provava que o wrapper resolve. `MenuCheckboxItem.js:94-98` aplica as props de fora depois do `aria-checked` interno.

**Verificação após bump:** stories `CheckboxIndeterminate` de `dropdown-menu-states` e de `menubar-states`, primeiro passo (`mixed`/`true`/`false`). Se a lib passar a sobrescrever `aria-checked` ou ganhar `indeterminate` nativo no item de menu, rever os três wrappers juntos.

### react/dropdown-menu + menubar — Tab sai do menu pelo vizinho do gatilho {#react-dropdown-menu-tab-exit}

- **Arquivos:** `nortear-design-system-react/src/components/ui/dropdown-menu.tsx` (+ `menu-tab-exit.ts`); o `menubar.tsx` herda pelo `MenubarMenu`, que é um `DropdownMenu`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `@base-ui/react` 1.7.0 — `menu/popup/MenuPopup.js` (`modal: isContextMenu`, `previousFocusableElement: activeTriggerElement`) e as âncoras de foco de `floating-ui-react/components/FloatingFocusManager.js`

**Antes (medido com teclado real):** a lib deixa o Tab para o navegador e para as âncoras de foco. Tab e Tab no submenu acertavam. Shift+Tab mandava o foco ao próprio gatilho — no Menubar, com o menu ABERTO; Shift+Tab no submenu fechava só o submenu; e no DropdownMenu, com o gatilho como última parada, o Tab dava a volta até o início da página.

**Depois:** o `DropdownMenuContent` ouve Tab e Shift+Tab (painel raiz e de submenu), faz `preventDefault` e `event.preventBaseUIHandler()`; a raiz calcula o próximo (ou anterior) ponto de tabulação a partir do GATILHO (`tabbableBeside`; os outros gatilhos da barra têm `tabindex="-1"`, então o destino fica fora dela), fecha o menu inteiro pelo `actionsRef` e foca o destino. Sem destino, a lib devolve o foco ao gatilho. O motivo `imperative-action` vira `focus-out`, o mesmo que a lib já entregava no Tab que acertava. O `modal` da raiz (véu) fica intacto.

**Motivo:** C2 e D1 do `prd/dropdown-menu.md` — menu não prende o foco, e Tab segue o percurso da página a partir do gatilho.

**Verificação após bump:** `TabLeavesMenu`/`TabAtPageEnd` (dropdown-menu.stories) e `TabLeavesMenubar`/`TabAtPageEnd` (menubar.stories) — reprovam sem o conserto, medido. Se a lib passar a conduzir o Shift+Tab e o Tab da última parada, saem o handler, o `TabExitContext` e o registro do gatilho.

### angular/dropdown-menu + menubar + context-menu — o foco entra no submenu pela seta direita {#angular-dropdown-menu-submenu-entry}

- **Arquivos:** `nortear-design-system-angular/src/components/ui/menu-popup-scope.ts` (`NdsSubmenuKeyboardEntry`, `NdsMenuPopupScope`), `dropdown-menu.ts`, `menubar.ts`, `context-menu.ts`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `@radix-ng/primitives` 1.1.2 — `RdxMenuSubTrigger.onArrowRight` (`radix-ng-primitives-menu.mjs:2482-2497`) só foca o primeiro item com o submenu FECHADO; e o miolo em `ng-template` não alcança `RdxCompositeList`/`RDX_FLOATING_REGISTRATION` do popup

**Antes:** a seta direita abria o submenu e o foco não entrava (Menubar e ContextMenu); a seta esquerda e o Escape não fechavam o submenu (DropdownMenu). O Angular resolve as dependências do `ng-template` de onde ele foi escrito, não do popup em que aterrissa, e o popup do submenu se registrava como raiz solta em vez de filho do menu pai.

**Depois:** o popup entrega o próprio injetor ao miolo (`[ngTemplateOutletInjector]`, pela diretiva interna `NdsMenuPopupScope`), e o sub-gatilho leva o foco ao primeiro item por quadro de animação, com teto de 10 quadros — também quando o ponteiro já tinha aberto o submenu.

**Motivo:** WCAG 2.1.1 e C6 do `prd/dropdown-menu.md`; o vanilla é a referência.

**Verificação após bump:** as stories `WithSubmenu` das três composições. Se o `onArrowRight` passar a focar com o painel aberto, `NdsSubmenuKeyboardEntry` sai; o injetor do popup continua necessário enquanto o miolo for `ng-template`.

### angular/dropdown-menu + menubar + context-menu — Tab fecha o menu inteiro e o foco segue a página {#angular-dropdown-menu-tab-exit}

- **Arquivos:** `nortear-design-system-angular/src/components/ui/menu-popup-scope.ts` (`leaveOnTab`, `NDS_MENU_TAB_ANCHOR`), `src/lib/tabbable.ts`, `dropdown-menu.ts`, `menubar.ts`, `context-menu.ts`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `RdxMenuPopup.handleKeydown` — `case 'Tab': this.rootContext.close()` (`radix-ng-primitives-menu.mjs:1318-1321`) e o `returnFocus` ao gatilho (`:1423-1426`)

**Antes:** Tab e Shift+Tab fechavam só o nível com foco e devolviam o foco ao gatilho (ou à área): os dois iam ao mesmo lugar, e o Tab no submenu deixava o menu pai aberto.

**Depois:** um ouvinte de captura no popup consome a tecla, fecha a cadeia inteira (`closeEntireMenu('focus-out')`, que a docs page lê como `overlay`) e, com o painel desmontado, foca o vizinho do gatilho, da barra ou da área (`NDS_MENU_TAB_ANCHOR`), ou o próprio gatilho quando não há vizinho.

**Motivo:** C2 e D1 do `prd/dropdown-menu.md`; destino idêntico ao do vanilla.

**Verificação após bump:** `TabLeavesMenu`/`TabLeavesMenubar`/`TabAtPageEnd` e o passo de Tab do Playground do ContextMenu.

### angular/dropdown-menu + menubar + context-menu — o sub-gatilho liga o painel portalado por aria-owns {#angular-menu-submenu-aria-owns}

- **Arquivos:** `nortear-design-system-angular/src/components/ui/menu-popup-scope.ts` (`NdsSubmenuOwnsPanel`, `NDS_SUBMENU_PANEL`), `dropdown-menu.ts`, `menubar.ts`, `context-menu.ts`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `@radix-ng/primitives` 1.1.2 — `RdxMenuSubTrigger` (`radix-ng-primitives-menu.mjs:2310`, host em `:2625`/`:2637-2638`) liga só `aria-haspopup` e `aria-expanded`, sem `aria-owns`/`aria-controls`; o `RdxMenuPopup` não dá `id` ao painel (`registerPopup`, `:1135`), e o `RdxMenuPortal` o põe no `<body>`

**Antes:** no DropdownMenu e no Menubar o sub-gatilho dizia que HAVIA um menu filho aberto, mas não QUAL: o painel, portalado para o `<body>`, ficava solto no documento, longe do item que o abriu. O ContextMenu já escrevia a ligação, numa cópia própria dentro do sub-gatilho.

**Depois:** a raiz de cada submenu fornece o `id` do próprio painel (`NDS_SUBMENU_PANEL`) e o marca com ele; a diretiva interna `NdsSubmenuOwnsPanel`, host directive dos três sub-gatilhos, escreve `aria-owns` apontando para esse `id` só enquanto o submenu está aberto, na mesma fonte (`isOpen()`) do `aria-expanded` da lib — `null` fechado. `aria-owns`, e não `aria-controls`, porque o painel está em outro canto do DOM e precisa ser reparentado na árvore de acessibilidade — a mesma escolha do vanilla (`src/lib/submenu.ts`). A cópia do ContextMenu saiu; o comportamento dele é o mesmo.

**Motivo:** o leitor de tela precisa saber a que item o menu filho pertence; o vanilla, que é a referência, escreve essa ligação no DropdownMenu e no Menubar.

**Verificação após bump:** as stories `WithSubmenu` das três composições (`aria-owns` nulo fechado, igual ao `id` do painel aberto, nulo de novo depois de fechar) — reprovam sem o conserto, medido. Se a lib passar a escrever `aria-owns` (ou `aria-controls`) no sub-gatilho e um `id` no painel, `NdsSubmenuOwnsPanel`, o token e os `panelId` saem.

### vue/context-menu — Tab fecha o menu no modo modal {#vue-context-menu-tab-closes}

- **Arquivos:** `nortear-design-system-vue/src/components/ui/context-menu/` (`context-menu.context.ts`, `ContextMenuContent.vue`, `ContextMenuSubContent.vue`), sobre o `useTabLeavesMenu` compartilhado de `dropdown-menu/tab-leaves-menu.ts` desde 2026-09-11 (ver `#vue-menu-tab-leaves`); o `ContextMenu.vue` não carrega mais o destino do Tab
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `reka-ui` — `Menu/MenuContentImpl.js:210` faz `preventDefault` no Tab quando o menu é modal, e o `ContextMenuRoot` liga `modal` por padrão

**Antes:** Tab não fazia nada com o menu aberto — o foco ficava preso na lista.

**Depois:** um ouvinte de captura no painel consome o Tab, fecha pela raiz da reka e manda o foco ao próximo ponto de tabulação depois da área (o anterior com Shift+Tab). `modal` continua ligado. O `update:open` passa a levar o motivo do fechamento (`escape` · `overlay` · `api`), lido dos eventos do painel, como o Popover e o Drawer desta stack já fazem.

**Motivo:** C2 e D1 do `prd/dropdown-menu.md` — o menu não prende o foco; `modal` aqui significa véu de interação e trava de rolagem, não armadilha de foco.

**Verificação após bump:** a play "Tab fecha o menu…" do Playground. Se a reka parar de prender o Tab, o ouvinte pode sair.

### vue/context-menu — Escape no submenu fecha só o submenu {#vue-context-menu-submenu-escape}

- **Arquivos:** desde 2026-09-11 o mecanismo é o compartilhado de `#vue-menu-submenu-escape` (`dropdown-menu/dropdown-menu.context.ts` — `useSubmenuEscape`, `MENU_SUB_CLOSE`), usado por `context-menu/ContextMenuSub.vue` e `ContextMenuSubContent.vue`. Esta entrada fica como histórico do ContextMenu; os marcadores no código apontam para a compartilhada
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `reka-ui` — `Menu/MenuSubContent.js` (`onEscapeKeyDown` chama `rootContext.onClose()` sem olhar `defaultPrevented`) e `DismissableLayer.js:72` (`onKeyStroke("Escape")` na `window`)

**Antes:** Escape dentro do submenu fechava o menu inteiro.

**Depois:** um ouvinte de captura no painel do submenu consome a tecla e interrompe a propagação antes da `window`; fecha só o submenu, pelo estado que agora mora no nosso `ContextMenuSub`, e foca o sub-gatilho (achado pelo `aria-labelledby` do painel). O raiz segue aberto e não emite fechamento. Quem controla o submenu por `v-model:open` continua recebendo cada mudança.

**Motivo:** padrão de menu da WAI-ARIA APG, e é o que o vanilla (referência) faz. O contexto de menu da reka não é exportado, então o fechamento passa por uma chave nossa.

**Verificação após bump:** o passo "Escape no submenu…" da `WithSubmenu`. Se a reka passar a fechar só o submenu, o ouvinte e o estado no `ContextMenuSub` podem sair.

### vue/context-menu — marcação e rádio não fecham ao escolher {#vue-context-menu-keep-open}

- **Arquivos:** `nortear-design-system-vue/src/components/ui/context-menu/ContextMenuCheckboxItem.vue`, `ContextMenuRadioItem.vue`
- **Categoria:** bugfix
- **Data:** 2026-09-10
- **Upstream ref:** `reka-ui` — `MenuItem.js:44-47` fecha o menu a menos que o `select` venha com `preventDefault`

**Depois:** os dois itens chamam `preventDefault` no `select`, depois do ouvinte de quem consome.

**Motivo:** alternar uma opção não fecha o menu — vanilla e react fazem assim, e as stories afirmam. As plays que diziam isso passavam só porque a animação de SAÍDA mantinha o painel montado ~150 ms depois de fechar; ela saiu em 2026-09-10 (D5) e o defeito apareceu.

**Verificação após bump:** `WithCheckbox` e `WithRadioGroup` conferem que o painel continua sendo o mesmo nó um quadro depois da troca de estado.

### svelte/context-menu — Tab fecha o menu quando a área é a última parada {#svelte-context-menu-tab-last-stop}

- **Arquivos:** `nortear-design-system-svelte/src/components/ui/dropdown-menu/tab-leaves-menu.ts` (`closeAfterTab`, compartilhado com o DropdownMenu e o Menubar desde 2026-09-11 — ver `#svelte-menu-tab-edge`), chamado por `context-menu/context-menu-content.svelte` e `context-menu-sub-content.svelte`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `bits-ui` 2.19.0 — `bits/menu/menu.svelte.js:826-848` (`handleTabKeyDown`)

**Antes:** sem ponto de tabulação depois da área, o ramo `else` do bits só chamava `body.focus()`: o Tab era bloqueado e o menu ficava aberto, com o foco preso.

**Depois:** os dois painéis encadeiam um ouvinte depois do do bits; num microtask, se a raiz continua aberta, fecham-na e avisam `onOpenChange(false)`. Mora nos nossos wrappers, sem patch. (O manter-aberto dos itens de marcação e de rádio é outra entrada: `#svelte-menu-select-keeps-open`.)

**Motivo:** C2 do `prd/dropdown-menu.md` — Tab fecha e segue a página. A área com `tabindex="0"` é o que nos põe nesse ramo.

**Verificação após bump:** o passo "Tab fecha o menu também quando a área é a última parada" do Playground. Se o `else` do `handleTabKeyDown` passar a fechar, o `closeAfterTab` sai.

### svelte/context-menu — Escape no submenu fecha só o submenu {#svelte-context-menu-submenu-escape}

- **Arquivos:** `nortear-design-system-svelte/src/components/ui/dropdown-menu/sub-escape.ts` (`keepRootOpenOnSubEscape`, compartilhado com o DropdownMenu e o Menubar desde 2026-09-11 — ver `#svelte-menu-submenu-escape`), chamado por `context-menu/context-menu-sub.svelte`, `context-menu-sub-trigger.svelte` e `context-menu-sub-content.svelte`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `bits-ui` 2.19.0 — `bits/utilities/escape-layer/use-escape-layer.svelte.js` (`isResponsibleEscapeLayer`: a responsável é a última camada `close`; o painel raiz nasce `close`, o do submenu `defer-otherwise-close`) e `bits/menu/components/menu-sub-content.svelte` (`handleCloseAutoFocus` não devolve o foco)

**Antes:** Escape dentro do submenu fechava o menu inteiro — quem respondia era a camada do painel raiz.

**Depois:** o painel do submenu ouve `keydown` na CAPTURA e, no Escape, faz `preventDefault` + `stopPropagation` antes da camada do bits (que ouve no `document`, na borbulha); fecha só o submenu pelo estado do nosso `ContextMenuSub` (com `onOpenChange(false)`) e foca o sub-gatilho, que se registra no contexto. O raiz segue aberto e não emite fechamento. Com o foco no raiz (submenu aberto só pelo ponteiro), a tecla não passa pelo painel do submenu e o raiz fecha tudo, que é o certo.

**Motivo:** padrão de menu da WAI-ARIA APG, C5 do `prd/dropdown-menu.md` e `testes.functional.item6`; é o que o vanilla (referência) e o vue fazem. O contexto de menu do bits não é exportado, então o fechamento passa por um contexto nosso.

**Verificação após bump:** o passo "Escape no submenu…" da `WithSubmenu`. Se o submenu passar a ser a camada responsável pelo próprio Escape (ou o raiz passar a `defer-otherwise-close`), o ouvinte e o contexto de submenu saem.

### svelte/context-menu — o painel não recebia `id`, e o typeahead não rodava {#svelte-context-menu-content-id}

- **Arquivo:** `nortear-design-system-svelte/src/components/ui/context-menu/context-menu-content.svelte`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `bits-ui` 2.19.0 — `popper-layer-inner.svelte` consome o `id` do conteúdo e não o põe no painel; `menu.svelte.js:861` (`isKeydownInside`) compara o id do `[data-context-menu-content]` mais próximo com o id guardado

**Antes:** a comparação virava `undefined === contentId`, sempre falsa, e a letra digitada não movia o foco (C4). Setas e Home/End funcionavam, porque o foco itinerante não depende do id.

**Depois:** o wrapper cria um id estável (`$props.id()`, sobrescrevível por `id`), entrega-o ao bits e um `$effect` o escreve no nó que o bits devolve pelo `ref` — o único caminho até esse elemento. Sem patch. O subpainel não precisa: ele mescla as próprias props, id incluído.

**Motivo:** C4 do `prd/dropdown-menu.md` — typeahead, padrão de menu da WAI-ARIA APG.

**Verificação após bump:** o passo "Digitar salta para o item…" do Playground. Se o painel passar a sair com o `id` que o bits guardou, o `$effect` sai.

### svelte/dropdown-menu — `id` no painel raiz (typeahead) {#svelte-menu-content-id}

- **Arquivos:** `nortear-design-system-svelte/src/components/ui/dropdown-menu/dropdown-menu-content.svelte` e `menubar/menubar-content.svelte`
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `bits-ui` 2.19.0 — `popper-layer-inner.svelte` consome o `id`; `menu.svelte.js:861` compara com ele

**Antes:** o painel nascia sem `id`, `isKeydownInside` era sempre falso e a letra digitada não movia o foco (C4). A story `Open` declarava a busca como não aplicável em vez de reprovar.

**Depois:** o wrapper gera um id estável (`$props.id()`, sobrescrevível), passa à lib e o escreve no nó recebido por `ref`. Mesmo conserto de `menubar-content.svelte` e de `context-menu-content.svelte` (`#svelte-context-menu-content-id`).

**Motivo:** C4 do `prd/dropdown-menu.md` — typeahead, padrão de menu da WAI-ARIA APG.

**Verificação após bump:** o passo "Digitar uma letra…" da story `Open` (dropdown-menu-states).

### svelte/dropdown-menu + menubar — Escape no submenu fecha só o submenu {#svelte-menu-submenu-escape}

- **Arquivos:** `nortear-design-system-svelte/src/components/ui/dropdown-menu/` (`sub-escape.ts` — `MenuSubAccess`, `keepRootOpenOnSubEscape`; `dropdown-menu-sub.svelte`, `dropdown-menu-sub-trigger.svelte`, `dropdown-menu-sub-content.svelte`) e `menubar/` (`menubar-sub.svelte`, `menubar-sub-trigger.svelte`, `menubar-sub-content.svelte`)
- **Categoria:** a11y
- **Data:** 2026-09-11
- **Upstream ref:** `bits-ui` 2.19.0 — `bits/utilities/escape-layer/use-escape-layer.svelte.js` (`isResponsibleEscapeLayer`: a última camada `close` responde; o painel raiz nasce `close`, o do submenu `defer-otherwise-close`) e `bits/menu/components/menu-sub-content.svelte` (`handleCloseAutoFocus` não devolve o foco)

**Antes:** Escape dentro do submenu fechava o menu inteiro (no Menubar, o menu da barra) — quem respondia era a camada do painel raiz.

**Depois:** o painel do submenu ouve `keydown` na CAPTURA e, no Escape, faz `preventDefault` + `stopPropagation` antes da camada do bits (que ouve no `document`); fecha só o submenu pelo estado do nosso `Sub` (com `onOpenChange(false)`) e foca o sub-gatilho, registrado por contexto. O raiz segue aberto e não emite fechamento. Mesmo desenho do `#svelte-context-menu-submenu-escape`.

**Motivo:** C5 do `prd/dropdown-menu.md`, `testes.functional.item12` (dropdown) e `item5` (menubar); padrão de menu da WAI-ARIA APG, e o que o vanilla faz.

**Verificação após bump:** os passos "Escape no submenu fecha só o submenu…" de `WithSubmenu` (dropdown-menu-compositions e menubar-compositions). Se o submenu passar a responder pelo próprio Escape, o ouvinte e o contexto saem.

### svelte/dropdown-menu + menubar — `closeOnSelect = false` nos itens de marcação e rádio {#svelte-menu-select-keeps-open}

- **Arquivos:** `nortear-design-system-svelte/src/components/ui/dropdown-menu/dropdown-menu-checkbox-item.svelte`, `dropdown-menu-radio-item.svelte`, `menubar/menubar-checkbox-item.svelte`, `menubar/menubar-radio-item.svelte`, `context-menu/context-menu-checkbox-item.svelte`, `context-menu/context-menu-radio-item.svelte`
- **Categoria:** bugfix
- **Data:** 2026-09-10
- **Upstream ref:** padrão `closeOnSelect = true` do `bits-ui` (`menu-checkbox-item.svelte:20`, `menu-radio-item.svelte:18`; o fechamento sai de `menu.svelte.js:1064`)

**Depois:** o wrapper declara `closeOnSelect = false` e o repassa; quem consome religa pela mesma prop, e o `onSelect` dele segue por `restProps`.

**Motivo:** o vanilla e o react deixam o painel aberto ao marcar e ao escolher rádio. O fechamento ficou escondido enquanto a folha animava a saída (D5): medido em par, com a regra de saída antiga reinjetada a story passa.

**Verificação após bump:** With Checkbox Items / With Radio Group (compositions) e Checkbox Checked (menubar-states) afirmam `queryAllByRole('menu')` com 1 menu depois do clique — `document.body.contains(menu)` não tem dentes no bits, porque o nó fechado continua no DOM.

### svelte/dropdown-menu + menubar — Tab com o gatilho na ponta da página {#svelte-menu-tab-edge}

- **Arquivos:** `nortear-design-system-svelte/src/components/ui/dropdown-menu/` (`tab-leaves-menu.ts`, `dropdown-menu.svelte`, `dropdown-menu-content.svelte`, `dropdown-menu-sub-content.svelte`) e `menubar/` (`tab-leaves-menu.ts`, `menubar.svelte`, `menubar-content.svelte`, `menubar-sub-content.svelte`)
- **Categoria:** bugfix
- **Data:** 2026-09-10
- **Upstream ref:** `bits-ui/dist/bits/menu/menu.svelte.js:816-848` (`handleTabKeyDown`, ramo `else`)

**Antes:** quando o gatilho era a última (ou, no Shift+Tab, a primeira) parada da página, `getTabbableFrom` não achava ninguém e a lib só chamava `body.focus()`: a tecla ficava barrada e o menu, aberto.

**Depois:** a raiz publica `isOpen`/`close` por contexto; os painéis encadeiam `closeAfterTab` depois do `onkeydown` de quem consome e, numa microtask, fecham a raiz se a lib a deixou aberta (avisando `onOpenChange`/`onValueChange`). Mesmo desenho do `#svelte-context-menu-tab-last-stop`.

**Motivo:** C2 do `prd/dropdown-menu.md` — Tab fecha e segue a página.

**Verificação após bump:** `TabAtPageEnd` nas duas stories (reprova sem o conserto, medido).

### vue/dropdown-menu + menubar — marcar e escolher não fecham o menu {#vue-menu-select-keeps-open}

- **Arquivos:** `nortear-design-system-vue/src/components/ui/dropdown-menu/DropdownMenuCheckboxItem.vue`, `DropdownMenuRadioItem.vue`, `menubar/MenubarCheckboxItem.vue`, `menubar/MenubarRadioItem.vue`
- **Categoria:** bugfix
- **Data:** 2026-09-10
- **Upstream ref:** `reka-ui` — `Menu/MenuItem.js:37-47` fecha o menu no tique seguinte ao `select`, a menos que o evento volte com `preventDefault`

**Depois:** o wrapper ouve `select` e faz `preventDefault` depois do ouvinte de quem consome, que chega pelo `forwarded` (no `MenubarCheckboxItem`, `handleSelect` emite e depois previne). A alternância não depende do evento: a lib troca o valor de qualquer jeito.

**Motivo:** a reka fecha em toda escolha, inclusive nos itens de marcação e de rádio; o vanilla e o react deixam o painel aberto. Ficou escondido enquanto a folha animava a saída (D5). Mesmo conserto do `#vue-context-menu-keep-open`.

**Verificação após bump:** With Checkbox Items / With Radio Group (compositions) e Checkbox Checked (menubar-states) afirmam `queryAllByRole('menu')` com 1 menu depois do clique.

### vue/menubar — a barra dá a volta por padrão {#vue-menubar-loop-default}

- **Arquivo:** `nortear-design-system-vue/src/components/ui/menubar/Menubar.vue`
- **Categoria:** a11y
- **Data:** 2026-09-11
- **Upstream ref:** `reka-ui/dist/Menubar/MenubarRoot.js:27-31` (`loop: false`)

**Antes:** sem a prop, a seta lateral parava no último gatilho — e o conteúdo (`props.table.loop.default`) prometia `true`, como as outras quatro stacks fazem.

**Depois:** `withDefaults({ loop: true })`; o `menubar.source.ts` só escreve `:loop="false"`.

**Motivo:** a barra se comporta igual nas cinco, e a tabela de props diz a verdade.

**Verificação após bump:** se a reka passar a nascer com `loop` ligado, o default sai.

### vue/dropdown-menu + menubar — Escape no submenu fecha só o submenu {#vue-menu-submenu-escape}

- **Arquivos:** `nortear-design-system-vue/src/components/ui/dropdown-menu/` (`dropdown-menu.context.ts` — `useSubmenuEscape`, `MENU_SUB_CLOSE`; `DropdownMenuSub.vue`, `DropdownMenuSubContent.vue`), `menubar/` (`MenubarSub.vue`, `MenubarSubContent.vue`) e `context-menu/` (`ContextMenuSub.vue`, `ContextMenuSubContent.vue`)
- **Categoria:** a11y
- **Data:** 2026-09-11
- **Upstream ref:** `reka-ui` — `Menu/MenuSubContent.js` (`onEscapeKeyDown` chama `rootContext.onClose()` sem olhar `defaultPrevented`) e `DismissableLayer.js:72` (`onKeyStroke("Escape")` na `window`)

**Antes:** Escape dentro do submenu fechava o menu inteiro (DropdownMenu) ou o menu inteiro da barra (Menubar).

**Depois:** ouvinte de captura no painel do submenu consome a tecla e interrompe a propagação antes da `window`; fecha só o submenu, pelo estado que agora mora no nosso `DropdownMenuSub`/`MenubarSub` (`useVModel`, passivo sem controle), e foca o sub-gatilho (achado pelo `aria-labelledby` do painel). O raiz segue aberto e não emite fechamento. Mesmo conserto do `#vue-context-menu-submenu-escape`.

**Motivo:** F12 do DropdownMenu e F5 do Menubar (`prd/dropdown-menu.md` C5/C6), padrão WAI-ARIA APG, e o que o vanilla faz.

**Verificação após bump:** os passos "Escape no submenu…" das `WithSubmenu` do dropdown-menu e do menubar (compositions). Se a reka passar a fechar só o submenu, o ouvinte e o estado nos `*Sub` saem.

### vue/dropdown-menu + menubar — Tab sai do menu pelo vizinho do gatilho {#vue-menu-tab-leaves}

- **Arquivos:** `nortear-design-system-vue/src/components/ui/dropdown-menu/` (`tab-leaves-menu.ts` — `useTabLeavesMenu`, que desde 2026-09-11 serve também o ContextMenu; `DropdownMenuContent.vue`, `DropdownMenuSubContent.vue`) e `menubar/` (`tab-leaves-menu.ts`, `MenubarContent.vue`, `MenubarSubContent.vue` — o Menubar fica à parte: a reka o monta não modal e ele fecha sozinho no foco que sai, então mover o foco é o conserto inteiro)
- **Categoria:** a11y
- **Data:** 2026-09-10
- **Upstream ref:** `reka-ui/dist/Menu/MenuContentImpl.js:210` (`preventDefault` no Tab com a raiz modal)

**Antes (medido com teclado real):** o DropdownMenu modal prendia Tab e Shift+Tab, com o foco no item e o menu aberto. O Menubar fechava, mas o foco ia ao `<body>` (Tab) ou ao elemento DEPOIS da barra (Shift+Tab), porque a ordem de tabulação partia do portal no fim do documento.

**Depois:** ouvinte de CAPTURA nos painéis raiz e de submenu. No DropdownMenu, fecha pela raiz e aplica o destino (o ponto de tabulação vizinho do gatilho) no `closeAutoFocus`, com `modal` intacto — véu e trava de rolagem se mantêm (D1). No Menubar, que a lib monta não modal, move o foco para o destino e a lib fecha pelo `focusOutside`. Sem destino, fecha e o foco volta ao gatilho.

**Motivo:** C2 e D1 do `prd/dropdown-menu.md`. O destino segue o `handleTabKeyDown` do bits-ui.

**Verificação após bump:** `TabLeavesMenu`/`TabAtPageEnd` (dropdown-menu.stories) e `TabLeavesMenubar`/`TabAtPageEnd` (menubar.stories). Se a reka parar de barrar o Tab e passar a conduzir o foco, o ouvinte sai.

---

## Patches `node_modules/` (gerenciados via `patch-package`)

A partir de 2026-06-06, patches diretamente em bibliotecas upstream `node_modules/` são versionados via [`patch-package`](https://github.com/ds300/patch-package) em cada stack. Postinstall aplica os patches automaticamente após `npm install`.

**Localização**:
- `nortear-design-system-react/patches/*.patch` (ex: `@base-ui+react+1.4.1.patch`)
- `nortear-design-system-vue/patches/*.patch` (ex: `reka-ui+2.9.6.patch`, `vue-sonner+2.0.9.patch`)
- `nortear-design-system-svelte/patches/*.patch` (ex: `bits-ui+2.18.0.patch`, `svelte-sonner+1.1.1.patch`)

**Como atualizar**:
```bash
cd nortear-design-system-<stack>
# Edite o arquivo em node_modules/<pkg>/...
npx patch-package <pkg>       # regenera o .patch
# Commit o arquivo regenerado em patches/
```

**Ao bumpar a dep**: confira se a versão do .patch (`@base-ui+react+1.4.1.patch`) ainda casa com a versão instalada. Se a dep mudou estrutura, `patch-package` reporta falha no install — re-aplique o patch manualmente.

### vue/vue-sonner — Toast `<li>` tabindex 0 → -1 {#vue-sonner-toast-tabindex}

- **Patch:** `nortear-design-system-vue/patches/vue-sonner+2.0.9.patch`
- **Arquivos patcheados:** `node_modules/vue-sonner/lib/vue-sonner.js` (linha 326) + `vue-sonner.cjs`
- **Versão upstream:** `vue-sonner@2.0.9`
- **Categoria:** a11y
- **Data:** 2026-06-06
- **Upstream ref:** ainda aberto em [emilkowalski/sonner](https://github.com/emilkowalski/sonner)

**Antes:**
```js
"aria-live": e.toast.important ? "assertive" : "polite",
"aria-atomic": "true",
role: "status",
tabindex: "0",
"data-sonner-toast": "true",
```

**Depois:**
```js
"aria-live": e.toast.important ? "assertive" : "polite",
"aria-atomic": "true",
role: "status",
tabindex: "-1",  // PATCH: a11y — toast item não-interativo não deve ser tab-stop
"data-sonner-toast": "true",
```

**Motivo:** O `<li>` do toast tem `aria-live`/`aria-atomic` (canal AT correto). `tabindex=0` torna o `<li>` tab-stop sem ação — viola `nested-interactive` (botão close interativo dentro) e cria stop de Tab inútil.

**Verificação após bump:** stories `ui-sonner-*` não devem reportar `nested-interactive`.

### svelte/svelte-sonner — Toast `<li>` tabindex 0 → -1 {#svelte-sonner-toast-tabindex}

- **Patch:** `nortear-design-system-svelte/patches/svelte-sonner+1.1.1.patch`
- **Arquivos patcheados:** `node_modules/svelte-sonner/dist/Toast.svelte` (linha 334)
- **Versão upstream:** `svelte-sonner@1.1.1`
- **Categoria:** a11y
- **Data:** 2026-06-06
- **Upstream ref:** ainda aberto em [emilkowalski/sonner](https://github.com/emilkowalski/sonner)

**Antes:**
```svelte
<li tabindex={0} bind:this={toastRef} ...>
```

**Depois:**
```svelte
<li tabindex={-1} bind:this={toastRef} ...>
```

**Motivo:** Mesma análise que `vue-sonner` — `<li>` carrega `aria-live`/`aria-atomic`, não precisa estar na tab order. Evita `nested-interactive` com o botão close dentro.

**Verificação após bump:** stories `ui-sonner-*` não devem reportar `nested-interactive`.

---

## Divergências idiomáticas entre libs (sem patch — não alinhar)

Diferenças de saída que vêm da lib primitiva e que **entregam o mesmo resultado
para o usuário**. Ficam registradas para que uma auditoria cross-stack não as
trate como bug e "alinhe" na força.

### alert-dialog — `aria-modal`: divergência ENCERRADA

- **Onde:** `role="alertdialog"` do painel, nas cinco stacks.
- **Estado hoje:** as cinco emitem `aria-modal="true"`. `bits-ui` e a factory vanilla, de origem; `@base-ui/react` e `reka-ui` isolam o resto da página com `aria-hidden`/`inert` e não emitem o atributo, então os wrappers do react (`alert-dialog.tsx`) e do vue (`AlertDialogContent.vue`) o forçam; o angular também o tem.
- **Por que esta entrada mudou:** ela dizia "só em bits-ui e Vanilla — não alinhar", e ficou de pé depois que os wrappers passaram a forçar o atributo. A regra de categoria (`guidelines/18-overlay.md`, §Modalidade) assere `aria-modal="true"` na suíte, e é ela que vale.

## Bugs upstream conhecidos (sem patch aplicado)

### React/Vue/Svelte — FocusGuard `<span aria-hidden tabindex=0>` (axe `aria-hidden-focus`)

- **Status:** PATCH TENTADO E REVERTIDO em 2026-06-06. **Não patchear este caso.**
- **Pacotes afetados:** `@base-ui/react@1.4.1`, `reka-ui@2.9.6` (NavigationMenuTrigger), `bits-ui@2.18.0` (navigation-menu focus proxy)
- **Sintoma axe:** stories de Popover/Dialog/Tooltip/DropdownMenu/Sheet/HoverCard/NavigationMenu reportam `aria-hidden-focus` (serious) — `<span aria-hidden="true" tabindex="0">` é focável mas marcado como aria-hidden.

**Por que NÃO patchear pra `tabindex=-1`**: tentamos mudar `tabIndex: 0` → `-1` esperando manter `.focus()` programático. **Quebrou Tab wrap-around no focus trap**: o span é o elemento sentinela que captura Tab no fim do popover e dispara `onFocus` pra redirecionar pro primeiro/último item. Com `tabindex=-1`, Tab pula o span e vaza pro elemento seguinte do `document.body`. React vitest regrediu de 71 → 127 falhas; mesmo padrão em Vue/Svelte.

**Conclusão**: este é um trade-off intencional das libs (focus trap funcional > axe rule). O elemento É focável programaticamente E aria-hidden — axe vê como erro mas a UX está correta.

**Mitigações possíveis** (não aplicadas ainda):
- (a) Configurar axe em `parameters.a11y.config.rules` pra ignorar `aria-hidden-focus` em `[data-base-ui-focus-guard]` / equivalentes — viola política "no skip"
- (b) Aguardar fix upstream (`role="presentation"` + foco-manageable pode resolver, mas exige refator da lib)
- (c) Tolerar as ~50 falhas axe nesses componentes — opção atual

### svelte/@lucide/svelte — Runtime "Cannot read 'call' of undefined"

- **Status:** EM INVESTIGAÇÃO — sem patch aplicado em 2026-06-06.
- **Versão:** `@lucide/svelte@1.8.0` + `svelte@5.55.4`
- **Sintoma:** erro `Cannot read properties of undefined (reading 'call')` em `Icon.svelte` durante HMR/render de `dialog-close.svelte` e outros componentes Svelte 5.
- **Análise:** `Icon.svelte` e `icons/*.svelte` usam `$props()` corretamente; nenhum mau uso de runes encontrado. Suspeita de problema de cache Vite/bundler ou export duplicado.
- **Mitigação imediata:** limpar `node_modules/.vite` e re-rodar.
- **Próximo passo:** reproduzir em projeto isolado, abrir issue em https://github.com/lucide-icons/lucide.

### svelte/@lucide/svelte — ícone `github` removido upstream

- **Status:** RESOLVIDO localmente em 2026-06-06 — substituído por `code-2`.
- **Versão:** `@lucide/svelte@1.8.0`
- **Sintoma:** `import Github from '@lucide/svelte/icons/github'` falha com `dependencies imported but could not be resolved`, bloqueando a coleta de testes.
- **Análise:** o lucide-icons removeu o ícone `github` upstream (questões de marca). Não há alias em `@lucide/svelte/aliases/`.
- **Mitigação:** trocar a importação por `@lucide/svelte/icons/code-2` (substituto neutro) ou similar. Aplicado em `src/components/ui/command/CommandComposicaoLinkItemStory.svelte`.

### svelte/input-otp — pacote não instalado (uso indevido)

- **Status:** RESOLVIDO localmente em 2026-06-06.
- **Sintoma:** `import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'` em `InputOTPDocs.svelte` falha — o pacote `input-otp` é uma dep exclusiva da stack React, não da Svelte (que usa `bits-ui` `PinInput`).
- **Mitigação:** declarar a constante localmente (`const REGEXP_ONLY_DIGITS_AND_CHARS = '^[a-zA-Z0-9]+$'`). Bits-ui aceita string regex em `pattern`.
