import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 업로드 이미지는 서버에 저장하지 않고 메모리에서 처리 (SECURITY.md 기준)
  // 파일 업로드 크기 제한: 50MB (A0 고해상도 이미지 다수 업로드 대응)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

export default nextConfig