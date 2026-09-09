import { describe, expect, it } from 'vitest';
import {
  dialogActionDestructiveSource,
  dialogWithFormSource,
  dialogWithScrollSource,
  dialogConfirmarEmailSource,
  dialogEditarPerfilSource,
  dialogPreviaDeMidiaSource,
  dialogNoFooterSource,
  dialogCustomCloseSource,
  dialogHeadingH3Source,
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
    // Valores SINTÉTICOS de propósito: o que esta guarda mede é a substituição,
    // não um cenário. Os rótulos de cenário que moravam aqui ("Convidar para o
    // time") eram uma demo que só esta stack contava, e a medição cross-stack
    // os lia como conteúdo divergente.
    const saida = dialogSource('', {
      args: {
        triggerLabel: 'Gatilho',
        title: 'Título do painel',
        description: 'Descrição do painel.',
        actionLabel: 'Ação primária',
        cancelLabel: 'Ação secundária',
      },
    });
    expect(saida).toContain('>Gatilho</Button>');
    expect(saida).toContain('<DialogTitle>Título do painel</DialogTitle>');
    expect(saida).toContain('<DialogDescription>Descrição do painel.</DialogDescription>');
    expect(saida).toContain('<Button>Ação primária</Button>');
    expect(saida).toContain('>Ação secundária</Button>');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição com formulário traz os campos rotulados e o envio da ação primária', () => {
    const saida = dialogWithFormSource();
    expect(saida).toContain('from "@/components/ui/input"');
    expect(saida).toContain('<Label for="dialog-name">Nome</Label>');
    expect(saida).toContain('onsubmit={salvar}');
  });

  it('no snippet com formulário o rodapé fica DENTRO do form (PRD D10)', () => {
    // `type="submit"` fora do `<form>` é botão inerte, e o snippet é o que se
    // copia. A asserção é de ORDEM — abertura do form, rodapé, fechamento —, e
    // não a presença do atributo: o atributo sozinho é o que passava enquanto o
    // rodapé era irmão do formulário.
    const saida = dialogWithFormSource();
    const formOpensAt = saida.indexOf('<form ');
    const footerAt = saida.indexOf('<DialogFooter>');
    const formClosesAt = saida.indexOf('</form>');
    expect(formOpensAt).toBeGreaterThan(-1);
    expect(footerAt).toBeGreaterThan(formOpensAt);
    expect(formClosesAt).toBeGreaterThan(footerAt);
    expect(saida).toContain('<Button type="submit">Salvar alterações</Button>');
    // Dentro de um form o padrão do HTML é `submit`: o Cancelar precisa dizer
    // que é `button`, ou submete antes de fechar.
    expect(saida).toContain('<Button type="button" variant="outline" {...props}>Cancelar</Button>');
  });

  it('a composição com rolagem marca a região rolável como alcançável e nomeada', () => {
    const saida = dialogWithScrollSource();
    expect(saida).toContain('nds-dialog-body-scroll');
    expect(saida).toContain('tabindex="0"');
    expect(saida).toContain('aria-label="Termos de uso"');
  });

  it('não há rota de overlay rolando: nenhum snippet liga a prop `scroll`', () => {
    // A rota foi RETIRADA em 2026-09-08 (PRD D7), e o snippet é o que se copia:
    // um `<DialogContent scroll>` publicado aqui ensinaria uma prop que o
    // primitivo não tem mais. A guarda é sobre a AUSÊNCIA porque foi por
    // sobrevivência silenciosa que as duas rotas circularam sob o mesmo nome.
    const todos = [
      dialogSource(),
      dialogWithFormSource(),
      dialogWithScrollSource(),
      dialogNoFooterSource(),
      dialogCustomCloseSource(),
      dialogActionDestructiveSource(),
      dialogHeadingH3Source(),
    ];
    for (const saida of todos) {
      expect(saida).not.toContain('DialogContent scroll');
      expect(saida).not.toContain('nds-dialog-overlay-scroll');
      expect(saida).not.toContain('nds-dialog-content-scroll');
    }
  });

  it('a composição sem rodapé não importa nem escreve as peças de rodapé', () => {
    const saida = dialogNoFooterSource();
    expect(saida).not.toContain('DialogFooter');
    expect(saida).not.toContain('DialogClose');
    // O cenário é o da referência, e o gatilho repete o título: o painel não
    // tem outra ação, e o botão que o abre nomeia o mesmo assunto.
    expect(saida).toContain('<DialogTitle>Sobre este recurso</DialogTitle>');
    expect(saida).toContain('>Sobre este recurso</Button>');
    expect(saida).toContain(
      '<DialogDescription>Detalhes técnicos exibidos para fins informativos. Sem ações.</DialogDescription>',
    );
    expect(saida).toContain('O fechamento ocorre via X, Escape ou clique no overlay.');
  });

  it('com o X desligado, o fechar desce para o rodapé e a primária fecha a lista', () => {
    const saida = dialogCustomCloseSource();
    expect(saida).toContain('<DialogContent showCloseButton={false}>');
    // Quem emite o fechar é o próprio rodapé: a prop o coloca ANTES do conteúdo
    // e em `ghost`, a variante da ação terciária. Enquanto ela cravava
    // `outline`, todo call site a contornava com um `DialogClose` à mão — e a
    // prop ficou documentada sem uma story que a exercitasse.
    expect(saida).toContain('<DialogFooter showCloseButton>');
    expect(saida).not.toContain('DialogClose');
    // Valor padrão não se escreve: `closeLabel` já vale "Fechar".
    expect(saida).not.toContain('closeLabel');
    // A ORDEM é o assunto: secundários primeiro, primária por último no DOM.
    // Snippet que ensinasse o oposto da prévia ao lado seria pior que nenhum.
    const expectedOrder = [
      '<DialogFooter showCloseButton>',
      '>Voltar</Button>',
      '>Continuar</Button>',
    ];
    const positions = expectedOrder.map((fragment) => saida.indexOf(fragment));
    expect(positions.every((i) => i >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(saida).toContain('<Button variant="outline">Voltar</Button>');
    expect(saida).toContain('<Button>Continuar</Button>');
    expect(saida).toContain('O guia continua disponível no menu de ajuda.');
  });

  it('a ação destrutiva sai na variante destrutiva, e só ela', () => {
    const saida = dialogActionDestructiveSource();
    expect(saida).toContain('<Button variant="destructive">Remover item</Button>');
    expect(saida.match(/variant="destructive"/g)).toHaveLength(1);
  });

  it('o fluxo de confirmar email traz o campo de e-mail do próprio fluxo', () => {
    const saida = dialogConfirmarEmailSource();
    expect(saida).toContain('<Label for="confirm-new-email">Novo email</Label>');
    expect(saida).toContain('<Button>Enviar link</Button>');
  });

  it('na edição de perfil o rodapé fica dentro do formulário, e o envio é submit', () => {
    const saida = dialogEditarPerfilSource();
    // O rodapé vem antes do fecho do formulário: é o que faz a ação primária
    // ser um envio de verdade em vez de um clique solto.
    expect(saida.indexOf('<DialogFooter>')).toBeLessThan(saida.indexOf('</form>'));
    expect(saida).toContain('<Button type="submit">Salvar alterações</Button>');
    expect(saida).toContain('<Button type="button" variant="outline" {...props}>Cancelar</Button>');
  });

  it('o nível de cabeçalho sai por delegação de elemento, e só ele muda', () => {
    const saida = dialogHeadingH3Source();
    // `level` sozinho NÃO troca a tag nesta lib — troca o `aria-level` e deixa
    // um `div`. Quem devolve o elemento é o snippet `child`, e os dois vão
    // juntos para a tag e o ARIA concordarem. O snippet é o que se copia:
    // publicá-lo só com o `level` ensinaria um `div` com cara de cabeçalho.
    expect(saida).toContain('<DialogTitle level={3}>');
    expect(saida).toContain('{#snippet child({ props })}');
    expect(saida).toContain('<h3 {...props}>Editar perfil</h3>');

    // E nada MAIS muda: desfeito o bloco do título, sobra o snippet canônico.
    // Sem esta parte o caso passaria com o painel inteiro reescrito, e o
    // exemplo deixaria de ensinar uma coisa só.
    expect(
      saida.replace(
        `<DialogTitle level={3}>
        {#snippet child({ props })}
          <h3 {...props}>Editar perfil</h3>
        {/snippet}
      </DialogTitle>`,
        '<DialogTitle>Editar perfil</DialogTitle>',
      ),
    ).toBe(dialogSource('', { args: { open: true } }));
  });
  it('a prévia de mídia dá nome acessível ao bloco e dispensa o rodapé', () => {
    const saida = dialogPreviaDeMidiaSource();
    expect(saida).toContain('aria-label="Imagem ilustrativa de pôr-do-sol"');
    expect(saida).toContain('class="nds-sm-max-w-lg"');
    expect(saida).not.toContain('DialogFooter');
  });
});
