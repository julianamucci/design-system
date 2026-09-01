import { Check } from 'lucide';
import { cn } from '@/lib/utils';

// ─── Stepper — Vanilla factories standalone ─────────────────────────────────
//
// Visual: classes .nds-stepper-* de `docs/shared/styles/nds/stepper.css`.
//
// A FOLHA É O CONTRATO, e é dela que esta implementação sai — não do avesso.
// Ela declara, no próprio docblock, `<ol class="nds-stepper">` com
// `<li class="nds-stepper-item">`, o estado em `data-state`
// (active/completed/inactive) e a indisponibilidade em `data-disabled` no item.
// O `<button class="nds-stepper-trigger">` com `cursor: pointer` e anel de
// `:focus-visible` diz, sem ambiguidade, que a etapa é um CONTROLE.
//
// ─── Decisões de acessibilidade, escritas porque são a parte difícil ────────
//
// 1. A RAIZ É LISTA ORDENADA. A ordem e a contagem das etapas são o conteúdo,
//    não decoração: `<ol>` as anuncia sozinho ("lista, 4 itens, item 2") e
//    poupa texto inventado. Um `<div role="group">` com rótulo diria menos e
//    custaria mais.
//
// 2. A ETAPA ATUAL LEVA `aria-current="step"`, e não `aria-current="true"`.
//    `step` é o token que a WAI-ARIA define para posição num processo; `true`
//    é o genérico, e diz "este é o atual" sem dizer atual do quê. É a mesma
//    escolha que `pagination` já faz nesta casa com `page`.
//
// 3. ESTADO NÃO DEPENDE SÓ DE COR (WCAG 1.4.1), e por dois caminhos ao mesmo
//    tempo, porque um só não cobre todo mundo:
//      • visual — a etapa concluída troca o NÚMERO por uma marca de
//        verificação. É forma, não matiz, e sobrevive a daltonismo e a tela
//        monocromática.
//      • programático — `labels.completed` e `labels.current` viram uma
//        palavra `.nds-sr-only` dentro do gatilho. Quem não vê a marca ouve
//        "Etapa concluída".
//    Os rótulos moram na RAIZ, e não no gatilho, porque o estado de uma etapa
//    MUDA quando o fluxo avança: uma palavra fixa por gatilho estaria errada
//    no passo seguinte.
//
// 4. INDICADOR E TRAÇO SÃO DESENHO, e levam `aria-hidden="true"`. O número do
//    indicador repete a posição que a lista já anuncia, e ler os dois faz o
//    leitor de tela dizer a mesma coisa duas vezes.
//
// 5. NÃO HÁ REGIÃO VIVA. Um indicador que se reanuncia a cada avanço atropela
//    a leitura do resto da tela. Quem anuncia o avanço é o painel que trocou
//    de conteúdo, e é para ele que a aplicação move o foco.
//
// 6. ETAPA INDISPONÍVEL É `disabled` DE VERDADE, e sai da ordem de tabulação.
//    Um botão focável que não leva a lugar nenhum é uma parada de foco que
//    gasta o tempo de quem navega por teclado sem entregar nada.
//
// 7. SEM ALTURA FIXA EM TEXTO (WCAG 1.4.4). O círculo do indicador tem
//    dimensão fixa de propósito — mas RELATIVA: `--spacing-8` é
//    `calc(var(--spacing-base) * 8)` com `--spacing-base: 0.25rem`, então o
//    círculo cresce com a densidade e com o tamanho de fonte do navegador.
//    Título e descrição vivem FORA dele e nunca são recortados.
//
// A opção de classe é `class`, como nas outras fábricas desta stack, com
// `className` aceito como apelido; quando os dois vêm, `class` vence.

export type StepperState = 'inactive' | 'active' | 'completed';

/**
 * Palavras de estado lidas só por leitor de tela.
 *
 * Ausentes, nada é anunciado — e aí a diferença entre concluída e futura fica
 * só na marca de verificação, que é visual. A documentação cobra os dois.
 */
export interface StepperLabels {
  completed?: string;
  current?: string;
}

export interface StepperOptions {
  /** Nome acessível do fluxo. Sem ele o leitor de tela anuncia só uma lista. */
  'aria-label': string;
  labels?: StepperLabels;
  /** Chamado com o número da etapa quando um gatilho disponível é acionado. */
  onStepSelect?: (step: number) => void;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface StepperItemOptions {
  /** Número desta etapa, contando de 1. */
  step: number;
  /** Conta como concluída mesmo estando depois da atual. */
  completed?: boolean;
  /** Indisponível: o gatilho sai da ordem de tabulação. */
  disabled?: boolean;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface StepperTriggerOptions {
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface StepperIndicatorOptions {
  /**
   * Conteúdo próprio no lugar do número. Com ele o indicador passa a ser
   * `data-custom`, e `setStepperValue` deixa de reescrevê-lo — senão a marca de
   * verificação apagaria o ícone que o consumidor pôs ali.
   */
  content?: string | HTMLElement;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface StepperTextOptions {
  text?: string;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface StepperSeparatorOptions {
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

type LucideIconNode = [string, Record<string, string>];

/**
 * Monta um ícone do lucide por `createElementNS`.
 *
 * Mesma decisão do `breadcrumb.ts`: os nós vêm da lista `[tag, attrs]` do
 * pacote agnóstico `lucide`, e não de um `d` copiado à mão — copiado, ele
 * congela na versão do dia e some do radar quando o pacote muda o desenho.
 * Construir nós é imune a XSS: não há `innerHTML` no caminho.
 */
function createIconLucide(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

/**
 * Raiz do Stepper.
 *
 * O ouvinte é DELEGADO na raiz, e não pendurado em cada gatilho: o número da
 * etapa é lido do `data-step` do item no momento do clique, então a fábrica
 * continua correta depois de `setStepperValue` — e depois de o consumidor
 * acrescentar ou remover etapas. Pendurar por gatilho congelaria o número
 * capturado no momento da criação.
 *
 * O ouvinte fica no PRÓPRIO nó, e não em `document`: sai da memória junto com
 * a árvore, sem `destroy()` para o consumidor lembrar de chamar.
 */
export function createStepper(options: StepperOptions): HTMLOListElement {
  const className = options.class ?? options.className;

  const ol = document.createElement('ol');
  ol.dataset.slot = 'stepper';
  ol.setAttribute('aria-label', options['aria-label']);
  ol.className = cn('nds-stepper', className);

  if (options.labels?.completed) ol.dataset.labelCompleted = options.labels.completed;
  if (options.labels?.current) ol.dataset.labelCurrent = options.labels.current;

  const onStepSelect = options.onStepSelect;
  if (onStepSelect) {
    ol.addEventListener('click', (event) => {
      const target = event.target as Element | null;
      const trigger = target?.closest('[data-slot="stepper-trigger"]');
      if (!trigger || !ol.contains(trigger)) return;
      if (trigger instanceof HTMLButtonElement && trigger.disabled) return;
      const item = trigger.closest('[data-slot="stepper-item"]');
      const step = Number((item as HTMLElement | null)?.dataset.step);
      if (!Number.isFinite(step)) return;
      onStepSelect(step);
    });
  }

  return ol;
}

/**
 * Uma etapa.
 *
 * Nasce `inactive` para que a folha tenha estado desde o primeiro quadro;
 * `setStepperValue` resolve o estado real assim que o valor do fluxo é
 * conhecido.
 */
export function createStepperItem(options: StepperItemOptions): HTMLLIElement {
  const className = options.class ?? options.className;

  const li = document.createElement('li');
  li.dataset.slot = 'stepper-item';
  li.dataset.step = String(options.step);
  li.dataset.state = 'inactive';
  if (options.completed) li.dataset.completed = '';
  if (options.disabled) li.dataset.disabled = '';
  li.className = cn('nds-stepper-item', className);

  return li;
}

/**
 * Controle da etapa.
 *
 * `type="button"` explícito: dentro de um `<form>` — que é o caso de todo
 * wizard — um botão sem `type` é `submit`, e clicar numa etapa enviaria o
 * formulário.
 *
 * O `<span class="nds-sr-only">` nasce vazio e é preenchido por
 * `setStepperValue`. Ele existe desde a criação para que a resolução não
 * precise inserir nó no meio do conteúdo que o consumidor montou.
 */
export function createStepperTrigger(options: StepperTriggerOptions = {}): HTMLButtonElement {
  const className = options.class ?? options.className;

  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.slot = 'stepper-trigger';
  button.className = cn('nds-stepper-trigger', className);

  const stateLabel = document.createElement('span');
  stateLabel.dataset.slot = 'stepper-state-label';
  stateLabel.className = 'nds-sr-only';
  button.appendChild(stateLabel);

  return button;
}

/**
 * Círculo numerado.
 *
 * `aria-hidden` porque o número repete a posição que a `<ol>` já anuncia.
 */
export function createStepperIndicator(options: StepperIndicatorOptions = {}): HTMLElement {
  const { content } = options;
  const className = options.class ?? options.className;

  const span = document.createElement('span');
  span.dataset.slot = 'stepper-indicator';
  span.setAttribute('aria-hidden', 'true');
  span.className = cn('nds-stepper-indicator', className);

  if (content !== undefined) {
    span.dataset.custom = '';
    if (typeof content === 'string') span.textContent = content;
    else span.appendChild(content);
  }

  return span;
}

export function createStepperTitle(options: StepperTextOptions = {}): HTMLElement {
  const { text = '' } = options;
  const className = options.class ?? options.className;

  const span = document.createElement('span');
  span.dataset.slot = 'stepper-title';
  span.className = cn('nds-stepper-title', className);
  if (text) span.textContent = text;

  return span;
}

export function createStepperDescription(options: StepperTextOptions = {}): HTMLElement {
  const { text = '' } = options;
  const className = options.class ?? options.className;

  const span = document.createElement('span');
  span.dataset.slot = 'stepper-description';
  span.className = cn('nds-stepper-description', className);
  if (text) span.textContent = text;

  return span;
}

/**
 * Traço até a próxima etapa.
 *
 * Mora DENTRO do item, depois do gatilho, como a folha documenta — e não entre
 * os itens. É isso que faz `.nds-stepper-item[data-state="completed"]
 * .nds-stepper-separator` alcançá-lo sem regra extra.
 */
export function createStepperSeparator(options: StepperSeparatorOptions = {}): HTMLElement {
  const className = options.class ?? options.className;

  const div = document.createElement('div');
  div.dataset.slot = 'stepper-separator';
  div.setAttribute('aria-hidden', 'true');
  div.className = cn('nds-stepper-separator', className);

  return div;
}

/** Valor atual do fluxo, ou 1 quando ainda não foi resolvido. */
export function getStepperValue(root: HTMLElement): number {
  const value = Number(root.dataset.value);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/**
 * Aplica o valor atual do fluxo e RESOLVE o estado de cada etapa.
 *
 * DIVERGÊNCIA DE API declarada, não defeito: as outras quatro stacks derivam o
 * estado por reatividade, e aqui não há contexto para isso. A resolução é uma
 * chamada explícita, feita depois de montar a árvore. É o preço de não ter
 * runtime, e é o mesmo desenho de duas fases que as outras fábricas desta
 * stack usam quando o estado depende dos filhos.
 *
 * Nada aqui lê estilo computado nem força layout: é escrita de atributo e de
 * texto, e por isso é seguro chamar de dentro de uma play function.
 */
export function setStepperValue(root: HTMLElement, value: number): void {
  root.dataset.value = String(value);

  const labels: StepperLabels = {
    completed: root.dataset.labelCompleted,
    current: root.dataset.labelCurrent,
  };

  const items = root.querySelectorAll<HTMLElement>('[data-slot="stepper-item"]');
  for (const item of items) {
    const step = Number(item.dataset.step);
    const forcedCompleted = item.hasAttribute('data-completed');
    const state: StepperState = forcedCompleted || step < value
      ? 'completed'
      : step === value
        ? 'active'
        : 'inactive';

    item.dataset.state = state;

    const trigger = item.querySelector<HTMLButtonElement>('[data-slot="stepper-trigger"]');
    if (trigger) {
      // Só a etapa atual carrega `aria-current`. Deixar o atributo para trás ao
      // avançar daria DOIS "atual" na mesma lista, que é pior do que nenhum.
      if (state === 'active') trigger.setAttribute('aria-current', 'step');
      else trigger.removeAttribute('aria-current');

      trigger.disabled = item.hasAttribute('data-disabled');

      const stateLabel = trigger.querySelector<HTMLElement>('[data-slot="stepper-state-label"]');
      if (stateLabel) {
        const word = state === 'completed' ? labels.completed : state === 'active' ? labels.current : undefined;
        stateLabel.textContent = word ?? '';
      }
    }

    const indicator = item.querySelector<HTMLElement>('[data-slot="stepper-indicator"]');
    if (indicator && !indicator.hasAttribute('data-custom')) {
      if (state === 'completed') {
        indicator.replaceChildren(createIconLucide(Check as unknown as LucideIconNode[]));
      } else {
        indicator.replaceChildren(document.createTextNode(String(step)));
      }
    }
  }
}
