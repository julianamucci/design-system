import { describe, expect, it } from 'vitest';
import {
  dialogActionDestructiveSource,
  dialogWithFormSource,
  dialogWithScrollSource,
  dialogOverlayScrollSource,
  dialogConfirmarEmailSource,
  dialogEditarPerfilSource,
  dialogPreviaDeMidiaSource,
  dialogNoFooterSource,
  dialogSource,
} from './dialog.source';

describe('dialogSource', () => {
  it('sem args, entrega a composição canônica fechada', () => {
    expect(dialogSource()).toBe(
      `<script lang="ts">
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";

  let open = $state(false);
</script>

<Dialog bind:open>
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
    <DialogFooter>
      <DialogClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancelar</Button>
        {/snippet}
      </DialogClose>
      <Button>Salvar alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    );
  });

  it('o control de abertura decide o valor inicial do estado ligado', () => {
    expect(dialogSource('', { args: { open: true } })).toContain('let open = $state(true);');
    expect(dialogSource('', { args: { open: false } })).toContain('let open = $state(false);');
  });

  it('só escreve showCloseButton quando o valor difere do padrão', () => {
    expect(dialogSource('', { args: { showCloseButton: true } })).not.toContain('showCloseButton');
    expect(dialogSource('', { args: { showCloseButton: false } })).toContain(
      '<DialogContent showCloseButton={false}>',
    );
  });

  it('os textos do painel acompanham os controls', () => {
    const saida = dialogSource('', {
      args: {
        triggerLabel: 'Convidar',
        title: 'Convidar para o time',
        description: 'Envie um convite por e-mail.',
        actionLabel: 'Enviar convite',
        cancelLabel: 'Recusar',
      },
    });
    expect(saida).toContain('>Convidar</Button>');
    expect(saida).toContain('<DialogTitle>Convidar para o time</DialogTitle>');
    expect(saida).toContain('<DialogDescription>Envie um convite por e-mail.</DialogDescription>');
    expect(saida).toContain('<Button>Enviar convite</Button>');
    expect(saida).toContain('>Recusar</Button>');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição com formulário traz os campos rotulados e o envio da ação primária', () => {
    const saida = dialogWithFormSource();
    expect(saida).toContain('from "@/components/ui/input"');
    expect(saida).toContain('<Label for="dialog-name">Nome</Label>');
    expect(saida).toContain('onsubmit={salvar}');
  });

  it('a composição com rolagem marca a região rolável como alcançável e nomeada', () => {
    const saida = dialogWithScrollSource();
    expect(saida).toContain('nds-dialog-body-scroll');
    expect(saida).toContain('tabindex="0"');
    expect(saida).toContain('aria-label="Termos e condições"');
  });

  it('as duas rotas de rolagem ensinam composições DIFERENTES', () => {
    // O defeito que esta guarda existe para pegar já aconteceu: as duas rotas
    // circularam sob o mesmo nome e três stacks mostravam uma, duas mostravam a
    // outra. Comparadas em PAR, o que separa é o markup.
    const rotaA = dialogWithScrollSource();
    const rotaB = dialogOverlayScrollSource();

    expect(rotaB).toContain('<DialogContent scroll>');
    expect(rotaB).not.toContain('nds-dialog-body-scroll');
    expect(rotaB).not.toContain('tabindex="0"');

    expect(rotaA).toContain('nds-dialog-body-scroll');
    expect(rotaA).not.toContain('<DialogContent scroll');
  });

  it('a composição sem rodapé não importa nem escreve as peças de rodapé', () => {
    const saida = dialogNoFooterSource();
    expect(saida).not.toContain('DialogFooter');
    expect(saida).not.toContain('DialogClose');
  });

  it('a ação destrutiva sai na variante destrutiva, e só ela', () => {
    const saida = dialogActionDestructiveSource();
    expect(saida).toContain('<Button variant="destructive">Remover item</Button>');
    expect(saida.match(/variant="destructive"/g)).toHaveLength(1);
  });

  it('o fluxo de confirmar email traz o campo de e-mail do próprio fluxo', () => {
    const saida = dialogConfirmarEmailSource();
    expect(saida).toContain('<Label for="confirm-new-email">Novo email</Label>');
    expect(saida).toContain('<Button>Enviar confirmação</Button>');
  });

  it('na edição de perfil o rodapé fica dentro do formulário, e o envio é submit', () => {
    const saida = dialogEditarPerfilSource();
    // O rodapé vem antes do fecho do formulário: é o que faz a ação primária
    // ser um envio de verdade em vez de um clique solto.
    expect(saida.indexOf('<DialogFooter>')).toBeLessThan(saida.indexOf('</form>'));
    expect(saida).toContain('<Button type="submit">Salvar alterações</Button>');
    expect(saida).toContain('<Button type="button" variant="outline" {...props}>Cancelar</Button>');
  });

  it('a prévia de mídia dá nome acessível ao bloco e dispensa o rodapé', () => {
    const saida = dialogPreviaDeMidiaSource();
    expect(saida).toContain('aria-label="Imagem ilustrativa de pôr-do-sol"');
    expect(saida).toContain('class="nds-sm-max-w-lg"');
    expect(saida).not.toContain('DialogFooter');
  });
});
