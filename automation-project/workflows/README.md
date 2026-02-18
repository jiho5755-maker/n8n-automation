# n8n 워크플로우 파일

## 파일 목록

| 파일 | 워크플로우 | 설명 |
|---|---|---|
| `telegram-todo-bot.json` | [F1] 텔레그램 → 노션 할 일 등록 | 메인 봇 (할 일 등록 + /목록, /완료, /밀린 커맨드) |
| `morning-briefing.json` | [F3] 모닝 브리핑 | 매일 08:00 오늘 할 일 + 밀린 업무 요약 |
| `overdue-alert.json` | [F4] 밀린 업무 알림 | 매일 10:00 밀린 업무 리마인드 |
| `parse-message.js` | - | 텍스트 파싱 로직 (참조/테스트용) |

## Import 방법

1. n8n 웹 에디터 접속
2. 좌측 메뉴 → Workflows
3. 우측 상단 `...` → Import from File
4. JSON 파일 선택
5. Import 후 아래 설정 필요

## Import 후 필수 설정

### 1. Credential 연결
각 워크플로우의 노드에서 credential을 연결해야 합니다:

- **Telegram Bot** 노드 → Telegram Bot API credential 선택
- **Notion HTTP Request** 노드 → HTTP Header Auth credential 선택
  - Header Name: `Authorization`
  - Header Value: `Bearer {노션_API_토큰}`

### 2. Chat ID 설정
모닝 브리핑과 밀린 업무 알림 워크플로우에서:
- `텔레그램 발송` 노드의 `chatId`를 본인 Chat ID로 변경
- Chat ID 확인: 텔레그램에서 @userinfobot에게 메시지 보내기

### 3. Notion API credential 설정 방법
n8n에서 HTTP Header Auth credential 생성:
- Name: `Notion API`
- Header Name: `Authorization`
- Header Value: `Bearer ntn_xxxxx` (Notion Integration 토큰)

## 노션 DB 속성 이름 확인
워크플로우는 아래 속성명을 기준으로 작성됨. 노션 DB와 일치하는지 확인:

- **할 일 DB**: `할 일`(title), `상태`(status), `시간`(date), `목표날짜`(date), `프로젝트`(relation), `캘린더`(relation)
- **프로젝트 DB**: `프로젝트`(title)
- **캘린더 DB**: `캘린더`(title), `날짜`(date)
