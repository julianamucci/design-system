// Snippet do painel Code do Alert — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
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

const TITULO_PADRAO = 'Atenção';
const DESCRICAO_PADRAO = 'Suas alterações serão aplicadas na próxima sessão.';

/**
 * O ícone que acompanha cada variante. `default` não tem cor semântica, então
 * recebe o informativo; `destructive` é a única cujo nome de variante e nome de
 * ícone não coincidem.
 */
function iconePorVariante(variant: AlertVariant): AlertIconType {
  if (variant === 'destructive') return 'error';
  if (variant === 'default') return 'info';
  return variant;
}

type PartesDoAlerta = {
  /** Nomes importados de `@/components/ui/alert` para esta composição. */
  nomes: string[];
  criacao: string;
  corpo: string[];
};

function partesDoAlerta(o: AlertSnippetOptions): PartesDoAlerta {
  const variant = o.variant ?? 'default';
  const title = o.title ?? TITULO_PADRAO;
  const description = o.description ?? DESCRICAO_PADRAO;
  const icone = o.icon === undefined ? iconePorVariante(variant) : o.icon;

  const linhas = opcoes([
    ['variant', variant !== 'default' ? texto(variant) : undefined],
    // `alert` é o padrão da fábrica: só a semântica diferente entra.
    ['role', o.role && o.role !== 'alert' ? texto(o.role) : undefined],
    ['className', o.className ? texto(o.className) : undefined],
    ['dismissible', o.dismissible ? 'true' : undefined],
    ['dismissLabel', o.dismissible && o.dismissLabel ? texto(o.dismissLabel) : undefined],
    // A story passa uma FUNÇÃO nos args; só um corpo escrito como texto vira
    // snippet. Sem esta guarda o painel imprimiria o espião da story.
    ['onDismiss', o.dismissible && typeof o.onDismiss === 'string' ? o.onDismiss : undefined],
  ]);

  const nomes = ['createAlert'];
  if (icone) nomes.push('createAlertIcon');
  if (title) nomes.push('createAlertTitle');
  if (description) nomes.push('createAlertDescription');

  return {
    nomes,
    // Sem nenhuma opção a chamada é `createAlert()`: a fábrica tem parâmetro
    // com valor padrão, e um `{}` vazio seria ruído.
    criacao: `const alerta = ${linhas.length ? chamada('createAlert', linhas) : 'createAlert()'};`,
    corpo: [
      icone ? `alerta.appendChild(createAlertIcon(${texto(icone)}));` : '',
      title ? `alerta.appendChild(createAlertTitle({ text: ${texto(title)} }));` : '',
      description
        ? `alerta.appendChild(createAlertDescription({ text: ${texto(description)} }));`
        : '',
    ].filter(Boolean),
  };
}

/** A chamada real de `createAlert` e a composição que a story monta em cima. */
export function alertSnippet(o: AlertSnippetOptions = {}): string {
  const { nomes, criacao, corpo } = partesDoAlerta(o);
  return snippet(importar('alert', ...nomes), [criacao, ...corpo].join('\n'), montar('alerta'));
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica.
 */
export const alertSource: SourceTransform<AlertSnippetOptions> = (_gerado, ctx) =>
  alertSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function alertSourceCom(fixas: AlertSnippetOptions): SourceTransform<AlertSnippetOptions> {
  return (_gerado, ctx) => alertSnippet({ ...ctx.args, ...fixas });
}

// ─── Com botão de ação ───────────────────────────────────────────────────────

export type AlertComAcaoSnippetOptions = AlertSnippetOptions & {
  /** Rótulo do botão que entra no slot de ação. */
  acao?: string;
};

/**
 * FORMA diferente: o slot de ação é uma sub-fábrica (`createAlertAction`) que
 * nasce vazia — quem consome injeta o botão. Espremer isso numa opção do
 * snippet padrão esconderia justamente a peça que a story documenta.
 */
export function alertComAcaoSnippet(o: AlertComAcaoSnippetOptions = {}): string {
  const acao = o.acao ?? 'Atualizar';
  const { nomes, criacao, corpo } = partesDoAlerta(o);

  return snippet(
    [importar('alert', ...nomes, 'createAlertAction'), importar('button', 'createButton')].join(
      '\n',
    ),
    [criacao, ...corpo].join('\n'),
    `const acao = createAlertAction();
acao.appendChild(createButton({ label: ${texto(acao)}, variant: 'outline', size: 'sm' }));
alerta.appendChild(acao);`,
    montar('alerta'),
  );
}

export function alertComAcaoSourceCom(
  fixas: AlertComAcaoSnippetOptions,
): SourceTransform<AlertComAcaoSnippetOptions> {
  return (_gerado, ctx) => alertComAcaoSnippet({ ...ctx.args, ...fixas });
}

// ─── Inserido em tempo de execução ───────────────────────────────────────────

/**
 * FORMA diferente: aqui o assunto não é o alerta, é ONDE ele entra. `role="alert"`
 * só interrompe o leitor de tela quando a mensagem SURGE — o alerta que já está
 * na página ao carregar é anunciado na ordem do documento e nada mais.
 */
export function alertEmRegiaoVivaSnippet(o: AlertSnippetOptions = {}): string {
  const { nomes, criacao, corpo } = partesDoAlerta(o);

  return snippet(
    importar('alert', ...nomes),
    `const regiao = document.createElement('div');
regiao.setAttribute('aria-live', 'polite');
document.querySelector('#app')?.append(regiao);`,
    '// Em tempo de execução: o alerta entra na região e o anúncio acontece.',
    [criacao, ...corpo, 'regiao.appendChild(alerta);'].join('\n'),
  );
}

export function alertEmRegiaoVivaSourceCom(
  fixas: AlertSnippetOptions,
): SourceTransform<AlertSnippetOptions> {
  return (_gerado, ctx) => alertEmRegiaoVivaSnippet({ ...ctx.args, ...fixas });
}
