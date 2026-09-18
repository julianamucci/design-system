import { describe, expect, it } from 'vitest';
import {
  toggleActiveSource,
  formattingToggleBarSource,
  toggleWithLabelSource,
  toggleContornoSource,
  toggleControlledSource,
  toggleDisabledSource,
  toggleFocusSource,
  toggleIconSource,
  toggleInvalidoSource,
  filtersToggleListSource,
  toggleSource,
  toggleSizesSource,
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
    const output = toggleSource('', { args: { iconOnly: false, label: 'Mostrar ocultos' } });
    // Um `aria-label` que discorde do texto visível quebra a WCAG 2.5.3.
    expect(output).not.toContain('aria-label=');
    expect(output).toContain('<Eye aria-hidden="true" />');
    expect(output).toContain('  Mostrar ocultos');
    expect(output).not.toContain('Bold');
  });

  it('não escreve variante nem degrau padrão — no componente eles são a ausência', () => {
    const output = toggleSource('', { args: { variant: 'default', size: 'default' } });
    expect(output).not.toContain('variant=');
    expect(output).not.toContain('size=');
  });

  it('variante e degrau fora do padrão chegam ao snippet', () => {
    const output = toggleSource('', { args: { variant: 'outline', size: 'lg', label: 'Negrito' } });
    expect(output).toContain('<Toggle variant="outline" size="lg" aria-label="Negrito">');
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
    const output = toggleSource('', { args: { label: (() => {}) as never } });
    expect(output).not.toContain('function');
    // Sem rótulo utilizável, o botão de ícone ainda precisa de um nome.
    expect(output).toContain('aria-label="Alternar"');
  });
});

describe('transforms das stories de variante', () => {
  it('o contorno se lê contra a variante sem borda ao lado', () => {
    const output = toggleContornoSource();
    expect([...output.matchAll(/<Toggle/g)]).toHaveLength(2);
    expect(output).toContain('<Toggle variant="outline" aria-label="Itálico">');
    expect(output).toContain('<Toggle aria-label="Negrito">');
  });

  it('com rótulo visível nenhum dos dois carrega aria-label', () => {
    const output = toggleWithLabelSource();
    expect(output).not.toContain('aria-label=');
    expect(output).toContain('  Mostrar ocultos\n');
    expect(output).toContain('default-value');
  });

  it('na escada, só o degrau do meio fica sem `size`', () => {
    const output = toggleSizesSource();
    expect(output).toContain('size="sm"');
    expect(output).toContain('size="lg"');
    expect([...output.matchAll(/size="/g)]).toHaveLength(2);
    expect(output).not.toContain('size="default"');
  });
});

describe('transforms das stories de estado', () => {
  it('o ligado parte de `default-value`, e não de `v-model`', () => {
    const output = toggleActiveSource();
    expect(output).toContain('<Toggle default-value aria-label="Negrito ativo">');
    expect(output).not.toContain('v-model');
  });

  it('o foco não escreve prop nenhuma — o anel vem do CSS do componente', () => {
    const output = toggleFocusSource();
    expect(output).not.toContain('focus');
    expect(output).not.toContain('tabindex');
    // O par existe para comparar: a variante com borda já tem sombra em repouso.
    expect([...output.matchAll(/<Toggle/g)]).toHaveLength(2);
  });

  it('o desabilitado usa o atributo nativo, nos dois estados', () => {
    const output = toggleDisabledSource();
    expect([...output.matchAll(/ disabled/g)]).toHaveLength(2);
    // `aria-disabled` sozinho deixaria o foco entrar num controle inerte.
    expect(output).not.toContain('aria-disabled');
    expect(output).toContain('disabled default-value');
  });

  it('o inválido aponta para a mensagem, e a mensagem tem o id apontado', () => {
    const output = toggleInvalidoSource();
    expect(output).toContain('aria-invalid="true" aria-describedby="formatacao-erro"');
    expect(output).toContain('<p id="formatacao-erro" class="nds-text-body nds-text-destructive">');
  });
});

describe('transforms das stories de composição', () => {
  it('a barra é um grupo com nome próprio, e cada botão se nomeia sozinho', () => {
    const output = formattingToggleBarSource();
    expect(output).toContain('role="group"');
    expect(output).toContain('aria-label="Formatação de texto"');
    const names = [...output.matchAll(/<Toggle aria-label="([^"]+)"/g)].map((m) => m[1]);
    expect(names).toEqual(['Negrito', 'Itálico', 'Sublinhado', 'Lista']);
    // Os ícones do exemplo vêm todos declarados, sem import morto e sem faltar.
    expect(output).toContain(`import { Bold, Italic, List, Underline } from 'lucide-vue-next'`);
  });

  it('os filtros não formam grupo: o texto visível já nomeia cada um', () => {
    const output = filtersToggleListSource();
    expect(output).not.toContain('role="group"');
    expect(output).not.toContain('aria-label=');
    expect(output).toContain('<p class="nds-text-body nds-font-semibold">Filtros de exibição</p>');
  });

  it('o controlado leva o estado para a aplicação por v-model', () => {
    const output = toggleControlledSource();
    expect(output).toContain('<Toggle v-model="negrito" aria-label="Negrito">');
    expect(output).toContain(`import { ref } from 'vue'`);
    expect(output).toContain('const negrito = ref(false)');
    // Controlado e não-controlado no mesmo exemplo brigariam entre si.
    expect(output).not.toContain('default-value');
  });

  it('o toggle de ícone é a mesma forma mínima nos dois metas que o usam', () => {
    // Um único export serve à variante padrão e ao estado desligado: os dois
    // renderizam a mesma composição, e duplicá-la abriria espaço para divergir.
    expect(toggleIconSource()).toContain('<Toggle aria-label="Negrito">');
    expect(toggleIconSource()).not.toContain('variant=');
  });
});
