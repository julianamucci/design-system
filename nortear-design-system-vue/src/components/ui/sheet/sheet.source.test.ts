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
    const output = sheetPlaygroundSource();
    expect(output).toContain('      <SheetBody>\n');
    expect(output).toContain('  SheetBody,\n');
    expect(output).toContain('<p class="nds-text-body nds-text-muted-foreground">');
  });

  it('o lado mora no conteúdo, nunca na raiz', () => {
    const output = sheetPlaygroundSource('', { args: { side: 'left' } });
    expect(output).toContain('<SheetContent side="left">');
    expect(output).toContain('<Sheet>');
  });

  it('não escreve os padrões — repetir valor padrão ensina ruído', () => {
    const output = sheetPlaygroundSource('', {
      args: { side: 'right', showCloseButton: true, modal: true, defaultOpen: false },
    });
    expect(output).not.toContain('side=');
    expect(output).not.toContain('show-close-button');
    expect(output).not.toContain('modal');
    expect(output).not.toContain('default-open');
  });

  it('desliga o que nasce ligado e liga o que nasce desligado', () => {
    const output = sheetPlaygroundSource('', {
      args: { showCloseButton: false, modal: false, defaultOpen: true },
    });
    expect(output).toContain('<Sheet default-open :modal="false">');
    expect(output).toContain('<SheetContent :show-close-button="false">');
  });

  it('o rótulo do gatilho acompanha o control', () => {
    expect(sheetPlaygroundSource('', { args: { triggerLabel: 'Abrir preferências' } })).toContain(
      '<Button variant="outline">Abrir preferências</Button>',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = sheetPlaygroundSource('', {
      args: { onOpenChange: () => {}, triggerLabel: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('@update:open');
    // O rótulo cai no padrão em vez de interpolar o espião.
    expect(output).toContain('<Button variant="outline">Abrir filtros</Button>');
  });
});

describe('transforms das stories de direção', () => {
  it('a direita é o padrão, e por ser padrão a prop não aparece', () => {
    const output = sheetSideDireitoSource();
    expect(output).toContain('<SheetContent>');
    expect(output).not.toContain('side=');
    expect(output).toContain('<SheetTitle>Painel direito</SheetTitle>');
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
    const output = sheetHeadingH3Source();
    expect(output).toContain('<SheetTitle as="h3">Filtros avançados</SheetTitle>');
    // `h2` é o padrão do primitivo: quem não pede nível não escreve prop
    // nenhuma, e o snippet não ensina a repetir o padrão.
    expect(sheetOpenSource()).toContain('<SheetTitle>Filtros avançados</SheetTitle>');
    // Tirado o nível, sobra exatamente o painel canônico aberto — a lição é a
    // tag, e não uma composição nova a comparar linha a linha.
    expect(output.replace(' as="h3"', '')).toBe(sheetOpenSource());
  });
});

describe('transforms das stories de estado', () => {
  it('fechado é a ausência de default-open, e sobra só o gatilho', () => {
    const output = sheetClosedSource();
    expect(output).toContain('<Sheet>');
    expect(output).not.toContain('default-open');
    // Fechado o painel nem chega ao DOM: não há rodapé a mostrar.
    expect(output).not.toContain('SheetFooter');
  });

  it('aberto é a mesma composição com a prop ligada', () => {
    const output = sheetOpenSource();
    expect(output).toContain('<Sheet default-open>');
    expect(output).toContain('<SheetTrigger as-child>');
  });

  it('sem o botão do canto, a saída passa a ser o rodapé', () => {
    const output = sheetNoButtonCloseSource();
    expect(output).toContain('<SheetContent :show-close-button="false">');
    // Os rótulos são os da Demonstração, como nas outras stacks: o assunto é a
    // ausência do X, e um exemplo próprio fazia a story contar duas histórias.
    expect(output).toContain('<SheetTitle>Filtros avançados</SheetTitle>');
    expect(output).toContain('<Button variant="outline">Cancelar</Button>');
    expect(output).toContain('<Button>Aplicar filtros</Button>');
    expect(output).not.toContain('Mais tarde');
    // Não há gatilho nesta composição: o painel monta aberto.
    expect(output).not.toContain('SheetTrigger');
  });

  it('os dois painéis irmãos: o segundo abre por estado, e nada fecha o primeiro à mão', () => {
    const output = sheetSecondPanelClosesFirstSource();
    expect(output).toContain(`import { ref } from 'vue'`);
    expect(output).toContain('const segundoAberto = ref(false)');
    expect(output).toContain(
      '<Sheet :open="segundoAberto" @update:open="(valor) => (segundoAberto = valor)">',
    );
    expect(output).toContain('<SheetTitle>Primeiro painel</SheetTitle>');
    expect(output).toContain('<SheetTitle>Segundo painel</SheetTitle>');
    // A guarda é do PRIMITIVO: se o snippet ensinasse a fechar o primeiro à
    // mão, ensinaria a duplicar no consumidor o que o componente promete.
    expect(output).not.toContain('primeiroAberto');
  });

  it('o controlado liga o valor de fora e devolve cada mudança', () => {
    const output = sheetControlledSource();
    expect(output).toContain(`import { ref } from 'vue'`);
    expect(output).toContain('const aberto = ref(false)');
    expect(output).toContain('<Sheet :open="aberto" @update:open="(valor) => (aberto = valor)">');
    // A saída pelo rodapé e a ação primária são caminhos DIFERENTES: uma delega
    // o fechamento ao SheetClose, a outra é o dono do estado fechando por
    // decisão própria — é a distinção que o `reason` do dialog_close carrega.
    expect(output).toContain('<Button @click="aberto = false">Aplicar</Button>');
    // Controlado e não-controlado não convivem: `default-open` seria ignorado.
    expect(output).not.toContain('default-open');
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
      const output = build();
      expect(output).toContain('<Sheet default-open>');
      expect(output).toContain('<SheetTrigger as-child>');
      expect(output).toMatch(/<Button variant="outline">[^<]+<\/Button>\n {4}<\/SheetTrigger>/);
      expect(output).toContain('  SheetTrigger,\n');
    }
  });

  it('o corpo rolável é SheetBody, e ele é o que segura o rodapé', () => {
    const output = sheetFiltersAvancadosSource();
    expect(output).toContain('<SheetBody>');
    expect(output).toContain('  SheetBody,\n');
    expect(output).toContain('<Input id="cat" default-value="Eletrônicos" />');
    // O rótulo se liga ao campo pelo id, e não por proximidade visual.
    expect(output).toContain('<Label for="cat">Categoria</Label>');
    // Os DOIS campos que o conteúdo compartilhado documenta, por ÍNDICE: o
    // snippet publicava três, e nenhum deles era esse par.
    const rotulos = [...output.matchAll(/<Label for="[^"]*">([^<]*)<\/Label>/g)].map((m) => m[1]);
    expect(rotulos).toEqual(['Categoria', 'Preço mínimo']);
    // Empilhamento, e não grade: é o que a folha compartilhada define para
    // formulário de painel, e o que o Vanilla renderiza.
    expect(output).toContain('<form id="filters-form" class="nds-stack" data-spacing="sm" @submit.prevent>');
    expect(output).toContain('<div class="nds-stack" data-spacing="xs">');
    expect(output).not.toContain('nds-grid');

    // O rodapé é IRMÃO do corpo por construção do primitivo, então a primária
    // fica FORA do formulário e só o par id ↔ `form` a alcança (PRD D9). Sem o
    // atributo, `type="submit"` é botão inerte — não envia pelo clique nem
    // pelo Enter num campo, e nada na tela denuncia. Este snippet publicava
    // campos soltos e uma primária comum, e era o único das cinco.
    expect(output).toContain('<Button type="submit" form="filters-form">Aplicar filtros</Button>');
    expect(output).not.toContain('<Button>Aplicar filtros</Button>');
    // E o descartar não pode herdar `submit` do padrão do HTML.
    expect(output).toContain('<Button type="button" variant="outline">Cancelar</Button>');
  });

  it('a edição de perfil embrulha os campos num form e confirma por submit', () => {
    const output = sheetEditPerfilSource();
    expect(output).toContain(
      '<form id="profile-form" class="nds-stack" data-spacing="sm" @submit.prevent>',
    );
    // O rodapé é IRMÃO do corpo por construção do primitivo, então o botão fica
    // fora do formulário: sem o atributo `form` o `type="submit"` é inerte —
    // não envia pelo clique nem pelo Enter, e nada na tela denuncia. A asserção
    // cobra o par id ↔ `form`, e não só a presença do `type`.
    expect(output).toContain(
      '<Button type="submit" form="profile-form">Salvar alterações</Button>',
    );
    expect(output).not.toContain('<Button type="submit">Salvar alterações</Button>');
    // O descartar não pode herdar `submit` do padrão do HTML.
    expect(output).toContain('<Button type="button" variant="outline">Cancelar</Button>');
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
    const output = sheetNavigationSecundariaSource();
    expect(output).toContain('<SheetContent side="left">');
    expect(output).toContain(
      '<nav class="nds-stack" data-spacing="xs" aria-label="Navegação secundária">',
    );
    expect(output).not.toContain('SheetFooter');
    // O único botão do exemplo é o GATILHO — e ele existe, como nas outras
    // quatro stacks. Enquanto as composições daqui nasciam só com
    // `default-open`, o painel aparecia sem nada que explicasse como se abre.
    expect(output).toContain('<SheetTrigger as-child>');
    expect(output).toContain('<Button variant="outline">Abrir menu</Button>');
    expect(output).toContain('@/components/ui/button');
  });

  it('a navegação secundária lista as CINCO seções, na ordem do conteúdo', () => {
    const output = sheetNavigationSecundariaSource();
    for (const secao of ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas']) {
      expect(output).toContain(`>${secao}</a>`);
    }
    expect(output.match(/<a href="#"/g)).toHaveLength(5);
  });

  it('o painel inferior traz a fileira de ações e um rodapé só de saída', () => {
    const output = sheetBottomPanelSource();
    expect(output).toContain('<SheetContent side="bottom">');
    expect(output).toContain('<div class="nds-cluster" data-spacing="md">');
    expect(output).toContain('<Button variant="destructive">Excluir</Button>');
    expect(output).toContain('<Button variant="outline">Fechar</Button>');
    // A decisão é a ação clicada: não há confirmação a repetir no rodapé.
    expect(output).not.toContain('Aplicar filtros');
  });

  it('o corpo longo repete PARÁGRAFOS para que haja o que rolar, como na referência', () => {
    const output = sheetLongScrollBodySource();
    // 24 parágrafos, e não 12 pares rótulo+campo: o assunto da story é a
    // rolagem, e o formulário trazia junto a lição de outra composição.
    expect(output).toContain('<p v-for="i in 24" :key="i">');
    expect(output).toContain('<SheetTitle>Termos de uso</SheetTitle>');
    // Empilhamento, nunca grade — o mesmo ritmo que o outro formulário cobra.
    expect(output).toContain('<div class="nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm">');
    expect(output).not.toContain('nds-grid');
    // Sem campos aqui: o snippet não importa Label nem Input.
    expect(output).not.toContain('@/components/ui/input');
    expect(output).not.toContain('<Label');

    // O trio da caixa rolável: o `tabindex` o primitivo põe, mas o papel só é
    // emitido QUANDO vem nome — e o nome é de quem compõe. Sem ele, o corpo é
    // parada de teclado anônima.
    expect(output).toContain('<SheetBody aria-label="Termos de uso">');
  });
});
