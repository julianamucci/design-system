// Snippet do painel Code do Sonner — ver `@/lib/story-source`.
//
// A superfície pública desta stack é `@/components/ui/sonner`: a região
// (`createSonnerToaster`) e a fila (`toast`). Não existe componente de
// notificação para montar por item — o que se copia é a chamada da fila.

import {
  importar,
  montar,
  opcoes,
  snippet,
  texto,
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
const DURACAO_PADRAO = 4000;

const TITULO_PADRAO: Record<ToastType, string> = {
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
function blocoDaRegiao(o: SonnerSnippetOptions): string {
  const linhas = opcoes([
    ['position', o.position && o.position !== 'bottom-right' ? texto(o.position) : undefined],
    ['richColors', o.richColors ? 'true' : undefined],
    ['closeButton', o.closeButton && !o.persistente ? 'true' : undefined],
    [
      'duration',
      o.duration !== undefined && o.duration !== DURACAO_PADRAO ? String(o.duration) : undefined,
    ],
  ]);

  const corpo =
    linhas.length === 0
      ? 'createSonnerToaster()'
      : `createSonnerToaster({ ${linhas.map((l) => l.replace(/,$/, '')).join(', ')} })`;

  return corpo.length <= 78
    ? `const regiao = ${corpo};\n${montar('regiao')}`
    : `const regiao = createSonnerToaster({\n${linhas.map((l) => `  ${l}`).join('\n')}\n});\n${montar('regiao')}`;
}

/** `toast('…')` / `toast.success('…', { … })`, quebrando quando não couber. */
function chamadaDaFila(tipo: ToastType, mensagem: string, linhas: string[]): string {
  const fila = tipo === 'default' ? 'toast' : `toast.${tipo}`;
  if (linhas.length === 0) return `${fila}(${texto(mensagem)});`;

  const umaLinha = `${fila}(${texto(mensagem)}, { ${linhas
    .map((l) => l.replace(/,$/, ''))
    .join(', ')} });`;
  if (umaLinha.length <= 78 && !umaLinha.includes('\n')) return umaLinha;

  return `${fila}(${texto(mensagem)}, {\n${linhas.map((l) => `  ${l}`).join('\n')}\n});`;
}

function opcoesDaNotificacao(o: SonnerSnippetOptions): string[] {
  return opcoes([
    ['description', o.description ? texto(o.description) : undefined],
    [
      'action',
      o.actionLabel
        ? `{ label: ${texto(o.actionLabel)}, onClick: () => desfazer() }`
        : undefined,
    ],
    ['duration', o.persistente ? 'Number.POSITIVE_INFINITY' : undefined],
    ['closeButton', o.persistente ? 'true' : undefined],
  ]);
}

/** A região montada uma vez, mais a chamada da fila que a story dispara. */
export function sonnerSnippet(o: SonnerSnippetOptions = {}): string {
  const tipo = o.type ?? 'success';

  return snippet(
    importar('sonner', 'createSonnerToaster', 'toast'),
    blocoDaRegiao(o),
    chamadaDaFila(tipo, o.title || TITULO_PADRAO[tipo], opcoesDaNotificacao(o)),
  );
}

/**
 * Sem região montada.
 *
 * `toast()` funciona assim mesmo: a fila cria a região dela sob demanda. É o
 * contrato desta stack, e o que permite chamá-lo de um `catch` numa tela que
 * ainda não montou nada.
 */
export function sonnerSemRegiaoSnippet(o: SonnerSnippetOptions = {}): string {
  const tipo = o.type ?? 'success';

  return snippet(
    importar('sonner', 'toast'),
    chamadaDaFila(tipo, o.title || TITULO_PADRAO[tipo], opcoesDaNotificacao(o)),
  );
}

/** Uma pilha: várias notificações vivas ao mesmo tempo, uma por chamada. */
export function sonnerPilhaSnippet(
  itens: Array<{ type?: ToastType; title?: string }>,
  o: SonnerSnippetOptions = {},
): string {
  const chamadas = itens.map((item) => {
    const tipo = item.type ?? 'default';
    return chamadaDaFila(tipo, item.title || TITULO_PADRAO[tipo], []);
  });

  return snippet(
    importar('sonner', 'createSonnerToaster', 'toast'),
    blocoDaRegiao(o),
    chamadas.join('\n'),
  );
}

/**
 * Uma notificação para a operação inteira: nasce em carregamento e VIRA êxito
 * ou falha no mesmo nó, sem piscar duas caixas.
 *
 * Não devolve nada e não repropaga a rejeição — quem chamou já tem a promessa
 * original para tratar o erro.
 */
export function sonnerPromessaSnippet(o: SonnerSnippetOptions = {}): string {
  return snippet(
    importar('sonner', 'createSonnerToaster', 'toast'),
    blocoDaRegiao(o),
    `toast.promise(enviarArquivo(), {
  loading: 'Enviando arquivo...',
  success: 'Arquivo enviado com sucesso.',
  error: 'Erro ao enviar. Tente novamente.',
});`,
  );
}

/** Transform de story para a pilha de notificações. */
export function sonnerSourcePilha(
  itens: Array<{ type?: ToastType; title?: string }>,
  o: SonnerSnippetOptions = {},
): SourceTransform<SonnerSnippetOptions> {
  return () => sonnerPilhaSnippet(itens, o);
}

/** Transform de story para o ciclo de uma promessa. */
export function sonnerSourcePromessa(
  o: SonnerSnippetOptions = {},
): SourceTransform<SonnerSnippetOptions> {
  return () => sonnerPromessaSnippet(o);
}

/** Transform de story para o caso sem região montada. */
export function sonnerSourceSemRegiao(
  o: SonnerSnippetOptions = {},
): SourceTransform<SonnerSnippetOptions> {
  return () => sonnerSemRegiaoSnippet(o);
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const sonnerSource: SourceTransform<SonnerSnippetOptions> = (_gerado, ctx) =>
  sonnerSnippet(ctx.args ?? {});

/** Transform de story: mesma API, opções fixas que os controls não cobrem. */
export function sonnerSourceCom(fixas: SonnerSnippetOptions): SourceTransform<SonnerSnippetOptions> {
  return (_gerado, ctx) => sonnerSnippet({ ...ctx.args, ...fixas });
}
