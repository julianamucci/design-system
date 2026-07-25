import { FoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/internacionalizacao/translations.json';

export function I18nDocs() {
  return <FoundationPage slug="internacionalizacao" translations={translations} />;
}
