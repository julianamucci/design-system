import { describe, expect, it } from 'vitest';
import {
  alertDialogCancelledSource,
  alertDialogClassNameExtraSource,
  alertDialogWithIconSource,
  alertDialogConfirmedSource,
  alertDialogControlledSource,
  alertDialogLongDescriptionSource,
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
    const neutral = alertDialogSource('', { args: { tone: 'default' } });
    expect(neutral).not.toContain('variant=');
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
    // A mídia é o PRIMEIRO filho do header, pela leitura ícone → título →
    // descrição. O CSS NÃO depende da ordem: a folha usa
    // `:has(.nds-alert-dialog-media)`, que lê presença em qualquer posição.
    // Até 2026-09-12 este comentário dava o CSS como dependente da ordem — a
    // última sobrevivente de catorze; o portão `afirmacao_de_has_sobre_ordem`
    // não a alcançava, porque ela não nomeia o `:has(`.
    expect(withMedia).toContain(`<AlertDialogHeader>
      <AlertDialogMedia>`);
  });

  it('os rótulos dos controls chegam aos quatro pontos de texto', () => {
    const output = alertDialogSource('', {
      args: {
        triggerLabel: 'Arquivar projeto',
        title: 'Arquivar projeto?',
        description: 'O projeto sai da lista ativa.',
        cancelLabel: 'Voltar',
        actionLabel: 'Arquivar',
      },
    });
    expect(output).toContain('>Arquivar projeto</Button>');
    expect(output).toContain('<AlertDialogTitle>Arquivar projeto?</AlertDialogTitle>');
    expect(output).toContain('<AlertDialogDescription>O projeto sai da lista ativa.');
    expect(output).toContain('<AlertDialogCancel>Voltar</AlertDialogCancel>');
    expect(output).toContain('>Arquivar</AlertDialogAction>');
  });
});

describe('transforms das stories de estado', () => {
  it('nenhuma transform publica o diálogo nascendo aberto', () => {
    // Quem cola quer o diálogo comandado pelo gatilho; o painel aberto das
    // stories é andaime da captura e da play, não ensinamento. O único
    // `$state(true)` possível é o do Playground com o control `open` ligado.
    const closedOutputs = [
      alertDialogSource(),
      alertDialogConfirmedSource(),
      alertDialogCancelledSource(),
      alertDialogControlledSource(),
      alertDialogWithIconSource(),
      alertDialogNeutralSource(),
      alertDialogLongDescriptionSource(),
      alertDialogNoDescriptionSource(),
      alertDialogClassNameExtraSource(),
      alertDialogHeadingH3Source(),
    ];
    for (const output of closedOutputs) {
      expect(output).toContain('let open = $state(false);');
      expect(output).not.toContain('$state(true)');
    }
  });

  it('a confirmação declara o handler que o botão de ação aciona', () => {
    const output = alertDialogConfirmedSource();
    expect(output).toContain('function deleteAccount()');
    expect(output).toContain('onclick={deleteAccount}');
  });

  it('o cancelamento tem handler nas duas saídas, e só a de cancelar dispensa a ação', () => {
    const output = alertDialogCancelledSource();
    expect(output).toContain('<AlertDialogCancel onclick={keepAccount}>');
    expect(output).toContain('onclick={deleteAccount}');
  });

  it('o modo controlado tira o gatilho de dentro do diálogo', () => {
    const output = alertDialogControlledSource();
    expect(output).not.toContain('AlertDialogTrigger');
    expect(output).toContain('onclick={() => (open = true)}');
    expect(output).toContain('onOpenChange=');
  });

  it('no modo controlado a ação fecha pela lib, sem escrever o estado antes', () => {
    // Escrever `open = false` na ação faz a lib achar o diálogo já fechado e
    // sair sem chamar `onOpenChange` — a confirmação sumia do callback do pai.
    const output = alertDialogControlledSource();
    expect(output).toContain('<AlertDialogAction variant="destructive">Excluir</AlertDialogAction>');
    expect(output).not.toContain('open = false');
  });

  it('o modo controlado usa os rótulos canônicos, sem "Fechar" no lugar de Cancelar', () => {
    const output = alertDialogControlledSource();
    expect(output).toContain('<AlertDialogTitle>Excluir conta</AlertDialogTitle>');
    expect(output).toContain('<AlertDialogCancel>Cancelar</AlertDialogCancel>');
    expect(output).not.toContain('Fechar');
    expect(output).not.toContain('bind:open.');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição com mídia traz o bloco de ícone no topo do header', () => {
    const output = alertDialogWithIconSource();
    expect(output).toContain('<AlertDialogMedia>');
    expect(output).toContain('<TriangleAlert aria-hidden="true" />');
  });

  it('a confirmação neutra não herda a severidade destrutiva', () => {
    const output = alertDialogNeutralSource();
    expect(output).toContain('variant="outline"');
    expect(output).toContain('<AlertDialogAction>Sair</AlertDialogAction>');
    expect(output).not.toContain('destructive');
  });

  it('a descrição longa continua num único subcomponente de descrição', () => {
    const output = alertDialogLongDescriptionSource();
    expect(output).toContain('nenhuma cópia de segurança');
    expect(output.match(/<AlertDialogDescription>/g)).toHaveLength(1);
  });

  it('sem descrição, nem o subcomponente nem o import sobram', () => {
    const output = alertDialogNoDescriptionSource();
    expect(output).not.toContain('AlertDialogDescription');
    expect(output).toContain('<AlertDialogTitle>Descartar rascunho</AlertDialogTitle>');
  });

  it('o control de descrição apagado tira o subcomponente, como na tela', () => {
    const output = alertDialogSource('', { args: { description: '' } });
    expect(output).not.toContain('AlertDialogDescription');
  });

  it('o nível de cabeçalho sai pelo `level` do primitivo, e só ele muda', () => {
    const output = alertDialogHeadingH3Source();
    // O `level` do wrapper troca a TAG e o `aria-level` juntos — quem copia
    // não precisa delegar elemento nenhum, e o exemplo não ensina o snippet
    // `child` que o wrapper já escreve por dentro.
    expect(output).toContain('<AlertDialogTitle level={3}>Excluir conta</AlertDialogTitle>');
    expect(output).not.toContain('<h3');

    // E nada MAIS muda: desfeito o nível, sobra o snippet canônico. Sem esta
    // parte o caso passaria com o painel inteiro reescrito, e o exemplo
    // deixaria de ensinar uma coisa só.
    expect(
      output.replace(
        '<AlertDialogTitle level={3}>Excluir conta</AlertDialogTitle>',
        '<AlertDialogTitle>Excluir conta</AlertDialogTitle>',
      ),
    ).toBe(alertDialogSource());
  });
  it('a classe extra chega ao painel e ao bloco de mídia', () => {
    const output = alertDialogClassNameExtraSource();
    expect(output).toContain('<AlertDialogContent class="nds-overflow-hidden">');
    expect(output).toContain('<AlertDialogMedia class="nds-shrink-0">');
  });
});

describe('ordem do rodapé no que o painel Code ENSINA', () => {
  // A saída segura vem ANTES da confirmação no DOM, em todo snippet publicado:
  // é a ordem de leitura e de tabulação, e é sobre ela que a folha trabalha
  // (`column-reverse` no estreito, `row` no largo). Regra de
  // `docs/shared/guidelines/02-alinhamento-botoes.md` aplicada ao que o design
  // system ensina — inverter aqui inverteria a tela de quem copia.
  //
  // Vale para as DEZ transforms, e não só para as de composição: o modo
  // controlado monta o painel por conta própria, fora do construtor comum, e é
  // justamente o que escaparia de uma varredura parcial.
  const transforms = {
    alertDialogSource,
    alertDialogConfirmedSource,
    alertDialogCancelledSource,
    alertDialogControlledSource,
    alertDialogWithIconSource,
    alertDialogNeutralSource,
    alertDialogLongDescriptionSource,
    alertDialogNoDescriptionSource,
    alertDialogClassNameExtraSource,
    alertDialogHeadingH3Source,
  };

  for (const [name, transform] of Object.entries(transforms)) {
    it(`${name} põe o Cancelar antes da ação`, () => {
      const output = transform();
      const cancel = output.indexOf('<AlertDialogCancel');
      const action = output.indexOf('<AlertDialogAction');
      // Os dois existem: sem esta parte, um snippet que perdesse o rodapé
      // passaria com dois -1, que é o portão sem dentes.
      expect(cancel).toBeGreaterThan(-1);
      expect(action).toBeGreaterThan(-1);
      expect(cancel).toBeLessThan(action);
    });
  }
});
