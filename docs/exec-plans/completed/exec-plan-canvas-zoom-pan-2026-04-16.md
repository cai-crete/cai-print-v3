# exec-plan: 캔버스 대지 스크롤 금지 + 무한 캔버스 줌/패닝

**날짜**: 2026-04-16  
**요청**: 문서 대지 내부 스크롤 금지 + 줌인/줌아웃 + 캔버스 드래그 이동

---

## 작업 범위

| 파일 | 변경 내용 |
|------|----------|
| `project.10_print/app/components/templates/DocumentFrame.tsx` | iframe srcdoc에 `overflow:hidden` CSS 주입 → 대지 내부 스크롤 방지 |
| `project.10_print/app/components/layout/Canvas.tsx` | zoom/pan 상태 + 이벤트 핸들러 추가, 배경 그리드 pan/zoom 동기화 |

---

## 체크리스트

- [ ] **DocumentFrame**: `srcdoc` HTML에 `<style>html,body{overflow:hidden!important;}</style>` 주입
- [ ] **Canvas**: `useReducer`로 zoom/panX/panY 상태 관리
- [ ] **Canvas**: 마우스 휠 → 커서 기준 줌인/줌아웃 (min 0.1 / max 8)
- [ ] **Canvas**: 마우스 좌버튼 드래그 → 패닝
- [ ] **Canvas**: 더블클릭 → 뷰 초기화 (zoom=1, pan=0)
- [ ] **Canvas**: 드래그 중 iframe 위 커서 보호용 투명 오버레이 추가
- [ ] **Canvas**: 배경 그리드 `backgroundSize/backgroundPosition`을 zoom/pan에 동기화
- [ ] **Canvas**: 문서 transform div: `transformOrigin: '0 0'`, `translate(panX, panY) scale(zoom)`

---

## 설계 요점

- `DocumentFrame`의 `ResizeObserver`는 CSS transform 이전 레이아웃 크기를 측정 → 항상 캔버스 크기에 맞게 문서를 축소
- Canvas zoom/pan은 그 위에 순수 시각적 변환으로 적용 → zoom=1 시 문서가 캔버스에 꼭 맞게 보임
- zoom > 1 → 문서가 확대되어 캔버스를 벗어남 (main `overflow:hidden`이 클리핑)
- zoom < 1 → 문서가 축소되어 배경 그리드가 보임

---

COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.