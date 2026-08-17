# Regras Gerais Obrigatórias (Nortear — Angular)

* **SEU PAPEL**: manter a consistência do projeto seguindo ESTRITAMENTE o que está nas guidelines. NUNCA invente seções, estruturas ou padrões que não estejam documentados. SEMPRE consulte as guidelines antes de criar ou modificar qualquer componente.
* **É OBRIGATÓRIO usar os componentes de `./components/ui`** — antes de escrever qualquer elemento HTML (`<div>`, `<button>`, `<table>`, `<kbd>`), verifique se existe diretiva ou componente que atenda ao caso. Se existir, use-o — sem exceção.
* **É OBRIGATÓRIO usar as classes `.nds-*`** de `docs/shared/styles/nds/` — CSS standalone e global; classe sem o prefixo `nds-` é inerte em runtime.
* **É OBRIGATÓRIO usar APENAS ícones do pacote `lucide`** (agnóstico de framework) — nunca `lucide-angular`, que declara peer `@angular/core: 13.x - 21.x` e conflita com o Angular 22.
* **É OBRIGATÓRIO que todo painel de conteúdo (Dialog, Sheet, Drawer, Card) use `--card` / `--card-foreground`**; menus e overlays flutuantes usam `--popover` / `--popover-foreground`.
* **É OBRIGATÓRIO que o foco visível venha do CSS compartilhado** — anel opaco, definido no `:focus-visible` de cada `.nds-*`. Não recriar anel no componente, e nunca com opacidade.
* **COMPATIBILIDADE MOBILE**: sempre que possível prefira Popover a Hover Card ou Tooltip.
* Sistema de espaçamento em múltiplos de 8px, pela escada `--spacing-*`.
* Diretrizes **WCAG 2.2 AA** para acessibilidade.
* **TIPOGRAFIA**: apenas a fonte do sistema definida no CSS; tamanhos e `line-height` vêm dos tokens `--text-*`.
* Mantenha arquivos pequenos e coloque helpers em arquivos separados.
* `cn()` de `@/lib/utils` compõe classes condicionais em TypeScript. Para a classe do próprio host, prefira host binding com `computed` — ver abaixo.

---

## Componente de atributo é o padrão

O seletor de quase todo componente deste stack é um **atributo em elemento nativo**: `button[ndsButton]`, `span[ndsBadge]`, `div[ndsCard]`, `table[ndsTable]`, `nav[ndsBreadcrumb]`.

O host **é** o elemento nativo. Não há wrapper extra no DOM, o markup fica idêntico ao do Vanilla — que é a referência cross-stack — e o CSS `.nds-*` casa sem camada intermediária.

Componentes com seletor de elemento (`nds-select`, `nds-drawer`, `nds-carousel`, `nds-code-block`, `nds-input-otp`, `nds-menubar`, `nds-dropdown-menu`, `nds-sheet`, `nds-alert-dialog`) existem onde a peça **não corresponde** a um elemento nativo: são orquestradores que portalizam conteúdo ou guardam estado de um conjunto.

## `@Directive` quando não há template

Se a peça só aplica atributos e classes a um elemento que já existe — sem `<ng-content>`, sem markup próprio — use `@Directive`. Um `@Component` com `template: ''` cria view e ciclo de detecção para renderizar nada.

`NdsSeparator` é o modelo. Componentes que projetam conteúdo (`NdsButton`, `NdsBadge`) ou que têm template próprio (`NdsDialogContent`, `NdsChart`) seguem `@Component`.

## Nunca criar um input `class`

O Angular já mescla o `class` que o consumidor escreve no elemento com o que o componente declara — tanto com `host: { class: '…' }` estático quanto com host binding `[class]` dinâmico.

```ts
// Classe fixa
host: { class: 'nds-card' }

// Classe que depende de input
host: { '[class]': 'hostClass()' }   // computed monta SÓ as classes do próprio componente
```

Um input `class` + composição manual é hábito de outra biblioteca, onde a prop sobrescreve; aqui só duplica o framework.

**Exceção: SVG.** `className` em SVG é `SVGAnimatedString` e não aceita binding de classe. Nos componentes de ícone (`NdsButtonIcon`, `NdsAvatarIcon`) o binding é `[attr.class]`, que **sobrescreve** — por isso ali o input de classe é necessário.

## `ViewEncapsulation.None` em todo componente de UI

Nenhum componente declara `styles` próprios: o visual inteiro vem de `docs/shared/styles/nds/`, que é global. Encapsulamento só emitiria atributos `_ngcontent-*` inúteis no host.

## Estado de componente: `data-*`

```ts
host: {
  '[attr.data-slot]': '"dialog"',        // identidade da peça no contrato cross-stack
  '[attr.data-state]': 'estado()',       // open | closed
  '[attr.data-variant]': 'variant()',
}
```

`data-slot` é o contrato que as cinco stacks compartilham e que a auditoria compara. Duas diretivas no mesmo elemento **disputam** esse atributo, sem ordem garantida e sem erro — ver `RULES.md` §8 e `13-system-design.md`.

## Comunicação: `input()` / `output()` / `model()`

| Direção | Mecanismo |
|---|---|
| De fora para dentro | `input()`, `input.required()` |
| De dentro para fora | `output()` |
| Duas vias | `model()` |
| Estado compartilhado por um conjunto de peças | serviço `@Injectable()` provido no orquestrador |

Não existe `dispatchEvent` de Custom Event como canal interno neste stack — isso é idioma do Vanilla. `output()` é o canal.

Atenção: **ler `this.meuInput()` no construtor devolve o default**, não o valor ligado por quem consome. Inicialização que dependa de input vai em `ngOnInit`.

## Nunca invente classe `.nds-*`

Prefixo certo não quer dizer que a regra existe: `nds-skeleton-line` e `nds-p-3` têm cara de válidas e não pintam nada. Confira em `docs/shared/styles/nds/` antes de usar; se faltar a regra, crie no CSS compartilhado seguindo o Vanilla.

Portão: `node scripts/audit.mjs <slug>`, regra `unknown_class_reference`.

## Nunca escreva CSS inline

Sem `style="…"`, sem `[style]`. Medida que falta vira regra no CSS compartilhado, com token da escada `--spacing-*` (o grid de 8px) ou `--size-*`.

**Altura não se crava** em primitivo interativo: nasce de `padding-block` mais tipografia, para o bloco crescer junto quando a pessoa aumenta a fonte do navegador (WCAG 1.4.4). Tokens `--height-*` seguem válidos para containers (card, modal, sidebar) e para ícones, que não têm texto a crescer.

Quando a variação é escolha de quem usa — forma e largura de um esqueleto, por exemplo — exponha `data-*`, como `data-spacing` e `data-size` já fazem no resto do sistema.

## Sanitização

`[innerHTML]` recebe `DOMPurify.sanitize()` **no próprio binding**, com `protected readonly DOMPurify = DOMPurify` expondo o módulo ao template.

```ts
// ✅ chamada no call site — o SAST reconhece o sanitizador
// [innerHTML]="DOMPurify.sanitize(t('anatomy.item1'))"

// ❌ computed safeItem1 — esconde o sanitizador e vira falso positivo permanente
```

O `[innerHTML]` do Angular já passa pelo DomSanitizer do framework; a exigência não é redundância defensiva, é a guideline 09. Portão: `node scripts/audit.mjs <slug> --category security`.

## Zoneless

`provideZonelessChangeDetection()` está no `preview.ts` e no bridge do `withAutoDocsTab`. O Radix NG é signals-first; não introduza dependência de zone.
