# FA-001: 에어테이블 강사회원 등급 자동 변경 설계서

> **작성일**: 2026-02-24
> **최종 수정**: 2026-02-24 v3 (2차 식별자: 이메일 → 연락처+성함 변경)
> **목적**: 에어테이블 강사공간 DB에서 "승인완료" 클릭 시 메이크샵 강사회원 등급 자동 변경

---

## 1. 에어테이블 테이블 구조 (이미지 분석 — 최신)

| 필드명 | 타입 | 내용 | n8n 활용 |
|-------|------|------|---------|
| **성함** | Text | 회원 이름 | **2차 식별자 보조** (연락처와 함께 사용) |
| **자사몰 ID** | Text | 메이크샵 로그인 아이디 | **1차 식별자** ✅ (가장 정확) |
| **이메일 주소** | Email | 이메일 (@naver.com 등) | 참고용 (식별 미사용 — 오타 많음) |
| **연락처** | Phone | 010-XXXX-XXXX | **2차 식별자** ✅ (+ 성함 조합으로 확정) |
| **소속 협회** | Text | 협회명 | 참고용 |
| **증빙서류 첨부** | Attachment | 이미지/PDF | 참고용 |
| **진행 상태** | Single Select | 승인완료 / 반려 / (미입력) | **트리거 필드** ✅ |
| **전문 분야** | Multi Select | 전문 분야 | 참고용 |
| **n8n_처리완료** | Checkbox | 중복 처리 방지 | **상태 관리 필드** ✅ (추가 필요) |
| **n8n_처리일시** | Date | 처리된 날짜/시간 | **기록 필드** ✅ (추가 필요) |

---

## 2. 회원 식별 방법 결정 — 3단계 폴백 전략

### 결론: **자사몰 ID → 연락처+성함 → 수동 처리** 우선순위

| 우선순위 | 방법 | 정확도 | 사용 시나리오 |
|---------|------|--------|------------|
| **1차** | **자사몰 ID** ✅ | 최고 | 폼에 자사몰 ID 정상 입력된 경우 |
| **2차** | **연락처(mobile) + 성함** ✅ | 높음 | 자사몰 ID를 비워두고 제출한 경우 |
| **3차** | **수동 처리** | - | 1·2차 모두 실패 시 텔레그램 알림 |

> **이메일 제외 이유**: 폼 입력 시 오타가 가장 많은 필드. 연락처는 숫자라 오타 위험 낮음.
> **연락처+성함 조합 이유**: 연락처 단독 조회 시 동일 번호 복수 회원 가능성 → 성함으로 최종 확정.

### 메이크샵 API — 1차: 자사몰 ID로 회원 조회

```
GET /list/open_api.html
mode=search
type=user
user_id={에어테이블_자사몰ID_필드값}

응답에서:
- user_id: 조회 확인용 (입력값과 동일해야 함)
- group_code: 현재 회원 그룹 코드
```

### 메이크샵 API — 2차: 연락처로 회원 조회 후 성함으로 확정

```
GET /list/open_api.html
mode=search
type=user
mobile={에어테이블_연락처_필드값}  ← 010-XXXX-XXXX 또는 01XXXXXXXXX 형식

응답에서:
- 결과 1건: 성함도 일치하면 → 바로 등업 처리
- 결과 1건: 성함 불일치 → 텔레그램 "성함 확인 필요" 알림
- 결과 0건 또는 오류: 3차(수동 처리)로 이동
```

> **연락처 포맷 전처리 필요**: 에어테이블 Phone 필드는 `+82 10-XXXX-XXXX` 형식일 수 있음.
> n8n Code 노드에서 `replace(/[^0-9]/g, '').replace(/^82/, '0')` 로 `01XXXXXXXXX` 형식으로 변환 후 조회.

### 메이크샵 API — 그룹 변경

```
POST /list/open_api.html
mode=process
type=user
process=group_change
user_id={조회된_회원ID}
group_code={강사회원_그룹코드}
```

> ⚠️ **사전 확인 필요**: 메이크샵 관리자에서 "강사회원" 그룹의 group_code 값 확인
> → [섹션 6. 강사회원 그룹 코드 확인 방법] 참조

---

## 3. 폼 입력 오류 케이스별 처리 로직

에어테이블 폼 사용자가 실수로 잘못 입력하는 경우를 모두 대응:

| 케이스 | 자사몰 ID | 연락처 | 처리 방법 |
|-------|---------|-------|---------|
| **정상** | 입력됨 | - | 자사몰 ID로 직접 조회 + 등업 |
| **ID 누락** | 비어있음 | 입력됨 | 연락처+성함으로 조회 후 등업 |
| **ID 오타** | 잘못됨 | 입력됨 | ID 조회 실패 → 연락처 2차 시도 → 성공 시 등업 |
| **연락처 불일치** | 비어있음 | 잘못됨 | 연락처 조회 실패 → 텔레그램 수동 처리 |
| **둘 다 없음** | 비어있음 | 비어있음 | 즉시 텔레그램 수동 처리 |
| **성함 불일치** | 비어있음 | 맞음 | 연락처 조회 성공 + 성함 불일치 → 텔레그램 "확인 필요" |
| **이미 강사회원** | 입력됨 | - | 조회 → 이미 같은 그룹 → 스킵 + 알림 |

---

## 4. n8n 워크플로우 설계 (FA-001) — 3단계 폴백 포함

### 방식 선택: 폴링 (5분 간격) — 즉시 시작 권장

```
[트리거] Schedule: 매 5분
    ↓
[Airtable] 레코드 조회
    필터: 진행 상태 = "승인완료" AND n8n_처리완료 = false
    테이블: tblo1NVcundJjJKJ3 | 앱: app6MBsHo7AKwh5XD
    ↓
[IF] 신규 승인완료 건 있는가?
    ↓ (있음)
[Loop Over Items] 각 레코드별 처리
    ↓
[Code] 식별 전략 결정
    → 자사몰ID 있으면 → route = "byId"
    → 자사몰ID 없고 이메일 있으면 → route = "byEmail"
    → 둘 다 없으면 → route = "manual"
    ↓
[Switch] route 분기
    ├── "byId"
    │     [HTTP] 메이크샵 user_id 직접 조회
    │         ↓ 성공           ↓ 실패(오타 등)
    │     [등업 처리]       [이메일 2차 시도]
    │                            ↓ 성공      ↓ 실패
    │                       [등업 처리]  [수동 알림]
    │
    ├── "byMobile"
    │     [Code] 연락처 포맷 정규화 (010XXXXXXXX 형식)
    │     [HTTP] 메이크샵 mobile 조회
    │         ↓ 성공           ↓ 실패
    │     [Code] 성함 일치 여부 확인
    │         ↓ 일치       ↓ 불일치
    │     [등업 처리]   [수동 알림: "성함 확인 필요"]
    │
    └── "manual"
          [Telegram] 즉시 수동 처리 요청 알림
          [Airtable] 오류 상태 기록

[등업 처리 공통 경로]
    ↓
[HTTP Request] 메이크샵 그룹 변경
    POST process=group_change, user_id=..., group_code={강사회원코드}
    ↓
[Airtable] 처리완료 기록
    n8n_처리완료 = true | n8n_처리일시 = {현재시간KST}
    ↓
[Telegram] 성공 알림
    "✅ 강사회원 등업 완료: {성함} (아이디: {자사몰ID or 이메일})"

[수동 처리 공통 경로]
    ↓
[Airtable] 오류 상태 기록 (별도 필드 또는 메모)
    ↓
[Telegram] 수동 처리 요청
    "⚠️ 강사 등업 수동 확인 필요
    이름: {성함}
    자사몰ID: {자사몰ID or '미입력'}
    이메일: {이메일 or '미입력'}
    연락처: {연락처}
    → 메이크샵 관리자에서 직접 처리 후 Airtable n8n_처리완료 체크"
```

### 워크플로우 JSON 구조 (n8n-workflow-builder 에이전트 전달용)

```json
{
  "name": "FA-001: 에어테이블 강사회원 등급 자동 변경",
  "trigger": {
    "type": "scheduleTrigger",
    "interval": "*/5 * * * *"
  },
  "nodes": [
    "Airtable (레코드 조회: 승인완료 + 미처리 필터)",
    "IF (신규 건 존재 여부)",
    "Loop Over Items",
    "Code (식별 전략 결정: byId / byMobile / manual)",
    "Switch (3분기: byId / byMobile / manual)",
    "HTTP Request (메이크샵 user_id 조회)",
    "Code (연락처 포맷 정규화: 01XXXXXXXXX)",
    "HTTP Request (메이크샵 mobile 조회 — 폴백)",
    "Code (성함 일치 여부 확인)",
    "IF (회원 조회 성공 여부)",
    "HTTP Request (메이크샵 그룹 변경)",
    "Airtable (처리완료 업데이트: n8n_처리완료 + n8n_처리일시)",
    "Telegram (성공 알림)",
    "Telegram (수동 처리 요청 알림)",
    "Airtable (오류 상태 기록)"
  ]
}
```

---

## 5. 에어테이블 필드 추가 — API로 자동 생성

### 방법: 에어테이블 Metadata API (n8n에서 1회성 실행)

에어테이블 관리자 UI에 직접 들어가지 않고, n8n HTTP Request 노드로 필드를 생성할 수 있음.

**필요 권한**: Personal Access Token에 `schema.bases:write` 범위 추가 필요

#### 체크박스 필드 생성 (n8n_처리완료)

```
POST https://api.airtable.com/v0/meta/bases/app6MBsHo7AKwh5XD/tables/tblo1NVcundJjJKJ3/fields

Headers:
  Authorization: Bearer {PAT}
  Content-Type: application/json

Body:
{
  "name": "n8n_처리완료",
  "type": "checkbox",
  "options": {
    "icon": "check",
    "color": "greenBright"
  }
}
```

#### 날짜/시간 필드 생성 (n8n_처리일시)

```
POST https://api.airtable.com/v0/meta/bases/app6MBsHo7AKwh5XD/tables/tblo1NVcundJjJKJ3/fields

Headers:
  Authorization: Bearer {PAT}
  Content-Type: application/json

Body:
{
  "name": "n8n_처리일시",
  "type": "dateTime",
  "options": {
    "timeZone": "Asia/Seoul",
    "dateFormat": { "name": "iso" },
    "timeFormat": { "name": "24hour" }
  }
}
```

### PAT 권한 설정 방법

1. https://airtable.com/create/tokens 접속
2. 기존 토큰 수정 또는 신규 생성
3. 아래 권한 모두 추가:
   - `data.records:read` — 레코드 조회
   - `data.records:write` — 레코드 수정 (처리완료 기록용)
   - `schema.bases:write` — **필드 생성용 (신규 추가 필요)**
4. 앱 범위: `app6MBsHo7AKwh5XD` 선택

> **한 번만 실행하면 됨**: 필드가 생성되면 이후 FA-001 워크플로우에서 지속 사용 가능

---

## 6. 강사회원 그룹 코드 확인 방법 (API — Method B)

n8n HTTP Request 노드로 직접 조회:

```
URL: https://shop.makeshop.co.kr/list/open_api.html
Method: GET
Parameters:
  mode=search
  type=group
  key={메이크샵_오픈API_키}
```

또는 curl로 터미널에서 즉시 확인:
```bash
curl "https://shop.makeshop.co.kr/list/open_api.html?mode=search&type=group&key={API키}"
```

**응답 예시**:
```json
[
  { "group_code": "1", "group_name": "일반회원" },
  { "group_code": "2", "group_name": "우수회원" },
  { "group_code": "3", "group_name": "강사회원" }
]
```

> 응답에서 `group_name = "강사회원"` 인 행의 `group_code` 값을 메모
> → FA-001 워크플로우 JSON의 `group_change` 파라미터에 입력

---

## 7. 구현 체크리스트

### 사전 준비 (사용자 직접 확인)
- [ ] 메이크샵 관리자 > 회원관리 > 회원 등급/그룹에서 "강사회원" group_code 값 메모
- [ ] 에어테이블 Personal Access Token 발급
  - 경로: https://airtable.com/create/tokens
  - 권한: `data.records:read`, `data.records:write`, **`schema.bases:write`** (3개)
  - 앱 범위: `app6MBsHo7AKwh5XD`

### 필드 자동 생성 (1회성)
- [ ] n8n에서 HTTP Request 노드 2개로 필드 생성 실행 (Metadata API)
  - 또는 에어테이블 관리자 UI에서 직접 수동 추가 (더 빠름)
- [ ] `n8n_처리완료` (Checkbox) 필드 생성 확인
- [ ] `n8n_처리일시` (DateTime, Asia/Seoul) 필드 생성 확인

### n8n 설정
- [ ] Airtable Credential 등록 (Personal Access Token)
- [ ] 메이크샵 Credential 등록 (이미 있으면 재사용)
- [ ] FA-001 워크플로우 JSON 생성 (n8n-workflow-builder 에이전트 활용)
- [ ] 메이크샵 회원 조회 API 테스트 (자사몰 ID 1개로)
- [ ] 연락처 조회 폴백 테스트 (mobile 파라미터 포맷 확인)
- [ ] 그룹 변경 API 테스트 (테스트 계정으로)
- [ ] 수동 처리 알림 텔레그램 확인
- [ ] 전체 플로우 통합 테스트
- [ ] 서버 Import + 활성화

---

## 8. 비용 분석

| 항목 | 비용 |
|------|------|
| n8n 서버 | 0원 (오라클 클라우드 Free Tier) |
| 에어테이블 API | 무료 (Free 플랜 1,000건/월 충분) |
| 메이크샵 API | 시간당 500회 한도 (5분 폴링 = 월 8,640회 → 충분) |
| 텔레그램 알림 | 0원 |
| **합계** | **0원/월** |

---

## 9. 향후 확장 방안

- **반려 → 신청자에게 카카오 알림톡 발송** (FA-001b)
  - 에어테이블 진행 상태 = "반려" 감지 → 알림톡 발송 + 사유 기록
- **신청 접수 자동 확인 메시지** (FA-001c)
  - 에어테이블 신규 레코드 생성 시 → 신청자에게 "접수 확인" 알림톡
- **강사 DB → 노션 동기화** (FA-001d)
  - 등업 완료 시 노션 강사 DB에도 자동 기록 (강사 명단 관리)
