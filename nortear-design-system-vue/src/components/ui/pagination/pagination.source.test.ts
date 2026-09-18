import { describe, expect, it } from 'vitest';
import {
  paginationWithEllipsisSource,
  paginationControladaSource,
  paginationDirecionalSource,
  paginationRangeSource,
  paginationLinkActiveSource,
  paginationLinkInactiveSource,
  paginationFirstPageSource,
  tablePaginationFooterSource,
  paginationSimpleSource,
  paginationSource,
  paginationLastPageSource,
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
    const output = paginationSource('', {
      args: { total: 120, itemsPerPage: 20, defaultPage: 3 },
    });
    expect(output).toContain('const total = 120');
    expect(output).toContain('const itensPorPagina = 20');
    expect(output).toContain('const atual = ref(3)');
  });

  it('não escreve o rótulo padrão dos direcionais', () => {
    const output = paginationSource('', {
      args: { textoAnterior: 'Anterior', textoProxima: 'Próxima' },
    });
    expect(output).toContain('<PaginationPrevious @click="irPara(atual - 1)" />');
    expect(output).toContain('<PaginationNext @click="irPara(atual + 1)" />');
    expect(output).not.toContain('text=');
  });

  it('o rótulo traduzido é o que precisa ser escrito', () => {
    const output = paginationSource('', {
      args: { textoAnterior: 'Voltar', textoProxima: 'Avançar' },
    });
    expect(output).toContain('<PaginationPrevious text="Voltar"');
    expect(output).toContain('<PaginationNext text="Avançar"');
  });

  it('ignora control que não é string nem número — o espião de ação vira ruído', () => {
    // `onPageChange` chega como espião do Storybook, e um control trocado
    // chegaria como função: nenhum dos dois pode atravessar para o snippet.
    const output = paginationSource('', {
      args: {
        total: (() => {}) as never,
        itemsPerPage: (() => {}) as never,
        defaultPage: (() => {}) as never,
        textoAnterior: (() => {}) as never,
      },
    });
    expect(output).not.toContain('() => {}');
    expect(output).not.toContain('NaN');
    expect(output).not.toContain('text=');
    // Os padrões voltam inteiros, em vez de um buraco no meio do estado.
    expect(output).toContain('const total = 50');
    expect(output).toContain('const itensPorPagina = 10');
    expect(output).toContain('const atual = ref(1)');
  });

  it('o link numerado tem destino e nome com contexto', () => {
    const output = paginationSource();
    // Sem `href` a âncora não ganha papel de link nem entra na tabulação: a
    // faixa numerada inteira ficaria fora do teclado.
    expect(output).toContain('href="#"');
    // "3" sozinho não diz nada em voz alta.
    expect(output).toContain(':aria-label="`Ir para página ${n}`"');
  });
});

describe('transforms das stories de estado', () => {
  it('a faixa parada no meio marca a página atual e deixa os dois extremos vivos', () => {
    const output = paginationRangeSource();
    expect(output).toContain('<Pagination :total="50" :items-per-page="10" :page="3">');
    expect(output).toContain(':is-active="n === 3"');
    // O bloqueio dos direcionais é calculado pelo componente: escrevê-lo à mão
    // ensinaria uma prop que não existe.
    expect(output).not.toContain('disabled');
  });

  it('a primeira página é a MESMA faixa parada no extremo', () => {
    const output = paginationFirstPageSource();
    expect(output).toContain(':page="1"');
    expect(output).toContain(':is-active="n === 1"');
    expect(output).not.toContain('disabled');
  });
});

describe('transforms das stories de variante', () => {
  it('o link inativo não escreve a própria ênfase', () => {
    const output = paginationLinkInactiveSource();
    expect(output).toContain('<PaginationLink href="#" aria-label="Ir para página 2" @click.prevent>2</PaginationLink>');
    expect(output).not.toContain('is-active');
  });

  it('a página atual se marca com `is-active`, e só uma por faixa', () => {
    const output = paginationLinkActiveSource();
    expect(output.match(/:is-active="true"/g)).toHaveLength(1);
    // `aria-current` é o que o componente DERIVA de `is-active`; escrevê-lo à
    // mão ensinaria a duplicar o que a prop já faz.
    expect(output).not.toContain('aria-current');
  });

  it('os direcionais não pedem ícone nem rótulo — trazem os seus', () => {
    const output = paginationDirecionalSource();
    expect(output).toContain('<PaginationItem><PaginationPrevious /></PaginationItem>');
    expect(output).toContain('<PaginationItem><PaginationNext /></PaginationItem>');
    expect(output).not.toContain('PaginationLink');
    expect(output).not.toContain('Icon');
  });
});

describe('transforms das stories de composição', () => {
  it('a faixa simples mostra todos os números, sem reticências', () => {
    const output = paginationSimpleSource();
    expect(output).toContain('const paginas = [1, 2, 3, 4, 5]');
    expect(output).not.toContain('PaginationEllipsis');
  });

  it('a lista longa intercala marcador e número, e por isso precisa do tipo', () => {
    const output = paginationWithEllipsisSource();
    expect(output).toContain(`type Trecho = number | 'ellipsis'`);
    expect(output).toContain(`const trechos: Trecho[] = [1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]`);
    expect(output).toContain(`<PaginationEllipsis v-if="trecho === 'ellipsis'" />`);
    // A peça já é decoração por dentro: escrever `aria-hidden` no consumidor
    // duplicaria o que o componente faz.
    expect(output).not.toContain('aria-hidden');
  });

  it('a última página é o extremo oposto, com o recorte final de páginas', () => {
    const output = paginationLastPageSource();
    expect(output).toContain('const paginas = [8, 9, 10]');
    expect(output).toContain('<Pagination :total="100" :items-per-page="10" :page="10">');
  });

  it('na faixa controlada o contador e o destaque leem o MESMO valor', () => {
    const output = paginationControladaSource();
    expect(output).toContain('const atual = ref(1)');
    expect(output).toContain('Página {{ atual }} de {{ paginas.length }}');
    expect(output).toContain(':page="atual"');
    expect(output).toContain(':is-active="atual === n"');
  });

  it('o rodapé de tabela usa cluster, e a faixa encosta pelo alinhamento', () => {
    const output = tablePaginationFooterSource();
    // Só o cluster tem `data-align`/`data-justify`, e é ele que quebra a linha
    // sozinho quando a largura aperta.
    expect(output).toContain('class="nds-cluster nds-w-prose nds-border-default nds-rounded-lg nds-p-4"');
    expect(output).toContain('data-justify="between"');
    expect(output).toContain('data-align="end"');
    // Com duas faixas na mesma página, "Paginação" nas duas deixa o leitor de
    // tela sem como distingui-las.
    expect(output).toContain('aria-label="Paginação do rodapé da tabela"');
  });
});

describe('o snippet ensina o design system, não o andaime da story', () => {
  const all = [
    paginationSource,
    paginationRangeSource,
    paginationFirstPageSource,
    paginationLinkInactiveSource,
    paginationLinkActiveSource,
    paginationDirecionalSource,
    paginationSimpleSource,
    paginationWithEllipsisSource,
    paginationLastPageSource,
    paginationControladaSource,
    tablePaginationFooterSource,
  ];

  it('nenhuma traz o espião de contagem nem o nome de story no landmark', () => {
    for (const fn of all) {
      const output = fn();
      expect(output).not.toContain('onPageChange');
      expect(output).not.toContain('Paginação em repouso');
      expect(output).not.toContain('Paginação sob o ponteiro');
      expect(output).not.toContain('Paginação medida por contraste');
      expect(output).not.toContain('data-slot=');
    }
  });

  it('todas importam do design system, nunca de um caminho interno', () => {
    for (const fn of all) {
      expect(fn()).toContain(`from '@/components/ui/pagination'`);
    }
  });
});
