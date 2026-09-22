/** Der Bestand fürs Lesen nach P3: alle veröffentlichten Seiten, schlank. Übersichten filtern selbst. */
import { query } from './db.js';

export async function ladeBestand() {
  return query("SELECT slug, page_type, status, title, description, og_image, updated_at FROM pages WHERE status = 'published' ORDER BY updated_at DESC");
}
