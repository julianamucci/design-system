import { describe, expect, it } from 'vitest';
import {
  textareaWithHelperSource,
  textareaWithCounterSource,
  textareaWithLabelSource,
  textareaDisabledSource,
  textareaInvalidoSource,
  textareaObrigatorioSource,
  textareaDefaultSource,
  textareaPreenchidoSource,
  textareaNoRedimensionarSource,
  textareaSomenteLeituraSource,
  textareaSource,
} from './textarea.source';

/** Os mesmos args que o `meta` declara — é a saída que o painel realmente mostra. */
const PANEL_ARGS = {
  placeholder: 'ex: Descreva o produto...',
  disabled: false,
  readonly: false,
  maxlength: 500,
  rows: 3,
};

describe('textareaSource', () => {
  it('com os args do painel, entrega rótulo, campo e contador', () => {
    expect(textareaSource('', { args: PANEL_ARGS })).toBe(
      `<script setup lang="ts">
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ref } from 'vue'

const descricao = ref('')
const maximo = 500
</script>

<template>
  <div class="nds-stack nds-w-md" data-spacing="sm">
    <Label for="descricao">Descrição</Label>
    <Textarea
      id="descricao"
      v-model="descricao"
      :maxlength="maximo"
      placeholder="ex: Descreva o produto..."
      :rows="3"
      class="nds-resize-y nds-min-h-30"
    />
    <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
      <span>Descreva o produto com clareza.</span>
      <span
        aria-live="polite"
        :aria-label="\`\${descricao.length} de \${maximo} caracteres usados\`"
      >
        {{ descricao.length }}/{{ maximo }}
      </span>
    </div>
  </div>
</template>`,
    );
  });

  it('sem limite, o contador some junto — contar sem teto não informa nada', () => {
    const output = textareaSource('', { args: { ...PANEL_ARGS, maxlength: 0 } });
    expect(output).not.toContain('aria-live');
    expect(output).not.toContain('maxlength');
    expect(output).not.toContain('const maximo');
  });

  it('os bloqueios só aparecem quando ligados', () => {
    const soltos = textareaSource('', { args: PANEL_ARGS });
    expect(soltos).not.toContain('disabled');
    expect(soltos).not.toContain('readonly');

    const travados = textareaSource('', {
      args: { ...PANEL_ARGS, disabled: true, readonly: true },
    });
    expect(travados).toContain('  readonly\n');
    expect(travados).toContain('  disabled\n');
  });

  it('não escreve o número de linhas padrão do elemento', () => {
    expect(textareaSource('', { args: { ...PANEL_ARGS, rows: 2 } })).not.toContain('rows');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = textareaSource('', {
      args: { ...PANEL_ARGS, placeholder: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('placeholder');
  });
});

describe('o par mínimo', () => {
  it('vincula rótulo e campo pelo mesmo id, e traz a moldura no class', () => {
    const output = textareaWithLabelSource();
    expect(output).toContain('<Label for="descricao">Descrição</Label>');
    expect(output).toContain('id="descricao"');
    // A moldura é escolha de uso, e por isso mora no `class`, não no componente.
    expect(output).toContain('class="nds-resize-y nds-min-h-30"');
    // Sem estado, sem import de `ref`.
    expect(output).not.toContain(`from 'vue'`);
  });
});

describe('transforms das stories de variante', () => {
  it('a padrão é o par mínimo num campo de texto livre', () => {
    const output = textareaDefaultSource();
    expect(output).toContain('<Label for="biografia">Biografia</Label>');
    expect(output).toContain('nds-resize-y');
  });

  it('o contador anda junto com o limite, e é anunciado por extenso', () => {
    const output = textareaWithCounterSource();
    expect(output).toContain(':maxlength="maximo"');
    expect(output).toContain('aria-live="polite"');
    // Lido cru, "123/500" vira "cento e vinte e três barra quinhentos".
    expect(output).toContain('caracteres usados');
    expect(output).toContain(`const maximo = 500`);
  });

  it('sem alça, a troca é de classe — não existe prop de redimensionamento', () => {
    const output = textareaNoRedimensionarSource();
    expect(output).toContain('class="nds-resize-none nds-min-h-30"');
    expect(output).not.toContain('nds-resize-y');
    expect(output).not.toContain('resize=');
  });
});

describe('transforms das stories de estado', () => {
  it('o preenchido troca o placeholder pelo valor de partida', () => {
    const output = textareaPreenchidoSource();
    expect(output).toContain('default-value="Designer e desenvolvedora');
    // Os dois nunca aparecem juntos: o valor cobre o texto de exemplo.
    expect(output).not.toContain('placeholder');
  });

  it('o desabilitado escreve só o bloqueio', () => {
    const output = textareaDisabledSource();
    expect(output).toContain('  disabled\n');
    expect(output).not.toContain('readonly');
  });

  it('o somente leitura vem sempre com conteúdo — é o valor que se lê', () => {
    const output = textareaSomenteLeituraSource();
    expect(output).toContain('  readonly\n');
    expect(output).toContain('default-value="Pedido confirmado');
    expect(output).not.toContain('disabled');
  });

  it('o inválido aponta para a mensagem, e a mensagem tem o id apontado', () => {
    const output = textareaInvalidoSource();
    expect(output).toContain('aria-invalid="true"');
    expect(output).toContain('aria-describedby="descricao-erro"');
    expect(output).toContain('<p id="descricao-erro" class="nds-text-caption nds-text-destructive">');
  });
});

describe('transforms das stories de composição', () => {
  it('o texto de apoio usa o mesmo vínculo do erro, e fica fora do rótulo', () => {
    const output = textareaWithHelperSource();
    expect(output).toContain('aria-describedby="biografia-apoio"');
    expect(output).toContain('<p id="biografia-apoio" class="nds-text-body">');
    // Dentro do Label, a orientação viraria parte do nome acessível do campo.
    expect(output).toContain('<Label for="biografia">Biografia</Label>');
  });

  it('no obrigatório o asterisco é decoração e quem anuncia é aria-required', () => {
    const output = textareaObrigatorioSource();
    expect(output).toContain('<span class="nds-text-destructive" aria-hidden="true">*</span>');
    expect(output).toContain('aria-required="true"');
    // A legenda é o que dá sentido ao asterisco para quem enxerga.
    expect(output).toContain('Campos com * são obrigatórios.');
  });
});
