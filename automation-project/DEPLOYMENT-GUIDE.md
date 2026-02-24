# Oracle Cloud + n8n 배포 초상세 가이드

> 이 가이드는 **서버를 처음 다뤄보는 분**을 위해 작성되었습니다.
> 모든 단계에 복사 가능한 명령어와 성공 확인 방법이 포함되어 있습니다.
> macOS 터미널 기준으로 설명합니다.

---

## 목차

1. [사전 준비물 체크리스트](#1-사전-준비물-체크리스트)
2. [Oracle Cloud 계정 생성](#2-oracle-cloud-계정-생성)
3. [ARM 인스턴스 생성](#3-arm-인스턴스-생성)
4. [OCI 네트워크 보안 설정](#4-oci-네트워크-보안-설정)
5. [SSH 접속하기](#5-ssh-접속하기)
6. [서버 초기 설정](#6-서버-초기-설정)
7. [도메인 DNS 설정](#7-도메인-dns-설정)
8. [n8n 배포](#8-n8n-배포)
9. [HTTPS 설정](#9-https-설정)
10. [n8n 초기 설정 및 확인](#10-n8n-초기-설정-및-확인)
11. [트러블슈팅](#11-트러블슈팅)
12. [유지보수](#12-유지보수)

---

## 1. 사전 준비물 체크리스트

시작하기 전에 아래 항목이 준비되었는지 확인하세요.

| 항목 | 설명 | 확인 |
|------|------|------|
| **이메일 계정** | Oracle Cloud 가입용 (Gmail 등) | [ ] |
| **신용카드 또는 체크카드** | 본인 인증용 (과금되지 않음, 1달러 임시 결제 후 취소됨) | [ ] |
| **도메인** | n8n 접속용 (예: `n8n.내도메인.com`). 안 쓰는 도메인 1개 보유 중 | [ ] |
| **Mac 터미널** | Spotlight(Cmd+Space)에서 "터미널" 검색하면 열림 | [ ] |
| **텔레그램 봇 토큰** | 이미 생성 완료 (@Pressco21_bot) | [x] |
| **Notion API 토큰** | 이미 생성 완료 (4개 DB 연결됨) | [x] |

> **참고**: 이 가이드의 예시 도메인은 `n8n.yourdomain.com`입니다. 실제 작업 시 본인 도메인으로 바꿔주세요.

---

## 2. Oracle Cloud 계정 생성

Oracle Cloud는 ARM 서버를 **영구 무료**로 제공합니다 (Always Free Tier).
이미 계정이 있다면 [3장](#3-arm-인스턴스-생성)으로 건너뛰세요.

### 2-1. 가입 페이지 접속

1. 브라우저에서 https://signup.oraclecloud.com/ 접속
2. **Country/Territory**: `Korea, Republic of` 선택
3. **Name**: 영문 이름 입력 (여권 기준)
4. **Email**: 본인 이메일 입력
5. **I'm human** 체크 → **Verify my email** 클릭

### 2-2. 이메일 인증

1. 입력한 이메일 받은편지함 확인
2. Oracle에서 온 메일의 **Verify Email** 버튼 클릭
3. 브라우저에서 가입 페이지가 다시 열림

### 2-3. 계정 정보 입력

1. **Password**: 비밀번호 설정 (대문자+소문자+숫자+특수문자, 12자 이상)
2. **Cloud Account Name**: 영문으로 입력 (예: `jiho`) — 이것이 테넌시 이름
3. **Home Region**: **South Korea North (Seoul) — `ap-seoul-1`** 선택
   - 또는 **South Korea Central (Chuncheon) — `ap-chuncheon-1`** (서울이 안 보이면)

> **주의**: 홈 리전은 **가입 후 변경 불가**입니다. 서울 리전을 권장합니다.

### 2-4. 주소 및 전화번호

1. **Address**: 영문 주소 입력 (대략적으로 입력해도 됨)
2. **City**: `Seoul` 등
3. **Phone Number**: `+82` 선택 후 휴대폰 번호 (`010XXXXXXXX`)
4. SMS 인증번호 입력

### 2-5. 신용카드 등록

1. **Add Payment Verification Method** 클릭
2. 카드 정보 입력 (카드 번호, 만료일, CVV)
3. **1달러(또는 100원)가 임시 결제**된 후 자동 취소됩니다

> **과금 걱정 없음**: Free Tier 계정은 "Always Free" 리소스만 사용하면 절대 과금되지 않습니다.
> "Upgrade to Paid" 버튼을 누르지 않는 한 무료입니다.

### 2-6. 가입 완료

1. **Start my free trial** 클릭
2. 계정 프로비저닝에 **5~30분** 소요
3. 이메일로 "Your Oracle Cloud account is fully provisioned" 메일이 오면 완료
4. https://cloud.oracle.com 에서 **Cloud Account Name**(테넌시)과 비밀번호로 로그인

**성공 확인**: 로그인 후 OCI 대시보드가 보이면 성공

---

## 3. ARM 인스턴스 생성

"인스턴스"는 클라우드에서 빌린 가상 서버(컴퓨터) 한 대를 의미합니다.

### 3-1. 인스턴스 생성 페이지 이동

1. https://cloud.oracle.com 로그인
2. 왼쪽 상단 햄버거 메뉴(≡) 클릭
3. **Compute** → **Instances** 클릭
4. 파란색 **Create Instance** 버튼 클릭

### 3-2. 기본 정보

1. **Name**: `n8n-server` (원하는 이름)
2. **Compartment**: 기본값 유지 (root)

### 3-3. 이미지 선택

1. **Image and shape** 섹션에서 **Edit** 클릭
2. **Image** 탭:
   - **Change Image** 클릭
   - **Ubuntu** 선택
   - **Ubuntu 22.04 (aarch64)** 선택 — ⚠️ 반드시 **aarch64**(ARM) 버전!
   - **Select Image** 클릭

### 3-4. Shape 선택 (서버 사양)

1. **Shape** 탭:
   - **Change Shape** 클릭
   - Shape series: **Ampere** (ARM 기반) 선택
   - Shape name: **VM.Standard.A1.Flex** 선택
   - **Number of OCPUs**: `2` (최대 4까지 무료, 2면 충분)
   - **Amount of memory (GB)**: `12` (최대 24까지 무료, 12면 충분)
   - **Select Shape** 클릭

### 3-5. 네트워크 설정

1. **Networking** 섹션: 기본값 유지
   - VCN이 자동 생성됨
   - **Assign a public IPv4 address**: 반드시 **체크** 확인 (기본값)

### 3-6. SSH 키 생성

SSH 키는 서버에 접속할 때 비밀번호 대신 사용하는 열쇠입니다.

1. **Add SSH keys** 섹션:
   - **Generate a key pair** 선택
   - **Save Private Key** 클릭 → `ssh-key-20XX-XX-XX.key` 파일 다운로드
   - **Save Public Key** 도 클릭 → 백업용으로 보관

> **주의**: Private Key 파일은 **다시 다운로드 불가**합니다. 반드시 안전한 곳에 보관하세요!

2. 다운로드된 키 파일을 안전한 위치로 이동:

```bash
# Mac 터미널에서 실행
mkdir -p ~/.ssh
mv ~/Downloads/ssh-key-*.key ~/.ssh/oracle-n8n.key
chmod 400 ~/.ssh/oracle-n8n.key
```

- `mkdir -p ~/.ssh` → SSH 키를 보관하는 폴더 생성 (이미 있으면 무시됨)
- `mv` → 다운로드 폴더에서 .ssh 폴더로 키 파일 이동
- `chmod 400` → 키 파일의 권한을 "나만 읽기"로 설정 (SSH 보안 요구사항)

### 3-7. 인스턴스 생성

1. **Create** 버튼 클릭
2. 상태가 **PROVISIONING** → **RUNNING**으로 바뀔 때까지 대기 (1~5분)
3. **RUNNING** 상태가 되면 **Public IP address**를 메모

```
예시: 152.70.xxx.xxx  ← 이 IP를 메모해 두세요!
```

### "Out of Host Capacity" 오류 대처법

이 오류는 해당 리전에 남은 서버가 없다는 뜻입니다. Free Tier라서 자주 발생합니다.

**해결 방법 (순서대로 시도)**:

1. **시간대 변경**: 한국 시간 새벽 2~6시(미국 업무시간)에 재시도
2. **Availability Domain 변경**: 인스턴스 생성 화면에서 AD-1, AD-2, AD-3 중 다른 것 선택
3. **리전 변경**: 서울이 안 되면 춘천(`ap-chuncheon-1`), 또는 도쿄(`ap-tokyo-1`)
   - 도쿄 리전은 홈 리전이 아니므로 "Always Free" 표시가 있는지 확인
4. **수일간 반복**: 보통 1~3일 내에 성공합니다
5. **최후 수단**: Contabo VPS 도쿄 리전 ($4.95/월) — 확실하지만 유료

> **팁**: 오라클 공식 문서에서도 "시간을 두고 재시도"를 권장합니다.

**성공 확인**: Instance 상태가 **RUNNING**이고, Public IP가 표시되면 성공

---

## 4. OCI 네트워크 보안 설정

기본적으로 Oracle Cloud는 SSH(22번 포트)만 열려 있습니다.
웹 접속을 위해 80번(HTTP)과 443번(HTTPS) 포트를 열어야 합니다.

### 4-1. VCN 페이지로 이동

1. OCI 콘솔 왼쪽 상단 햄버거 메뉴(≡) 클릭
2. **Networking** → **Virtual Cloud Networks** 클릭
3. 생성된 VCN 이름 클릭 (예: `vcn-20240101-xxxx`)

### 4-2. Subnet 진입

1. **Subnets** 목록에서 **Public Subnet** 클릭 (public이 붙은 것)

### 4-3. Security List 수정

1. **Security Lists** 목록에서 **Default Security List** 클릭
2. **Add Ingress Rules** 버튼 클릭

### 4-4. HTTP 포트 (80) 추가

다음 값을 입력:

| 필드 | 값 |
|------|-----|
| Stateless | 체크 해제 (기본값) |
| Source Type | CIDR |
| Source CIDR | `0.0.0.0/0` |
| IP Protocol | TCP |
| Source Port Range | (비워둠) |
| Destination Port Range | `80` |
| Description | `HTTP` |

**Add Ingress Rules** 클릭

### 4-5. HTTPS 포트 (443) 추가

같은 방법으로 한 번 더:

1. **Add Ingress Rules** 버튼 클릭
2. 위와 동일하되 **Destination Port Range**를 `443`으로, Description을 `HTTPS`로 변경
3. **Add Ingress Rules** 클릭

**성공 확인**: Ingress Rules 목록에 22(SSH), 80(HTTP), 443(HTTPS)가 모두 보이면 성공

---

## 5. SSH 접속하기

SSH는 내 Mac에서 원격 서버(인스턴스)에 접속하는 방법입니다.

### 5-1. 터미널 열기

- **Spotlight** (Cmd + Space) → "터미널" 입력 → Enter

### 5-2. SSH 접속

```bash
ssh -i ~/.ssh/oracle-n8n.key ubuntu@<공인IP>
```

`<공인IP>` 부분을 [3장](#3-7-인스턴스-생성)에서 메모한 IP로 교체합니다.

```bash
# 예시
ssh -i ~/.ssh/oracle-n8n.key ubuntu@152.70.xxx.xxx
```

### 5-3. 처음 접속 시 확인 질문

```
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

`yes` 입력 후 Enter

### 5-4. 접속 성공 화면

아래와 비슷한 화면이 보이면 성공입니다:

```
Welcome to Ubuntu 22.04.x LTS (GNU/Linux 5.15.0-xxxx-oracle aarch64)
...
ubuntu@n8n-server:~$
```

> **주의: Permission denied 오류가 나는 경우**
> ```
> WARNING: UNPROTECTED PRIVATE KEY FILE!
> ```
> → 키 파일 권한이 잘못된 것입니다. 아래 명령어를 Mac 터미널에서 실행:
> ```bash
> chmod 400 ~/.ssh/oracle-n8n.key
> ```
> 그 다음 SSH 접속을 다시 시도하세요.

### 5-5. 접속 종료

서버에서 나가려면:

```bash
exit
```

**성공 확인**: `ubuntu@n8n-server:~$` 프롬프트가 보이면 성공

---

## 6. 서버 초기 설정

이 단계에서는 미리 준비된 `setup.sh` 스크립트를 서버에 올려서 실행합니다.
이 스크립트가 Docker, Nginx, 방화벽, Swap 메모리 등을 한 번에 설치합니다.

### 6-1. 파일 업로드 (Mac 터미널에서)

> **중요**: 이 명령어는 **Mac 터미널**(서버가 아닌 내 컴퓨터)에서 실행합니다.
> 서버에 접속 중이라면 먼저 `exit`로 빠져나오세요.

```bash
# server-config 폴더 전체를 서버로 업로드
scp -i ~/.ssh/oracle-n8n.key -r \
  ~/Desktop/n8n-main/automation-project/server-config \
  ubuntu@<공인IP>:~/
```

- `scp` → Secure Copy, 파일을 안전하게 전송하는 명령어
- `-r` → 폴더 전체를 재귀적으로 복사
- `ubuntu@<공인IP>:~/` → 서버의 홈 디렉토리(`/home/ubuntu/`)에 복사

### 6-2. 워크플로우 파일도 업로드

```bash
scp -i ~/.ssh/oracle-n8n.key -r \
  ~/Desktop/n8n-main/automation-project/workflows \
  ubuntu@<공인IP>:~/
```

### 6-3. 서버에 접속

```bash
ssh -i ~/.ssh/oracle-n8n.key ubuntu@<공인IP>
```

### 6-4. 업로드 확인

```bash
ls ~/server-config/
```

아래 파일들이 보여야 합니다:

```
docker-compose.yml  .env.example  nginx-n8n.conf  setup.sh
```

### 6-5. setup.sh 실행

```bash
chmod +x ~/server-config/setup.sh
~/server-config/setup.sh
```

- `chmod +x` → 스크립트에 "실행 가능" 권한 부여
- 설치 시간: **5~15분** 소요 (시스템 업데이트 포함)

스크립트가 하는 일:
1. 시스템 패키지 업데이트
2. curl, wget, git, vim, htop 설치
3. Docker + Docker Compose 설치
4. Nginx + Certbot 설치
5. 방화벽에서 포트 80/443 개방 (iptables)
6. **Swap 메모리 4GB** 설정 (메모리 부족 방지)
7. n8n 디렉토리 준비 (`~/n8n/n8n_data`, `~/n8n/pg_data`)

> iptables-persistent 설치 중 "Save current IPv4 rules?" 질문이 나오면 **Yes** 선택
> (Tab으로 이동, Enter로 확인)

### 6-6. Docker 그룹 반영

setup.sh가 끝나면 Docker 권한을 적용합니다:

```bash
newgrp docker
```

또는 SSH를 한번 끊었다가 다시 접속해도 됩니다.

### 6-7. 설치 확인

```bash
# Docker 확인
docker --version
# 예상 출력: Docker version 24.x.x, build xxxxxxx

# Docker Compose 확인
docker compose version
# 예상 출력: Docker Compose version v2.x.x

# Nginx 확인
sudo systemctl status nginx
# "active (running)" 표시 확인

# Swap 확인
free -h
# Swap 행에 4.0G 표시 확인
```

**성공 확인**: Docker, Nginx가 정상 동작하고 Swap 4GB가 설정되어 있으면 성공

---

## 7. 도메인 DNS 설정

n8n에 HTTPS로 접속하려면 도메인이 필요합니다.
도메인의 DNS에 서버 IP를 연결하는 작업입니다.

### 7-1. 도메인 관리 페이지 접속

도메인을 구매한 서비스(가비아, 카페24, Cloudflare 등)의 관리 페이지에 로그인합니다.

### 7-2. A 레코드 추가

DNS 설정(또는 네임서버/레코드 관리) 페이지에서:

| 필드 | 값 |
|------|-----|
| 타입(Type) | `A` |
| 호스트(Host) | `n8n` (서브도메인) |
| 값(Value/Points to) | `<공인IP>` (인스턴스 Public IP) |
| TTL | `600` 또는 기본값 |

저장 클릭

> **설명**: 이렇게 하면 `n8n.yourdomain.com` → `<공인IP>`로 연결됩니다.
> 서브도메인 대신 루트 도메인을 쓰고 싶다면 Host를 `@`로 입력합니다.

### 7-3. DNS 전파 확인

DNS 변경 후 전파에 **수 분 ~ 수 시간**이 걸릴 수 있습니다.

```bash
# Mac 터미널에서 실행
nslookup n8n.yourdomain.com
```

**성공 확인**: 출력에 본인의 공인 IP가 표시되면 성공

```
Name:    n8n.yourdomain.com
Address: 152.70.xxx.xxx   ← 인스턴스 IP와 일치하면 OK
```

> **팁**: 전파가 안 됐으면 5분 후 다시 시도하세요. 최대 24시간 걸릴 수 있지만 보통 10분 이내입니다.

---

## 8. n8n 배포

이 단계에서 n8n과 PostgreSQL 데이터베이스를 Docker로 실행합니다.

### 8-1. 서버에 접속

```bash
ssh -i ~/.ssh/oracle-n8n.key ubuntu@<공인IP>
```

### 8-2. Docker Compose 파일 배치

```bash
cp ~/server-config/docker-compose.yml ~/n8n/
```

### 8-3. 환경변수(.env) 파일 생성

먼저 비밀번호와 암호화 키를 생성합니다:

```bash
# PostgreSQL 비밀번호 생성 (24자 랜덤 문자열)
echo "DB 비밀번호: $(head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 24)"

# n8n 암호화 키 생성 (32자 랜덤 문자열)
echo "암호화 키: $(head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 32)"
```

출력된 두 값을 메모한 후, `.env` 파일을 생성합니다:

```bash
cp ~/server-config/.env.example ~/n8n/.env
nano ~/n8n/.env
```

`nano` 에디터가 열리면 아래 3개 값을 수정합니다:

```env
# 도메인 (본인 도메인으로 변경)
DOMAIN_NAME=n8n.yourdomain.com

# PostgreSQL 비밀번호 (위에서 생성한 값 붙여넣기)
POSTGRES_PASSWORD=여기에_위에서_생성한_DB비밀번호_붙여넣기

# n8n 암호화 키 (위에서 생성한 값 붙여넣기)
N8N_ENCRYPTION_KEY=여기에_위에서_생성한_암호화키_붙여넣기
```

> **nano 에디터 사용법**:
> - 화살표 키로 이동
> - 기존 텍스트 지우기: Backspace 또는 Delete
> - 저장: **Ctrl + O** → Enter
> - 종료: **Ctrl + X**

> **주의**: `N8N_ENCRYPTION_KEY`는 n8n이 Credential(API 키 등)을 암호화하는 데 사용합니다.
> 한번 설정하면 **절대 변경하지 마세요**. 변경하면 저장된 모든 Credential이 복호화 불가능해집니다.

### 8-4. 설정 파일 확인

```bash
cat ~/n8n/.env
```

- `DOMAIN_NAME`이 본인 도메인인지 확인
- `POSTGRES_PASSWORD`와 `N8N_ENCRYPTION_KEY`가 제대로 입력되었는지 확인

### 8-5. n8n 실행

```bash
cd ~/n8n
docker compose up -d
```

- `up` → 컨테이너 시작
- `-d` → 백그라운드에서 실행 (detached)

첫 실행 시 Docker 이미지 다운로드에 **3~10분** 소요됩니다.

### 8-6. 실행 상태 확인

```bash
docker compose ps
```

예상 출력:

```
NAME           IMAGE                  STATUS                   PORTS
n8n            n8nio/n8n:latest       Up X minutes             127.0.0.1:5678->5678/tcp
n8n-postgres   postgres:15            Up X minutes (healthy)   5432/tcp
```

두 컨테이너 모두 **Up** 상태이고, postgres는 **(healthy)** 표시가 있어야 합니다.

### 8-7. n8n 로그 확인

```bash
docker compose logs -f n8n
```

아래와 비슷한 로그가 나오면 정상입니다:

```
n8n  | n8n ready on 0.0.0.0, port 5678
```

> 로그 보기 종료: **Ctrl + C**

**성공 확인**: `docker compose ps`에서 두 컨테이너 모두 Up이고, 로그에 에러가 없으면 성공

---

## 9. HTTPS 설정

n8n이 127.0.0.1:5678에서 동작하고 있으므로, Nginx가 도메인으로 들어오는 요청을 n8n에 전달하고, Certbot이 SSL 인증서를 발급합니다.

### 9-1. 기본 Nginx 설정 제거

Ubuntu의 기본 Nginx "Welcome" 페이지를 비활성화합니다:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

### 9-2. n8n용 Nginx 설정 배치

```bash
sudo cp ~/server-config/nginx-n8n.conf /etc/nginx/sites-available/n8n
```

### 9-3. 도메인 이름 수정

설정 파일에서 도메인을 본인 것으로 변경합니다:

```bash
sudo nano /etc/nginx/sites-available/n8n
```

`server_name` 줄을 찾아서 본인 도메인으로 변경:

```nginx
server_name n8n.yourdomain.com;  # ← 본인 도메인으로 변경
```

저장(Ctrl+O → Enter)하고 종료(Ctrl+X)합니다.

### 9-4. 설정 활성화

```bash
# 심볼릭 링크로 설정 활성화
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/

# 설정 문법 검증
sudo nginx -t
```

`syntax is ok`, `test is successful` 메시지가 나와야 합니다.

```bash
# Nginx 재시작
sudo systemctl reload nginx
```

### 9-5. HTTP 접속 테스트

브라우저에서 `http://n8n.yourdomain.com` 접속합니다.

n8n 화면이 보이면 HTTP 연결은 성공입니다.
(아직 HTTPS가 아니므로 브라우저에서 "안전하지 않음" 경고가 나올 수 있습니다)

### 9-6. SSL 인증서 발급 (Certbot)

```bash
sudo certbot --nginx -d n8n.yourdomain.com
```

1. **이메일 입력**: SSL 인증서 만료 알림을 받을 이메일
2. **약관 동의**: `Y` 입력
3. **이메일 공유**: `N` 입력 (선택사항)

Certbot이 자동으로:
- SSL 인증서를 발급하고
- Nginx 설정을 HTTPS용으로 수정하고
- HTTP → HTTPS 리다이렉트를 설정합니다

> **SSL 자동 갱신**: Certbot은 자동 갱신 타이머를 설치합니다. 인증서가 만료되기 전에 자동으로 갱신됩니다.
> 확인: `sudo systemctl status certbot.timer`

### 9-7. HTTPS 접속 확인

브라우저에서 `https://n8n.yourdomain.com` 접속합니다.

주소창에 자물쇠 아이콘이 보이면 HTTPS 설정 완료!

**성공 확인**: `https://n8n.yourdomain.com`에서 n8n 설정 화면이 보이면 성공

---

## 10. n8n 초기 설정 및 확인

### 10-1. 관리자 계정 생성

1. `https://n8n.yourdomain.com` 접속
2. **Set up owner account** 화면이 나타남:
   - **Email**: 본인 이메일
   - **First Name**: 이름
   - **Last Name**: 성
   - **Password**: 강력한 비밀번호 설정
3. **Next** 클릭

### 10-2. 초기 설정 마무리

1. 설문 페이지가 나오면 적절히 응답 (또는 Skip)
2. n8n 에디터 화면이 나타나면 성공!

### 10-3. 타임존 확인

1. 좌측 하단 **⚙ Settings** (또는 좌측 메뉴) 클릭
2. **General** → **Timezone**: `Asia/Seoul` 확인
   - docker-compose.yml에서 이미 설정했으므로 자동 적용되어 있을 것입니다

### 10-4. 워크플로우 Import

미리 만들어둔 3개 워크플로우를 n8n에 불러옵니다.

1. n8n 에디터에서 좌측 **Workflows** 클릭
2. 우측 상단 **⋮** (점 세 개) 또는 **Import from File** 클릭
3. 아래 3개 파일을 하나씩 Import:

서버에 업로드해둔 워크플로우 파일 경로:
- `~/workflows/telegram-todo-bot.json` — 텔레그램 봇 (할 일 등록)
- `~/workflows/morning-briefing.json` — 모닝 브리핑 (매일 08:00)
- `~/workflows/overdue-alert.json` — 밀린 업무 알림 (매일 10:00)

> **n8n에서 Import하는 방법**:
> 1. 워크플로우 목록에서 우측 상단의 **⋮** 메뉴 → **Import from URL** 또는 **Import from File**
> 2. 또는 워크플로우 에디터 화면에서 **⋮** → **Import from File**
>
> 서버의 파일을 직접 Import하려면, Mac에서 해당 JSON 파일을 열어서 내용을 복사한 뒤
> n8n 에디터에 붙여넣기(Ctrl+V)하는 방법이 가장 간단합니다.

### 10-5. Credential 등록

Import한 워크플로우가 동작하려면 API 키(Credential)를 등록해야 합니다.

1. **좌측 메뉴** → **Credentials** 클릭
2. **Add Credential** 클릭

**텔레그램 봇**:
- Type: `Telegram`
- Access Token: 텔레그램 봇 토큰 입력
- **Save** 클릭

**Notion API**:
- Type: `Notion API`
- API Key: Notion Integration Secret 입력
- **Save** 클릭

3. 각 워크플로우를 열어서 노드의 Credential을 방금 등록한 것으로 연결

### 10-6. 워크플로우 활성화

각 워크플로우를 열고 우측 상단의 **Active** 토글을 켭니다.

### 10-7. 동작 테스트

1. 텔레그램에서 봇(@Pressco21_bot)에게 메시지 전송: `홈페이지 리뉴얼 메인 배너 수정`
2. n8n 워크플로우 실행 이력에서 성공 확인
3. 노션 할 일 DB에 항목이 생성되었는지 확인

**성공 확인**: 텔레그램 메시지가 노션 DB에 등록되면 모든 배포가 완료된 것입니다!

---

## 11. 트러블슈팅

### Docker 관련

**문제: `permission denied while trying to connect to the Docker daemon`**

```bash
# Docker 그룹에 현재 사용자 추가 (setup.sh에서 이미 했지만 적용 안 된 경우)
sudo usermod -aG docker $USER
newgrp docker
# 또는 SSH를 끊었다가 다시 접속
```

**문제: `docker compose` 명령어가 안 됨**

```bash
# docker-compose (하이픈) 대신 docker compose (띄어쓰기) 사용
# Ubuntu 22.04에서는 docker compose (V2)가 표준
docker compose version
```

**문제: n8n 컨테이너가 계속 재시작됨**

```bash
# 로그 확인
cd ~/n8n
docker compose logs --tail=50 n8n

# 자주 나오는 원인:
# 1. .env 파일의 값이 비어 있음 → 값 채우기
# 2. PostgreSQL이 아직 안 됨 → postgres 로그도 확인
docker compose logs --tail=50 postgres
```

### Nginx / SSL 관련

**문제: `nginx -t`에서 문법 오류**

```bash
# 에러 메시지를 확인하고 해당 줄 수정
sudo nano /etc/nginx/sites-available/n8n
# 수정 후 다시 테스트
sudo nginx -t
```

**문제: Certbot 인증서 발급 실패**

```bash
# DNS가 아직 전파되지 않았을 가능성이 큼
nslookup n8n.yourdomain.com

# 80번 포트가 외부에서 접근 가능한지 확인
# Mac 터미널에서:
curl -I http://n8n.yourdomain.com
# "200 OK" 또는 n8n 관련 응답이 와야 함

# 그래도 안 되면 OCI Security List에서 80/443 포트 확인 (4장 참고)
```

**문제: HTTPS 접속 시 "502 Bad Gateway"**

```bash
# n8n 컨테이너가 실행 중인지 확인
cd ~/n8n
docker compose ps

# n8n이 꺼져 있으면 재시작
docker compose up -d

# 5678 포트가 리스닝 중인지 확인
sudo ss -tlnp | grep 5678
```

### SSH 관련

**문제: `Connection timed out`**

- Oracle Cloud 인스턴스가 RUNNING 상태인지 확인
- Security List에서 SSH(22) 포트가 열려 있는지 확인
- 공인 IP가 올바른지 확인

**문제: `Host key verification failed`**

```bash
# 서버 IP가 바뀌었거나 인스턴스를 재생성한 경우
ssh-keygen -R <공인IP>
# 그 다음 다시 SSH 접속
```

### n8n 관련

**문제: n8n 에디터가 느리거나 멈춤**

```bash
# 메모리 사용량 확인
free -h
# Swap이 많이 사용되고 있으면 메모리 부족
# → n8n 재시작으로 임시 해결
cd ~/n8n
docker compose restart n8n
```

**문제: 워크플로우 Import 후 노드에 에러 표시**

- Credential이 연결되지 않은 노드입니다
- 각 노드를 클릭 → Credential 드롭다운에서 등록한 Credential 선택 → Save

---

## 12. 유지보수

### n8n 업데이트

새 버전이 나오면 아래 명령어로 업데이트합니다:

```bash
cd ~/n8n

# 최신 이미지 다운로드
docker compose pull

# 컨테이너 재생성 (데이터는 유지됨)
docker compose up -d

# 이전 이미지 정리 (디스크 절약)
docker image prune -f
```

> **주의**: 업데이트 전에 반드시 백업을 먼저 하세요 (아래 참고).

### 백업

n8n 데이터를 정기적으로 백업합니다:

```bash
# 백업 디렉토리 생성
mkdir -p ~/backups

# n8n 데이터 + PostgreSQL 데이터 백업 (날짜 포함)
cd ~/n8n
tar czf ~/backups/n8n-backup-$(date +%Y%m%d).tar.gz n8n_data pg_data .env

# 백업 파일 확인
ls -lh ~/backups/
```

> **팁**: Mac으로 백업 파일 다운로드:
> ```bash
> # Mac 터미널에서 실행
> scp -i ~/.ssh/oracle-n8n.key ubuntu@<공인IP>:~/backups/n8n-backup-*.tar.gz ~/Desktop/
> ```

### 자동 백업 설정 (선택사항)

매일 새벽 3시에 자동 백업하도록 cron을 설정합니다:

```bash
# cron 편집기 열기
crontab -e
```

맨 아래에 다음 줄 추가:

```
0 3 * * * cd /home/ubuntu/n8n && tar czf /home/ubuntu/backups/n8n-backup-$(date +\%Y\%m\%d).tar.gz n8n_data pg_data .env
```

저장하고 종료합니다.

> **오래된 백업 정리** (30일 이상):
> ```bash
> find ~/backups -name "n8n-backup-*.tar.gz" -mtime +30 -delete
> ```

### 서버 모니터링

```bash
# 디스크 사용량 확인
df -h

# 메모리 사용량 확인
free -h

# Docker 컨테이너 상태 확인
docker compose -f ~/n8n/docker-compose.yml ps

# n8n 로그 확인 (최근 50줄)
docker compose -f ~/n8n/docker-compose.yml logs --tail=50 n8n
```

### SSL 인증서 갱신 확인

Certbot이 자동 갱신을 처리하지만, 수동 확인도 가능합니다:

```bash
# 인증서 만료일 확인
sudo certbot certificates

# 갱신 시뮬레이션 (실제 갱신은 안 함)
sudo certbot renew --dry-run
```

### 서버 재부팅 시 자동 시작

setup.sh에서 Docker와 Nginx를 `enable`로 설정했으므로, 서버가 재부팅되어도 자동으로 시작됩니다.
Docker 컨테이너도 `restart: always`로 설정되어 있어 자동 재시작됩니다.

확인:

```bash
# Docker 자동 시작 확인
sudo systemctl is-enabled docker
# 예상 출력: enabled

# Nginx 자동 시작 확인
sudo systemctl is-enabled nginx
# 예상 출력: enabled
```

---

## 부록: 빠른 참조 (자주 쓰는 명령어)

```bash
# === SSH 접속 (Mac 터미널에서) ===
ssh -i ~/.ssh/oracle-n8n.key ubuntu@<공인IP>

# === n8n 관리 (서버에서) ===
cd ~/n8n
docker compose up -d          # 시작
docker compose down            # 중지
docker compose restart         # 재시작
docker compose logs -f n8n     # 로그 실시간 보기
docker compose ps              # 상태 확인
docker compose pull && docker compose up -d   # 업데이트

# === Nginx 관리 ===
sudo nginx -t                  # 설정 검증
sudo systemctl reload nginx    # 설정 적용
sudo systemctl status nginx    # 상태 확인

# === 시스템 확인 ===
free -h                        # 메모리
df -h                          # 디스크
htop                           # 실시간 모니터링 (q로 종료)
```

---

> 이 가이드대로 진행하면 **Oracle Cloud Free Tier ARM 서버에 n8n이 HTTPS로 배포**되고,
> 텔레그램 봇과 노션 연동 워크플로우가 동작하는 상태가 됩니다.
> 문제가 생기면 [11. 트러블슈팅](#11-트러블슈팅)을 먼저 확인해 보세요.
