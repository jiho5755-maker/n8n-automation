# 카카오 채널 + 오픈빌더 고도화 전략

> **작성일**: 2026-02-24
> **목적**: 유명무실한 카카오 채널을 실질적인 고객 접점 + 매출 채널로 고도화
> **보유 자산**: 카카오 채널 (이미 개설 완료), 메이크샵 알림톡 연결됨

---

## 현황 분석

| 항목 | 현재 상태 | 목표 |
|------|----------|------|
| 카카오 채널 친구 수 | 소수 (유명무실) | 구매 고객 자동 유입 |
| 알림톡 발송 | 이미 활용 중 | 유지 (메이크샵 자체) |
| 챗봇 | 없음 | 오픈빌더 FAQ + 스킬서버 |
| 1:1 채팅 | 수동 응대 | CS 접수 창구로 활용 |
| 소식 발행 | 없음 | 정기 마케팅 발행 |
| 자사몰 상담 버튼 | 채널톡 단독 | **채널톡 + 카카오 통합 단일 버튼** |

---

## 핵심 UX 전략 — 자사몰 상담 버튼 통일

### 문제 상황

현재 자사몰에 채널톡 채팅 버튼이 있고, 카카오 챗봇을 별도로 추가하면
**버튼이 2개**가 되어 고객이 어디로 가야 할지 혼란스러움.

### 해결책: 하나의 버튼, 두 가지 경로

```
[자사몰 플로팅 버튼 — 하나만]
        ↓ 클릭
[선택 패널 팝업]
  ┌─────────────────────────────┐
  │  💬 실시간 상담 (채널톡)       │  ← 영업시간: 바로 연결
  │  담당자와 즉시 채팅하기          │    비영업시간: 채널톡 오프라인 메시지
  ├─────────────────────────────┤
  │  🤖 자동 안내 (카카오 챗봇)     │  ← 24시간: 주문조회, FAQ, 강사신청 등
  │  주문조회 · 배송 · FAQ         │
  └─────────────────────────────┘
```

### 역할 분담

| 채널 | 담당 | 운영 시간 |
|------|------|---------|
| **채널톡** | 실시간 상담 (복잡한 문의, 불만 처리) | 영업시간 (담당자 직접 응대) |
| **카카오 챗봇** | 단순 조회/FAQ 자동화 | 24시간 (AI 자동 응답) |

### 구현 방법 (메이크샵 공통 HTML)

```html
<!-- 기존 채널톡 버튼을 숨기고 커스텀 통합 버튼으로 대체 -->
<style>
  /* 채널톡 기본 버튼 숨김 */
  #ch-plugin { display: none !important; }

  /* 통합 상담 버튼 */
  .contact-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    font-family: sans-serif;
  }
  .contact-fab__btn {
    width: 56px; height: 56px;
    background: #FEE500; /* 카카오 노란색 */
    border-radius: 50%;
    border: none; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-size: 24px;
  }
  .contact-fab__panel {
    display: none;
    position: absolute;
    bottom: 68px; right: 0;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    overflow: hidden;
    width: 220px;
  }
  .contact-fab__panel.open { display: block; }
  .contact-fab__item {
    display: flex; align-items: center; gap: 12px;
    padding: 16px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    text-decoration: none; color: #333;
  }
  .contact-fab__item:last-child { border-bottom: none; }
  .contact-fab__item:hover { background: #f9f9f9; }
  .contact-fab__icon { font-size: 24px; }
  .contact-fab__label small { display: block; font-size: 11px; color: #888; }
</style>

<div class="contact-fab">
  <button class="contact-fab__btn" onclick="toggleFab()" title="상담하기">💬</button>
  <div class="contact-fab__panel" id="fabPanel">
    <!-- 실시간 상담 → 채널톡 -->
    <a class="contact-fab__item" href="javascript:void(0)" onclick="openChannelTalk()">
      <span class="contact-fab__icon">👩‍💼</span>
      <span class="contact-fab__label">
        실시간 상담
        <small>담당자 직접 연결</small>
      </span>
    </a>
    <!-- 자동 안내 → 카카오 챗봇 -->
    <a class="contact-fab__item" href="https://pf.kakao.com/@{채널명}" target="_blank">
      <span class="contact-fab__icon">🤖</span>
      <span class="contact-fab__label">
        자동 안내
        <small>주문조회 · FAQ · 강사신청</small>
      </span>
    </a>
  </div>
</div>

<script>
(function() {
  function toggleFab() {
    document.getElementById('fabPanel').classList.toggle('open');
  }
  function openChannelTalk() {
    if (window.ChannelIO) {
      window.ChannelIO('showMessenger');
    }
    document.getElementById('fabPanel').classList.remove('open');
  }
  // 외부 클릭 시 패널 닫기
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.contact-fab')) {
      document.getElementById('fabPanel').classList.remove('open');
    }
  });
  // 전역 노출 (onclick 속성에서 호출)
  window.toggleFab = toggleFab;
  window.openChannelTalk = openChannelTalk;
})();
</script>
```

> **메이크샵 적용 경로**: 관리자 > 디자인 > 공통 HTML > `</body>` 위에 삽입
> **메이크샵 주의**: JS `\${variable}` 형태 템플릿 리터럴 사용 금지 (가상 태그 충돌)

### 영업 외 시간 UX

```
채널톡 클릭 시 (영업 외 시간):
  → 채널톡 오프라인 자동 메시지: "영업시간은 평일 10시~17시입니다.
    문의를 남기시면 순서대로 답변드립니다."
  → 또는 카카오 챗봇으로 안내 문구 추가:
    "빠른 답변이 필요하시면 카카오 챗봇을 이용해보세요!"
```

---

## 고도화 단계별 전략

### Phase A — 기반 구축 (즉시, ~2주)

#### A-1. 카카오 채널 프로필 완성
- [ ] 채널 소개 문구 최적화 (웨딩기프트/답례품 전문몰 명확화)
- [ ] 프로필 이미지 + 배경 이미지 업데이트
- [ ] 운영 시간 + 자동 부재 메시지 설정
- [ ] 채널 URL 단축: `pf.kakao.com/@{채널명}` 공유용

#### A-2. 친구 유입 루트 확보
고객이 카카오 채널을 추가하게 만드는 모든 접점에 CTA 삽입:

| 접점 | 방법 |
|------|------|
| 메이크샵 주문 완료 문자 | "카카오채널 추가 시 할인 쿠폰 제공" 문구 + 채널 URL |
| 메이크샵 알림톡 하단 | 채널 친구 추가 버튼 (카카오 알림톡 버튼 기능) |
| 자사몰 하단 푸터 | 카카오 채널 추가 배너 |
| 포장지/박스 동봉 카드 | QR코드로 채널 추가 유도 |
| 인스타그램 바이오 | 채널 링크 추가 |

#### A-3. 오픈빌더 연결
- [ ] i.kakao.com 에서 오픈빌더 접속
- [ ] 카카오 채널과 챗봇 연결
- [ ] 웰컴 블록 설정 (처음 채팅 시 자동 인사)
- [ ] 기본 메뉴 설정 (채팅방 하단 바로가기 메뉴)

#### A-4. 자사몰 통합 상담 버튼 교체 (개발 필요)
- [ ] 메이크샵 공통 HTML에서 기존 채널톡 단독 버튼 숨김 처리
- [ ] 통합 FAB 버튼 삽입 (위 [핵심 UX 전략] 코드 참조)
  - 실시간 상담 → 채널톡 (영업시간 직접 연결)
  - 자동 안내 → 카카오 챗봇 (24시간)
- [ ] 카카오 채널 URL (`pf.kakao.com/@{채널명}`) 확인 후 코드에 입력
- [ ] 모바일/PC 양쪽 테스트

---

### Phase B — FAQ 챗봇 구축 (1~2주)

#### B-1. 지식+ (FAQ) 구축
**방법**: 엑셀 파일 업로드만으로 FAQ 챗봇 완성 (개발 불필요)

**FAQ 카테고리 설계**:

```
웰컴 블록:
  "안녕하세요! 웨딩기프트/답례품 전문 쇼핑몰입니다.
  무엇을 도와드릴까요?"

  [빠른 메뉴 버튼]
  📦 상품 문의  |  🚚 배송 조회  |  💳 주문/결제
  🔄 교환/반품  |  👩‍🏫 강사 신청  |  📞 상담원 연결
```

**엑셀 FAQ 구성 (60개+)**:

| 카테고리 | 질문 예시 | 답변 요지 |
|---------|---------|---------|
| 상품 문의 | 구성품이 어떻게 되나요? | 상품별 구성품 안내 |
| 상품 문의 | 커스텀/개인화 가능한가요? | 이름 각인, 리본 문구 등 안내 |
| 상품 문의 | 대량 주문 가능한가요? | 견적 문의 방법 안내 |
| 상품 문의 | 웨딩 납기일 맞출 수 있나요? | 납기 기준 안내 |
| 배송 | 배송 기간이 얼마나 걸리나요? | 평균 2~3일, 제작 상품 별도 |
| 배송 | 빠른 배송 가능한가요? | 당일/익일 배송 조건 안내 |
| 주문/결제 | 무통장 입금 계좌가 어떻게 되나요? | 계좌 안내 |
| 주문/결제 | 주문 취소하려면 어떻게 하나요? | 취소 방법 안내 |
| 교환/반품 | 교환/반품 기준이 어떻게 되나요? | 기준 안내 |
| 교환/반품 | 불량품이 왔어요 | 처리 방법 안내 |
| 강사 신청 | 강사 신청은 어떻게 하나요? | 신청 방법 + 링크 |
| 강사 신청 | 강사 회원 혜택이 뭔가요? | 혜택 안내 |

#### B-2. 시나리오 챗봇 구축 (드래그앤드롭)

**주요 시나리오**:

```
[상품 문의 시나리오]
상품 문의 클릭
  ├── 커스텀/개인화 문의
  │     → 주문서 작성 방법 안내 + 자사몰 링크
  ├── 대량 주문 (20개 이상)
  │     → 견적서 요청 방법 안내 + 채널 1:1 문의 유도
  ├── 웨딩 납기 문의
  │     → 납기 기준 설명 + 날짜 확인 요청
  └── 기타 상품 문의
        → 상담원 연결 (채널 1:1 채팅)

[강사 신청 시나리오]
강사 신청 클릭
  → 강사회원 혜택 설명
  → 신청 조건 안내 (자격증/협회 증빙 필요)
  → 신청 방법:
      1. 에어테이블 신청서 링크 전달
      2. 증빙서류 업로드 안내
  → "신청 후 영업일 기준 2~3일 내 처리됩니다"

[상담원 연결]
→ 오픈빌더 내 "상담원 연결" 클릭
→ 자사몰 통합 버튼에서 [실시간 상담] 선택 안내 메시지 출력
   "더 빠른 상담을 원하시면 홈페이지 채팅 버튼 > [실시간 상담]을 이용해주세요"
→ 운영 외 시간: 카카오 채널 1:1 채팅으로 문의 남기면 다음 영업일 연락 안내
→ (카카오 채널 1:1 채팅은 채널톡과 병행 — 운영자가 두 채널 모두 확인)
```

---

### Phase C — 스킬서버 연동 (n8n Webhook, ~2주)

#### C-1. 주문/배송 조회 자동화

**5초 타임아웃 대응 전략** (카카오 오픈빌더 고정 제한):

```
방법 1 (권장): 캐시 방식
  → 메이크샵 주문 데이터를 n8n으로 미리 수집 → 노션/DB 캐시
  → 챗봇 조회 시 캐시에서 즉시 응답 (< 1초)
  → 캐시는 매 30분 자동 갱신

방법 2: 즉시 응답 후 알림
  → "조회 중입니다" 즉시 반환 (< 1초)
  → 별도 n8n 워크플로우에서 API 조회 후 알림톡으로 결과 전달
```

**구현 흐름**:
```
고객: "주문 조회해줘" 클릭
→ 오픈빌더: 주문번호 입력 요청
→ 고객: 주문번호 입력
→ 오픈빌더 스킬서버 → n8n Webhook
→ n8n: 메이크샵 주문 조회 API (캐시 우선, 없으면 직접 조회)
→ 5초 이내 JSON 응답
→ 오픈빌더: 주문 상태 + 운송장번호 + 배송 현황 표시
```

#### C-2. n8n 스킬서버 Webhook 구성

```
Webhook URL: https://n8n.pressco21.com/webhook/{skillServer}
Method: POST
응답 형식: 카카오 오픈빌더 스킬 응답 JSON

예시 응답:
{
  "version": "2.0",
  "template": {
    "outputs": [
      {
        "simpleText": {
          "text": "주문번호: {주문번호}\n상태: 배송중\n운송장: 1234567890\n택배사: CJ대한통운"
        }
      }
    ]
  }
}
```

#### C-3. 구현 예정 스킬

| 스킬 | 입력 | 출력 | 구현 난이도 |
|------|------|------|-----------|
| 주문 조회 | 주문번호 | 주문 상태 + 운송장 | ★★★ |
| 배송 추적 | 주문번호 | 실시간 배송 현황 | ★★★ |
| 적립금 조회 | 휴대폰번호 (본인인증) | 적립금 잔액 | ★★★★ |
| 강사 신청 접수 | 이름 + 이메일 | 신청서 URL 전달 | ★★ |

---

### Phase D — 마케팅 채널 활성화 (지속적)

#### D-1. 카카오 채널 소식 (무료 발행)

**발행 일정 (월 2~4회)**:

| 콘텐츠 유형 | 발행 시점 | 내용 |
|-----------|---------|------|
| 신상품 소식 | 신상 출시 시 | 신상품 소개 + 구매 링크 |
| 시즌 프로모션 | 웨딩 성수기 전 | 봄/가을 웨딩 시즌 기획전 안내 |
| 기념일 쿠폰 | 발렌타인/어버이날 등 | 쿠폰 발급 안내 |
| 강사 모집 | 분기별 | 강사 신청 모집 안내 |
| 고객 후기 | 수시 | 좋은 리뷰 SNS 감성으로 재가공 |

#### D-2. 알림톡 → 채널 친구 유입 자동화

메이크샵 알림톡에 채널 추가 버튼 삽입:
- 주문 확인 알림톡에 `[카카오채널 친구추가]` 버튼
- 버튼 클릭 → 채널 친구 추가 → 웰컴 쿠폰 발급

#### D-3. 통합 버튼 + 카카오 채널 연계 공지

통합 FAB 버튼 도입 후 자사몰 곳곳에 카카오 채널 친구추가 유도:
- 자사몰 헤더/푸터에 카카오 채널 친구추가 배너
- 주문 완료 페이지: "카카오채널 추가 시 주문 현황을 바로 조회할 수 있어요"
- 채널 추가 QR 코드 (포장 동봉 카드 + 인스타그램 스토리)

---

## 구현 우선순위 (추천 순서)

```
즉시 (Phase A) — 설정 + 코드 삽입:
1. 채널 프로필 완성 + 운영 정보 입력
2. 오픈빌더 연결 + 웰컴 블록 작성
3. 기본 메뉴 버튼 설정 (상품문의/배송조회/상담원연결)
4. 자사몰 통합 FAB 버튼 교체 (채널톡+카카오 통합)

1~2주 (Phase B) — 엑셀 업로드만:
4. 지식+ FAQ 60개 작성 후 엑셀 업로드
5. 주요 시나리오 4~5개 구성 (드래그앤드롭)

2~4주 (Phase C) — n8n 개발 필요:
6. 주문/배송 조회 스킬서버 n8n Webhook 구현
7. 강사 신청 스킬서버 구현

지속적 (Phase D):
8. 월 2~4회 채널 소식 발행
9. 알림톡 버튼에 채널 친구추가 추가
```

---

## KPI 목표

| 지표 | 목표 | 기간 |
|------|------|------|
| 채널 친구 수 | 구매 고객의 30% 이상 | 3개월 |
| FAQ 자동 해결률 | 전체 문의의 50% | 2개월 |
| 챗봇 월 사용자 | 100명+ | 3개월 |
| CS 처리 시간 단축 | 30% 감소 | 2개월 |

---

## n8n 연동 설계 (Phase C 상세)

### 스킬서버 워크플로우

```
[Webhook Trigger] POST /webhook/kakao-skill
    ↓
[Code] 카카오 요청 파싱
    → action.parameters에서 주문번호 추출
    ↓
[HTTP Request] 메이크샵 주문 조회 API
    GET type=order, order_no={주문번호}
    ↓
[IF] 주문 존재 여부 확인
    ↓ 있음
[HTTP Request] 운송장으로 배송 추적 (선택)
    ↓
[Code] 카카오 스킬 응답 JSON 생성
    version: "2.0"
    template.outputs[0].simpleText
    ↓
[Respond to Webhook] 5초 이내 응답
```

### 주의: 5초 타임아웃 대응

```javascript
// 캐시 전략: 노션에 주문 데이터 미리 저장
// 챗봇 조회 시 노션 먼저 조회 → 없으면 메이크샵 직접 호출
// 노션 조회: ~200ms / 메이크샵 직접: ~800ms → 둘 다 5초 이내

// 응답 형식
const response = {
  version: "2.0",
  template: {
    outputs: [{
      simpleText: {
        text: `📦 주문 현황\n주문번호: \${orderNo}\n상태: \${status}\n운송장: \${trackingNo}\n택배사: \${courier}`
      }
    }],
    quickReplies: [
      { label: "처음으로", action: "block", blockId: "welcome_block_id" }
    ]
  }
};
```

---

## 관련 파일

| 파일 | 용도 |
|------|------|
| `ROADMAP.md` | Phase 8 챗봇 도입 계획 |
| `alimtalk-templates.md` | 알림톡 → 채널 친구추가 버튼 추가 가이드 |
| `fa001-instructor-upgrade.md` | 카카오 챗봇 강사신청 시나리오 연동 상세 |
| `.claude/agents/n8n-workflow-builder.md` | 스킬서버 워크플로우 JSON 생성 |
| `.claude/agents/makeshop-code-reviewer.md` | 통합 FAB 버튼 코드 삽입 전 검증 |
