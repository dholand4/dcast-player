#!/bin/bash
# Roda na VM (como root) sempre que chega uma versão nova do branch web-dist.
# Quem chama é o /usr/local/bin/dcast-deploy, criado pelo deploy/cloud-init.sh.
set -euo pipefail

APP=/opt/dcast/app
STATE=/opt/dcast
# shellcheck disable=SC1091
source /etc/dcast/env

# Caddy: valida antes de trocar, para um erro no Caddyfile não derrubar o site
sed "s/__DCAST_DOMAIN__/${DCAST_DOMAIN}/g" "$APP/deploy/Caddyfile" > /etc/caddy/Caddyfile.new
caddy validate --config /etc/caddy/Caddyfile.new --adapter caddyfile
mv /etc/caddy/Caddyfile.new /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy

# Proxy: só reinicia quando o código dele muda, para não derrubar quem está assistindo
install -m 644 "$APP/deploy/dcast-proxy.service" /etc/systemd/system/dcast-proxy.service
systemctl daemon-reload
systemctl enable dcast-proxy >/dev/null
PROXY_SUM=$(cat "$APP/server.js" "$APP/api/proxy.js" "$APP/deploy/dcast-proxy.service" | sha256sum)
if [ "$PROXY_SUM" != "$(cat "$STATE/.proxy-sum" 2>/dev/null)" ] || ! systemctl is-active --quiet dcast-proxy; then
  systemctl restart dcast-proxy
  echo "$PROXY_SUM" > "$STATE/.proxy-sum"
fi

echo "[dcast] versão instalada em https://${DCAST_DOMAIN}"
