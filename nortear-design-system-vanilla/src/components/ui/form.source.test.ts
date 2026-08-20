import { describe, expect, it } from 'vitest';
import {
  formComFieldsetSnippet,
  formComVariosCamposSnippet,
  formSnippet,
  formSource,
  formSourceCom,
} from './form.source';

describe('formSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = formSnippet();
    expect(código).toContain("import { createFormField } from '@/components/ui/form';");
    expect(código).toContain('createFormField({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('aria-describedby');
  });

  it('mostra o CAMPO inteiro, e não um rótulo solto ao lado de um controle solto', () => {
    // O produto deste componente é a costura de acessibilidade: `for` ↔ `id`,
    // id gerado, descrição entrando no `aria-describedby`. Nada disso existe
    // quando se escreve o par à mão.
    const código = formSnippet();
    expect(código).toContain('label:');
    expect(código).toContain('input: createInput(');
    expect(código).not.toContain('createLabel');
  });

  it('omite as peças opcionais que a story não usa', () => {
    const código = formSnippet();
    expect(código).not.toContain('description');
    expect(código).not.toContain('error');
    expect(código).not.toContain('aria-invalid');
    expect(código).not.toContain('disabled');
  });

  it('mostra as peças quando a story as usa', () => {
    const código = formSnippet({
      label: 'Senha',
      inputType: 'password',
      value: '123',
      description: 'Use pelo menos 8 caracteres, com letras e números.',
      error: 'A senha precisa ter pelo menos 8 caracteres.',
      ariaInvalid: true,
    });
    expect(código).toContain("label: 'Senha'");
    expect(código).toContain("type: 'password'");
    expect(código).toContain("description: 'Use pelo menos 8 caracteres, com letras e números.'");
    expect(código).toContain("error: 'A senha precisa ter pelo menos 8 caracteres.'");
  });

  it('o aria-invalid é escrito no CONTROLE, porque a fábrica não o escreve', () => {
    // A fábrica deliberadamente não tem fonte de verdade sobre validade. Um
    // snippet que passasse `ariaInvalid` para `createFormField` inventaria API.
    const código = formSnippet({ ariaInvalid: true });
    expect(código).toContain("controle.setAttribute('aria-invalid', 'true');");
    expect(código).toContain('input: controle');
    expect(código).not.toContain('ariaInvalid');
  });

  it('não vaza helper de story', () => {
    const código = formSnippet({ description: 'Usaremos apenas para contato.' });
    expect(código).not.toContain('buildField');
    expect(código).not.toContain('ordemDeTabulacao');
    expect(código).not.toContain('contrastesNosDoisModos');
    expect(código).not.toContain('nds-max-w-sm');
  });
});

describe('formSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = formSource('<div data-slot="field">', {});
    const comArgs = formSource('<div data-slot="field">', {
      args: { label: 'CPF', description: 'Preenchido pelo cadastro da empresa.', disabled: true },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain("label: 'CPF'");
    expect(comArgs).toContain('disabled: true');
    expect(comArgs).toContain("description: 'Preenchido pelo cadastro da empresa.'");
  });

  it('descrição e erro vazios são ausência, e não string vazia no snippet', () => {
    // Os controls do Playground nascem com `''`, que significa "sem a peça".
    const código = formSource('', { args: { description: '', error: '' } });
    expect(código).not.toContain('description');
    expect(código).not.toContain('error');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(formSource('<div data-slot="field"><label for="x">', {})).not.toContain('data-slot=');
  });
});

describe('formSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = formSourceCom({ label: 'Senha', inputType: 'password' });
    const código = transform('', { args: { label: 'Email' } });
    expect(código).toContain("label: 'Senha'");
    expect(código).toContain("type: 'password'");
  });
});

describe('formComFieldsetSnippet', () => {
  it('usa a fábrica do grupo, que é outra', () => {
    const código = formComFieldsetSnippet({
      legend: 'Endereço de entrega',
      campos: [{ label: 'Rua', placeholder: 'ex: Av. Paulista, 1000' }],
    });
    expect(código).toContain("import { createFieldset, createFormField } from '@/components/ui/form';");
    expect(código).toContain('createFieldset({');
    expect(código).toContain("legend: 'Endereço de entrega'");
    expect(código).toContain('children: [');
    expect(código).toContain('createFormField({');
  });
});

describe('formComVariosCamposSnippet', () => {
  it('a área de texto passa pelo mesmo campo, com a fábrica dela', () => {
    const código = formComVariosCamposSnippet({
      campos: [
        { label: 'Nome completo', name: 'nome' },
        { label: 'Biografia', controle: 'textarea', name: 'bio', rows: 3 },
      ],
      submitLabel: 'Salvar',
    });
    expect(código).toContain("import { createTextarea } from '@/components/ui/textarea';");
    expect(código).toContain("createTextarea({ name: 'bio', rows: 3 })");
    // A área de texto não tem `type`: o elemento já é o que é.
    expect(código).not.toContain("type: 'textarea'");
    expect(código).toContain("createButton({ label: 'Salvar', type: 'submit' })");
  });

  it('não importa a fábrica de área de texto quando não há nenhuma', () => {
    const código = formComVariosCamposSnippet({ campos: [{ label: 'Email', type: 'email' }] });
    expect(código).not.toContain('createTextarea');
    expect(código).toContain("type: 'email'");
  });
});
