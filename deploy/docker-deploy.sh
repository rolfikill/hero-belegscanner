#!/bin/bash
# HERO Belegscanner - Docker Deployment Script für Hetzner Server

set -e

echo "🐳 HERO Belegscanner - Docker Deployment"
echo "=========================================="

# Variablen
DOMAIN="belegscanner.ihre-domain.de"  # Anpassen!
EMAIL="ihre-email@domain.de"          # Anpassen!
CLAUDE_API_KEY=""                      # Wird abgefragt

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Root-Check
if [ "$EUID" -ne 0 ]; then
    error "Bitte als root ausführen: sudo bash docker-deploy.sh"
fi

log "System Update..."
apt update && apt upgrade -y

log "Installiere Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

log "Installiere Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

log "Clone Repository..."
cd /opt
if [ -d "hero-belegscanner" ]; then
    cd hero-belegscanner
    git pull
else
    git clone https://github.com/rolfikill/hero-belegscanner.git
    cd hero-belegscanner
fi

log "Konfiguriere Environment..."
# Claude API Key abfragen
if [ -z "$CLAUDE_API_KEY" ]; then
    read -p "Bitte geben Sie Ihren Claude API Key ein: " CLAUDE_API_KEY
    if [ -z "$CLAUDE_API_KEY" ]; then
        error "Claude API Key ist erforderlich!"
    fi
fi

# .env Datei erstellen
cat > .env << EOF
ANTHROPIC_API_KEY=$CLAUDE_API_KEY
DOMAIN=$DOMAIN
EMAIL=$EMAIL
EOF

log "Erstelle Verzeichnisse..."
mkdir -p uploads logs nginx/sites ssl

log "Nginx Konfiguration..."
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream hero-app {
        server hero-belegscanner:5000;
    }

    server {
        listen 80;
        server_name _;
        
        location / {
            proxy_pass http://hero-app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

log "Docker Container bauen und starten..."
docker-compose down 2>/dev/null || true
docker-compose build
docker-compose up -d

log "Warte auf Container-Start..."
sleep 10

log "Teste Services..."
if docker-compose ps | grep -q "Up"; then
    log "✅ Container laufen erfolgreich"
else
    error "❌ Container konnten nicht gestartet werden"
fi

# Teste HTTP-Verbindung
if curl -f http://localhost:5000/health &>/dev/null; then
    log "✅ App ist erreichbar"
else
    warn "⚠️  App noch nicht bereit, prüfe Logs: docker-compose logs"
fi

log "Installiere Certbot für SSL..."
apt install -y certbot
# SSL später konfigurieren nach DNS-Setup

echo ""
echo "🎉 Docker Deployment erfolgreich!"
echo "=================================="
echo "✅ App läuft auf: http://$DOMAIN"
echo "✅ Container sind gestartet"
echo ""
echo "📊 Nützliche Befehle:"
echo "  Status:     docker-compose ps"
echo "  Logs:       docker-compose logs -f"
echo "  Restart:    docker-compose restart"
echo "  Stop:       docker-compose down"
echo "  Update:     git pull && docker-compose up -d --build"
echo ""
echo "🔧 Für SSL (nach DNS-Setup):"
echo "  certbot --nginx -d $DOMAIN"
echo ""
echo "📱 Portainer installieren (optional):"
echo "  docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer-ce"
echo "" 