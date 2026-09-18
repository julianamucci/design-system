import { describe, expect, it } from 'vitest';
import {
  textareaWithHelperSource,
  textareaWithCounterSource,
  textareaWithErrorSource,
  textareaCounterAccessibleSource,
  textareaDisabledSource,
  textareaEmModalSource,
  textareaInvalidoSource,
  textareaDefaultSource,
  textareaPreenchidoSource,
  textareaNoRedimensionarSource,
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
    const output = textareaSource();
    expect(output).toContain('<Label for="descricao">');
    expect(output).toContain('id="descricao"');
  });

  it('não repete o que a folha já entrega: resize e altura mínima ficam de fora', () => {
    const output = textareaSource();
    expect(output).not.toContain('nds-resize');
    expect(output).not.toContain('nds-min-h');
  });

  it('o placeholder do control chega ao snippet', () => {
    expect(textareaSource('', { args: { placeholder: 'ex: Descreva o produto...' } })).toContain(
      'placeholder="ex: Descreva o produto..."',
    );
    expect(textareaSource()).not.toContain('placeholder');
  });

  it('maxLength escreve o atributo e traz o contador junto', () => {
    const output = textareaSource('', { args: { maxLength: 500 } });
    expect(output).toContain('maxlength={500}');
    expect(output).toContain('aria-live="polite"');
    expect(output).toContain('{value.length}/500');
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
    const output = textareaSource('', {
      args: { placeholder: 'ex: Descreva o produto em até 500 caracteres...', maxLength: 500 },
    });
    expect(output).toContain('  <Textarea\n    id="descricao"\n    bind:value\n');
    expect(output).toContain('\n  />');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a variante padrão não trava o redimensionamento', () => {
    expect(textareaDefaultSource()).not.toContain('nds-resize-none');
    expect(textareaDefaultSource()).toContain('<Label for="biografia">Biografia</Label>');
  });

  it('a variante com contador liga o limite à contagem anunciada', () => {
    const output = textareaWithCounterSource();
    expect(output).toContain('maxlength={500}');
    expect(output).toContain('aria-label="{value.length} de 500 caracteres usados"');
  });

  it('a variante sem redimensionamento é a única que traz a classe', () => {
    expect(textareaNoRedimensionarSource()).toContain('class="nds-resize-none"');
  });

  it('o estado preenchido nasce do $state, não de um atributo value', () => {
    const output = textareaPreenchidoSource();
    expect(output).toContain('let value = $state("Camiseta de algodão pima');
    expect(output).not.toContain('value="');
  });

  it('o estado desabilitado escreve a prop nua', () => {
    expect(textareaDisabledSource()).toContain('disabled />');
  });

  it('o estado inválido aponta para uma mensagem que existe no snippet', () => {
    const output = textareaInvalidoSource();
    expect(output).toContain('aria-invalid="true"');
    expect(output).toContain('aria-describedby="descricao-erro"');
    expect(output).toContain('<p id="descricao-erro"');
  });

  it('o estado somente leitura mantém o valor e trava a edição', () => {
    const output = textareaSomenteLeituraSource();
    expect(output).toContain('readonly />');
    expect(output).toContain('Pedido confirmado');
  });

  it('a composição com apoio traz o parágrafo em tom apagado', () => {
    expect(textareaWithHelperSource()).toContain('nds-text-muted-foreground');
  });

  it('a composição do contador acessível usa o limite de 200', () => {
    const output = textareaCounterAccessibleSource();
    expect(output).toContain('maxlength={200}');
    expect(output).toContain('{value.length}/200');
  });

  it('a composição com erro cruza describedby e id da mensagem', () => {
    const output = textareaWithErrorSource();
    expect(output).toContain('aria-describedby="feedback-erro"');
    expect(output).toContain('<p id="feedback-erro"');
  });

  it('a composição em modal trava o redimensionamento', () => {
    expect(textareaEmModalSource()).toContain('class="nds-resize-none"');
  });
});
