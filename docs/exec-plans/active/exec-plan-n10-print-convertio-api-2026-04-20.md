# Exec Plan — N10 print DXF 전용 이미지 전처리 및 4개 포맷 EXPORT

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 새 기능 (DXF Export) 및 조건부 이미지 전처리
- **대상 노드**: N10 (print)
- **시작일**: 2026-04-20

---

## 목표

- `DRAWING` 모드에서 **PDF, JPG, PNG, DXF** 추출을 지원합니다.
- **포맷별 차별화 로직**:
    - **PDF, JPG, PNG**: 기존과 동일하게 템플릿 전체(텍스트, 라인 포함)를 전처리 없이 추출합니다.
    - **DXF**: 도면 내부의 **이미지만 전처리(Threshold)**하여 배경 해치를 제거한 후, 도각/텍스트를 포함한 전체 도면을 DXF로 변환합니다.

---

## 상세 계획 및 단계별 요약

### 1단계: 환경 설정 및 라이브러리 설치
- `sharp` 라이브러리 설치 완료 및 확인.
- `lib/types.ts`의 `ExportFormat` 정의 확인.

### 2단계: UI 연동 (ActionButtons)
- `ActionButtons.tsx`에서 `DRAWING` 모드일 때 4가지 확장명(PDF, JPG, PNG, DXF)이 모두 드롭다운에 표시되도록 수정합니다.

### 3단계: 클라이언트 사이드 DXF 전용 전처리 로직 구현 (`export.ts`)
- `exportDocument` 함수 수정:
    - `format === 'dxf'` 인 경우:
        1. 캡처용 히든 iframe 내의 이미지 요소를 찾습니다.
        2. 해당 이미지를 서버(`/api/preprocess`)로 보내 Thresholding된 결과(Base64/Blob)를 받거나, 클라이언트 Canvas에서 직접 처리합니다. (서버 처리가 더 고품질일 수 있으므로 전처리용 API 활용 고려)
        3. 전처리된 이미지로 원본을 교체한 상태에서 `html2canvas` 전체 캡처를 수행합니다.
        4. 결과 결과물을 서버의 `/api/convert`로 전송합니다.

### 4단계: 서버 사이드 API 구현
- **`/api/convert/route.ts`**:
    - 클라이언트에서 이미 전처리된 이미지가 포함된 도면 캡처본(JPG/PDF)을 수신합니다.
    - 이를 Convertio API에 전달하여 DXF로 최종 변환 및 반환합니다.
- **`/api/preprocess/route.ts` (선택 사항)**:
    - 이미지 부분만 따로 던져서 고품질 Thresholding을 수행하는 전처리 전용 API입니다.

### 5단계: 검증 및 테스트
- PDF/JPG/PNG 추출 시 원본 품질이 유지되는지 확인합니다.
- DXF 추출 시 배경 패턴이 제거된 선명한 도면이 포함되는지 확인합니다.

---

## Progress

- [x] 2026-04-20 — 시스템 분석 및 요구사항 정밀화 (DXF 전용 전처리)
- [ ] 2026-04-20 — UI 및 export 로직 수정 착수

---

## Surprises & Discoveries

- [발견 내용 기록 예정]

---

## Decision Log

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-20 | DXF 전용 부분 전처리 도입 | JPG/PNG/PDF는 원본 템플릿 디자인 보존이 중요하며, DXF는 CAD 호환성을 위한 선 추출이 핵심이기 때문 |
| 2026-04-20 | 임계값 고정 처리 | 사용자 요청에 따라 별도의 UI 없이 최적의 고정값 적용 |

---

## 위험성 및 대책

- **이미지 교체 시점**: `html2canvas` 호출 전 iframe 내 이미지 로딩이 완료되어야 합니다. `waitForIframeLoad` 로직을 강화합니다.
- **Convertio 변환 한계**: 이미지 기반 DXF 변환 시 텍스트가 벡터가 아닌 패스로 변환될 수 있습니다. 고해상도 캡처를 통해 가독성을 확보합니다.

---

## Outcomes & Retrospective

- **원래 목표 달성 여부**: [ ] Yes  [ ] Partial  [ ] No
- **결과 요약**: 
- **다음 작업에 반영할 것**: 

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
