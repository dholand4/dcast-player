#!/bin/bash
# Prepara a VM do DCast Player na Oracle Cloud (Ubuntu 24.04).
# Cole este arquivo em "Advanced options > Management > cloud-init script" ao criar a instância.
# Ele roda uma vez, no primeiro boot. Depois disso a VM se atualiza sozinha a partir do
# branch web-dist, que o GitHub Actions gera a cada push na main com os testes passando.
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive

# Swap: a VM.Standard.E2.1.Micro tem só 1 GB de RAM
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# A imagem Ubuntu da Oracle traz um iptables que só libera a porta 22
for port in 443 80; do
  if ! iptables -C INPUT -p tcp -m state --state NEW --dport "$port" -j ACCEPT 2>/dev/null; then
    reject_line=$(iptables -L INPUT --line-numbers | awk '$2 == "REJECT" { print $1; exit }')
    if [ -n "$reject_line" ]; then
      iptables -I INPUT "$reject_line" -p tcp -m state --state NEW --dport "$port" -j ACCEPT
    else
      iptables -A INPUT -p tcp -m state --state NEW --dport "$port" -j ACCEPT
    fi
  fi
done
netfilter-persistent save || true

# Node 22, git e Caddy
apt-get update
apt-get install -y ca-certificates curl gnupg git debian-keyring debian-archive-keyring apt-transport-https
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt -o /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# Usuário sem privilégios que roda o proxy
id dcast >/dev/null 2>&1 || useradd --system --home /opt/dcast --shell /usr/sbin/nologin dcast
mkdir -p /opt/dcast /etc/dcast

# Domínio gratuito do sslip.io apontando para o IP público da VM.
# Com domínio próprio, troque os dois valores em /etc/dcast/env.
if [ ! -f /etc/dcast/env ]; then
  public_ip=$(curl -fsS https://api.ipify.org)
  domain="${public_ip//./-}.sslip.io"
  printf 'DCAST_DOMAIN=%s\nPROXY_ALLOWED_ORIGINS=https://%s\n' "$domain" "$domain" > /etc/dcast/env
fi

# Busca a versão mais nova do branch web-dist e instala quando ela muda
cat > /usr/local/bin/dcast-deploy <<'SCRIPT'
#!/bin/bash
set -euo pipefail
APP=/opt/dcast/app
REPO=https://github.com/dholand4/dcast-player.git
BRANCH=web-dist

if [ ! -d "$APP/.git" ]; then
  rm -rf "$APP"
  if ! git clone --quiet --depth 1 --branch "$BRANCH" "$REPO" "$APP"; then
    echo "[dcast] branch $BRANCH ainda não existe; tento de novo no próximo ciclo"
    exit 0
  fi
fi

git -C "$APP" fetch --quiet --depth 1 origin "$BRANCH"
git -C "$APP" reset --quiet --hard FETCH_HEAD
git -C "$APP" clean -fdq
revision=$(git -C "$APP" rev-parse HEAD)
if [ "$revision" != "$(cat /opt/dcast/.deployed 2>/dev/null)" ]; then
  bash "$APP/deploy/install.sh"
  echo "$revision" > /opt/dcast/.deployed
fi
SCRIPT
chmod 755 /usr/local/bin/dcast-deploy

cat > /etc/systemd/system/dcast-deploy.service <<'UNIT'
[Unit]
Description=DCast Player - instala a versão mais nova do branch web-dist
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/dcast-deploy
UNIT

cat > /etc/systemd/system/dcast-deploy.timer <<'UNIT'
[Unit]
Description=DCast Player - procura versão nova a cada 3 minutos

[Timer]
OnBootSec=1min
OnUnitActiveSec=3min

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now dcast-deploy.timer
/usr/local/bin/dcast-deploy || true
