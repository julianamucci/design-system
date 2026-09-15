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

function alertParts(o: AlertSnippetOptions): AlertParts {
  const variant = o.variant ?? 'default';
  const title = o.title ?? TITLE_DEFAULT;
  const description = o.description ?? DESCRIPTION_DEFAULT;
  const icon = o.icon === undefined ? variantIcon(variant) : o.icon;

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
    creation: `const alerta = ${lines.length ? callLine('createAlert', lines) : 'createAlert()'};`,
    body: [
      icon ? `alerta.appendChild(createAlertIcon(${text(icon)}));` : '',
      title ? `alerta.appendChild(createAlertTitle({ text: ${text(title)} }));` : '',
      description
        ? `alerta.appendChild(createAlertDescription({ text: ${text(description)} }));`
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

// ─── Com botão de ação ───────────────────────────────────────────────────────

export type AlertWithActionSnippetOptions = AlertSnippetOptions & {
  /** Rótulo do botão que entra no slot de ação. */
  action?: string;
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
    `const action = createAlertAction();
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
 * Sem contêiner `aria-live` em volta: a raiz do alerta já é a região viva, e
 * envolvê-la aninharia duas regiões anunciando a mesma mensagem.
 */
export function alertDynamicInsertionSnippet(o: AlertSnippetOptions = {}): string {
  const { names, creation, body } = alertParts(o);
  const indented = [creation, ...body].join('\n').replace(/^/gm, '  ');

  return snippet(
    importing('alert', ...names),
    `// Em tempo de execução — quando a operação termina, por exemplo. O alerta
// surge com role="alert" na própria raiz, e é isso que dispara o anúncio.
function showResult(container: HTMLElement): void {
${indented}
  container.appendChild(alerta);
}`,
  );
}

export function alertDynamicInsertionSourceWith(
  fixed: AlertSnippetOptions,
): SourceTransform<AlertSnippetOptions> {
  return (_generated, ctx) => alertDynamicInsertionSnippet({ ...ctx.args, ...fixed });
}
