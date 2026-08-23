import { describe, expect, it } from 'vitest';
import {
  formWithFieldsetSnippet,
  formWithMultipleFieldsSnippet,
  formSnippet,
  formSource,
  formSourceWith,
} from './form.source';

describe('formSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = formSnippet();
    expect(code).toContain("import { createFormField } from '@/components/ui/form';");
    expect(code).toContain('createFormField({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('aria-describedby');
  });

  it('mostra o CAMPO inteiro, e não um rótulo solto ao lado de um controle solto', () => {
    // O produto deste componente é a costura de acessibilidade: `for` ↔ `id`,
    // id gerado, descrição entrando no `aria-describedby`. Nada disso existe
    // quando se escreve o par à mão.
    const code = formSnippet();
    expect(code).toContain('label:');
    expect(code).toContain('input: createInput(');
    expect(code).not.toContain('createLabel');
  });

  it('omite as peças opcionais que a story não usa', () => {
    const code = formSnippet();
    expect(code).not.toContain('description');
    expect(code).not.toContain('error');
    expect(code).not.toContain('aria-invalid');
    expect(code).not.toContain('disabled');
  });

  it('mostra as peças quando a story as usa', () => {
    const code = formSnippet({
      label: 'Senha',
      inputType: 'password',
      value: '123',
      description: 'Use pelo menos 8 caracteres, com letras e números.',
      error: 'A senha precisa ter pelo menos 8 caracteres.',
      ariaInvalid: true,
    });
    expect(code).toContain("label: 'Senha'");
    expect(code).toContain("type: 'password'");
    expect(code).toContain("description: 'Use pelo menos 8 caracteres, com letras e números.'");
    expect(code).toContain("error: 'A senha precisa ter pelo menos 8 caracteres.'");
  });

  it('o aria-invalid é escrito no CONTROLE, porque a fábrica não o escreve', () => {
    // A fábrica deliberadamente não tem fonte de verdade sobre validade. Um
    // snippet que passasse `ariaInvalid` para `createFormField` inventaria API.
    const code = formSnippet({ ariaInvalid: true });
    expect(code).toContain("controle.setAttribute('aria-invalid', 'true');");
    expect(code).toContain('input: controle');
    expect(code).not.toContain('ariaInvalid');
  });

  it('não vaza helper de story', () => {
    const code = formSnippet({ description: 'Usaremos apenas para contato.' });
    expect(code).not.toContain('buildField');
    expect(code).not.toContain('ordemDeTabulacao');
    expect(code).not.toContain('contrastesNosDoisModos');
    expect(code).not.toContain('nds-max-w-sm');
  });
});

describe('formSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = formSource('<div data-slot="field">', {});
    const withArgs = formSource('<div data-slot="field">', {
      args: { label: 'CPF', description: 'Preenchido pelo cadastro da empresa.', disabled: true },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("label: 'CPF'");
    expect(withArgs).toContain('disabled: true');
    expect(withArgs).toContain("description: 'Preenchido pelo cadastro da empresa.'");
  });

  it('descrição e erro vazios são ausência, e não string vazia no snippet', () => {
    // Os controls do Playground nascem com `''`, que significa "sem a peça".
    const code = formSource('', { args: { description: '', error: '' } });
    expect(code).not.toContain('description');
    expect(code).not.toContain('error');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(formSource('<div data-slot="field"><label for="x">', {})).not.toContain('data-slot=');
  });
});

describe('formSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = formSourceWith({ label: 'Senha', inputType: 'password' });
    const code = transform('', { args: { label: 'Email' } });
    expect(code).toContain("label: 'Senha'");
    expect(code).toContain("type: 'password'");
  });
});

describe('formComFieldsetSnippet', () => {
  it('usa a fábrica do grupo, que é outra', () => {
    const code = formWithFieldsetSnippet({
      legend: 'Endereço de entrega',
      fields: [{ label: 'Rua', placeholder: 'ex: Av. Paulista, 1000' }],
    });
    expect(code).toContain("import { createFieldset, createFormField } from '@/components/ui/form';");
    expect(code).toContain('createFieldset({');
    expect(code).toContain("legend: 'Endereço de entrega'");
    expect(code).toContain('children: [');
    expect(code).toContain('createFormField({');
  });
});

describe('formComVariosCamposSnippet', () => {
  it('a área de texto passa pelo mesmo campo, com a fábrica dela', () => {
    const code = formWithMultipleFieldsSnippet({
      fields: [
        { label: 'Nome completo', name: 'nome' },
        { label: 'Biografia', control: 'textarea', name: 'bio', rows: 3 },
      ],
      submitLabel: 'Salvar',
    });
    expect(code).toContain("import { createTextarea } from '@/components/ui/textarea';");
    expect(code).toContain("createTextarea({ name: 'bio', rows: 3 })");
    // A área de texto não tem `type`: o elemento já é o que é.
    expect(code).not.toContain("type: 'textarea'");
    expect(code).toContain("createButton({ label: 'Salvar', type: 'submit' })");
  });

  it('não importa a fábrica de área de texto quando não há nenhuma', () => {
    const code = formWithMultipleFieldsSnippet({ fields: [{ label: 'Email', type: 'email' }] });
    expect(code).not.toContain('createTextarea');
    expect(code).toContain("type: 'email'");
  });
});
