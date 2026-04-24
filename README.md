# CAI Project-10: Print Node

CAI(Creative AI) 아키텍처의 **N10 (Print) 노드**는 건축 설계 데이터, 도면, 이미지를 취합하여 원하는 레이아웃으로 출력하고 파일로 내보내는 핵심 모듈입니다. 이 문서는 Print 노드에 대한 전반적인 이해와 API 연동 가이드를 제공합니다.

---

## 0. 목차

1. [핵심 기능](#1-핵심-기능)
2. [기술 스택](#2-기술-스택)
3. [사전 요구사항](#3-사전-요구사항)
4. [설치 및 실행](#4-설치-및-실행)
5. [환경변수 설정](#5-환경변수-설정)
6. [사용 방법](#6-사용-방법)
7. [API 데이터 연동](#7-api-데이터-연동)
8. [배포 (Vercel)](#8-배포-vercel)
9. [프로젝트 구조](#9-프로젝트-구조)

---

## 1. 핵심 기능

- **다양한 출력 포맷(Mode) 지원**: REPORT(보고서), PANEL(패널), DRAWING(도면), VIDEO(비디오) 등 4가지 맞춤형 템플릿 지원
- **문서 생성 (3단계 에이전트 파이프라인)**: AI를 호출해 실행(Execution), 검증(Verification), 디자인(Design) 역할을 수행하는 3단계의 전문 에이전트가 협력하여 완벽한 문서를 자동 생성
- **비디오 생성 (FAL API - KlingO3)**: 시작 프레임과 종료 프레임 이미지를 입력받아 자연스러운 건축 공간 이동 영상을 자동 렌더링
- **멀티 페이지 문서 관리**: 지정된 페이지 수(`pageCount`)에 따라 자동으로 레이아웃 분할 및 관리 (REPORT, PANEL 전용)
- **OCR 및 메타데이터 자동 추출**: 업로드된 이미지/도면을 분석하여 프로젝트명, 설계자, 스케일 등 마스터 데이터 자동 파싱
- **문서 내보내기 (Export)**: 생성된 레이아웃을 PDF, Image, DXF 등으로 멀티 포맷 다운로드 지원
- **UI/UX 캔버스 통합**: Slot 및 Render Props 패턴을 이용해 메인 CAI Canvas 애플리케이션의 Toolbar와 Sidebar 영역에 원활하게 주입(Injection) 연동

---

## 2. 기술 스택

- **Framework**: Next.js (App Router), React
- **Language**: TypeScript
- **Styling**: TailwindCSS & Vanilla CSS (디자인 시스템 토큰 연동)
- **AI Integration**: Google Gemini API (HTML 레이아웃/텍스트 생성, 3단계 에이전트 시스템), FAL API (KlingO3 비디오 생성)
- **File Processing**: Convertio API

---

## 3. 사전 요구사항

- **Node.js**: v18.17.0 이상 권장
- **패키지 매니저**: `npm` (버전 9 이상)
- **API Keys**: 환경변수 구성 시 구글 AI, Convertio, FAL 등에서 발급받은 실제 API 키 필요

---

## 4. 설치 및 실행

해당 노드는 독립적으로 실행하여 UI 및 API 기능을 테스트할 수 있습니다.

```bash
# 1. Print 노드 애플리케이션 디렉토리로 이동
cd project.10_print

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행
npm run dev
```

서버 구동 후, 브라우저에서 `http://localhost:3777` (또는 `.env.local`의 `PORT`에 지정된 주소)로 접속하여 Print 노드를 확인합니다.

---

## 5. 환경변수 설정

`project.10_print/` 루트 디렉토리에 `.env.local` 파일을 생성하고 아래의 환경변수를 설정해야 정상 구동됩니다.

```env
# 기본 애플리케이션 설정
PORT=3777
NEXT_PUBLIC_APP_URL=http://localhost:3777

# AI 모델 연동용 API Key
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# 파일 변환 및 외부 처리를 위한 API Key
CONVERTIO_API_KEY=your_convertio_api_key_here
FAL_KEY=your_fal_api_key_here
```
*(주의: 실제 API 키가 포함된 환경변수 파일은 `.gitignore`에 등록되어 깃 저장소에 커밋되지 않아야 합니다.)*

---

## 6. 사용 방법

- **독립 실행 환경 (Stand-alone)**: `npm run dev` 실행 후 표시되는 웹 인터페이스에서 직접 이미지를 업로드하고 출력 모드를 선택하여 테스트를 진행할 수 있습니다.
- **캔버스 통합 연동 (Canvas Integration)**: Print 노드의 컴포넌트(`Print_ExpandedView.tsx`, `PrintSidebarPanel.tsx` 등)를 메인 애플리케이션에 임포트한 뒤, `connect_canvas/` 경로의 작업 명세서에 따라 부모 프레임워크 안에 주입(Render Props)하여 사용합니다.

---

## 7. API 데이터 연동

Print 노드는 캔버스 부모 애플리케이션 혹은 외부 서비스에서 호출 가능한 백엔드 엔드포인트를 제공합니다. 모든 엔드포인트는 `project.10_print/app/api/` 하위에 위치합니다.

### 7.1 주요 엔드포인트: `/api/print` (POST)
사용자의 파일 정보와 설정값을 입력받아, M3 내러티브 및 OCR로 생성된 최종 HTML 구조와 메타데이터를 반환합니다.

**[Request Payload 예시]**
```json
{
  "images": ["perspective-1.jpg", "plan-1.jpg", "diagram-1.jpg"],
  "mode": "REPORT", 
  "pageCount": 4,
  "prompt": "선택 옵션: 프로젝트 테마나 강조 지시 (미입력 시 AI 자체 분석)"
}
```
*참고: `mode`는 `"REPORT"`, `"PANEL"`, `"DRAWING"`, `"VIDEO"` 중 하나를 지원합니다.*

**[Response Payload 예시]**
```json
{
  "html": "<html>...생성된 레이아웃 HTML 코드...</html>",
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
*(비고: VIDEO 모드일 경우 MP4 스트림 URI가 `videoUri` 항목에 반환됩니다.)*

### 7.2 추가 엔드포인트
- `/api/convert`: PDF 및 멀티미디어 포맷 변환 요청
- `/api/library`: 이미지 에셋 분류 및 라이브러리용 메타데이터 제공
- `/api/fonts`: 템플릿에 주입할 폰트 파일(.ttf/.otf) 데이터 반환

---

## 8. 배포 (Vercel)

Next.js 기반이므로 Vercel 플랫폼을 이용한 배포가 가장 권장됩니다.

1. Vercel 플랫폼의 대시보드에서 `Add New...` > `Project`를 선택하여 저장소를 연결합니다.
2. Root Directory를 반드시 `project.10_print` 로 설정합니다.
3. 배포 설정의 **Environment Variables** 탭에 [5. 환경변수 설정](#5-환경변수-설정)의 Key-Value 항목들을 모두 입력합니다.
4. `Deploy`를 진행하여 라이브 서버를 구동합니다.

---

## 9. 프로젝트 구조

`project.10_print/` 디렉토리 내부의 구조는 다음과 같습니다.

```text
project.10_print/
├── app/                  # Next.js App Router 진입점
│   ├── api/              # 백엔드 통신 API (/print, /convert, /fonts, /library)
│   ├── components/       # 독립 실행용 로컬 컴포넌트
│   ├── layout.tsx        # 전역 레이아웃 설정
│   └── page.tsx          # 독립 실행 환경의 메인 페이지
├── components/           # 캔버스 연동용 UI 컴포넌트 폴더
│   ├── Print_ExpandedView.tsx   # 캔버스 확장 뷰 메인 레이아웃
│   └── PrintSidebarPanel.tsx    # 우측 사이드바 컨트롤 패널
├── lib/                  # 비즈니스 로직 및 유틸리티
│   ├── export.ts         # 문서 내보내기 관련 로직
│   ├── prompt.ts         # AI 에이전트 프롬프트 구성 함수
│   └── styles/           # 디자인 토큰 및 전역 CSS
├── types/                # 통합 TypeScript 인터페이스
└── sources/              # 템플릿 참조 및 에셋 데이터
    ├── document_template/ # 문서 모드별 참조 HTML 템플릿
    ├── fonts/            # 서비스 적용 폰트 에셋
    └── library/          # 개발용 더미 데이터
```
