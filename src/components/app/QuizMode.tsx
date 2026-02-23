/**
 * QuizMode — Fullscreen Quiz-Overlay
 *
 * 10 zufällige Fragen, eine nach der anderen.
 * Am Ende: Score + Highscore + Nochmal/Zurück.
 */
import { useState, useCallback, useMemo } from 'react'
import { X, ChevronRight, RotateCcw, CheckCircle2, XCircle, BookOpen, Trophy } from 'lucide-react'
import { getRandomQuestions, saveQuizScore, getQuizBestScore } from '@/data/quiz-data'
import { SURVIVAL_GUIDES } from '@/data/survival-guides'

interface QuizModeProps {
  onClose: () => void
}

type QuizState = 'question' | 'answered' | 'result'

export default function QuizMode({ onClose }: QuizModeProps) {
  const questions = useMemo(() => getRandomQuestions(10), [])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [state, setState] = useState<QuizState>('question')
  const [bestScore] = useState(() => getQuizBestScore())

  const currentQ = questions[currentIdx]

  const handleAnswer = useCallback((optionIdx: number) => {
    if (state !== 'question') return
    setSelectedAnswer(optionIdx)
    if (optionIdx === currentQ.correctIndex) {
      setCorrectCount(prev => prev + 1)
    }
    setState('answered')
  }, [state, currentQ])

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      // Quiz complete
      // Score was already incremented in handleAnswer
      saveQuizScore(correctCount)
      setState('result')
    } else {
      setCurrentIdx(prev => prev + 1)
      setSelectedAnswer(null)
      setState('question')
    }
  }, [currentIdx, questions.length, correctCount, selectedAnswer, currentQ])

  const handleRestart = useCallback(() => {
    // Re-randomize by just resetting state - questions are memoized so we need new ones
    window.location.reload() // Simple approach - quiz is an overlay anyway
  }, [])

  const getGuideTitle = (guideId: string): string => {
    return SURVIVAL_GUIDES.find(g => g.id === guideId)?.title || ''
  }

  // ─── Result Screen ──────────────────────────────────

  if (state === 'result') {
    const score = correctCount
    const isNewBest = score > bestScore
    const percentage = Math.round((score / questions.length) * 100)

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
          <div className="p-8 text-center">
            {/* Score */}
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-50">
              <span className="text-4xl font-bold text-primary-600">{score}</span>
            </div>
            <p className="text-lg text-text-secondary">
              von {questions.length} richtig ({percentage}%)
            </p>

            {/* Feedback */}
            <p className="mt-3 text-sm font-semibold text-text-primary">
              {percentage >= 90
                ? 'Hervorragend! Du bist ein Krisenvorsorge-Experte!'
                : percentage >= 70
                  ? 'Sehr gut! Du kennst dich gut aus.'
                  : percentage >= 50
                    ? 'Nicht schlecht! Es gibt aber noch Lernpotential.'
                    : 'Weiter lernen! Schau dir die Guides an.'}
            </p>

            {/* Best Score */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                {isNewBest ? 'Neuer Highscore!' : `Highscore: ${Math.max(bestScore, score)}/${questions.length}`}
              </span>
            </div>
          </div>

          <div className="flex gap-3 border-t border-border px-6 py-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              Zur\u00FCck
            </button>
            <button
              onClick={handleRestart}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <RotateCcw className="h-4 w-4" />
              Nochmal
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Question Screen ────────────────────────────────

  const isCorrect = selectedAnswer === currentQ.correctIndex

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-primary-600">
              Frage {currentIdx + 1}/{questions.length}
            </span>
            <div className="h-1.5 w-32 rounded-full bg-surface-secondary">
              <div
                className="h-1.5 rounded-full bg-primary-500 transition-all"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Question */}
        <div className="px-6 py-6">
          <h3 className="mb-5 text-lg font-bold text-text-primary">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, idx) => {
              let optionStyle = 'border-border bg-white hover:border-primary-300 hover:bg-primary-50'

              if (state === 'answered') {
                if (idx === currentQ.correctIndex) {
                  optionStyle = 'border-green-300 bg-green-50'
                } else if (idx === selectedAnswer && !isCorrect) {
                  optionStyle = 'border-red-300 bg-red-50'
                } else {
                  optionStyle = 'border-border bg-surface-secondary/50 opacity-60'
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={state === 'answered'}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${optionStyle}`}
                >
                  {state === 'answered' && idx === currentQ.correctIndex ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                  ) : state === 'answered' && idx === selectedAnswer && !isCorrect ? (
                    <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-current text-xs opacity-40">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  )}
                  <span className={state === 'answered' && idx === currentQ.correctIndex ? 'text-green-700' : 'text-text-primary'}>
                    {option}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Explanation (after answering) */}
          {state === 'answered' && (
            <div className={`mt-4 rounded-xl p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`text-sm font-semibold ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
                {isCorrect ? 'Richtig!' : 'Leider falsch.'}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {currentQ.explanation}
              </p>
              {getGuideTitle(currentQ.guideId) && (
                <p className="mt-2 flex items-center gap-1 text-xs text-text-muted">
                  <BookOpen className="h-3 w-3" />
                  Mehr dazu: {getGuideTitle(currentQ.guideId)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {state === 'answered' && (
          <div className="border-t border-border px-6 py-4">
            <button
              onClick={handleNext}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              {currentIdx + 1 >= questions.length ? 'Ergebnis anzeigen' : 'N\u00E4chste Frage'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Score counter */}
        <div className="px-6 pb-4 text-center text-xs text-text-muted">
          {correctCount} von {currentIdx + (state === 'answered' ? 1 : 0)} richtig
        </div>
      </div>
    </div>
  )
}
