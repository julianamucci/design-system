/**
 * Transforms do painel Code do AlertDialog.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que o painel imprimia antes era a árvore do `render`, com o objeto de args
 * desestruturado (`tone`, `showMedia`, `triggerLabel`…) e um `key` de
 * remontagem que só existe para o control `defaultOpen` fazer efeito na tela.
 * Nada disso é composição que alguém escreva.
 */
import {
  attrs,
  childText,
  indentar,
  jsxSnippet,
  propBool,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type AlertDialogArgs = {
  defaultOpen: boolean;
  /** Severidade da confirmação: escolhe a variante do Button do trigger e da ação. */
  tone: 'destructive' | 'default';
  showMedia: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
};

const TONS = ['destructive', 'default'] as const;

/**
 * Bloco de import montado a partir das peças REALMENTE usadas.
 *
 * Uma lista fixa faria a story sem descrição importar `AlertDialogDescription`
 * — justamente a peça cuja ausência ela ensina. Import que o exemplo não usa é
 * a primeira coisa que o compilador de quem cola reclama.
 */
function importingParts(parts: readonly string[]): string {
  const list = [...parts].sort();
  return `import {
${list.map((part) => `  ${part},`).join('\n')}
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";`;
}

type Confirm = {
  tone?: AlertDialogArgs['tone'];
  defaultOpen?: boolean;
  midia?: boolean;
  triggerLabel?: string;
  title?: string;
  description?: string | null;
  cancelLabel?: string;
  actionLabel?: string;
  /** Classe extra no painel — só a story de extensibilidade usa. */
  classeContent?: string;
  /** Classe extra no bloco de mídia — idem. */
  classeMidia?: string;
  /** `onClick` do consumidor, quando a story é sobre o callback. */
  onAction?: string;
  onCancel?: string;
  /** Declarações que o markup referencia — handler nomeado, estado. */
  preambulo?: string;
};

/** Peças sempre presentes numa confirmação com gatilho próprio. */
const PARTS_BASE = [
  'AlertDialog',
  'AlertDialogAction',
  'AlertDialogCancel',
  'AlertDialogContent',
  'AlertDialogFooter',
  'AlertDialogHeader',
  'AlertDialogTitle',
  'AlertDialogTrigger',
] as const;

/**
 * A confirmação inteira: gatilho, painel, título, descrição e as DUAS saídas.
 *
 * Cancel vem antes de Action no DOM de propósito — é a ordem que põe a saída
 * segura primeiro na tabulação e, abaixo de 40rem, embaixo na pilha.
 */
function confirm({
  tone,
  defaultOpen,
  midia = false,
  triggerLabel = 'Excluir conta',
  title = 'Excluir conta',
  description = 'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
  cancelLabel = 'Cancelar',
  actionLabel = 'Excluir',
  classeContent,
  classeMidia,
  onAction,
  onCancel,
  preambulo,
}: Confirm): string {
  const variantButton = attrs(propOption('variant', tone, TONS, 'default'));
  const blockMidia = midia
    ? `<AlertDialogMedia${classeMidia ? ` className="${classeMidia}"` : ''}>
  <TriangleAlert aria-hidden="true" />
</AlertDialogMedia>
`
    : '';
  const blockDescription =
    description === null
      ? ''
      : `
<AlertDialogDescription>
  ${description}
</AlertDialogDescription>`;

  const markup = `<AlertDialog${attrs(propBool('defaultOpen', defaultOpen))}>
  <AlertDialogTrigger render={<Button${variantButton} />}>
    ${triggerLabel}
  </AlertDialogTrigger>
  <AlertDialogContent${classeContent ? ` className="${classeContent}"` : ''}>
    <AlertDialogHeader>
${indentar(`${blockMidia}<AlertDialogTitle>${title}</AlertDialogTitle>${blockDescription}`, '      ')}
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel${onCancel ? ` onClick={${onCancel}}` : ''}>${cancelLabel}</AlertDialogCancel>
      <AlertDialogAction${variantButton}${onAction ? ` onClick={${onAction}}` : ''}>${actionLabel}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

  const parts: string[] = [...PARTS_BASE];
  if (description !== null) parts.push('AlertDialogDescription');
  if (midia) parts.push('AlertDialogMedia');
  const imports = midia
    ? `${importingParts(parts)}\nimport { TriangleAlert } from "lucide-react";`
    : importingParts(parts);
  const header = preambulo ? `${imports}\n\n${preambulo}` : imports;

  return jsxSnippet(header, markup);
}

/**
 * Transform do `meta` — cascateia para todas as stories dos três arquivos.
 *
 * Lê os controls do Playground; nos arquivos que desligam os controls cai nos
 * padrões, que são exatamente a confirmação destrutiva canônica. `tone` vira a
 * variante do Button em DOIS lugares (trigger e ação), que é o acoplamento que
 * a story demonstra e o painel escondia.
 */
export const alertDialogSource: SourceTransform<AlertDialogArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return confirm({
    tone: typeof args.tone === 'string' ? (args.tone as AlertDialogArgs['tone']) : 'destructive',
    defaultOpen: typeof args.defaultOpen === 'boolean' ? args.defaultOpen : undefined,
    midia: args.showMedia === true,
    triggerLabel: childText(args.triggerLabel, 'Excluir conta'),
    title: childText(args.title, 'Excluir conta'),
    description: childText(
      args.description,
      'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    ),
    cancelLabel: childText(args.cancelLabel, 'Cancelar'),
    actionLabel: childText(args.actionLabel, 'Excluir'),
  });
};

/**
 * Já montado aberto: `defaultOpen` é o assunto DESTA story, e o arquivo de
 * estados desliga os controls — sem isto o painel mostraria a forma fechada.
 *
 * É a única transform que o declara. Nas outras stories o `defaultOpen` do
 * `render` existe só para a captura e a `play` encontrarem o painel na tela —
 * andaime, não ensinamento: quem cola quer o diálogo comandado pelo gatilho.
 */
export function alertDialogOpenSource(): string {
  return confirm({
    tone: 'destructive',
    defaultOpen: true,
    triggerLabel: 'Excluir item',
    title: 'Excluir item permanentemente?',
    description:
      'O item será removido de forma definitiva e não poderá ser recuperado.',
  });
}

/**
 * Confirmar executa E fecha: o `onClick` do consumidor roda antes do
 * fechamento, então não existe um segundo handler para "fechar depois".
 */
export function alertDialogConfirmadoSource(): string {
  return confirm({
    tone: 'destructive',
    title: 'Confirmar exclusão',
    description: 'Esta ação é permanente e não poderá ser desfeita.',
    preambulo: 'const excluirConta = () => remover(contaId);',
    onAction: 'excluirConta',
  });
}

/**
 * Cancelar também aceita `onClick` — e o ponto da story é que a ação
 * destrutiva NÃO roda por esse caminho.
 */
export function alertDialogCanceladoSource(): string {
  return confirm({
    tone: 'destructive',
    title: 'Confirmar exclusão',
    description: 'Esta ação é permanente e não poderá ser desfeita.',
    preambulo: `const registrarDesistencia = () => rastrear("exclusao_cancelada");
const excluirConta = () => remover(contaId);`,
    onCancel: 'registrarDesistencia',
    onAction: 'excluirConta',
  });
}

/**
 * Modo controlado: quem manda é o estado do pai, e o diálogo não tem Trigger
 * nenhum — o botão que abre vive fora da raiz. `onOpenChange` é o componente
 * PEDINDO a mudança (Escape, saída pelo Cancel), não a confirmação de que ela
 * ocorreu.
 */
export function alertDialogControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importingParts([
  'AlertDialog',
  'AlertDialogAction',
  'AlertDialogCancel',
  'AlertDialogContent',
  'AlertDialogDescription',
  'AlertDialogFooter',
  'AlertDialogHeader',
  'AlertDialogTitle',
])}

const [aberto, setAberto] = useState(false);`,
    `<div className="nds-stack" data-spacing="sm">
  <Button variant="destructive" onClick={() => setAberto(true)}>
    Abrir via estado externo
  </Button>
  <AlertDialog open={aberto} onOpenChange={setAberto}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Controlado pelo pai</AlertDialogTitle>
        <AlertDialogDescription>
          Este diálogo é comandado por estado externo.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Fechar</AlertDialogCancel>
        <AlertDialogAction variant="destructive" onClick={() => setAberto(false)}>
          Confirmar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>`,
  );
}

/**
 * Bloco de mídia: precisa ser o PRIMEIRO filho do header — é dessa ordem que
 * dependem o `:has()` que centraliza o painel e a leitura ícone → título →
 * descrição. O ícone sai da árvore de acessibilidade; quem nomeia é o título.
 */
export function alertDialogWithIconSource(): string {
  return confirm({ tone: 'destructive', midia: true });
}

/**
 * Confirmação neutra: sem `variant`, trigger e ação herdam os tokens padrão do
 * Button. O arquivo desliga os controls, então o `tone` do `meta` não chega
 * aqui — e o padrão dele é o destrutivo.
 */
export function alertDialogNeutralSource(): string {
  return confirm({
    tone: 'default',
    triggerLabel: 'Sair da conta',
    title: 'Sair da conta',
    description: 'Você precisará entrar novamente para acessar seus dados.',
    actionLabel: 'Sair',
  });
}

/**
 * A AUSÊNCIA da descrição é o assunto: sem ela o painel deixa de declarar
 * `aria-describedby` em vez de apontar para um id inexistente. Uma transform
 * que apenas encurtasse o texto ensinaria o contrário.
 */
export function alertDialogNoDescriptionSource(): string {
  return confirm({
    tone: 'destructive',
    triggerLabel: 'Descartar rascunho',
    title: 'Descartar rascunho',
    description: null,
    actionLabel: 'Descartar',
  });
}

/**
 * Extensibilidade por classe: painel e bloco de mídia aceitam classes de
 * LAYOUT. Largura, respiro interno e cor não são extensíveis — `utilities.css`
 * é importado antes do CSS do componente, e classe de mesma especificidade
 * perde para a regra do painel.
 */
export function alertDialogClassNameExtraSource(): string {
  return confirm({
    tone: 'destructive',
    midia: true,
    classeContent: 'nds-overflow-hidden',
    classeMidia: 'nds-shrink-0',
  });
}
