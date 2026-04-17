# [REPAIR] GENERATE 기능 복구 및 ImageInsert 로직 최적화

최근 UI 고도화 작업 및 리팩토링 과정에서 발생한 이미지 삽입 불가 및 문서 생성 기능 마비를 해결한 과정과 최종 결론을 기록합니다.

## 해결된 문제

1. **컴포넌트 인터페이스 불일치**: `ImageInsert.tsx`의 `AddButton` 리팩토링 후 Props 규격이 변경되었으나, 호출부에서 이를 맞춰주지 않아 클릭 시 런타임 에러 발생.
2. **레이어 간섭(Click Blocking)**: 사이드바의 `transform: none` 설정 시, 보이지 않는 백드롭(`z-1001`)이 화면을 덮어 사이드바 내 버튼 클릭을 차단함.
3. **이벤트 소실 (Mousedown Issue)**: 메뉴 외부 클릭 시 닫히는 로직에 `mousedown`을 사용하여, 메뉴 아이템의 `click` 이벤트가 발생하기 전에 메뉴가 언마운트되는 현상.
4. **API 호출 오류**: 이미지 삽입까지 성공했으나 GENERATE 호출 시 에러 발생.

## 트러블슈팅 히스토리 (Troubleshooting Logs)

### 1단계: Props 정합성 확보
- **현상**: 더하기(+) 버튼 클릭 시 아무런 반응이 없거나 콘솔 에러 발생.
- **원인**: `AddButton`이 요구하는 `onClickDevice`, `onClickLibrary` 대신 구 버전의 `onClick`이 전달됨.
- **해결**: 호출부(Call site)를 신규 규격에 맞게 수정하여 이벤트 연결.

### 2단계: 사이드바 상호작용성 복구
- **현상**: 드롭다운 메뉴가 사이드바 뒤로 숨거나(Clips), 특정 위치에서 클릭이 무시됨.
- **해결 1 (실패)**: `transform: none` 적용 시 클릭은 되나 백드롭이 전역 이슈를 유발.
- **해결 2 (성공)**: 사이드바를 `transform: none` 상태로 두고, `ImageInsert` 내부의 전역 백드롭을 제거. 대신 `menuRef`를 이용한 외부 클릭 감지 로직으로 대체하여 클릭 가용성 확보.

### 3단계: 메뉴 아이템 클릭 소실 해결
- **현상**: 드롭다운은 뜨지만 내부의 '디바이스/라이브러리' 버튼을 누르면 아무 동작 없이 닫히기만 함.
- **원인**: `mousedown` 이벤트가 `click`보다 먼저 발생하여, 버튼 액션이 실행되기 전에 컴포넌트가 사라짐.
- **해결**: `menuRef`를 추가하여 메뉴 내부 클릭 시에는 닫기 로직이 작동하지 않도록 보호(Guard) 처리.

## 최종 확인 결과 (Final Root Cause)

> [!IMPORTANT]
> **API 호출 단계 오류의 최종 원인은 테스트용 이미지의 용량 초과였습니다.**
> - **제한 사항**: `route.ts` 내 `MAX_IMAGE_SIZE`는 **20MB**로 설정되어 있음.
> - **발생 현상**: 용량이 큰 고화질 이미지를 업로드하고 GENERATE 클릭 시 서버에서 400(Bad Request) 에러 반환.
> - **가이드**: 향후 테스트 시에는 20MB 이하의 이미지를 사용해야 하며, 필요 시 `route.ts`의 상수를 조정해야 함.

## 업무 상세 계획 (완료)

### 1단계: 컴포넌트 호출부 수정 [DONE]
- [x] `ImageInsert.tsx`의 `AddButton` 호출부 수정
- [x] `VideoSlot` 호출부의 `label` 및 `onLibraryUpload` 최종 확인

### 2단계: 런타임 검증 [DONE]
- [x] 브라우저에서 이미지 추가 시도 및 런타임 에러 발생 여부 확인
- [x] `GENERATE` 버튼 활성화 상태 및 클릭 연결 확인

---

## 상세 수정 내역 (Modified Files)

### 1. [MODIFY] [ImageInsert.tsx](file:///c:/Users/USER01/Downloads/cai-harness-print/project.10_print/app/components/sidebar/ImageInsert.tsx)
- **AddButton 인터페이스 정합성**: 구 버전의 `onClick` 전달 방식을 신규 규격인 `onClickDevice`, `onClickLibrary`로 교체하여 런타임 에러 해결.
- **메뉴 보호 로직(Guard Logic)**: `AddButton` 및 `VideoSlot` 내부의 `fixed` 백드롭을 제거하고, `menuRef`를 도입하여 메뉴 내부 클릭 시 드롭다운이 즉시 닫히는(이벤트 소실) 현상을 방지함.
- **이벤트 순서 제어**: `mousedown` 리스너에서 클릭 대상이 `buttonRef` 또는 `menuRef`에 포함되는지 검사하여 안정적인 상호작용 보장.

### 2. [MODIFY] [Sidebar.tsx](file:///c:/Users/USER01/Downloads/cai-harness-print/project.10_print/app/components/layout/Sidebar.tsx)
- **레이어 스택 최적화**: `isOpen` 상태일 때 `transform` 속성을 `none`으로 설정.
- **가시성 확보**: 사이드바에 `transform`이 존재할 경우 내부 `fixed` 요소가 사이드바 영역(Stacking Context)에 갇혀 잘리게 되는데, 이를 `none`으로 해제하여 뷰포트 기준으로 드롭다운이 정상 노출되도록 조치함.

---

## 작업 체크리스트 (인수인계용)

- [x] `AddButton` Props: `onClickDevice`, `onClickLibrary` 정상 전달
- [x] `VideoSlot` Props: `onLibraryUpload` 및 `menuRef` 보호 로직 적용
- [x] `Sidebar.tsx`: `transform: none` 설정을 통한 드롭다운 가시성 확보
- [x] `ImageInsert.tsx`: 백드롭 제거 및 `mousedown` 간섭 방지 로직 적용
- [x] `GENERATE` 버튼: 이미지 삽입 후 활성화(Back: Black) 확인 완료
