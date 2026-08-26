# System Design (Nortear — Angular)

## Visão geral

- **Storybook** — interface principal (porta 6010). Não há sandbox neste pacote
- **Frontend-only** — sem backend, publicável em CDN estático
- **Zoneless** — signals do começo ao fim

```
Browser
├── Angular 22 (standalone, signals, zoneless)
├── @radix-ng/primitives — comportamento headless (Root/Trigger/Positioner/Popup)
├── @floating-ui/dom — posicionamento de overlay (vem com o headless)
├── @angular/forms — NgControl, para o estado de validação do campo
├── echarts — motor do Chart, renderizador SVG
├── @internationalized/date e /number — datas e números do Calendar
├── CSS .nds-* compartilhado — nenhum framework de utilitário
├── lucide (pacote agnóstico) — ícones
├── DOMPurify — sanitização, chamada no call site
├── clsx — cn()
└── @storybook/angular-vite — documentação e testes
```

**Não há biblioteca de tabela headless neste pacote**: o DataTable tem motor em signals. O Chart, sim, usa lib — `echarts`, a mesma das outras quatro stacks, com o renderizador SVG. Ver `08-display-components.md`.

---

## Padrão de módulo de componente

Um arquivo por componente, exportando o raiz e as diretivas irmãs. A anatomia segue `Root` / `Trigger` / `Positioner` / `Popup` do headless.

```ts
@Component({
  selector: 'button[ndsButton], a[ndsButton]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [{ directive: RdxButtonDirective, inputs: ['disabled', 'type'] }],
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"button"',
  },
})
export class NdsButton {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('default');
  protected readonly hostClass = computed(() => btnClass(this.variant(), this.size()));
}
```

Quatro coisas são invariantes: `standalone`, `OnPush`, `ViewEncapsulation.None` e `data-slot` no host.

A função que monta a classe é **pura e idêntica à do Vanilla de propósito** — Vanilla é a referência cross-stack para markup e classes, e função pura é o que permite compará-las lado a lado.

---

## `hostDirectives` — o que ele restringe e o que ele não alcança

`hostDirectives: [{ directive: X, inputs: [...] }]` restringe o que **X** expõe no elemento.

**Não alcança o que as host directives DE X expõem**: essas continuam ligáveis no elemento, mesmo fora da sua lista.

Foi o que aconteceu no Slider. O primitivo de raiz tem um acessor de valor como host directive, e o acessor recebia o valor escrito no elemento mesmo sem `value` na lista. Como o primitivo decide se é intervalo pelo formato do valor, um número onde se esperava array virava uma faixa de largura zero — sem erro nenhum, e com a alça no lugar certo disfarçando.

**Antes de compor, olhe as host directives do primitivo, não só os inputs dele.**

### Quando expor um input do primitivo e quando não

Regra: exponha quando **duas** diretivas ligam o mesmo atributo no host, ou quando o primitivo sobrescreveria um valor que quem consome escreveu.

| Caso | Decisão | Razão |
|---|---|---|
| `disabled` no gatilho de Dialog | **expor** | duas diretivas ligam `disabled`; se só uma recebe o valor, a outra escreve vazio e apaga o atributo, sem ordem garantida |
| `disabled` no gatilho de Collapsible | **não expor** | não há conflito; o primitivo já trata |
| `disabled` no gatilho de Tooltip | **não expor** | botão nativamente desabilitado não recebe foco nem ponteiro — o tooltip não abriria de qualquer forma |
| `id` no gatilho de Tooltip | **expor** | o primitivo liga um id gerado no host e sobrescreveria o id de quem consome |
| `modal` no Dialog | **expor** | decide trava de rolagem e inércia do resto da página |
| `modal` no Alert Dialog | **não expor** | a variante do componente o fixa; input que não muda nada seria mentira na tabela de propriedades |
| escolha múltipla no Select | **não expor** | sem indicador visual e sem documentação, seria superfície morta |

Input exposto que não muda nada é pior que input ausente: ele aparece na tabela de propriedades e alguém vai tentar usá-lo.

---

## Composição de diretivas: `data-slot` é contrato

`data-slot` é ligado por host binding em quase todo componente, e é o contrato de markup que as cinco stacks compartilham e que a auditoria compara.

Com duas diretivas no mesmo host, as duas escrevem o mesmo atributo e uma sobrescreve a outra, **sem ordem garantida e sem erro nenhum**. O elemento perde a identidade que os testes e o CSS usam para achá-lo.

Casos conhecidos no repositório:

| Composição | Saída adotada |
|---|---|
| `<button ndsDialogClose ndsButton>` | a peça que se compõe (`ndsDialogClose`) **não** liga `data-slot` |
| `<input ndsInput ndsInputGroupInput>` | `ndsInputGroupInput` traz a classe base junto, dispensando a outra diretiva |
| `<button ndsSidebarMenuButton ndsTooltipTrigger>` | em teste, procurar pela classe |
| `<button ndsDropdownMenuTrigger ndsButton>` (menu de colunas do DataTable) | em teste, procurar pela classe |

**Regra prática: em teste, procure pela classe `.nds-*`, não pelo `data-slot`.**

---

## Ciclo de vida

### `input()` no construtor devolve o default

Ler `this.meuInput()` no construtor dá o valor **declarado no componente** — o binding de quem consome ainda não foi aplicado.

No Sidebar isso fez o estado inicial escrito por quem consome ser ignorado: a barra nascia aberta, sem erro, só com o estado errado. No DataTable, o tamanho de página inicial.

**Inicialização que dependa de input vai em `ngOnInit`.**

### `effect` para reagir, `computed` para derivar

| Quero | Uso |
|---|---|
| Valor derivado de outros signals | `computed` |
| Efeito colateral fora do Angular (meta tag, analytics, foco) | `effect`, com `onCleanup` quando há o que desfazer |
| Ler um `viewChild` que aparece condicionalmente | `effect` que lê o signal do `viewChild` |
| Observer que precisa do DOM montado | `ngAfterViewInit`, desconectado no `ngOnDestroy` |

`effect` que só chama `t()` precisa ler `dict()` explicitamente para declarar a dependência.

---

## Eventos

### `(click)` no `host` corre DEPOIS do `(click)` de quem consome

Um listener declarado em `host: { '(click)': '…' }` é registrado **depois** do `(click)` que o consumidor escreve no mesmo elemento. Interromper a propagação a partir dele não alcança ninguém: o handler de quem usa já disparou.

Apareceu no Pagination — o link desabilitado continuava chamando o callback de página. Para barrar de verdade, registre no construtor com escuta na **fase de captura** e leia o estado no momento do clique.

### Saída, não Custom Event

Comunicação de dentro para fora é `output()`. `dispatchEvent` de Custom Event é idioma do Vanilla e não é o canal deste stack.

Saída de fechamento de overlay vem em dois sabores no headless: a mudança de estado, e a mudança **concluída** depois da animação. Quem precisa agir com o painel já fora da tela usa a segunda.

---

## Projeção de conteúdo

### Duas `<ng-content>` em ramos de `@if` engolem o conteúdo

Um componente com dois destinos de projeção padrão — um em cada ramo de um `@if` — não entrega o conteúdo a **nenhum** dos dois. A projeção é resolvida em tempo de compilação, antes de existir ramo ativo.

Não há erro: o componente renderiza vazio, com os wrappers no lugar. Custou uma sonda no DOM do Sidebar para achar.

A saída é **uma** `<ng-content>`, guardada num `<ng-template>` e instanciada onde faz falta:

```html
<ng-template #conteudo><ng-content /></ng-template>

@if (semRecolhimento()) {
  <ng-container [ngTemplateOutlet]="conteudo" />
} @else {
  <div class="wrapper"><ng-container [ngTemplateOutlet]="conteudo" /></div>
}
```

`<ng-container>` não deixa nó no DOM, o que preserva o contrato de markup.

### Diretiva de `@angular/common` faltando no `imports` NÃO dá erro

`[ngTemplateOutlet]` num `<ng-container>` sem `NgTemplateOutlet` no `imports` vira binding para propriedade inexistente: **`NG0303` no console e nada mais**.

A página renderiza inteira, o `tsc` passa (ele não valida template Angular) e o teste fica verde. O que some é só o que aquele outlet ia instanciar.

Custou dez setas de expansão invisíveis numa docs page, achadas lendo o log de uma rodada **que tinha passado**. Vale para `NgClass`, `NgStyle` e companhia.

**Quando um preview aparecer vazio sem motivo, procure `NG0303` no log antes de procurar no CSS.**

---

## Expressões de template

Não há globais: `String(...)`, `Object.keys(...)`, `JSON.stringify(...)`, `Math.*` não existem numa expressão de template. O erro é de runtime: `ctx.String is not a function`.

Exponha um `computed` no componente. Ver `02-template-caracteres-especiais.md` §5.

---

## Performance

| Prática | Por quê |
|---|---|
| `OnPush` em todo componente | sem zone, a detecção é dirigida por signals; `OnPush` é o contrato |
| `computed` em vez de método chamado no template | método no template roda a cada verificação; `computed` memoiza |
| `track` em todo `@for` | sem identidade estável, a lista é recriada inteira a cada mudança |
| Conteúdo de overlay em `<ng-template>` | o painel não existe enquanto está fechado |
| `@Directive` quando não há template | um `@Component` vazio cria view e ciclo de detecção para nada |
| Não persistir conteúdo escondido por default | "manter montado" é escolha explícita, para o caso com estado a preservar |

Ver `../../docs/shared/guidelines/10-performance.md`.

---

## Segurança

```ts
// ✅ DOMPurify importado no arquivo e exposto ao template
protected readonly DOMPurify = DOMPurify;
// [innerHTML]="DOMPurify.sanitize(t('notes.item1.content'))"

// ❌ computed safeContent — esconde o sanitizador do SAST
```

O `[innerHTML]` do Angular já passa pelo sanitizador do framework. A exigência de chamar `DOMPurify` no call site **não** é redundância defensiva: as ferramentas de SAST só reconhecem o sanitizador de taint quando a chamada aparece ali, e um wrapper faz o fluxo seguir reportado como XSS para sempre.

Não existe helper de sanitização em `src/lib/` — e não deve passar a existir.

Interpolação `{{ }}` escapa por conta própria: para texto, é sempre o caminho certo.

Ver `../../docs/shared/guidelines/09-seguranca-xss.md`.

---

## Estratégia de testes

| Camada | Ferramenta | O que prova |
|---|---|---|
| Tipos | `tsc --noEmit` na linha de comando | tipos de TS **e** templates (`strictTemplates`) |
| Comportamento e a11y | Storybook Test (vitest browser) — `play` mais axe | interação real em navegador |
| Contrato de conteúdo e a11y das docs pages | `docs-smoke.stories.ts` | toda docs page monta, cumpre o contrato de conteúdo e passa no axe |
| Regressão visual | Chromatic | aparência nas cinco dimensões de tema |
| Determinístico por componente | `node scripts/audit.mjs <slug>` | classes inexistentes, seções faltando, vocabulário morto |

### Regras de teste deste stack

- **`tsc` não valida template.** Um erro de template só aparece com `strictTemplates` na checagem do compilador Angular, e um `NG0303` só aparece no log do navegador. Teste verde não prova que o template está certo
- **Story de variação afirma a classe resultante.** É a defesa contra o JIT silencioso
- **Toda função em `args` precisa de entrada em `argTypes`**, ou não chega ao template
- **Overlay não está no canvas.** Procure no corpo do documento, com `esperarPortal` — que espera a animação assentar antes de devolver o elemento
- **Falha intermitente nunca fecha como "não reproduz".** Contraste no axe com razão perto de 1.0 e cores quase idênticas é elemento em pleno fade, não paleta ruim: a correção é o `play` esperar, nunca marcar a a11y como pendente
- **A regra da âncora de foco é desligada só na story que termina com overlay aberto**, e o motivo fica escrito ali. Desligar globalmente calaria as outras noventa
- **Rode o vitest em primeiro plano.** Execução em segundo plano já foi morta em silêncio nesta máquina: sem processo, sem resultado, esperando para sempre

### Ordem de trabalho

Diagnostique tudo, corrija tudo, teste uma vez em bloco, e re-teste só o que falhou. Suíte por correção é o custo que essa ordem evita.
