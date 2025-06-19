#!/bin/bash
# HERO Belegscanner - Production Deployment Script für Hetzner Server
# Führen Sie dieses Script als root aus

set -e  # Exit on any error

echo "🚀 HERO Belegscanner - Production Deployment"
echo "=============================================="

# Variablen (anpassen!)
DOMAIN="belegscanner.ihre-domain.de"  # Ihre Domain hier eintragen
EMAIL="ihre-email@domain.de"          # Ihre E-Mail für Let's Encrypt
CLAUDE_API_KEY=""                      # Wird später gesetzt

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Bitte als root ausführen: sudo bash deploy.sh"
fi

log "System Update..."
apt update && apt upgrade -y

log "Installiere System-Pakete..."
apt install -y nginx python3 python3-pip python3-venv git certbot python3-certbot-nginx \
               build-essential python3-dev libopencv-dev pkg-config

log "Erstelle Verzeichnisse..."
mkdir -p /var/www
mkdir -p /var/log/gunicorn
mkdir -p /var/run/gunicorn

log "Clone Repository..."
cd /var/www
if [ -d "hero-belegscanner" ]; then
    cd hero-belegscanner
    git pull
else
    git clone https://github.com/rolfikill/hero-belegscanner.git
    cd hero-belegscanner
fi

log "Erstelle Python Virtual Environment..."
python3 -m venv document-scanner-env
source document-scanner-env/bin/activate

log "Installiere Python Dependencies..."
pip install --upgrade pip
pip install gunicorn
pip install -r requirements.txt

log "Setze Berechtigungen..."
chown -R www-data:www-data /var/www/hero-belegscanner
chown -R www-data:www-data /var/log/gunicorn
chown -R www-data:www-data /var/run/gunicorn

log "Konfiguriere Nginx..."
cp deploy/nginx.conf /etc/nginx/sites-available/hero-belegscanner
sed -i "s/belegscanner.ihre-domain.de/$DOMAIN/g" /etc/nginx/sites-available/hero-belegscanner

# Enable site
ln -sf /etc/nginx/sites-available/hero-belegscanner /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t || error "Nginx Konfiguration fehlerhaft!"

log "Konfiguriere Systemd Service..."
cp deploy/hero-belegscanner.service /etc/systemd/system/

# Frage nach Claude API Key
if [ -z "$CLAUDE_API_KEY" ]; then
    echo ""
    read -p "Bitte geben Sie Ihren Claude API Key ein: " CLAUDE_API_KEY
    if [ -z "$CLAUDE_API_KEY" ]; then
        error "Claude API Key ist erforderlich!"
    fi
fi

# Update service file with API key
sed -i "s/ihr_claude_api_key_hier/$CLAUDE_API_KEY/g" /etc/systemd/system/hero-belegscanner.service

log "Starte Services..."
systemctl daemon-reload
systemctl enable hero-belegscanner
systemctl start hero-belegscanner
systemctl enable nginx
systemctl restart nginx

log "SSL-Zertifikat installieren..."
certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

log "Teste Services..."
if systemctl is-active --quiet hero-belegscanner; then
    log "✅ HERO Belegscanner Service läuft"
else
    error "❌ HERO Belegscanner Service konnte nicht gestartet werden"
fi

if systemctl is-active --quiet nginx; then
    log "✅ Nginx läuft"
else
    error "❌ Nginx konnte nicht gestartet werden"
fi

# Firewall konfigurieren (falls UFW installiert)
if command -v ufw &> /dev/null; then
    log "Konfiguriere Firewall..."
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
fi

echo ""
echo "🎉 Deployment erfolgreich abgeschlossen!"
echo "=============================================="
echo "✅ App ist erreichbar unter: https://$DOMAIN"
echo "✅ SSL-Zertifikat wurde installiert"
echo "✅ Automatische Neustarts konfiguriert"
echo ""
echo "📊 Nützliche Befehle:"
echo "  Status prüfen:     systemctl status hero-belegscanner"
echo "  Logs anzeigen:     journalctl -u hero-belegscanner -f"
echo "  Service neustarten: systemctl restart hero-belegscanner"
echo "  Nginx neustarten:  systemctl restart nginx"
echo ""
echo "🔧 Für weitere Projekte:"
echo "  1. Neues Repository klonen nach /var/www/"
echo "  2. Nginx-Config kopieren und anpassen"
echo "  3. Systemd-Service kopieren und anpassen"
echo "  4. Services aktivieren und starten"
echo "" 