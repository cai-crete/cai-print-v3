import React from 'react'

/**
 * N10 print 노드 - VIDEO 모드 전용 템플릿
 * Veo 3.1 Lite API를 통해 생성된 영상을 렌더링하는 컴포넌트입니다.
 */
export default function VideoTemplate({ videoUri }: { videoUri: string | null }) {
  if (!videoUri) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
        비디오 생성 대기 중...
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg bg-black">
      <video
        src={videoUri}
        controls
        autoPlay
        loop
        className="w-full h-auto"
      >
        브라우저가 비디오 태그를 지원하지 않습니다.
      </video>
    </div>
  )
}