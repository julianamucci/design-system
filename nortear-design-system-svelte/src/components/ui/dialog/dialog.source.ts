/**
 * Transforms do painel Code do Dialog.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type DialogArgs = {
  open: boolean;
  showCloseButton: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  actionLabel: string;
  cancelLabel: string;
};

const IMPORT_BASE = `import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";`;

const IMPORT_WITH_FIELDS = `${IMPORT_BASE}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`;

/**
 * Rodapé cuja saída vem do `showCloseButton`: não há `DialogClose` escrito, e
 * import que o snippet não usa é ruído para quem copia.
 */
const IMPORT_NO_CLOSE = `import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";`;

/** Sem rodapé não há o que fechar por botão: as duas peças saem do import. */
const IMPORT_NO_FOOTER = `import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";`;

type Frame = {
  imports?: string;
  state?: string;
  isOpen?: boolean;
  showCloseButton?: boolean;
  /**
   * Nível do cabeçalho do título. Ausente, o snippet não escreve nível nenhum.
   */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  contentClass?: string;
  triggerLabel: string;
  title: string;
  description: string;
  /** Miolo entre o cabeçalho e o rodapé, já indentado em 4 espaços. */
  body?: string;
  /** Rodapé completo, já indentado em 4 espaços. Vazio significa sem rodapé. */
  footer?: string;
};

/**
 * Título do painel, com o nível de cabeçalho quando ele é pedido.
 *
 * A delegação vai pelo snippet `child`: nesta lib o `level` sozinho troca o
 * `aria-level` e mantém a TAG em `div`. Os dois andam juntos para a tag e o
 * ARIA concordarem. Sem nível pedido nada disso é escrito — valor padrão não
 * se escreve num exemplo que alguém copia.
 */
function panelTitle(title: string, level?: 1 | 2 | 3 | 4 | 5 | 6): string {
  if (!level) return `<DialogTitle>${title}</DialogTitle>`;
  return `<DialogTitle level={${level}}>
        {#snippet child({ props })}
          <h${level} {...props}>${title}</h${level}>
        {/snippet}
      </DialogTitle>`;
}

/**
 * Estrutura comum a todas as composições: raiz com estado ligado, gatilho,
 * painel, cabeçalho e — quando existe — corpo e rodapé.
 */
function dialogo({
  imports,
  isOpen = false,
  showCloseButton = true,
  titleLevel,
  contentClass,
  triggerLabel,
  title,
  description,
  body = '',
  footer = '',
}: Frame): string {
  const panelProps = attrs(
    contentClass ? `class="${contentClass}"` : '',
    showCloseButton ? '' : 'showCloseButton={false}',
  );
  // Sem corpo e sem rodapé o painel é só cabeçalho: nada de linha em branco
  // sobrando entre o fim do cabeçalho e o fecho do painel.
  const partes = [body, footer].filter(Boolean);
  const miolo = partes.length ? `\n${partes.join('\n')}` : '';

  return svelteSnippet(
    `${imports ?? (footer ? IMPORT_BASE : IMPORT_NO_FOOTER)}

let open = $state(${isOpen});`,
    `<Dialog bind:open>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${triggerLabel}</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent${panelProps}>
    <DialogHeader>
      ${panelTitle(title, titleLevel)}
      <DialogDescription>${description}</DialogDescription>
    </DialogHeader>${miolo}
  </DialogContent>
</Dialog>`,
  );
}

/** Rodapé canônico: a saída à esquerda, a ação primária por último no DOM. */
function footerDefault(cancelLabel: string, actionLabel: string, destrutiva = false): string {
  const actionVariant = destrutiva ? ' variant="destructive"' : '';
  return `    <DialogFooter>
      <DialogClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>${cancelLabel}</Button>
        {/snippet}
      </DialogClose>
      <Button${actionVariant}>${actionLabel}</Button>
    </DialogFooter>`;
}

/** Forma canônica: título, descrição e rodapé com cancelar mais ação primária. */
export function dialogSource(_gerado?: string, ctx?: { args?: Partial<DialogArgs> }): string {
  const {
    open = false,
    showCloseButton = true,
    triggerLabel = 'Editar perfil',
    title = 'Editar perfil',
    description = 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
    actionLabel = 'Salvar alterações',
    cancelLabel = 'Cancelar',
  } = ctx?.args ?? {};

  return dialogo({
    isOpen: open,
    showCloseButton,
    triggerLabel,
    title,
    description,
    footer: footerDefault(cancelLabel, actionLabel),
  });
}

/**
 * Painel aberto de dentro de uma seção que já está em `h2`: o título pede `h3`.
 *
 * A única diferença para a forma canônica é o nível do cabeçalho.
 */
export function dialogHeadingH3Source(): string {
  return dialogo({
    isOpen: true,
    titleLevel: 3,
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
    footer: footerDefault('Cancelar', 'Salvar alterações'),
  });
}

/**
 * Composição com formulário no corpo: o envio dispara a ação primária.
 *
 * O `<form>` envolve o corpo E o RODAPÉ (PRD D10), e a primária é
 * `type="submit"` dentro dele. Fora do form o `submit` é botão inerte — não
 * submete e o Enter num campo não dispara nada —, e o snippet é o que se copia:
 * publicá-lo com o rodapé de fora ensinaria o defeito.
 */
export function dialogWithFormSource(): string {
  return svelteSnippet(
    `${IMPORT_WITH_FIELDS}

let open = $state(true);

function salvar(evento: SubmitEvent) {
  evento.preventDefault();
}`,
    `<Dialog bind:open>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Editar perfil</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>Atualize suas informações pessoais. As mudanças são salvas ao confirmar.</DialogDescription>
    </DialogHeader>
    <form class="nds-grid" data-spacing="sm" onsubmit={salvar}>
      <div class="nds-grid" data-spacing="xs">
        <Label for="dialog-name">Nome</Label>
        <Input id="dialog-name" value="Maria Silva" />
      </div>
      <div class="nds-grid" data-spacing="xs">
        <Label for="dialog-email">E-mail</Label>
        <Input id="dialog-email" type="email" value="maria@exemplo.com" />
      </div>
      <DialogFooter>
        <DialogClose>
          {#snippet child({ props })}
            <Button type="button" variant="outline" {...props}>Cancelar</Button>
          {/snippet}
        </DialogClose>
        <Button type="submit">Salvar alterações</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>`,
  );
}

/**
 * Corpo mais alto que o painel: a rolagem é do corpo, e o cabeçalho e o rodapé
 * ficam parados. A região rolável precisa de `tabindex` e de nome acessível — e
 * o papel é `group`, não `region`: marco aninhado num diálogo já nomeado não
 * acrescenta navegação. Era `region` aqui e `group` na prévia ao lado; o
 * snippet é o que se copia, então o par tinha de fechar.
 */
export function dialogWithScrollSource(): string {
  return dialogo({
    isOpen: true,
    triggerLabel: 'Termos de uso',
    title: 'Termos de uso',
    description: 'Leia atentamente antes de aceitar.',
    body: `    <div
      class="nds-dialog-body nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground"
      data-slot="dialog-body"
      data-spacing="sm"
      tabindex="0"
      role="group"
      aria-label="Termos de uso"
    >
      <p>Parágrafo 1: conteúdo extenso o bastante para o corpo passar da altura disponível.</p>
      <p>Parágrafo 2: a rolagem é do corpo, e não da página atrás do painel.</p>
    </div>`,
    footer: footerDefault('Recusar', 'Aceitar'),
  });
}

/** Corpo de texto corrido entre o cabeçalho e o rodapé, já indentado em 4. */
function bodyBlock(text: string): string {
  return `    <div class="nds-dialog-body nds-text-body nds-text-muted-foreground" data-slot="dialog-body">
      ${text}
    </div>`;
}

/** Sem rodapé: painel informativo, cuja única saída visível é o botão do canto. */
export function dialogNoFooterSource(): string {
  return dialogo({
    isOpen: true,
    triggerLabel: 'Sobre este recurso',
    title: 'Sobre este recurso',
    description: 'Detalhes técnicos exibidos para fins informativos. Sem ações.',
    body: bodyBlock('O fechamento ocorre via X, Escape ou clique no overlay.'),
  });
}

/**
 * X do canto desligado: o fechar desce para o rodapé, ao lado das outras ações.
 *
 * A ordem é a do sistema, e é a MESMA do render da story: secundários antes,
 * primária por último no DOM. `.nds-dialog-footer` empilha ao contrário no
 * estreito e alinha à direita no largo — das duas leituras sai a primária em
 * cima e à direita. Snippet que ensinasse o oposto da prévia ao lado seria pior
 * que snippet nenhum.
 *
 * Quem emite o "Fechar" é o `showCloseButton` do RODAPÉ: ele o põe antes do
 * conteúdo e em `ghost`, que é a variante da ação TERCIÁRIA na tabela da
 * guideline 06 — e é o que põe as três ações em escala. Enquanto a prop cravava
 * `outline`, o fechar saía com o mesmo peso do "Voltar" ao lado, e todo call
 * site a contornava escrevendo um `DialogClose` à mão.
 *
 * `closeLabel` não aparece: o padrão já é "Fechar", e valor padrão não se
 * escreve num snippet que alguém copia.
 */
export function dialogCustomCloseSource(): string {
  return dialogo({
    imports: IMPORT_NO_CLOSE,
    isOpen: true,
    showCloseButton: false,
    triggerLabel: 'Abrir guia',
    title: 'Próximos passos',
    description: 'Continue o fluxo ou volte ao início.',
    body: bodyBlock('O guia continua disponível no menu de ajuda.'),
    footer: `    <DialogFooter showCloseButton>
      <Button variant="outline">Voltar</Button>
      <Button>Continuar</Button>
    </DialogFooter>`,
  });
}

/** Ação primária destrutiva, para destrutividade secundária ao fluxo. */
export function dialogActionDestructiveSource(): string {
  return dialogo({
    isOpen: true,
    triggerLabel: 'Remover item',
    title: 'Remover item da lista',
    description: 'O item sai desta lista e continua disponível no catálogo.',
    footer: footerDefault('Cancelar', 'Remover item', true),
  });
}

/** Composição de produto: confirmar a troca de e-mail, com um campo no corpo. */
export function dialogConfirmarEmailSource(): string {
  return svelteSnippet(
    `${IMPORT_WITH_FIELDS}

let open = $state(true);`,
    `<Dialog bind:open>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Confirmar e-mail</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmar e-mail</DialogTitle>
      <DialogDescription>
        Enviaremos um link de confirmação para o novo endereço. O email atual continua ativo até a confirmação.
      </DialogDescription>
    </DialogHeader>
    <div class="nds-grid" data-spacing="xs">
      <Label for="confirm-new-email">Novo email</Label>
      <Input id="confirm-new-email" type="email" placeholder="voce@example.com" />
    </div>
${footerDefault('Cancelar', 'Enviar link')}
  </DialogContent>
</Dialog>`,
  );
}

/**
 * Composição de produto: edição de perfil.
 *
 * O rodapé fica DENTRO do formulário para que a ação primária seja um envio de
 * verdade — e o cancelar leva `type="button"` para não enviar nada.
 */
export function dialogEditarPerfilSource(): string {
  return svelteSnippet(
    `${IMPORT_WITH_FIELDS}

let open = $state(true);

function salvar(evento: SubmitEvent) {
  evento.preventDefault();
}`,
    `<Dialog bind:open>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Editar perfil</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent class="nds-sm-max-w-md">
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais. As mudanças são salvas ao confirmar.
      </DialogDescription>
    </DialogHeader>
    <form class="nds-grid" data-spacing="sm" onsubmit={salvar}>
      <div class="nds-grid" data-spacing="xs">
        <Label for="profile-name">Nome completo</Label>
        <Input id="profile-name" value="Maria Silva" />
      </div>
      <div class="nds-grid" data-spacing="xs">
        <Label for="profile-username">Nome de usuário</Label>
        <Input id="profile-username" value="@mariasilva" />
      </div>
      <DialogFooter>
        <DialogClose>
          {#snippet child({ props })}
            <Button type="button" variant="outline" {...props}>Cancelar</Button>
          {/snippet}
        </DialogClose>
        <Button type="submit">Salvar alterações</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>`,
  );
}

/** Composição de produto: mídia em destaque, sem rodapé porque não há o que confirmar. */
export function dialogPreviaDeMidiaSource(): string {
  return dialogo({
    isOpen: true,
    contentClass: 'nds-sm-max-w-lg',
    triggerLabel: 'Ver imagem',
    title: 'Pôr-do-sol na praia',
    description: 'Captura realizada em outubro de 2026, costa norte.',
    body: `    <div
      data-slot="dialog-body"
      role="img"
      aria-label="Imagem ilustrativa de pôr-do-sol"
      class="nds-dialog-body nds-aspect-16-9 nds-w-full nds-rounded-md nds-bg-muted nds-cluster nds-text-caption nds-text-muted-foreground"
      data-align="center"
      data-justify="center"
    >
      Pré-visualização da mídia
    </div>`,
  });
}
