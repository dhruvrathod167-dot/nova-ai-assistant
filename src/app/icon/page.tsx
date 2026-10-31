import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#6366F1"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
        <circle cx="16" cy="12" r="2" fill="white"/>
        <circle cx="12" cy="20" r="1.5" fill="white"/>
        <circle cx="20" cy="20" r="1.5" fill="white"/>
        <path d="M13 22Q16 25 19 22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
        <circle cx="16" cy="16" r="3" fill="white" opacity="0.9"/>
      </svg>
    ),
    {
      width: 32,
      height: 32,
    }
  );
}