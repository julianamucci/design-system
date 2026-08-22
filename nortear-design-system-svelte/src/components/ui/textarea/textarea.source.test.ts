import { describe, expect, it } from 'vitest';
import {
  textareaComApoioSource,
  textareaComContadorSource,
  textareaWithErrorSource,
  textareaContadorAcessivelSource,
  textareaDesabilitadoSource,
  textareaEmModalSource,
  textareaInvalidoSource,
  textareaPadraoSource,
  textareaPreenchidoSource,
  textareaSemRedimensionarSource,
  textareaSomenteLeituraSource,
  textareaSource,
} from './textarea.source';

describe('textareaSource', () => {
  it('sem args, entrega o par rótulo + campo e nada mais', () => {
    expect(textareaSource()).toBe(
      `<script lang="ts">
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";

  let value = $state("");
</script>

<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="descricao">Descrição</Label>
  <Textarea id="descricao" bind:value />
</div>`,
    );
  });

  it('o rótulo aponta para o id do campo — é o que faz o clique focar', () => {
    const saida = textareaSource();
    expect(saida).toContain('<Label for="descricao">');
    expect(saida).toContain('id="descricao"');
  });

  it('não repete o que a folha já entrega: resize e altura mínima ficam de fora', () => {
    const saida = textareaSource();
    expect(saida).not.toContain('nds-resize');
    expect(saida).not.toContain('nds-min-h');
  });

  it('o placeholder do control chega ao snippet', () => {
    expect(textareaSource('', { args: { placeholder: 'ex: Descreva o produto...' } })).toContain(
      'placeholder="ex: Descreva o produto..."',
    );
    expect(textareaSource()).not.toContain('placeholder');
  });

  it('maxLength escreve o atributo e traz o contador junto', () => {
    const saida = textareaSource('', { args: { maxLength: 500 } });
    expect(saida).toContain('maxlength={500}');
    expect(saida).toContain('aria-live="polite"');
    expect(saida).toContain('{value.length}/500');
    // Sem limite não há o que contar.
    expect(textareaSource()).not.toContain('aria-live');
  });

  it('só escreve disabled, readonly e aria-invalid quando diferem do padrão', () => {
    expect(textareaSource()).not.toContain('disabled');
    expect(textareaSource()).not.toContain('readonly');
    expect(textareaSource()).not.toContain('aria-invalid');
    expect(textareaSource('', { args: { disabled: true } })).toContain('disabled');
    expect(textareaSource('', { args: { readonly: true } })).toContain('readonly');
    expect(textareaSource('', { args: { 'aria-invalid': 'true' } })).toContain(
      'aria-invalid="true"',
    );
  });

  it('a fila longa de atributos quebra uma linha por atributo', () => {
    const saida = textareaSource('', {
      args: { placeholder: 'ex: Descreva o produto em até 500 caracteres...', maxLength: 500 },
    });
    expect(saida).toContain('  <Textarea\n    id="descricao"\n    bind:value\n');
    expect(saida).toContain('\n  />');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a variante padrão não trava o redimensionamento', () => {
    expect(textareaPadraoSource()).not.toContain('nds-resize-none');
    expect(textareaPadraoSource()).toContain('<Label for="biografia">Biografia</Label>');
  });

  it('a variante com contador liga o limite à contagem anunciada', () => {
    const saida = textareaComContadorSource();
    expect(saida).toContain('maxlength={500}');
    expect(saida).toContain('aria-label="{value.length} de 500 caracteres usados"');
  });

  it('a variante sem redimensionamento é a única que traz a classe', () => {
    expect(textareaSemRedimensionarSource()).toContain('class="nds-resize-none"');
  });

  it('o estado preenchido nasce do $state, não de um atributo value', () => {
    const saida = textareaPreenchidoSource();
    expect(saida).toContain('let value = $state("Camiseta de algodão pima');
    expect(saida).not.toContain('value="');
  });

  it('o estado desabilitado escreve a prop nua', () => {
    expect(textareaDesabilitadoSource()).toContain('disabled />');
  });

  it('o estado inválido aponta para uma mensagem que existe no snippet', () => {
    const saida = textareaInvalidoSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('aria-describedby="descricao-erro"');
    expect(saida).toContain('<p id="descricao-erro"');
  });

  it('o estado somente leitura mantém o valor e trava a edição', () => {
    const saida = textareaSomenteLeituraSource();
    expect(saida).toContain('readonly />');
    expect(saida).toContain('Pedido confirmado');
  });

  it('a composição com apoio traz o parágrafo em tom apagado', () => {
    expect(textareaComApoioSource()).toContain('nds-text-muted-foreground');
  });

  it('a composição do contador acessível usa o limite de 200', () => {
    const saida = textareaContadorAcessivelSource();
    expect(saida).toContain('maxlength={200}');
    expect(saida).toContain('{value.length}/200');
  });

  it('a composição com erro cruza describedby e id da mensagem', () => {
    const saida = textareaWithErrorSource();
    expect(saida).toContain('aria-describedby="feedback-erro"');
    expect(saida).toContain('<p id="feedback-erro"');
  });

  it('a composição em modal trava o redimensionamento', () => {
    expect(textareaEmModalSource()).toContain('class="nds-resize-none"');
  });
});
