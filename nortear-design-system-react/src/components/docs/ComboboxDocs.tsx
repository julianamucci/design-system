import { useCallback, useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";

import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChipText,
  ComboboxChips,
  ComboboxClear,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxLabel,
  ComboboxTrigger,
  type ComboboxOption,
  type ComboboxOptionGroup,
} from "@/components/ui/combobox";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import comboboxTranslations from "@shared/content/combobox/translations.json";

import { DocsHeader } from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout } from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy } from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse } from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont } from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport } from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants } from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates } from "@/components/docs/shared/sections/DocsStates";
import { DocsProps } from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens } from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated } from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes } from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics } from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes } from "@/components/docs/shared/sections/DocsTestes";
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

/**
 * `Home` e `End` movem o CURSOR dentro do texto, e não a opção ativa.
 *
 * É o que a APG manda para combobox editável, e a lib de acessibilidade desta
 * stack trata as duas teclas antes de qualquer lista. O texto compartilhado
 * descreve o outro comportamento; deixá-lo intacto faria a documentação
 * prometer o que este campo não faz — que é pior do que divergir por escrito.
 */
const keyboardOverrides = {
  "pt-BR": {
    "accessibility.keyboard.home": "Leva o cursor ao início do texto digitado",
    "accessibility.keyboard.end": "Leva o cursor ao fim do texto digitado",
  },
  en: {
    "accessibility.keyboard.home": "Moves the caret to the start of the typed text",
    "accessibility.keyboard.end": "Moves the caret to the end of the typed text",
  },
  es: {
    "accessibility.keyboard.home": "Lleva el cursor al inicio del texto escrito",
    "accessibility.keyboard.end": "Lleva el cursor al final del texto escrito",
  },
};

// ─── Nav ─────────────────────────────────────────────────────────────────────

const getNavGroups = (t: (key: string) => string) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia", label: t("nav.anatomy") },
      { id: "quando-usar", label: t("nav.usage") },
      { id: "do-dont", label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao", label: t("nav.import") },
      { id: "variantes", label: t("nav.variants") },
      { id: "composicoes", label: t("nav.compositions") },
      { id: "estados", label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens", label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados", label: t("nav.related") },
      { id: "notas", label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes", label: t("nav.testes") },
    ],
  },
];

// ─── Campos de demonstração ──────────────────────────────────────────────────
//
// A lista é PORTALIZADA: sem uma caixa de altura própria, o popup aberto sai da
// moldura da prévia. `contain`, `min-height` sem unidade e `position` são
// mecânicos — não há valor de design nenhum aqui.

interface DemoFieldProps {
  label: string;
  placeholder: string;
  emptyMessage: string;
  clearLabel: string;
  openLabel: string;
  fieldName: string;
  disabled?: boolean;
  invalid?: boolean;
}

function DemoSingleField({
  items,
  label,
  placeholder,
  emptyMessage,
  clearLabel,
  openLabel,
  fieldName,
  disabled = false,
  invalid = false,
}: DemoFieldProps & { items: ComboboxOption[] }) {
  const [chosen, setChosen] = useState<ComboboxOption | null>(null);

  return (
    <div className="nds-min-h-30" style={{ contain: "layout", position: "relative" }}>
      <Combobox
        items={items}
        name={fieldName}
        disabled={disabled}
        value={chosen}
        onValueChange={(value) => {
          const option = Array.isArray(value) ? (value[0] ?? null) : value;
          setChosen(option);
          if (option) {
            track("option_select", {
              component: "combobox",
              field_name: fieldName,
              value: option.value,
              location: "docs_demo",
            });
          } else {
            track("field_change", {
              component: "combobox",
              field_name: fieldName,
              value: "",
              location: "docs_demo",
            });
          }
        }}
      >
        <ComboboxLabel>{label}</ComboboxLabel>
        <ComboboxInputWrapper disabled={disabled}>
          <ComboboxInput
            placeholder={placeholder}
            aria-invalid={invalid ? "true" : undefined}
          />
          <ComboboxClear aria-label={clearLabel} />
          <ComboboxTrigger aria-label={openLabel} />
        </ComboboxInputWrapper>
        <ComboboxContent emptyMessage={emptyMessage}>
          {(option: ComboboxOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function DemoMultipleField({
  items,
  label,
  placeholder,
  emptyMessage,
  clearLabel,
  openLabel,
  removeLabel,
  removedLabel,
  fieldName,
  genericRemove = false,
  withoutRemove = false,
}: DemoFieldProps & {
  items: ComboboxOption[];
  removeLabel: string;
  /** Sufixo do que a região viva anuncia DEPOIS de remover: "Brasil removido". */
  removedLabel: string;
  /** Contraexemplo: todo botão de remover com o MESMO nome. */
  genericRemove?: boolean;
  /** Contraexemplo: chip sem botão de remover nenhum. */
  withoutRemove?: boolean;
}) {
  const [chosen, setChosen] = useState<ComboboxOption[]>(() => items.slice(0, 2));

  return (
    <div className="nds-min-h-30" style={{ contain: "layout", position: "relative" }}>
      <Combobox
        multiple
        items={items}
        name={fieldName}
        removedAnnouncement={(label) => `${label} ${removedLabel}`}
        value={chosen}
        onValueChange={(value) => {
          const next = Array.isArray(value) ? value : [];
          const added = next.length > chosen.length;
          setChosen(next);
          track(added ? "option_select" : "field_change", {
            component: "combobox",
            field_name: fieldName,
            value: next.map((option) => option.value).join(","),
            location: "docs_demo",
          });
        }}
      >
        <ComboboxLabel>{label}</ComboboxLabel>
        <ComboboxInputWrapper>
          <ComboboxChips>
            {chosen.map((option) => (
              <ComboboxChip key={option.value}>
                <ComboboxChipText>{option.label}</ComboboxChipText>
                {/* Nome próprio por chip: "Remover" repetido é indistinguível
                    para quem navega por lista de controles. As duas variações
                    existem para a seção Do & Don't mostrar o defeito, e não
                    apenas descrevê-lo. */}
                {withoutRemove ? null : (
                  <ComboboxChipRemove
                    aria-label={
                      genericRemove ? removeLabel : `${removeLabel} ${option.label}`
                    }
                  />
                )}
              </ComboboxChip>
            ))}
            <ComboboxInput placeholder={placeholder} />
          </ComboboxChips>
          <ComboboxClear aria-label={clearLabel} />
          <ComboboxTrigger aria-label={openLabel} />
        </ComboboxInputWrapper>
        <ComboboxContent emptyMessage={emptyMessage}>
          {(option: ComboboxOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function DemoGroupedField({
  groups,
  label,
  placeholder,
  emptyMessage,
  clearLabel,
  openLabel,
  fieldName,
}: DemoFieldProps & { groups: ComboboxOptionGroup[] }) {
  return (
    <div className="nds-min-h-30" style={{ contain: "layout", position: "relative" }}>
      <Combobox
        items={groups}
        name={fieldName}
        onValueChange={(value) => {
          const option = Array.isArray(value) ? (value[0] ?? null) : value;
          if (!option) return;
          track("option_select", {
            component: "combobox",
            field_name: fieldName,
            value: option.value,
            location: "docs_demo",
          });
        }}
      >
        <ComboboxLabel>{label}</ComboboxLabel>
        <ComboboxInputWrapper>
          <ComboboxInput placeholder={placeholder} />
          <ComboboxClear aria-label={clearLabel} />
          <ComboboxTrigger aria-label={openLabel} />
        </ComboboxInputWrapper>
        <ComboboxContent emptyMessage={emptyMessage}>
          {(group: ComboboxOptionGroup) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
              {group.items.map((option) => (
                <ComboboxItem key={option.value} value={option}>
                  {option.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          )}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function ComboboxDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(
    comboboxTranslations,
    keyboardOverrides,
  );

  // As chaves de `accessibility.screenReader` variam por componente, então só
  // os valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (comboboxTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
    [locale],
  );

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "combobox",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/form" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "combobox",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "combobox",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Dados das prévias ─────────────────────────────────────────────────

  const countries = useMemo<ComboboxOption[]>(
    () => [
      { value: "brasil", label: tContent("demonstration.labels.brazil") },
      { value: "argentina", label: tContent("demonstration.labels.argentina") },
      { value: "chile", label: tContent("demonstration.labels.chile") },
      { value: "colombia", label: tContent("demonstration.labels.colombia") },
      { value: "mexico", label: tContent("demonstration.labels.mexico") },
      { value: "peru", label: tContent("demonstration.labels.peru") },
      { value: "portugal", label: tContent("demonstration.labels.portugal") },
      { value: "espanha", label: tContent("demonstration.labels.spain") },
      { value: "uruguai", label: tContent("demonstration.labels.uruguay") },
    ],
    [tContent],
  );

  const ingredients = useMemo<ComboboxOptionGroup[]>(
    () => [
      {
        value: tContent("demonstration.labels.groupFruits"),
        items: [
          { value: "maca", label: tContent("demonstration.labels.apple") },
          { value: "banana", label: tContent("demonstration.labels.banana") },
          { value: "laranja", label: tContent("demonstration.labels.orange") },
        ],
      },
      {
        value: tContent("demonstration.labels.groupVegetables"),
        items: [
          { value: "cenoura", label: tContent("demonstration.labels.carrot") },
          { value: "batata", label: tContent("demonstration.labels.potato") },
          { value: "abobrinha", label: tContent("demonstration.labels.zucchini") },
        ],
      },
    ],
    [tContent],
  );

  const shared = {
    emptyMessage: tContent("demonstration.labels.empty"),
    clearLabel: tContent("demonstration.labels.clear"),
    openLabel: tContent("demonstration.labels.openList"),
  };

  // ─── Code strings ──────────────────────────────────────────────────────

  const codeImport = `import {
  Combobox,
  ComboboxLabel,
  ComboboxInputWrapper,
  ComboboxInput,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipText,
  ComboboxChipRemove,
  ComboboxClear,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxItem,
  ComboboxSeparator,
} from "@/components/ui/combobox";`;

  const codeSingle = `<Combobox items={paises} name="pais">
  <ComboboxLabel>País</ComboboxLabel>
  <ComboboxInputWrapper>
    <ComboboxInput placeholder="Buscar país" />
    <ComboboxClear aria-label="Limpar" />
    <ComboboxTrigger aria-label="Abrir lista" />
  </ComboboxInputWrapper>
  <ComboboxContent emptyMessage="Nenhum resultado">
    {(pais) => (
      <ComboboxItem key={pais.value} value={pais}>
        {pais.label}
      </ComboboxItem>
    )}
  </ComboboxContent>
</Combobox>`;

  const codeMultiple = `<Combobox multiple items={paises} value={escolhidos} onValueChange={setEscolhidos}>
  <ComboboxLabel>Países</ComboboxLabel>
  <ComboboxInputWrapper>
    <ComboboxChips>
      {escolhidos.map((pais) => (
        <ComboboxChip key={pais.value}>
          <ComboboxChipText>{pais.label}</ComboboxChipText>
          <ComboboxChipRemove aria-label={"Remover " + pais.label} />
        </ComboboxChip>
      ))}
      <ComboboxInput placeholder="Adicionar país" />
    </ComboboxChips>
    <ComboboxClear aria-label="Limpar" />
    <ComboboxTrigger aria-label="Abrir lista" />
  </ComboboxInputWrapper>
  <ComboboxContent emptyMessage="Nenhum resultado">
    {(pais) => (
      <ComboboxItem key={pais.value} value={pais}>
        {pais.label}
      </ComboboxItem>
    )}
  </ComboboxContent>
</Combobox>`;

  const codeGrouped = `<Combobox items={grupos}>
  <ComboboxLabel>Ingrediente</ComboboxLabel>
  <ComboboxInputWrapper>
    <ComboboxInput placeholder="Buscar ingrediente" />
    <ComboboxClear aria-label="Limpar" />
    <ComboboxTrigger aria-label="Abrir lista" />
  </ComboboxInputWrapper>
  <ComboboxContent emptyMessage="Nenhum resultado">
    {(grupo) => (
      <ComboboxGroup key={grupo.value} items={grupo.items}>
        <ComboboxGroupLabel>{grupo.value}</ComboboxGroupLabel>
        {grupo.items.map((item) => (
          <ComboboxItem key={item.value} value={item}>
            {item.label}
          </ComboboxItem>
        ))}
      </ComboboxGroup>
    )}
  </ComboboxContent>
</Combobox>`;

  const codeInForm = `<form onSubmit={(evento) => evento.preventDefault()}>
  <Combobox items={paises} name="pais">
    <ComboboxLabel>País</ComboboxLabel>
    <ComboboxInputWrapper>
      <ComboboxInput placeholder="Buscar país" />
      <ComboboxClear aria-label="Limpar" />
      <ComboboxTrigger aria-label="Abrir lista" />
    </ComboboxInputWrapper>
    <ComboboxContent emptyMessage="Nenhum resultado">
      {(pais) => (
        <ComboboxItem key={pais.value} value={pais}>
          {pais.label}
        </ComboboxItem>
      )}
    </ComboboxContent>
  </Combobox>
  <button type="submit">Continuar</button>
</form>`;

  const interfaceCode = `interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ComboboxOptionGroup {
  value: string;          // cabeçalho do grupo
  items: ComboboxOption[];
}

interface ComboboxProps {
  items: ComboboxOption[] | ComboboxOptionGroup[];
  value?: ComboboxOption | ComboboxOption[] | null;
  defaultValue?: ComboboxOption | ComboboxOption[] | null;
  onValueChange?: (value: ComboboxOption | ComboboxOption[] | null) => void;
  inputValue?: string;
  onInputValueChange?: (inputValue: string) => void;
  multiple?: boolean;
  chipsLayout?: "wrap" | "single-line";
  filter?: ((item: ComboboxOption, query: string) => boolean) | null;
  limit?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
}

interface ComboboxContentProps {
  emptyMessage: React.ReactNode;   // obrigatório
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}`;

  // A tabela de props é montada LOCALMENTE: o NOME e o TIPO são os desta stack,
  // e só a descrição vem do conteúdo compartilhado, que é API-neutro de
  // propósito. Aqui `value` carrega o OBJETO da opção, e não a string que o
  // conteúdo publica — é o objeto que `<ComboboxItem value={...}>` recebe e o
  // que volta no callback de mudança.
  //
  // `filter` aparece com DUAS casas, `(item, query)`: é o que a raiz entrega. A
  // lib chama o filtro com um terceiro argumento, interno dela, e a raiz o
  // envolve justamente para que ele não vire parte deste contrato.
  //
  // `placeholder` sai em tabela PRÓPRIA porque nesta stack ele é atributo do
  // `<ComboboxInput>`, não da raiz. Listá-lo junto prometeria uma superfície que
  // a raiz não tem.
  const propCols = {
    prop: tContent("props.table.prop"),
    type: tContent("props.table.type"),
    default: tContent("props.table.default"),
    required: tContent("props.table.required"),
    description: tContent("props.table.description"),
  };

  const propRow = (name: string, type: string) => ({
    name,
    type,
    defaultValue: tContent(`props.table.${name}.default`),
    required: tContent(`props.table.${name}.required`),
    description: toPlainText(tContent(`props.table.${name}.description`)),
  });

  const propTables = [
    {
      title: "Combobox",
      cols: propCols,
      items: [
        propRow("value", "ComboboxOption | ComboboxOption[] | null"),
        propRow("defaultValue", "ComboboxOption | ComboboxOption[] | null"),
        propRow(
          "onValueChange",
          "(value: ComboboxOption | ComboboxOption[] | null) => void",
        ),
        propRow("inputValue", "string"),
        propRow("onInputValueChange", "(inputValue: string) => void"),
        propRow("multiple", "boolean"),
        // Só tem efeito no modo múltiplo, e mesmo assim mora na RAIZ: é lá que
        // `multiple` já está, e a caixa do campo recebe a escolha por contexto.
        propRow("chipsLayout", '"wrap" | "single-line"'),
        propRow("items", "ComboboxOption[] | ComboboxOptionGroup[]"),
        propRow(
          "filter",
          "((item: ComboboxOption, query: string) => boolean) | null",
        ),
        propRow("disabled", "boolean"),
        propRow("name", "string"),
      ],
    },
    {
      title: "ComboboxInput",
      cols: propCols,
      items: [propRow("placeholder", "string")],
    },
  ];

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="combobox"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-grid nds-w-full" data-cols="3" data-spacing="lg">
          <div className="nds-stack" data-spacing="xs">
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {tContent("variants.items.single")}
            </p>
            <DemoSingleField
              items={countries}
              fieldName="country"
              label={tContent("demonstration.labels.countryLabel")}
              placeholder={tContent("demonstration.labels.countryPlaceholder")}
              {...shared}
            />
          </div>

          <div className="nds-stack" data-spacing="xs">
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {tContent("variants.items.multiple")}
            </p>
            <DemoMultipleField
              items={countries}
              fieldName="countries"
              label={tContent("demonstration.labels.countriesLabel")}
              placeholder={tContent("demonstration.labels.countriesPlaceholder")}
              removeLabel={tContent("demonstration.labels.remove")}
              removedLabel={tContent("demonstration.labels.removed")}
              {...shared}
            />
          </div>

          <div className="nds-stack" data-spacing="xs">
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {tContent("variants.items.grouped")}
            </p>
            <DemoGroupedField
              groups={ingredients}
              fieldName="ingredient"
              label={tContent("demonstration.labels.groupedLabel")}
              placeholder={tContent("demonstration.labels.groupedPlaceholder")}
              {...shared}
            />
          </div>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[
          tContent("anatomy.item1"),
          tContent("anatomy.item2"),
          tContent("anatomy.item3"),
          tContent("anatomy.item4"),
          tContent("anatomy.item5"),
          tContent("anatomy.item6"),
          tContent("anatomy.item7"),
          tContent("anatomy.item8"),
          tContent("anatomy.item9"),
          tContent("anatomy.item10"),
        ]}
        structureCode={tContent("anatomy.structureCode")}
        structureLabel={tContent("anatomy.structureLabel")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
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
            tContent("usage.guidelines.item6"),
            tContent("usage.guidelines.item7"),
          ],
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
            s: tContent(`usage.scenarios.item${i}.s`),
            u: tContent(`usage.scenarios.item${i}.u`),
            a: tContent(`usage.scenarios.item${i}.a`),
          })),
        }}
        uxWriting={{
          title: tContent("usage.uxWriting.title"),
          cols: {
            element: tContent("usage.uxWriting.table.element"),
            rules: tContent("usage.uxWriting.table.rules"),
            do: tContent("usage.uxWriting.table.correct"),
            dont: tContent("usage.uxWriting.table.avoid"),
          },
          items: [
            "placeholder",
            "itemLabel",
            "chipRemove",
            "emptyMessage",
          ].map((key) => ({
            element: tContent(`usage.uxWriting.table.${key}.name`),
            rules: tContent(`usage.uxWriting.table.${key}.format`),
            do: tContent(`usage.uxWriting.table.${key}.good`),
            dont: tContent(`usage.uxWriting.table.${key}.bad`),
          })),
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
            tContent("usage.dont.item4"),
          ],
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <DemoMultipleField
                items={countries}
                fieldName="dodont_named_remove"
                label={tContent("demonstration.labels.countriesLabel")}
                placeholder={tContent("demonstration.labels.countriesPlaceholder")}
                removeLabel={tContent("demonstration.labels.remove")}
                removedLabel={tContent("demonstration.labels.removed")}
                {...shared}
              />
            ),
            dontPreview: (
              <DemoMultipleField
                items={countries}
                fieldName="dodont_generic_remove"
                label={tContent("demonstration.labels.countriesLabel")}
                placeholder={tContent("demonstration.labels.countriesPlaceholder")}
                // O contraexemplo mora AQUI: o mesmo campo, com todo botão de
                // remover chamado igual. Na tela não muda nada — é por isso
                // que o defeito sobrevive tanto tempo sem ninguém ver.
                removeLabel={tContent("demonstration.labels.remove")}
                removedLabel={tContent("demonstration.labels.removed")}
                genericRemove
                {...shared}
              />
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <DemoMultipleField
                items={countries}
                fieldName="dodont_backspace"
                label={tContent("demonstration.labels.countriesLabel")}
                placeholder={tContent("demonstration.labels.countriesPlaceholder")}
                removeLabel={tContent("demonstration.labels.remove")}
                removedLabel={tContent("demonstration.labels.removed")}
                {...shared}
              />
            ),
            dontPreview: (
              <DemoMultipleField
                items={countries}
                fieldName="dodont_no_backspace"
                label={tContent("demonstration.labels.countriesLabel")}
                placeholder={tContent("demonstration.labels.countriesPlaceholder")}
                removeLabel={tContent("demonstration.labels.remove")}
                removedLabel={tContent("demonstration.labels.removed")}
                // Chip sem caminho de saída: quem escolheu por engano fica com
                // o valor preso, e o campo passa a exigir recarregar a página.
                withoutRemove
                {...shared}
              />
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair2.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="combobox"
        items={[
          {
            trackId: "single",
            name: tContent("variants.items.single"),
            description: stripHtml(tContent("variants.styles.single")),
            code: codeSingle,
            preview: (
              <DemoSingleField
                items={countries}
                fieldName="variant_single"
                label={tContent("demonstration.labels.countryLabel")}
                placeholder={tContent("demonstration.labels.countryPlaceholder")}
                {...shared}
              />
            ),
          },
          {
            trackId: "multiple",
            name: tContent("variants.items.multiple"),
            description: stripHtml(tContent("variants.styles.multiple")),
            code: codeMultiple,
            preview: (
              <DemoMultipleField
                items={countries}
                fieldName="variant_multiple"
                label={tContent("demonstration.labels.countriesLabel")}
                placeholder={tContent("demonstration.labels.countriesPlaceholder")}
                removeLabel={tContent("demonstration.labels.remove")}
                removedLabel={tContent("demonstration.labels.removed")}
                {...shared}
              />
            ),
          },
          {
            trackId: "grouped",
            name: tContent("variants.items.grouped"),
            description: stripHtml(tContent("variants.styles.grouped")),
            code: codeGrouped,
            preview: (
              <DemoGroupedField
                groups={ingredients}
                fieldName="variant_grouped"
                label={tContent("demonstration.labels.groupedLabel")}
                placeholder={tContent("demonstration.labels.groupedPlaceholder")}
                {...shared}
              />
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="combobox"
        items={[
          {
            trackId: "inForm",
            name: tContent("variants.compositions.inForm.name"),
            description: tContent("variants.compositions.inForm.description"),
            useWhen: tContent("variants.compositions.inForm.use"),
            code: codeInForm,
            preview: (
              <form
                className="nds-stack nds-w-sm"
                data-spacing="md"
                onSubmit={(event) => event.preventDefault()}
              >
                <DemoSingleField
                  items={countries}
                  fieldName="composition_form"
                  label={tContent("demonstration.labels.countryLabel")}
                  placeholder={tContent("demonstration.labels.countryPlaceholder")}
                  {...shared}
                />
              </form>
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
          "default",
          "open",
          "filtering",
          "selected",
          "focus",
          "empty",
          "disabled",
          "invalid",
        ].map((key) => ({
          label: tContent(`states.${key}.label`),
          trigger: toPlainText(tContent(`states.${key}.trigger`)),
          behavior: toPlainText(tContent(`states.${key}.behavior`)),
        }))}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={propTables}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          ["--input", "input"],
          ["--input-background", "inputBackground"],
          ["--foreground", "foreground"],
          ["--muted-foreground", "mutedForeground"],
          ["--muted", "muted"],
          ["--secondary", "secondary"],
          ["--secondary-foreground", "secondaryForeground"],
          ["--popover", "popover"],
          ["--popover-foreground", "popoverForeground"],
          ["--accent", "accent"],
          ["--accent-foreground", "accentForeground"],
          ["--primary", "primary"],
          ["--border", "border"],
          ["--ring", "ring"],
          ["--destructive", "destructive"],
          ["--radius", "radius"],
          ["--radius-full", "radiusFull"],
        ].map(([token, key]) => ({
          token,
          value: tContent(`tokens.table.${key}.class`),
          description: tContent(`tokens.table.${key}.part`),
        }))}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[1, 2, 3, 4, 5, 6, 7].map((i) =>
          tContent(`accessibility.items.item${i}`),
        )}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "A–Z", description: toPlainText(tContent("accessibility.keyboard.typing")) },
          { key: "Arrow Down", description: toPlainText(tContent("accessibility.keyboard.arrowDown")) },
          { key: "Arrow Up", description: toPlainText(tContent("accessibility.keyboard.arrowUp")) },
          { key: "Enter", description: toPlainText(tContent("accessibility.keyboard.enter")) },
          { key: "Esc", description: toPlainText(tContent("accessibility.keyboard.escape")) },
          { key: "Tab", description: toPlainText(tContent("accessibility.keyboard.tab")) },
          { key: "Backspace", description: toPlainText(tContent("accessibility.keyboard.backspace")) },
          { key: "Home", description: toPlainText(tContent("accessibility.keyboard.home")) },
          { key: "End", description: toPlainText(tContent("accessibility.keyboard.end")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="combobox"
        items={[
          {
            name: tContent("related.items.select.name"),
            description: toPlainText(tContent("related.items.select.description")),
            path: "?path=/docs/components-form-select--docs",
          },
          {
            name: tContent("related.items.command.name"),
            description: toPlainText(tContent("related.items.command.description")),
            path: "?path=/docs/components-overlay-command--docs",
          },
          {
            name: tContent("related.items.input.name"),
            description: toPlainText(tContent("related.items.input.description")),
            path: "?path=/docs/components-form-input--docs",
          },
          {
            name: tContent("related.items.form.name"),
            description: toPlainText(tContent("related.items.form.description")),
            path: "?path=/docs/components-form-form--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="combobox"
        items={[1, 2, 3, 4, 5, 6].map((i) => ({
          title: "",
          content: tContent(`notes.item${i}`),
        }))}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: "option_select",
            trigger: toPlainText(tContent("analytics.table.option_select.trigger")),
            payload: tContent("analytics.table.option_select.payload"),
          },
          {
            event: "field_change",
            trigger: toPlainText(tContent("analytics.table.field_change.trigger")),
            payload: tContent("analytics.table.field_change.payload"),
          },
        ]}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
            action: toPlainText(tContent(`testes.functional.item${i}.action`)),
            result: toPlainText(tContent(`testes.functional.item${i}.result`)),
            priority: tNav(
              priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ??
                "common.high",
            ),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: [
            { criterion: tContent("testes.accessibility.item1"), level: "AA", how: "axe-core" },
            { criterion: tContent("testes.accessibility.item2"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item3"), level: "4.1.2", how: "DevTools attribute" },
            { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item5"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item6"), level: "1.4.3", how: "Contrast checker" },
            { criterion: tContent("testes.accessibility.item7"), level: "2.4.7", how: "Keyboard test" },
          ],
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(
              priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ??
                "common.high",
            ),
          })),
        }}
      />
    </DocsPageLayout>
  );
}

export default ComboboxDocs;
