import { describe, expect, it } from 'vitest';
import {
  inputGroupAffixSource,
  inputGroupAlignmentsSource,
  inputGroupDisabledSource,
  inputGroupInvalidSource,
  inputGroupPasswordSource,
  inputGroupRestSource,
  inputGroupSearchSource,
  inputGroupSnippet,
  inputGroupSource,
  inputGroupTextareaToolbarSource,
} from './input-group.source';
import {
  INVALID_MESSAGE_ID,
  SEARCH_SHORTCUT,
  SITE_FIELD_ID,
  SITE_PREFIX,
} from './input-group.fixtures';

/**
 * As transforms do painel Code são o único pedaço deste componente que nenhuma
 * suíte de navegador alcança: a saída do painel não entra no DOM durante a
 * `play`. É aqui que ela tem guarda.
 *
 * O que se cobra é o que o leitor COPIA — se o snippet ensina a mesma coisa que
 * a story renderiza, e se o estado inválido aparece como o que é: dois
 * atributos no campo mais o texto que os explica.
 */

describe('inputGroupSource', () => {
  it('sem args, entrega a moldura canônica: prefixo, campo e botão no fim', () => {
    const out = inputGroupSource();
    expect(out).toContain('from "@/components/ui/input-group"');
    expect(out).toContain('<InputGroup aria-label="Endereço do site">');
    expect(out).toContain('<InputGroupAddon align="inline-start">');
    expect(out).toContain(`<InputGroupText>${SITE_PREFIX}</InputGroupText>`);
    expect(out).toContain('<InputGroupInput placeholder="minhaempresa" />');
    expect(out).toContain('<InputGroupAddon align="inline-end">');
    expect(out).toContain('<InputGroupButton onclick={handleAddon}>Colar</InputGroupButton>');
  });

  it('acompanha os controls da Playground', () => {
    expect(inputGroupSource('', { args: { placeholder: 'ex: minha-loja' } })).toContain(
      'placeholder="ex: minha-loja"',
    );
    expect(inputGroupSource('', { args: { disabled: true } })).toContain('disabled');
    expect(inputGroupSource('', { args: { multiline: true } })).toContain(
      '<InputGroupTextarea',
    );
    expect(inputGroupSource('', { args: { multiline: true } })).toContain('rows={2}');
  });

  it('o nome do grupo é opcional, e só aparece quando foi pedido', () => {
    expect(inputGroupSnippet({ 'aria-label': 'Senha' })).toContain('aria-label="Senha"');
    expect(inputGroupSnippet({})).toContain('<InputGroup>');
    expect(inputGroupSnippet({})).not.toContain('aria-label=');
  });

  it('importa só as peças que o corpo do snippet menciona', () => {
    const withoutAddon = inputGroupSnippet({ addons: [] });
    expect(withoutAddon).not.toContain('InputGroupAddon');
    expect(withoutAddon).not.toContain('InputGroupText');
    expect(withoutAddon).not.toContain('InputGroupButton');
    expect(withoutAddon).toContain('InputGroupInput');

    const withTextarea = inputGroupSnippet({ multiline: true, addons: [] });
    expect(withTextarea).toContain('InputGroupTextarea');
    expect(withTextarea).not.toContain('InputGroupInput');
  });
});

describe('transforms das stories de estado', () => {
  it('o repouso não liga estado nenhum', () => {
    const out = inputGroupRestSource();
    expect(out).not.toContain('aria-invalid');
    expect(out).not.toContain('disabled');
  });

  it('o inválido põe os dois atributos no CAMPO e traz o texto que os explica', () => {
    const out = inputGroupInvalidSource();
    expect(out).toContain('aria-invalid="true"');
    expect(out).toContain(`aria-describedby="${INVALID_MESSAGE_ID}"`);
    expect(out).toContain(`<p id="${INVALID_MESSAGE_ID}"`);
    // O texto do erro mora FORA da moldura.
    expect(out.indexOf('</InputGroup>')).toBeLessThan(out.indexOf(`<p id="${INVALID_MESSAGE_ID}"`));
  });

  it('o desabilitado é atributo do campo, não aparência da moldura', () => {
    const out = inputGroupDisabledSource();
    expect(out).toContain('disabled');
    expect(out).not.toContain('aria-disabled');
  });
});

describe('transforms das stories de variação e composição', () => {
  it('a variação sai de data-align, uma moldura por posição', () => {
    expect(inputGroupAlignmentsSource()).toContain('align="inline-start"');
  });

  it('a busca traz o ícone decorativo e o atalho em texto', () => {
    const out = inputGroupSearchSource();
    expect(out).toContain('@lucide/svelte/icons/search');
    expect(out).toContain('<Search aria-hidden="true" />');
    expect(out).toContain(`<InputGroupText>${SEARCH_SHORTCUT}</InputGroupText>`);
    expect(out).not.toContain('<InputGroupButton');
  });

  it('a senha troca o NOME do botão junto com o tipo do campo', () => {
    const out = inputGroupPasswordSource();
    expect(out).toContain('@lucide/svelte/icons/eye-off');
    expect(out).toContain('let visible = $state(false);');
    expect(out).toContain('aria-label={visible ? "Ocultar senha" : "Mostrar senha"}');
    expect(out).toContain('type={visible ? "text" : "password"}');
  });

  it('o formato mantém o rótulo visível fora da moldura, ligado ao campo', () => {
    const out = inputGroupAffixSource();
    expect(out).toContain(`<label class="nds-label" for="${SITE_FIELD_ID}">`);
    expect(out).toContain(`id="${SITE_FIELD_ID}"`);
    expect(out.indexOf('<label')).toBeLessThan(out.indexOf('<InputGroup>'));
  });

  it('a área de texto com barra empilha sem opção de direção', () => {
    const out = inputGroupTextareaToolbarSource();
    expect(out).toContain('<InputGroupTextarea');
    expect(out).toContain('align="block-end"');
    expect(out).not.toContain('direction');
  });
});
