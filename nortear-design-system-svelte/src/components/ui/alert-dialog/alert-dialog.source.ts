/**
 * Transforms do painel Code do AlertDialog.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type AlertDialogArgs = {
  open: boolean;
  /** Severidade da confirmação — escolhe a variante do Button do gatilho e da ação. */
  tone: 'destructive' | 'default';
  /** Bloco de ícone no topo do header. */
  showMedia: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
};

type Composition = {
  open: boolean;
  tone: 'destructive' | 'default';
  showMedia: boolean;
  triggerLabel: string;
  triggerVariant: string;
  title: string;
  /** `null` monta a composição SEM o subcomponente de descrição. */
  description: string | null;
  cancelLabel: string;
  actionLabel: string;
  contentClass?: string;
  mediaClass?: string;
  /** Handler do consumidor no botão de confirmação (nome de função). */
  onAction?: string;
  /** Handler do consumidor no botão de cancelamento (nome de função). */
  onCancel?: string;
  /** Declarações extras do bloco `<script>` — as funções que os handlers apontam. */
  declaracoes?: string;
};

const PADRAO: Composition = {
  open: false,
  tone: 'destructive',
  showMedia: false,
  triggerLabel: 'Excluir conta',
  triggerVariant: 'destructive',
  title: 'Excluir conta',
  description:
    'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
  cancelLabel: 'Cancelar',
  actionLabel: 'Excluir',
};

/**
 * Monta a composição inteira. Os subcomponentes opcionais (mídia, descrição)
 * entram na lista de imports só quando aparecem na marcação — import sobrando
 * num snippet copiável é erro de lint na casa de quem copiou.
 */
function dialogo(parcial: Partial<Composition> = {}): string {
  const c: Composition = { ...PADRAO, ...parcial };

  const nomes = [
    'AlertDialog',
    'AlertDialogAction',
    'AlertDialogCancel',
    'AlertDialogContent',
    c.description === null ? '' : 'AlertDialogDescription',
    'AlertDialogFooter',
    'AlertDialogHeader',
    c.showMedia ? 'AlertDialogMedia' : '',
    'AlertDialogTitle',
    'AlertDialogTrigger',
  ].filter(Boolean);

  const script = `import {
${nomes.map((nome) => `  ${nome},`).join('\n')}
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";${
    c.showMedia ? '\nimport TriangleAlert from "@lucide/svelte/icons/triangle-alert";' : ''
  }

let open = $state(${c.open});${c.declaracoes ? `\n\n${c.declaracoes}` : ''}`;

  const midia = c.showMedia
    ? `
      <AlertDialogMedia${attrs(c.mediaClass ? `class="${c.mediaClass}"` : '')}>
        <TriangleAlert aria-hidden="true" />
      </AlertDialogMedia>`
    : '';

  const descricao =
    c.description === null
      ? ''
      : `
      <AlertDialogDescription>${c.description}</AlertDialogDescription>`;

  return svelteSnippet(
    script,
    `<AlertDialog bind:open>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props}${attrs(
        c.triggerVariant === 'default' ? '' : `variant="${c.triggerVariant}"`,
      )}>${c.triggerLabel}</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent${attrs(c.contentClass ? `class="${c.contentClass}"` : '')}>
    <AlertDialogHeader>${midia}
      <AlertDialogTitle>${c.title}</AlertDialogTitle>${descricao}
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel${attrs(c.onCancel ? `onclick={${c.onCancel}}` : '')}>${
        c.cancelLabel
      }</AlertDialogCancel>
      <AlertDialogAction${attrs(
        c.tone === 'default' ? '' : `variant="${c.tone}"`,
        c.onAction ? `onclick={${c.onAction}}` : '',
      )}>${c.actionLabel}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
  );
}

/**
 * Forma canônica: gatilho, painel, título, descrição e as duas saídas.
 *
 * Serve o Playground (acompanhando os controls) e toda story cuja composição é
 * a mesma — estado fechado, confirmação destrutiva, descrição longa, layout
 * responsivo.
 */
export function alertDialogSource(
  _gerado?: string,
  ctx?: { args?: Partial<AlertDialogArgs> },
): string {
  const a = ctx?.args ?? {};
  const tone = a.tone ?? PADRAO.tone;
  return dialogo({
    open: a.open ?? PADRAO.open,
    tone,
    triggerVariant: tone,
    showMedia: a.showMedia ?? PADRAO.showMedia,
    triggerLabel: a.triggerLabel ?? PADRAO.triggerLabel,
    title: a.title ?? PADRAO.title,
    description: a.description ?? PADRAO.description,
    cancelLabel: a.cancelLabel ?? PADRAO.cancelLabel,
    actionLabel: a.actionLabel ?? PADRAO.actionLabel,
  });
}

/** Estado aberto: o valor inicial de `open` já monta o painel na tela. */
export function alertDialogOpenSource(): string {
  return dialogo({
    open: true,
    triggerLabel: 'Excluir item',
    title: 'Excluir item permanentemente?',
    description: 'O item será removido de forma definitiva e não poderá ser recuperado.',
  });
}

/** Confirmação: o handler do consumidor vai no botão de ação, que fecha o painel. */
export function alertDialogConfirmadoSource(): string {
  return dialogo({
    triggerLabel: 'Excluir item',
    title: 'Confirmar exclusão',
    description: 'Esta ação é permanente.',
    onAction: 'excluirItem',
    declaracoes: `function excluirItem() {
  // A exclusão de verdade acontece aqui; o painel fecha sozinho em seguida.
}`,
  });
}

/** Cancelamento: sair pelo Cancelar fecha o painel sem executar a ação. */
export function alertDialogCanceladoSource(): string {
  return dialogo({
    open: true,
    triggerLabel: 'Excluir item',
    title: 'Confirmar exclusão',
    description: 'Esta ação é permanente.',
    onCancel: 'manterItem',
    onAction: 'excluirItem',
    declaracoes: `function excluirItem() {
  // Só roda pela confirmação.
}

function manterItem() {
  // Roda ao cancelar: o item continua onde estava.
}`,
  });
}

/**
 * Abertura comandada de fora: o gatilho fica FORA do diálogo e escreve o estado
 * direto. `onOpenChange` é o componente PEDINDO a mudança — por isso só chega na
 * saída (Escape ou Cancelar).
 */
export function alertDialogControlledSource(): string {
  return svelteSnippet(
    `import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

let open = $state(false);`,
    `<div class="nds-stack" data-spacing="sm">
  <Button variant="destructive" onclick={() => (open = true)}>
    Abrir via estado externo
  </Button>

  <AlertDialog bind:open onOpenChange={(valor) => console.log("aberto:", valor)}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Controlado pelo pai</AlertDialogTitle>
        <AlertDialogDescription>
          Este diálogo é comandado por estado externo via bind:open.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Fechar</AlertDialogCancel>
        <AlertDialogAction variant="destructive" onclick={() => (open = false)}>
          Confirmar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>`,
  );
}

/**
 * Bloco de mídia no topo do header. Ele é o PRIMEIRO filho: é dessa ordem que
 * dependem a centralização do CSS e a leitura ícone → título → descrição.
 */
export function alertDialogWithMidiaSource(): string {
  return dialogo({ open: true, showMedia: true });
}

/** Confirmação neutra: a ação não herda a severidade destrutiva. */
export function alertDialogNeutralSource(): string {
  return dialogo({
    open: true,
    tone: 'default',
    triggerVariant: 'outline',
    triggerLabel: 'Sair da conta',
    title: 'Sair da conta',
    description: 'Você precisará entrar novamente para acessar seus dados.',
    actionLabel: 'Sair',
  });
}

/** Descrição longa: o painel cresce em altura e continua sendo a fonte da descrição acessível. */
export function alertDialogDescriptionLongaSource(): string {
  return dialogo({
    open: true,
    description:
      'Todos os seus dados, arquivos enviados, integrações ativas e o histórico completo de faturamento serão removidos permanentemente dos nossos servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança fica disponível depois da confirmação.',
  });
}

/**
 * Sem descrição: o título sozinho já diz o que se perde. Omitir o subcomponente
 * desde a montagem é o que mantém o painel sem referência pendurada.
 */
export function alertDialogNoDescriptionSource(): string {
  return dialogo({
    open: true,
    triggerLabel: 'Descartar rascunho',
    title: 'Descartar rascunho',
    description: null,
    actionLabel: 'Descartar',
  });
}

/**
 * Extensibilidade por classe: o painel e o bloco de mídia aceitam classes de
 * layout. Cor, largura máxima e espaçamento do painel não são extensíveis assim
 * — as utilitárias são importadas antes e perdem para a regra do componente.
 */
export function alertDialogClassNameExtraSource(): string {
  return dialogo({
    open: true,
    showMedia: true,
    contentClass: 'nds-overflow-hidden',
    mediaClass: 'nds-shrink-0',
  });
}
