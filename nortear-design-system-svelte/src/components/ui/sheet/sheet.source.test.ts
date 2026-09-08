import { describe, expect, it } from 'vitest';
import {
  perfilSheetEditSource,
  sheetBottomPanelSource,
  sheetFiltersAvancadosSource,
  sheetNavegacaoSecundariaSource,
  sheetSource,
  sheetTermosWithScrollSource,
} from './sheet.source';

describe('sheetSource', () => {
  it('sem args, entrega o painel não controlado — o gatilho abre e fecha sozinho', () => {
    expect(sheetSource()).toBe(
      `<script lang="ts">
  import {
    Sheet,
    SheetBody,
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

    <SheetBody>
      <p class="nds-text-body nds-text-muted-foreground">
        Conteúdo do painel: formulário, lista ou mensagem. É esta área que rola quando o
        conteúdo passa da altura da tela.
      </p>
    </SheetBody>
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
    const isOpen = sheetSource('', { args: { open: true } });
    expect(isOpen).toContain('let open = $state(true);');
    expect(isOpen).toContain('<Sheet bind:open>');

    const closed = sheetSource('', { args: { open: false } });
    expect(closed).toContain('let open = $state(false);');
    expect(closed).toContain('<Sheet bind:open>');
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
    const saida = sheetFiltersAvancadosSource();
    expect(saida).toContain('<SheetBody>');
    expect(saida).toContain('import { Input } from "@/components/ui/input";');
    expect(saida).toContain('<Label for="sheet-categoria">Categoria</Label>');
    expect(saida).toContain('<Input id="sheet-categoria" value="Eletrônicos" />');
    // Empilhamento, e não grade: é o que a folha compartilhada define para
    // formulário de painel, e o que o Vanilla renderiza.
    expect(saida).toContain('<form id="filters" class="nds-stack" data-spacing="sm"');
    expect(saida).toContain('<div class="nds-stack" data-spacing="xs">');
    expect(saida).not.toContain('nds-grid');
    // Por ÍNDICE: são os DOIS campos que o conteúdo compartilhado documenta. O
    // snippet ensinava Nome e Email, que não são composição nenhuma.
    const rotulos = [...saida.matchAll(/<Label for="[^"]*">([^<]*)<\/Label>/g)].map((m) => m[1]);
    expect(rotulos).toEqual(['Categoria', 'Preço mínimo']);
  });

  it('religa a primária ao <form> pelo id, e só onde há formulário (D10)', () => {
    // O rodapé é IRMÃO do corpo rolável por construção do primitivo — é o que o
    // mantém visível enquanto o formulário rola —, então a primária nunca está
    // dentro do `<form>`. Sem `type="submit"` e sem o atributo `form`, o snippet
    // publicava um painel com formulário e NENHUMA forma de submeter: com dois
    // ou mais campos não há envio implícito, e o Enter não dispara nada. É a
    // ponta oposta do submit órfão, e igualmente silenciosa.
    for (const [saida, id] of [
      [sheetFiltersAvancadosSource(), 'filters'],
      [perfilSheetEditSource(), 'profile'],
    ] as const) {
      expect(saida).toContain(`<form id="${id}" class="nds-stack" data-spacing="sm" onsubmit={handleSubmit}>`);
      expect(saida).toContain(`form="${id}">`);
      // O manipulador é DECLARADO no snippet: sem ele, quem copia recebe um
      // `onsubmit` apontando para um símbolo que não existe.
      expect(saida).toContain('function handleSubmit(evento: SubmitEvent) {');
    }

    // Fora dos corpos com formulário não há o que submeter, e `type="submit"`
    // ali seria promessa vazia.
    for (const saida of [
      sheetSource(),
      sheetTermosWithScrollSource(),
      sheetBottomPanelSource(),
      sheetNavegacaoSecundariaSource(),
    ]) {
      expect(saida).not.toContain('type="submit"');
      expect(saida).not.toContain('handleSubmit');
    }
  });

  it('a navegação secundária publica as CINCO seções e o marco com nome', () => {
    const saida = sheetNavegacaoSecundariaSource();
    expect(saida).toContain('<SheetContent side="left">');
    expect(saida).toContain(
      "const secoes = ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas'];",
    );
    expect(saida).toContain('<nav aria-label="Navegação secundária" class="nds-stack" data-spacing="xs">');
    // Um menu não confirma nada: a saída é o X do canto.
    expect(saida).not.toContain('SheetFooter');
  });

  it('o painel inferior traz a fileira de ações e um rodapé só de saída', () => {
    const saida = sheetBottomPanelSource();
    expect(saida).toContain('<SheetContent side="bottom">');
    expect(saida).toContain('<div class="nds-cluster" data-spacing="md">');
    expect(saida).toContain('{#each acoes as acao (acao.label)}');
    expect(saida).toContain("{ label: 'Excluir', variant: 'destructive' },");
    expect(saida).toContain('<SheetFooter>');
    expect(saida).toContain('<Button variant="outline" {...props}>Fechar</Button>');
    // A decisão é a ação clicada: não há confirmação a repetir no rodapé.
    expect(saida).not.toContain('Aplicar filtros');
  });

  it('a edição de perfil traz os três campos, na ordem das outras stacks', () => {
    const saida = perfilSheetEditSource();
    expect(saida).toContain('<SheetTitle>Editar perfil</SheetTitle>');
    expect(saida).toContain('<Button type="submit" form="profile">Salvar alterações</Button>');
    // A primária SOLTA é o defeito: sem o religamento pelo `form`, o snippet
    // ensinava um painel com formulário e nenhuma forma de submeter.
    expect(saida).not.toContain('<Button>Salvar alterações</Button>');
    // Por ÍNDICE: a ordem é a das outras stacks, e o campo do meio já saiu do
    // snippet uma vez sem que nada reprovasse.
    const rotulos = [...saida.matchAll(/<Label for="[^"]*">([^<]*)<\/Label>/g)].map((m) => m[1]);
    expect(rotulos).toEqual(['Nome', 'Nome de usuário', 'Bio']);
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
