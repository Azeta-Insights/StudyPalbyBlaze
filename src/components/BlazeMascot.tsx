import React from 'react';
import { MascotMood } from '../types';

interface BlazeMascotProps {
  mood?: MascotMood;
  size?: number; // size in px
  showGlow?: boolean;
  className?: string;
}

export const BlazeMascot: React.FC<BlazeMascotProps> = ({
  mood = 'HAPPY',
  size = 96,
  showGlow = true,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Radial Amber Glow */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255, 144, 94, 0.45) 0%, rgba(255, 99, 33, 0.15) 50%, transparent 70%)',
            filter: 'blur(10px)',
            transform: 'scale(1.2)',
          }}
        />
      )}

      {/* SVG Canvas for Flame Mascot */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10 transition-transform duration-300"
        style={{
          filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3))',
        }}
      >
        <defs>
          {/* Flame Outer Gradient */}
          <linearGradient id="blazeOuterGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFA270" />
            <stop offset="45%" stopColor="#FF6321" />
            <stop offset="100%" stopColor="#D84315" />
          </linearGradient>

          {/* Flame Inner Core Gradient */}
          <linearGradient id="blazeInnerGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFDE7" />
            <stop offset="40%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#FFA000" />
          </linearGradient>

          {/* Mortarboard Gradient */}
          <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        {/* 1. Floating & Breathing Group */}
        <g className="animate-[bounce_3s_ease-in-out_infinite]">
          {/* Confetti if CELEBRATING */}
          {mood === 'CELEBRATING' && (
            <g className="animate-spin" style={{ transformOrigin: '50px 50px', animationDuration: '8s' }}>
              <circle cx="20" cy="18" r="2.2" fill="#F59E0B" />
              <circle cx="80" cy="22" r="2.4" fill="#3B82F6" />
              <circle cx="14" cy="54" r="2.5" fill="#10B981" />
              <circle cx="86" cy="50" r="2" fill="#EC4899" />
              <circle cx="28" cy="10" r="2.2" fill="#8B5CF6" />
              <circle cx="72" cy="12" r="2.2" fill="#F59E0B" />
            </g>
          )}

          {/* 2. Outer Flame Body */}
          <path
            d="M 50 14
               C 68 36, 84 52, 84 68
               C 84 84, 68 88, 50 88
               C 32 88, 16 84, 16 68
               C 16 52, 32 36, 50 14 Z"
            fill="url(#blazeOuterGrad)"
          />

          {/* 3. Inner Warm Core */}
          <path
            d="M 50 40
               C 62 56, 70 68, 70 78
               C 70 88, 60 90, 50 90
               C 40 90, 30 88, 30 78
               C 30 68, 38 56, 50 40 Z"
            fill="url(#blazeInnerGrad)"
            opacity="0.95"
          />

          {/* 4. Raised Victory Arms for CELEBRATING or SALUTE */}
          {mood === 'CELEBRATING' && (
            <>
              {/* Left raised arm */}
              <path
                d="M 26 70 Q 12 55, 10 42"
                stroke="#D84315"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              {/* Right raised arm */}
              <path
                d="M 74 70 Q 88 55, 90 42"
                stroke="#D84315"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}

          {mood === 'SALUTING' && (
            <path
              d="M 74 70 Q 86 60, 78 44"
              stroke="#D84315"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* 5. Scholastic Mortarboard Graduation Cap */}
          <g>
            {/* Skullcap Base */}
            <path
              d="M 36 22 L 36 29 C 36 33, 64 33, 64 29 L 64 22 Z"
              fill="url(#capGrad)"
            />
            {/* Cap Diamond Top */}
            <polygon
              points="50,11 76,20 50,29 24,20"
              fill="#0F172A"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Golden Center Button */}
            <circle cx="50" cy="20" r="2.8" fill="#F59E0B" />
            {/* Golden Tassel Cord */}
            <path
              d="M 50 20 Q 64 22, 70 32"
              stroke="#F59E0B"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Golden Tassel End Knot */}
            <circle cx="70" cy="32" r="3" fill="#F59E0B" />
          </g>

          {/* 6. Expressive Face according to Mood */}
          {/* Rosy Cheeks */}
          <circle cx="33" cy="68" r="4.2" fill="#F43F5E" opacity="0.35" />
          <circle cx="67" cy="68" r="4.2" fill="#F43F5E" opacity="0.35" />

          {/* Eyes & Mouth by Mood */}
          {(mood === 'HAPPY' || mood === 'CELEBRATING' || mood === 'SALUTING') && (
            <>
              {/* Left Eye */}
              <circle cx="39" cy="61" r="4" fill="#0F172A" />
              <circle cx="40.5" cy="59.5" r="1.5" fill="#FFFFFF" />

              {/* Right Eye */}
              <circle cx="61" cy="61" r="4" fill="#0F172A" />
              <circle cx="62.5" cy="59.5" r="1.5" fill="#FFFFFF" />

              {/* Cheerful Smile */}
              <path
                d="M 42 71 Q 50 81, 58 71"
                stroke="#0F172A"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill={mood === 'CELEBRATING' ? '#0F172A' : 'none'}
              />
            </>
          )}

          {mood === 'THINKING' && (
            <>
              {/* Left raised questioning eye */}
              <circle cx="39" cy="58" r="4" fill="#0F172A" />
              <circle cx="40.5" cy="56.5" r="1.5" fill="#FFFFFF" />
              {/* Left raised brow */}
              <path d="M 35 52 Q 40 49, 45 52" stroke="#0F172A" strokeWidth="1.8" fill="none" strokeLinecap="round" />

              {/* Right focused eye */}
              <circle cx="61" cy="62" r="3.4" fill="#0F172A" />
              <circle cx="62.2" cy="60.8" r="1.2" fill="#FFFFFF" />

              {/* Pensive smirk mouth */}
              <path
                d="M 45 74 Q 53 72, 57 73"
                stroke="#0F172A"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}

          {mood === 'EMPATHETIC' && (
            <>
              {/* Gentle caring eyes */}
              <circle cx="39" cy="61" r="3.5" fill="#0F172A" />
              <circle cx="40.2" cy="59.8" r="1.2" fill="#FFFFFF" />

              <circle cx="61" cy="61" r="3.5" fill="#0F172A" />
              <circle cx="62.2" cy="59.8" r="1.2" fill="#FFFFFF" />

              {/* Gentle warm smile */}
              <path
                d="M 43 72 Q 50 76, 57 72"
                stroke="#0F172A"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}
        </g>
      </svg>
    </div>
  );
};
