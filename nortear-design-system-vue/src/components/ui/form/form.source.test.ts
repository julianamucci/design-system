import { describe, expect, it } from 'vitest';
import {
  formComDescricaoSource,
  formDesabilitadoSource,
  formFieldsetSource,
  formInvalidoSource,
  formMultiplosFieldsSource,
  formPaletaEscuraSource,
  formRotuloEControleSource,
  formSource,
} from './form.source';

describe('formSource', () => {
  it('sem args, entrega a forma canônica com rótulo, controle e apoio', () => {
    expect(formSource()).toBe(
      `<script setup lang="ts">
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
</script>

<template>
  <FormField
    class="nds-max-w-sm"
    label="Email"
    description="Usaremos apenas para contato."
  >
    <Input type="email" placeholder="ex: joao@empresa.com" />
  </FormField>
</template>`,
    );
  });

  it('não escreve id nem for — é o campo que fecha a associação', () => {
    const saida = formSource();
    // Escrevê-los no snippet ensinaria a fazer à mão o que o componente faz, e
    // um id repetido entre dois campos quebra o aria-describedby dos dois.
    expect(saida).not.toContain('id=');
    expect(saida).not.toContain('for=');
  });

  it('a mensagem de erro entra no campo e marca o controle como inválido', () => {
    const saida = formSource('', { args: { error: 'Endereço de email incompleto.' } });
    expect(saida).toContain('error="Endereço de email incompleto."');
    // Vermelho sozinho não alcança quem não enxerga cor.
    expect(saida).toContain('aria-invalid="true"');
  });

  it('aria-invalid sozinho não inventa mensagem de erro', () => {
    const saida = formSource('', { args: { ariaInvalid: true } });
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).not.toContain('error=');
  });

  it('omite o que está no padrão — repetir valor padrão ensina ruído', () => {
    const saida = formSource('', { args: { ariaInvalid: false, disabled: false } });
    expect(saida).not.toContain('aria-invalid');
    expect(saida).not.toContain('disabled');
    expect(saida).not.toContain('error=');
  });

  it('apagar a descrição no control tira o parágrafo de apoio do snippet', () => {
    const saida = formSource('', { args: { description: '' } });
    expect(saida).not.toContain('description=');
    expect(saida).toContain('label="Email"');
  });

  it('desabilitar liga o atributo no CONTROLE, não no campo', () => {
    const saida = formSource('', { args: { disabled: true } });
    expect(saida).toContain('<Input type="email" placeholder="ex: joao@empresa.com" disabled />');
    expect(saida).not.toContain('<FormField disabled');
  });

  it('ignora control que não é string — o espião vira ruído no painel', () => {
    const saida = formSource('', { args: { label: (() => {}) as never } });
    expect(saida).not.toContain('function');
    // Cair no padrão do meta é melhor que um campo anônimo: o rótulo é o
    // produto inteiro deste componente.
    expect(saida).toContain('label="Email"');
  });
});

describe('transforms das stories de variante', () => {
  it('a combinação mínima não traz apoio nem erro', () => {
    const saida = formRotuloEControleSource();
    expect(saida).toContain('label="Nome completo"');
    expect(saida).not.toContain('description=');
    expect(saida).not.toContain('error=');
  });

  it('a variante com apoio troca o tipo do controle e traz o autocomplete', () => {
    const saida = formComDescricaoSource();
    expect(saida).toContain('description="Use pelo menos 8 caracteres, com letras e números."');
    expect(saida).toContain('<Input type="password" autocomplete="new-password" />');
  });
});

describe('transforms das stories de estado', () => {
  it('o inválido traz valor de verdade, e o valor mora num ref', () => {
    const saida = formInvalidoSource();
    // `model-value` fixo é recurso de story: quem consome liga um estado.
    expect(saida).toContain(`const senha = ref('123')`);
    expect(saida).toContain('v-model="senha"');
    expect(saida).not.toContain('model-value=');
    expect(saida).toContain('error="A senha precisa ter pelo menos 8 caracteres."');
  });

  it('o desabilitado mantém rótulo e apoio, e não vira erro', () => {
    const saida = formDesabilitadoSource();
    expect(saida).toContain('label="CPF"');
    expect(saida).toContain('description="Preenchido pelo cadastro da empresa."');
    expect(saida).toContain('disabled');
    expect(saida).not.toContain('error=');
    expect(saida).not.toContain('aria-invalid');
  });

  it('a paleta escura é tema do documento, não classe na marcação', () => {
    const saida = formPaletaEscuraSource();
    // Escrever `.dark` no snippet ensinaria a prender a paleta ao componente.
    expect(saida).not.toContain('dark');
    expect(saida).toContain('<Fieldset legend="Endereço de entrega">');
    // Três campos numa pilha: é a composição que a story renderiza.
    expect([...saida.matchAll(/<FormField/g)]).toHaveLength(3);
  });
});

describe('transforms das stories de composição', () => {
  it('a legenda é o PRIMEIRO filho do grupo', () => {
    const saida = formFieldsetSource();
    // Fora da primeira posição ela deixa de rotular o grupo: o texto continua
    // na tela e o grupo fica anônimo. No snippet isso é ordem de atributo e de
    // linha, e é a única forma de ensinar a regra.
    expect(saida).toContain('<Fieldset class="nds-max-w-sm" legend="Endereço de entrega">');
    expect(saida.indexOf('legend=')).toBeLessThan(saida.indexOf('<FormField'));
  });

  it('o formulário inteiro passa três tipos de controle pelo mesmo campo', () => {
    const saida = formMultiplosFieldsSource();
    expect(saida).toContain('<Input type="text" name="nome"');
    expect(saida).toContain('<Textarea name="bio" :rows="3" />');
    expect(saida).toContain('<Button type="submit">Salvar</Button>');
  });

  it('a ordem de tabulação é a do DOM — nenhum tabindex a escrever', () => {
    expect(formMultiplosFieldsSource()).not.toContain('tabindex');
  });

  it('o envio é barrado pelo modificador, não por um handler de story', () => {
    const saida = formMultiplosFieldsSource();
    expect(saida).toContain('@submit.prevent="salvar"');
    expect(saida).not.toContain('preventDefault');
  });
});
