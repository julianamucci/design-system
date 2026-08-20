/**
 * Transforms do painel Code do Sonner.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Duas coisas saem das stories e NÃO entram no snippet:
 *
 * 1. O quadro `<div style="contain: layout; position: relative; min-height…">`.
 *    Ele existe para prender uma região `position: fixed` dentro do canvas do
 *    Storybook — é andaime de documentação. Quem consome monta o `Toaster` uma
 *    vez, na raiz da aplicação, e nunca precisa desse quadro.
 * 2. Tudo que vem de `sonner.fixtures.ts` — os textos, o `PERSISTENTE`, as
 *    esperas. O snippet traz o literal que quem consome escreveria.
 *
 * `toast` vem de `vue-sonner` porque o pacote do design system exporta a REGIÃO
 * (`Toaster`), e não a fila. Não há caminho pelo design system a oferecer aqui.
 */
import {
  attr,
  attrBool,
  attrNum,
  attrs,
  comoCodigo,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type SonnerArgs = {
  type: 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  description: string;
  actionLabel: string;
  position:
    | 'top-right'
    | 'top-center'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'bottom-left';
  richColors: boolean;
  closeButton: boolean;
  duration: number;
};

/**
 * Texto que vira literal de string no script.
 *
 * Mesma porta que `texto()` fecha do lado do atributo: o control chega como
 * função quando é arg de ação, e interpolado direto o corpo do mock apareceria
 * no painel. A aspa simples é escapada porque o literal é escrito com ela.
 */
function literal(valor: unknown, padrao = ''): string {
  const bruto = comoCodigo(valor) ?? padrao;
  return bruto.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** A região da pilha. É montada UMA vez, na raiz — não uma por tela. */
function regiao(extras = ' position="top-right" rich-colors'): string {
  return `<Toaster${extras} />`;
}

/** Chamada da fila: o tipo é o MÉTODO, e não um argumento de configuração. */
function chamada(tipo: string, titulo: string, opcoes: string[] = []): string {
  const fn = tipo === 'default' ? 'toast' : `toast.${tipo}`;
  if (!opcoes.length) return `${fn}('${titulo}')`;
  return `${fn}('${titulo}', {\n${opcoes.map((linha) => `  ${linha}`).join('\n')}\n})`;
}

/** O corpo do manipulador que o botão dispara. */
function manipulador(corpo: string, nome = 'notificar'): string {
  return `function ${nome}() {\n${indentar(corpo)}\n}`;
}

/**
 * A página: o gatilho e a região.
 *
 * A região aparece ao lado do gatilho só porque um snippet não tem raiz de
 * aplicação para mostrar. `null` é para a story que prova o caso sem região
 * montada — lá a ausência é o assunto.
 */
function pagina(opcoes: {
  script: string;
  rotulo?: string;
  regiao?: string | null;
  extras?: string;
}): string {
  const rotulo = opcoes.rotulo ?? 'Disparar notificação';
  const area = opcoes.regiao === null ? null : (opcoes.regiao ?? regiao(opcoes.extras));
  const imports = [
    `import { toast } from 'vue-sonner'`,
    area && `import { Toaster } from '@/components/ui/sonner'`,
    `import { Button } from '@/components/ui/button'`,
  ]
    .filter(Boolean)
    .join('\n');
  const template = [
    `<Button variant="outline" @click="notificar">${rotulo}</Button>`,
    area ? `\n${area}` : '',
  ].join('\n');
  return vueSnippet(`${imports}\n\n${opcoes.script}`, template);
}

/**
 * Forma canônica: um gatilho que chama a fila e a região que a desenha.
 *
 * O tipo semântico é o MÉTODO (`toast.success`), e a neutra é a função direta
 * (`toast`) — não existe `type: 'default'` a escrever.
 */
export const sonnerPlaygroundSource: SourceTransform<SonnerArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const tipo = comoCodigo(args.type) ?? 'success';
  const descricao = literal(args.description);
  const rotuloAcao = literal(args.actionLabel);
  const opcoes = [
    descricao && `description: '${descricao}',`,
    rotuloAcao && `action: { label: '${rotuloAcao}', onClick: desfazer },`,
  ].filter((linha): linha is string => Boolean(linha));
  const corpo = manipulador(chamada(tipo, literal(args.title, 'Alterações salvas.'), opcoes));
  // A ação precisa existir em algum lugar: a notificação some, e com ela o
  // botão. O manipulador nomeado é o que deixa isso visível no exemplo.
  const script = rotuloAcao
    ? `${corpo}\n\nfunction desfazer() {\n  toast.success('Item restaurado.')\n}`
    : corpo;
  return pagina({
    script,
    extras: attrs(
      attr('position', args.position, 'bottom-right'),
      attrBool('rich-colors', args.richColors, false),
      attrBool('close-button', args.closeButton, false),
      attrNum('duration', args.duration, 4000),
    ),
  });
};

/** Uma chamada só, sem opções: o caso mais comum de cada tipo. */
function tipoSimples(tipo: string, titulo: string): string {
  return pagina({ script: manipulador(chamada(tipo, titulo)) });
}

/**
 * Neutra: sem tipo semântico não há ícone nem cor a aplicar. É a função direta,
 * e não um tipo chamado "default" — ele não existe na API.
 */
export function sonnerNeutraSource(): string {
  return tipoSimples('default', 'Código copiado.');
}

/** Êxito: confirmação de operação concluída. */
export function sonnerSucessoSource(): string {
  return tipoSimples('success', 'Alterações salvas.');
}

/** Falha: o texto diz a causa e o caminho de saída, nunca só a cor (WCAG 1.4.1). */
export function sonnerErroSource(): string {
  return tipoSimples('error', 'Não foi possível salvar. Tente novamente.');
}

/** Aviso não crítico: tipo próprio, para não pedir emprestada a cor da falha. */
export function sonnerAvisoSource(): string {
  return tipoSimples('warning', 'Sua sessão expira em 5 minutos.');
}

/** Informação: nada deu certo nem errado, e o tipo diz isso. */
export function sonnerInfoSource(): string {
  return tipoSimples('info', 'Nova versão disponível.');
}

/**
 * Carregamento: nasce SEM prazo, e quem a encerra é o fim da operação. Fechá-la
 * por relógio deixaria a pessoa sem saber se a operação terminou.
 */
export function sonnerCarregandoSource(): string {
  return tipoSimples('loading', 'Enviando arquivo...');
}

/**
 * Saída automática: o prazo é da REGIÃO, e a chamada não escreve nada. É o que
 * separa a notificação do Alert — a mensagem é passageira e nada fica esperando
 * uma decisão.
 */
export function sonnerSaidaAutomaticaSource(): string {
  return tipoSimples('error', 'Não foi possível salvar. Tente novamente.');
}

/**
 * Pilha aberta: `expand` mantém as anteriores visíveis. Sem ele a mais nova
 * cobre as outras, e uma mensagem ainda não lida some por baixo da seguinte.
 */
export function sonnerPilhaSource(): string {
  return pagina({
    rotulo: 'Disparar três notificações',
    extras: ' position="top-right" rich-colors expand',
    script: manipulador(
      [
        chamada('success', 'Alterações salvas.'),
        chamada('warning', 'Sua sessão expira em 5 minutos.'),
        chamada('info', 'Nova versão disponível.'),
      ].join('\n'),
    ),
  });
}

/**
 * Canto da tela: a posição é escolha do projeto e vale para a aplicação
 * inteira. Misturar cantos faria a pessoa procurar a notificação a cada vez.
 */
export function sonnerPosicaoSource(): string {
  return pagina({
    extras: ' position="bottom-center" rich-colors',
    script: manipulador(chamada('success', 'Alterações salvas.')),
  });
}

/**
 * Sem região montada: `toast()` não desenha nada e também não quebra. A fila
 * existe independentemente de quem a desenha, então uma tela que ainda não
 * montou a região não derruba o fluxo que a chamou.
 *
 * A ausência do `Toaster` é o assunto — por isso ele não aparece aqui.
 */
export function sonnerSemRegiaoSource(): string {
  return pagina({
    regiao: null,
    script: manipulador(chamada('success', 'Alterações salvas.')),
  });
}

/** Tema escuro: a região declara o tema para a própria cascata. */
export function sonnerTemaEscuroSource(): string {
  return pagina({
    rotulo: 'Disparar as notificações',
    extras: ' position="top-right" rich-colors expand theme="dark"',
    script: manipulador(
      [
        chamada('default', 'Código copiado.'),
        chamada('success', 'Alterações salvas.'),
        chamada('error', 'Não foi possível salvar. Tente novamente.'),
        chamada('warning', 'Sua sessão expira em 5 minutos.'),
        chamada('info', 'Nova versão disponível.'),
      ].join('\n'),
    ),
  });
}

/**
 * Título mais descrição: a descrição é uma frase completa. Se a mensagem
 * precisa de três linhas, o lugar dela não é uma notificação.
 */
export function sonnerComDescricaoSource(): string {
  return pagina({
    script: manipulador(
      chamada('success', 'Preferências atualizadas.', [
        `description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',`,
      ]),
    ),
  });
}

/**
 * Ação embutida, para operação reversível.
 *
 * O manipulador da ação é nomeado de propósito: o botão entra no fluxo de foco
 * enquanto a notificação está na tela e SOME com ela, então o mesmo desfazer
 * precisa existir em outro lugar da interface.
 */
export function sonnerComAcaoSource(): string {
  return pagina({
    rotulo: 'Excluir item',
    script: `${manipulador(
      chamada('default', 'Item excluído.', [
        `action: { label: 'Desfazer', onClick: desfazer },`,
      ]),
      'notificar',
    )}

function desfazer() {
  toast.success('Item restaurado.')
}`,
  });
}

/**
 * Ciclo de uma promessa: UMA notificação para a operação inteira. Ela nasce em
 * carregamento e vira êxito ou falha no MESMO nó — trocar o nó faria o leitor
 * de tela anunciar duas notificações para um evento só.
 */
export function sonnerPromessaSource(): string {
  return pagina({
    rotulo: 'Enviar arquivo',
    script: `${manipulador(
      `toast.promise(enviarArquivo(), {
  loading: 'Enviando arquivo...',
  success: 'Arquivo enviado com sucesso.',
  error: 'Erro ao enviar. Tente novamente.',
})`,
    )}

function enviarArquivo(): Promise<void> {
  return fetch('/api/arquivos', { method: 'POST' }).then(() => undefined)
}`,
  });
}

/**
 * Prazo infinito, reservado a falha crítica que exige decisão.
 *
 * Sempre com botão de fechar: uma notificação que não sai sozinha e não pode
 * ser fechada vira obstáculo. O prazo é DA CHAMADA, e vence o da região.
 */
export function sonnerPersistenteSource(): string {
  return pagina({
    rotulo: 'Simular falha crítica',
    extras: ' position="top-right" rich-colors close-button',
    script: manipulador(
      chamada('error', 'Falha crítica no servidor.', [
        'duration: Number.POSITIVE_INFINITY,',
      ]),
    ),
  });
}
