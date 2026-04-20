# 코드 리뷰 보고서 — DXF Export (Convertio API 연동)

- **리뷰 대상**: `project.10_print/app/api/convert/route.ts`, `project.10_print/lib/export.ts`
- **참조 exec-plan**: `docs/exec-plans/completed/exec-plan-n10-print-convertio-api-2026-04-20.md`
- **작성일**: 2026-04-20
- **수정 완료일**: 2026-04-20
- **작성자**: Claude (AI 코드 리뷰)

---

## 종합 평가

전체 구조(클라이언트 캡처 → 서버 sharp 처리 → Convertio 변환 → 파일 반환)는 명확하며 v8 하이브리드 방식의 의사결정은 타당합니다.
다만 아래 **버그 수준 문제 2건**, **런타임 위험 2건**, **코드 품질 이슈 3건**이 확인되었으며, 모두 수정 완료되었습니다.

---

## 🔴 HIGH — 버그 / 런타임 오류 가능성

### H-1. `filename` null 참조 오류 — `route.ts` ✅ 수정 완료

**문제**: `filename`이 클라이언트에서 전달되지 않으면 `undefined.replace(...)` → `TypeError` 발생. 서버 500 반환.

**수정 내용**:
```ts
const safeName = (filename ?? 'drawing').replace(/\.[^/.]+$/, '')
'Content-Disposition': `attachment; filename="${safeName}.dxf"`
```

---

### H-2. Convertio 다운로드 응답 상태 미검증 — `route.ts` ✅ 수정 완료

**문제**: Convertio 파일 다운로드 URL이 404/403/5xx를 반환해도 오류 없이 빈 blob을 클라이언트로 전달.

**수정 내용**:
```ts
const fileRes = await fetch(outputUrl)
if (!fileRes.ok) {
  return NextResponse.json({ error: `변환 파일 다운로드 실패: ${fileRes.status}` }, { status: 502 })
}
```

---

## 🟠 MEDIUM — 메모리 / 성능 위험

### M-1. scale 고해상도 캡처로 인한 페이로드 위험 — `export.ts` ✅ scale:3으로 조정

**원래 문제**: scale:4 시 DRAWING 모드 캔버스 6348×4488 px, base64 포함 약 5~15 MB. Vercel 서버리스 함수 기본 페이로드 제한(4.5 MB) 초과 위험.

**트러블슈팅 과정**:
- scale:2 적용 → **직선이 쭈글쭈글한 점 연결로 보이는 품질 저하 실측 확인, 텍스트 깨짐**. 기각.
- scale:3 적용 → 캔버스 4761×3366 px. scale:4 대비 페이로드 약 44% 감소. 품질과 페이로드의 절충점으로 **최종 채택**.

**결론**: scale:4가 원래 품질 기준이나, Vercel 배포 환경의 4.5 MB 제한으로 인해 scale:3이 현실적 타협점. 향후 고해상도 export가 필요하다면 `multipart/form-data` 전송 방식 전환을 검토할 것.

---

### M-2. 비표준 MIME 타입 — `route.ts` ✅ 수정 완료

**문제**: `application/dxf`는 IANA 등록 타입이 아님.

**수정 내용**: `'Content-Type': 'application/octet-stream'` (범용, 브라우저 호환 최대)

---

## 🟡 LOW — 코드 품질 / 유지보수성

### L-1. 미사용 함수 2개 — `export.ts` ✅ 삭제 완료

`applyThresholdToCanvas` 및 `preprocessImagesInIframe` (v1~v6 클라이언트 전처리 잔재) 삭제.

---

### L-2. `from_format` 파라미터 수신 후 미사용 — `route.ts` ✅ 수정 완료

구조분해 할당에서 `from_format` 제거.

---

### L-3. 폴링 루프 주석 번호 오류 — `route.ts` ✅ 수정 완료

`// 3. 변환된 파일 다운로드` → `// 4. 변환된 파일 다운로드`

---

## 보안 확인 사항

| 항목 | 상태 | 비고 |
|------|------|------|
| `.env.local` git 추적 여부 | ✅ 안전 | `NOT TRACKED` 확인됨 (루트 `.gitignore`에 `env.local` 포함) |
| API Key 서버측 보관 | ✅ 정상 | `CONVERTIO_API_KEY`는 `process.env`로만 참조, 클라이언트 노출 없음 |
| Base64 입력 크기 검증 | ⚠️ 미구현 | 악의적 대용량 입력 가능성 (서비스 내부 전용 API라면 위험도 낮음) |

---

## 수정 결과 요약

| ID | 심각도 | 파일 | 핵심 이슈 | 상태 |
|----|--------|------|-----------|------|
| H-1 | 🔴 HIGH | `route.ts` | `filename` undefined 시 TypeError crash | ✅ 완료 |
| H-2 | 🔴 HIGH | `route.ts` | 다운로드 실패 무시, 빈 파일 전달 | ✅ 완료 |
| M-1 | 🟠 MEDIUM | `export.ts` | 고해상도 PNG 페이로드 초과 위험 | ✅ scale:3으로 조정 |
| M-2 | 🟠 MEDIUM | `route.ts` | 비표준 MIME 타입 | ✅ 완료 |
| L-1 | 🟡 LOW | `export.ts` | 미사용 함수 2개 잔존 | ✅ 완료 |
| L-2 | 🟡 LOW | `route.ts` | 수신 파라미터 미사용 | ✅ 완료 |
| L-3 | 🟡 LOW | `route.ts` | 주석 번호 오류 | ✅ 완료 |

---

## 잔여 과제

- **M-1 근본 해결**: 향후 scale:4 품질이 반드시 필요할 경우, 클라이언트→서버 전송 방식을 `multipart/form-data`로 전환하면 Vercel 페이로드 제한 없이 운영 가능.

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
