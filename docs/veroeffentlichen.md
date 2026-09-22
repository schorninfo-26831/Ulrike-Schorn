# Veröffentlichen — Stufe 5

Entschieden ist Weg A: Die Seite läuft auf deinem Mac. Der Umzug ins Netz (Weg B) kommt später und
ist vorbereitet. Was hier steht, folgt WEBSITE-MOTOR.md, Stufe 5.

## 1 · Jetzt: die Seite zeigen (Weg A, Tunnel)

Zum Zeigen reicht ein Tunnel. Er gibt deinem laufenden Motor für die Dauer des Tunnels eine
öffentliche Adresse. Einmalig einrichten:

```bash
brew install cloudflared
```

Dann bei laufendem Motor (`npm start` in einem Fenster) in einem zweiten Terminal-Fenster:

```bash
cloudflared tunnel --url http://localhost:3000
```

Nach ein paar Sekunden steht dort eine Adresse wie `https://irgendwas.trycloudflare.com`. Die
schickst du weiter: an Justus zur Prüfung der Rechtstexte, an jemanden aus der Schulung, an einen
Kunden. `Ctrl + C` beendet den Tunnel, die Adresse ist danach tot. Beim nächsten Mal gibt es eine neue.

Was dabei von allein stimmt: Sitemap, robots.txt und die Vorschaubilder fürs Teilen nehmen die
Adresse des Tunnels. Das Cockpit ist mit erreichbar, geschützt durch dein Passwort und die Bremse
gegen Passwort-Raten (zehn Fehlversuche, dann 15 Minuten Pause).

Ein Tunnel ist zum Zeigen da. Läuft der Mac nicht, ist die Seite weg.

## 2 · Was der Motor seit Stufe 5 mitbringt (P6: nichts davon hält eine Veröffentlichung auf)

| Schicht | Wo |
|---|---|
| `sitemap.xml` aus allen veröffentlichten Seiten | `/sitemap.xml` |
| `robots.txt`, Cockpit und API ausgeschlossen | `/robots.txt` |
| Vorschaubild fürs Teilen: je Seite eigenes (Cockpit) oder das Standardbild `public/img/og-standard.png`; canonical und `og:url` absolut | jede Seite |
| Zugriffe zählen, ohne personenbezogene Daten | Cockpit „Zugriffe" |
| Anfragen per E-Mail, sobald SMTP eingerichtet ist | `.env`: `SMTP_URL`, `MAIL_TO` |
| Sicherheits-Kopfzeilen, HSTS über HTTPS, Bremse gegen Passwort-Raten | immer |
| Reverse-Proxy-tauglich: Protokoll und Absender aus `X-Forwarded-*` | `TRUST_PROXY`, Standard reicht |

## 3 · Später: der Umzug ins Netz (Weg B)

Die fünf Schritte aus der Bauanleitung, auf dieses Projekt übersetzt. Alles dafür liegt im Repository:
`Dockerfile`, `docker-compose.yml`, `Caddyfile`. Beim ersten Start spielt der Container die
Startseiten von allein ein (Seed ohne Force, P5), danach fasst er sie nicht mehr an.

1. **Kleiner VPS mit Docker und einem Reverse-Proxy mit automatischem Zertifikat.** Zwei Wege:
   - *Coolify (Oberfläche):* Neues Projekt → Quelle: dieses Repository, Zweig `main` → Build: Dockerfile.
     Coolify bringt Proxy und Zertifikat selbst mit; `docker-compose.yml` und `Caddyfile` bleiben ungenutzt.
   - *Nackter VPS:* `git clone`, `.env` anlegen (`ADMIN_PASSWORD`, `DOMAIN`, …), dann
     `docker compose up -d --build`. Caddy holt das Zertifikat für `DOMAIN` von allein.
2. **Verwaltetes Postgres:** beim Hoster anlegen, `DATABASE_URL` setzen. `src/db.js` schaltet von allein
   um; SQLite bleibt der Weg ohne diesen Wert. Uploads liegen im Volume `/app/data`.
3. **Domain auf die Maschine zeigen** (A-Record beim Domain-Anbieter). Danach in `config/site.json`
   `domain` eintragen, damit Sitemap und Vorschaubilder unabhängig vom Aufruf stimmen.
4. **Echte Werte nur in der Oberfläche des Hosters:** `ADMIN_PASSWORD`, `DATABASE_URL`,
   `ANTHROPIC_API_KEY`, `SMTP_URL`, `MAIL_TO`. Nie ins Repository, nie in einen Chat.
5. **Auto-Deploy beim Push auf `main`.** Bis jetzt lebt alles auf dem Zweig
   `claude/website-motor-stufe-0-fkxuo8`; vor dem Umzug wird er nach `main` gebracht.

Danach: `/health` antwortet mit `{"status":"ok"}`, das Cockpit unter `https://deine-domain/admin/`.

## 4 · Vor dem Livegang: was nur du entscheiden kannst

Nichts davon wird geraten. Jede Zeile ist eine Entscheidung oder eine Lieferung von dir.

| | Punkt | Wer |
|---|---|---|
| ✔ | **Domain:** Subdomain von camping-schorni.de für die Inhalte, Shop bleibt auf der Hauptdomain, keine Umleitungsliste (entschieden 22.09.2026, docs/entscheidungen.md). Beim Livegang: Subdomain per A-Record auf den Hoster zeigen, Name in config/site.json | erledigt |
| ☐ | **Hoster für Weg B** (Coolify auf einem VPS, Hetzner, Railway …) | Ulrike |
| ◐ | **Rechtstexte prüfen:** Justus hat am 22.09.2026 geprüft und überarbeitet (docs/rechtspruefung.md). Rechtsform geklärt (kein Handelsregister). Offen: Hoster und Standort im Datenschutz, Anthropic-DPA in der Konsole akzeptieren | Ulrike, Justus |
| ✔ | **E-Mail-Adresse:** info@caravan-reiniger.de, bestätigt durch die Team-Basis des KI-Teams (Marken-Fakten, Stand Juni 2026) | erledigt |
| ☐ | **Über uns:** dein Originaltext ersetzt den Platzhalter | Ulrike |
| ✔ | **Kontakt:** UV-Einbauservice und Beratung sind in der Team-Basis als Service-USP festgehalten | erledigt |
| ☐ | **SMTP-Zugang** für den Mailversand der Anfragen | Ulrike |
| ☐ | **Zweig nach `main`** bringen (Pull Request) | Ulrike, mit mir |

## 5 · Abnahme Stufe 5 (Weg A)

| | Prüfpunkt | Geschafft |
|---|---|---|
| 1 | Tunnel läuft, die Adresse öffnet die Startseite auf deinem Telefon (Mobilfunk, nicht WLAN) | ☐ |
| 2 | Die Adresse in WhatsApp oder Signal einfügen: Vorschau zeigt Bild und Titel | ☐ |
| 3 | `/sitemap.xml` unter der Tunnel-Adresse führt die sechs Seiten mit dieser Adresse | ☐ |
| 4 | Nach ein paar Aufrufen vom Telefon zeigt das Cockpit unter „Zugriffe" Zahlen | ☐ |
| 5 | Zehnmal ein falsches Passwort im Cockpit: die elfte Anmeldung wird abgewiesen, nach 15 Minuten geht es wieder | ☐ |
| 6 | Auf /kontakt/ eine Anfrage abschicken: sie steht unter „Anfragen" (und im Postfach, falls SMTP eingerichtet ist) | ☐ |

Wenn alle sechs Haken stehen, ist Stufe 5 für Weg A abgenommen. Der Umzug (Weg B) ist ein eigener
Termin, sobald die Punkte aus Abschnitt 4 entschieden sind.
