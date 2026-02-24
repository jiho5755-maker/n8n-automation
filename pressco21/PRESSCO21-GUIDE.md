# Pressco21 자동화 시스템 — 전체 가이드

> 이 파일 하나로 전체 시스템을 파악하고, 새 서버에서도 처음부터 세팅할 수 있습니다.
> 최종 업데이트: 2026-02-25

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [현재 운영 상태](#2-현재-운영-상태)
3. [필요한 계정 및 API 키 목록](#3-필요한-계정-및-api-키-목록)
4. [새 서버에서 처음부터 세팅하기](#4-새-서버에서-처음부터-세팅하기)
5. [각 프로젝트 워크플로우 설치](#5-각-프로젝트-워크플로우-설치)
6. [일상 운영 가이드](#6-일상-운영-가이드)
7. [문제 해결](#7-문제-해결)

---

## 1. 시스템 개요

```
n8n-main/
├── automation-project/   ← [프로젝트 1] 업무 일정 자동화 (운영 중)
├── govt-support/         ← [프로젝트 2] FA 강사 신청 + 정부지원사업 (운영 중)
└── homepage-automation/  ← [프로젝트 3] 쇼핑몰 운영 자동화 (기획 완료, 구현 대기)
```

모든 프로젝트는 **같은 서버 1대**에서 돌아갑니다.

### 프로젝트 1 — 업무 일정 자동화

| 항목 | 내용 |
|------|------|
| 목적 | 텔레그램/구글캘린더로 업무 입력 → 노션 DB 자동 정리 |
| 봇 | @Pressco21_bot |
| 주요 기능 | F1 텔레그램봇, F2 캘린더 동기화, F3 모닝브리핑, F4 밀린업무알림 |
| 상세 문서 | `automation-project/PRD.md`, `USAGE-GUIDE.md` |

### 프로젝트 2 — FA 강사 신청 관리

| 항목 | 내용 |
|------|------|
| 목적 | 에어테이블 강사 신청 폼 → 텔레그램 알림 → 메이크샵 등급 자동 변경 |
| 봇 | @Pressco21_makeshop_bot |
| 주요 기능 | FA-001(등급변경), FA-002(신청알림) |
| 상세 문서 | `govt-support/강사신청_자동화_가이드.md` |

### 프로젝트 2b — 정부지원사업 자동수집

| 항목 | 내용 |
|------|------|
| 목적 | 기업마당/K-Startup/보조금24 API → AI 분석 → 텔레그램 알림 |
| 봇 | @Pressco21_bot |
| 상태 | 워크플로우 완성, n8n import 대기 중 |
| 상세 문서 | `govt-support/PRD.md`, `ROADMAP.md` |

### 프로젝트 3 — 쇼핑몰 운영 자동화

| 항목 | 내용 |
|------|------|
| 목적 | CS 자동 알림, 리뷰 AI 답변, 미수금 관리 |
| 상태 | PRD 완성, 구현 대기 |
| 상세 문서 | `homepage-automation/PRD.md`, `AUTOMATION-STRATEGY.md` |

---

## 2. 현재 운영 상태

| 워크플로우 | 파일 위치 | n8n ID | 상태 |
|-----------|----------|--------|------|
| F1 텔레그램봇 | `automation-project/workflows/telegram-todo-bot.json` | - | ✅ 운영 중 |
| F2 구글캘린더 동기화 | `automation-project/workflows/google-calendar-todo.json` | - | ✅ 운영 중 |
| F3 모닝브리핑 | `automation-project/workflows/morning-briefing.json` | - | ✅ 운영 중 |
| F4 밀린업무알림 | `automation-project/workflows/overdue-alert.json` | - | ✅ 운영 중 |
| FA-001 강사 등급변경 | `govt-support/workflows/FA-001_강사회원_등급_자동변경.json` | `jaTfiQuY35DjgrxN` | ✅ 운영 중 |
| FA-002 강사 신청알림 | `govt-support/workflows/FA-002_강사_신청_알림.json` | `ovWkhq7E0ZqvjBIZ` | ✅ 운영 중 |
| 정부지원사업 수집 | `govt-support/workflows/정부지원사업_Pressco21.json` | - | ⏳ Import 대기 |

---

## 3. 필요한 계정 및 API 키 목록

새 환경에서 세팅할 때 아래 항목들이 모두 준비되어야 합니다.

### 필수 계정

| 서비스 | 용도 | 비용 | 가입 주소 |
|--------|------|------|---------|
| **Oracle Cloud** | 서버 (n8n 실행) | 무료 | cloud.oracle.com |
| **n8n** | 자동화 엔진 (서버에 설치) | 무료 (self-hosted) | n8n.io |
| **텔레그램** | 알림 수신, 입력 | 무료 | telegram.org |
| **노션** | 업무 DB | 무료 | notion.so |
| **구글 계정** | 구글 캘린더 | 무료 | google.com |
| **에어테이블** | FA 강사 신청 관리 | 무료 | airtable.com |
| **메이크샵** | 쇼핑몰 (이미 운영 중) | 별도 | makeshop.co.kr |

### API 키 목록 (n8n Credentials에 등록된 것들)

| 서비스 | n8n Credential 이름 | 용도 |
|--------|-------------------|------|
| 텔레그램 봇 1 | `Pressco21_bot` | 업무 일정 + 정부지원사업 |
| 텔레그램 봇 2 | `Pressco메이크샵봇` (ID: `RdFu3nsFuuO5NCff`) | FA 강사 신청, 쇼핑몰 |
| 노션 | `Notion API` (httpHeaderAuth) | 업무 DB 읽기/쓰기 |
| 구글 캘린더 | `Google Calendar` (OAuth2) | 캘린더 연동 |
| 에어테이블 | `Airtable PAT` (ID: `JK1lFxPvfCkIFclZ`) | FA 강사 DB |
| 메이크샵 API | 헤더에 직접 입력 | 회원 조회/등급 변경 |

### 주요 설정값 (n8n Variables에 등록된 것들)

| 변수명 | 값 | 용도 |
|--------|-----|------|
| `GOVT_BIZINFO_API_KEY` | `FmSrV3...` | 기업마당 API |
| `GOVT_PUBLIC_DATA_KEY` | 공공데이터포털 API 키 | K-Startup/보조금24 |
| `GEMINI_API_KEY` | Google AI Studio 키 | AI 분석 |
| `AIRTABLE_BASE_ID` | `app6CynYU5qzIFyKl` | 정부지원사업 DB |
| `AIRTABLE_API_KEY` | Airtable PAT | 정부지원사업 DB |

---

## 4. 새 서버에서 처음부터 세팅하기

> 기존 서버(n8n.pressco21.com)가 정상 운영 중이라면 이 섹션은 건너뛰세요.
> 서버를 교체하거나 새로 시작할 때만 필요합니다.

### Step 1 — 서버 준비

**Oracle Cloud Free Tier 인스턴스 생성 (권장):**
1. [cloud.oracle.com](https://cloud.oracle.com) 로그인
2. Compute > Instances > Create Instance
3. Shape: `VM.Standard.A1.Flex` (ARM, 무료)
4. OCPU: 2, Memory: 12GB (무료 한도 최대)
5. OS: Ubuntu 22.04 LTS
6. SSH 키 다운로드 후 보관 (분실 시 서버 접근 불가)
7. 생성 후 외부 IP 확인

> **"Out of Host Capacity" 오류 시**: 새벽 시간대(새벽 2~6시)에 재시도하거나, 다른 리전 선택

**대안: Contabo VPS (서울/도쿄)**
- 월 $4.95, 4 vCPU / 8GB RAM / 100GB SSD
- [contabo.com](https://contabo.com) 에서 신청

### Step 2 — 서버 초기 설정

SSH 접속 후 아래 스크립트 실행:

```bash
# 서버 접속
ssh -i [다운로드한_키.key] ubuntu@[서버_IP]

# 초기 설정 스크립트 (Docker 설치 + 방화벽 설정 포함)
# 이 프로젝트의 설정 파일 사용:
# automation-project/server-config/setup.sh
```

또는 수동으로:

```bash
# 1. 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# 2. Docker 설치
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker

# 3. Docker Compose 설치
sudo apt install docker-compose-plugin -y

# 4. 방화벽 설정 (Oracle Cloud는 별도로 인바운드 규칙도 열어야 함)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Step 3 — n8n 설치

```bash
# 프로젝트 파일 서버로 복사 (로컬에서 실행)
scp -i [키.key] automation-project/server-config/docker-compose.yml ubuntu@[서버IP]:~/
scp -i [키.key] automation-project/server-config/.env.example ubuntu@[서버IP]:~/.env

# 서버에서 .env 파일 수정
nano ~/.env
# 아래 값들을 실제 값으로 변경:
# N8N_HOST=n8n.yourdomain.com
# POSTGRES_PASSWORD=강력한비밀번호
# N8N_ENCRYPTION_KEY=32자이상의랜덤문자열

# Docker 실행
docker compose up -d

# 실행 확인
docker ps
curl localhost:5678/healthz
```

### Step 4 — 도메인 및 HTTPS 설정

```bash
# Nginx 설치
sudo apt install nginx certbot python3-certbot-nginx -y

# 설정 파일 복사 (로컬에서)
scp -i [키.key] automation-project/server-config/nginx-n8n.conf ubuntu@[서버IP]:/etc/nginx/sites-available/n8n

# 서버에서 도메인 설정 (도메인을 서버 IP로 미리 연결해두어야 함)
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL 인증서 발급
sudo certbot --nginx -d n8n.yourdomain.com
```

### Step 5 — n8n 초기 로그인

1. 브라우저에서 `https://n8n.yourdomain.com` 접속
2. 최초 접속 시 관리자 계정 생성
3. 이메일/비밀번호 기록해두기

---

## 5. 각 프로젝트 워크플로우 설치

### 공통 절차 — 자격증명 등록

n8n에 워크플로우를 import하기 전에, 자격증명을 먼저 등록해야 합니다.

**n8n 접속 → 왼쪽 메뉴 Credentials → Add Credential**

#### 텔레그램 봇 등록

```
타입: Telegram
이름: Pressco21_bot
Access Token: [BotFather에서 발급받은 토큰]
```

> 봇 없으면: 텔레그램 @BotFather → /newbot → 토큰 발급

#### 에어테이블 등록

```
타입: Airtable Personal Access Token API
이름: Airtable PAT
Access Token: [airtable.com/account에서 발급한 PAT]
```

> PAT 권한 설정: data.records:read, data.records:write

#### 노션 등록

```
타입: Header Auth (httpHeaderAuth)
이름: Notion API
Name: Authorization
Value: Bearer [노션 Integration 토큰]
```

> 노션 Integration 생성: notion.so/my-integrations

#### 구글 캘린더 등록

n8n의 Google Calendar OAuth2 방식으로 등록 (자세한 방법은 `automation-project/DEPLOYMENT-GUIDE.md` 참조)

---

### 프로젝트 1 — 업무 일정 자동화 설치

**파일 위치:** `automation-project/workflows/`

**Import 순서:**

1. **F1 텔레그램봇** (`telegram-todo-bot.json`)
   - Telegram Trigger 노드 → 텔레그램 봇 자격증명 선택
   - 노션 HTTP Request 노드들 → Notion API 자격증명 선택

2. **F2 구글캘린더** (`google-calendar-todo.json`)
   - Google Calendar 노드 → Google Calendar 자격증명 선택
   - 노션 노드들 → Notion API 자격증명 선택

3. **F3 모닝브리핑** (`morning-briefing.json`)
   - Schedule Trigger: 매일 08:00
   - 노션 노드들 → Notion API 자격증명 선택
   - Telegram 노드 → 텔레그램 봇 자격증명 선택

4. **F4 밀린업무알림** (`overdue-alert.json`)
   - Schedule Trigger: 매일 09:00, 17:00
   - 노션/Telegram 자격증명 선택

**노션 DB ID (기존 설정 그대로):**

| DB | ID |
|----|-----|
| 업무 카테고리 | `30bd119f-a669-8138-8e1f-f78839bf277c` |
| 프로젝트 | `30bd119f-a669-81e2-a747-f9002c0a9910` |
| 할 일 | `30bd119f-a669-81d0-8730-d824b7bc948c` |
| 캘린더 | `30bd119f-a669-812c-8bf4-fe603e6a8c6b` |

---

### 프로젝트 2 — FA 강사 신청 관리 설치

> 상세 가이드: `govt-support/강사신청_자동화_가이드.md`

**파일 위치:** `govt-support/workflows/`

**Import 순서:**

1. **FA-002** (`FA-002_강사_신청_알림.json`) — 신청 알림

   Import 후 수정:
   - `신규 신청 조회` 노드 → Airtable PAT 자격증명 선택
   - Base ID: `app6MBsHo7AKwh5XD`
   - `텔레그램 신청 알림` 노드 → @Pressco21_makeshop_bot 자격증명 선택
   - `신청알림 발송 표시` 노드 (HTTP Request) → Authorization 헤더값에 `Bearer [에어테이블 PAT 토큰]` 입력

2. **FA-001** (`FA-001_강사회원_등급_자동변경.json`) — 등급 자동 변경

   Import 후 확인:
   - 메이크샵 API 키가 헤더에 올바르게 설정되어 있는지 확인
   - Airtable 자격증명 선택
   - 텔레그램 봇 자격증명 선택

> **중요**: 두 워크플로우 모두 Active 토글을 ON 해야 자동 실행됩니다.

---

### 프로젝트 2b — 정부지원사업 수집 설치 (아직 미설치)

**파일 위치:** `govt-support/workflows/정부지원사업_Pressco21.json`

**Import 전 준비:**

1. Airtable에 `정부지원사업` Base 및 테이블 생성 (`govt-support/ROADMAP.md` GS-003 참조)
2. n8n Variables에 5개 등록:
   - `GOVT_BIZINFO_API_KEY` — 기업마당 API
   - `GOVT_PUBLIC_DATA_KEY` — 공공데이터포털 API
   - `GEMINI_API_KEY` — Google AI Studio
   - `AIRTABLE_BASE_ID` — `app6CynYU5qzIFyKl`
   - `AIRTABLE_API_KEY` — Airtable PAT

**Import 후:**
- 모든 노드에 자격증명 연결
- 수동 테스트 실행 후 문제 없으면 Active ON

---

### 프로젝트 3 — 쇼핑몰 운영 자동화 (미구현)

현재 PRD(기획서)만 완성된 상태입니다. 구현 시작 전:
- `homepage-automation/PRD.md` — 전체 기능 명세
- `homepage-automation/ROADMAP.md` — 개발 단계별 계획
- `homepage-automation/AUTOMATION-STRATEGY.md` — 전체 전략

---

## 6. 일상 운영 가이드

### n8n 서버 상태 확인

```bash
# 서버 SSH 접속
ssh -i [키.key] ubuntu@158.180.77.201

# n8n 컨테이너 상태
docker ps | grep n8n

# 정상이면: "Up X hours" 또는 "Up X minutes"
# 이상하면: docker compose restart 또는 아래 재시작 명령
```

### n8n 재시작 방법

```bash
# n8n Docker 재시작
cd ~  # docker-compose.yml이 있는 위치
docker compose restart

# 재시작 확인
curl localhost:5678/healthz
# 응답: {"status":"ok"}
```

### 워크플로우 실행 오류 확인

1. `https://n8n.pressco21.com` 접속
2. 왼쪽 메뉴 **Executions** 클릭
3. 빨간색 `Error` 항목 클릭
4. 빨간 테두리 노드 클릭 → 오류 메시지 확인

### FA 시스템 일상 운영

```
강사 신청 접수
  ↓ (자동, 5분 이내)
텔레그램 알림 수신 (@Pressco21_makeshop_bot)
  ↓
에어테이블(airtable.com)에서 신청 내용 확인
  ↓
승인: n8n_강사승인 체크 ✅
거부: 체크 없이 메모만
  ↓ (자동, 5분 이내)
메이크샵 회원 등급 자동 변경
텔레그램 완료 알림
```

---

## 7. 문제 해결

### 에러 코드별 원인과 해결

| 에러 | 원인 | 해결 |
|------|------|------|
| `401 Unauthorized` | API 키 만료/오류 | 해당 서비스에서 API 키 재발급 후 n8n Credentials 업데이트 |
| `403 Forbidden` | 권한/IP 차단 | 메이크샵: 오픈API 허용IP에 `158.180.77.201` 추가 |
| `Connection refused` | n8n 서버 다운 | `docker compose restart` |
| `rate limit exceeded` | API 호출 초과 | 메이크샵: 시간당 500회 제한. 워크플로우 실행 간격 늘리기 |

### 자주 묻는 것들

**Q. 텔레그램 알림이 안 옵니다.**
A. 순서대로 확인:
1. n8n 서버 켜져 있는지 → `docker ps`
2. 워크플로우 Active 상태인지 → n8n UI에서 확인
3. n8n Executions에서 오류 메시지 확인

**Q. 에어테이블 토큰을 바꿔야 하나요?**
A. 아닙니다. Airtable PAT는 직접 삭제하지 않는 한 만료되지 않습니다. 시스템이 정상 작동하면 토큰을 바꿀 필요가 없습니다.

**Q. 메이크샵 등급 변경이 실패합니다.**
A. 확인 순서:
1. 메이크샵 관리자 → 오픈API → 허용IP에 `158.180.77.201` 있는지
2. 오픈API → 수정 권한 허용되어 있는지
3. n8n Executions에서 정확한 오류 메시지 확인

**Q. n8n 서버 IP가 바뀌었습니다.**
A. 메이크샵 오픈API 허용IP와 Nginx 설정 업데이트 필요.

**Q. 새 서버로 이전하면 API 키를 다시 발급해야 하나요?**
A. 메이크샵 오픈API 허용IP만 새 서버 IP로 업데이트하면 됩니다. 나머지 API 키(텔레그램, 노션, 에어테이블 등)는 그대로 재사용 가능합니다.

---

## 부록 — 인프라 정보

| 항목 | 값 |
|------|-----|
| 서버 | Oracle Cloud Free Tier ARM |
| 서버 IP | 158.180.77.201 |
| n8n 주소 | https://n8n.pressco21.com |
| 텔레그램 봇 1 | @Pressco21_bot (Chat ID: 7713811206) |
| 텔레그램 봇 2 | @Pressco21_makeshop_bot |
| 에어테이블 FA Base | app6MBsHo7AKwh5XD |
| 에어테이블 정부지원 Base | app6CynYU5qzIFyKl |

> **SSH 키**: `automation-project/오라클 클라우드 SSH Key 백업/` 폴더에 공개키 보관 중
> 개인키(.key 파일)는 별도 안전한 곳에 보관 필요
