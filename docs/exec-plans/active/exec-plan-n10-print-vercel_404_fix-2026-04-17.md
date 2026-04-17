# Vercel 배포 404 에러 해결 계획서

Vercel에 배포된 프로젝트에서 404 에러가 발생하는 원인을 분석하고, 이를 해결하기 위한 구체적인 방법과 가이드를 제시합니다.

## 문제 분석

현재 프로젝트 구조는 다음과 같습니다:
- 루트 디렉토리: 배포 기준 위치
- `/project.10_print`: 실제 Next.js 프로젝트 및 `package.json` 위치

Vercel은 기본적으로 루트 디렉토리에서 빌드 설정을 찾습니다. 루트 디렉토리에 `package.json`이나 빌드된 결과물이 없기 때문에, 배포 프로세스가 정상적으로 동작하지 않거나 잘못된 경로를 참조하여 404 에러가 발생하는 것으로 판단됩니다.

## 해결 방안

### 1. Vercel 설정 변경 (권장)

Vercel 대시보드에서 프로젝트 설정을 수정하여 서비스 경로를 명시합니다.

1. **Vercel Dashboard**에 접속하여 해당 프로젝트를 선택합니다.
2. **Settings** -> **General** 섹션으로 이동합니다.
3. **Root Directory** 옵션의 Edit 버튼을 누르고 `project.10_print`를 입력/선택합니다.
4. **Save**를 클릭합니다.
5. **Deployments** 탭에서 최신 커밋을 다시 배포(Redeploy)합니다.

### 2. 루트 설정 파일 보완 (보조)

루트 디렉토리에 `vercel.json` 파일을 추가하여 배포 구성을 명시적으로 제어할 수 있습니다.

#### [NEW] [vercel.json](file:///c:/Users/USER01/Downloads/cai-harness-print/vercel.json)

```json
{
  "buildCommand": "cd project.10_print && npm install && npm run build",
  "outputDirectory": "project.10_print/.next",
  "framework": "nextjs"
}
```

## 위험성 및 고려 사항

- **수동 설정 필요**: Vercel 대시보드 설정은 사용자가 직접 수행해야 하며, 이를 수행하지 않으면 코드 수정만으로는 404가 해결되지 않을 수 있습니다.
- **환경 변수**: `project.10_print` 디렉토리 내에서 사용하던 `.env.local`의 환경 변수(예: API 키)들이 Vercel Dashboard의 **Environment Variables**에 모두 등록되어 있는지 확인해야 합니다.

## 검증 계획

### 수동 검증
- Vercel 대시보드 설정 변경 후 배포 로그에서 빌드가 성공하는지 확인합니다.
- 생성된 배포 URL로 접속하여 페이지가 정상적으로 렌더링되는지 확인합니다.
