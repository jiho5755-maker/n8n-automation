# 업무 일정 자동화 프로젝트

## 현재 진행 상황
- **Phase**: Phase 1 인프라 대기 중 (Oracle Cloud 비밀번호 찾기 후 로그인 필요)
- **완료**: 서버 설정 파일 + n8n 워크플로우 JSON 3개 + 파싱 로직
- **텔레그램 봇**: @Pressco21_bot (Pressco_bot), Chat ID: 7713811206, 토큰 검증 완료
- **Notion Integration**: 4개 DB 연결 완료, API 테스트 통과
- **PRD**: `PRD.md` (전체 기획서)
- **체크리스트**: `CHECKLIST.md` (단계별 진행 추적)
- **서버 설정 파일**: `server-config/` (배포 준비 완료)
- **워크플로우 파일**: `workflows/` (Import 준비 완료)

## 프로젝트 요약
노션 "업무 일정 관리" 템플릿을 활용하여, 텔레그램 봇/구글 캘린더로 빠르게
업무를 입력하면 n8n이 자동으로 노션 DB에 정리해주는 24/7 무료 시스템 구축.

## 핵심 구성
- **서버**: Oracle Cloud Free Tier ARM (영구 무료)
- **자동화**: n8n (Docker, self-hosted)
- **입력 채널**: 텔레그램 봇, 구글 캘린더
- **데이터**: Notion API (할 일, 프로젝트, 캘린더, 업무 카테고리 DB)
- **비용**: 월 0원

## 노션 DB ID 참조
- 업무 카테고리: `30bd119f-a669-8138-8e1f-f78839bf277c`
- 프로젝트: `30bd119f-a669-81e2-a747-f9002c0a9910`
- 할 일: `30bd119f-a669-81d0-8730-d824b7bc948c`
- 캘린더: `30bd119f-a669-812c-8bf4-fe603e6a8c6b`
- 노션 대시보드: https://www.notion.so/30bd119fa669816da857eaf0d2be4207

## 구현 순서
1. Phase 1: Oracle Cloud 서버 + n8n 배포 + HTTPS
2. Phase 2: 텔레그램 봇 → 노션 할 일 자동 등록
3. Phase 3: 구글 캘린더 동기화 + 모닝 브리핑 + 밀린 업무 알림

## 다음 단계
1. Oracle Cloud 비밀번호 찾기 → 로그인
2. ARM 인스턴스 생성 (체크리스트 1-2부터)
3. 서버 세팅 → n8n 배포 → 워크플로우 Import

## 주요 파일
```
automation-project/
  PRD.md                      # 전체 기획서 (기능 명세 포함)
  CHECKLIST.md                # 단계별 체크리스트
  CLAUDE.md                   # 이 파일 (컨텍스트)
  server-config/
    docker-compose.yml        # n8n + PostgreSQL Docker 설정
    .env.example              # 환경 변수 템플릿
    nginx-n8n.conf            # Nginx 리버스 프록시 설정
    setup.sh                  # 서버 초기 설정 스크립트
  workflows/
    README.md                 # Import 가이드
    telegram-todo-bot.json    # [F1] 텔레그램 봇 워크플로우
    morning-briefing.json     # [F3] 모닝 브리핑 워크플로우
    overdue-alert.json        # [F4] 밀린 업무 알림 워크플로우
    parse-message.js          # 텍스트 파싱 로직 (참조/테스트용)
```
