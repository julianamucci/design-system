import { describe, expect, it } from 'vitest';
import {
  perfilSheetEditSource,
  sheetBottomPanelSource,
  sheetControlledSource,
  sheetFiltersAvancadosSource,
  sheetHeadingH3Source,
  sheetNavegacaoSecundariaSource,
  sheetSecondPanelSource,
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
    const output = sheetSource('', {
      args: {
        triggerLabel: 'Abrir menu',
        title: 'Painel esquerdo',
        description: 'Acesse seções adicionais sem trocar de página.',
        actionLabel: 'Ver todas',
        cancelLabel: 'Fechar',
      },
    });
    expect(output).toContain('>Abrir menu</Button>');
    expect(output).toContain('<SheetTitle>Painel esquerdo</SheetTitle>');
    expect(output).toContain(
      '<SheetDescription>Acesse seções adicionais sem trocar de página.</SheetDescription>',
    );
    expect(output).toContain('>Fechar</Button>');
    expect(output).toContain('<Button>Ver todas</Button>');
  });
});

describe('transforms das stories de composição', () => {
  it('os filtros avançados trazem o formulário no corpo do painel', () => {
    const output = sheetFiltersAvancadosSource();
    expect(output).toContain('<SheetBody>');
    expect(output).toContain('import { Input } from "@/components/ui/input";');
    expect(output).toContain('<Label for="sheet-categoria">Categoria</Label>');
    expect(output).toContain('<Input id="sheet-categoria" value="Eletrônicos" />');
    // Empilhamento, e não grade: é o que a folha compartilhada define para
    // formulário de painel, e o que o Vanilla renderiza.
    expect(output).toContain('<form id="filters" class="nds-stack" data-spacing="sm"');
    expect(output).toContain('<div class="nds-stack" data-spacing="xs">');
    expect(output).not.toContain('nds-grid');
    // Por ÍNDICE: são os DOIS campos que o conteúdo compartilhado documenta. O
    // snippet ensinava Nome e Email, que não são composição nenhuma.
    const rotulos = [...output.matchAll(/<Label for="[^"]*">([^<]*)<\/Label>/g)].map((m) => m[1]);
    expect(rotulos).toEqual(['Categoria', 'Preço mínimo']);
  });

  it('religa a primária ao <form> pelo id, e só onde há formulário (D9)', () => {
    // O rodapé é IRMÃO do corpo rolável por construção do primitivo — é o que o
    // mantém visível enquanto o formulário rola —, então a primária nunca está
    // dentro do `<form>`. Sem `type="submit"` e sem o atributo `form`, o snippet
    // publicava um painel com formulário e NENHUMA forma de submeter: com dois
    // ou mais campos não há envio implícito, e o Enter não dispara nada. É a
    // ponta oposta do submit órfão, e igualmente silenciosa.
    for (const [output, id] of [
      [sheetFiltersAvancadosSource(), 'filters'],
      [perfilSheetEditSource(), 'profile'],
    ] as const) {
      expect(output).toContain(`<form id="${id}" class="nds-stack" data-spacing="sm" onsubmit={handleSubmit}>`);
      expect(output).toContain(`form="${id}">`);
      // O manipulador é DECLARADO no snippet: sem ele, quem copia recebe um
      // `onsubmit` apontando para um símbolo que não existe.
      expect(output).toContain('function handleSubmit(evento: SubmitEvent) {');
    }

    // Fora dos corpos com formulário não há o que submeter, e `type="submit"`
    // ali seria promessa vazia.
    for (const output of [
      sheetSource(),
      sheetTermosWithScrollSource(),
      sheetBottomPanelSource(),
      sheetNavegacaoSecundariaSource(),
      sheetHeadingH3Source(),
      sheetControlledSource(),
      sheetSecondPanelSource(),
    ]) {
      expect(output).not.toContain('type="submit"');
      expect(output).not.toContain('handleSubmit');
    }
  });

  it('a navegação secundária publica as CINCO seções e o marco com nome', () => {
    const output = sheetNavegacaoSecundariaSource();
    expect(output).toContain('<SheetContent side="left">');
    expect(output).toContain(
      "const secoes = ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas'];",
    );
    expect(output).toContain('<nav aria-label="Navegação secundária" class="nds-stack" data-spacing="xs">');
    // Um menu não confirma nada: a saída é o X do canto.
    expect(output).not.toContain('SheetFooter');
  });

  it('o painel inferior traz a fileira de ações e um rodapé só de saída', () => {
    const output = sheetBottomPanelSource();
    expect(output).toContain('<SheetContent side="bottom">');
    expect(output).toContain('<div class="nds-cluster" data-spacing="md">');
    expect(output).toContain('{#each acoes as acao (acao.label)}');
    expect(output).toContain("{ label: 'Excluir', variant: 'destructive' },");
    expect(output).toContain('<SheetFooter>');
    expect(output).toContain('<Button variant="outline" {...props}>Fechar</Button>');
    // A decisão é a ação clicada: não há confirmação a repetir no rodapé.
    expect(output).not.toContain('Aplicar filtros');
  });

  it('o nível de cabeçalho sai por delegação de elemento, e só ele muda', () => {
    const output = sheetHeadingH3Source();
    // `level` sozinho NÃO troca a tag nesta lib — troca o `aria-level` e deixa
    // um `div`. Quem devolve o elemento é o snippet `child`, e os dois vão
    // juntos para a tag e o ARIA concordarem. O snippet é o que se copia:
    // publicá-lo só com o `level` ensinaria um `div` com cara de cabeçalho.
    expect(output).toContain('<SheetTitle level={3}>');
    expect(output).toContain('{#snippet child({ props })}');
    expect(output).toContain('<h3 {...props}>Filtros avançados</h3>');

    // E nada MAIS muda: desfeito o bloco do título, sobra o snippet canônico.
    // Sem esta parte o caso passaria com o painel inteiro reescrito, e o
    // exemplo deixaria de ensinar uma coisa só.
    expect(
      output.replace(
        `<SheetTitle level={3}>
        {#snippet child({ props })}
          <h3 {...props}>Filtros avançados</h3>
        {/snippet}
      </SheetTitle>`,
        '<SheetTitle>Filtros avançados</SheetTitle>',
      ),
    ).toBe(sheetSource('', { args: { open: true } }));
  });
  it('a edição de perfil traz os três campos, na ordem das outras stacks', () => {
    const output = perfilSheetEditSource();
    expect(output).toContain('<SheetTitle>Editar perfil</SheetTitle>');
    expect(output).toContain('<Button type="submit" form="profile">Salvar alterações</Button>');
    // A primária SOLTA é o defeito: sem o religamento pelo `form`, o snippet
    // ensinava um painel com formulário e nenhuma forma de submeter.
    expect(output).not.toContain('<Button>Salvar alterações</Button>');
    // Por ÍNDICE: a ordem é a das outras stacks, e o campo do meio já saiu do
    // snippet uma vez sem que nada reprovasse.
    const rotulos = [...output.matchAll(/<Label for="[^"]*">([^<]*)<\/Label>/g)].map((m) => m[1]);
    expect(rotulos).toEqual(['Nome', 'Nome de usuário', 'Bio']);
  });

  it('os termos com rolagem deixam o corpo rolar, e o rodapé fica', () => {
    const output = sheetTermosWithScrollSource();
    // O corpo é peça do componente: quem traz o overflow e o tabindex da região
    // rolável é o SheetBody, não um contêiner improvisado na página.
    expect(output).toContain('<SheetBody class="nds-stack');
    expect(output).toContain('{#each paragrafos as paragrafo (paragrafo)}');
    // Os rótulos são os do Vanilla, literais — gatilho, título e as duas ações.
    // Este exemplo é comparado lado a lado nas cinco páginas, e quatro das cinco
    // palavras eram outras aqui.
    expect(output).toContain('<Button variant="outline" {...props}>Ler termos</Button>');
    expect(output).toContain('<SheetTitle>Termos de uso</SheetTitle>');
    expect(output).toContain('<Button variant="outline" {...props}>Cancelar</Button>');
    expect(output).toContain('<Button>Aceitar termos</Button>');
    // O NOME do corpo vai junto com a rolagem: sem ele o `SheetBody` não emite
    // `role="group"`, e o exemplo ensinaria a metade que o axe não acusa (C7).
    expect(output).toContain('aria-label="Termos de uso"');
    // Vinte e quatro, como no Vanilla: com catorze o corpo só rola em painel
    // baixo, e o exemplo deixa de mostrar o que diz mostrar.
    expect(output).toContain('{ length: 24 },');
  });

  it('o painel controlado abre por ESTADO, e não publica gatilho nenhum', () => {
    const output = sheetControlledSource();
    expect(output).toContain('let open = $state(false);');
    expect(output).toContain('<Sheet bind:open>');
    // O assunto do exemplo é a AUSÊNCIA do gatilho do componente: quem abre é o
    // botão de quem consome, e ele anuncia o diálogo por conta própria.
    expect(output).not.toContain('SheetTrigger');
    expect(output).toContain('<Button aria-haspopup="dialog"');
  });

  it('os dois painéis ficam lado a lado, e o segundo é controlado por estado', () => {
    const output = sheetSecondPanelSource();
    expect(output).toContain('let secondOpen = $state(false);');
    expect(output).toContain('<SheetContent side="left">');
    // O segundo painel é CONTROLADO: com um painel modal na tela o clique no
    // gatilho irmão não chega, e quem o abre de verdade é o estado.
    expect(output).toContain('<Sheet bind:open={secondOpen}>');
    expect(output).toContain('<SheetTitle>Segundo painel</SheetTitle>');
    // Os dois gatilhos, como na referência.
    expect(output.match(/<SheetTrigger>/g)).toHaveLength(2);
  });
});
