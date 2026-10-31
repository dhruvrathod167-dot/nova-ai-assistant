import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export default function Favicon() {
  return new ImageResponse(
    (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" fill="#6366F1"/>
        <circle cx="8" cy="8" r="4" fill="none" stroke="white" strokeWidth="1" opacity="0.8"/>
        <circle cx="8" cy="6" r="1" fill="white"/>
        <circle cx="6" cy="10" r="0.75" fill="white"/>
        <circle cx="10" cy="10" r="0.75" fill="white"/>
        <path d="M6.5 11Q8 12.5 9.5 11" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
        <circle cx="8" cy="8" r="1.5" fill="white" opacity="0.9"/>
      </svg>
    ),
    {
      width: 16,
      height: 16,
    }
  );
}