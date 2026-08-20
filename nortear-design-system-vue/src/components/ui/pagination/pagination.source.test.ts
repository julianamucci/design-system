import { describe, expect, it } from 'vitest';
import {
  paginationComReticenciasSource,
  paginationControladaSource,
  paginationDirecionalSource,
  paginationFaixaSource,
  paginationLinkAtivoSource,
  paginationLinkInativoSource,
  paginationPrimeiraPaginaSource,
  paginationRodapeDeTabelaSource,
  paginationSimplesSource,
  paginationSource,
  paginationUltimaPaginaSource,
} from './pagination.source';

describe('paginationSource', () => {
  it('sem args, entrega a faixa canônica com o estado do lado de fora', () => {
    expect(paginationSource()).toBe(
      `<script setup lang="ts">
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { computed, ref } from 'vue'

const total = 50
const itensPorPagina = 10
const atual = ref(1)

const paginas = computed(() =>
  Array.from({ length: Math.ceil(total / itensPorPagina) }, (_, i) => i + 1),
)

function irPara(n: number) {
  if (n < 1 || n > paginas.value.length) return
  atual.value = n
}
</script>

<template>
  <Pagination :total="total" :items-per-page="itensPorPagina" :page="atual">
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious @click="irPara(atual - 1)" />
      </PaginationItem>
      <PaginationItem v-for="n in paginas" :key="n">
        <PaginationLink
          href="#"
          :is-active="atual === n"
          :aria-label="\`Ir para página \${n}\`"
          @click.prevent="irPara(n)"
        >
          {{ n }}
        </PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationNext @click="irPara(atual + 1)" />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</template>`,
    );
  });

  it('os controls de tamanho do conjunto entram no estado, não em atributo', () => {
    const saida = paginationSource('', {
      args: { total: 120, itemsPerPage: 20, defaultPage: 3 },
    });
    expect(saida).toContain('const total = 120');
    expect(saida).toContain('const itensPorPagina = 20');
    expect(saida).toContain('const atual = ref(3)');
  });

  it('não escreve o rótulo padrão dos direcionais', () => {
    const saida = paginationSource('', {
      args: { textoAnterior: 'Anterior', textoProxima: 'Próxima' },
    });
    expect(saida).toContain('<PaginationPrevious @click="irPara(atual - 1)" />');
    expect(saida).toContain('<PaginationNext @click="irPara(atual + 1)" />');
    expect(saida).not.toContain('text=');
  });

  it('o rótulo traduzido é o que precisa ser escrito', () => {
    const saida = paginationSource('', {
      args: { textoAnterior: 'Voltar', textoProxima: 'Avançar' },
    });
    expect(saida).toContain('<PaginationPrevious text="Voltar"');
    expect(saida).toContain('<PaginationNext text="Avançar"');
  });

  it('ignora control que não é string nem número — o espião de ação vira ruído', () => {
    // `onPageChange` chega como espião do Storybook, e um control trocado
    // chegaria como função: nenhum dos dois pode atravessar para o snippet.
    const saida = paginationSource('', {
      args: {
        total: (() => {}) as never,
        itemsPerPage: (() => {}) as never,
        defaultPage: (() => {}) as never,
        textoAnterior: (() => {}) as never,
      },
    });
    expect(saida).not.toContain('() => {}');
    expect(saida).not.toContain('NaN');
    expect(saida).not.toContain('text=');
    // Os padrões voltam inteiros, em vez de um buraco no meio do estado.
    expect(saida).toContain('const total = 50');
    expect(saida).toContain('const itensPorPagina = 10');
    expect(saida).toContain('const atual = ref(1)');
  });

  it('o link numerado tem destino e nome com contexto', () => {
    const saida = paginationSource();
    // Sem `href` a âncora não ganha papel de link nem entra na tabulação: a
    // faixa numerada inteira ficaria fora do teclado.
    expect(saida).toContain('href="#"');
    // "3" sozinho não diz nada em voz alta.
    expect(saida).toContain(':aria-label="`Ir para página ${n}`"');
  });
});

describe('transforms das stories de estado', () => {
  it('a faixa parada no meio marca a página atual e deixa os dois extremos vivos', () => {
    const saida = paginationFaixaSource();
    expect(saida).toContain('<Pagination :total="50" :items-per-page="10" :page="3">');
    expect(saida).toContain(':is-active="n === 3"');
    // O bloqueio dos direcionais é calculado pelo componente: escrevê-lo à mão
    // ensinaria uma prop que não existe.
    expect(saida).not.toContain('disabled');
  });

  it('a primeira página é a MESMA faixa parada no extremo', () => {
    const saida = paginationPrimeiraPaginaSource();
    expect(saida).toContain(':page="1"');
    expect(saida).toContain(':is-active="n === 1"');
    expect(saida).not.toContain('disabled');
  });
});

describe('transforms das stories de variante', () => {
  it('o link inativo não escreve a própria ênfase', () => {
    const saida = paginationLinkInativoSource();
    expect(saida).toContain('<PaginationLink href="#" aria-label="Ir para página 2" @click.prevent>2</PaginationLink>');
    expect(saida).not.toContain('is-active');
  });

  it('a página atual se marca com `is-active`, e só uma por faixa', () => {
    const saida = paginationLinkAtivoSource();
    expect(saida.match(/:is-active="true"/g)).toHaveLength(1);
    // `aria-current` é o que o componente DERIVA de `is-active`; escrevê-lo à
    // mão ensinaria a duplicar o que a prop já faz.
    expect(saida).not.toContain('aria-current');
  });

  it('os direcionais não pedem ícone nem rótulo — trazem os seus', () => {
    const saida = paginationDirecionalSource();
    expect(saida).toContain('<PaginationItem><PaginationPrevious /></PaginationItem>');
    expect(saida).toContain('<PaginationItem><PaginationNext /></PaginationItem>');
    expect(saida).not.toContain('PaginationLink');
    expect(saida).not.toContain('Icon');
  });
});

describe('transforms das stories de composição', () => {
  it('a faixa simples mostra todos os números, sem reticências', () => {
    const saida = paginationSimplesSource();
    expect(saida).toContain('const paginas = [1, 2, 3, 4, 5]');
    expect(saida).not.toContain('PaginationEllipsis');
  });

  it('a lista longa intercala marcador e número, e por isso precisa do tipo', () => {
    const saida = paginationComReticenciasSource();
    expect(saida).toContain(`type Trecho = number | 'ellipsis'`);
    expect(saida).toContain(`const trechos: Trecho[] = [1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]`);
    expect(saida).toContain(`<PaginationEllipsis v-if="trecho === 'ellipsis'" />`);
    // A peça já é decoração por dentro: escrever `aria-hidden` no consumidor
    // duplicaria o que o componente faz.
    expect(saida).not.toContain('aria-hidden');
  });

  it('a última página é o extremo oposto, com o recorte final de páginas', () => {
    const saida = paginationUltimaPaginaSource();
    expect(saida).toContain('const paginas = [8, 9, 10]');
    expect(saida).toContain('<Pagination :total="100" :items-per-page="10" :page="10">');
  });

  it('na faixa controlada o contador e o destaque leem o MESMO valor', () => {
    const saida = paginationControladaSource();
    expect(saida).toContain('const atual = ref(1)');
    expect(saida).toContain('Página {{ atual }} de {{ paginas.length }}');
    expect(saida).toContain(':page="atual"');
    expect(saida).toContain(':is-active="atual === n"');
  });

  it('o rodapé de tabela usa cluster, e a faixa encosta pelo alinhamento', () => {
    const saida = paginationRodapeDeTabelaSource();
    // Só o cluster tem `data-align`/`data-justify`, e é ele que quebra a linha
    // sozinho quando a largura aperta.
    expect(saida).toContain('class="nds-cluster nds-w-full nds-max-w-prose nds-border-default nds-rounded-lg nds-p-4"');
    expect(saida).toContain('data-justify="between"');
    expect(saida).toContain('data-align="end"');
    // Com duas faixas na mesma página, "Paginação" nas duas deixa o leitor de
    // tela sem como distingui-las.
    expect(saida).toContain('aria-label="Paginação do rodapé da tabela"');
  });
});

describe('o snippet ensina o design system, não o andaime da story', () => {
  const todas = [
    paginationSource,
    paginationFaixaSource,
    paginationPrimeiraPaginaSource,
    paginationLinkInativoSource,
    paginationLinkAtivoSource,
    paginationDirecionalSource,
    paginationSimplesSource,
    paginationComReticenciasSource,
    paginationUltimaPaginaSource,
    paginationControladaSource,
    paginationRodapeDeTabelaSource,
  ];

  it('nenhuma traz o espião de contagem nem o nome de story no landmark', () => {
    for (const fn of todas) {
      const saida = fn();
      expect(saida).not.toContain('onPageChange');
      expect(saida).not.toContain('Paginação em repouso');
      expect(saida).not.toContain('Paginação sob o ponteiro');
      expect(saida).not.toContain('Paginação medida por contraste');
      expect(saida).not.toContain('data-slot=');
    }
  });

  it('todas importam do design system, nunca de um caminho interno', () => {
    for (const fn of todas) {
      expect(fn()).toContain(`from '@/components/ui/pagination'`);
    }
  });
});
