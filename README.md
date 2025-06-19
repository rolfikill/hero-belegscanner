# 🚀 HERO Belegscanner

Ein moderner, KI-gestützter Belegscanner mit automatischer Texterkennung und intelligentem Dashboard.

![Python](https://img.shields.io/badge/Python-3.13-blue)
![Flask](https://img.shields.io/badge/Flask-3.1-green)
![Claude](https://img.shields.io/badge/Claude-3.5%20Sonnet-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 📸 **Automatische Texterkennung** - Einfach Foto hochladen, fertig!
- 🤖 **Claude AI Integration** - Intelligente Extraktion von Händler, Datum, Betrag, etc.
- 📊 **Live Dashboard** - KPI-Übersicht mit Einnahmen/Ausgaben
- 🎨 **Modernes UI** - Minimalistisches Design mit Drag & Drop
- 📱 **Responsive Design** - Funktioniert auf Desktop und Mobile
- 🔄 **Bildbearbeitung** - Drehen, Zoomen, Löschen von Dokumenten
- 💾 **Datenspeicherung** - Automatische Speicherung und Statistiken
- 🎯 **Confidence-Indikatoren** - Vertrauenslevel der OCR-Erkennung

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python Flask
- **AI**: Claude 3.5 Sonnet Vision API
- **Bildverarbeitung**: OpenCV + Pillow
- **UI**: Modernes minimalistisches Design

## 🚀 Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd document-scanner
   ```

2. **Virtuelle Umgebung erstellen**
   ```bash
   python -m venv document-scanner-env
   document-scanner-env\Scripts\activate  # Windows
   # oder
   source document-scanner-env/bin/activate  # Linux/Mac
   ```

3. **Abhängigkeiten installieren**
   ```bash
   pip install -r requirements.txt
   ```

4. **Umgebungsvariablen konfigurieren**
   ```bash
   # .env Datei erstellen
   ANTHROPIC_API_KEY=your_claude_api_key_here
   ```

5. **Server starten**
   ```bash
   python main.py
   ```

6. **Browser öffnen**
   ```
   http://localhost:5000
   ```

## 🔧 Konfiguration

### Claude API Key

1. Registrieren Sie sich bei [Anthropic](https://www.anthropic.com/)
2. Erstellen Sie einen API Key
3. Fügen Sie den Key in die `.env` Datei ein:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

## 📖 Verwendung

1. **Dokument hochladen**
   - Drag & Drop in die Upload-Area
   - Oder "Datei auswählen" Button verwenden

2. **Automatische Erkennung**
   - Claude AI analysiert das Dokument
   - Felder werden automatisch ausgefüllt
   - Confidence-Bubbles zeigen Vertrauenslevel

3. **Bearbeitung**
   - Erkannte Daten können manuell angepasst werden
   - Bild kann gedreht und gezoomt werden

4. **Speichern**
   - "Fertig stellen" speichert den Beleg
   - KPI-Dashboard wird aktualisiert

## 🎨 Screenshots

### Dashboard
- Moderne KPI-Karten
- Zwei-Spalten-Layout
- Responsive Design

### Upload & Erkennung
- Drag & Drop Interface
- Automatische Feldausfüllung
- Confidence-Indikatoren

## 🔄 API Endpunkte

- `GET /` - Hauptseite
- `POST /upload` - Dokument hochladen und analysieren
- `POST /api/receipts` - Beleg speichern
- `GET /api/stats` - Statistiken abrufen
- `GET /health` - Server-Status

## 🤝 Beitragen

1. Fork des Projekts
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

## 📝 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe `LICENSE` Datei für Details.

## 🙏 Danksagungen

- [Anthropic](https://www.anthropic.com/) für die Claude API
- [Flask](https://flask.palletsprojects.com/) für das Web-Framework
- [OpenCV](https://opencv.org/) für die Bildverarbeitung

## 📞 Kontakt

Bei Fragen oder Anregungen können Sie gerne ein Issue erstellen oder sich direkt melden.

---

**Made with ❤️ and Claude AI** 