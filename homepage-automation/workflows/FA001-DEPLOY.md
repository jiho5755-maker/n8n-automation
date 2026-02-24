# FA-001 배포 가이드

> **순서대로 진행하면 30분 이내 완료**

---

## Step 1. 에어테이블 PAT 저장 (이미지 #3 완료 상태면 Skip)

https://airtable.com/create/tokens 에서 **Save changes** 클릭 → 토큰 값 복사해두기

---

## Step 2. n8n Airtable 자격증명 등록

n8n.pressco21.com → Settings → Credentials → New Credential

```
타입: Airtable Personal Access Token API
Token: {Step 1에서 복사한 PAT}
이름: Airtable PAT
```

등록 후 **Credential ID 메모** (숫자, 예: "3")

---

## Step 3. 셋업 워크플로우 실행 (1회성)

1. n8n에서 `fa001-setup-once.json` Import
2. 워크플로우 열고 아래 2곳 수정:
   - `에어테이블 체크박스 필드 생성` 노드 → `AIRTABLE_PAT_HERE` → 실제 PAT 값 입력
   - `에어테이블 날짜 필드 생성` 노드 → 동일하게 실제 PAT 값 입력
   - `메이크샵 그룹 목록 조회` 노드 → `MAKESHOP_API_KEY_HERE` → 실제 메이크샵 API 키 입력
3. **Test workflow** (상단 버튼) 클릭 → 수동 실행
4. 텔레그램으로 결과 수신:
   ```
   ✅ 에어테이블 필드 생성: n8n_처리완료, n8n_처리일시
   📋 메이크샵 그룹 목록:
     코드: 1 | 이름: 일반회원
     코드: 2 | 이름: 우수회원
     코드: 3 | 이름: 강사회원  ← 이 코드 메모
   ```
5. **강사회원 group_code 메모** (예: "3")
6. 이 셋업 워크플로우는 비활성화 상태 유지 (재사용 불필요)

---

## Step 4. 메인 워크플로우 설정

1. `fa001-instructor-upgrade.json` Import
2. 아래 3곳 수정:

| 위치 | 찾을 값 | 바꿀 값 |
|------|--------|--------|
| `메이크샵 회원 조회 (ID)` 노드 | `MAKESHOP_API_KEY_HERE` | 실제 메이크샵 API 키 |
| `메이크샵 회원 조회 (연락처)` 노드 | `MAKESHOP_API_KEY_HERE` | 실제 메이크샵 API 키 |
| `메이크샵 그룹 변경` 노드 | `INSTRUCTOR_GROUP_CODE_HERE` | Step 3에서 메모한 코드 (예: "3") |
| `메이크샵 그룹 변경` 노드 | `MAKESHOP_API_KEY_HERE` | 실제 메이크샵 API 키 |

3. `승인완료 미처리 조회` 노드 → Credential 드롭다운 → `Airtable PAT` 선택
4. `에어테이블 처리완료 기록` 노드 → 동일하게 Credential 선택

---

## Step 5. 테스트 실행

1. 에어테이블 강사공간에서 테스트 레코드 생성:
   - 성함: 테스트유저
   - 자사몰 ID: {본인 메이크샵 테스트 아이디}
   - 진행 상태: 승인완료
   - n8n_처리완료: 체크 해제
2. n8n 워크플로우 **Test workflow** 클릭
3. 실행 결과 확인:
   - 텔레그램에 "✅ 강사회원 등업 완료" 메시지 수신
   - 에어테이블 레코드의 `n8n_처리완료` 체크 확인
   - 메이크샵에서 해당 회원의 그룹이 강사회원으로 변경됐는지 확인

---

## Step 6. 활성화

테스트 성공 후 워크플로우 **Active** 토글 ON

이제 매 5분마다 자동으로 신규 승인완료 건을 처리합니다.

---

## 워크플로우 처리 흐름 요약

```
에어테이블 승인완료 감지 (5분마다)
  ↓
자사몰 ID 있음 → 메이크샵 직접 조회 → 찾음 → 그룹 변경 → 완료
                                     → 못 찾음 → 연락처로 2차 시도 → 성함 확인 → 그룹 변경 → 완료
                                                                              → 불일치 → 수동 처리 알림
자사몰 ID 없음 → 연락처로 조회 → 성함 확인 → 그룹 변경 → 완료
                              → 불일치/실패 → 수동 처리 알림
```

---

## 트러블슈팅

| 증상 | 확인 사항 |
|------|---------|
| Airtable 조회 오류 | PAT 권한 확인 (schema.bases:write 포함 여부) |
| 메이크샵 조회 실패 | API 키 확인, 허용 IP에 n8n 서버 IP 추가 여부 |
| 그룹 변경 실패 | group_code 값 확인, 메이크샵 API 수정 권한 확인 |
| 텔레그램 미수신 | Telegram Bot credential ID 확인 (기존 "1") |
| 필드 이미 존재 오류 | 셋업 워크플로우 정상 동작 — 무시해도 됨 |
