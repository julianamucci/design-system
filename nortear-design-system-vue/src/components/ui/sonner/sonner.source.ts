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
 * 2. Tudo que vem de `sonner.fixtures.ts` — os textos, o `PERSISTENT`, as
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
  asCode,
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
function literal(value: unknown, padrao = ''): string {
  const raw = asCode(value) ?? padrao;
  return raw.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** A região da pilha. É montada UMA vez, na raiz — não uma por tela. */
function region(extras = ' position="top-right" rich-colors'): string {
  return `<Toaster${extras} />`;
}

/** Chamada da fila: o tipo é o MÉTODO, e não um argumento de configuração. */
function call(type: string, title: string, options: string[] = []): string {
  const fn = type === 'default' ? 'toast' : `toast.${type}`;
  if (!options.length) return `${fn}('${title}')`;
  return `${fn}('${title}', {\n${options.map((line) => `  ${line}`).join('\n')}\n})`;
}

/**
 * O corpo do manipulador que o botão dispara.
 *
 * O nome entra LITERAL, e não por `${…}`: o gatilho é sempre `@click="notificar"`
 * e o único nome que existiu foi esse. Interpolá-lo escondia a declaração de
 * quem lê o texto do módulo — a guarda que confere se o exemplo declara o que
 * liga via, do exemplo publicado, um `function () {` sem nome nenhum.
 */
function handler(body: string): string {
  return `function notificar() {\n${indentar(body)}\n}`;
}

/**
 * A página: o gatilho e a região.
 *
 * A região aparece ao lado do gatilho só porque um snippet não tem raiz de
 * aplicação para mostrar. `null` é para a story que prova o caso sem região
 * montada — lá a ausência é o assunto.
 */
function page(options: {
  script: string;
  label?: string;
  region?: string | null;
  extras?: string;
}): string {
  const label = options.label ?? 'Disparar notificação';
  const area = options.region === null ? null : (options.region ?? region(options.extras));
  const imports = [
    `import { toast } from 'vue-sonner'`,
    area && `import { Toaster } from '@/components/ui/sonner'`,
    `import { Button } from '@/components/ui/button'`,
  ]
    .filter(Boolean)
    .join('\n');
  const template = [
    `<Button variant="outline" @click="notificar">${label}</Button>`,
    area ? `\n${area}` : '',
  ].join('\n');
  return vueSnippet(`${imports}\n\n${options.script}`, template);
}

/**
 * Forma canônica: um gatilho que chama a fila e a região que a desenha.
 *
 * O tipo semântico é o MÉTODO (`toast.success`), e a neutra é a função direta
 * (`toast`) — não existe `type: 'default'` a escrever.
 */
export const sonnerPlaygroundSource: SourceTransform<SonnerArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const type = asCode(args.type) ?? 'success';
  const description = literal(args.description);
  const actionLabel = literal(args.actionLabel);
  const options = [
    description && `description: '${description}',`,
    actionLabel && `action: { label: '${actionLabel}', onClick: desfazer },`,
  ].filter((line): line is string => Boolean(line));
  const body = handler(call(type, literal(args.title, 'Alterações salvas.'), options));
  // A ação precisa existir em algum lugar: a notificação some, e com ela o
  // botão. O manipulador nomeado é o que deixa isso visível no exemplo.
  const script = actionLabel
    ? `${body}\n\nfunction desfazer() {\n  toast.success('Item restaurado.')\n}`
    : body;
  return page({
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
function simpleType(type: string, title: string): string {
  return page({ script: handler(call(type, title)) });
}

/**
 * Neutra: sem tipo semântico não há ícone nem cor a aplicar. É a função direta,
 * e não um tipo chamado "default" — ele não existe na API.
 */
export function sonnerNeutralSource(): string {
  return simpleType('default', 'Código copiado.');
}

/** Êxito: confirmação de operação concluída. */
export function sonnerSuccessSource(): string {
  return simpleType('success', 'Alterações salvas.');
}

/** Falha: o texto diz a causa e o caminho de saída, nunca só a cor (WCAG 1.4.1). */
export function sonnerErrorSource(): string {
  return simpleType('error', 'Não foi possível salvar. Tente novamente.');
}

/** Aviso não crítico: tipo próprio, para não pedir emprestada a cor da falha. */
export function sonnerWarningSource(): string {
  return simpleType('warning', 'Sua sessão expira em 5 minutos.');
}

/** Informação: nada deu certo nem errado, e o tipo diz isso. */
export function sonnerInfoSource(): string {
  return simpleType('info', 'Nova versão disponível.');
}

/**
 * Carregamento: nasce SEM prazo, e quem a encerra é o fim da operação. Fechá-la
 * por relógio deixaria a pessoa sem saber se a operação terminou.
 */
export function sonnerLoadingSource(): string {
  return simpleType('loading', 'Enviando arquivo...');
}

/**
 * Saída automática: o prazo é da REGIÃO, e a chamada não escreve nada. É o que
 * separa a notificação do Alert — a mensagem é passageira e nada fica esperando
 * uma decisão.
 */
export function sonnerAutoDismissSource(): string {
  return simpleType('error', 'Não foi possível salvar. Tente novamente.');
}

/**
 * Pilha aberta: `expand` mantém as anteriores visíveis. Sem ele a mais nova
 * cobre as outras, e uma mensagem ainda não lida some por baixo da seguinte.
 */
export function sonnerStackSource(): string {
  return page({
    label: 'Disparar três notificações',
    extras: ' position="top-right" rich-colors expand',
    script: handler(
      [
        call('success', 'Alterações salvas.'),
        call('warning', 'Sua sessão expira em 5 minutos.'),
        call('info', 'Nova versão disponível.'),
      ].join('\n'),
    ),
  });
}

/**
 * Canto da tela: a posição é escolha do projeto e vale para a aplicação
 * inteira. Misturar cantos faria a pessoa procurar a notificação a cada vez.
 */
export function sonnerPositionSource(): string {
  return page({
    extras: ' position="bottom-center" rich-colors',
    script: handler(call('success', 'Alterações salvas.')),
  });
}

/**
 * Sem região montada: `toast()` não desenha nada e também não quebra. A fila
 * existe independentemente de quem a desenha, então uma tela que ainda não
 * montou a região não derruba o fluxo que a chamou.
 *
 * A ausência do `Toaster` é o assunto — por isso ele não aparece aqui.
 */
export function sonnerNoRegionSource(): string {
  return page({
    region: null,
    script: handler(call('success', 'Alterações salvas.')),
  });
}

/** Tema escuro: a região declara o tema para a própria cascata. */
export function sonnerDarkThemeSource(): string {
  return page({
    label: 'Disparar as notificações',
    extras: ' position="top-right" rich-colors expand theme="dark"',
    script: handler(
      [
        call('default', 'Código copiado.'),
        call('success', 'Alterações salvas.'),
        call('error', 'Não foi possível salvar. Tente novamente.'),
        call('warning', 'Sua sessão expira em 5 minutos.'),
        call('info', 'Nova versão disponível.'),
      ].join('\n'),
    ),
  });
}

/**
 * Título mais descrição: a descrição é uma frase completa. Se a mensagem
 * precisa de três linhas, o lugar dela não é uma notificação.
 */
export function sonnerWithDescriptionSource(): string {
  return page({
    script: handler(
      call('success', 'Preferências atualizadas.', [
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
export function sonnerWithActionSource(): string {
  return page({
    label: 'Excluir item',
    script: `${handler(
      call('default', 'Item excluído.', [
        `action: { label: 'Desfazer', onClick: desfazer },`,
      ]),
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
export function sonnerPromiseSource(): string {
  return page({
    label: 'Enviar arquivo',
    script: `${handler(
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
export function sonnerPersistentSource(): string {
  return page({
    label: 'Simular falha crítica',
    extras: ' position="top-right" rich-colors close-button',
    script: handler(
      call('error', 'Falha crítica no servidor.', [
        'duration: Number.POSITIVE_INFINITY,',
      ]),
    ),
  });
}
