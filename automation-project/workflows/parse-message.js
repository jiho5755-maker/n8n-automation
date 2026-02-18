/**
 * 텔레그램 메시지 파싱 로직
 * n8n Code 노드에서 사용
 *
 * 입력 형식: "프로젝트명 - 할 일 내용 @날짜키워드"
 * 출력: { project, todo, date, dateLabel }
 */

// n8n Code 노드에서는 $input.first().json 으로 메시지를 받음
// 이 파일은 테스트 및 참조용 독립 모듈

/**
 * 날짜 키워드를 실제 Date 객체로 변환
 * @param {string} keyword - "@오늘", "@내일", "@2/25" 등
 * @param {Date} baseDate - 기준 날짜 (기본: 오늘)
 * @returns {{ date: Date, label: string }}
 */
function parseDateKeyword(keyword, baseDate) {
  const now = baseDate || new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!keyword) {
    return { date: today, label: formatDateLabel(today) };
  }

  const clean = keyword.replace('@', '').trim();

  // @오늘
  if (clean === '오늘') {
    return { date: today, label: formatDateLabel(today) };
  }

  // @내일
  if (clean === '내일') {
    const d = addDays(today, 1);
    return { date: d, label: formatDateLabel(d) };
  }

  // @모레
  if (clean === '모레') {
    const d = addDays(today, 2);
    return { date: d, label: formatDateLabel(d) };
  }

  // @다음주
  if (clean === '다음주') {
    const d = addDays(today, 7);
    return { date: d, label: formatDateLabel(d) };
  }

  // @월, @화, @수, @목, @금, @토, @일
  const dayMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0 };
  if (dayMap[clean] !== undefined) {
    const targetDay = dayMap[clean];
    const currentDay = today.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7; // 이미 지난 요일이면 다음 주
    const d = addDays(today, diff);
    return { date: d, label: formatDateLabel(d) };
  }

  // @2/25, @3/1 등 (M/D 형식)
  const dateMatch = clean.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10) - 1;
    const day = parseInt(dateMatch[2], 10);
    let year = today.getFullYear();
    const d = new Date(year, month, day);
    // 이미 지난 날짜면 내년으로
    if (d < today) {
      d.setFullYear(year + 1);
    }
    return { date: d, label: formatDateLabel(d) };
  }

  // 파싱 실패 시 오늘
  return { date: today, label: formatDateLabel(today) };
}

/**
 * 날짜를 표시용 라벨로 변환
 * @param {Date} date
 * @returns {string} "2/18(화)" 형식
 */
function formatDateLabel(date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dayName = days[date.getDay()];
  return `${m}/${d}(${dayName})`;
}

/**
 * 날짜를 ISO 형식 문자열로 변환 (Notion API용)
 * @param {Date} date
 * @returns {string} "2026-02-18"
 */
function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 날짜에 일수 더하기
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 텔레그램 메시지를 파싱
 * @param {string} text - 원본 메시지
 * @param {Date} [baseDate] - 기준 날짜 (테스트용)
 * @returns {{ project: string|null, todo: string, dateISO: string, dateLabel: string, raw: string }}
 */
function parseMessage(text, baseDate) {
  const raw = text.trim();

  // 날짜 키워드 추출 (@으로 시작하는 마지막 토큰)
  const dateRegex = /@(\S+)\s*$/;
  const dateMatch = raw.match(dateRegex);
  let dateKeyword = null;
  let textWithoutDate = raw;

  if (dateMatch) {
    dateKeyword = dateMatch[0]; // "@내일" 등
    textWithoutDate = raw.replace(dateRegex, '').trim();
  }

  // 프로젝트명과 할 일 분리 (" - " 구분자)
  let project = null;
  let todo = textWithoutDate;

  const separatorIndex = textWithoutDate.indexOf(' - ');
  if (separatorIndex !== -1) {
    project = textWithoutDate.substring(0, separatorIndex).trim();
    todo = textWithoutDate.substring(separatorIndex + 3).trim();
  }

  // 날짜 파싱
  const parsed = parseDateKeyword(dateKeyword, baseDate);

  return {
    project: project,
    todo: todo,
    dateISO: formatDateISO(parsed.date),
    dateLabel: parsed.label,
    raw: raw
  };
}

// === n8n Code 노드용 래퍼 ===
// 아래 주석 블록을 n8n Code 노드에 복사하여 사용

/*
// ===== n8n Code 노드: 메시지 파싱 =====
// 위의 함수들을 모두 포함한 후 아래 코드 실행

const message = $input.first().json.message;
const text = message.text || '';
const chatId = message.chat.id;

// 커맨드 체크
if (text.startsWith('/')) {
  return [{
    json: {
      type: 'command',
      command: text.split(' ')[0],
      args: text.substring(text.indexOf(' ') + 1).trim(),
      chatId: chatId
    }
  }];
}

// 일반 메시지 파싱
const result = parseMessage(text);
return [{
  json: {
    type: 'message',
    ...result,
    chatId: chatId
  }
}];
*/

// === 테스트 코드 (Node.js에서 직접 실행 가능) ===
if (typeof module !== 'undefined' && require.main === module) {
  const testDate = new Date(2026, 1, 18); // 2026-02-18 (수요일)

  const tests = [
    // 기본 형식
    { input: '자사몰 리뉴얼 - 상세페이지 디자인 검토 @내일', expected: { project: '자사몰 리뉴얼', todo: '상세페이지 디자인 검토' }},
    // 날짜 없이
    { input: '자사몰 리뉴얼 - 메인 배너 수정', expected: { project: '자사몰 리뉴얼', todo: '메인 배너 수정' }},
    // 프로젝트 없이
    { input: '세금계산서 발행', expected: { project: null, todo: '세금계산서 발행' }},
    // 요일 키워드
    { input: '견적서 자동화 - 3월분 견적서 @금', expected: { project: '견적서 자동화', todo: '3월분 견적서' }},
    // 날짜 직접 지정
    { input: '자사몰 리뉴얼 - 결제 테스트 @2/25', expected: { project: '자사몰 리뉴얼', todo: '결제 테스트' }},
    // @오늘
    { input: '회의 준비 @오늘', expected: { project: null, todo: '회의 준비' }},
    // @모레
    { input: '마케팅 - 뉴스레터 발송 @모레', expected: { project: '마케팅', todo: '뉴스레터 발송' }},
    // @다음주
    { input: '인사 - 면접 일정 조율 @다음주', expected: { project: '인사', todo: '면접 일정 조율' }},
  ];

  console.log('=== 메시지 파싱 테스트 ===\n');

  tests.forEach((test, i) => {
    const result = parseMessage(test.input, testDate);
    const projectOk = result.project === test.expected.project;
    const todoOk = result.todo === test.expected.todo;
    const pass = projectOk && todoOk;

    console.log(`${pass ? 'PASS' : 'FAIL'} [${i + 1}] "${test.input}"`);
    console.log(`  프로젝트: ${result.project} | 할 일: ${result.todo}`);
    console.log(`  날짜: ${result.dateISO} (${result.dateLabel})`);
    if (!pass) {
      console.log(`  기대: project=${test.expected.project}, todo=${test.expected.todo}`);
    }
    console.log('');
  });

  // 날짜 키워드 개별 테스트
  console.log('=== 날짜 파싱 테스트 ===\n');
  const dateTests = [
    { keyword: null, expected: '2026-02-18' },
    { keyword: '@오늘', expected: '2026-02-18' },
    { keyword: '@내일', expected: '2026-02-19' },
    { keyword: '@모레', expected: '2026-02-20' },
    { keyword: '@다음주', expected: '2026-02-25' },
    { keyword: '@금', expected: '2026-02-20' },  // 수→금 = +2
    { keyword: '@월', expected: '2026-02-23' },  // 수→월 = +5
    { keyword: '@일', expected: '2026-02-22' },  // 수→일 = +4
    { keyword: '@2/25', expected: '2026-02-25' },
    { keyword: '@3/1', expected: '2026-03-01' },
  ];

  dateTests.forEach((test, i) => {
    const result = parseDateKeyword(test.keyword, testDate);
    const dateStr = formatDateISO(result.date);
    const pass = dateStr === test.expected;
    console.log(`${pass ? 'PASS' : 'FAIL'} [${i + 1}] ${test.keyword || '(없음)'} → ${dateStr} (${result.label}) ${!pass ? '기대: ' + test.expected : ''}`);
  });
}

// 모듈 내보내기 (테스트용)
if (typeof module !== 'undefined') {
  module.exports = { parseMessage, parseDateKeyword, formatDateISO, formatDateLabel };
}
