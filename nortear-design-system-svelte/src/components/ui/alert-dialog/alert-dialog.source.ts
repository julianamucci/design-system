/**
 * Transforms do painel Code do AlertDialog.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * O estado inicial publicado é FECHADO (`$state(false)`) em toda transform.
 * `$state(true)` só entra no trecho do PLAYGROUND, e só quando quem lê liga o
 * control `open`. As stories montam o painel aberto para a captura e a `play`
 * o encontrarem na tela — andaime, não ensinamento: quem cola quer o diálogo
 * comandado pelo gatilho. É a mesma política do `defaultOpen` nas stacks que
 * têm a prop; aqui o estado inicial sai do próprio `open`, que é bindável.
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
  /**
   * Nível do cabeçalho do título. Ausente, o snippet não escreve nível nenhum.
   */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  contentClass?: string;
  mediaClass?: string;
  /** Handler do consumidor no botão de confirmação (nome de função). */
  onAction?: string;
  /** Handler do consumidor no botão de cancelamento (nome de função). */
  onCancel?: string;
  /** Declarações extras do bloco `<script>` — as funções que os handlers apontam. */
  declarations?: string;
};

const DEFAULT: Composition = {
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
 * Título do painel, com o nível de cabeçalho quando ele é pedido.
 *
 * O `level` do primitivo troca a TAG e o `aria-level` juntos (o wrapper
 * escreve o `<hN>` pelo snippet `child` da lib), então quem copia não precisa
 * delegar nada. Sem nível pedido nada é escrito — o padrão é `h2`, e valor
 * padrão não se escreve num exemplo que alguém copia.
 */
function panelTitle(title: string, level?: 1 | 2 | 3 | 4 | 5 | 6): string {
  if (!level) return `<AlertDialogTitle>${title}</AlertDialogTitle>`;
  return `<AlertDialogTitle level={${level}}>${title}</AlertDialogTitle>`;
}

/**
 * Monta a composição inteira. Os subcomponentes opcionais (mídia, descrição)
 * entram na lista de imports só quando aparecem na marcação — import sobrando
 * num snippet copiável é erro de lint na casa de quem copiou.
 */
function composeDialog(partial: Partial<Composition> = {}): string {
  const c: Composition = { ...DEFAULT, ...partial };

  const names = [
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
${names.map((name) => `  ${name},`).join('\n')}
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";${
    c.showMedia ? '\nimport TriangleAlert from "@lucide/svelte/icons/triangle-alert";' : ''
  }

let open = $state(${c.open});${c.declarations ? `\n\n${c.declarations}` : ''}`;

  const media = c.showMedia
    ? `
      <AlertDialogMedia${attrs(c.mediaClass ? `class="${c.mediaClass}"` : '')}>
        <TriangleAlert aria-hidden="true" />
      </AlertDialogMedia>`
    : '';

  const descriptionBlock =
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
    <AlertDialogHeader>${media}
      ${panelTitle(c.title, c.titleLevel)}${descriptionBlock}
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
 * a mesma — estados fechado e aberto, confirmação destrutiva, layout
 * responsivo.
 */
export function alertDialogSource(
  _generated?: string,
  ctx?: { args?: Partial<AlertDialogArgs> },
): string {
  const a = ctx?.args ?? {};
  const tone = a.tone ?? DEFAULT.tone;
  return composeDialog({
    open: a.open ?? DEFAULT.open,
    tone,
    triggerVariant: tone,
    showMedia: a.showMedia ?? DEFAULT.showMedia,
    triggerLabel: a.triggerLabel ?? DEFAULT.triggerLabel,
    title: a.title ?? DEFAULT.title,
    // Control de descrição apagado = composição sem o subcomponente, igual à
    // tela: o wrapper da story tira a descrição quando o texto fica vazio.
    description: a.description === '' ? null : (a.description ?? DEFAULT.description),
    cancelLabel: a.cancelLabel ?? DEFAULT.cancelLabel,
    actionLabel: a.actionLabel ?? DEFAULT.actionLabel,
  });
}

/**
 * Painel aberto de dentro de uma seção que já está em `h2`: o título pede `h3`.
 *
 * A única diferença para a forma canônica é o nível do cabeçalho.
 */
export function alertDialogHeadingH3Source(): string {
  return composeDialog({ titleLevel: 3 });
}

/** Confirmação: o handler do consumidor vai no botão de ação, que fecha o painel. */
export function alertDialogConfirmedSource(): string {
  return composeDialog({
    onAction: 'deleteAccount',
    declarations: `function deleteAccount() {
  // A exclusão de verdade acontece aqui; o painel fecha sozinho em seguida.
}`,
  });
}

/** Cancelamento: sair pelo Cancelar fecha o painel sem executar a ação. */
export function alertDialogCancelledSource(): string {
  return composeDialog({
    onCancel: 'keepAccount',
    onAction: 'deleteAccount',
    declarations: `function deleteAccount() {
  // Só roda pela confirmação.
}

function keepAccount() {
  // Roda ao cancelar: a conta continua onde estava.
}`,
  });
}

/**
 * Abertura comandada de fora: o gatilho fica FORA do diálogo e escreve o estado
 * direto. `onOpenChange` é o componente PEDINDO a mudança — por isso só chega na
 * saída, por qualquer uma das três: Escape, Cancelar ou a ação que confirma.
 *
 * A ação NÃO escreve `open = false`: ela já fecha pelo caminho da lib, e
 * escrever antes faz a lib achar o diálogo fechado e sair sem avisar o pai —
 * a confirmação sumia do `onOpenChange`.
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
    ${DEFAULT.triggerLabel}
  </Button>

  <AlertDialog bind:open onOpenChange={(value) => console.log("open:", value)}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>${DEFAULT.title}</AlertDialogTitle>
        <AlertDialogDescription>
          ${DEFAULT.description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>${DEFAULT.cancelLabel}</AlertDialogCancel>
        <AlertDialogAction variant="destructive">${DEFAULT.actionLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>`,
  );
}

/**
 * Bloco de mídia no topo do header. Ele é o PRIMEIRO filho: é a ordem de
 * leitura ícone → título → descrição. A presença dele (e não a posição) é o
 * que o `:has()` da folha usa para centralizar a CAIXA do ícone no mobile.
 */
export function alertDialogWithIconSource(): string {
  return composeDialog({ showMedia: true });
}

/** Confirmação neutra: a ação não herda a severidade destrutiva. */
export function alertDialogNeutralSource(): string {
  return composeDialog({
    tone: 'default',
    triggerVariant: 'outline',
    triggerLabel: 'Sair da conta',
    title: 'Sair da conta',
    description: 'Você precisará entrar novamente para acessar seus dados.',
    actionLabel: 'Sair',
  });
}

/** Descrição longa: o painel cresce em altura e continua sendo a fonte da descrição acessível. */
export function alertDialogLongDescriptionSource(): string {
  return composeDialog({
    description:
      'Todos os seus dados, arquivos enviados, integrações ativas e o histórico completo de faturamento serão removidos permanentemente dos nossos servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança fica disponível depois da confirmação.',
  });
}

/**
 * Sem descrição: o título sozinho já diz o que se perde. Sem o subcomponente
 * o painel não declara `aria-describedby` — nem referência pendurada.
 */
export function alertDialogNoDescriptionSource(): string {
  return composeDialog({
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
  return composeDialog({
    showMedia: true,
    contentClass: 'nds-overflow-hidden',
    mediaClass: 'nds-shrink-0',
  });
}
