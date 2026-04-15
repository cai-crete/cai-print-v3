# Error Review Report — v.4

> **검토 일자**: 2026-04-15  
> **검토 대상**: Google 에이전트 구현 결과물 (N10 print 노드 1차 구현)  
> **검토 범위**: `project.10_print/app/api/print/route.ts`, `app/page.tsx`, `sources/document_template/VideoTemplate.tsx`, `.env.local`  
> **이전 보고서**: `Error_Review_Report-v.3-260415.md`  
> **상태**: CRITICAL-1 / HIGH-1 / HIGH-2 / MEDIUM-1 → 이번 세션에서 수정 완료

---

## 요약

| 심각도 | 건수 | 이번 세션 처리 |
|---|---|---|
| CRITICAL | 1 | 수정 완료 |
| HIGH | 2 | 수정 완료 |
| MEDIUM | 4 | 1건 수정, 3건 보류 |
| LOW | 2 | 보류 |
| **합계** | **9** | **4건 수정** |

---

## CRITICAL

### [CRITICAL-1] API 키 환경 변수 불일치 — 전체 API 호출 불가

| 항목 | 내용 |
|---|---|
| **위치** | `project.10_print/app/api/print/route.ts:7`, `project.10_print/.env.local` |
| **상태** | ✅ 수정 완료 |

**문제**  
`@google/genai` v1.50.1 SDK는 환경 변수 자동 감지 시 `GEMINI_API_KEY`를 읽는다.  
`.env.local`에는 `GOOGLE_AI_API_KEY`로 정의되어 있었고, `route.ts`는 `new GoogleGenAI()` 인자 없이 초기화했다.  
결과: 모든 Gemini API 호출이 API 키 없이 전송 → 401 인증 오류.

**원인**  
구글 에이전트가 SDK 공식 문서의 환경 변수명(`GEMINI_API_KEY`)이 아닌 임의 이름(`GOOGLE_AI_API_KEY`)으로 설정하고,  
SDK 자동 감지를 신뢰한 채 실제 키 연결을 검증하지 않았다.

**수정**  
`route.ts`를 `new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })` 명시적 전달로 변경.  
`.env.local` 변수명은 그대로 유지하고 SDK 자동 감지 의존을 제거했다.

---

## HIGH

### [HIGH-1] Generate 버튼 미동작 — 정적 와이어프레임

| 항목 | 내용 |
|---|---|
| **위치** | `project.10_print/app/page.tsx` |
| **상태** | ✅ 수정 완료 |

**문제**  
구현된 `page.tsx`는 시각적 레이아웃만 존재하는 정적 컴포넌트였다.

- `Generate {mode}` 버튼에 `onClick` 핸들러 없음
- 이미지 업로드 영역이 `<div>`만 있고 실제 `<input type="file">`이 없음
- `images`, `prompt`, `pageCount`, `result`, `loading` 상태 모두 부재
- API 호출 로직 없음
- Canvas 영역에 결과 렌더링 없음

**수정**  
- `useState`로 `images / prompt / pageCount / result / loading / error` 상태 추가
- `<input type="file" multiple accept="image/*">` + `useRef`로 업로드 연결
- `handleGenerate()`: `FormData` 조립 → `fetch('/api/print')` → 결과 상태 업데이트
- Canvas: `result.html`을 `dangerouslySetInnerHTML`로 렌더링 / VIDEO는 `<VideoTemplate>` 사용
- 버튼: `loading` 중 비활성화 + 텍스트 변경

---

### [HIGH-2] VideoTemplate.tsx — tsconfig 제외 경로

| 항목 | 내용 |
|---|---|
| **위치** | `project.10_print/sources/document_template/VideoTemplate.tsx` |
| **상태** | ✅ 수정 완료 |

**문제**  
`project.10_print/tsconfig.json`은 `"exclude": ["sources"]`를 포함한다.  
`sources/document_template/VideoTemplate.tsx`는 TypeScript 컴파일 대상에서 제외되어  
`app/page.tsx`에서 `import VideoTemplate from '@/sources/...'` 시 타입 오류 + 번들링 불가.

**수정**  
`sources/document_template/VideoTemplate.tsx` → `app/components/VideoTemplate.tsx` 이동.  
원본 파일 삭제.

---

## MEDIUM

### [MEDIUM-1] VIDEO 모드 — 존재하지 않는 Mock URL 반환 ✅ 수정 완료

| 항목 | 내용 |
|---|---|
| **위치** | `project.10_print/app/api/print/route.ts:63-68` |
| **상태** | ✅ 수정 완료 |

**문제**  
VIDEO 분기가 `videoUri: 'https://storage.googleapis.com/veo-mock/demo.mp4'`를 반환했다.  
이 URL은 실제로 존재하지 않아 VideoTemplate 컴포넌트에서 재생 실패.  
주석 처리된 Veo API 코드는 SDK 지원 여부가 불확실하여 활성화 불가.

**수정**  
HTTP 501 Not Implemented 응답으로 교체. 메시지: "VIDEO 모드는 현재 준비 중입니다 (Veo API 연동 예정)".  
실패하는 Mock보다 명확한 미구현 응답이 안전하다.

---

### [MEDIUM-2] `any[]` 타입 — TypeScript strict 위반 ⏸ 보류

| 항목 | 내용 |
|---|---|
| **위치** | `project.10_print/app/api/print/route.ts:33` |
| **상태** | ⏸ 보류 (비차단, 다음 Loop B 사이클) |

`const contentsParts: any[] = []` — @google/genai SDK의 `Part` 타입으로 교체 필요.  
SDK 타입 export 구조 확인 후 처리.

---

### [MEDIUM-3] RELIABILITY.md / SECURITY.md 부재 ⏸ 보류

| 항목 | 내용 |
|---|---|
| **위치** | `docs/references/` |
| **상태** | ⏸ 보류 (Loop B 실제 진입 시 작성) |

`SKILL.md`의 Loop B Phase V3.5 Step 4 교차검증이 이 두 문서를 기준으로 동작한다.  
두 파일이 존재하지 않으면 Verification Agent가 교차검증 단계를 수행할 수 없다.  
Loop B 진입 전에 `docs/references/RELIABILITY.md`, `docs/references/SECURITY.md` 작성 필요.

---

### [MEDIUM-4] exec-plan — Google 에이전트 작업 미기록 ✅ 수정 완료

| 항목 | 내용 |
|---|---|
| **위치** | `docs/exec-plans/active/exec-plan-loop-system.md:Phase 2` |
| **상태** | ✅ 수정 완료 |

Google 에이전트가 수행한 작업(`route.ts`, `page.tsx` 완성, `VideoTemplate.tsx`, `.env.local`)이  
exec-plan에 기록되지 않았다. 이번 세션에서 Phase 2 이력에 추가했다.

---

## LOW

### [LOW-1] 이미지 MIME 타입 미검증 ⏸ 보류

| 항목 | 내용 |
|---|---|
| **위치** | `project.10_print/app/api/print/route.ts` |
| **상태** | ⏸ 보류 (다음 Loop B 사이클) |

`file.type`을 검증 없이 Gemini API로 전달한다. 지원 타입(jpeg/png/webp/gif) 외 파일 업로드 시  
API 오류가 발생할 수 있다. `page.tsx`의 `<input accept="image/jpeg,...">` 클라이언트 제한으로  
부분 완화되나, 서버 측 검증이 없어 직접 API 호출 시 취약하다.

---

### [LOW-2] exec-plan Outcomes 섹션 미작성 ⏸ 보류

| 항목 | 내용 |
|---|---|
| **위치** | `docs/exec-plans/active/exec-plan-loop-system.md:Outcomes` |
| **상태** | ⏸ 보류 (작업 완료 후 작성) |

작업 완료 전이므로 보류. Loop B DEPLOYMENT APPROVED 후 작성.

---

## 이번 세션 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `project.10_print/app/api/print/route.ts` | CRITICAL-1 (API 키 명시), MEDIUM-1 (VIDEO 501) |
| `project.10_print/app/page.tsx` | HIGH-1 (기능 완전 연결) |
| `project.10_print/app/components/VideoTemplate.tsx` | HIGH-2 (신규 위치) |
| `project.10_print/sources/document_template/VideoTemplate.tsx` | HIGH-2 (삭제) |
| `docs/exec-plans/active/exec-plan-loop-system.md` | MEDIUM-4 (이력 추가) |

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`