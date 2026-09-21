/**
 * Lader für site/facts/theme. Liest bei jedem Aufruf — die Dateien sind klein,
 * und so greift eine Änderung ohne Neustart. Stufe 3.8 legt die Cockpit-Overrides
 * aus der Datenbank darüber; bis dahin ist die Datei die einzige Quelle.
 */
import { readFileSync } from 'node:fs';

const lies = (pfad) => JSON.parse(readFileSync(pfad, 'utf8'));

export const loadSite = () => lies('config/site.json');
export const loadFacts = () => lies('config/facts.json');
export const loadTheme = () => lies('config/theme.json');
