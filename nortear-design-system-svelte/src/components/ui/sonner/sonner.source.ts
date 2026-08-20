/**
 * Transforms do painel Code do Sonner.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * O componente é um par: a REGIÃO (`Toaster`) montada uma vez na raiz da
 * aplicação, e a FUNÇÃO (`toast`) chamada de qualquer lugar. Todo snippet mostra
 * os dois — só a região não notifica nada, e só a função não desenha nada.
 * `toast` não passa pelo barril do design system porque não há o que embrulhar:
 * é a mesma fila global que o `Toaster` desenha.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type SonnerArgs = {
  type: 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  description: string;
  actionLabel: string;
  position:
    | 'top-right'
    | 'top-left'
    | 'top-center'
    | 'bottom-right'
    | 'bottom-left'
    | 'bottom-center';
  richColors: boolean;
  closeButton: boolean;
  duration: number;
};

const IMPORTS = `import { toast } from "svelte-sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";`;

/** A região, com o comentário que diz onde ela mora. */
function regiao(props: string): string {
  return `<!-- Uma vez, na raiz da aplicação -->
<Toaster${props} />`;
}

/** Botão de disparo + região, na ordem em que a pessoa lê. */
function quadro(script: string, rotulo: string, gatilho: string, props: string): string {
  return svelteSnippet(
    script,
    `<Button variant="outline" onclick={${gatilho}}>
  ${rotulo}
</Button>

${regiao(props)}`,
  );
}

/**
 * Forma canônica (Playground) e cascata dos arquivos de estado e composição:
 * um gatilho, uma chamada e a região com a posição escolhida pelo projeto.
 */
export function sonnerSource(_gerado?: string, ctx?: { args?: Partial<SonnerArgs> }): string {
  const {
    type = 'success',
    title = 'Alterações salvas.',
    description = '',
    actionLabel = '',
    position = 'top-right',
    richColors = true,
    closeButton = false,
    duration = 4000,
  } = ctx?.args ?? {};

  const chamada = type === 'default' ? 'toast' : `toast.${type}`;
  const props = attrs(
    `position="${position}"`,
    richColors ? 'richColors' : '',
    closeButton ? 'closeButton' : '',
    duration !== 4000 ? `duration={${duration}}` : '',
  );

  const opcoes = [
    description ? `    description: "${description}",` : '',
    actionLabel ? `    action: { label: "${actionLabel}", onClick: desfazer },` : '',
  ].filter(Boolean);

  // Chamada com opções vira função nomeada: um objeto dentro de `onclick` em
  // linha única rola para fora do painel e deixa de ser copiável.
  if (opcoes.length) {
    return quadro(
      `${IMPORTS}

function avisar() {
  ${chamada}("${title}", {
${opcoes.join('\n')}
  });
}`,
      'Disparar notificação',
      'avisar',
      props,
    );
  }

  return quadro(IMPORTS, 'Disparar notificação', `() => ${chamada}("${title}")`, props);
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

const REGIAO_PADRAO = ' position="top-right" richColors';

/** Tipo Default: confirmação neutra — sem ícone e sem cor semântica. */
export function sonnerPadraoSource(): string {
  return quadro(IMPORTS, 'Copiar código', '() => toast("Código copiado.")', REGIAO_PADRAO);
}

/** Tipo Success: a ação pedida foi concluída. */
export function sonnerSucessoSource(): string {
  return quadro(IMPORTS, 'Salvar', '() => toast.success("Alterações salvas.")', REGIAO_PADRAO);
}

/** Tipo Error: a operação falhou, e o texto diz o caminho de saída. */
export function sonnerErroSource(): string {
  return quadro(
    IMPORTS,
    'Salvar',
    '() => toast.error("Não foi possível salvar. Tente novamente.")',
    REGIAO_PADRAO,
  );
}

/** Tipo Warning: aviso não crítico, que não exige decisão imediata. */
export function sonnerAvisoSource(): string {
  return quadro(
    IMPORTS,
    'Renovar sessão',
    '() => toast.warning("Sua sessão expira em 5 minutos.")',
    REGIAO_PADRAO,
  );
}

/** Tipo Info: contexto ou novidade — nada deu certo nem errado. */
export function sonnerInfoSource(): string {
  return quadro(
    IMPORTS,
    'Procurar atualização',
    '() => toast.info("Nova versão disponível.")',
    REGIAO_PADRAO,
  );
}

/** Tipo Loading: operação em curso, sem prazo — quem a encerra é o fim dela. */
export function sonnerCarregandoSource(): string {
  return quadro(
    IMPORTS,
    'Enviar arquivo',
    '() => toast.loading("Enviando arquivo...")',
    REGIAO_PADRAO,
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Estado AutoDismiss: o prazo é da REGIÃO, e não de cada chamada — é o que
 * mantém o mesmo tempo de leitura em toda a aplicação.
 */
export function sonnerPrazoSource(): string {
  return quadro(
    IMPORTS,
    'Salvar',
    '() => toast.error("Não foi possível salvar. Tente novamente.")',
    ' position="top-right" richColors duration={4000}',
  );
}

/**
 * Estado Stacked: três notificações na fila com a pilha aberta. Sem `expand`,
 * a mensagem ainda não lida fica encoberta pela seguinte.
 */
export function sonnerEmpilhadoSource(): string {
  return quadro(
    `${IMPORTS}

function avisarTudo() {
  toast.success("Alterações salvas.");
  toast.warning("Sua sessão expira em 5 minutos.");
  toast.info("Nova versão disponível.");
}`,
    'Disparar três',
    'avisarTudo',
    ' position="top-right" richColors expand',
  );
}

/** Estado PositionBottomCenter: a posição vale para a aplicação inteira. */
export function sonnerPosicaoSource(): string {
  return quadro(
    IMPORTS,
    'Salvar',
    '() => toast.success("Alterações salvas.")',
    ' position="bottom-center" richColors',
  );
}

/**
 * Estado WithoutToaster: sem a região montada, `toast()` não desenha nada — e
 * também não quebra. A fila existe independentemente de quem a desenha.
 */
export function sonnerSemRegiaoSource(): string {
  return svelteSnippet(
    `import { toast } from "svelte-sonner";
import { Button } from "@/components/ui/button";`,
    `<!-- Nenhum Toaster montado: a chamada entra na fila e nada é desenhado -->
<Button variant="outline" onclick={() => toast.success("Alterações salvas.")}>
  Disparar notificação
</Button>`,
  );
}

/**
 * Estado DarkTheme: a região acompanha o tema do documento sozinha; `theme`
 * está aqui porque é justamente o assunto desta story.
 */
export function sonnerTemaEscuroSource(): string {
  return quadro(
    `${IMPORTS}

function avisarTudo() {
  toast("Código copiado.");
  toast.success("Alterações salvas.");
  toast.error("Não foi possível salvar. Tente novamente.");
  toast.warning("Sua sessão expira em 5 minutos.");
  toast.info("Nova versão disponível.");
}`,
    'Disparar os cinco tipos',
    'avisarTudo',
    ' position="top-right" richColors expand theme="dark"',
  );
}

// ─── Composições ──────────────────────────────────────────────────────────────

/** Composição WithDescription: título mais uma frase completa de complemento. */
export function sonnerComDescricaoSource(): string {
  return quadro(
    `${IMPORTS}

function avisar() {
  toast.success("Preferências atualizadas.", {
    description:
      "Suas configurações foram salvas e entrarão em vigor na próxima sessão.",
  });
}`,
    'Salvar preferências',
    'avisar',
    REGIAO_PADRAO,
  );
}

/**
 * Composição WithAction: a ação embutida é um `<button>` de verdade, no fluxo
 * de foco. Ela precisa existir em outro lugar também — a notificação some.
 */
export function sonnerComAcaoSource(): string {
  return quadro(
    `${IMPORTS}

function excluir() {
  toast("Item excluído.", {
    action: { label: "Desfazer", onClick: desfazer },
  });
}`,
    'Excluir item',
    'excluir',
    REGIAO_PADRAO,
  );
}

/**
 * Composições PromiseResolved e PromiseRejected: uma notificação para a
 * operação inteira. O mesmo nó vira êxito ou falha, sem piscar duas caixas.
 */
export function sonnerPromessaSource(): string {
  return quadro(
    `${IMPORTS}

function enviar() {
  toast.promise(enviarArquivo(), {
    loading: "Enviando arquivo...",
    success: "Arquivo enviado com sucesso.",
    error: "Erro ao enviar. Tente novamente.",
  });
}`,
    'Enviar arquivo',
    'enviar',
    REGIAO_PADRAO,
  );
}

/**
 * Composição Persistent: prazo infinito, reservado a falha crítica. Sempre com
 * botão de fechar — o que não sai sozinho e não pode ser fechado vira obstáculo.
 */
export function sonnerPersistenteSource(): string {
  return quadro(
    `${IMPORTS}

function falhar() {
  toast.error("Falha crítica no servidor.", {
    duration: Number.POSITIVE_INFINITY,
  });
}`,
    'Simular falha',
    'falhar',
    ' position="top-right" richColors closeButton',
  );
}
