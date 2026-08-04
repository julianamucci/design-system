import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Eye, EyeOff, AtSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupText,
} from "@/components/ui/input-group";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import inputTranslations from "@shared/content/input/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

// ─── Nav ──────────────────────────────────────────────────────────────────────

const getNavGroups = (t: (key: string) => string) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia",     label: t("nav.anatomy") },
      { id: "quando-usar",  label: t("nav.usage") },
      { id: "do-dont",      label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao",   label: t("nav.import") },
      { id: "variantes",    label: t("nav.variants") },
      { id: "composicoes",  label: t("nav.compositions") },
      { id: "estados",      label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens",       label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados",   label: t("nav.related") },
      { id: "notas",          label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes",    label: t("nav.testes") },
    ],
  },
];

// ─── PasswordToggle helper ────────────────────────────────────────────────────

function PasswordToggleDemo({ placeholder }: { placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <InputGroup>
      <InputGroupInput
        type={show ? "text" : "password"}
        placeholder={placeholder}
        aria-label="Senha"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          aria-label={show ? "Ocultar senha" : "Exibir senha"}
          onClick={() => setShow((v) => !v)}
        >
          {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function InputDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(inputTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (inputTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
    [locale],
  );

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "input",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "input",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "input",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // field_focus sempre; field_blur só com conteúdo (gatilho documentado).
  // field_error fica de fora: o erro da demo é estático, não um funil real.
  const trackFieldFocus = (fieldName: string) => () =>
    track("field_focus", { component: "input", field_name: fieldName, location: "docs_demo" });
  const trackFieldBlur = (fieldName: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.currentTarget.value.length > 0) {
      track("field_blur", { component: "input", field_name: fieldName, location: "docs_demo" });
    }
  };

  // ─── Code strings ─────────────────────────────────────────────────────────

  const codeImportBasic = `import { Input } from "@/components/ui/input";`;

  const codeImportWithGroup = `import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupText,
} from "@/components/ui/input-group";`;

  const codeText = `<div className="nds-stack" data-spacing="xs">
  <label htmlFor="nome">Nome completo</label>
  <Input id="nome" type="text" placeholder="ex: João da Silva" />
</div>`;

  const codeEmail = `<div className="nds-stack" data-spacing="xs">
  <label htmlFor="email">Email</label>
  <Input id="email" type="email" placeholder="ex: joao@empresa.com" />
</div>`;

  const codePassword = `<div className="nds-stack" data-spacing="xs">
  <label htmlFor="senha">Senha</label>
  <Input id="senha" type="password" placeholder="••••••••" />
</div>`;

  const codeNumber = `<div className="nds-stack" data-spacing="xs">
  <label htmlFor="qtd">Quantidade</label>
  <Input id="qtd" type="number" placeholder="0" />
</div>`;

  const codeFile = `<div className="nds-stack" data-spacing="xs">
  <label htmlFor="arquivo">Arquivo</label>
  <Input id="arquivo" type="file" />
</div>`;

  const codeInputGroupSearch = `<InputGroup>
  <InputGroupAddon align="inline-start">
    <Search aria-hidden="true" />
  </InputGroupAddon>
  <InputGroupInput
    type="search"
    placeholder="Buscar componentes..."
  />
</InputGroup>`;

  const codeInputGroupEmail = `<InputGroup>
  <InputGroupAddon align="inline-start">
    <InputGroupText>
      <AtSign aria-hidden="true" />
    </InputGroupText>
  </InputGroupAddon>
  <InputGroupInput type="email" placeholder="ex: joao@empresa.com" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton type="submit" aria-label="Enviar">
      Enviar
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>`;

  const codeTokensCustom = `/* Em globals.css */
:root {
  --height-default: 2.25rem; /* 36px */
  --radius-input: var(--radius);
}`;

  const interfaceCode = `// Input — estende React.ComponentProps<"input">
interface InputProps extends React.ComponentProps<"input"> {
  // Todos os atributos HTML nativos do <input> são suportados.
  // Principais: type, placeholder, disabled, aria-invalid, autoComplete, className
}

// InputGroup
interface InputGroupProps extends React.ComponentProps<"div"> {}

// InputGroupAddon
interface InputGroupAddonProps extends React.ComponentProps<"div"> {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end";
}

// InputGroupInput — estende React.ComponentProps<"input">
interface InputGroupInputProps extends React.ComponentProps<"input"> {}

// InputGroupButton — extends Button props
interface InputGroupButtonProps {
  size?: "xs" | "sm" | "icon-xs" | "icon-sm";
  variant?: ButtonVariant;
  type?: "button" | "submit" | "reset";
}

// InputGroupText
interface InputGroupTextProps extends React.ComponentProps<"span"> {}

// InputGroupTextarea — estende React.ComponentProps<"textarea">
interface InputGroupTextareaProps extends React.ComponentProps<"textarea"> {}`;

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="input"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
        />
      }
    >
      {/* ── Demonstração ────────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-w-full nds-max-w-sm nds-stack" data-spacing="md">
          <div className="nds-stack" data-spacing="xs">
            <label htmlFor="demo-nome" className="nds-text-body nds-font-medium">
              {tContent("demonstration.labels.defaultLabel")}
            </label>
            <Input
              id="demo-nome"
              type="text"
              placeholder={tContent("demonstration.labels.defaultPlaceholder")}
              onFocus={trackFieldFocus("nome")}
              onBlur={trackFieldBlur("nome")}
            />
          </div>
          <div className="nds-stack" data-spacing="xs">
            <label htmlFor="demo-email" className="nds-text-body nds-font-medium">
              {tContent("demonstration.labels.emailLabel")}
            </label>
            <Input
              id="demo-email"
              type="email"
              placeholder={tContent("demonstration.labels.emailPlaceholder")}
              onFocus={trackFieldFocus("email")}
              onBlur={trackFieldBlur("email")}
            />
          </div>
          <div className="nds-stack" data-spacing="xs">
            <label htmlFor="demo-search" className="nds-text-body nds-font-medium">
              {tContent("demonstration.labels.searchLabel")}
            </label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                id="demo-search"
                type="search"
                placeholder={tContent("demonstration.labels.searchPlaceholder")}
                onFocus={trackFieldFocus("busca")}
                onBlur={trackFieldBlur("busca")}
              />
            </InputGroup>
          </div>
          <div className="nds-stack" data-spacing="xs">
            <label htmlFor="demo-disabled" className="nds-text-body nds-font-medium">
              {tContent("demonstration.labels.disabledLabel")}
            </label>
            <Input
              id="demo-disabled"
              type="text"
              placeholder={tContent("demonstration.labels.disabledPlaceholder")}
              disabled
            />
          </div>
          <div className="nds-stack" data-spacing="xs">
            <label htmlFor="demo-error" className="nds-text-body nds-font-medium">
              {tContent("demonstration.labels.errorLabel")}
            </label>
            <Input
              id="demo-error"
              type="email"
              placeholder={tContent("demonstration.labels.errorPlaceholder")}
              aria-invalid="true"
              aria-describedby="demo-error-msg"
              onFocus={trackFieldFocus("email-erro")}
              onBlur={trackFieldBlur("email-erro")}
            />
            <p id="demo-error-msg" className="nds-text-caption nds-text-destructive">
              {tContent("demonstration.labels.errorMessage")}
            </p>
          </div>
          <div className="nds-stack" data-spacing="xs">
            <label className="nds-text-body nds-font-medium">
              {tContent("demonstration.labels.passwordLabel")}
            </label>
            <PasswordToggleDemo
              placeholder={tContent("demonstration.labels.passwordPlaceholder")}
            />
          </div>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ────────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[
          tContent("anatomy.item1"),
          tContent("anatomy.item2"),
          tContent("anatomy.item3"),
          tContent("anatomy.item4"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ─────────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [
            tContent("usage.guidelines.item1"),
            tContent("usage.guidelines.item2"),
            tContent("usage.guidelines.item3"),
            tContent("usage.guidelines.item4"),
            tContent("usage.guidelines.item5"),
          ],
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [
            { s: tContent("usage.scenarios.item1.s"), u: tContent("usage.scenarios.item1.u"), a: tContent("usage.scenarios.item1.a") },
            { s: tContent("usage.scenarios.item2.s"), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
            { s: tContent("usage.scenarios.item3.s"), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
            { s: tContent("usage.scenarios.item4.s"), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
            { s: tContent("usage.scenarios.item5.s"), u: tContent("usage.scenarios.item5.u"), a: tContent("usage.scenarios.item5.a") },
            { s: tContent("usage.scenarios.item6.s"), u: tContent("usage.scenarios.item6.u"), a: tContent("usage.scenarios.item6.a") },
          ],
        }}
        do={{
          title: tContent("usage.do.title"),
          items: [
            tContent("usage.do.item1"),
            tContent("usage.do.item2"),
            tContent("usage.do.item3"),
            tContent("usage.do.item4"),
          ],
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: [
            tContent("usage.dont.item1"),
            tContent("usage.dont.item2"),
            tContent("usage.dont.item3"),
          ],
        }}
      />

      {/* ── Do & Don't ──────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="dodont-1-do" className="nds-text-body nds-font-medium">Email</label>
                <Input id="dodont-1-do" type="email" placeholder="ex: joao@empresa.com" />
              </div>
            ),
            dontPreview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="dodont-1-dont" className="nds-text-body nds-font-medium">Email</label>
                <Input id="dodont-1-dont" type="email" placeholder="Digite seu email" />
              </div>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="dodont-2-do" className="nds-text-body nds-font-medium">Email</label>
                <Input id="dodont-2-do" type="email" placeholder="ex: joao@empresa.com" />
              </div>
            ),
            dontPreview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="dodont-2-dont" className="nds-text-body nds-font-medium">Email</label>
                <Input id="dodont-2-dont" type="text" placeholder="ex: joao@empresa.com" />
              </div>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="dodont-3-do" className="nds-text-body nds-font-medium">
                  {tContent("demonstration.labels.defaultLabel")}
                </label>
                <Input id="dodont-3-do" type="text" placeholder="ex: João da Silva" />
              </div>
            ),
            dontPreview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <Input type="text" placeholder={tContent("demonstration.labels.defaultLabel")} />
              </div>
            ),
            doCaption: tContent("doDont.pair3.do"),
            dontCaption: tContent("doDont.pair3.dont"),
          },
        ]}
      />

      {/* ── Importação ──────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withGroup")}
        secondaryCode={codeImportWithGroup}
      />

      {/* ── Variantes ───────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: "text",
            description: stripHtml(tContent("variants.items.types.text")),
            code: codeText,
            preview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="var-text" className="nds-text-body nds-font-medium">
                  {tContent("demonstration.labels.defaultLabel")}
                </label>
                <Input id="var-text" type="text" placeholder={tContent("demonstration.labels.defaultPlaceholder")} />
              </div>
            ),
          },
          {
            name: "email",
            description: stripHtml(tContent("variants.items.types.email")),
            code: codeEmail,
            preview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="var-email" className="nds-text-body nds-font-medium">
                  {tContent("demonstration.labels.emailLabel")}
                </label>
                <Input id="var-email" type="email" placeholder={tContent("demonstration.labels.emailPlaceholder")} />
              </div>
            ),
          },
          {
            name: "password",
            description: stripHtml(tContent("variants.items.types.password")),
            code: codePassword,
            preview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="var-password" className="nds-text-body nds-font-medium">
                  {tContent("demonstration.labels.passwordLabel")}
                </label>
                <Input id="var-password" type="password" placeholder={tContent("demonstration.labels.passwordPlaceholder")} />
              </div>
            ),
          },
          {
            name: "number",
            description: stripHtml(tContent("variants.items.types.number")),
            code: codeNumber,
            preview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="var-number" className="nds-text-body nds-font-medium">Quantidade</label>
                <Input id="var-number" type="number" placeholder="0" />
              </div>
            ),
          },
          {
            name: "file",
            description: stripHtml(tContent("variants.items.types.file")),
            code: codeFile,
            preview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="var-file" className="nds-text-body nds-font-medium">
                  {tContent("demonstration.labels.fileLabel")}
                </label>
                <Input id="var-file" type="file" />
              </div>
            ),
          },
          {
            name: "InputGroup (search)",
            description: stripHtml(tContent("variants.items.inputGroup.description")),
            code: codeInputGroupSearch,
            preview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="var-group-search" className="nds-text-body nds-font-medium">
                  {tContent("demonstration.labels.searchLabel")}
                </label>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Search aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="var-group-search"
                    type="search"
                    placeholder={tContent("demonstration.labels.searchPlaceholder")}
                  />
                </InputGroup>
              </div>
            ),
          },
          {
            name: "InputGroup (email + addon)",
            description: stripHtml(tContent("variants.items.inputGroup.subcomponents.inputGroupAddon")),
            code: codeInputGroupEmail,
            preview: (
              <div className="nds-stack nds-w-full" data-spacing="xs">
                <label htmlFor="var-group-email" className="nds-text-body nds-font-medium">
                  {tContent("demonstration.labels.emailLabel")}
                </label>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>
                      <AtSign aria-hidden="true" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="var-group-email"
                    type="email"
                    placeholder={tContent("demonstration.labels.emailPlaceholder")}
                  />
                </InputGroup>
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ─────────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="input"
        items={[
          {
            name: tContent("variants.compositions.withLabel.name"),
            description: tContent("variants.compositions.withLabel.description"),
            useWhen: tContent("variants.compositions.withLabel.use"),
            code: `<div className="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">\n  <Label htmlFor="input-nome">Nome completo</Label>\n  <Input id="input-nome" type="text" placeholder="ex: João da Silva" />\n</div>`,
            preview: (
              <div className="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">
                <Label htmlFor="input-nome">Nome completo</Label>
                <Input id="input-nome" type="text" placeholder="ex: João da Silva" />
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withHint.name"),
            description: tContent("variants.compositions.withHint.description"),
            useWhen: tContent("variants.compositions.withHint.use"),
            code: `<div className="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">\n  <Label htmlFor="input-email-hint">Email</Label>\n  <Input id="input-email-hint" type="email" placeholder="ex: joao@empresa.com" />\n  <p className="nds-text-caption nds-text-muted-foreground">Usaremos este email para envio de notificações.</p>\n</div>`,
            preview: (
              <div className="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">
                <Label htmlFor="input-email-hint">Email</Label>
                <Input id="input-email-hint" type="email" placeholder="ex: joao@empresa.com" />
                <p className="nds-text-caption nds-text-muted-foreground">Usaremos este email para envio de notificações.</p>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withError.name"),
            description: tContent("variants.compositions.withError.description"),
            useWhen: tContent("variants.compositions.withError.use"),
            code: `<div className="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">\n  <Label htmlFor="input-email-error">Email</Label>\n  <Input\n    id="input-email-error"\n    type="email"\n    placeholder="ex: joao@empresa.com"\n    aria-invalid="true"\n    aria-describedby="input-email-error-error"\n  />\n  <p id="input-email-error-error" className="nds-text-caption nds-text-destructive">\n    Email inválido. Use o formato nome@dominio.com\n  </p>\n</div>`,
            preview: (
              <div className="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">
                <Label htmlFor="input-email-error">Email</Label>
                <Input
                  id="input-email-error"
                  type="email"
                  placeholder="ex: joao@empresa.com"
                  aria-invalid="true"
                  aria-describedby="input-email-error-error"
                />
                <p id="input-email-error-error" className="nds-text-caption nds-text-destructive">
                  Email inválido. Use o formato nome@dominio.com
                </p>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withPrefix.name"),
            description: tContent("variants.compositions.withPrefix.description"),
            useWhen: tContent("variants.compositions.withPrefix.use"),
            code: `<div className="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">\n  <Label htmlFor="input-url">URL do site</Label>\n  <div className="nds-cluster nds-rounded-md nds-border-default nds-overflow-hidden">\n    <span className="nds-cluster nds-px-2 nds-text-body nds-text-muted-foreground nds-bg-muted nds-shrink-0" style={{ borderRight: "1px solid var(--input)" }}>https://</span>\n    <Input\n      className="nds-flex-1" style={{ border: 0 }}\n      type="url"\n      id="input-url"\n      placeholder="meusite.com"\n    />\n  </div>\n</div>`,
            preview: (
              <div className="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">
                <Label htmlFor="input-url">URL do site</Label>
                <div className="nds-cluster nds-rounded-md nds-border-default nds-overflow-hidden">
                  <span className="nds-cluster nds-px-2 nds-text-body nds-text-muted-foreground nds-bg-muted nds-shrink-0" style={{ borderRight: "1px solid var(--input)" }}>https://</span>
                  <Input
                    className="nds-flex-1" style={{ border: 0 }}
                    type="url"
                    id="input-url"
                    placeholder="meusite.com"
                  />
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* ── Estados ─────────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
          {
            label: tContent("states.default.label"),
            trigger: toPlainText(tContent("states.default.trigger")),
            behavior: toPlainText(tContent("states.default.behavior")),
          },
          {
            label: tContent("states.focus.label"),
            trigger: toPlainText(tContent("states.focus.trigger")),
            behavior: toPlainText(tContent("states.focus.behavior")),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: toPlainText(tContent("states.disabled.trigger")),
            behavior: toPlainText(tContent("states.disabled.behavior")),
          },
          {
            label: tContent("states.error.label"),
            trigger: toPlainText(tContent("states.error.trigger")),
            behavior: toPlainText(tContent("states.error.behavior")),
          },
          {
            label: tContent("states.file.label"),
            trigger: toPlainText(tContent("states.file.trigger")),
            behavior: toPlainText(tContent("states.file.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ────────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.inputTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "type",
                type: '"text" | "email" | "password" | "number" | "tel" | "url" | "search" | "date" | "file"',
                defaultValue: '"text"',
                required: "Não",
                description: toPlainText(tContent("props.table.type_prop")),
              },
              {
                name: "placeholder",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.placeholder")),
              },
              {
                name: "disabled",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: toPlainText(tContent("props.table.disabled")),
              },
              {
                name: "aria-invalid",
                type: '"true" | "false"',
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.ariaInvalid")),
              },
              {
                name: "autoComplete",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.autoComplete")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.className")),
              },
            ],
          },
          {
            title: tContent("props.inputGroupTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "align",
                type: '"inline-start" | "inline-end" | "block-start" | "block-end"',
                defaultValue: '"inline-start"',
                required: "Não",
                description: toPlainText(tContent("props.table.align_addon")),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
      />

      {/* ── Tokens ──────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--height-default", value: "h-(--height-default)",        description: tContent("tokens.table.height") },
          { token: "--radius-input",   value: "rounded-(--radius-input)",     description: tContent("tokens.table.radius") },
          { token: "--input",          value: "border-input",                 description: tContent("tokens.table.border") },
          { token: "--ring",           value: "nds-focus-ring",    description: tContent("tokens.table.borderFocus") },
          { token: "--ring",           value: "nds-focus-ring",   description: tContent("tokens.table.ring") },
          { token: "--destructive",    value: "aria-invalid:border-destructive", description: tContent("tokens.table.borderError") },
          { token: "--destructive",    value: "aria-invalid:ring-destructive/20", description: tContent("tokens.table.ringError") },
          { token: "--input",          value: "disabled:bg-input/50",         description: tContent("tokens.table.bgDisabled") },
          { token: "--input",          value: "dark:disabled:bg-input/80",    description: tContent("tokens.table.bgDisabledDark") },
          { token: "--muted-foreground", value: "placeholder:nds-text-muted-foreground", description: tContent("tokens.table.placeholder") },
          { token: "--input",          value: "dark:bg-input/30",             description: tContent("tokens.table.bgDark") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeTokensCustom}
      />

      {/* ── Acessibilidade ──────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.item1"),
          tContent("accessibility.item2"),
          tContent("accessibility.item3"),
          tContent("accessibility.item4"),
          tContent("accessibility.item5"),
        ]}
        keyboardTitle={tContent("accessibility.title")}
        keyboardItems={[
          { key: "Tab",        description: tContent("accessibility.keyboard.tab") },
          { key: "Shift+Tab",  description: tContent("accessibility.keyboard.shiftTab") },
          { key: "A–Z",        description: tContent("accessibility.keyboard.typing") },
          { key: "Escape",     description: tContent("accessibility.keyboard.escape") },
        ]}
      />

      {/* ── Relacionados ────────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "Textarea",
            description: tContent("related.textarea"),
            path: "?path=/docs/ui-textarea--docs",
          },
          {
            name: "InputOTP",
            description: tContent("related.inputOTP"),
            path: "?path=/docs/ui-inputotp--docs",
          },
          {
            name: "Select",
            description: tContent("related.select"),
            path: "?path=/docs/ui-select--docs",
          },
          {
            name: "Form",
            description: tContent("related.form"),
            path: "?path=/docs/ui-form--docs",
          },
          {
            name: "Label",
            description: tContent("related.label"),
            path: "?path=/docs/ui-label--docs",
          },
        ]}
      />

      {/* ── Notas ───────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
          { title: "", content: tContent("notes.tip5") },
        ]}
      />

      {/* ── Analytics ───────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.fieldFocus"),
            trigger: toPlainText(tContent("analytics.table.fieldFocusTrigger")),
            payload: tContent("analytics.table.fieldFocusPayload"),
          },
          {
            event: tContent("analytics.table.fieldBlur"),
            trigger: toPlainText(tContent("analytics.table.fieldBlurTrigger")),
            payload: tContent("analytics.table.fieldBlurPayload"),
          },
          {
            event: tContent("analytics.table.fieldError"),
            trigger: toPlainText(tContent("analytics.table.fieldErrorTrigger")),
            payload: tContent("analytics.table.fieldErrorPayload"),
          },
          {
            event: tContent("analytics.table.pageView"),
            trigger: toPlainText(tContent("analytics.table.pageViewTrigger")),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: toPlainText(tContent("analytics.table.sectionViewedTrigger")),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: toPlainText(tContent("analytics.table.langSwitchTrigger")),
            payload: tContent("analytics.table.langSwitchPayload"),
          },
        ]}
      />

      {/* ── Testes ──────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [
            {
              action: tContent("testes.functional.item1.action"),
              result: tContent("testes.functional.item1.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item1.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item2.action"),
              result: tContent("testes.functional.item2.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item2.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item3.action"),
              result: tContent("testes.functional.item3.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item3.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item4.action"),
              result: tContent("testes.functional.item4.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item5.action"),
              result: tContent("testes.functional.item5.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item6.action"),
              result: tContent("testes.functional.item6.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item7.action"),
              result: tContent("testes.functional.item7.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item7.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item8.action"),
              result: tContent("testes.functional.item8.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item8.priority")] ?? "common.medium"),
            },
          ],
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: [
            {
              criterion: tContent("testes.accessibility.item1"),
              level: "AA",
              how: "axe-core",
            },
            {
              criterion: tContent("testes.accessibility.item2"),
              level: "AA",
              how: "getByLabelText",
            },
            {
              criterion: tContent("testes.accessibility.item3"),
              level: "AA",
              how: "getByRole + toHaveAttribute",
            },
            {
              criterion: tContent("testes.accessibility.item4"),
              level: "AA",
              how: "getByRole + toHaveAttribute",
            },
            {
              criterion: tContent("testes.accessibility.item5"),
              level: "AA",
              how: "Colour Contrast Analyser",
            },
          ],
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [
            { story: tContent("testes.visual.item1.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item1.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item2.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item2.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.medium") },
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.medium") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.high") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}
