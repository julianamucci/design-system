import { describe, expect, it } from 'vitest';
import {
  textareaComApoioSource,
  textareaComContadorSource,
  textareaComRotuloSource,
  textareaDesabilitadoSource,
  textareaInvalidoSource,
  textareaObrigatorioSource,
  textareaPadraoSource,
  textareaPreenchidoSource,
  textareaSemRedimensionarSource,
  textareaSomenteLeituraSource,
  textareaSource,
} from './textarea.source';

/** Os mesmos args que o `meta` declara — é a saída que o painel realmente mostra. */
const ARGS_DO_PAINEL = {
  placeholder: 'ex: Descreva o produto...',
  disabled: false,
  readonly: false,
  maxlength: 500,
  rows: 3,
};

describe('textareaSource', () => {
  it('com os args do painel, entrega rótulo, campo e contador', () => {
    expect(textareaSource('', { args: ARGS_DO_PAINEL })).toBe(
      `<script setup lang="ts">
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ref } from 'vue'

const descricao = ref('')
const maximo = 500
</script>

<template>
  <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
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
    const saida = textareaSource('', { args: { ...ARGS_DO_PAINEL, maxlength: 0 } });
    expect(saida).not.toContain('aria-live');
    expect(saida).not.toContain('maxlength');
    expect(saida).not.toContain('const maximo');
  });

  it('os bloqueios só aparecem quando ligados', () => {
    const soltos = textareaSource('', { args: ARGS_DO_PAINEL });
    expect(soltos).not.toContain('disabled');
    expect(soltos).not.toContain('readonly');

    const travados = textareaSource('', {
      args: { ...ARGS_DO_PAINEL, disabled: true, readonly: true },
    });
    expect(travados).toContain('  readonly\n');
    expect(travados).toContain('  disabled\n');
  });

  it('não escreve o número de linhas padrão do elemento', () => {
    expect(textareaSource('', { args: { ...ARGS_DO_PAINEL, rows: 2 } })).not.toContain('rows');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = textareaSource('', {
      args: { ...ARGS_DO_PAINEL, placeholder: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('placeholder');
  });
});

describe('o par mínimo', () => {
  it('vincula rótulo e campo pelo mesmo id, e traz a moldura no class', () => {
    const saida = textareaComRotuloSource();
    expect(saida).toContain('<Label for="descricao">Descrição</Label>');
    expect(saida).toContain('id="descricao"');
    // A moldura é escolha de uso, e por isso mora no `class`, não no componente.
    expect(saida).toContain('class="nds-resize-y nds-min-h-30"');
    // Sem estado, sem import de `ref`.
    expect(saida).not.toContain(`from 'vue'`);
  });
});

describe('transforms das stories de variante', () => {
  it('a padrão é o par mínimo num campo de texto livre', () => {
    const saida = textareaPadraoSource();
    expect(saida).toContain('<Label for="biografia">Biografia</Label>');
    expect(saida).toContain('nds-resize-y');
  });

  it('o contador anda junto com o limite, e é anunciado por extenso', () => {
    const saida = textareaComContadorSource();
    expect(saida).toContain(':maxlength="maximo"');
    expect(saida).toContain('aria-live="polite"');
    // Lido cru, "123/500" vira "cento e vinte e três barra quinhentos".
    expect(saida).toContain('caracteres usados');
    expect(saida).toContain(`const maximo = 500`);
  });

  it('sem alça, a troca é de classe — não existe prop de redimensionamento', () => {
    const saida = textareaSemRedimensionarSource();
    expect(saida).toContain('class="nds-resize-none nds-min-h-30"');
    expect(saida).not.toContain('nds-resize-y');
    expect(saida).not.toContain('resize=');
  });
});

describe('transforms das stories de estado', () => {
  it('o preenchido troca o placeholder pelo valor de partida', () => {
    const saida = textareaPreenchidoSource();
    expect(saida).toContain('default-value="Designer e desenvolvedora');
    // Os dois nunca aparecem juntos: o valor cobre o texto de exemplo.
    expect(saida).not.toContain('placeholder');
  });

  it('o desabilitado escreve só o bloqueio', () => {
    const saida = textareaDesabilitadoSource();
    expect(saida).toContain('  disabled\n');
    expect(saida).not.toContain('readonly');
  });

  it('o somente leitura vem sempre com conteúdo — é o valor que se lê', () => {
    const saida = textareaSomenteLeituraSource();
    expect(saida).toContain('  readonly\n');
    expect(saida).toContain('default-value="Pedido confirmado');
    expect(saida).not.toContain('disabled');
  });

  it('o inválido aponta para a mensagem, e a mensagem tem o id apontado', () => {
    const saida = textareaInvalidoSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('aria-describedby="descricao-erro"');
    expect(saida).toContain('<p id="descricao-erro" class="nds-text-caption nds-text-destructive">');
  });
});

describe('transforms das stories de composição', () => {
  it('o texto de apoio usa o mesmo vínculo do erro, e fica fora do rótulo', () => {
    const saida = textareaComApoioSource();
    expect(saida).toContain('aria-describedby="biografia-apoio"');
    expect(saida).toContain('<p id="biografia-apoio" class="nds-text-body">');
    // Dentro do Label, a orientação viraria parte do nome acessível do campo.
    expect(saida).toContain('<Label for="biografia">Biografia</Label>');
  });

  it('no obrigatório o asterisco é decoração e quem anuncia é aria-required', () => {
    const saida = textareaObrigatorioSource();
    expect(saida).toContain('<span class="nds-text-destructive" aria-hidden="true">*</span>');
    expect(saida).toContain('aria-required="true"');
    // A legenda é o que dá sentido ao asterisco para quem enxerga.
    expect(saida).toContain('Campos com * são obrigatórios.');
  });
});
