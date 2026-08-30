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

type PartesDoAlerta = {
  /** Nomes importados de `@/components/ui/alert` para esta composição. */
  names: string[];
  criacao: string;
  body: string[];
};

function partesDoAlerta(o: AlertSnippetOptions): PartesDoAlerta {
  const variant = o.variant ?? 'default';
  const title = o.title ?? TITLE_DEFAULT;
  const description = o.description ?? DESCRIPTION_DEFAULT;
  const icone = o.icon === undefined ? variantIcon(variant) : o.icon;

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
  if (icone) names.push('createAlertIcon');
  if (title) names.push('createAlertTitle');
  if (description) names.push('createAlertDescription');

  return {
    names,
    // Sem nenhuma opção a chamada é `createAlert()`: a fábrica tem parâmetro
    // com valor padrão, e um `{}` vazio seria ruído.
    criacao: `const alerta = ${lines.length ? callLine('createAlert', lines) : 'createAlert()'};`,
    body: [
      icone ? `alerta.appendChild(createAlertIcon(${text(icone)}));` : '',
      title ? `alerta.appendChild(createAlertTitle({ text: ${text(title)} }));` : '',
      description
        ? `alerta.appendChild(createAlertDescription({ text: ${text(description)} }));`
        : '',
    ].filter(Boolean),
  };
}

/** A chamada real de `createAlert` e a composição que a story monta em cima. */
export function alertSnippet(o: AlertSnippetOptions = {}): string {
  const { names, criacao, body } = partesDoAlerta(o);
  return snippet(importing('alert', ...names), [criacao, ...body].join('\n'), appendLine('alerta'));
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica.
 */
export const alertSource: SourceTransform<AlertSnippetOptions> = (_gerado, ctx) =>
  alertSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function alertSourceWith(fixas: AlertSnippetOptions): SourceTransform<AlertSnippetOptions> {
  return (_gerado, ctx) => alertSnippet({ ...ctx.args, ...fixas });
}

// ─── Com botão de ação ───────────────────────────────────────────────────────

export type AlertWithActionSnippetOptions = AlertSnippetOptions & {
  /** Rótulo do botão que entra no slot de ação. */
  acao?: string;
};

/**
 * FORMA diferente: o slot de ação é uma sub-fábrica (`createAlertAction`) que
 * nasce vazia — quem consome injeta o botão. Espremer isso numa opção do
 * snippet padrão esconderia justamente a peça que a story documenta.
 */
export function alertWithActionSnippet(o: AlertWithActionSnippetOptions = {}): string {
  const acao = o.acao ?? 'Atualizar';
  const { names, criacao, body } = partesDoAlerta(o);

  return snippet(
    [importing('alert', ...names, 'createAlertAction'), importing('button', 'createButton')].join(
      '\n',
    ),
    [criacao, ...body].join('\n'),
    `const acao = createAlertAction();
acao.appendChild(createButton({ label: ${text(acao)}, variant: 'default', size: 'sm' }));
alerta.appendChild(acao);`,
    appendLine('alerta'),
  );
}

export function alertWithActionSourceWith(
  fixas: AlertWithActionSnippetOptions,
): SourceTransform<AlertWithActionSnippetOptions> {
  return (_gerado, ctx) => alertWithActionSnippet({ ...ctx.args, ...fixas });
}

// ─── Inserido em tempo de execução ───────────────────────────────────────────

/**
 * FORMA diferente: aqui o assunto não é o alerta, é ONDE ele entra. `role="alert"`
 * só interrompe o leitor de tela quando a mensagem SURGE — o alerta que já está
 * na página ao carregar é anunciado na ordem do documento e nada mais.
 */
export function alertEmRegiaoVivaSnippet(o: AlertSnippetOptions = {}): string {
  const { names, criacao, body } = partesDoAlerta(o);

  return snippet(
    importing('alert', ...names),
    `const regiao = document.createElement('div');
regiao.setAttribute('aria-live', 'polite');
document.querySelector('#app')?.append(regiao);`,
    '// Em tempo de execução: o alerta entra na região e o anúncio acontece.',
    [criacao, ...body, 'regiao.appendChild(alerta);'].join('\n'),
  );
}

export function regiaoVivaSourceWithAlert(
  fixas: AlertSnippetOptions,
): SourceTransform<AlertSnippetOptions> {
  return (_gerado, ctx) => alertEmRegiaoVivaSnippet({ ...ctx.args, ...fixas });
}
