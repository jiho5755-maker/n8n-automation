# 업무 일정 자동화 시스템 개발 로드맵

텔레그램 자연어 입력 + AI 파싱 + 인라인 버튼 상태 관리 + 노션/구글 캘린더 양방향 동기화를 통한 1인 운영자 생산성 극대화 시스템

## 개요

업무 일정 자동화 시스템은 1인 운영자(장지호)를 위한 무비용(월 0원) 24시간 업무 자동화 시스템으로 다음 기능을 제공합니다:

- **텔레그램 봇 입력**: 3초 이내 자유 텍스트로 할 일 등록, AI 자연어 파싱
- **인라인 버튼 상태 관리**: 노션 앱 진입 없이 텔레그램에서 즉시 완료/진행중/핀 처리
- **커맨드 확장**: /주간 (완료율 통계), /수정 (텔레그램 내 수정 완결)
- **양방향 동기화**: 노션 <-> 구글 캘린더 양방향 자동 일치

### 기반 시스템 (운영 중)

| 워크플로우 | 기능 | 상태 |
|-----------|------|------|
| F1 | 텔레그램 봇 -> 노션 할 일 등록 (/목록, /완료, /밀린) | 운영 중 |
| F2 | 구글 캘린더 -> 노션 단방향 동기화 | 운영 중 |
| F3 | 모닝 브리핑 (매일 08:00) | 운영 중 |
| F4 | 밀린 업무 알림 (매일 10:00) | 운영 중 |

### 기술 스택

- **서버**: Oracle Cloud Free Tier ARM (n8n.pressco21.com, 158.180.77.201)
- **자동화**: n8n (Docker, self-hosted) + PostgreSQL
- **AI**: Gemini 2.0 Flash API (무료 티어 일 1,500회)
- **연동**: Notion API, Google Calendar API, Telegram Bot API
- **비용**: 월 0원

---

## 개발 워크플로우

1. **작업 계획**
   - 기존 워크플로우 JSON 구조를 확인하고 현재 노드 구성 파악
   - 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
   - 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**
   - 기존 워크플로우 JSON과 노드 구성을 학습하고 현재 상태 파악
   - `/tasks` 디렉토리에 새 작업 파일 생성
   - 명명 형식: `XXX-description.md` (예: `001-gemini-env-setup.md`)
   - n8n 워크플로우 JSON 노드 구조, 연결 관계, Credential 참조를 구체적으로 명시
   - API 연동 및 비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함
   - 이전 완료 작업 파일을 예시로 참조

3. **작업 구현**
   - 작업 파일의 명세서를 따름
   - n8n 워크플로우 JSON 노드 작성 및 연결
   - 서버 배포: PUT API 또는 n8n UI Import -> docker restart n8n
   - 텔레그램에서 실제 메시지 전송으로 테스트 수행
   - 각 단계 완료 후 작업 파일 내 단계 진행 상황 업데이트
   - 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**
   - 로드맵에서 완료된 작업을 표시

---

## 완료된 개발 단계

### Phase 1: 인프라 구축 (서버 + n8n 배포) -- 완료

- **Task: Oracle Cloud 서버 구축 및 n8n 배포** -- 완료
  - See: `CHECKLIST.md` Phase 1 (1-1 ~ 1-8)
  - Oracle Cloud ARM 인스턴스 생성 (2 OCPU / 12GB RAM)
  - Docker + PostgreSQL + n8n 배포
  - Nginx + Let's Encrypt HTTPS 설정
  - n8n.pressco21.com 접속 확인

### Phase 2: 텔레그램 봇 + 노션 연동 -- 완료

- **Task: F1 텔레그램 봇 워크플로우 구현** -- 완료
  - See: `CHECKLIST.md` Phase 2 (2-1 ~ 2-6)
  - Telegram Trigger (Polling) -> 텍스트 파싱 -> 프로젝트 매칭 -> 노션 할 일 등록
  - /목록, /완료, /밀린 커맨드 구현
  - 워크플로우 파일: `workflows/telegram-todo-bot.json`

### Phase 3: 구글 캘린더 동기화 + 자동 알림 -- 완료

- **Task: F2 구글 캘린더 -> 노션 동기화** -- 완료
  - See: `CHECKLIST.md` Phase 3 (3-1 ~ 3-3)
  - Google Calendar Trigger -> 제목 파싱 -> 노션 할 일 생성
  - 워크플로우 파일: `workflows/google-calendar-todo.json`

- **Task: F3 모닝 브리핑 + F4 밀린 업무 알림** -- 완료
  - See: `CHECKLIST.md` Phase 3 (3-4 ~ 3-6)
  - F3: 매일 08:00 오늘 할 일 + 밀린 업무 요약 텔레그램 발송
  - F4: 매일 10:00 밀린 업무 긴급도별 분류 텔레그램 발송
  - 워크플로우 파일: `workflows/morning-briefing.json`, `workflows/overdue-alert.json`

---

## 고도화 개발 단계

### Phase 4: 환경 설정 및 AI 파싱 (F1-AI) -- 완료

- **Task 001: Gemini API 환경변수 및 Credential 설정** -- 완료
  - docker-compose.yml에 GEMINI_API_KEY 환경변수 추가
  - 서버 .env 파일에 Gemini API Key 등록
  - docker compose up -d로 n8n 재시작하여 환경변수 적용 확인
  - n8n UI에서 HTTP Header Auth credential 생성 (Name: `x-goog-api-key`, Value: API Key)
  - Gemini API 연결 테스트 (간단한 HTTP Request 노드로 응답 확인)

- **Task 002: Gemini 프롬프트 설계 및 HTTP Request 노드 작성** -- 완료
  - Gemini 2.0 Flash 프롬프트 작성
    - 시스템 프롬프트: 역할 정의 + 오늘 날짜(KST) 동적 삽입
    - 출력 JSON 스키마: `{"title", "projectHint", "date", "time", "dueDate", "memo"}`
    - 상대 날짜 처리 규칙 ("내일", "다음주 월요일", "모레" 등)
    - 파싱 불가 필드는 null 반환 규칙 명시
  - HTTP Request 노드 구성
    - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
    - Method: POST, Content-Type: application/json
    - 타임아웃: 5초 설정
    - 응답 JSON 파싱 Code 노드 작성

- **Task 003: AI 폴백 로직 구현 및 F1 워크플로우 통합 배포**
  - If 노드로 Gemini 응답 성공/실패 분기
    - 성공 조건: HTTP 200 + JSON 파싱 성공 + title 필드 not null
    - 실패 시: 기존 Regex 파서(parse-message.js 기반 Code 노드)로 자동 전환
  - 폴백 사용 시 회신 메시지에 "(기본 파서 사용)" 표시 로직
  - F1 워크플로우 JSON 통합 업데이트
    - 기존 텍스트 파싱 Code 노드 앞에 AI 파싱 노드 삽입
    - Switch 노드에서 일반 텍스트 -> AI 파싱 -> 폴백 -> 기존 노션 등록 흐름 연결
  - 서버 배포 및 테스트
    - PUT API 또는 n8n UI Import로 워크플로우 업데이트
    - docker restart n8n
    - 텔레그램 테스트 메시지 10종 검증
      - "내일 오후 3시 팀 미팅 준비"
      - "다음주 월요일까지 보고서 제출"
      - "3/15 상품 촬영"
      - "오늘 견적서 수정" 등
    - AI 파싱 성공률 8/10 이상 확인
    - 폴백 동작 확인 (Gemini 타임아웃 시 5초 내 Regex 전환)

### Phase 5: 인라인 버튼 + Callback 워크플로우 (F1-BTN)

- **Task 004: Callback 처리 워크플로우 신규 작성**
  - 신규 워크플로우 파일: `workflows/notion-callback.json`
  - Webhook Trigger 노드 구성 (n8n 자동 생성 UUID path 활용)
  - callback_data 파싱 로직
    - 포맷: `{상태코드}:{notionPageId}` (예: `done:abc123-def456`)
    - 콜론 구분자 존재 여부 검증, 잘못된 형식이면 answerCallbackQuery만 호출
  - Telegram answerCallbackQuery HTTP Request 노드 (200ms 내 즉시 응답)
  - Notion 상태 PATCH HTTP Request 노드
    - 상태 코드 매핑: done=완료, inprogress=진행 중, pin=핀
  - Telegram editMessageReplyMarkup HTTP Request 노드 (버튼 제거 + 완료 텍스트)
  - 에러 처리: Notion 업데이트 실패 시 answerCallbackQuery에 "처리 실패" 텍스트 표시
  - 보안: X-Telegram-Bot-Api-Secret-Token 헤더 검증 로직

- **Task 005: F1 텔레그램 응답에 인라인 버튼 추가**
  - F1 워크플로우의 기존 Telegram 응답 노드를 HTTP Request 노드로 교체
    - n8n Telegram 노드 v1.2는 reply_markup 미지원 -> sendMessage API 직접 호출
    - reply_markup JSON 구조: inline_keyboard 배열
    - 버튼 3개: `[완료] [진행중] [핀]`
    - callback_data: `done:{pageId}`, `inprogress:{pageId}`, `pin:{pageId}`
    - callback_data 크기: 최대 47바이트 (상태코드 10자 + : + UUID 36자, 64바이트 제한 내)
  - 등록 완료 메시지 형식 업데이트
    ```
    등록 완료
    ─────────────────
    {할 일 제목}
    프로젝트: {프로젝트명}
    날짜: {날짜 포맷}
    ─────────────────
    [완료] [진행중] [핀]
    ```
  - Telegram setWebhook으로 Callback 워크플로우 URL 등록
    - secret_token 설정: `{workflowId}_{nodeId}` (특수문자 제거)
    - 기존 F1 Polling 방식과 Callback Webhook 공존 확인
  - 테스트
    - 할 일 등록 후 인라인 버튼 표시 확인
    - 각 버튼 클릭 후 Notion 상태 변경 확인 (3초 내)
    - 버튼 클릭 후 텔레그램 메시지에서 버튼 제거 확인

### Phase 6: 커맨드 확장 (F1-CMD)

- **Task 006: /주간 커맨드 구현**
  - F1 워크플로우 Switch 노드에 `/주간` 분기 추가
  - 이번 주 월~일 KST 날짜 범위 계산 Code 노드
    - moment().utcOffset('+09:00') 패턴으로 KST 처리
    - 월요일 00:00:00 ~ 일요일 23:59:59 범위 산출
  - Notion 할 일 DB 조회 HTTP Request 노드
    - filter: 시간 필드 >= 월요일 AND 시간 필드 <= 일요일
    - sorts: 시간 필드 ascending
  - 조회 결과 포맷팅 Code 노드
    - 프로젝트별 그룹화
    - 완료율 = 완료 건수 / 전체 건수 x 100
    - 상태 아이콘: 완료=체크, 진행 중=파란 동그라미, 시작 전=빈 사각형
    - 번호 1-based 인덱스 부여 (static data에 목록 임시 저장)
  - 텔레그램 메시지 발송 (주간 현황 형식)
  - 테스트: /주간 입력 후 실제 Notion 데이터와 일치하는 완료율 확인

- **Task 007: /수정 커맨드 구현**
  - F1 워크플로우 Switch 노드에 `/수정` 분기 추가
  - 번호 파싱 Code 노드
    - `/수정 3 @내일` -> 번호 3, 날짜 변경
    - `/수정 3 새로운 제목` -> 번호 3, 제목 변경
    - n8n static data에서 최근 /목록 또는 /주간 결과 조회하여 번호 -> pageId 매핑
    - static data 없을 시 "먼저 /목록 또는 /주간을 실행하세요" 안내
  - @날짜 형식 감지 시: Notion 시간 필드 PATCH
  - 그 외: Notion 할 일 제목 PATCH
  - 수정 완료 확인 메시지 발송
    ```
    수정 완료
    ─────────────────
    {할 일 제목}
    날짜: {이전} -> {변경후}
    구글 캘린더도 자동 반영됩니다
    ```
  - 테스트
    - `/수정 2 @내일` -> Notion 날짜 변경 확인
    - `/수정 3 새 제목` -> Notion 제목 변경 확인
    - static data 없을 때 안내 메시지 확인

### Phase 7: 노션 -> 구글 캘린더 역방향 동기화 (F5)

- **Task 008: F2 워크플로우 수정 ([from-gcal] 태그 추가)**
  - F2 워크플로우(google-calendar-todo.json)에서 Notion 할 일 생성 시 메모 필드에 `[from-gcal]` 태그 추가
  - 기존 메모 내용이 있을 경우 메모 맨 앞에 `[from-gcal] ` prepend
  - F2 워크플로우 서버 배포 및 기존 동작 정상 확인
  - 테스트: 구글 캘린더에서 일정 추가 -> 노션 할 일 생성 시 메모에 [from-gcal] 태그 포함 확인

- **Task 009: F5 역방향 동기화 워크플로우 신규 작성**
  - 신규 워크플로우 파일: `workflows/notion-to-gcal-sync.json`
  - Schedule Trigger: 5분 간격 실행
  - Notion 할 일 DB 조회 HTTP Request 노드
    - filter 조건:
      - timestamp = last_edited_time, after = 현재 - 5분
      - 시간 필드 is_not_empty (date가 있는 항목만)
    - 조회 결과 중 메모에 `[from-gcal]` 포함된 항목 제외 (F2 출처 건너뜀)
  - 메모 필드 `[gcal:이벤트ID]` 정규식 추출 Code 노드
  - 분기 처리 (If 노드)
    - [이벤트ID 없음] -> Google Calendar Events.insert HTTP Request
      - 제목: `{프로젝트명} - {할 일 제목}` 형식
      - 시간: Notion 시간 필드 -> Google Calendar dateTime (KST)
      - 생성된 이벤트 ID를 Notion 메모 필드 맨 앞에 `[gcal:{이벤트ID}] ` prepend
    - [이벤트ID 있음] -> Google Calendar Events.patch HTTP Request
      - 제목/시간 업데이트
  - Notion Rate Limit 대응
    - 항목 간 334ms 딜레이 (초당 3회 제한 준수)
    - 429 응답 시 1초 대기 후 1회 자동 재시도
  - 타임존 처리: 모든 날짜 계산 UTC+9 (moment().utcOffset('+09:00'))

- **Task 010: 무한루프 방지 검증 및 통합 테스트**
  - 무한루프 방지 메커니즘 검증
    - 시나리오 1: 구글 캘린더 입력 -> F2 -> 노션 ([from-gcal] 태그) -> F5 건너뜀 (정상)
    - 시나리오 2: 노션 직접 입력 -> F5 -> 구글 캘린더 생성 -> F2 -> 노션에 중복 확인
    - 시나리오 3: 텔레그램 입력 -> F1 -> 노션 -> F5 -> 구글 캘린더 생성 (정상)
  - F2 중복 방지 로직 강화 (필요 시)
    - 같은 제목+날짜 체크 기존 로직이 F5가 생성한 이벤트도 정상 필터링하는지 확인
  - 전체 워크플로우 통합 테스트
    - 텔레그램 -> 노션 -> 구글 캘린더 (F1 + F5) 흐름 확인
    - 구글 캘린더 -> 노션 (F2) 흐름에서 [from-gcal] 태그 확인
    - /수정 명령 후 노션 + 구글 캘린더 양쪽 5분 내 반영 확인
    - F5에서 10건 이상 동시 처리 시 429 오류 없이 완료 확인
    - 모닝 브리핑(F3), 밀린 업무 알림(F4) 기존 동작 정상 유지 확인

---

## 파일 구조 (고도화 완료 후)

```
automation-project/
  PRD.md                        # 기존 기획서 (Phase 1~3)
  PRD-upgrade.md                # 고도화 기획서 (Phase A~D)
  ROADMAP.md                    # 이 파일 (개발 로드맵)
  CHECKLIST.md                  # Phase 1~3 체크리스트 (완료)
  CLAUDE.md                     # 프로젝트 컨텍스트
  tasks/                        # 작업 상세 파일
    001-gemini-env-setup.md
    002-gemini-prompt-design.md
    003-ai-fallback-f1-deploy.md
    004-callback-workflow.md
    005-inline-button-f1.md
    006-weekly-command.md
    007-edit-command.md
    008-f2-from-gcal-tag.md
    009-f5-reverse-sync.md
    010-loop-prevention-test.md
  server-config/
    docker-compose.yml          # GEMINI_API_KEY 환경변수 추가
    .env.example                # 환경 변수 템플릿 업데이트
    nginx-n8n.conf
    setup.sh
  workflows/
    telegram-todo-bot.json      # [F1] 텔레그램 봇 (AI 파싱 + 버튼 + 커맨드 확장)
    google-calendar-todo.json   # [F2] 구글 -> 노션 ([from-gcal] 태그 추가)
    morning-briefing.json       # [F3] 모닝 브리핑 (변경 없음)
    overdue-alert.json          # [F4] 밀린 업무 알림 (변경 없음)
    notion-callback.json        # [신규] Callback 처리 워크플로우
    notion-to-gcal-sync.json    # [F5] 노션 -> 구글 캘린더 역방향 동기화
    parse-message.js            # 텍스트 파싱 로직 (참조/테스트용)
    README.md
```

---

## 의존성 관계

```
Task 001 (환경설정)
  └─> Task 002 (프롬프트 설계)
        └─> Task 003 (폴백 + F1 통합 배포)

Task 004 (Callback 워크플로우) ─── 독립 작업
  └─> Task 005 (F1 인라인 버튼)
        의존: Task 003 완료 (F1 워크플로우 최신 버전 기반)

Task 006 (/주간 커맨드) ─── Task 005 이후 F1에 추가
Task 007 (/수정 커맨드) ─── Task 006 이후 F1에 추가

Task 008 (F2 [from-gcal] 태그) ─── 독립 작업
  └─> Task 009 (F5 역방향 동기화)
        └─> Task 010 (통합 테스트)
              의존: Task 007 + Task 009 모두 완료
```

---

## 검증 기준 요약

| 항목 | 기준 |
|------|------|
| AI 파싱 성공률 | 10가지 자연어 패턴에서 8/10 이상 정확 파싱 |
| AI 폴백 동작 | Gemini 응답 없을 때 5초 내 Regex 파서로 자동 전환 |
| 인라인 버튼 응답 | 버튼 클릭 후 3초 내 Notion 상태 변경 + 버튼 제거 |
| /주간 완료율 | 실제 Notion 데이터와 일치하는 완료율(%) 표시 |
| /수정 반영 | 명령 후 Notion + 구글 캘린더 5분 내 업데이트 |
| F5 역방향 동기화 | Notion 직접 입력 후 5분 내 구글 캘린더 이벤트 생성 |
| 충돌 방지 | 구글 캘린더 출처 항목이 F5에 의해 재처리되지 않음 |
| Rate Limit 준수 | F5에서 10건 이상 동시 처리 시 429 오류 없이 완료 |
