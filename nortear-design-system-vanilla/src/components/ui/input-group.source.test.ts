import { describe, expect, it } from 'vitest';
import {
  inputGroupSnippet,
  inputGroupSource,
  inputGroupSourceWith,
} from './input-group.source';

/** Onde o corpo do snippet começa — depois da lista de importação. */
function body(code: string): string {
  return code.slice(code.indexOf("} from '@/components/ui/input-group';"));
}

describe('inputGroupSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = inputGroupSnippet();
    expect(code).toContain("from '@/components/ui/input-group';");
    expect(code).toContain('createInputGroup(');
    expect(code).toContain("createInputGroupAddon({ align: 'inline-start' })");
    expect(code).toContain('createInputGroupInput({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<div');
    expect(code).not.toContain('<input');
    expect(code).not.toContain('class="nds-input-group"');
  });

  it('nomeia o grupo só quando a story pede — e não inventa nome', () => {
    // A decisão 2 do primitivo: com um campo só, nomear o grupo faz o leitor de
    // tela dizer as mesmas palavras duas vezes. Um snippet que cravasse
    // `'aria-label'` ensinaria a repetição como se fosse a regra.
    expect(inputGroupSnippet()).not.toContain("'aria-label'");
    expect(inputGroupSnippet({ 'aria-label': 'Endereço do site' })).toContain(
      "'aria-label': 'Endereço do site'",
    );
  });

  it('mostra o estado inválido como atributo do CAMPO, nunca da moldura', () => {
    // Se o snippet ensinasse uma opção de aparência na moldura, quem copiasse
    // teria a borda vermelha sem `aria-invalid` — cor sem palavra, que é
    // exatamente o que a WCAG 1.4.1 proíbe.
    const code = inputGroupSnippet({ invalid: true });
    expect(code).toContain("campo.setAttribute('aria-invalid', 'true');");
    expect(code).toContain("campo.setAttribute('aria-describedby', 'endereco-erro');");
    expect(code).not.toContain('invalid: true');
    expect(inputGroupSnippet()).not.toContain('aria-invalid');
  });

  it('troca a fábrica do campo quando a story é de várias linhas', () => {
    const multiline = inputGroupSnippet({ multiline: true });
    expect(multiline).toContain('createInputGroupTextarea({');
    expect(multiline).not.toContain('createInputGroupInput');

    const single = inputGroupSnippet();
    expect(single).toContain('createInputGroupInput({');
    expect(single).not.toContain('createInputGroupTextarea');
  });

  it('o import acompanha o corpo: nome que não se usa não entra', () => {
    // Import com nome que o corpo não menciona ensina a importar por hábito, e
    // no dia em que a fábrica sumir o snippet quebra sem ninguém entender.
    const fieldOnly = inputGroupSnippet({ addons: [] });
    expect(fieldOnly).not.toContain('createInputGroupAddon');
    expect(fieldOnly).not.toContain('createInputGroupText');
    expect(fieldOnly).not.toContain('createInputGroupButton');

    const withText = inputGroupSnippet({ addons: [{ align: 'inline-start', text: 'R$' }] });
    expect(withText).toContain('createInputGroupText,');
    expect(withText).not.toContain('createInputGroupButton,');

    const withButton = inputGroupSnippet({
      addons: [{ align: 'inline-end', buttonAccessibleName: 'Limpar busca' }],
    });
    expect(withButton).toContain('createInputGroupButton,');
    expect(withButton).not.toContain('createInputGroupText,');
  });

  it('a ordem do append põe o campo entre os addons', () => {
    // A ordem VISUAL é da folha, por `order` em `[data-align]`. A do DOM existe
    // para a leitura sequencial bater com o desenho quando nada reordena.
    const code = inputGroupSnippet();
    expect(code).toContain('grupo.append(addon1, campo, addon2);');

    const endOnly = inputGroupSnippet({ addons: [{ align: 'inline-end', text: 'kg' }] });
    expect(endOnly).toContain('grupo.append(campo, addon1);');

    const startOnly = inputGroupSnippet({ addons: [{ align: 'block-start', text: 'Formatação' }] });
    expect(startOnly).toContain('grupo.append(addon1, campo);');
  });

  it('o botão só de ícone leva nome acessível, e o com texto não leva', () => {
    const iconOnly = inputGroupSnippet({
      addons: [{ align: 'inline-end', icon: 'iconeLimpar', buttonAccessibleName: 'Limpar busca' }],
    });
    expect(iconOnly).toContain("'aria-label': 'Limpar busca'");
    expect(iconOnly).toContain('iconeLimpar()');

    const withText = inputGroupSnippet({ addons: [{ align: 'inline-end', buttonLabel: 'Colar' }] });
    expect(withText).toContain("label: 'Colar'");
    expect(withText).not.toContain("'aria-label'");
  });

  it('não vaza andaime de story', () => {
    const code = inputGroupSnippet({ invalid: true, multiline: true });
    expect(body(code)).not.toContain('buildInputGroup');
    expect(body(code)).not.toContain('buildInvalidField');
    expect(body(code)).not.toContain('addonOfAlign');
    expect(body(code)).not.toContain('fixtures');
    expect(body(code)).not.toContain('ICONS');
  });
});

describe('inputGroupSource', () => {
  it('acompanha os args em vez de congelar um snippet fixo', () => {
    const noArgs = inputGroupSource('<div class="nds-input-group">', {});
    const withArgs = inputGroupSource('<div class="nds-input-group">', {
      args: { 'aria-label': 'Buscar componentes', placeholder: 'Buscar' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("'aria-label': 'Buscar componentes'");
    expect(withArgs).toContain("placeholder: 'Buscar'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    const code = inputGroupSource(
      '<div class="nds-input-group" role="group" data-slot="input-group">',
      {},
    );
    expect(code).not.toContain('role="group"');
    expect(code).not.toContain('data-slot');
  });
});

describe('inputGroupSourceWith', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = inputGroupSourceWith({ multiline: true, addons: [] });
    const code = transform('', { args: { multiline: false, placeholder: 'Escreva' } });
    expect(code).toContain('createInputGroupTextarea({');
    expect(code).toContain("placeholder: 'Escreva'");
    expect(code).not.toContain('createInputGroupAddon');
  });

  it('deixa passar o que a story não fixou', () => {
    const transform = inputGroupSourceWith({ addons: [] });
    const code = transform('', { args: { 'aria-label': 'Senha' } });
    expect(code).toContain("'aria-label': 'Senha'");
  });
});
