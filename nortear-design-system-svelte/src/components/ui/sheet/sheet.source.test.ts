import { describe, expect, it } from 'vitest';
import {
  perfilSourceSheetEdit,
  sheetFiltrosAvancadosSource,
  sheetSource,
  sheetTermosWithScrollSource,
} from './sheet.source';

describe('sheetSource', () => {
  it('sem args, entrega o painel não controlado — o gatilho abre e fecha sozinho', () => {
    expect(sheetSource()).toBe(
      `<script lang="ts">
  import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet";
  import { Button } from "@/components/ui/button";
</script>

<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir filtros</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancelar</Button>
        {/snippet}
      </SheetClose>
      <Button>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
    );
  });

  it('o control de direção chega ao conteúdo, que é onde side mora', () => {
    expect(sheetSource('', { args: { side: 'left' } })).toContain('<SheetContent side="left">');
    expect(sheetSource('', { args: { side: 'bottom' } })).toContain('<SheetContent side="bottom">');
  });

  it('só escreve showCloseButton quando o botão do canto é dispensado', () => {
    expect(sheetSource('', { args: { showCloseButton: true } })).not.toContain('showCloseButton');
    expect(sheetSource('', { args: { showCloseButton: false } })).toContain(
      'showCloseButton={false}',
    );
  });

  it('o arg open transforma o painel em controlado, nos dois valores', () => {
    const aberto = sheetSource('', { args: { open: true } });
    expect(aberto).toContain('let open = $state(true);');
    expect(aberto).toContain('<Sheet bind:open>');

    const fechado = sheetSource('', { args: { open: false } });
    expect(fechado).toContain('let open = $state(false);');
    expect(fechado).toContain('<Sheet bind:open>');
  });

  it('os textos dos controls chegam ao gatilho, ao título e ao rodapé', () => {
    const saida = sheetSource('', {
      args: {
        triggerLabel: 'Abrir menu',
        title: 'Painel esquerdo',
        description: 'Acesse seções adicionais sem trocar de página.',
        actionLabel: 'Ver todas',
        cancelLabel: 'Fechar',
      },
    });
    expect(saida).toContain('>Abrir menu</Button>');
    expect(saida).toContain('<SheetTitle>Painel esquerdo</SheetTitle>');
    expect(saida).toContain(
      '<SheetDescription>Acesse seções adicionais sem trocar de página.</SheetDescription>',
    );
    expect(saida).toContain('>Fechar</Button>');
    expect(saida).toContain('<Button>Ver todas</Button>');
  });
});

describe('transforms das stories de composição', () => {
  it('os filtros avançados trazem o formulário no corpo do painel', () => {
    const saida = sheetFiltrosAvancadosSource();
    expect(saida).toContain('<SheetBody>');
    expect(saida).toContain('import { Input } from "@/components/ui/input";');
    expect(saida).toContain('<Label for="sheet-nome">Nome</Label>');
  });

  it('a edição de perfil muda a decisão do rodapé, não a estrutura', () => {
    const saida = perfilSourceSheetEdit();
    expect(saida).toContain('<SheetTitle>Editar perfil</SheetTitle>');
    expect(saida).toContain('<Button>Salvar alterações</Button>');
  });

  it('os termos com rolagem deixam o corpo rolar, e o rodapé fica', () => {
    const saida = sheetTermosWithScrollSource();
    // O corpo é peça do componente: quem traz o overflow e o tabindex da região
    // rolável é o SheetBody, não um contêiner improvisado na página.
    expect(saida).toContain('<SheetBody class="nds-stack');
    expect(saida).toContain('{#each paragrafos as paragrafo (paragrafo)}');
    expect(saida).toContain('<Button>Aceitar</Button>');
  });
});
