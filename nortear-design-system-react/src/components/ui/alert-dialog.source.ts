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
 *
 * `defaultOpen` só entra no trecho do PLAYGROUND, e só quando quem lê liga o
 * control — o trecho acompanha os controls, e o padrão (fechado) não emite
 * nada. Nas outras stories ele existe para a captura e a `play` encontrarem o
 * painel na tela: é andaime, não ensinamento, e nenhuma transform delas o
 * declara — quem cola quer o diálogo comandado pelo gatilho.
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

const TONES = ['destructive', 'default'] as const;
const TRIGGER_VARIANTS = ['destructive', 'default', 'outline'] as const;

/**
 * Rótulos da confirmação destrutiva canônica — os mesmos de
 * `demonstration.labels` no conteúdo compartilhado.
 */
const DEFAULT_LABELS = {
  triggerLabel: 'Excluir conta',
  title: 'Excluir conta',
  description:
    'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
  cancelLabel: 'Cancelar',
  actionLabel: 'Excluir',
} as const;

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
  /** Só o Playground passa, e só com o control ligado. */
  defaultOpen?: boolean;
  /**
   * Variante do gatilho, quando ela NÃO acompanha o tom — a confirmação neutra
   * abre por um botão `outline`, e a ação fica na variante padrão.
   */
  triggerVariant?: (typeof TRIGGER_VARIANTS)[number];
  media?: boolean;
  triggerLabel?: string;
  title?: string;
  description?: string | null;
  cancelLabel?: string;
  actionLabel?: string;
  /** Classe extra no painel — só a story de extensibilidade usa. */
  contentClass?: string;
  /** Classe extra no bloco de mídia — idem. */
  mediaClass?: string;
  /** Tag do título quando o contexto da página exige outro nível de cabeçalho. */
  titleTag?: string;
  /** `onClick` do consumidor, quando a story é sobre o callback. */
  onAction?: string;
  onCancel?: string;
  /** Declarações que o markup referencia — handler nomeado, estado. */
  preamble?: string;
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
 * segura primeiro na tabulação e, abaixo de 40rem, embaixo na pilha. O foco
 * inicial no Cancel NÃO depende dessa ordem: é o componente que o escolhe.
 */
function confirm({
  tone,
  defaultOpen,
  triggerVariant,
  media = false,
  triggerLabel = DEFAULT_LABELS.triggerLabel,
  title = DEFAULT_LABELS.title,
  description = DEFAULT_LABELS.description,
  cancelLabel = DEFAULT_LABELS.cancelLabel,
  actionLabel = DEFAULT_LABELS.actionLabel,
  contentClass,
  mediaClass,
  titleTag,
  onAction,
  onCancel,
  preamble,
}: Confirm): string {
  const actionVariant = attrs(propOption('variant', tone, TONES, 'default'));
  const triggerButtonVariant = triggerVariant
    ? attrs(propOption('variant', triggerVariant, TRIGGER_VARIANTS, 'default'))
    : actionVariant;
  const mediaBlock = media
    ? `<AlertDialogMedia${mediaClass ? ` className="${mediaClass}"` : ''}>
  <TriangleAlert aria-hidden="true" />
</AlertDialogMedia>
`
    : '';
  const descriptionBlock =
    description === null
      ? ''
      : `
<AlertDialogDescription>
  ${description}
</AlertDialogDescription>`;

  const markup = `<AlertDialog${attrs(propBool('defaultOpen', defaultOpen))}>
  <AlertDialogTrigger render={<Button${triggerButtonVariant} />}>
    ${triggerLabel}
  </AlertDialogTrigger>
  <AlertDialogContent${contentClass ? ` className="${contentClass}"` : ''}>
    <AlertDialogHeader>
${indentar(`${mediaBlock}<AlertDialogTitle${titleTag ? ` render={<${titleTag} />}` : ''}>${title}</AlertDialogTitle>${descriptionBlock}`, '      ')}
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel${onCancel ? ` onClick={${onCancel}}` : ''}>${cancelLabel}</AlertDialogCancel>
      <AlertDialogAction${actionVariant}${onAction ? ` onClick={${onAction}}` : ''}>${actionLabel}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

  const parts: string[] = [...PARTS_BASE];
  if (description !== null) parts.push('AlertDialogDescription');
  if (media) parts.push('AlertDialogMedia');
  const imports = media
    ? `${importingParts(parts)}\nimport { TriangleAlert } from "lucide-react";`
    : importingParts(parts);
  const header = preamble ? `${imports}\n\n${preamble}` : imports;

  return jsxSnippet(header, markup);
}

/**
 * Transform do `meta` — cascateia para todas as stories dos três arquivos.
 *
 * Lê os controls do Playground; nos arquivos que desligam os controls cai nos
 * padrões, que são exatamente a confirmação destrutiva canônica. `tone` vira a
 * variante do Button em DOIS lugares (trigger e ação), que é o acoplamento que
 * a story demonstra e o painel escondia. `defaultOpen` entra só quando o
 * control está ligado — ver o cabeçalho do módulo.
 */
export const alertDialogSource: SourceTransform<AlertDialogArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return confirm({
    tone: typeof args.tone === 'string' ? (args.tone as AlertDialogArgs['tone']) : 'destructive',
    defaultOpen: args.defaultOpen === true,
    media: args.showMedia === true,
    triggerLabel: childText(args.triggerLabel, DEFAULT_LABELS.triggerLabel),
    title: childText(args.title, DEFAULT_LABELS.title),
    description: childText(args.description, DEFAULT_LABELS.description),
    cancelLabel: childText(args.cancelLabel, DEFAULT_LABELS.cancelLabel),
    actionLabel: childText(args.actionLabel, DEFAULT_LABELS.actionLabel),
  });
};

/**
 * Confirmar executa E fecha: o `onClick` do consumidor roda antes do
 * fechamento, então não existe um segundo handler para "fechar depois".
 */
export function alertDialogConfirmedSource(): string {
  return confirm({
    tone: 'destructive',
    preamble: 'const deleteAccount = () => removeAccount(accountId);',
    onAction: 'deleteAccount',
  });
}

/**
 * Cancelar também aceita `onClick` — e o ponto da story é que a ação
 * destrutiva NÃO roda por esse caminho.
 */
export function alertDialogCancelledSource(): string {
  return confirm({
    tone: 'destructive',
    preamble: `const logCancellation = () => logEvent("account_deletion_cancelled");
const deleteAccount = () => removeAccount(accountId);`,
    onCancel: 'logCancellation',
    onAction: 'deleteAccount',
  });
}

/**
 * Modo controlado: quem manda é o estado do pai, e o diálogo não tem Trigger
 * nenhum — o botão que abre vive fora da raiz. `onOpenChange` é o componente
 * PEDINDO a mudança (Escape, saída pelo Cancel ou pela ação), não a
 * confirmação de que ela ocorreu; por isso a ação não precisa de um
 * `setOpen(false)` próprio.
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

const [open, setOpen] = useState(false);`,
    `<div className="nds-stack" data-spacing="sm">
  <Button variant="destructive" onClick={() => setOpen(true)}>
    ${DEFAULT_LABELS.triggerLabel}
  </Button>
  <AlertDialog open={open} onOpenChange={setOpen}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>${DEFAULT_LABELS.title}</AlertDialogTitle>
        <AlertDialogDescription>
          ${DEFAULT_LABELS.description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>${DEFAULT_LABELS.cancelLabel}</AlertDialogCancel>
        <AlertDialogAction variant="destructive">${DEFAULT_LABELS.actionLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>`,
  );
}

/**
 * Bloco de mídia: precisa ser o PRIMEIRO filho do header — é dessa ordem que sai
 * a leitura ícone → título → descrição. O `:has()` que centraliza a CAIXA do
 * ícone no mobile não depende dela: lê a PRESENÇA da mídia, em qualquer
 * posição. O ícone sai da árvore de acessibilidade; quem
 * nomeia é o título.
 */
export function alertDialogWithIconSource(): string {
  return confirm({ tone: 'destructive', media: true });
}

/**
 * Confirmação neutra: o gatilho abre por um botão `outline` e a ação herda os
 * tokens padrão do Button. O arquivo desliga os controls, então o `tone` do
 * `meta` não chega aqui — e o padrão dele é o destrutivo.
 */
export function alertDialogNeutralSource(): string {
  return confirm({
    tone: 'default',
    triggerVariant: 'outline',
    triggerLabel: 'Sair da conta',
    title: 'Sair da conta',
    description: 'Você precisará entrar novamente para acessar seus dados.',
    actionLabel: 'Sair',
  });
}

/**
 * Descrição longa: a mesma confirmação destrutiva, com o texto que ocupa mais
 * de uma linha. Sem esta transform o painel cairia na do `meta` e mostraria a
 * descrição CURTA — justamente o contrário do que a story mede.
 */
export function alertDialogLongDescriptionSource(): string {
  return confirm({
    tone: 'destructive',
    description:
      'Todos os seus dados, arquivos enviados, integrações ativas e o histórico completo de faturamento serão removidos permanentemente dos nossos servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança fica disponível depois da confirmação.',
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
    media: true,
    contentClass: 'nds-overflow-hidden',
    mediaClass: 'nds-shrink-0',
  });
}

/**
 * Título em `h3` — o NÍVEL do cabeçalho pertence à página, não ao componente.
 *
 * A confirmação abre de dentro de uma seção que já está em `h2`, e repetir o
 * nível ali poria dois irmãos na lista de cabeçalhos do leitor de tela onde há
 * um pai e um filho. Por isso quem compõe escolhe o nível.
 *
 * O que a troca NÃO pode custar é o vínculo: quem nomeia o painel é o
 * `aria-labelledby`, que aponta para o id do título. `render` empresta as props
 * ao elemento de quem consome — id, classe e slot continuam saindo do
 * componente —, então só a semântica de cabeçalho muda.
 */
export function alertDialogHeadingH3Source(): string {
  return confirm({ tone: 'destructive', titleTag: 'h3' });
}
