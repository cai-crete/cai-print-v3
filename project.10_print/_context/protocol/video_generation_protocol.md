# 비디오 생성 및 운영 프로토콜 (Video Generation Protocol v2.2)

본 문서는 CAI CANVAS | PRINT의 비디오 생성 서비스 구현을 위한 기술 사양 및 운영 규칙을 정의합니다. 특히 건축적 정밀도를 유지하기 위한 AI 프롬프트 제어 로직을 핵심으로 다룹니다.

> **v2.2 변경 이력**: P1·P3·P4 보완 (2026-04-27)
> - §I에 입력 이미지 사전 검증 기준 추가 (파일 형식·해상도·밝기·비율·장수)
> - §IV에 Post-generation 정책 추가 (재생성 정책·TTL·Phase 1/2 썸네일 저장 전략)
> - §V 신설: 시작→종료 영상 정합성 판단 기준 5개 차원 (기존 §V 결론 → §VI)
>
> **v2.1 변경 이력**: 정합성 판단 기준 5개 차원 분석에 따른 프롬프트 인젝션 강화 (2026-04-27)
> - `[LIGHTING & CONTINUITY]` 섹션 신설 — 조명 방향·시간대·배경 환경 일관성
> - `[CORE TASK]` 확장 — 첫/끝 프레임의 입력 이미지 재현 의무 명시
> - `[STRUCTURAL INTEGRITY]` 확장 — 직선 엣지·창문·개구부·요소 개수 불변 추가
> - `[CAMERA MOVEMENT]` 확장 — 고체 벽체 통과 금지 추가
> - `[NEGATIVE PROMPT]` 확장 — 공간 점프·하드 컷·재료 교체·글리치·대규모 객체 추가
>
> **v2.0 변경 이력**: Google Veo 3.1 Lite → Kling O3 (fal.ai) 전환 (2026-04-21)

---

## I. 시스템 아키텍처 및 모델 사양

*   **모델 (Target Model):** `fal-ai/kling-video/v2.1/pro/image-to-video` (Kling O3)
*   **공급자:** fal.ai
*   **인증:** `FAL_KEY` 환경변수 (`process.env.FAL_KEY`, 서버 사이드 전용)
*   **데이터 구조:** 
    *   **Input:**
        *   시작 프레임(`image_url`) — fal.ai Storage URL
        *   종료 프레임(`tail_image_url`) — fal.ai Storage URL (보간 기준)
        *   시스템 프롬프트(`prompt`) — VIDEO:INJECTION 블록 + 사용자 입력
        *   지속 시간(`duration`) — `"5"` 초 (기본값)
        *   비율(`aspect_ratio`) — `"16:9"` (기본값)
    *   **Output:** `result.data.video.url` → MP4 URL

### 입력 이미지 사전 검증 기준 (Pre-flight Input Validation)

영상 생성 요청 전, 시스템은 다음 계층별 검증을 수행합니다.

**계층 1 — 자동 차단/경고 (시스템 처리):**

| 검사 항목 | 기준 | 미달 시 동작 |
|---|---|---|
| 파일 형식 | JPEG, PNG만 허용 (WebP 제외) | 업로드 차단 |
| 이미지 장수 | 시작 + 종료 정확히 2장 | 생성 버튼 비활성화 |
| 해상도 하한 | 각 이미지 단변(short side) ≥ 720px | 경고 메시지 표시 (차단하지 않음) |
| 밝기 차이 | 두 이미지의 평균 밝기(Luma) 차이 > 30% | 경고 메시지 표시 (차단하지 않음) |
| 이미지 비율 | 16:9가 아닌 경우 시스템이 중앙 크롭(center crop)하여 16:9로 변환 후 API에 전달 | 정보성 안내 표시 (차단 없음) |

**계층 2 — UI 가이던스 (사용자 책임):**

| 검사 항목 | 이유 | 대응 방식 |
|---|---|---|
| 건물 동일성 | Vision AI 자동 판별 비용 문제로 자동화 보류 | 사이드바 캡션: "시작과 종료 이미지는 동일 건물을 삽입해 주세요." |
| 카메라 앵글 유사도 | Vision AI 자동 판별 비용 문제로 자동화 보류 | 향후 검토 예정 |

---

## II. [핵심] 영상 생성 프롬프트 인젝션 로직

비디오 생성 시 건축물의 형태적 왜곡을 방지하고 물리적 일관성을 확보하기 위해, 시스템은 사용자 입력값 외에 아래의 **고정 시스템 프롬프트(System Prompt Injection)**를 강제 주입합니다.

> [!IMPORTANT]
> ### 🤖 시스템 프롬프트 상세 (Injection Logic)
> AI 모델의 생성 자유도를 제한하고 건축적 엄밀성을 강제하기 위한 핵심 지침입니다.
>
> 1. **[CORE TASK]**: Cinematic architectural cinematography transitioning from the start image to the end image.
>    - **The opening frame must faithfully reproduce the exact composition, camera angle, and architectural content of the provided start image. (첫 프레임은 시작 이미지의 구성·앵글·건축 내용을 충실히 재현해야 함)**
>    - **The closing frame must faithfully reproduce the exact composition, camera angle, and architectural content of the provided end image. (끝 프레임은 종료 이미지의 구성·앵글·건축 내용을 충실히 재현해야 함)**
> 2. **[STYLE]**: High-fidelity textures, Photorealistic rendering, Ray-traced lighting.
> 3. **[LIGHTING & CONTINUITY] (신설)**: 
>    - **Maintain identical lighting direction, shadow angle, and light intensity throughout the entire video. (영상 전 구간에 걸쳐 동일한 조명 방향·그림자 각도·광 강도를 유지해야 함)**
>    - Preserve the same time of day and sky condition as shown in the start image. (시작 이미지에 나타난 시간대와 하늘 상태를 유지해야 함)
>    - Background elements including sky, vegetation, and ground surfaces must transition naturally and consistently without replacement. (하늘·수목·지면 등 배경 요소는 자연스럽고 일관되게 변화해야 하며 무작위 교체 금지)
> 4. **[STRUCTURAL INTEGRITY] (핵심 강조)**: 
>    - **Preserve the original shape of all architectural elements within the provided images. (제공된 이미지 내 모든 건축 요소의 원래 형상을 보존함)**
>    - **Strictly avoid any deformation or structural transformation. (인위적인 변형이나 구조적 변화를 엄격히 금지함)**
>    - Maintain strict rigid geometry. (엄격한 강체 기하학 유지)
>    - Primary columns, beams, and walls must remain stationary and consistent in perspective. (기둥, 보, 벽체는 고정되어야 하며 투영 일관성을 유지해야 함)
>    - **All straight edges and corners must remain perfectly straight throughout — NO curved or rounded deformation of originally straight architectural lines. (원래 직선인 건축 선들은 전 구간 완전한 직선을 유지해야 하며, 곡선화·라운딩 변형 절대 금지)**
>    - All windows, openings, and apertures must maintain their original size, shape, and position. (모든 창문·개구부는 원래의 크기·형태·위치를 유지해야 함)
>    - The total number of structural elements must not change between start and end frames. (구조 요소의 총 개수는 시작과 종료 프레임 사이에 변하지 않아야 함)
>    - Rigid geometry, Structural consistency, Straight lines integrity.
>    - **NO structural morphing or flowing artifacts.** (구조적 변형이나 흐르는 듯한 아티팩트 절대 금지)
> 5. **[CAMERA MOVEMENT]**: 
>    - Smooth camera transition, Dolly-in/Travel path driven. (부드러운 카메라 전환, 달리-인/비행 경로 기반)
>    - Infer 3D coordinates between frames and move the camera along a physically plausible path through open space only. (프레임 간 3D 좌표를 추론하여 개방 공간만을 통과하는 물리적으로 가능한 경로를 따라 이동)
>    - The camera must not pass through solid walls, floors, or ceilings. (카메라는 고체 벽체·바닥·천장을 관통할 수 없음)
> 6. **[NEGATIVE PROMPT]**: 
>    - NO cross-dissolve, NO fades, NO distortion. (교차 페이드, 왜곡 금지)
>    - NO blurry structures, NO motion blur on structural elements. (구조물 블러 처리 금지)
>    - NO unrealistic perspective shifts. (비현실적인 원근 전환 금지)
>    - NO spatial jumps or sudden teleportation of camera position. (카메라 위치의 공간 점프·순간이동 금지)
>    - NO hard cuts between frames — continuous fluid motion only. (프레임 간 하드 컷 금지, 연속적 유동 동작만 허용)
>    - NO lighting direction change or time-of-day shift mid-video. (영상 중간의 조명 방향 변경·시간대 전환 금지)
>    - NO material substitution or texture replacement on architectural surfaces. (건축 표면의 재료 교체·텍스처 치환 금지)
>    - NO glitch artifacts, NO frozen frame segments, NO screen split artifacts. (글리치 아티팩트·프레임 정지·화면 분열 아티팩트 금지)
>    - NO large crowds, vehicles, or objects that were not present in the original images and that obstruct architectural elements. (원본 이미지에 없던 군중·차량·물체로 건축 요소를 가리는 것 금지)

<!-- VIDEO:INJECTION -->
[CORE TASK] Cinematic architectural cinematography transitioning from the start image to the end image. The opening frame must faithfully reproduce the exact composition, camera angle, and architectural content of the provided start image. The closing frame must faithfully reproduce the exact composition, camera angle, and architectural content of the provided end image.
[STYLE] High-fidelity textures, Photorealistic rendering, Ray-traced lighting.
[LIGHTING & CONTINUITY] Maintain identical lighting direction, shadow angle, and light intensity throughout the entire video. Preserve the same time of day and sky condition as shown in the start image. Background elements including sky, vegetation, and ground surfaces must transition naturally and consistently without replacement.
[STRUCTURAL INTEGRITY] Preserve the original shape of all architectural elements within the provided images. Strictly avoid any deformation or structural transformation. Maintain strict rigid geometry. Primary columns, beams, and walls must remain stationary and consistent in perspective. All straight edges and corners must remain perfectly straight throughout — NO curved or rounded deformation of originally straight architectural lines. All windows, openings, and apertures must maintain their original size, shape, and position. The total number of structural elements must not change between start and end frames. Rigid geometry, Structural consistency, Straight lines integrity. NO structural morphing or flowing artifacts.
[CAMERA MOVEMENT] Smooth camera transition, Dolly-in/Travel path driven. Infer 3D coordinates between frames and move the camera along a physically plausible path through open space only. The camera must not pass through solid walls, floors, or ceilings.
[NEGATIVE PROMPT] NO cross-dissolve, NO fades, NO distortion. NO blurry structures, NO motion blur on structural elements. NO unrealistic perspective shifts. NO spatial jumps or sudden teleportation of camera position. NO hard cuts between frames — continuous fluid motion only. NO lighting direction change or time-of-day shift mid-video. NO material substitution or texture replacement on architectural surfaces. NO glitch artifacts, NO frozen frame segments, NO screen split artifacts. NO large crowds, vehicles, or objects that were not present in the original images and that obstruct architectural elements.
<!-- VIDEO:END -->

---

## III. 운영 및 UI/UX 정책

### 1. 이미지 선택 및 입력 제한
*   **최소/최대 요건:** 영상 생성을 위해 반드시 **2장(시작/종료)**의 이미지가 사이드바에 선택되어야 합니다.
*   **사이드바 자동 조정:** VIDEO 모드 진입 시, '페이지 수 설정' 섹션이 비활성화됨에 따라 프롬프트 섹션의 위계가 **"C. PROMPT"**로 자동 상향 조정됩니다.
*   **이미지 스왑 (`__swapVideoImages`):** 시작과 종료 이미지의 순서를 즉각 변경할 수 있는 전용 컨트롤을 제공합니다.

### 2. 출력 및 내보내기 (Export) 정책
*   **전용 포맷:** 비디오 모드에서는 오직 **VIDEO (MP4)** 형식만 내보낼 수 있습니다. (PDF, PNG, JPEG는 비활성화)
*   **네이밍 규칙:** 생성된 영상의 기본 파일명은 `video_[timestamp].mp4` 형식을 따릅니다.

### 3. 데이터 바인딩 로직
*   **반환 필드:** 생성된 영상 URL은 `PrintResult.videoUri`에 저장됩니다.
*   **템플릿:** `VideoTemplate.tsx`가 해당 URL을 감지하여 커스텀 플레이어(재생/일시정지/프로그레스 바)를 렌더링합니다.

---

## IV. 에러 핸들링 및 상태 관리

*   **FAL_KEY 미설정 (500):** `FAL_KEY` 환경변수가 없을 경우 즉시 500 오류와 안내 메시지를 반환합니다.
*   **이미지 업로드 실패:** fal.ai Storage 업로드 실패 시 `catch` 블록에서 처리되어 사용자에게 오류 메시지를 표시합니다.
*   **생성 로딩 (Gray Filling):** 영상 생성 중에는 `VideoTemplate`에 회색 바가 왼쪽에서 오른쪽으로 차오르는 **Architectural Loading Board** 애니메이션을 노출하여 진행 상황을 시각화합니다.
*   **생성 후 사용자 재생성 정책:** 생성된 영상이 부정합으로 판단될 경우, 사용자가 재생성 버튼을 명시적으로 클릭해야만 재생성이 트리거됩니다.
    *   **자동 재생성은 채택하지 않습니다.** 영상 자동 품질 판정을 위해서는 별도 Vision AI 호출(LLM 토큰 비용)이 필요하며, 재생성마다 fal.ai GPU 크레딧이 추가 소모됩니다. 결과 품질이 보장되지 않는 상태에서 루프가 발생할 위험이 있으므로, 재생성 결정은 사용자에게 위임합니다.
*   **영상 URL 유효 기간(TTL) 및 보관 전략 (단계적 구현):**
    *   fal.ai Storage에서 반환되는 MP4 URL은 생성 후 약 **1시간** 이후 만료되며, 이후에는 해당 URL로 재생 및 다운로드가 불가합니다. (fal.ai 정책 변경 시 `FAL_VIDEO_TTL_NOTICE` 상수 갱신 필요)
    *   **Phase 1 — 즉시 구현 (TTL 안내 + 썸네일 영구 저장):**
        *   생성 완료 직후 영상 플레이어 하단에 만료 안내("이 영상은 약 1시간 후 만료됩니다. 지금 다운로드하세요.")와 "다운로드" 버튼을 표시합니다.
        *   **썸네일 영구 저장:** 생성 완료 시, `videoStartImage`(시작 이미지)를 압축 JPEG(최대 400×225px, quality 70)으로 변환하여 자체 스토리지(Vercel Blob)에 저장합니다. 이 썸네일 URL은 `PrintResult.thumbnailUri`에 저장하며 두 곳에 사용됩니다.
            *   `<video poster={thumbnailUri}>` — 재생 전 플레이어에 표시되는 포스터 이미지
            *   캔버스 아트보드 썸네일 — 해당 영상 아트보드 진입 시 표시되는 미리보기
        *   썸네일 저장 근거: 생성 프로토콜이 "첫 프레임은 시작 이미지를 충실히 재현"을 강제하므로 시작 이미지가 사실상 첫 프레임과 동일합니다. 별도 프레임 추출 없이 클라이언트에 이미 존재하는 파일을 재활용하므로 추가 API 비용이 없습니다.
        *   썸네일 저장 비용: 압축 JPEG 기준 약 20~30KB → Vercel Blob $0.023/GB 기준 건당 약 $0.000001 미만 (사실상 무료)
    *   **Phase 2 — 추후 구현 (MP4 영구 저장, 선택적):**
        *   서버가 fal.ai 임시 MP4 URL에서 blob을 즉시 가져와 자체 스토리지에 재저장합니다. `PrintResult.videoUri`를 영구 URL로 교체합니다.
        *   단점: 스토리지 비용 발생 (MP4 기준 약 10~20MB, 건당 약 $0.0005)
        *   **Phase 1 완료 후 별도 승인을 받아 진행합니다.**
    *   만료된 URL에 접근 시 사용자에게 안내 메시지("영상 링크가 만료되었습니다. 재생성해 주세요.")를 표시합니다.

---

## V. 시작→종료 영상 정합성 판단 기준 (Video Conformity Standard)

### 목적 및 적용 범위

> **이 기준은 Kling 모델이 자가 평가하는 데 사용되지 않습니다.**
>
> Kling은 단방향으로 영상을 생성하고 결과를 반환할 뿐, 이 기준을 읽고 스스로 재생성하지 않습니다. 이 기준의 실제 용도는 다음 세 가지입니다.
> 1. **인간 QA 체크리스트** — 사용자 또는 운영자가 생성 결과를 육안 검토할 때 기준 제공
> 2. **프롬프트 개선 피드백 루프** — 반복 실패 패턴 발견 시 §II `[NEGATIVE PROMPT]`를 보강하는 근거
> 3. **개발자 QA 로그** — 생성 완료 시 서버(route.ts)·브라우저(VideoTemplate onError) 콘솔에 구조화된 QA 요약을 자동 출력하여 개발자가 즉시 확인. Vision AI 없이 감지 가능한 조건에 한해 자동 경고, 나머지는 체크리스트 형태로 출력

---

### 차원 1. 구조적 무결성 (Structural Integrity)

건축 요소의 형상이 시작부터 종료까지 변형 없이 유지되어야 합니다.

| 항목 | PASS | FAIL |
|---|---|---|
| 기둥·보·벽체·슬래브 | 직선·직각이 전 구간 유지 | 곡선화, 비틀림, 용해(morphing) 발생 |
| 창문·개구부 | 크기·위치 고정 | 크기가 커지거나 이동 |
| 외피 재료 질감 | 연속적으로 동일 재료 유지 | 재료가 타 재료로 변환 |
| 구조 요소 개수 | 시작·종료 프레임에서 동일 | 기둥·창이 증가하거나 소멸 |

**핵심 판정 신호:** 직선 모서리(edge)의 곡선화 여부가 가장 강력한 부정합 지표입니다.

---

### 차원 2. 카메라 동선 일관성 (Camera Path Coherence)

두 이미지 사이를 연결하는 카메라 경로가 3D 공간에서 물리적으로 성립해야 합니다.

| 항목 | PASS | FAIL |
|---|---|---|
| 이동 연속성 | 달리인/플라이스루 등 단일 경로 | 공간 점프, 순간이동 발생 |
| 소실점 변화 | 경로에 따른 자연스러운 이동 | 소실점 급변 또는 비현실적 왜곡 |
| 카메라 통과 | 개구부·통로를 통과하는 경우 물리적 가능 경로 | 건축물 고체 벽체를 관통 |
| 앵글 전환 | 부드러운 연속 변화 | 갑작스러운 컷(cut) 발생 |

---

### 차원 3. 시각적 연속성 (Visual Continuity)

조명, 색온도, 재료 질감이 영상 전체에서 일관성을 유지해야 합니다.

| 항목 | PASS | FAIL |
|---|---|---|
| 조명 방향 | 전 구간 동일한 광원 방향 유지 | 그림자 방향 역전, 광원 위치 변경 |
| 색온도 | 주간/야간 등 동일 시간대 유지 | 주간에서 야간으로 전환 |
| 질감 선예도 | 전 구간 일관된 해상도 | 특정 구간에서 급격한 블러 발생 |
| 배경 환경 | 하늘, 수목, 지면이 자연스럽게 변화 | 배경이 무작위로 교체 |

---

### 차원 4. 시작·종료 프레임 재현 충실도 (Frame Fidelity)

첫 프레임은 시작 이미지를, 마지막 프레임은 종료 이미지를 시각적으로 충실히 재현해야 합니다.

> **※ 비율 처리 원칙:** 원본 이미지가 16:9가 아닌 경우, 시스템이 중앙 크롭(center crop)하여 16:9로 변환 후 Kling API에 전달합니다. 프레임 충실도 판정은 크롭된 이미지를 기준으로 합니다.

| 항목 | PASS 기준 | FAIL 기준 |
|---|---|---|
| 시작 프레임 충실도 | 시작 이미지(크롭 후)와 **시각적 유사도 ≥ 80%** — 나란히 놓았을 때 같은 건물·앵글임을 즉시 인식할 수 있어야 하며, 주요 건축 요소(기둥·창문·외피) 4/5 이상이 일치 | 완전히 다른 앵글 또는 다른 건물 |
| 종료 프레임 충실도 | 종료 이미지(크롭 후)와 **시각적 유사도 ≥ 80%** — 동일 판정 기준 적용 | 종료 이미지에 도달하지 못하고 중간 상태에서 종료 |
| 비율 일치 | 영상 첫·끝 프레임이 정확히 16:9로 출력됨 (원본 비율 무관) | 레터박스·필러박스 발생, 불규칙 크롭, 비율 왜곡 |

> **실용 판정법:** 시작 이미지와 첫 프레임을 50% 투명도로 오버레이했을 때, 건축물 윤곽선이 겹치는지 확인합니다. 종료 프레임에 대해서도 동일하게 적용합니다.

---

### 차원 5. AI 아티팩트 부재 (Artifact-Free)

의도하지 않은 AI 생성물이 영상에 포함되어서는 안 됩니다.

| 아티팩트 유형 | PASS | FAIL |
|---|---|---|
| 구조적 변형 | 없음 | 유동하는 벽체·기둥(morphing artifact) |
| 객체 생성 | 자연스러운 소수 배경 인물 허용 | 건물 구조를 가리는 의도치 않은 물체 대거 생성 |
| 텍스처 오염 | 재료 질감이 원본과 동일 | 콘크리트가 유리로 변환 등 재료 교체 |
| 교차 페이드 | 없음 | cross-dissolve 효과 발생 |
| 화면 분할 | 없음 | 화면 일부가 정지, 나머지만 움직이는 glitch |

---

### 종합 판정 등급 (Conformity Grade)

```
A — 정합 (5개 차원 모두 PASS): 배포 가능
B — 경미한 부정합 (Minor Fail 1~2개): 수용 가능, 재생성 선택 가능
C — 중대한 부정합 (Major Fail 1개 이상): 재생성 권고
D — 치명적 부정합 (Critical Fail): 즉시 재생성 권고
```

**등급별 대응 정책:**

| 등급 | 시스템 동작 | 사용자 액션 |
|---|---|---|
| A / B | 결과 표시, 별도 안내 없음 | 선택적으로 재생성 버튼 사용 |
| C | 결과 표시 + 부정합 사유 안내 | 재생성 버튼으로 수동 재생성 |
| D | 결과 표시 + 강한 경고 메시지 | 재생성 버튼으로 수동 재생성 |

**D등급 자동 로깅 조건 (Critical Fail — 자동 로깅 + 인간 시각 검토):**

> **자동 감지 가능 → 콘솔 D등급 경고 자동 출력:** 영상 URL 반환 실패, 로드 오류, URL 만료 (VideoTemplate `onError` 감지)
> **인간 시각 검토 필요 → 콘솔에 "시각 QA 체크리스트" 형태로 출력 (Vision AI 없이 자동 판별 불가):**

1. 건축물 주요 구조 요소가 변형된 경우 (기둥 곡선화, 벽체 용해)
2. 시작·종료 이미지가 동일 건물로 연결되지 않는 경우
3. 영상이 흑백·단색으로 렌더링된 경우 (API 오류 가능성)
4. 교차 페이드(cross-dissolve)가 영상 전체 길이의 50% 이상을 점유하는 경우

---

### 정합성 기준의 프롬프트 개선 활용

반복적으로 C/D등급이 발생하는 패턴이 관측되면, 해당 패턴을 §II `[NEGATIVE PROMPT]`에 추가합니다.

| 관측된 실패 패턴 | `[NEGATIVE PROMPT]`에 추가할 문장 |
|---|---|
| 기둥 곡선화 반복 발생 | `NO curved columns or bent structural members.` |
| cross-dissolve 반복 발생 | `NO cross-dissolve, NO fade transitions between frames.` (이미 포함) |
| 카메라 공간 점프 발생 | `NO spatial jumps, NO teleportation between camera positions.` |
| 재료 텍스처 교체 발생 | `NO material substitution, preserve original surface textures throughout.` |

---

## VI. 결론

본 프로토콜은 비디오 기능이 단순한 영상 효과를 넘어, 건축적 논리와 시각적 실재감을 동시에 전달할 수 있도록 설계되었습니다. 특히 **Section II**의 프롬프트 지침은 모델 업데이트 시에도 반드시 유지되어야 하는 최우선 품질 기준입니다.
