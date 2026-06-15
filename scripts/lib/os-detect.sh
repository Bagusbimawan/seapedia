#!/usr/bin/env bash
# Deteksi OS untuk script deploy (Amazon Linux / Ubuntu)
detect_os() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck source=/dev/null
    . /etc/os-release
    echo "${ID:-unknown}"
  else
    echo "unknown"
  fi
}

detect_os_family() {
  local id
  id="$(detect_os)"
  case "$id" in
    amzn|amazon) echo "amazon" ;;
    ubuntu|debian) echo "debian" ;;
    *) echo "unknown" ;;
  esac
}

default_app_user() {
  local family
  family="$(detect_os_family)"
  if [[ "$family" == "amazon" ]]; then
    echo "ec2-user"
  else
    echo "${SUDO_USER:-ubuntu}"
  fi
}

install_nginx() {
  local family
  family="$(detect_os_family)"
  if command -v nginx >/dev/null 2>&1; then
    return 0
  fi
  case "$family" in
    amazon)
      if command -v dnf >/dev/null 2>&1; then
        dnf install -y nginx
      else
        yum install -y nginx
      fi
      ;;
    debian)
      apt-get update -qq
      apt-get install -y nginx
      ;;
    *)
      echo "ERROR: OS tidak dikenali. Install nginx manual lalu jalankan ulang."
      exit 1
      ;;
  esac
}

nginx_site_dir() {
  # Amazon Linux pakai conf.d; Ubuntu bisa keduanya — conf.d paling portable
  echo "/etc/nginx/conf.d"
}

install_nginx_site() {
  local name="$1"
  local src="$2"
  local dir
  dir="$(nginx_site_dir)"
  cp "$src" "$dir/${name}.conf"
}

post_nginx_setup() {
  local family
  family="$(detect_os_family)"
  if [[ "$family" == "amazon" ]]; then
    # Izinkan nginx proxy ke localhost:3000 / :8080 (SELinux)
    if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce)" != "Disabled" ]]; then
      setsebool -P httpd_can_network_connect 1 2>/dev/null || true
    fi
    # Buka port HTTP/HTTPS di firewalld (jika aktif)
    if systemctl is-active --quiet firewalld 2>/dev/null; then
      firewall-cmd --permanent --add-service=http 2>/dev/null || true
      firewall-cmd --permanent --add-service=https 2>/dev/null || true
      firewall-cmd --reload 2>/dev/null || true
    fi
    systemctl enable nginx
    systemctl start nginx
  fi
}

certbot_instructions() {
  local family
  family="$(detect_os_family)"
  case "$family" in
    amazon)
      echo "     sudo dnf install -y certbot python3-certbot-nginx"
      ;;
    debian)
      echo "     sudo apt install -y certbot python3-certbot-nginx"
      ;;
    *)
      echo "     Install certbot + plugin nginx untuk OS Anda"
      ;;
  esac
}
