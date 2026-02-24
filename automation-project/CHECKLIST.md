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
- [x] OCI 콘솔 → Compute → Instances → Create Instance
- [x] Image: Ubuntu 22.04 (aarch64)
- [x] Shape: VM.Standard.A1.Flex (2 OCPU / 12GB RAM)
- [x] SSH 키 생성 및 다운로드 (`~/.ssh/oracle-n8n.key`)
- [x] 인스턴스 생성 완료. 공인 IP: `158.180.77.201`

### 1-3. 네트워크 설정 (OCI 콘솔)
- [x] VCN → Security Lists → Ingress Rules 추가:
  - [x] Port 80 (HTTP) TCP 허용
  - [x] Port 443 (HTTPS) TCP 허용

### 1-4. SSH 접속 및 서버 설정
- [x] `ssh -i ~/.ssh/oracle-n8n.key ubuntu@158.180.77.201` 접속 확인
- [x] `setup.sh` 업로드 및 실행
- [x] Docker 정상 확인
- [x] Nginx 정상 확인

### 1-5. 도메인 DNS 설정
- [x] A 레코드: `n8n.pressco21.com` → `158.180.77.201`
- [x] DNS 전파 확인

### 1-6. n8n 배포
- [x] `~/n8n/`에 docker-compose.yml, .env 파일 배치
- [x] `cd ~/n8n && docker compose up -d`
- [x] n8n 정상 가동 확인

### 1-7. HTTPS 설정
- [x] Nginx 리버스 프록시 설정
- [x] SSL 인증서 발급 (Certbot)
- [x] https://n8n.pressco21.com 접속 확인

### 1-8. n8n 초기 설정
- [x] 관리자 계정 생성 (pressco5755@naver.com)
- [x] Timezone: Asia/Seoul 확인
- [x] **Phase 1 완료**

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
- [x] Telegram Bot API credential 추가 (ID: 1)
- [x] Notion Header Auth credential 추가 (ID: 3, Authorization: Bearer ntn_...)
- [x] Notion API credential 추가 (ID: 2)

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
- [x] 텔레그램 메시지 → 노션 할 일 자동 등록 확인 (2026-02-24)
- [x] 프로젝트 매칭 + 캘린더 릴레이션 연결 확인
- [ ] /완료 - 상태 변경 (추후 구현)
- [x] **Phase 2 완료**

---

## Phase 3: 구글 캘린더 + 자동 알림

### 3-1. Google OAuth 설정
- [x] https://console.cloud.google.com 접속 → 프로젝트 생성 (예: `n8n-automation`)
- [x] 좌측 메뉴 → API 및 서비스 → 라이브러리 → **Google Calendar API** 검색 후 활성화
- [x] OAuth 동의 화면 설정 (외부/External, 테스트 모드)
  - 앱 이름: `n8n Automation`, 사용자 지원 이메일: jiho5755@gmail.com
  - 테스트 사용자: jiho5755@gmail.com 추가
- [x] 사용자 인증 정보 만들기 → OAuth 클라이언트 ID → 웹 애플리케이션
  - 승인된 리디렉션 URI: `https://n8n.pressco21.com/rest/oauth2-credential/callback`
- [x] Client ID / Client Secret 메모 (프로젝트 ID: fabled-tractor-483815-q9)

### 3-2. n8n Google Calendar Credential
- [x] https://n8n.pressco21.com → 좌측 메뉴 → Credentials → Add Credential
- [x] `Google Calendar OAuth2 API` 선택 → "Google Calendar account" 생성
- [x] Client ID, Client Secret 입력
- [x] **Sign in with Google** 버튼 클릭 → jiho5755@gmail.com 로그인 → 권한 허용
- [x] Account connected 확인 (2026-02-24)

### 3-3. 워크플로우: 구글 캘린더 → 노션
- [x] [F2] Google Calendar Trigger 워크플로우 작성 (`workflows/google-calendar-todo.json`)
- [x] 일정 제목 파싱 (형식: `프로젝트 - 할 일`)
- [x] 노션 할 일 자동 생성 + `시간 ` 날짜 필드 연결
- [x] 중복 방지 로직 (같은 제목+날짜 체크)
- [x] n8n에 Import + 자격증명 연결 (Google Calendar account / Telegram Bot API) + Published (2026-02-24)

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
- [x] 모든 워크플로우 활성화 (F1/F2/F3/F4 Published, 2026-02-24)
- [ ] 24시간 모니터링
- [ ] **Phase 3 완료 → 시스템 운영 시작**
