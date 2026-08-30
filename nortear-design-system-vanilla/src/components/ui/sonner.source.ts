// Snippet do painel Code do Sonner — ver `@/lib/story-source`.
//
// A superfície pública desta stack é `@/components/ui/sonner`: a região
// (`createSonnerToaster`) e a fila (`toast`). Não existe componente de
// notificação para montar por item — o que se copia é a chamada da fila.

import {
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { ToastPosition, ToastType } from './sonner';

/** As chaves são as MESMAS dos args da story, para `{ ...ctx.args }` entrar direto. */
export type SonnerSnippetOptions = {
  type?: ToastType;
  title?: string;
  description?: string;
  /** Vazio remove o botão de ação. */
  actionLabel?: string;
  position?: ToastPosition;
  richColors?: boolean;
  closeButton?: boolean;
  duration?: number;
  /**
   * Prazo infinito — reservado a falha crítica que exige decisão, e sempre com
   * botão de fechar: uma notificação que não sai sozinha e não pode ser fechada
   * vira obstáculo.
   */
  persistente?: boolean;
};

/** Padrão do design system, e o que a região assume quando ninguém diz outro. */
const DEFAULT_DURATION = 4000;

const DEFAULT_TITLE: Record<ToastType, string> = {
  default: 'Código copiado.',
  success: 'Alterações salvas.',
  error: 'Não foi possível salvar. Tente novamente.',
  warning: 'Sua sessão expira em 5 minutos.',
  info: 'Nova versão disponível.',
  loading: 'Enviando arquivo...',
};

/**
 * A região. Vai UMA VEZ, no root da aplicação.
 *
 * Só o que difere do padrão entra: o canto é `bottom-right`, as cores
 * semânticas vêm desligadas e o prazo é de 4000ms.
 */
function regionBlock(o: SonnerSnippetOptions): string {
  const lines = options([
    ['position', o.position && o.position !== 'bottom-right' ? text(o.position) : undefined],
    ['richColors', o.richColors ? 'true' : undefined],
    ['closeButton', o.closeButton && !o.persistente ? 'true' : undefined],
    [
      'duration',
      o.duration !== undefined && o.duration !== DEFAULT_DURATION ? String(o.duration) : undefined,
    ],
  ]);

  const body =
    lines.length === 0
      ? 'createSonnerToaster()'
      : `createSonnerToaster({ ${lines.map((l) => l.replace(/,$/, '')).join(', ')} })`;

  return body.length <= 78
    ? `const regiao = ${body};\n${appendLine('regiao')}`
    : `const regiao = createSonnerToaster({\n${lines.map((l) => `  ${l}`).join('\n')}\n});\n${appendLine('regiao')}`;
}

/** `toast('…')` / `toast.success('…', { … })`, quebrando quando não couber. */
function queueCall(type: ToastType, mensagem: string, lines: string[]): string {
  const queue = type === 'default' ? 'toast' : `toast.${type}`;
  if (lines.length === 0) return `${queue}(${text(mensagem)});`;

  const singleLine = `${queue}(${text(mensagem)}, { ${lines
    .map((l) => l.replace(/,$/, ''))
    .join(', ')} });`;
  if (singleLine.length <= 78 && !singleLine.includes('\n')) return singleLine;

  return `${queue}(${text(mensagem)}, {\n${lines.map((l) => `  ${l}`).join('\n')}\n});`;
}

function notificationOptions(o: SonnerSnippetOptions): string[] {
  return options([
    ['description', o.description ? text(o.description) : undefined],
    [
      'action',
      o.actionLabel
        ? `{ label: ${text(o.actionLabel)}, onClick: () => desfazer() }`
        : undefined,
    ],
    ['duration', o.persistente ? 'Number.POSITIVE_INFINITY' : undefined],
    ['closeButton', o.persistente ? 'true' : undefined],
  ]);
}

/** A região montada uma vez, mais a chamada da fila que a story dispara. */
export function sonnerSnippet(o: SonnerSnippetOptions = {}): string {
  const type = o.type ?? 'success';

  return snippet(
    importing('sonner', 'createSonnerToaster', 'toast'),
    regionBlock(o),
    queueCall(type, o.title || DEFAULT_TITLE[type], notificationOptions(o)),
  );
}

/**
 * Sem região montada.
 *
 * `toast()` funciona assim mesmo: a fila cria a região dela sob demanda. É o
 * contrato desta stack, e o que permite chamá-lo de um `catch` numa tela que
 * ainda não montou nada.
 */
export function sonnerNoRegionSnippet(o: SonnerSnippetOptions = {}): string {
  const type = o.type ?? 'success';

  return snippet(
    importing('sonner', 'toast'),
    queueCall(type, o.title || DEFAULT_TITLE[type], notificationOptions(o)),
  );
}

/** Uma pilha: várias notificações vivas ao mesmo tempo, uma por chamada. */
export function sonnerStackSnippet(
  items: Array<{ type?: ToastType; title?: string }>,
  o: SonnerSnippetOptions = {},
): string {
  const calls = items.map((item) => {
    const type = item.type ?? 'default';
    return queueCall(type, item.title || DEFAULT_TITLE[type], []);
  });

  return snippet(
    importing('sonner', 'createSonnerToaster', 'toast'),
    regionBlock(o),
    calls.join('\n'),
  );
}

/**
 * Uma notificação para a operação inteira: nasce em carregamento e VIRA êxito
 * ou falha no mesmo nó, sem piscar duas caixas.
 *
 * Não devolve nada e não repropaga a rejeição — quem chamou já tem a promessa
 * original para tratar o erro.
 */
export function sonnerPromiseSnippet(o: SonnerSnippetOptions = {}): string {
  return snippet(
    importing('sonner', 'createSonnerToaster', 'toast'),
    regionBlock(o),
    `toast.promise(enviarArquivo(), {
  loading: 'Enviando arquivo...',
  success: 'Arquivo enviado com sucesso.',
  error: 'Erro ao enviar. Tente novamente.',
});`,
  );
}

/** Transform de story para a pilha de notificações. */
export function sonnerSourceStack(
  items: Array<{ type?: ToastType; title?: string }>,
  o: SonnerSnippetOptions = {},
): SourceTransform<SonnerSnippetOptions> {
  return () => sonnerStackSnippet(items, o);
}

/** Transform de story para o ciclo de uma promessa. */
export function sonnerSourcePromise(
  o: SonnerSnippetOptions = {},
): SourceTransform<SonnerSnippetOptions> {
  return () => sonnerPromiseSnippet(o);
}

/** Transform de story para o caso sem região montada. */
export function sonnerSourceNoRegion(
  o: SonnerSnippetOptions = {},
): SourceTransform<SonnerSnippetOptions> {
  return () => sonnerNoRegionSnippet(o);
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const sonnerSource: SourceTransform<SonnerSnippetOptions> = (_gerado, ctx) =>
  sonnerSnippet(ctx.args ?? {});

/** Transform de story: mesma API, opções fixas que os controls não cobrem. */
export function sonnerSourceWith(fixas: SonnerSnippetOptions): SourceTransform<SonnerSnippetOptions> {
  return (_gerado, ctx) => sonnerSnippet({ ...ctx.args, ...fixas });
}
