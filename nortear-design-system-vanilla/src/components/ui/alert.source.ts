// Snippet do painel Code do Alert — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { AlertIconType, AlertRole, AlertVariant } from './alert';

export type AlertSnippetOptions = {
  variant?: AlertVariant;
  role?: AlertRole;
  /**
   * Ícone da composição. Omitido, acompanha a variante; `false` mostra o alerta
   * sem ícone, que é uma composição documentada.
   */
  icon?: AlertIconType | false;
  /** Título — string vazia mostra a composição sem título. */
  title?: string;
  description?: string;
  dismissible?: boolean;
  dismissLabel?: string;
  /**
   * Corpo do callback de fechamento. É `string` porque o que entra no snippet é
   * CÓDIGO — a story passa uma função de verdade nos args.
   */
  onDismiss?: string;
  className?: string;
  /**
   * Classe do consumidor nas SUB-FÁBRICAS de título e descrição, separada da
   * `className` da raiz de propósito: a story de classe adicional prova que a
   * classe SOMA em cada peça, e um campo só mostraria metade da composição.
   */
  partClassName?: string;
};

const TITLE_DEFAULT = 'Atenção';
const DESCRIPTION_DEFAULT = 'Suas alterações serão aplicadas na próxima sessão.';

/**
 * O ícone que acompanha cada variante. `default` não tem cor semântica, então
 * recebe o informativo; `destructive` é a única cujo nome de variante e nome de
 * ícone não coincidem.
 */
function variantIcon(variant: AlertVariant): AlertIconType {
  if (variant === 'destructive') return 'error';
  if (variant === 'default') return 'info';
  return variant;
}

type AlertParts = {
  /** Nomes importados de `@/components/ui/alert` para esta composição. */
  names: string[];
  creation: string;
  body: string[];
};

function alertParts(o: AlertSnippetOptions, variable = 'alerta'): AlertParts {
  const variant = o.variant ?? 'default';
  const title = o.title ?? TITLE_DEFAULT;
  const description = o.description ?? DESCRIPTION_DEFAULT;
  const icon = o.icon === undefined ? variantIcon(variant) : o.icon;
  // A classe da peça entra na MESMA chamada que o texto — é assim que o leitor
  // vê que ela soma à do design system em cada sub-fábrica, não só na raiz.
  const part = o.partClassName ? `, className: ${text(o.partClassName)}` : '';

  const lines = options([
    ['variant', variant !== 'default' ? text(variant) : undefined],
    // `alert` é o padrão da fábrica: só a semântica diferente entra.
    ['role', o.role && o.role !== 'alert' ? text(o.role) : undefined],
    ['className', o.className ? text(o.className) : undefined],
    ['dismissible', o.dismissible ? 'true' : undefined],
    ['dismissLabel', o.dismissible && o.dismissLabel ? text(o.dismissLabel) : undefined],
    // A story passa uma FUNÇÃO nos args; só um corpo escrito como texto vira
    // snippet. Sem esta guarda o painel imprimiria o espião da story.
    ['onDismiss', o.dismissible && typeof o.onDismiss === 'string' ? o.onDismiss : undefined],
  ]);

  const names = ['createAlert'];
  if (icon) names.push('createAlertIcon');
  if (title) names.push('createAlertTitle');
  if (description) names.push('createAlertDescription');

  return {
    names,
    // Sem nenhuma opção a chamada é `createAlert()`: a fábrica tem parâmetro
    // com valor padrão, e um `{}` vazio seria ruído.
    creation: `const ${variable} = ${lines.length ? callLine('createAlert', lines) : 'createAlert()'};`,
    body: [
      icon ? `${variable}.appendChild(createAlertIcon(${text(icon)}));` : '',
      // O nível do heading entra SEMPRE que há título: o painel Code ensina o
      // nível em vez de deixar o leitor herdar o default da fábrica sem saber.
      // É o mesmo `as` que as stories renderizam — as duas pontas se movem juntas.
      title
        ? `${variable}.appendChild(createAlertTitle({ text: ${text(title)}, as: 'h4'${part} }));`
        : '',
      description
        ? `${variable}.appendChild(createAlertDescription({ text: ${text(description)}${part} }));`
        : '',
    ].filter(Boolean),
  };
}

/** A chamada real de `createAlert` e a composição que a story monta em cima. */
export function alertSnippet(o: AlertSnippetOptions = {}): string {
  const { names, creation, body } = alertParts(o);
  return snippet(importing('alert', ...names), [creation, ...body].join('\n'), appendLine('alerta'));
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica.
 */
export const alertSource: SourceTransform<AlertSnippetOptions> = (_generated, ctx) =>
  alertSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function alertSourceWith(fixed: AlertSnippetOptions): SourceTransform<AlertSnippetOptions> {
  return (_generated, ctx) => alertSnippet({ ...ctx.args, ...fixed });
}

// ─── Composições de mais de UM alerta ────────────────────────────────────────
//
// O construtor genérico sabe montar UM alerta. Duas stories mostram vários, e
// nelas a comparação entre eles É o assunto — então elas têm forma própria, em
// vez de uma opção que o `alertSnippet` não teria como expressar.

/**
 * As cinco variantes empilhadas, que é o que a story `Contrast` renderiza.
 *
 * Sem ícone de propósito: o que se mede aqui é título e texto corrido sobre o
 * fundo que cada variante pinta, e um alerta sozinho esconderia a comparação.
 */
export function alertContrastSource(): string {
  return snippet(
    [
      importing('alert', 'createAlert', 'createAlertTitle', 'createAlertDescription'),
      `import type { AlertVariant } from '@/components/ui/alert';`,
    ].join('\n'),
    `const variants: AlertVariant[] = ['default', 'destructive', 'success', 'warning', 'info'];

const stack = document.createElement('div');
stack.className = 'nds-stack';
stack.dataset.spacing = 'sm';

for (const variant of variants) {
  const alerta = createAlert({ variant });
  alerta.append(
    createAlertTitle({ text: \`Título \${variant}\`, as: 'h4' }),
    createAlertDescription({ text: \`Texto corrido da variante \${variant}.\` }),
  );
  stack.appendChild(alerta);
}`,
    appendLine('stack'),
  );
}

/**
 * A nota estática ao lado da mensagem que interrompe — o par que a story
 * `WithoutAnnouncement` renderiza.
 *
 * `role: 'note'` NÃO é live region, e é o valor certo para conteúdo já presente
 * no carregamento. O segundo alerta não escreve papel nenhum: é ele que mostra
 * que o default `alert` continua assertivo, e a escolha é de conteúdo.
 */
export function alertNoAnnouncementSource(): string {
  const note = alertParts(
    {
      role: 'note',
      title: 'Nota de implementação',
      description: 'Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.',
    },
    'noteAlert',
  );
  const urgent = alertParts(
    {
      variant: 'destructive',
      title: 'Falha no envio',
      description: 'Mensagem urgente surgida em tempo de execução: anúncio imediato.',
    },
    'defaultAlert',
  );

  return snippet(
    importing('alert', ...new Set([...note.names, ...urgent.names])),
    `const stack = document.createElement('div');
stack.className = 'nds-stack';
stack.dataset.spacing = 'md';

// Estático, já na tela quando a página carrega: não pode ser live region.
${[note.creation, ...note.body].join('\n')}

// Sem opção de papel, a fábrica mantém o default 'alert', que interrompe.
${[urgent.creation, ...urgent.body].join('\n')}

stack.append(noteAlert, defaultAlert);`,
    appendLine('stack'),
  );
}

// ─── Com botão de ação ───────────────────────────────────────────────────────

export type AlertWithActionSnippetOptions = AlertSnippetOptions & {
  /** Rótulo do botão que entra no slot de ação. */
  action?: string;
  /** Classe do consumidor no slot de ação — irmã de `partClassName`. */
  actionClassName?: string;
};

/**
 * FORMA diferente: o slot de ação é uma sub-fábrica (`createAlertAction`) que
 * nasce vazia — quem consome injeta o botão. Espremer isso numa opção do
 * snippet padrão esconderia justamente a peça que a story documenta.
 *
 * Com `dismissible` a mesma forma mostra ação e botão de fechar juntos: a ação é
 * a coluna do grid com a largura do botão e o X fica no canto, na margem interna
 * reservada a ele — nada muda na chamada além da opção.
 */
export function alertWithActionSnippet(o: AlertWithActionSnippetOptions = {}): string {
  const action = o.action ?? 'Atualizar';
  const { names, creation, body } = alertParts(o);

  return snippet(
    [importing('alert', ...names, 'createAlertAction'), importing('button', 'createButton')].join(
      '\n',
    ),
    [creation, ...body].join('\n'),
    `const action = createAlertAction(${
      o.actionClassName ? `{ className: ${text(o.actionClassName)} }` : ''
    });
action.appendChild(createButton({ label: ${text(action)}, variant: 'default', size: 'sm' }));
alerta.appendChild(action);`,
    appendLine('alerta'),
  );
}

export function alertWithActionSourceWith(
  fixed: AlertWithActionSnippetOptions,
): SourceTransform<AlertWithActionSnippetOptions> {
  return (_generated, ctx) => alertWithActionSnippet({ ...ctx.args, ...fixed });
}

// ─── Inserido em tempo de execução ───────────────────────────────────────────

/**
 * FORMA diferente: aqui o assunto não é o alerta, é QUANDO ele entra. `role="alert"`
 * só interrompe o leitor de tela quando a mensagem SURGE — o alerta que já está
 * na página ao carregar é anunciado na ordem do documento e nada mais.
 *
 * O GATILHO faz parte do exemplo, e não é enfeite: é ele que marca o instante da
 * inserção. Sem ele o painel publicaria uma função que ninguém chama, e a story
 * mostra o botão. A linha própria dele impede o `nds-stack` de esticá-lo na
 * largura toda.
 *
 * Sem contêiner `aria-live` em volta: a raiz do alerta já é a região viva, e
 * envolvê-la aninharia duas regiões anunciando a mesma mensagem.
 */
export function alertDynamicInsertionSnippet(o: AlertSnippetOptions = {}): string {
  const { names, creation, body } = alertParts(o);
  const indented = [creation, ...body].join('\n').replace(/^/gm, '  ');

  return snippet(
    [importing('alert', ...names), importing('button', 'createButton')].join('\n'),
    `const stack = document.createElement('div');
stack.className = 'nds-stack';
stack.dataset.spacing = 'sm';

// Em tempo de execução — quando a operação termina, por exemplo. O alerta
// surge com role="alert" na própria raiz, e é isso que dispara o anúncio.
function showResult(): void {
  // Um alerta por vez: acionar de novo substitui, em vez de empilhar.
  stack.querySelector('[data-slot="alert"]')?.remove();
${indented}
  stack.appendChild(alerta);
}

const triggerRow = document.createElement('div');
triggerRow.appendChild(
  createButton({ label: 'Gerar relatório', variant: 'default', size: 'sm', onClick: showResult }),
);
stack.appendChild(triggerRow);`,
    appendLine('stack'),
  );
}

export function alertDynamicInsertionSourceWith(
  fixed: AlertSnippetOptions,
): SourceTransform<AlertSnippetOptions> {
  return (_generated, ctx) => alertDynamicInsertionSnippet({ ...ctx.args, ...fixed });
}
