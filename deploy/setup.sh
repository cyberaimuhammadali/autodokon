#!/bin/bash
# DokonPro ERP - VPS Avtomatik O'rnatish Skripti
# Ubuntu 22.04 LTS uchun
# Ishlatish: bash setup.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║     DokonPro ERP - Server O'rnatish      ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ─── 1. Sozlamalar ────────────────────────────────────────────────────────────
read -p "Domain nomi (masalan: dokon.example.com): " DOMAIN
read -p "Telegram Bot Token (bo'sh qoldirsa o'tkaziladi): " TG_TOKEN
read -p "Telegram Chat ID: " TG_CHAT_ID
read -sp "Admin paroli (default: admin123): " ADMIN_PASS
ADMIN_PASS=${ADMIN_PASS:-admin123}
echo ""

DB_PASS=$(openssl rand -hex 16)

echo -e "${YELLOW}[1/8] Tizim yangilanmoqda...${NC}"
apt-get update -qq
apt-get install -y -qq curl wget nginx certbot python3-certbot-nginx git \
    python3.11 python3.11-venv python3-pip postgresql postgresql-contrib \
    nodejs npm supervisor

echo -e "${YELLOW}[2/8] PostgreSQL sozlanmoqda...${NC}"
sudo -u postgres psql -c "CREATE USER dokon WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE dokonpro OWNER dokon;" 2>/dev/null || true

echo -e "${YELLOW}[3/8] Loyiha yuklanmoqda...${NC}"
mkdir -p /opt/dokonpro
cd /opt/dokonpro
git clone https://github.com/cyberaimuhammadali/autodokon.git . 2>/dev/null || git pull

echo -e "${YELLOW}[4/8] Backend o'rnatilmoqda...${NC}"
cd /opt/dokonpro/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
pip install -q asyncpg psycopg2-binary

# .env fayl yaratish
cat > .env << EOF
DATABASE_URL=postgresql+asyncpg://dokon:${DB_PASS}@localhost:5432/dokonpro
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
TELEGRAM_BOT_TOKEN=${TG_TOKEN}
TELEGRAM_CHAT_ID=${TG_CHAT_ID}
EOF

# Bazani yaratish
python3 -c "import asyncio; from init_db import init_db; asyncio.run(init_db())"

echo -e "${YELLOW}[5/8] Frontend build qilinmoqda...${NC}"
cd /opt/dokonpro/frontend
npm install --silent
npm run build

echo -e "${YELLOW}[6/8] Nginx sozlanmoqda...${NC}"
cat > /etc/nginx/sites-available/dokonpro << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Frontend (React build)
    location / {
        root /opt/dokonpro/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        rewrite ^/api/(.*) /\$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -sf /etc/nginx/sites-available/dokonpro /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo -e "${YELLOW}[7/8] Supervisor (avto-qayta ishga tushurish) sozlanmoqda...${NC}"
cat > /etc/supervisor/conf.d/dokonpro.conf << EOF
[program:dokonpro-backend]
command=/opt/dokonpro/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
directory=/opt/dokonpro/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/dokonpro-backend.err.log
stdout_logfile=/var/log/dokonpro-backend.out.log
environment=HOME="/root"
EOF

supervisorctl reread
supervisorctl update
supervisorctl start dokonpro-backend

echo -e "${YELLOW}[8/8] SSL sertifikat o'rnatilmoqda (HTTPS)...${NC}"
if [ ! -z "$DOMAIN" ]; then
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@${DOMAIN} || echo "SSL o'rnatishda xatolik (keyinroq qo'lda qilish mumkin)"
fi

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                DokonPro ERP tayyor!                      ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  🌐 URL:    https://${DOMAIN}"
echo "║  👤 Login:  admin"
echo "║  🔑 Parol:  ${ADMIN_PASS}"
echo "║  📌 PIN:    0000"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Loglar:   tail -f /var/log/dokonpro-backend.out.log     ║"
echo "║  Restart:  supervisorctl restart dokonpro-backend        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
