# Node Spec — print (N10)

> 파일명: `N10-print.md`
> Protocol 버전 업 시 하단 `## Protocol 버전 History` 섹션에 변경 내용을 기록합니다.

---

## 노드 개요

| 항목 | 내용 |
|------|------|
| Node ID | N10 |
| 이름 | print |
| Phase | 4 |
| Protocol 버전 | v1 (예정 — Loop A 통과 후 확정) |

---

## 단독 역할

건축 프로젝트의 이미지 세트를 입력받아, 하이브리드 분류·OCR 파싱·M3 내러티브 생성을 통해 출판 가능한 수준의 건축 산출물(Report / Panel / Drawing / Video)로 자동 포맷팅한다.

## 플랫폼 역할

10-노드 파이프라인의 최종 노드(N10)로서, N01~N09에서 생성된 모든 산출물(투시도·도면·다이어그램·영상)을 증명서 형식으로 통합·완결한다.

---

## 입력 계약 (Input Contract)

| 항목 | 타입 | 필수 여부 | 설명 |
|------|------|----------|------|
| `images` | `File[]` | 필수 | Category A/B/C 이미지 세트. 최소 1장. |
| `mode` | `"REPORT" \| "PANEL" \| "DRAWING" \| "VIDEO"` | 필수 | 출력 문서 유형 선택. VIDEO 모드는 정확히 2장 필요. |
| `pageCount` | `number` | 필수 (REPORT/PANEL), DRAWING·VIDEO 비활성화 | 생성할 페이지 수. DRAWING은 단일 페이지 고정. VIDEO 모드 시 비활성화. |
| `prompt` | `string` | 선택 | 프로젝트 테마·강조 지시. 미입력 시 M3 분석 결과로 대체. |

**IMAGE 분류 기준 (Hybrid Taxonomy):**

| 범주 | 유형 | 기본 점수 |
|------|------|----------|
| Category A | 조감도(L1), 투시도(L2), 렌더링 | 80 |
| Category B | 도면: 평면·단면·입면·배치도(L3) | 60 |
| Category C | 다이어그램, 분석도(L4) | 20 |

**VIDEO 모드 입력 예시:**
```
images: [start_image.jpg, end_image.jpg]  // 순서대로 시작·종료 프레임
mode: "VIDEO"
prompt: "고층 오피스 외부에서 로비 내부로 진입하는 동선"
```

**REPORT 모드 입력 예시:**
```
images: [perspective-1.jpg, plan-1.jpg, diagram-1.jpg, section-1.jpg]
mode: "REPORT"
pageCount: 4
prompt: ""   // 미입력 시 M3 자동 분석
```

---

## 출력 계약 (Output Contract)

| 항목 | 타입 | 설명 |
|------|------|------|
| `html` | `string` | 완성된 HTML 문서. 브라우저에서 직접 렌더링·PDF 출력 가능. |
| `slotMapping` | `object` | 이미지 슬롯 ID ↔ 파일명 매핑 테이블. |
| `masterData` | `object` | OCR로 확정된 마스터 데이터 (프로젝트명, 설계자, 스케일 등). |
| `videoUri` | `string \| null` | VIDEO 모드 시 생성된 MP4 스트림 URI. 타 모드에서는 null. |

**출력 템플릿 사이즈:**

| 모드 | 템플릿 파일 | 페이지 크기 |
|------|------------|------------|
| REPORT | `Report_template.html` | A3 Landscape (420 × 297mm) |
| PANEL | `Panel_template.html` | A0 Landscape (1189 × 841mm) / A0 Portrait (841 × 1189mm) |
| DRAWING | `DrawingSpecification_template.html` | A3 Landscape (420 × 297mm), 도각 40mm |
| VIDEO | `VideoTemplate.tsx` | MP4, 8초, Veo 3.1 lite |

**REPORT 출력 예시 (slotMapping):**
```json
{
  "html": "<html>...</html>",
  "slotMapping": {
    "hero-main": "perspective-1.jpg",
    "page2-img1": "plan-1.jpg",
    "page3-img1": "diagram-1.jpg"
  },
  "masterData": {
    "projectName": "Lindemans Brewery",
    "designer": "A2D Architecture",
    "scale": "1:100"
  },
  "videoUri": null
}
```

---

## 소스 파일 구조 (sources/)

`project.10_print/sources/`는 **개발 참조용 소스 파일 보관소**다. 운영 코드가 아니며, 개발 단계별로 참조·변환·적용 대상이 된다. Agent는 이 디렉토리의 파일을 임의로 재구성하거나 삭제하지 않는다.

| 디렉토리 | 역할 | Agent 행동 기준 |
|----------|------|----------------|
| `sources/document_template/` | 문서 모드별 참조 HTML. `Report_template.html`, `Panel_template.html`, `DrawingSpecification_template.html` 3종. 서비스 코드(Next.js 컴포넌트)로 변환하기 위한 원본 설계도. | 직접 수정 금지. 서비스 코드 구현 시 참조만 한다. |
| `sources/fonts/` | 서비스에 직접 적용 가능한 폰트 에셋. Pretendard, NotoSansKR, KoPub, GmarketSans, SCDream 등 36종 (.ttf/.otf). 폰트 선택 기능 구현 시 이 파일들을 그대로 임포트한다. | 파일 추가·삭제 금지. 폰트 선택 UI 옵션은 이 목록을 기준으로 구성한다. |
| `sources/library/` | 라이브러리 모달 기능 개발용 더미 이미지 데이터. A/B/C/V 카테고리 폴더 및 프로젝트명 폴더 혼재는 의도된 구조다. 추후 이미지 아카이빙 모달 및 폴더링 기능 개발 시 테스트 데이터로 사용. | 구조 재편성 금지. 더미 데이터임을 인지하고 실제 카테고리 분류 로직 설계의 참조 샘플로만 사용한다. |

---

## Protocol 구성

> 파일명 규칙 및 버전 관리 기준: `docs/design-docs/protocol-design-guide.md §5`

| 파일 | 유형 | 상태 |
|------|------|------|
| `_context/protocol/protocol-print-v1.txt` | Principle Protocol | 작성 완료 (2026-04-14) |
| `_context/protocol/ai_generation_protocol-v3.2.md` | Knowledge Doc (Principle Protocol 재작성 전 참조용) | 존재 — Principle Protocol 재작성 전까지 참조 문서로 사용 |
| `_context/protocol/video_generation_protocol.md` | Knowledge Doc (VIDEO 모드 전용) | 존재 |
| `_context/protocol/writer/PROMPT_건축작가.txt` | Knowledge Doc (작가 스타일 지침) | 존재 |

**buildSystemPrompt() 조합 규칙:**

| 모드 | 주입 구성 |
|------|----------|
| REPORT / PANEL | Principle Protocol + `ai_generation_protocol-v3.2.md` + `PROMPT_건축작가.txt` |
| DRAWING | Principle Protocol + `ai_generation_protocol-v3.2.md` (OCR 파싱 중심) |
| VIDEO | Principle Protocol + `video_generation_protocol.md` |

> **N10 API 아키텍처 특이사항**: N10은 Claude API를 사용하지 않는다. 모든 생성은 Google API로 수행된다.
> - **REPORT / PANEL / DRAWING**: `buildSystemPrompt()` 결과를 Gemini API(`gemini-2.5-pro`)의 `systemInstruction`으로 전달하여 HTML 문서 및 텍스트 슬롯을 생성한다.
> - **VIDEO**: `buildSystemPrompt()` 결과를 Veo API(`models/veo-3.1-lite-generate-preview`)의 생성 프롬프트로 전달하여 영상을 생성하고 `videoUri`를 반환한다.

---

## 컴플라이언스 체크리스트

`QUALITY_SCORE.md`의 공통 체크리스트를 기반으로 N10 전용 항목을 추가합니다.

```
Protocol Compliance (PCS):
[ ] Pre-Step: 이미지 하이브리드 분류 실행 여부 (A/B/C 카테고리 + L1~L4 위계)
[ ] Step 1: OCR 파싱 실행 여부 (L3 도면에서 프로젝트명·스케일·설계자 추출)
[ ] Step 2: 마스터 데이터 확정 여부 (최빈값 채택, 상충 시 "" 반환)
[ ] Step 3: 이미지 슬롯 배치 여부 (모드별 우선순위 규칙 준수)
[ ] Step 4: M3 내러티브 생성 여부 (Macro-Meso-Micro 3단계 분석)
[ ] Step 5: 역방향 매칭 검사 실행 여부 (Vision Tags ↔ 텍스트 일치)
[ ] Compliance Check 섹션 실행 여부

Immutable Constants:
[ ] 이미지 슬롯 HTML 구조 보존 여부 (템플릿 레이아웃 파손 없음)
[ ] 빈 슬롯 "" 반환 여부 (미배치 슬롯에 임의 콘텐츠 삽입 없음)
[ ] 브랜딩 보호: 'No11. print' 등 시스템 명칭 노출 없음
[ ] VIDEO 모드 시 구조적 무결성 프롬프트 강제 주입 여부

Boundary Resolution:
[ ] 입력 이미지 부족 시 (1장) Hero 슬롯에만 배치, 나머지 "" 반환 여부
[ ] VIDEO 모드 이미지 2장 미충족 시 에러 반환 여부 (생성 차단)
[ ] OCR 판독 불가 항목 "" 반환 여부 (임의 추측 금지)
[ ] 저품질/저해상도 이미지 중립 처리 여부

Output-Specific:
[ ] REPORT: Hero Page가 최고 점수 L1 또는 L2로 선정됐는가
[ ] REPORT: 페이지 간 논리 브릿지(Logic Bridge) 구성 여부
[ ] PANEL: 좌측 상단 슬롯에 최고 점수 이미지 배치 여부
[ ] DRAWING: 도각 마스터 데이터 전역 동기화 여부
[ ] VIDEO: STRUCTURAL INTEGRITY 프롬프트 포함 여부
[ ] 모든 텍스트: 주관적 형용사('아름다운', '조화로운') 배제 여부
[ ] LOD 제어: 슬롯 물리적 줄 수(Line Count) 초과 없음
```

---

## 알려진 실패 패턴

> `docs/design-docs/protocol-design-guide.md §6` 오염 패턴 카탈로그에 포함되지 않은 N10 전용 패턴만 기록합니다.

| 패턴 | 재현 조건 | 처방 |
|------|----------|------|
| **레이아웃 파손 (Layout Overflow)** | 텍스트 분량을 글자 수 기준으로만 제어 시 슬롯 높이 초과 | Protocol Step에 글자 수 대신 물리적 줄 수(Line Count) 기준 강제 명시 |
| **수량 불일치 (Quantity Mismatch)** | 텍스트 내 "두 가지 특징" 등 수량 표현이 실제 배치 이미지 수와 불일치 | Compliance Check에 수량 표현 ↔ 실제 슬롯 수 1:1 검사 항목 추가 |
| **OCR 노이즈 전파** | 단일 도면의 오타·약자가 마스터 데이터에 반영됨 | Step 2에서 최빈값 채택 후 전역 동기화 강제, 단일 도면 데이터 직접 주입 금지 |
| **VIDEO 구조 변형** | 건축 형태가 영상 내 모핑되거나 왜곡됨 | STRUCTURAL INTEGRITY 시스템 프롬프트 누락 여부를 Compliance Check에서 검증 |
| **Hero 이미지 저품질 선정** | 단순 Priority Score 합산으로 저해상도 L1이 Hero 선정됨 | Step 3에서 선예도·안정성·깊이 질적 판정 지표 우선 적용 명시 |

---

## Protocol 버전 History

| 버전 | 날짜 | 변경 이유 | Stage B 결과 |
|------|------|----------|-------------|
| v1 | 2026-04-14 | 초기 작성. Loop A 자가 검증 PASS (CHECK 1~4 전체 통과, Failure Mode 5개). | — |

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
