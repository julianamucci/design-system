import { describe, expect, it } from 'vitest';
import {
  sheetBottomPanelSource,
  sheetOpenSource,
  sheetControlledSource,
  sheetEditPerfilSource,
  sheetClosedSource,
  sheetFiltersAvancadosSource,
  sheetLongScrollBodySource,
  sheetSecondPanelClosesFirstSource,
  sheetHeadingH3Source,
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

describe('transform da story de nível do título', () => {
  it('o nível é escrito, e é a ÚNICA coisa que difere do painel aberto', () => {
    const saida = sheetHeadingH3Source();
    expect(saida).toContain('<SheetTitle as="h3">Filtros avançados</SheetTitle>');
    // `h2` é o padrão do primitivo: quem não pede nível não escreve prop
    // nenhuma, e o snippet não ensina a repetir o padrão.
    expect(sheetOpenSource()).toContain('<SheetTitle>Filtros avançados</SheetTitle>');
    // Tirado o nível, sobra exatamente o painel canônico aberto — a lição é a
    // tag, e não uma composição nova a comparar linha a linha.
    expect(saida.replace(' as="h3"', '')).toBe(sheetOpenSource());
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
    // Os rótulos são os da Demonstração, como nas outras stacks: o assunto é a
    // ausência do X, e um exemplo próprio fazia a story contar duas histórias.
    expect(saida).toContain('<SheetTitle>Filtros avançados</SheetTitle>');
    expect(saida).toContain('<Button variant="outline">Cancelar</Button>');
    expect(saida).toContain('<Button>Aplicar filtros</Button>');
    expect(saida).not.toContain('Mais tarde');
    // Não há gatilho nesta composição: o painel monta aberto.
    expect(saida).not.toContain('SheetTrigger');
  });

  it('os dois painéis irmãos: o segundo abre por estado, e nada fecha o primeiro à mão', () => {
    const saida = sheetSecondPanelClosesFirstSource();
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain('const segundoAberto = ref(false)');
    expect(saida).toContain(
      '<Sheet :open="segundoAberto" @update:open="(valor) => (segundoAberto = valor)">',
    );
    expect(saida).toContain('<SheetTitle>Primeiro painel</SheetTitle>');
    expect(saida).toContain('<SheetTitle>Segundo painel</SheetTitle>');
    // A guarda é do PRIMITIVO: se o snippet ensinasse a fechar o primeiro à
    // mão, ensinaria a duplicar no consumidor o que o componente promete.
    expect(saida).not.toContain('primeiroAberto');
  });

  it('o controlado liga o valor de fora e devolve cada mudança', () => {
    const saida = sheetControlledSource();
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain('const aberto = ref(false)');
    expect(saida).toContain('<Sheet :open="aberto" @update:open="(valor) => (aberto = valor)">');
    // A saída pelo rodapé e a ação primária são caminhos DIFERENTES: uma delega
    // o fechamento ao SheetClose, a outra é o dono do estado fechando por
    // decisão própria — é a distinção que o `reason` do dialog_close carrega.
    expect(saida).toContain('<Button @click="aberto = false">Aplicar</Button>');
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
    expect(saida).toContain('<form id="filters-form" class="nds-stack" data-spacing="sm" @submit.prevent>');
    expect(saida).toContain('<div class="nds-stack" data-spacing="xs">');
    expect(saida).not.toContain('nds-grid');

    // O rodapé é IRMÃO do corpo por construção do primitivo, então a primária
    // fica FORA do formulário e só o par id ↔ `form` a alcança (PRD D9). Sem o
    // atributo, `type="submit"` é botão inerte — não envia pelo clique nem
    // pelo Enter num campo, e nada na tela denuncia. Este snippet publicava
    // campos soltos e uma primária comum, e era o único das cinco.
    expect(saida).toContain('<Button type="submit" form="filters-form">Aplicar filtros</Button>');
    expect(saida).not.toContain('<Button>Aplicar filtros</Button>');
    // E o descartar não pode herdar `submit` do padrão do HTML.
    expect(saida).toContain('<Button type="button" variant="outline">Cancelar</Button>');
  });

  it('a edição de perfil embrulha os campos num form e confirma por submit', () => {
    const saida = sheetEditPerfilSource();
    expect(saida).toContain(
      '<form id="profile-form" class="nds-stack" data-spacing="sm" @submit.prevent>',
    );
    // O rodapé é IRMÃO do corpo por construção do primitivo, então o botão fica
    // fora do formulário: sem o atributo `form` o `type="submit"` é inerte —
    // não envia pelo clique nem pelo Enter, e nada na tela denuncia. A asserção
    // cobra o par id ↔ `form`, e não só a presença do `type`.
    expect(saida).toContain(
      '<Button type="submit" form="profile-form">Salvar alterações</Button>',
    );
    expect(saida).not.toContain('<Button type="submit">Salvar alterações</Button>');
    // O descartar não pode herdar `submit` do padrão do HTML.
    expect(saida).toContain('<Button type="button" variant="outline">Cancelar</Button>');
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

  it('o corpo longo repete PARÁGRAFOS para que haja o que rolar, como na referência', () => {
    const saida = sheetLongScrollBodySource();
    // 24 parágrafos, e não 12 pares rótulo+campo: o assunto da story é a
    // rolagem, e o formulário trazia junto a lição de outra composição.
    expect(saida).toContain('<p v-for="i in 24" :key="i">');
    expect(saida).toContain('<SheetTitle>Termos de uso</SheetTitle>');
    // Empilhamento, nunca grade — o mesmo ritmo que o outro formulário cobra.
    expect(saida).toContain('<div class="nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm">');
    expect(saida).not.toContain('nds-grid');
    // Sem campos aqui: o snippet não importa Label nem Input.
    expect(saida).not.toContain('@/components/ui/input');
    expect(saida).not.toContain('<Label');

    // O trio da caixa rolável: o `tabindex` o primitivo põe, mas o papel só é
    // emitido QUANDO vem nome — e o nome é de quem compõe. Sem ele, o corpo é
    // parada de teclado anônima.
    expect(saida).toContain('<SheetBody aria-label="Termos de uso">');
  });
});
