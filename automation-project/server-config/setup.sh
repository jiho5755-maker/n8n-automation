#!/bin/bash
# ============================================
# Oracle Cloud ARM 인스턴스 초기 설정 스크립트
# Ubuntu 22.04 ARM64 기준
#
# 사용법: ssh로 접속 후
#   chmod +x setup.sh
#   ./setup.sh
# ============================================

set -e

echo "=========================================="
echo " Oracle Cloud ARM - n8n 서버 초기 설정"
echo "=========================================="

# 1. 시스템 업데이트
echo ""
echo "[1/7] 시스템 업데이트..."
sudo apt update && sudo apt upgrade -y

# 2. 기본 패키지 설치
echo ""
echo "[2/7] 기본 패키지 설치..."
sudo apt install -y curl wget git vim htop

# 3. Docker 설치
echo ""
echo "[3/7] Docker 설치..."
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# 4. Nginx 설치
echo ""
echo "[4/7] Nginx + Certbot 설치..."
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx

# 5. 방화벽 설정 (iptables)
echo ""
echo "[5/7] 방화벽 포트 개방 (80, 443)..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo apt install -y iptables-persistent
sudo netfilter-persistent save

# 6. Swap 설정 (안정성)
echo ""
echo "[6/7] Swap 2GB 설정..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 7. n8n 디렉토리 준비
echo ""
echo "[7/7] n8n 디렉토리 준비..."
mkdir -p ~/n8n/n8n_data ~/n8n/pg_data
sudo chown -R 1000:1000 ~/n8n/n8n_data

echo ""
echo "=========================================="
echo " 초기 설정 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "  1. 새 셸을 열거나 'newgrp docker' 실행 (Docker 그룹 반영)"
echo "  2. ~/n8n/ 디렉토리에 docker-compose.yml, .env 파일 복사"
echo "  3. 'cd ~/n8n && docker compose up -d' 로 n8n 실행"
echo "  4. Nginx 설정 후 'sudo certbot --nginx -d n8n.도메인.com' 실행"
echo ""
