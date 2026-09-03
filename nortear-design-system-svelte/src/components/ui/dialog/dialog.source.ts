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
  contentClass?: string;
  triggerLabel: string;
  title: string;
  description: string;
  /** Miolo entre o cabeçalho e o rodapé, já indentado em 4 espaços. */
  body?: string;
  /** Rodapé completo, já indentado em 4 espaços. Vazio significa sem rodapé. */
  footer?: string;
  /** Rota B: o painel entra no fluxo do overlay, e o overlay é quem rola. */
  scroll?: boolean;
};

/**
 * Estrutura comum a todas as composições: raiz com estado ligado, gatilho,
 * painel, cabeçalho e — quando existe — corpo e rodapé.
 */
function dialogo({
  imports,
  isOpen = false,
  showCloseButton = true,
  contentClass,
  triggerLabel,
  title,
  description,
  body = '',
  footer = '',
  scroll = false,
}: Frame): string {
  const panelProps = attrs(
    scroll ? 'scroll' : '',
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
      <DialogTitle>${title}</DialogTitle>
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

/** Composição com formulário no corpo: o envio dispara a ação primária. */
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
      <Button variant="outline" {...props}>Editar dados</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar dados pessoais</DialogTitle>
      <DialogDescription>Atualize seu nome e e-mail.</DialogDescription>
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
    </form>
${footerDefault('Cancelar', 'Salvar')}
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
    title: 'Termos e condições',
    description: 'Leia atentamente antes de aceitar.',
    body: `    <div
      class="nds-dialog-body nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground"
      data-slot="dialog-body"
      data-spacing="sm"
      tabindex="0"
      role="group"
      aria-label="Termos e condições"
    >
      <p>Parágrafo 1: conteúdo extenso o bastante para o corpo passar da altura disponível.</p>
      <p>Parágrafo 2: a rolagem é do corpo, e não da página atrás do painel.</p>
    </div>`,
    footer: footerDefault('Recusar', 'Aceitar'),
  });
}

/**
 * Rota B — o overlay é quem rola, e o painel entra no fluxo dele.
 *
 * O contrário da rota acima: aqui o cabeçalho NÃO fica parado, ele sobe junto
 * com o conteúdo. Não há região rolável aninhada, então também não há
 * `tabindex`, papel nem nome a declarar — quem rola é o overlay, e ele já está
 * na ordem natural da página.
 *
 * A forma é uma prop booleana do Content porque nesta stack o Content já monta
 * o overlay: ligar as duas classes de uma vez é o que evita um segundo
 * componente que só existiria para repetir o resto.
 */
export function dialogOverlayScrollSource(): string {
  return dialogo({
    isOpen: true,
    scroll: true,
    triggerLabel: 'Ver contrato',
    title: 'Contrato de prestação',
    description: 'O documento rola inteiro, e o cabeçalho sobe junto.',
    body: `    <div
      class="nds-dialog-body nds-stack nds-text-body nds-text-muted-foreground"
      data-slot="dialog-body"
      data-spacing="sm"
    >
      <p>Cláusula 1: o painel entra no fluxo do overlay, e o overlay é quem rola.</p>
      <p>Cláusula 2: o cabeçalho sobe junto com o conteúdo e sai da tela.</p>
    </div>`,
    footer: footerDefault('Recusar', 'Aceitar'),
  });
}

/** Sem rodapé: painel informativo, cuja única saída visível é o botão do canto. */
export function dialogNoFooterSource(): string {
  return dialogo({
    isOpen: true,
    triggerLabel: 'Sobre o produto',
    title: 'Sobre este produto',
    description:
      'Plataforma de design system multi-stack mantida pela equipe de Engenharia. Atualizada continuamente.',
  });
}

/** Ação primária destrutiva, para destrutividade secundária ao fluxo. */
export function dialogActionDestructiveSource(): string {
  return dialogo({
    isOpen: true,
    triggerLabel: 'Remover item',
    title: 'Remover item da lista',
    description: 'Você pode adicioná-lo novamente depois, mas perderá os ajustes feitos.',
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
      <Button variant="outline" {...props}>Confirmar email</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmar novo email</DialogTitle>
      <DialogDescription>
        Enviaremos um link de confirmação para o novo endereço. O email atual continua ativo até a confirmação.
      </DialogDescription>
    </DialogHeader>
    <div class="nds-grid" data-spacing="xs">
      <Label for="confirm-new-email">Novo email</Label>
      <Input id="confirm-new-email" type="email" placeholder="voce@example.com" />
    </div>
${footerDefault('Cancelar', 'Enviar confirmação')}
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
