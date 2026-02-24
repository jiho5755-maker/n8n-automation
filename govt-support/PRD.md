# 정부지원사업 자동수집 시스템 PRD

> **작성일**: 2026-02-24
> **상태**: 설계 완료, 구현 대기
> **대상 시스템**: n8n self-hosted (Oracle Cloud, 158.180.77.201)
> **관련 프로젝트**: `homepage-automation/` (쇼핑몰 운영 자동화와 동일 서버 공유)

---

## 핵심 정보

**목적**: 정부 지원사업 공고를 매일 자동 수집하고, Gemini AI로 Pressco21(꽃/공예 도소매) 업종 적합성을 분석하여, 검토 가치가 있는 공고만 텔레그램으로 알림함으로써 담당자가 매일 직접 사이트를 돌아다니는 수고를 없앤다.

**사용자**: Pressco21 경영기획팀장 1인 (대표 아들). 정부 지원사업 신청 담당. 텔레그램 알림으로 업무 처리.

---

## 시스템 아키텍처 개요

```
[수집 소스]                [n8n 워크플로우]              [저장 + 알림]
기업마당 API    ──┐
K-Startup API  ──┤──> 수집 → 필터링 → AI 분석 ──> Airtable 저장
보조금24 API   ──┘                             ──> 텔레그램 알림
                          ↑
                   매일 07:00 스케줄
```

---

## 사용자 여정

1. 매일 오전 7시, n8n이 자동으로 3개 API에서 신규 공고 수집
   ↓

2. 지역 필터(서울/전국) + 제외 업종 필터 적용 (명백히 무관한 업종만 제거)
   ↓

3. Gemini AI가 Pressco21 적합성 점수(0~10점) + 한줄 이유 생성
   ↓

4. 점수별 분기 처리
   - 7점 이상 → 텔레그램 긴급 알림 (🔥) + Airtable 저장
   - 4~6점 → 텔레그램 검토 알림 (🧐) + Airtable 저장
   - 3점 이하 → Airtable 저장만 (알림 없음)
   ↓

5. 담당자가 텔레그램 알림 확인 → Airtable에서 상세 내용 열람 → 신청 여부 결정

---

## 수집 소스 상세

### Phase 1 (즉시 구현)

| 소스 | API 제공처 | 인증 방식 | 수집 대상 |
|------|-----------|----------|----------|
| **기업마당** | bizinfo.go.kr | API 키 (`FmSrV3` — 짧은 문자열, 정상 발급된 키) | 중소기업 지원사업 공고 |
| **K-Startup** | 공공데이터포털 | API 키 (디코딩 버전) | 창업 지원사업 공고 |
| **보조금24** | 공공데이터포털 | API 키 (K-Startup과 동일 키) | 정부 보조금 사업 공고 |

### Phase 2 (추후 확장)

| 소스 | API 제공처 | 수집 대상 |
|------|-----------|----------|
| **고용24** | 고용노동부 | 고용 지원, 육아휴직 관련 사업 |
| **소진공** | 소상공인진흥공단 | 소상공인 전용 지원사업 |

---

## 필터링 설계

### 사전 필터링 (AI 호출 전 — API 응답 단계에서 제거)

**원칙**: 최소 필터링 (넓은 그물로 수집 → Gemini AI가 정교하게 판단)

| 필터 항목 | 조건 | 이유 |
|----------|------|------|
| **허용 지역** | `서울`, `전국`, `수도권` 포함 | Pressco21 = 서울 송파구 소재 |
| **제외 업종** | `농업`, `어업`, `축산`, `임업` 4개만 명시 제외 | 명백히 무관한 업종만 제거, 나머지는 AI 판단 |
| **포함 키워드** | 비활성화 | 키워드 필터는 오탐이 많아 AI에 위임 |
| **모집 상태** | `접수중` 또는 `예정` | 마감된 공고는 수집 불필요 |

### AI 분석 (Gemini 2.0 Flash)

**적합성 점수 기준 (0~10점)**

| 점수 | 기준 | 알림 |
|------|------|------|
| 7~10점 | Pressco21 업종(꽃/공예/도소매)에 직접 해당하거나 소기업 일반 지원으로 신청 확실 | 🔥 긴급 검토 |
| 4~6점 | 일부 조건 해당, 검토 가치 있음 | 🧐 검토 권장 |
| 0~3점 | 업종 부적합 또는 규모 미달 | 저장만 |

**AI 프롬프트 설계**

```
다음 정부 지원사업 공고가 아래 회사에 적합한지 0~10점으로 평가하고,
한 줄 이유를 한국어로 설명해주세요.

[회사 정보]
- 상호: Pressco21 (foreverlove.co.kr)
- 업종: 꽃, 생활소품 온라인 도소매
- 상품: 압화, 드라이플라워, 프리저브드플라워, 레진공예, 하바리움, 식물표본
- 규모: 소기업, 직원 8인
- 소재지: 서울 송파구
- 사업자: 도소매업 등록

[공고 정보]
제목: {{공고명}}
주관기관: {{주관기관}}
지원 대상: {{지원대상}}
지원 내용: {{지원내용}}
지원 규모: {{지원규모}}
신청 기간: {{신청기간}}

[출력 형식 - JSON만 반환]
{
  "score": 숫자(0~10),
  "reason": "한 줄 이유 (30자 이내)"
}
```

---

## Airtable 스키마 설계

### 테이블명: `정부지원공고` (Base: `app6CynYU5qzIFyKl`)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `공고명` | Single line text | 지원사업 공고 제목 (Primary Field) |
| `공고ID` | Single line text | API에서 받은 고유 ID (중복 체크 기준) |
| `수집소스` | Single select | `기업마당` / `K-Startup` / `보조금24` / `고용24` / `소진공` |
| `주관기관` | Single line text | 공고를 주관하는 기관명 |
| `지원대상` | Long text | 신청 가능한 대상 조건 |
| `지원내용` | Long text | 지원 내용 요약 |
| `지원규모` | Single line text | 지원 금액 또는 규모 (예: "최대 5천만원") |
| `신청시작일` | Date | 접수 시작일 |
| `신청마감일` | Date | 접수 마감일 |
| `공고URL` | URL | 원문 공고 링크 |
| `AI점수` | Number | Gemini 적합성 점수 (0~10, 소수점 없음) |
| `AI분석이유` | Single line text | AI가 생성한 한 줄 평가 이유 |
| `알림분류` | Single select | `긴급검토` / `검토권장` / `저관련` |
| `처리상태` | Single select | `미검토` / `검토중` / `신청완료` / `미신청` / `기간만료` |
| `담당자메모` | Long text | 담당자가 직접 입력하는 메모 |
| `수집일시` | Date | n8n이 수집한 일시 |

**중복 체크 로직**: `공고ID` 필드로 Airtable 조회 → 이미 존재하면 저장 건너뜀

---

## n8n 워크플로우 노드 구성

### 워크플로우명: `정부지원사업_자동수집`

```
[1. Schedule Trigger]
  - 실행: 매일 07:00 (Cron: 0 7 * * *)
  - 수동 실행 지원 (n8n UI 테스트 버튼)
  ↓

[2-A. 기업마당 API 호출]           [2-B. K-Startup API 호출]          [2-C. 보조금24 API 호출]
  - HTTP Request 노드               - HTTP Request 노드                 - HTTP Request 노드
  - GET 기업마당 공고목록 API        - GET K-Startup 공고목록 API         - GET 보조금24 공고목록 API
  - 파라미터: pageIndex=1,          - 파라미터: serviceKey=디코딩키,      - 파라미터: serviceKey=디코딩키,
    pageSize=100,                     pageNo=1, numOfRows=100              page=1, perPage=100
    returnType=JSON
  ↓                                 ↓                                   ↓

[3. 응답 데이터 정규화 (각 소스별 Code 노드)]
  - 각 소스의 응답 구조가 다르므로 공통 스키마로 변환
  - 출력 공통 필드: id, title, org, target, content, amount,
                   startDate, endDate, url, source
  ↓

[4. 배열 합치기 (Merge 노드)]
  - 3개 소스 결과를 단일 배열로 병합
  ↓

[5. 사전 필터링 (Code 노드 또는 IF 노드)]
  - 지역 필터: title 또는 target에 서울/전국/수도권 포함
  - 제외 업종: target에 농업/어업/축산/임업만 포함된 경우 제거
  - 모집 상태: 마감일이 오늘 이전이면 제거
  - 출력: 필터 통과한 공고 목록
  ↓

[6. 중복 체크 (Code 노드)]
  - 각 공고의 id로 Airtable 조회
  - 이미 존재하는 공고는 배열에서 제거
  - 출력: 신규 공고만 포함한 배열
  ↓

[7. Airtable 중복 조회 (Airtable 노드)]
  - filterByFormula: {공고ID}="{{id}}" 형태로 조회
  - 존재 여부만 확인
  ↓

[8. Loop Over Items (Loop 노드)]
  - 신규 공고를 1건씩 순차 처리 (Gemini API rate limit 고려)
  ↓

[9. Gemini AI 분석 (HTTP Request 노드)]
  - POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
  - Authorization: Bearer {{GEMINI_API_KEY}}
  - 프롬프트: 위 프롬프트 설계 사용
  - 출력: score (0~10), reason (문자열)
  ↓

[10. AI 응답 파싱 (Code 노드)]
  - Gemini 응답에서 JSON 추출
  - score 기준 알림분류 결정
    - 7 이상 → "긴급검토"
    - 4~6 → "검토권장"
    - 0~3 → "저관련"
  ↓

[11. Airtable 저장 (Airtable 노드)]
  - Create Record
  - 공고명, 공고ID, 수집소스, 주관기관, 지원대상, 지원내용,
    지원규모, 신청시작일, 신청마감일, 공고URL, AI점수,
    AI분석이유, 알림분류, 처리상태(미검토), 수집일시 저장
  ↓

[12. 알림 분류 분기 (IF 노드)]
  - 조건 A: AI점수 >= 7 → [13-A] 긴급 알림
  - 조건 B: AI점수 4~6 → [13-B] 검토 알림
  - 그 외 → 저장만 (알림 없음)
  ↓

[13-A. 텔레그램 긴급 알림 (Telegram 노드)]
  [13-B. 텔레그램 검토 알림 (Telegram 노드)]
  - 아래 알림 포맷 참조
```

---

## 텔레그램 알림 포맷

### 긴급 검토 알림 (7점 이상)

```
🔥 <b>긴급 검토 필요</b>

<b>{{공고명}}</b>
주관: {{주관기관}}
AI 적합도: {{AI점수}}점 — {{AI분석이유}}

📋 지원 내용: {{지원내용 앞 100자}}
💰 지원 규모: {{지원규모}}
📅 마감일: {{신청마감일}} ({{마감일까지_남은일수}}일 남음)

🔗 <a href="{{공고URL}}">공고 원문 보기</a>
📊 <a href="https://airtable.com/{{baseId}}/{{tableId}}">Airtable에서 관리</a>

수집: {{수집소스}} | {{수집일시}}
```

### 검토 권장 알림 (4~6점)

```
🧐 <b>검토 권장</b>

<b>{{공고명}}</b>
주관: {{주관기관}}
AI 적합도: {{AI점수}}점 — {{AI분석이유}}

📅 마감일: {{신청마감일}} ({{마감일까지_남은일수}}일 남음)

🔗 <a href="{{공고URL}}">공고 원문 보기</a>

수집: {{수집소스}} | {{수집일시}}
```

### 일일 수집 요약 알림 (매일 07:10 — 전체 실행 완료 후)

```
📊 <b>정부지원사업 오늘의 수집 결과</b>

🔥 긴급 검토: {{긴급건수}}건
🧐 검토 권장: {{검토건수}}건
📁 저관련 저장: {{저관련건수}}건

총 신규 수집: {{총건수}}건 | 중복 제외: {{중복건수}}건

📊 <a href="https://airtable.com/{{baseId}}/{{tableId}}">Airtable 전체 보기</a>
```

---

## API 연동 상세

### 기업마당 API (bizinfo.go.kr)

```
엔드포인트: https://www.bizinfo.go.kr/uss/rss/bizSbizPublicDBList.do
메서드: GET
인증: API 키 파라미터 (crtfcKey=FmSrV3)
주요 파라미터:
  - crtfcKey: API 키
  - dataType: json
  - pageIndex: 페이지 번호 (1부터)
  - pageSize: 페이지당 건수 (최대 100)
응답 구조:
  - resultCode: 0000 (성공)
  - totalCount: 전체 건수
  - items: 공고 목록 배열
    - pblancId: 공고 고유 ID
    - pblancNm: 공고명
    - excInsttNm: 주관기관
    - pblanc_url: 공고 URL
    - reqstBeginDt: 신청 시작일
    - reqstEndDt: 신청 마감일

주의사항:
  - 하루 수집 목표: 50~100건 이내
  - 페이지네이션: 1페이지만 수집 (최신 100건)
  - 오류 코드 999: 서버 점검 중 → 재시도 스킵 처리
```

### K-Startup API (공공데이터포털)

```
엔드포인트: https://apis.data.go.kr/B490000/openKstartupApiService/getAnnoList
메서드: GET
인증: serviceKey (공공데이터포털 발급, URL 디코딩 버전 사용)
주요 파라미터:
  - serviceKey: 인증키 (디코딩 버전)
  - pageNo: 페이지 번호
  - numOfRows: 페이지당 건수 (최대 100)
  - returnType: JSON
응답 구조:
  - response.header.resultCode: 00 (성공)
  - response.body.items.item: 공고 목록 배열
    - sn: 고유 번호
    - prgrmNm: 공고명
    - instNm: 주관기관
    - reqstBeginDt: 신청 시작일
    - reqstEndDt: 신청 마감일
    - detailUrl: 상세 URL

주의사항:
  - 공공데이터포털 키는 인코딩/디코딩 2종 발급 → 디코딩 버전 사용
  - n8n HTTP Request 노드에서 URL 파라미터로 직접 삽입 시 추가 인코딩 금지
```

### 보조금24 API (공공데이터포털)

```
엔드포인트: https://apis.data.go.kr/B050015/subsidyService/getSubsidyList
메서드: GET
인증: serviceKey (K-Startup과 동일 공공데이터포털 키)
주요 파라미터:
  - serviceKey: 인증키 (디코딩 버전)
  - page: 페이지 번호
  - perPage: 페이지당 건수
  - cond[sttus::EQ]: 접수중 (상태 필터)
응답 구조:
  - data: 공고 목록 배열
    - servId: 서비스 고유 ID
    - servNm: 서비스명 (공고명)
    - jurMnofNm: 소관부처명
    - trgterIndvdlNm: 지원 대상
    - servDgstr: 서비스 요약
    - lifeArray: 생애주기 분류
    - sprtCycNm: 지원 주기

주의사항:
  - 보조금24는 상시 보조금과 공고형 사업이 혼재 → 신청 기간 있는 것만 필터
  - servId를 공고ID로 사용
```

---

## 환경 변수 설정 (n8n)

n8n 관리자 > Settings > Variables 에서 등록:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `GOVT_BIZINFO_API_KEY` | 기업마당 API 키 | `FmSrV3` |
| `GOVT_PUBLIC_DATA_KEY` | 공공데이터포털 API 키 (디코딩) | `abc123...` |
| `GEMINI_API_KEY` | Google AI Studio API 키 | `AIza...` |
| `TELEGRAM_BOT_TOKEN` | 텔레그램 봇 토큰 | `7713...` |
| `TELEGRAM_CHAT_ID` | 텔레그램 Chat ID | `7713811206` |
| `AIRTABLE_BASE_ID` | Airtable Base ID | `app6CynYU5qzIFyKl` |
| `AIRTABLE_API_KEY` | Airtable Personal Access Token | `pat...` |

---

## Gemini AI 비용 분석

| 항목 | 수치 | 비고 |
|------|------|------|
| 일일 수집 공고 수 (3개 소스) | 최대 300건 | 필터 후 실제 AI 분석 대상 |
| 건당 토큰 사용량 | 약 600 tokens | 프롬프트 400 + 응답 200 |
| 일일 총 토큰 사용량 | 약 180,000 tokens | 300건 × 600 tokens |
| Gemini 2.0 Flash 무료 한도 | 1,500 req/일, 1M tokens/일 | Google AI Studio 무료 티어 |
| **비용** | **0원** | 무료 한도 내 완전 무료 |

**주의**: 수집량이 크게 늘어 일 1,500건을 초과하면 다음날로 분산 처리 또는 유료 전환 검토.

---

## 구현 단계 (Phase 1)

### 1단계: 환경 준비 (30분)

1. n8n 관리자 > Settings > Variables 에서 환경 변수 7개 등록
2. Airtable Base `app6CynYU5qzIFyKl` 에 `정부지원공고` 테이블 신규 생성
3. 위 스키마 대로 필드 14개 생성 (타입 정확히 맞출 것)
4. Airtable Personal Access Token 발급 (airtable.com/create/tokens)
   - 권한: `data.records:read`, `data.records:write`
   - Base 범위: `app6CynYU5qzIFyKl`

### 2단계: API 연결 테스트 (1시간)

각 API를 n8n HTTP Request 노드로 단독 테스트:

```
테스트 체크리스트:
[ ] 기업마당 API — 응답 200, 공고 목록 수신 확인
[ ] K-Startup API — 응답 200, 공고 목록 수신 확인
[ ] 보조금24 API — 응답 200, 공고 목록 수신 확인
[ ] Gemini API — 응답 200, JSON 파싱 성공 확인
[ ] Airtable 저장 — 테스트 레코드 1건 저장 확인
[ ] Telegram 알림 — 테스트 메시지 수신 확인
```

### 3단계: 워크플로우 조립 (2~3시간)

노드 구성도 순서대로 조립:

1. Schedule Trigger 노드 추가 (07:00 Cron)
2. HTTP Request 3개 노드 병렬 추가 (기업마당, K-Startup, 보조금24)
3. Code 노드로 각 응답을 공통 스키마 변환
4. Merge 노드로 합치기
5. Code 노드로 사전 필터링 구현
6. Code 노드로 중복 체크 (Airtable 조회 포함)
7. Loop Over Items 노드 추가
8. HTTP Request 노드 (Gemini 분석)
9. Code 노드 (응답 파싱 + 알림분류 결정)
10. Airtable Create 노드
11. IF 노드 (점수 분기)
12. Telegram 노드 2개 (긴급/검토)
13. 집계 후 Telegram 요약 알림 노드 추가

### 4단계: 검증 및 배포 (30분)

```
검증 체크리스트:
[ ] 수동 실행 1회 — 전체 노드 오류 없이 완료
[ ] Airtable — 수집 결과 레코드 정상 저장 확인
[ ] Telegram — 점수별 알림 정상 수신 확인
[ ] 중복 실행 — 같은 공고가 두 번 저장되지 않음 확인
[ ] 스케줄 활성화 — 워크플로우 Active 토글 ON
[ ] 다음날 07:00 — 실제 자동 실행 확인
```

---

## 데이터 정규화 코드 (공통 스키마 변환)

각 소스의 응답 구조가 다르므로 Code 노드에서 다음 공통 형식으로 변환:

```javascript
// 공통 스키마 변환 예시 (기업마당)
// n8n Code 노드에서 사용
const items = $input.all();
const result = [];

for (const item of items) {
  const rawList = item.json?.items || [];
  for (const raw of rawList) {
    result.push({
      json: {
        id: raw.pblancId,
        title: raw.pblancNm,
        org: raw.excInsttNm,
        target: raw.trnsfBizSnnm || '',
        content: raw.intrcnMemo || '',
        amount: raw.intrcnMemo || '',
        startDate: raw.reqstBeginDt,
        endDate: raw.reqstEndDt,
        url: raw.pblanc_url,
        source: '기업마당'
      }
    });
  }
}

return result;
```

**K-Startup, 보조금24도 동일 구조로 변환, 필드명만 소스에 맞게 조정**

---

## 오류 처리 설계

| 오류 상황 | 처리 방법 |
|----------|----------|
| API 응답 실패 (타임아웃/5xx) | 해당 소스 건너뜀, 나머지 소스 계속 진행 |
| Gemini API 실패 | AI점수 -1, AI분석이유 "분석실패" 로 저장, 알림 없음 |
| Gemini JSON 파싱 실패 | 응답 텍스트에서 숫자 추출 시도, 실패 시 -1 처리 |
| Airtable 저장 실패 | 텔레그램으로 오류 알림 후 다음 건 계속 |
| Telegram 알림 실패 | 저장은 완료된 상태이므로 무시 (Airtable 확인) |
| 전체 워크플로우 실패 | n8n 기본 오류 알림 설정 (Settings > Execution) |

---

## 모니터링 및 유지보수

### 정기 점검 항목 (월 1회)

- Airtable `정부지원공고` 테이블에 레코드가 매일 추가되는지 확인
- 마감된 공고(신청마감일 경과) 처리상태 `기간만료`로 일괄 업데이트
- Gemini API 사용량 확인 (Google AI Studio 대시보드)
- n8n 실행 이력에서 실패 건 없는지 확인

### Airtable 뷰 설정 권장

| 뷰 이름 | 필터 | 정렬 |
|---------|------|------|
| 미검토 긴급 | 처리상태=미검토, 알림분류=긴급검토 | 신청마감일 오름차순 |
| 이번주 마감 | 신청마감일 7일 이내 | 신청마감일 오름차순 |
| 전체 이력 | 없음 | 수집일시 내림차순 |

---

## Phase 2 확장 계획

Phase 1 안정 운영 확인 후 (약 2주 후):

1. **고용24 API 추가**: 고용지원금, 육아휴직 지원 관련 공고 (직원 8인 규모에 적합)
2. **소진공 API 추가**: 소상공인 전용 지원사업 (도소매업 해당 가능성 높음)
3. **마감 임박 재알림**: 7점 이상 공고 중 마감 3일 전에 재알림 (별도 스케줄 워크플로우)
4. **월간 신청 현황 리포트**: 신청완료/미신청 건수 집계 텔레그램 리포트 (매월 1일)

---

## 관련 파일

```
homepage-automation/
  govt-support-prd.md          # 이 파일 — 정부지원사업 자동수집 시스템 PRD
  PRD.md                       # 쇼핑몰 운영 자동화 PRD
  CLAUDE.md                    # 쇼핑몰 자동화 프로젝트 컨텍스트
```

> 구현 시작 전 n8n 서버(158.180.77.201)에 SSH 접속하여 서버 상태와 Airtable 자격증명을 먼저 확인할 것.
