import { describe, expect, it } from 'vitest';
import {
  formComDescricaoSource,
  formDesabilitadoSource,
  formFieldsetSource,
  formInvalidoSource,
  formPaletaEscuraSource,
  formRotuloEControleSource,
  formSource,
  formMultipleFieldsSource,
} from './form.source';

describe('formSource', () => {
  it('sem args, entrega o campo canônico — e nem o rótulo nem o controle levam id', () => {
    expect(formSource()).toBe(
      `<script lang="ts">
  import { FormField } from "@/components/ui/form";
  import { Input } from "@/components/ui/input";
</script>

<FormField label="Email" description="Usaremos apenas para contato.">
  <Input type="email" placeholder="ex: joao@empresa.com" />
</FormField>`,
    );
  });

  it('a associação é do campo: o snippet nunca escreve id nem for', () => {
    // É a lição do componente. Um snippet que escrevesse `for`/`id` ensinaria a
    // fazer à mão o que o campo já faz — e a duplicata é o que quebra depois.
    const saida = formSource('', { args: { error: 'Campo obrigatório.' } });
    // `\b` de propósito: `aria-invalid="true"` termina em `id="` e passaria num
    // `toContain('id=')` sem que exista atributo `id` nenhum no snippet.
    expect(saida).not.toMatch(/\bid="/);
    expect(saida).not.toMatch(/\bfor="/);
    expect(saida).not.toContain('aria-describedby');
  });

  it('acompanha o control do rótulo', () => {
    expect(formSource('', { args: { label: 'Telefone' } })).toContain('label="Telefone"');
  });

  it('só escreve a descrição quando ela existe', () => {
    expect(formSource('', { args: { description: '' } })).not.toContain('description=');
    expect(formSource('', { args: { description: 'Só o DDD e o número.' } })).toContain(
      'description="Só o DDD e o número."',
    );
  });

  it('a mensagem de erro traz o aria-invalid junto, no controle', () => {
    const semErro = formSource();
    expect(semErro).not.toContain('error=');
    expect(semErro).not.toContain('aria-invalid');

    const comErro = formSource('', { args: { error: 'Endereço incompleto.' } });
    expect(comErro).toContain('error="Endereço incompleto."');
    expect(comErro).toContain('aria-invalid="true"');
  });

  it('o control de aria-invalid vale sozinho, sem mensagem escrita', () => {
    const saida = formSource('', { args: { ariaInvalid: true } });
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).not.toContain('error=');
  });

  it('só escreve disabled quando o valor difere do padrão', () => {
    expect(formSource('', { args: { disabled: false } })).not.toContain('disabled');
    expect(formSource('', { args: { disabled: true } })).toContain('disabled');
  });

  it('quebra uma linha por atributo quando a fila do campo fica longa', () => {
    const saida = formSource('', {
      args: {
        label: 'Senha',
        description: 'Use pelo menos 8 caracteres, com letras e números.',
        error: 'A senha precisa ter pelo menos 8 caracteres.',
      },
    });
    expect(saida).toContain(`<FormField
  label="Senha"
  description="Use pelo menos 8 caracteres, com letras e números."
  error="A senha precisa ter pelo menos 8 caracteres."
>`);
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a combinação mínima não traz nada abaixo do controle', () => {
    const saida = formRotuloEControleSource();
    expect(saida).toContain('<FormField label="Nome completo">');
    expect(saida).not.toContain('description=');
    expect(saida).not.toContain('error=');
  });

  it('a variação com apoio traz a descrição e o vocabulário de autocomplete', () => {
    const saida = formComDescricaoSource();
    expect(saida).toContain('description="Use pelo menos 8 caracteres, com letras e números."');
    expect(saida).toContain('autocomplete="new-password"');
  });

  it('o estado inválido escreve a mensagem e marca o controle', () => {
    const saida = formInvalidoSource();
    expect(saida).toContain('error="A senha precisa ter pelo menos 8 caracteres."');
    expect(saida).toContain('aria-invalid="true"');
  });

  it('o estado desabilitado mantém rótulo e apoio, e bloqueia só o controle', () => {
    const saida = formDesabilitadoSource();
    expect(saida).toContain('label="CPF"');
    expect(saida).toContain('description="Preenchido pelo cadastro da empresa."');
    expect(saida).toContain('disabled');
  });

  it('a paleta escura reúne campo simples, campo com erro e grupo', () => {
    const saida = formPaletaEscuraSource();
    expect(saida).toContain('error="Endereço de email incompleto."');
    expect(saida).toContain('<Fieldset legend="Endereço de entrega">');
  });

  it('o agrupamento usa Fieldset com legenda, e não um título por cima', () => {
    const saida = formFieldsetSource();
    expect(saida).toContain('import { Fieldset, FormField } from "@/components/ui/form";');
    expect(saida).toContain('<Fieldset legend="Endereço de entrega">');
    expect(saida.match(/<FormField label="/g)).toHaveLength(2);
  });

  it('o formulário inteiro passa por três controles diferentes', () => {
    const saida = formMultipleFieldsSource();
    expect(saida).toContain('<form class="nds-stack">');
    expect(saida).toContain('<Textarea name="bio" rows={3} />');
    expect(saida).toContain('<Button type="submit">Salvar</Button>');
    // Cada campo embrulha o SEU controle: uma <textarea> passa pelo mesmo campo
    // que um <input>, e é isso que a composição precisa mostrar.
    expect(saida.match(/<FormField /g)).toHaveLength(3);
  });
});
