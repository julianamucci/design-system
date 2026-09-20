import { describe, expect, it } from 'vitest';
import {
  drawerHeadingH3Source,
  drawerWithConfirmSource,
  drawerWithFormSource,
  drawerWithScrollSource,
  drawerSource,
} from './drawer.source';

describe('drawerSource', () => {
  it('sem args, entrega o painel canônico fechado e sem direção explícita', () => {
    expect(drawerSource()).toBe(
      `<script lang="ts">
  import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer";
  import { Button } from "@/components/ui/button";

  let open = $state(false);
</script>

<Drawer bind:open>
  <DrawerTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir drawer</Button>
    {/snippet}
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Editar perfil</DrawerTitle>
      <DrawerDescription>Atualize seus dados pessoais e foto.</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <DrawerClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancelar</Button>
        {/snippet}
      </DrawerClose>
      <Button>Confirmar</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
    );
  });

  it('só escreve direction quando a direção difere do padrão', () => {
    expect(drawerSource('', { args: { direction: 'bottom' } })).not.toContain('direction');
    expect(drawerSource('', { args: { direction: 'right' } })).toContain(
      '<Drawer bind:open direction="right">',
    );
    expect(drawerSource('', { args: { direction: 'left' } })).toContain('direction="left"');
    expect(drawerSource('', { args: { direction: 'top' } })).toContain('direction="top"');
  });

  it('só escreve dismissible quando o valor difere do padrão', () => {
    expect(drawerSource('', { args: { dismissible: true } })).not.toContain('dismissible');
    expect(drawerSource('', { args: { dismissible: false } })).toContain(
      '<Drawer bind:open dismissible={false}>',
    );
  });

  it('o estado inicial sai do valor ligado, e não de uma prop de abertura padrão', () => {
    // O primitivo desta stack não tem prop de abertura inicial: o valor entra
    // pelo mesmo estado ligado, e é isso que o snippet precisa ensinar.
    expect(drawerSource('', { args: { defaultOpen: true } })).toContain('let open = $state(true);');
    expect(drawerSource('', { args: { open: true } })).toContain('let open = $state(true);');
    expect(drawerSource()).toContain('let open = $state(false);');
    expect(drawerSource('', { args: { defaultOpen: true } })).not.toContain('defaultOpen');
  });

  it('o rodapé de saída única não escreve ação primária nenhuma', () => {
    // É o rodapé das stories de direção, e o que as outras quatro stacks
    // renderizam ali. O snippet é o que se copia: publicar um par onde a tela
    // mostra um botão só ensinaria um painel que não existe.
    const output = drawerSource('', { args: { footer: 'close', cancelLabel: 'Fechar' } });
    expect(output).toContain('<Button variant="outline" {...props}>Fechar</Button>');
    expect(output).not.toContain('<Button>Confirmar</Button>');
    expect(output.match(/<Button/g)).toHaveLength(2); // gatilho + saída
    // E o padrão continua sendo o par: a saída única é pedida, nunca herdada.
    expect(drawerSource()).toContain('<Button>Confirmar</Button>');
  });

  it('os textos do painel acompanham os controls', () => {
    const output = drawerSource('', {
      args: {
        triggerLabel: 'Abrir filtros',
        title: 'Filtros',
        description: 'Refine sua busca.',
        actionLabel: 'Salvar',
        cancelLabel: 'Descartar',
      },
    });
    expect(output).toContain('>Abrir filtros</Button>');
    expect(output).toContain('<DrawerTitle>Filtros</DrawerTitle>');
    expect(output).toContain('<DrawerDescription>Refine sua busca.</DrawerDescription>');
    expect(output).toContain('<Button>Salvar</Button>');
    expect(output).toContain('>Descartar</Button>');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição com formulário abre na direção padrão e rotula os dois campos', () => {
    const output = drawerWithFormSource();
    // Em BAIXO, como nas outras quatro stacks — e por isso sem `direction`
    // escrito: valor padrão não se escreve num exemplo que alguém copia.
    expect(output).not.toContain('direction=');
    expect(output).toContain('<Label for="drawer-nome">Nome</Label>');
    expect(output).toContain('<Label for="drawer-email">E-mail</Label>');
    expect(output).toContain('from "@/components/ui/input"');
  });

  it('religa a ação primária ao formulário, que é irmão do rodapé', () => {
    // `type="submit"` sem o `form` é botão INERTE: não envia pelo clique nem
    // pelo Enter num campo, e nada na tela denuncia. Com dois campos não há
    // submissão implícita para salvar o caso.
    const output = drawerWithFormSource();
    expect(output).toContain('id="drawer-form"');
    expect(output).toContain('<Button type="submit" form="drawer-form">Confirmar</Button>');
    expect(output).not.toContain('<Button>Confirmar</Button>');
  });

  it('a ação que remove se anuncia destrutiva, e só ela', () => {
    // O contraste entre a saída e a consequência é o que a composição ensina;
    // sem a variante, o exemplo mostra duas ações de mesmo peso.
    const output = drawerWithConfirmSource();
    expect(output).toContain('<Button variant="destructive">Remover</Button>');
    expect(output.match(/variant="destructive"/g)).toHaveLength(1);
    // A variante é do BOTÃO, e nunca a classe crua da folha.
    expect(output).not.toContain('nds-button-destructive');
    // E não vaza para as outras composições, que não destroem nada.
    expect(drawerWithFormSource()).not.toContain('destructive');
    expect(drawerWithScrollSource()).not.toContain('destructive');
    expect(drawerSource()).not.toContain('destructive');
  });

  it('o elo só existe onde existe formulário — a confirmação não o herda', () => {
    // O `panel()` é o mesmo para as quatro composições. Vazar o `form` para as
    // que não têm `<form>` seria a mesma promessa vazia em outro lugar.
    expect(drawerWithConfirmSource()).not.toContain('type="submit"');
    expect(drawerWithScrollSource()).not.toContain('type="submit"');
    expect(drawerHeadingH3Source()).not.toContain('type="submit"');
  });

  it('o nível de cabeçalho sai por delegação de elemento, e só ele muda', () => {
    const output = drawerHeadingH3Source();
    // `level` sozinho NÃO troca a tag nesta lib — troca o `aria-level` e deixa
    // um `div`. Quem devolve o elemento é o snippet `child`, e os dois vão
    // juntos para a tag e o ARIA concordarem. O snippet é o que se copia:
    // publicá-lo só com o `level` ensinaria um `div` com cara de cabeçalho.
    expect(output).toContain('<DrawerTitle level={3}>');
    expect(output).toContain('{#snippet child({ props })}');
    expect(output).toContain('<h3 {...props}>Editar perfil</h3>');

    // E nada MAIS muda: desfeito o bloco do título, sobra o snippet canônico.
    // Sem esta parte o caso passaria com o painel inteiro reescrito, e o
    // exemplo deixaria de ensinar uma coisa só.
    expect(
      output.replace(
        `<DrawerTitle level={3}>
        {#snippet child({ props })}
          <h3 {...props}>Editar perfil</h3>
        {/snippet}
      </DrawerTitle>`,
        '<DrawerTitle>Editar perfil</DrawerTitle>',
      ),
    ).toBe(drawerSource('', {
        args: {
          open: true,
          footer: 'close',
          triggerLabel: 'Editar perfil',
          title: 'Editar perfil',
          description: 'Atualize seus dados.',
          cancelLabel: 'Cancelar',
        },
      }));
  });
  it('a confirmação usa o corpo do painel para a mensagem curta', () => {
    const output = drawerWithConfirmSource();
    expect(output).toContain('<DrawerBody class="nds-text-body nds-text-muted-foreground">');
    expect(output).toContain('>Remover</Button>');
  });

  it('o corpo rolável não leva altura cravada — quem rola é o corpo', () => {
    const output = drawerWithScrollSource();
    expect(output).toContain('<DrawerBody');
    expect(output).not.toContain('height');
    expect(output).not.toContain('style=');
  });
});
