/**
 * BadgeModal — Celebration bei neuem Badge-Unlock
 *
 * CSS-only Confetti-Animation, Emoji groß, Name + Beschreibung.
 */
import type { Badge } from '@/hooks/useVorsorgeScore'

interface BadgeModalProps {
  badge: Badge
  onClose: () => void
}

export default function BadgeModal({ badge, onClose }: BadgeModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="relative mx-4 w-full max-w-sm animate-bounce-in overflow-hidden rounded-2xl bg-white p-8 text-center shadow-xl"
      >
        {/* Confetti particles (CSS-only) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="confetti-particle absolute"
              style={{
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'][i % 6],
              }}
            />
          ))}
        </div>

        {/* Badge Emoji */}
        <div className="mb-4 text-6xl">{badge.emoji}</div>

        {/* Title */}
        <h2 className="mb-1 text-xl font-bold text-text-primary">
          Badge freigeschaltet!
        </h2>

        {/* Badge Name */}
        <p className="mb-2 text-lg font-semibold text-primary-600">
          {badge.name}
        </p>

        {/* Description */}
        <p className="mb-6 text-sm text-text-secondary">
          {badge.description}
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Weiter
        </button>
      </div>

      {/* Confetti CSS */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out;
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
        .confetti-particle {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          animation: confetti-fall 2s ease-in forwards;
        }
      `}</style>
    </div>
  )
}
