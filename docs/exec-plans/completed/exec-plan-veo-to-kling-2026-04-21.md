# exec-plan: Veo → Kling O3 전환

**생성일**: 2026-04-21  
**담당**: AGENT A  
**상태**: 진행 중

---

## 목표

기존 Google Veo 3.1 Lite 기반 VIDEO 모드 로직 전체를 fal.ai Kling O3로 교체한다.  
프로토콜, API 라우트, 컴포넌트, 문서 모두 일관성 있게 수정한다.

---

## 변경 범위

| 파일 | 변경 내용 |
|------|----------|
| `app/api/print/route.ts` | VIDEO 모드 — Veo 블록 제거, Kling O3 (fal.ai) 호출로 교체 |
| `lib/prompt.ts` | Veo 참조 코멘트 → Kling 표기로 수정 |
| `lib/export.ts` | `exportVideo` 오류 메시지에서 Veo 언급 제거 |
| `app/components/templates/VideoTemplate.tsx` | "Veo 3.1 Lite" 텍스트 → "Kling O3" |
| `_context/protocol/video_generation_protocol.md` | 모델 사양·엔드포인트 섹션을 Kling O3 기준으로 전면 재작성 |

---

## 모델 사양

| 항목 | 값 |
|------|-----|
| 모델 ID | `fal-ai/kling-video/v2.1/pro/image-to-video` |
| 공급자 | fal.ai |
| 인증 | `FAL_KEY` 환경변수 (`process.env.FAL_KEY`) |
| 시작 프레임 | `image_url` |
| 종료 프레임 | `tail_image_url` (Kling 스타트/엔드 프레임 보간 지원) |
| 기본 길이 | `"5"` 초 |
| 비율 | `"16:9"` |

---

## 체크리스트

- [x] exec-plan 생성
- [ ] `app/api/print/route.ts` 수정 — Veo 제거, Kling O3 연결
- [ ] `lib/prompt.ts` 수정 — 코멘트 Veo → Kling
- [ ] `lib/export.ts` 수정 — 오류 메시지 정리
- [ ] `VideoTemplate.tsx` 수정 — 텍스트 업데이트
- [ ] `video_generation_protocol.md` 전면 갱신
- [ ] `tsc --noEmit` 통과
- [ ] progress 업데이트
