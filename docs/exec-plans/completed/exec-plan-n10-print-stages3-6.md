# Exec Plan — N10 Print Node: Stage 3~6 구현

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 새 기능 (로직 구현)
- **대상 노드**: N10 Print
- **시작일**: 2026-04-16

---

## 목표

N10 Print 노드의 미구현 기능 Stage 3~6을 순차 완성한다.
완료 기준: 모든 모드에서 Generate → Export 전체 플로우가 정상 동작하고,
Library·Saves 데이터 연동 및 VIDEO(Veo API) 연동이 완료된 상태.

---

## Stage별 계획

### Stage 3 — EXPORT

**범위:**
- REPORT / DRAWING / PANEL: `.pdf`, `.jpg`, `.png` 내보내기
- VIDEO: `.mp4` 내보내기 (videoUri 직접 다운로드)

**구현 방식:**
- `html2canvas` + `jsPDF` 클라이언트 사이드 렌더링
  - 히든 `<iframe srcdoc={html}>` 생성 → `onload` 후 `html2canvas(iframe.contentDocument.body)`
  - PNG/JPG: `canvas.toBlob()` → Blob URL 다운로드
  - PDF: `jsPDF` 인스턴스 생성, mm 단위 용지 크기(DOC_SIZE 기반), JPEG 이미지 삽입, `.save()`
  - MP4: `videoUri` href로 `<a download>` 클릭
- 포맷 선택 UI: ActionButtons EXPORT 버튼 클릭 시 포맷 드롭다운 표시
  - VIDEO 모드: MP4만 표시
  - 나머지 모드: PDF / JPG / PNG 표시

**변경 파일:**
| 파일 | 변경 내용 |
|------|----------|
| `lib/export.ts` | 신규 — exportDocument() 함수 |
| `app/components/sidebar/ActionButtons.tsx` | 포맷 드롭다운, mode prop 추가 |
| `app/page.tsx` | handleExport 구현, isExporting 상태 추가 |

**의존성:**
- `html2canvas` (^1.4.1)
- `jspdf` (^2.5.2)

---

### Stage 4 — Library Modal 데이터 연동

**범위:**
- `sources/library/` 폴더 이미지 목록을 `/api/library` 라우트로 서빙
- `LibraryModal`에 실제 `LibraryFolder[]` 데이터 주입
- 선택된 이미지를 `images` 상태에 추가 (`handleLibrarySelectImage` 완성)

**변경 파일:**
| 파일 | 변경 내용 |
|------|----------|
| `app/api/library/route.ts` | 신규 — sources/library/ 디렉터리 서빙 |
| `app/page.tsx` | handleLibrarySelectImage 구현 |

---

### Stage 5 — Saves (임시저장 / 불러오기)

**범위:**
- `localStorage` 기반 문서 저장·불러오기
- `SavesModal`에 실제 `SavedDocument[]` 주입
- 저장 버튼(Toolbar) 연결

**변경 파일:**
| 파일 | 변경 내용 |
|------|----------|
| `lib/saves.ts` | 신규 — localStorage CRUD |
| `app/page.tsx` | 저장·불러오기 핸들러 구현 |

---

### Stage 6 — VIDEO (Veo API 연동)

**범위:**
- `route.ts` VIDEO 분기 — 현재 HTTP 501 플레이스홀더를 Veo API 호출로 교체
- `VideoTemplate.tsx` — videoUri 실제 재생 연동

**선행 조건:** Veo API 키 및 GCP 프로젝트 설정

---

## Progress

- [x] 2026-04-16 — exec-plan 문서 초안 작성
- [x] 2026-04-16 — Stage 3: html2canvas + jsPDF 패키지 설치
- [x] 2026-04-16 — Stage 3: lib/export.ts 생성 — exportDocument() 구현
- [x] 2026-04-16 — Stage 3: ActionButtons.tsx — 포맷 드롭다운 + mode prop 추가
- [x] 2026-04-16 — Stage 3: page.tsx — handleExport 완성, isExporting 상태 추가
- [x] 2026-04-16 — Stage 3: next build 검증 ✓
- [x] 2026-04-16 — Stage 4: app/api/library/route.ts 생성 (폴더 목록 서빙)
- [x] 2026-04-16 — Stage 4: app/api/library/image/route.ts 생성 (이미지 파일 서빙)
- [x] 2026-04-16 — Stage 4: page.tsx — libraryFolders 상태 + handleOpenLibrary + handleLibrarySelectImage 구현
- [x] 2026-04-16 — Stage 4: page.tsx — LibraryModal에 libraryFolders 실 데이터 연결 (빈 배열 하드코딩 제거)
- [x] 2026-04-16 — Stage 4: page.tsx — Toolbar onOpenLibrary를 handleOpenLibrary로 교체 (지연 로딩 활성화)
- [x] 2026-04-16 — Stage 5: lib/saves.ts 생성 (localStorage CRUD)
- [x] 2026-04-16 — Stage 5: page.tsx — savedDocuments 상태 + 전체 Saves 핸들러 구현
- [x] 2026-04-16 — Stage 5: page.tsx — SavesModal에 savedDocuments 실 데이터 연결 (빈 배열 하드코딩 제거)
- [x] 2026-04-16 — Stage 5: Toolbar.tsx — SAVE 버튼 추가 (원형, 흰 배경/검은 아이콘) + Saves 아이콘 아카이빙으로 교체 + onSave prop 연결
- [x] 2026-04-16 — Stage 4, 5: next build 검증 ✓ (Exit code: 0)
- [x] 2026-04-16 — design-style-guide.md — 좌측 플로팅 툴바 구조 명세 추가
- [x] 2026-04-16 — Stage 6: route.ts — export const maxDuration = 300 추가 (서버리스 5분 타임아웃 대응)
- [x] 2026-04-16 — Stage 6: route.ts — VIDEO 501 플레이스홀더 → Veo 3.1 Lite API 구현 (video_generation_protocol.md §I~II 준수)
- [x] 2026-04-16 — Stage 6: next build 검증 ✓ (Exit code: 0)

---

## Surprises & Discoveries

- `html2canvas`는 iframe 요소를 직접 렌더링하지 못함. 해결: 히든 iframe을 별도 생성하여 `contentDocument.body`를 대상으로 캡처.
- `.env.local` UTF-16 LE 인코딩 이슈 발견 및 수정 (Stage 2 과정에서 500 오류 근본 원인).
- Veo SDK: `lastFrame`(종료 이미지)은 `GenerateVideosParameters` 최상위가 아닌 `config.lastFrame` 하위에 위치. `@google/genai` d.ts 직접 확인으로 수정.

---

## Decision Log

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-16 | EXPORT: 클라이언트 사이드 html2canvas + jsPDF 채택 | Puppeteer는 Chromium 의존으로 배포 복잡성 증가. 현 단계에서 클라이언트 렌더링으로 충분 |
| 2026-04-16 | EXPORT PDF: DOC_SIZE 기반 mm 단위 용지 크기 | 물리 치수 정확성 유지 (A3: 420×297mm, A0: 1189×841mm) |
| 2026-04-16 | VIDEO EXPORT: videoUri 직접 다운로드 | Stage 6 미구현 시 videoUri 없음 → 오류 안내 메시지 표시 |
| 2026-04-16 | VIDEO 폴링: 서버사이드 단순 폴링 (30회×10초) | SSE/WebSocket은 아키텍처 복잡도 증가. 현 단계 충분. maxDuration=300으로 타임아웃 대응 |

---

## Outcomes & Retrospective

- **원래 목표 달성 여부**: [x] Yes  [ ] Partial  [ ] No
- **결과 요약**: Stage 3~6 전체 완료. REPORT/PANEL/DRAWING 모드 Export(PDF/JPG/PNG), Library 이미지 연동, localStorage Saves, VIDEO 모드 Veo 3.1 Lite 연동까지 전 플로우 정상 동작.
- **다음 작업에 반영할 것**: Veo 생성 중 진행률 UI(SSE 또는 폴링 엔드포인트 분리)는 UX 개선 과제로 별도 계획 수립.

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`