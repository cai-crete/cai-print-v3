# exec-plan: fal.ai 비디오 API 연결

**생성일**: 2026-04-21  
**담당**: AGENT A  
**상태**: 진행 중

---

## 목표

fal.ai API를 연결하여 비디오 생성 기능을 추가한다.  
API 키는 `.env.local`에 안전하게 저장하고 절대 코드에 하드코딩하지 않는다.

---

## 체크리스트

- [x] exec-plan 생성
- [x] `FAL_KEY` 환경변수를 `.env.local`에 추가
- [x] `@fal-ai/client` 패키지 설치 (`package.json` 의존성 추가)
- [x] `/api/video-fal/route.ts` API 라우트 구현
- [x] progress 파일 업데이트

---

## 기술 결정

| 항목 | 결정 |
|------|------|
| API 키 저장 위치 | `.env.local` (`.gitignore`에 포함됨, 커밋 제외) |
| 환경변수명 | `FAL_KEY` (fal.ai 클라이언트 표준 변수명) |
| 엔드포인트 | `/api/video-fal` (기존 `/api/print` VIDEO 모드와 독립 분리) |
| 기본 모델 | `fal-ai/kling-video/v2.1/pro/image-to-video` |

---

## 보안 주의사항

- `FAL_KEY`는 서버 사이드에서만 사용 (`process.env.FAL_KEY`)
- `NEXT_PUBLIC_` 접두사 사용 금지 → 브라우저에 노출되지 않음
- `.env.local`은 `.gitignore`에 이미 포함되어 있음 (확인됨)
