/**
 * Transforms do painel Code do Drawer.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type DrawerArgs = {
  direction: 'bottom' | 'top' | 'left' | 'right';
  /** Estado inicial. A API real é `open`, que é ligável nos dois sentidos. */
  defaultOpen: boolean;
  open: boolean;
  dismissible: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  actionLabel: string;
  cancelLabel: string;
};

const IMPORT_BASE = `import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";`;

const IMPORT_COM_CORPO = `import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";`;

const IMPORT_COM_CAMPOS = `${IMPORT_COM_CORPO}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`;

type Moldura = {
  imports?: string;
  aberto?: boolean;
  direction?: DrawerArgs['direction'];
  dismissible?: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  /** Corpo entre o cabeçalho e o rodapé, já indentado em 4 espaços. */
  corpo?: string;
  actionLabel: string;
  cancelLabel: string;
};

/**
 * Estrutura comum a todas as composições: raiz com estado ligado, gatilho,
 * painel, cabeçalho, corpo opcional e rodapé com a ação e a saída.
 */
function painel({
  imports = IMPORT_BASE,
  aberto = false,
  direction = 'bottom',
  dismissible = true,
  triggerLabel,
  title,
  description,
  corpo = '',
  actionLabel,
  cancelLabel,
}: Moldura): string {
  const propsDaRaiz = attrs(
    direction === 'bottom' ? '' : `direction="${direction}"`,
    dismissible ? '' : 'dismissible={false}',
  );
  const miolo = corpo ? `\n${corpo}` : '';

  return svelteSnippet(
    `${imports}

let open = $state(${aberto});`,
    `<Drawer bind:open${propsDaRaiz}>
  <DrawerTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${triggerLabel}</Button>
    {/snippet}
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>${title}</DrawerTitle>
      <DrawerDescription>${description}</DrawerDescription>
    </DrawerHeader>${miolo}
    <DrawerFooter>
      <Button>${actionLabel}</Button>
      <DrawerClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>${cancelLabel}</Button>
        {/snippet}
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
  );
}

/** Forma canônica: painel deslizante com cabeçalho e par de ações no rodapé. */
export function drawerSource(_gerado?: string, ctx?: { args?: Partial<DrawerArgs> }): string {
  const {
    direction = 'bottom',
    defaultOpen = false,
    open,
    dismissible = true,
    triggerLabel = 'Abrir drawer',
    title = 'Editar perfil',
    description = 'Atualize seus dados pessoais e foto.',
    actionLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
  } = ctx?.args ?? {};

  return painel({
    aberto: open ?? defaultOpen,
    direction,
    dismissible,
    triggerLabel,
    title,
    description,
    actionLabel,
    cancelLabel,
  });
}

/** Composição com formulário curto no corpo, em painel lateral. */
export function drawerComFormularioSource(): string {
  return painel({
    imports: IMPORT_COM_CAMPOS,
    aberto: true,
    direction: 'right',
    triggerLabel: 'Editar dados',
    title: 'Editar dados pessoais',
    description: 'Atualize seu nome e e-mail.',
    corpo: `    <DrawerBody>
      <form class="nds-grid" data-spacing="sm">
        <div class="nds-grid" data-spacing="xs">
          <Label for="drawer-nome">Nome</Label>
          <Input id="drawer-nome" type="text" value="Maria Silva" />
        </div>
        <div class="nds-grid" data-spacing="xs">
          <Label for="drawer-email">E-mail</Label>
          <Input id="drawer-email" type="email" value="maria@exemplo.com" />
        </div>
      </form>
    </DrawerBody>`,
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
  });
}

/** Composição de confirmação reversível: mensagem curta e par de ações. */
export function drawerComConfirmacaoSource(): string {
  return painel({
    imports: IMPORT_COM_CORPO,
    aberto: true,
    triggerLabel: 'Remover anexo',
    title: 'Remover anexo?',
    description: 'O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.',
    corpo: `    <DrawerBody class="nds-text-body nds-text-muted-foreground">
      <p>Confirme a ação para prosseguir. Esta operação pode ser desfeita depois.</p>
    </DrawerBody>`,
    actionLabel: 'Remover',
    cancelLabel: 'Cancelar',
  });
}

/**
 * Corpo mais alto que o painel.
 *
 * Sem altura cravada: o corpo já rola dentro do teto de altura do painel, e é
 * ele quem cede altura — o rodapé com as ações continua visível.
 */
export function drawerComRolagemSource(): string {
  return painel({
    imports: IMPORT_COM_CORPO,
    aberto: true,
    triggerLabel: 'Ler termos',
    title: 'Termos de uso',
    description: 'Leia atentamente antes de aceitar.',
    corpo: `    <DrawerBody class="nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm">
      <p>Parágrafo 1: conteúdo extenso o bastante para o corpo passar da altura do painel.</p>
      <p>Parágrafo 2: quem rola é o corpo, e o rodapé continua alcançável.</p>
    </DrawerBody>`,
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  });
}
