import { describe, expect, it } from 'vitest';
import {
  sheetBottomPanelSource,
  sheetOpenSource,
  sheetControlledSource,
  sheetEditPerfilSource,
  sheetClosedSource,
  sheetFiltersAvancadosSource,
  sheetFormLongSource,
  sheetSideDireitoSource,
  sheetSideEsquerdoSource,
  sheetSideInferiorSource,
  sheetSideSuperiorSource,
  sheetNavigationSecundariaSource,
  sheetPlaygroundSource,
  sheetNoButtonCloseSource,
} from './sheet.source';

describe('sheetPlaygroundSource', () => {
  it('sem args, entrega a forma canônica do painel', () => {
    expect(sheetPlaygroundSource()).toBe(
      `<script setup lang="ts">
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
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="outline">Abrir filtros</Button>
    </SheetTrigger>
    <SheetContent>
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
        <SheetClose as-child>
          <Button variant="outline">Cancelar</Button>
        </SheetClose>
        <Button>Aplicar filtros</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>`,
    );
  });

  it('o corpo rolável entra no snippet, porque a story o RENDERIZA', () => {
    // O Playground mostra um parágrafo entre cabeçalho e rodapé, e o snippet ia
    // de um ao outro: quem copiasse perdia a área que rola.
    const saida = sheetPlaygroundSource();
    expect(saida).toContain('      <SheetBody>\n');
    expect(saida).toContain('  SheetBody,\n');
    expect(saida).toContain('<p class="nds-text-body nds-text-muted-foreground">');
  });

  it('o lado mora no conteúdo, nunca na raiz', () => {
    const saida = sheetPlaygroundSource('', { args: { side: 'left' } });
    expect(saida).toContain('<SheetContent side="left">');
    expect(saida).toContain('<Sheet>');
  });

  it('não escreve os padrões — repetir valor padrão ensina ruído', () => {
    const saida = sheetPlaygroundSource('', {
      args: { side: 'right', showCloseButton: true, modal: true, defaultOpen: false },
    });
    expect(saida).not.toContain('side=');
    expect(saida).not.toContain('show-close-button');
    expect(saida).not.toContain('modal');
    expect(saida).not.toContain('default-open');
  });

  it('desliga o que nasce ligado e liga o que nasce desligado', () => {
    const saida = sheetPlaygroundSource('', {
      args: { showCloseButton: false, modal: false, defaultOpen: true },
    });
    expect(saida).toContain('<Sheet default-open :modal="false">');
    expect(saida).toContain('<SheetContent :show-close-button="false">');
  });

  it('o rótulo do gatilho acompanha o control', () => {
    expect(sheetPlaygroundSource('', { args: { triggerLabel: 'Abrir preferências' } })).toContain(
      '<Button variant="outline">Abrir preferências</Button>',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = sheetPlaygroundSource('', {
      args: { onOpenChange: () => {}, triggerLabel: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('@update:open');
    // O rótulo cai no padrão em vez de interpolar o espião.
    expect(saida).toContain('<Button variant="outline">Abrir filtros</Button>');
  });
});

describe('transforms das stories de direção', () => {
  it('a direita é o padrão, e por ser padrão a prop não aparece', () => {
    const saida = sheetSideDireitoSource();
    expect(saida).toContain('<SheetContent>');
    expect(saida).not.toContain('side=');
    expect(saida).toContain('<SheetTitle>Painel direito</SheetTitle>');
  });

  it('cada outra direção escreve o próprio lado, e no conteúdo', () => {
    expect(sheetSideEsquerdoSource()).toContain('<SheetContent side="left">');
    expect(sheetSideSuperiorSource()).toContain('<SheetContent side="top">');
    expect(sheetSideInferiorSource()).toContain('<SheetContent side="bottom">');
  });

  it('as quatro nascem abertas — é o que explica a imagem ao lado do snippet', () => {
    for (const fn of [
      sheetSideDireitoSource,
      sheetSideEsquerdoSource,
      sheetSideSuperiorSource,
      sheetSideInferiorSource,
    ]) {
      expect(fn()).toContain('<Sheet default-open>');
    }
  });
});

describe('transforms das stories de estado', () => {
  it('fechado é a ausência de default-open, e sobra só o gatilho', () => {
    const saida = sheetClosedSource();
    expect(saida).toContain('<Sheet>');
    expect(saida).not.toContain('default-open');
    // Fechado o painel nem chega ao DOM: não há rodapé a mostrar.
    expect(saida).not.toContain('SheetFooter');
  });

  it('aberto é a mesma composição com a prop ligada', () => {
    const saida = sheetOpenSource();
    expect(saida).toContain('<Sheet default-open>');
    expect(saida).toContain('<SheetTrigger as-child>');
  });

  it('sem o botão do canto, a saída passa a ser o rodapé', () => {
    const saida = sheetNoButtonCloseSource();
    expect(saida).toContain('<SheetContent :show-close-button="false">');
    expect(saida).toContain('<Button variant="outline">Mais tarde</Button>');
    // Não há gatilho nesta composição: o painel monta aberto.
    expect(saida).not.toContain('SheetTrigger');
  });

  it('o controlado liga o valor de fora e devolve cada mudança', () => {
    const saida = sheetControlledSource();
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain('const aberto = ref(false)');
    expect(saida).toContain('<Sheet :open="aberto" @update:open="(valor) => (aberto = valor)">');
    // Controlado e não-controlado não convivem: `default-open` seria ignorado.
    expect(saida).not.toContain('default-open');
  });
});

describe('transforms das stories de composição', () => {
  it('as QUATRO composições abrem por um gatilho, como as stories ao lado', () => {
    // Esta stack era a única cujas composições não tinham gatilho — nem na
    // story, nem no snippet. `default-open` fica porque é o que a regressão
    // visual e o axe alcançam; o gatilho entra porque é o que se escreve.
    for (const build of [
      sheetFiltersAvancadosSource,
      sheetEditPerfilSource,
      sheetNavigationSecundariaSource,
      sheetBottomPanelSource,
    ]) {
      const saida = build();
      expect(saida).toContain('<Sheet default-open>');
      expect(saida).toContain('<SheetTrigger as-child>');
      expect(saida).toMatch(/<Button variant="outline">[^<]+<\/Button>\n {4}<\/SheetTrigger>/);
      expect(saida).toContain('  SheetTrigger,\n');
    }
  });

  it('o corpo rolável é SheetBody, e ele é o que segura o rodapé', () => {
    const saida = sheetFiltersAvancadosSource();
    expect(saida).toContain('<SheetBody>');
    expect(saida).toContain('  SheetBody,\n');
    expect(saida).toContain('<Input id="cat" default-value="Eletrônicos" />');
    // O rótulo se liga ao campo pelo id, e não por proximidade visual.
    expect(saida).toContain('<Label for="cat">Categoria</Label>');
    // Os DOIS campos que o conteúdo compartilhado documenta, por ÍNDICE: o
    // snippet publicava três, e nenhum deles era esse par.
    const rotulos = [...saida.matchAll(/<Label for="[^"]*">([^<]*)<\/Label>/g)].map((m) => m[1]);
    expect(rotulos).toEqual(['Categoria', 'Preço mínimo']);
    // Empilhamento, e não grade: é o que a folha compartilhada define para
    // formulário de painel, e o que o Vanilla renderiza.
    expect(saida).toContain('<div class="nds-stack" data-spacing="sm">');
    expect(saida).toContain('<div class="nds-stack" data-spacing="xs">');
    expect(saida).not.toContain('nds-grid');
  });

  it('a edição de perfil embrulha os campos num form e confirma por submit', () => {
    const saida = sheetEditPerfilSource();
    expect(saida).toContain('<form class="nds-stack" data-spacing="sm">');
    expect(saida).toContain('<Button type="submit">Salvar alterações</Button>');
  });

  it('os três campos do perfil saem na ordem Nome · Nome de usuário · Bio', () => {
    // Por ÍNDICE: a ordem é a das outras stacks, e o campo do meio já saiu do
    // snippet uma vez sem que nada reprovasse.
    const rotulos = [...sheetEditPerfilSource().matchAll(/<Label for="[^"]*">([^<]*)<\/Label>/g)].map(
      (m) => m[1],
    );
    expect(rotulos).toEqual(['Nome', 'Nome de usuário', 'Bio']);
  });

  it('a navegação secundária abre à esquerda e não tem rodapé', () => {
    const saida = sheetNavigationSecundariaSource();
    expect(saida).toContain('<SheetContent side="left">');
    expect(saida).toContain(
      '<nav class="nds-stack" data-spacing="xs" aria-label="Navegação secundária">',
    );
    expect(saida).not.toContain('SheetFooter');
    // O único botão do exemplo é o GATILHO — e ele existe, como nas outras
    // quatro stacks. Enquanto as composições daqui nasciam só com
    // `default-open`, o painel aparecia sem nada que explicasse como se abre.
    expect(saida).toContain('<SheetTrigger as-child>');
    expect(saida).toContain('<Button variant="outline">Abrir menu</Button>');
    expect(saida).toContain('@/components/ui/button');
  });

  it('a navegação secundária lista as CINCO seções, na ordem do conteúdo', () => {
    const saida = sheetNavigationSecundariaSource();
    for (const secao of ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas']) {
      expect(saida).toContain(`>${secao}</a>`);
    }
    expect(saida.match(/<a href="#"/g)).toHaveLength(5);
  });

  it('o painel inferior traz a fileira de ações e um rodapé só de saída', () => {
    const saida = sheetBottomPanelSource();
    expect(saida).toContain('<SheetContent side="bottom">');
    expect(saida).toContain('<div class="nds-cluster" data-spacing="md">');
    expect(saida).toContain('<Button variant="destructive">Excluir</Button>');
    expect(saida).toContain('<Button variant="outline">Fechar</Button>');
    // A decisão é a ação clicada: não há confirmação a repetir no rodapé.
    expect(saida).not.toContain('Aplicar filtros');
  });

  it('o formulário longo repete campos para que haja o que rolar', () => {
    const saida = sheetFormLongSource();
    expect(saida).toContain('<div v-for="i in 12" :key="i"');
    expect(saida).toContain('<Label :for="`notif-${i}`">Categoria {{ i }}</Label>');
    expect(saida).toContain('<SheetBody>');
  });
});
