import { describe, expect, it } from 'vitest';
import {
  alertDialogOpenSource,
  alertDialogCanceladoSource,
  alertDialogClassNameExtraSource,
  alertDialogWithMidiaSource,
  alertDialogConfirmadoSource,
  alertDialogControlledSource,
  alertDialogDescriptionLongaSource,
  alertDialogNeutralSource,
  alertDialogNoDescriptionSource,
  alertDialogHeadingH3Source,
  alertDialogSource,
} from './alert-dialog.source';

describe('alertDialogSource', () => {
  it('sem args, entrega a composição canônica fechada', () => {
    expect(alertDialogSource()).toBe(
      `<script lang="ts">
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
  import { Button } from "@/components/ui/button";

  let open = $state(false);
</script>

<AlertDialog bind:open>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="destructive">Excluir conta</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir conta</AlertDialogTitle>
      <AlertDialogDescription>Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
    );
  });

  it('o control de abertura chega ao estado inicial', () => {
    expect(alertDialogSource('', { args: { open: true } })).toContain('let open = $state(true);');
  });

  it('o control de severidade some quando é o valor padrão do Button', () => {
    const neutro = alertDialogSource('', { args: { tone: 'default' } });
    expect(neutro).not.toContain('variant=');
    expect(alertDialogSource('', { args: { tone: 'destructive' } })).toContain(
      'variant="destructive"',
    );
  });

  it('o control de mídia acrescenta o bloco E o import, sem sobrar nenhum dos dois', () => {
    const without = alertDialogSource('', { args: { showMedia: false } });
    expect(without).not.toContain('AlertDialogMedia');
    expect(without).not.toContain('triangle-alert');

    const withMedia = alertDialogSource('', { args: { showMedia: true } });
    expect(withMedia).toContain('    AlertDialogMedia,');
    expect(withMedia).toContain('icons/triangle-alert');
    // A mídia é o PRIMEIRO filho do header: é dessa ordem que dependem o CSS e
    // a leitura ícone → título → descrição.
    expect(withMedia).toContain(`<AlertDialogHeader>
      <AlertDialogMedia>`);
  });

  it('os rótulos dos controls chegam aos quatro pontos de texto', () => {
    const saida = alertDialogSource('', {
      args: {
        triggerLabel: 'Arquivar projeto',
        title: 'Arquivar projeto?',
        description: 'O projeto sai da lista ativa.',
        cancelLabel: 'Voltar',
        actionLabel: 'Arquivar',
      },
    });
    expect(saida).toContain('>Arquivar projeto</Button>');
    expect(saida).toContain('<AlertDialogTitle>Arquivar projeto?</AlertDialogTitle>');
    expect(saida).toContain('<AlertDialogDescription>O projeto sai da lista ativa.');
    expect(saida).toContain('<AlertDialogCancel>Voltar</AlertDialogCancel>');
    expect(saida).toContain('>Arquivar</AlertDialogAction>');
  });
});

describe('transforms das stories de estado', () => {
  it('o estado aberto monta o painel já na montagem', () => {
    const saida = alertDialogOpenSource();
    expect(saida).toContain('let open = $state(true);');
    expect(saida).toContain('Excluir item permanentemente?');
  });

  it('a confirmação declara o handler que o botão de ação aciona', () => {
    const saida = alertDialogConfirmadoSource();
    expect(saida).toContain('function excluirItem()');
    expect(saida).toContain('onclick={excluirItem}');
  });

  it('o cancelamento tem handler nas duas saídas, e só a de cancelar dispensa a ação', () => {
    const saida = alertDialogCanceladoSource();
    expect(saida).toContain('<AlertDialogCancel onclick={manterItem}>');
    expect(saida).toContain('onclick={excluirItem}');
  });

  it('o modo controlado tira o gatilho de dentro do diálogo', () => {
    const saida = alertDialogControlledSource();
    expect(saida).not.toContain('AlertDialogTrigger');
    expect(saida).toContain('onclick={() => (open = true)}');
    expect(saida).toContain('onOpenChange=');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição com mídia traz o bloco de ícone no topo do header', () => {
    const saida = alertDialogWithMidiaSource();
    expect(saida).toContain('<AlertDialogMedia>');
    expect(saida).toContain('<TriangleAlert aria-hidden="true" />');
  });

  it('a confirmação neutra não herda a severidade destrutiva', () => {
    const saida = alertDialogNeutralSource();
    expect(saida).toContain('variant="outline"');
    expect(saida).toContain('<AlertDialogAction>Sair</AlertDialogAction>');
    expect(saida).not.toContain('destructive');
  });

  it('a descrição longa continua num único subcomponente de descrição', () => {
    const saida = alertDialogDescriptionLongaSource();
    expect(saida).toContain('nenhuma cópia de segurança');
    expect(saida.match(/<AlertDialogDescription>/g)).toHaveLength(1);
  });

  it('sem descrição, nem o subcomponente nem o import sobram', () => {
    const saida = alertDialogNoDescriptionSource();
    expect(saida).not.toContain('AlertDialogDescription');
    expect(saida).toContain('<AlertDialogTitle>Descartar rascunho</AlertDialogTitle>');
  });

  it('o nível de cabeçalho sai por delegação de elemento, e só ele muda', () => {
    const saida = alertDialogHeadingH3Source();
    // `level` sozinho NÃO troca a tag nesta lib — troca o `aria-level` e deixa
    // um `div`. Quem devolve o elemento é o snippet `child`, e os dois vão
    // juntos para a tag e o ARIA concordarem. O snippet é o que se copia:
    // publicá-lo só com o `level` ensinaria um `div` com cara de cabeçalho.
    expect(saida).toContain('<AlertDialogTitle level={3}>');
    expect(saida).toContain('{#snippet child({ props })}');
    expect(saida).toContain('<h3 {...props}>Excluir conta</h3>');

    // E nada MAIS muda: desfeito o bloco do título, sobra o snippet canônico.
    // Sem esta parte o caso passaria com o painel inteiro reescrito, e o
    // exemplo deixaria de ensinar uma coisa só.
    expect(
      saida.replace(
        `<AlertDialogTitle level={3}>
        {#snippet child({ props })}
          <h3 {...props}>Excluir conta</h3>
        {/snippet}
      </AlertDialogTitle>`,
        '<AlertDialogTitle>Excluir conta</AlertDialogTitle>',
      ),
    ).toBe(alertDialogSource('', { args: { open: true } }));
  });
  it('a classe extra chega ao painel e ao bloco de mídia', () => {
    const saida = alertDialogClassNameExtraSource();
    expect(saida).toContain('<AlertDialogContent class="nds-overflow-hidden">');
    expect(saida).toContain('<AlertDialogMedia class="nds-shrink-0">');
  });
});
