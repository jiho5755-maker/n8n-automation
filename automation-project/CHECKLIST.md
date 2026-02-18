# 구현 체크리스트

이 체크리스트를 따라가며 단계별로 진행합니다.
각 단계 완료 시 `[ ]` → `[x]`로 변경하세요.

---

## Phase 1: 인프라 구축

### 1-1. Oracle Cloud 계정 생성
- [x] https://signup.oraclecloud.com/ 접속
- [x] 이메일, 이름, 국가 입력
- [x] 홈 리전 선택 (서울 `ap-seoul-1` 또는 춘천 `ap-chuncheon-1`)
- [x] 신용카드 등록 (인증용, 과금 없음)
- [x] 계정 활성화 확인 (테넌시: jiho, 비밀번호 찾기 필요)

### 1-2. ARM 인스턴스 생성
- [ ] OCI 콘솔 → Compute → Instances → Create Instance
- [ ] Image: Ubuntu 22.04 (aarch64)
- [ ] Shape: VM.Standard.A1.Flex (2 OCPU / 12GB RAM)
- [ ] SSH 키 생성 및 다운로드
- [ ] 인스턴스 생성 (Out of Capacity 오류 시 리전/시간 변경 후 재시도)
- [ ] 공인 IP 주소 메모: _______________

### 1-3. 네트워크 설정 (OCI 콘솔)
- [ ] VCN → Security Lists → Ingress Rules 추가:
  - [ ] Port 80 (HTTP) TCP 허용
  - [ ] Port 443 (HTTPS) TCP 허용

### 1-4. SSH 접속 및 서버 설정
- [ ] `ssh -i <ssh-key> ubuntu@<공인IP>` 접속 확인
- [ ] `setup.sh` 업로드 및 실행
- [ ] Docker 정상 확인: `docker --version`
- [ ] Nginx 정상 확인: `sudo systemctl status nginx`

### 1-5. 도메인 DNS 설정
- [ ] 도메인 관리 페이지 접속
- [ ] A 레코드 추가: `n8n.내도메인.com` → Oracle Cloud 공인 IP
- [ ] DNS 전파 확인: `nslookup n8n.내도메인.com`

### 1-6. n8n 배포
- [ ] `~/n8n/`에 docker-compose.yml, .env 파일 배치
- [ ] .env 값 설정 (도메인, DB 비밀번호, 암호화 키)
- [ ] HTTPS 설정 전 임시로 .env에서 N8N_SECURE_COOKIE=false 확인
- [ ] `cd ~/n8n && docker compose up -d`
- [ ] 로그 확인: `docker compose logs -f n8n`
- [ ] http://공인IP:5678 접속 테스트 (임시, 나중에 차단)

### 1-7. HTTPS 설정
- [ ] Nginx 설정 파일 배치: `/etc/nginx/sites-available/n8n`
- [ ] `sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/`
- [ ] `sudo nginx -t && sudo systemctl reload nginx`
- [ ] `sudo certbot --nginx -d n8n.내도메인.com`
- [ ] https://n8n.내도메인.com 접속 확인
- [ ] .env에서 N8N_SECURE_COOKIE=true로 변경
- [ ] `cd ~/n8n && docker compose up -d` 재시작
- [ ] 5678 포트 직접 접근 차단 확인

### 1-8. n8n 초기 설정
- [ ] https://n8n.내도메인.com 접속
- [ ] 관리자 계정 생성
- [ ] Settings → General → Timezone: Asia/Seoul 확인
- [ ] **Phase 1 완료**

---

## Phase 2: 텔레그램 봇 + 노션 연동

### 2-1. 텔레그램 봇 생성
- [x] 텔레그램에서 @BotFather 검색 → /newbot
- [x] 봇 이름 입력 (예: 내업무봇)
- [x] 봇 유저네임 입력 (예: my_work_bot)
- [x] 봇 토큰 메모: _______________
- [x] 봇과 대화 시작 (/start 전송)
- [x] 본인 Chat ID 확인: `7713811206`

### 2-2. Notion Integration 생성
- [x] https://www.notion.so/profile/integrations 접속
- [x] New Integration → 이름: "n8n 업무자동화"
- [x] Capabilities: Read/Update/Insert content 체크
- [x] API 토큰(Secret) 메모: _______________
- [x] 노션에서 4개 DB에 Integration 연결(공유):
  - [x] 업무 카테고리 DB
  - [x] 프로젝트 DB
  - [x] 할 일 DB
  - [x] 캘린더 DB

### 2-3. n8n Credential 등록
- [ ] n8n → Settings → Credentials
- [ ] Telegram Bot API credential 추가 (토큰 입력)
- [ ] Notion API credential 추가 (Integration 토큰 입력)

### 2-4. 워크플로우 구현: 텔레그램 → 노션
- [x] [F1] 텔레그램 메시지 수신 워크플로우 구현 (`workflows/telegram-todo-bot.json`)
- [x] 텍스트 파싱 로직 (프로젝트명 / 할 일 / 날짜) (`workflows/parse-message.js`)
- [x] 프로젝트 DB 매칭 로직
- [x] 캘린더 자동 생성/조회 로직
- [x] 할 일 생성 + 릴레이션 연결
- [x] 확인 메시지 회신

### 2-5. 커맨드 구현
- [x] /목록 - 오늘 할 일 조회
- [ ] /완료 - 상태 변경 (추후 구현, 현재 안내 메시지만)
- [x] /밀린 - 밀린 업무 조회

### 2-6. 테스트
- [ ] 모바일에서 텔레그램 입력 테스트
- [ ] PC에서 텔레그램 입력 테스트
- [ ] 프로젝트 매칭 정확도 확인
- [ ] 릴레이션 연결 확인
- [ ] **Phase 2 완료**

---

## Phase 3: 구글 캘린더 + 자동 알림

### 3-1. Google OAuth 설정
- [ ] Google Cloud Console → 프로젝트 생성
- [ ] Google Calendar API 활성화
- [ ] OAuth 동의 화면 설정 (외부, 테스트 모드)
- [ ] OAuth 클라이언트 ID 생성 (웹 애플리케이션)
- [ ] Redirect URI: https://n8n.내도메인.com/rest/oauth2-credential/callback
- [ ] Client ID / Secret 메모

### 3-2. n8n Google Calendar Credential
- [ ] n8n → Credentials → Google Calendar OAuth2 추가
- [ ] Client ID, Secret 입력
- [ ] OAuth 인증 완료

### 3-3. 워크플로우: 구글 캘린더 → 노션
- [ ] [F2] Google Calendar Trigger 워크플로우 구현
- [ ] 일정 제목 파싱
- [ ] 노션 할 일 자동 생성
- [ ] 중복 방지 로직

### 3-4. 워크플로우: 모닝 브리핑
- [x] [F3] Schedule Trigger (08:00) 워크플로우 구현 (`workflows/morning-briefing.json`)
- [x] 오늘 할 일 조회 + 프로젝트별 그룹핑
- [x] 밀린 업무 조회
- [x] 텔레그램 발송

### 3-5. 워크플로우: 밀린 업무 알림
- [x] [F4] Schedule Trigger (10:00) 워크플로우 구현 (`workflows/overdue-alert.json`)
- [x] 긴급도별 분류
- [x] 텔레그램 발송

### 3-6. 통합 테스트
- [ ] 모든 워크플로우 동시 활성화
- [ ] 24시간 모니터링
- [ ] **Phase 3 완료 → 시스템 운영 시작**
