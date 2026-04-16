# 비디오 생성 및 운영 프로토콜 (Video Generation Protocol v1.0)

본 문서는 CAI CANVAS | PRINT의 비디오 생성 서비스 구현을 위한 기술 사양 및 운영 규칙을 정의합니다. 특히 건축적 정밀도를 유지하기 위한 AI 프롬프트 제어 로직을 핵심으로 다룹니다.

---

## I. 시스템 아키텍처 및 모델 사양

*   **모델 (Target Model):** `models/veo-3.1-lite-generate-preview`
*   **API 버전:** Google GenAI API v1beta
*   **엔드포인트:** `generateVideos`
*   **데이터 구조:** 
    *   **Input:** 시작 프레임(Start Image), 종료 프레임(End Image), 시스템 프롬프트
    *   **Output:** `operation.video.uri`를 통한 MP4 영상 스트림

---

## II. [핵심] 영상 생성 프롬프트 인젝션 로직

비디오 생성 시 건축물의 형태적 왜곡을 방지하고 물리적 일관성을 확보하기 위해, 시스템은 사용자 입력값 외에 아래의 **고정 시스템 프롬프트(System Prompt Injection)**를 강제 주입합니다.

> [!IMPORTANT]
> ### 🤖 시스템 프롬프트 상세 (Injection Logic)
> AI 모델의 생성 자유도를 제한하고 건축적 엄밀성을 강제하기 위한 핵심 지침입니다.
>
> 1. **[CORE TASK]**: Cinematic architectural cinematography transitioning from the start image to the end image.
> 2. **[STYLE]**: High-fidelity textures, Photorealistic rendering, Ray-traced lighting.
> 3. **[STRUCTURAL INTEGRITY] (핵심 강조)**: 
>    - **Preserve the original shape of all architectural elements within the provided images. (제공된 이미지 내 모든 건축 요소의 원래 형상을 보존함)**
>    - **Strictly avoid any deformation or structural transformation. (인위적인 변형이나 구조적 변화를 엄격히 금지함)**
>    - Maintain strict rigid geometry. (엄격한 강체 기하학 유지)
>    - Primary columns, beams, and walls must remain stationary and consistent in perspective. (기둥, 보, 벽체는 고정되어야 하며 투영 일관성을 유지해야 함)
>    - Rigid geometry, Structural consistency, Straight lines integrity.
>    - **NO structural morphing or flowing artifacts.** (구조적 변형이나 흐르는 듯한 아티팩트 절대 금지)
> 4. **[CAMERA MOVEMENT]**: 
>    - Smooth camera transition, Dolly-in/Travel path driven. (부드러운 카메라 전환, 달리-인/비행 경로 기반)
>    - Infer 3D coordinates between frames and move the camera along the path. (프레임 간 3D 좌표를 추론하여 경로를 따라 이동)
> 5. **[NEGATIVE PROMPT]**: 
>    - NO cross-dissolve, NO fades, NO distortion. (교차 페이드, 왜곡 금지)
>    - NO blurry structures, NO motion blur on structural elements. (구조물 블러 처리 금지)
>    - NO unrealistic perspective shifts. (비현실적인 투크 전환 금지)

<!-- VIDEO:INJECTION -->
[CORE TASK] Cinematic architectural cinematography transitioning from the start image to the end image.
[STYLE] High-fidelity textures, Photorealistic rendering, Ray-traced lighting.
[STRUCTURAL INTEGRITY] Preserve the original shape of all architectural elements within the provided images. Strictly avoid any deformation or structural transformation. Maintain strict rigid geometry. Primary columns, beams, and walls must remain stationary and consistent in perspective. Rigid geometry, Structural consistency, Straight lines integrity. NO structural morphing or flowing artifacts.
[CAMERA MOVEMENT] Smooth camera transition, Dolly-in/Travel path driven. Infer 3D coordinates between frames and move the camera along the path.
[NEGATIVE PROMPT] NO cross-dissolve, NO fades, NO distortion. NO blurry structures, NO motion blur on structural elements. NO unrealistic perspective shifts.
<!-- VIDEO:END -->

---

## III. 운영 및 UI/UX 정책

### 1. 이미지 선택 및 입력 제한
*   **최소/최대 요건:** 영상 생성을 위해 반드시 **2장(시작/종료)**의 이미지가 사이드바에 선택되어야 합니다.
*   **사이드바 자동 조정:** VIDEO 모드 진입 시, '페이지 수 설정' 섹션이 비활성화됨에 따라 프롬프트 섹션의 위계가 **"C. PROMPT"**로 자동 상향 조정됩니다.
*   **이미지 스왑 (`__swapVideoImages`):** 시작과 종료 이미지의 순서를 즉각 변경할 수 있는 전용 컨트롤을 제공합니다.

### 2. 출력 및 내보내기 (Export) 정책
*   **전용 포맷:** 비디오 모드에서는 오직 **VIDEO (MP4)** 형식만 내보낼 수 있습니다. (PDF, PNG, JPEG는 비활성화)
*   **네이밍 규칙:** 생성된 영상의 기본 파일명은 `video-example-1.mp4` 형식을 따릅니다.

### 3. 데이터 바인딩 로직
*   **블록 ID:** 생성된 영상의 URI는 `video-main` ID를 가진 이미지 블록의 `content` 속성에 주입됩니다.
*   **템플릿:** `VideoTemplate.tsx`가 해당 URI를 감지하여 커스텀 플레이어(재생/일시정지/프로그레스 바)를 렌더링합니다.

---

## IV. 에러 핸들링 및 상태 관리

*   **API 활성화 오류 (403 Forbidden):** 사용자가 구글 클라우드 콘솔에서 API를 활성화하지 않은 경우, 단순 오류 대신 **"API 활성화가 필요합니다"**라는 구체적인 안내 팝업을 출력합니다.
*   **생성 로딩 (Gray Filling):** 영상 생성 중에는 `VideoTemplate`에 회색 바가 왼쪽에서 오른쪽으로 차오르는 **Architectural Loading Board** 애니메이션을 노출하여 진행 상황(0~100%)을 시각화합니다.

---

## V. 결론

본 프로토콜은 비디오 기능이 단순한 영상 효과를 넘어, 건축적 논리와 시각적 실재감을 동시에 전달할 수 있도록 설계되었습니다. 특히 **Section II**의 프롬프트 지침은 모델 업데이트 시에도 반드시 유지되어야 하는 최우선 품질 기준입니다.
