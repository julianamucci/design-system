import { describe, expect, it } from 'vitest';
import {
  toggleAtivoSource,
  toggleBarraDeFormatacaoSource,
  toggleComRotuloSource,
  toggleContornoSource,
  toggleControladoSource,
  toggleDesabilitadoSource,
  toggleFocoSource,
  toggleIconSource,
  toggleInvalidoSource,
  filtersSourceToggleList,
  toggleSource,
  toggleTamanhosSource,
} from './toggle.source';

describe('toggleSource', () => {
  it('sem args, entrega o toggle de ícone com nome acessível e os imports', () => {
    expect(toggleSource()).toBe(
      `<script setup lang="ts">
import { Toggle } from '@/components/ui/toggle'
import { Bold } from 'lucide-vue-next'
</script>

<template>
  <Toggle aria-label="Alternar">
    <Bold aria-hidden="true" />
  </Toggle>
</template>`,
    );
  });

  it('com texto visível o aria-label sai, e o ícone troca junto', () => {
    const saida = toggleSource('', { args: { iconOnly: false, label: 'Mostrar ocultos' } });
    // Um `aria-label` que discorde do texto visível quebra a WCAG 2.5.3.
    expect(saida).not.toContain('aria-label=');
    expect(saida).toContain('<Eye aria-hidden="true" />');
    expect(saida).toContain('  Mostrar ocultos');
    expect(saida).not.toContain('Bold');
  });

  it('não escreve variante nem degrau padrão — no componente eles são a ausência', () => {
    const saida = toggleSource('', { args: { variant: 'default', size: 'default' } });
    expect(saida).not.toContain('variant=');
    expect(saida).not.toContain('size=');
  });

  it('variante e degrau fora do padrão chegam ao snippet', () => {
    const saida = toggleSource('', { args: { variant: 'outline', size: 'lg', label: 'Negrito' } });
    expect(saida).toContain('<Toggle variant="outline" size="lg" aria-label="Negrito">');
  });

  it('os booleanos só aparecem quando ligados', () => {
    expect(toggleSource('', { args: { defaultValue: false, disabled: false } })).not.toContain(
      'default-value',
    );
    const ligados = toggleSource('', { args: { defaultValue: true, disabled: true } });
    expect(ligados).toContain('<Toggle default-value disabled aria-label="Alternar">');
  });

  it('escapa aspas do rótulo — soltas, elas fechariam o atributo cedo', () => {
    expect(toggleSource('', { args: { label: 'Modo "compacto"' } })).toContain(
      'aria-label="Modo &quot;compacto&quot;"',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = toggleSource('', { args: { label: (() => {}) as never } });
    expect(saida).not.toContain('function');
    // Sem rótulo utilizável, o botão de ícone ainda precisa de um nome.
    expect(saida).toContain('aria-label="Alternar"');
  });
});

describe('transforms das stories de variante', () => {
  it('o contorno se lê contra a variante sem borda ao lado', () => {
    const saida = toggleContornoSource();
    expect([...saida.matchAll(/<Toggle/g)]).toHaveLength(2);
    expect(saida).toContain('<Toggle variant="outline" aria-label="Itálico">');
    expect(saida).toContain('<Toggle aria-label="Negrito">');
  });

  it('com rótulo visível nenhum dos dois carrega aria-label', () => {
    const saida = toggleComRotuloSource();
    expect(saida).not.toContain('aria-label=');
    expect(saida).toContain('  Mostrar ocultos\n');
    expect(saida).toContain('default-value');
  });

  it('na escada, só o degrau do meio fica sem `size`', () => {
    const saida = toggleTamanhosSource();
    expect(saida).toContain('size="sm"');
    expect(saida).toContain('size="lg"');
    expect([...saida.matchAll(/size="/g)]).toHaveLength(2);
    expect(saida).not.toContain('size="default"');
  });
});

describe('transforms das stories de estado', () => {
  it('o ligado parte de `default-value`, e não de `v-model`', () => {
    const saida = toggleAtivoSource();
    expect(saida).toContain('<Toggle default-value aria-label="Negrito ativo">');
    expect(saida).not.toContain('v-model');
  });

  it('o foco não escreve prop nenhuma — o anel vem do CSS do componente', () => {
    const saida = toggleFocoSource();
    expect(saida).not.toContain('focus');
    expect(saida).not.toContain('tabindex');
    // O par existe para comparar: a variante com borda já tem sombra em repouso.
    expect([...saida.matchAll(/<Toggle/g)]).toHaveLength(2);
  });

  it('o desabilitado usa o atributo nativo, nos dois estados', () => {
    const saida = toggleDesabilitadoSource();
    expect([...saida.matchAll(/ disabled/g)]).toHaveLength(2);
    // `aria-disabled` sozinho deixaria o foco entrar num controle inerte.
    expect(saida).not.toContain('aria-disabled');
    expect(saida).toContain('disabled default-value');
  });

  it('o inválido aponta para a mensagem, e a mensagem tem o id apontado', () => {
    const saida = toggleInvalidoSource();
    expect(saida).toContain('aria-invalid="true" aria-describedby="formatacao-erro"');
    expect(saida).toContain('<p id="formatacao-erro" class="nds-text-body nds-text-destructive">');
  });
});

describe('transforms das stories de composição', () => {
  it('a barra é um grupo com nome próprio, e cada botão se nomeia sozinho', () => {
    const saida = toggleBarraDeFormatacaoSource();
    expect(saida).toContain('role="group"');
    expect(saida).toContain('aria-label="Formatação de texto"');
    const nomes = [...saida.matchAll(/<Toggle aria-label="([^"]+)"/g)].map((m) => m[1]);
    expect(nomes).toEqual(['Negrito', 'Itálico', 'Sublinhado', 'Lista']);
    // Os ícones do exemplo vêm todos declarados, sem import morto e sem faltar.
    expect(saida).toContain(`import { Bold, Italic, List, Underline } from 'lucide-vue-next'`);
  });

  it('os filtros não formam grupo: o texto visível já nomeia cada um', () => {
    const saida = filtersSourceToggleList();
    expect(saida).not.toContain('role="group"');
    expect(saida).not.toContain('aria-label=');
    expect(saida).toContain('<p class="nds-text-body nds-font-semibold">Filtros de exibição</p>');
  });

  it('o controlado leva o estado para a aplicação por v-model', () => {
    const saida = toggleControladoSource();
    expect(saida).toContain('<Toggle v-model="negrito" aria-label="Negrito">');
    expect(saida).toContain(`import { ref } from 'vue'`);
    expect(saida).toContain('const negrito = ref(false)');
    // Controlado e não-controlado no mesmo exemplo brigariam entre si.
    expect(saida).not.toContain('default-value');
  });

  it('o toggle de ícone é a mesma forma mínima nos dois metas que o usam', () => {
    // Um único export serve à variante padrão e ao estado desligado: os dois
    // renderizam a mesma composição, e duplicá-la abriria espaço para divergir.
    expect(toggleIconSource()).toContain('<Toggle aria-label="Negrito">');
    expect(toggleIconSource()).not.toContain('variant=');
  });
});
