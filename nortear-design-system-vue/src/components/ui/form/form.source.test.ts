import { describe, expect, it } from 'vitest';
import {
  formWithDescriptionSource,
  formDisabledSource,
  formFieldsetSource,
  formInvalidoSource,
  formMultiplosFieldsSource,
  formPaletteDarkSource,
  formLabelEControleSource,
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
    const output = formSource();
    // Escrevê-los no snippet ensinaria a fazer à mão o que o componente faz, e
    // um id repetido entre dois campos quebra o aria-describedby dos dois.
    expect(output).not.toContain('id=');
    expect(output).not.toContain('for=');
  });

  it('a mensagem de erro entra no campo e marca o controle como inválido', () => {
    const output = formSource('', { args: { error: 'Endereço de email incompleto.' } });
    expect(output).toContain('error="Endereço de email incompleto."');
    // Vermelho sozinho não alcança quem não enxerga cor.
    expect(output).toContain('aria-invalid="true"');
  });

  it('aria-invalid sozinho não inventa mensagem de erro', () => {
    const output = formSource('', { args: { ariaInvalid: true } });
    expect(output).toContain('aria-invalid="true"');
    expect(output).not.toContain('error=');
  });

  it('omite o que está no padrão — repetir valor padrão ensina ruído', () => {
    const output = formSource('', { args: { ariaInvalid: false, disabled: false } });
    expect(output).not.toContain('aria-invalid');
    expect(output).not.toContain('disabled');
    expect(output).not.toContain('error=');
  });

  it('apagar a descrição no control tira o parágrafo de apoio do snippet', () => {
    const output = formSource('', { args: { description: '' } });
    expect(output).not.toContain('description=');
    expect(output).toContain('label="Email"');
  });

  it('desabilitar liga o atributo no CONTROLE, não no campo', () => {
    const output = formSource('', { args: { disabled: true } });
    expect(output).toContain('<Input type="email" placeholder="ex: joao@empresa.com" disabled />');
    expect(output).not.toContain('<FormField disabled');
  });

  it('ignora control que não é string — o espião vira ruído no painel', () => {
    const output = formSource('', { args: { label: (() => {}) as never } });
    expect(output).not.toContain('function');
    // Cair no padrão do meta é melhor que um campo anônimo: o rótulo é o
    // produto inteiro deste componente.
    expect(output).toContain('label="Email"');
  });
});

describe('transforms das stories de variante', () => {
  it('a combinação mínima não traz apoio nem erro', () => {
    const output = formLabelEControleSource();
    expect(output).toContain('label="Nome completo"');
    expect(output).not.toContain('description=');
    expect(output).not.toContain('error=');
  });

  it('a variante com apoio troca o tipo do controle e traz o autocomplete', () => {
    const output = formWithDescriptionSource();
    expect(output).toContain('description="Use pelo menos 8 caracteres, com letras e números."');
    expect(output).toContain('<Input type="password" autocomplete="new-password" />');
  });
});

describe('transforms das stories de estado', () => {
  it('o inválido traz valor de verdade, e o valor mora num ref', () => {
    const output = formInvalidoSource();
    // `model-value` fixo é recurso de story: quem consome liga um estado.
    expect(output).toContain(`const senha = ref('123')`);
    expect(output).toContain('v-model="senha"');
    expect(output).not.toContain('model-value=');
    expect(output).toContain('error="A senha precisa ter pelo menos 8 caracteres."');
  });

  it('o desabilitado mantém rótulo e apoio, e não vira erro', () => {
    const output = formDisabledSource();
    expect(output).toContain('label="CPF"');
    expect(output).toContain('description="Preenchido pelo cadastro da empresa."');
    expect(output).toContain('disabled');
    expect(output).not.toContain('error=');
    expect(output).not.toContain('aria-invalid');
  });

  it('a paleta escura é tema do documento, não classe na marcação', () => {
    const output = formPaletteDarkSource();
    // Escrever `.dark` no snippet ensinaria a prender a paleta ao componente.
    expect(output).not.toContain('dark');
    expect(output).toContain('<Fieldset legend="Endereço de entrega">');
    // Três campos numa pilha: é a composição que a story renderiza.
    expect([...output.matchAll(/<FormField/g)]).toHaveLength(3);
  });
});

describe('transforms das stories de composição', () => {
  it('a legenda é o PRIMEIRO filho do grupo', () => {
    const output = formFieldsetSource();
    // Fora da primeira posição ela deixa de rotular o grupo: o texto continua
    // na tela e o grupo fica anônimo. No snippet isso é ordem de atributo e de
    // linha, e é a única forma de ensinar a regra.
    expect(output).toContain('<Fieldset class="nds-max-w-sm" legend="Endereço de entrega">');
    expect(output.indexOf('legend=')).toBeLessThan(output.indexOf('<FormField'));
  });

  it('o formulário inteiro passa três tipos de controle pelo mesmo campo', () => {
    const output = formMultiplosFieldsSource();
    expect(output).toContain('<Input type="text" name="nome"');
    expect(output).toContain('<Textarea name="bio" :rows="3" />');
    expect(output).toContain('<Button type="submit">Salvar</Button>');
  });

  it('a ordem de tabulação é a do DOM — nenhum tabindex a escrever', () => {
    expect(formMultiplosFieldsSource()).not.toContain('tabindex');
  });

  it('o envio é barrado pelo modificador, não por um handler de story', () => {
    const output = formMultiplosFieldsSource();
    expect(output).toContain('@submit.prevent="salvar"');
    expect(output).not.toContain('preventDefault');
  });
});
