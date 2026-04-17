'use client'

/**
 * PromptInput.tsx — PROMPT 텍스트 입력 영역
 * references-contents.txt §우측 사이드바 PROMPT:
 *   사용자가 텍스트로 프롬프트를 전달하는 영역 (선택 입력)
 * ARCHITECTURE.md 보안 기준: 텍스트 길이 제한 2000자
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'

interface PromptInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  /** 입력 최대 글자 수. 기본 2000 (ARCHITECTURE.md 보안 기준) */
  maxLength?: number
  placeholder?: string
}

export default function PromptInput({
  label,
  value,
  onChange,
  maxLength = 2000,
  placeholder = '문서 생성을 위한 프롬프트를 입력해 주세요. (선택사항)',
}: PromptInputProps) {
  const remaining = maxLength - value.length

  return (
    <div>
      {/* 섹션 헤더 */}
      <span className="block mb-4 text-ui-subtitle tracking-widest text-[--color-gray-400]">
        {label}
      </span>

      {/* 텍스트 입력 */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none text-sm transition-colors"
        style={{
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--radius-box)',
          border: '1px solid var(--color-gray-200)',
          backgroundColor: 'transparent',
          color: 'var(--color-text-primary)',
          outline: 'none',
          lineHeight: 1.6,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-black)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-gray-200)'
        }}
      />

      {/* 글자 수 표시 — 남은 글자가 200자 미만일 때만 표시 */}
      {remaining < 200 && (
        <p
          className="mt-1 text-right text-[10px]"
          style={{
            color: remaining < 50
              ? '#ef4444'
              : 'var(--color-text-caption)',
          }}
        >
          {remaining.toLocaleString()}자 남음
        </p>
      )}
    </div>
  )
}
