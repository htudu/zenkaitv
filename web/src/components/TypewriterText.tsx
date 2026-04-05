import { useState, useEffect } from 'react'

export function TypewriterText({
  sequence,
  speed = 40,
  pauseBetween = 2500,
  className,
  id,
  onComplete,
}: {
  sequence: string[]
  speed?: number
  pauseBetween?: number
  className?: string
  id?: string
  onComplete?: () => void
}) {
  const [sequenceIndex, setSequenceIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)

  const currentText = sequence[sequenceIndex]

  useEffect(() => {
    if (!currentText || isFadingOut) return

    if (currentIndex < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + currentText[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)
      return () => clearTimeout(timeout)
    } else if (sequenceIndex < sequence.length - 1) {
      // Pause then fade out
      const pauseTimeout = setTimeout(() => {
        setIsFadingOut(true)
        setTimeout(() => {
          setDisplayedText('')
          setCurrentIndex(0)
          setSequenceIndex((prev) => prev + 1)
          setIsFadingOut(false)
        }, 800) // matches CSS transition duration
      }, pauseBetween)
      return () => clearTimeout(pauseTimeout)
    } else if (sequenceIndex === sequence.length - 1) {
      if (onComplete) {
        const completionTimeout = setTimeout(() => {
          onComplete()
        }, pauseBetween)
        return () => clearTimeout(completionTimeout)
      }
    }
  }, [currentIndex, currentText, isFadingOut, pauseBetween, sequence.length, sequenceIndex, speed, onComplete])

  const finishedTypingWord = currentIndex >= (currentText?.length ?? 0)

  return (
    <p id={id} className={`${className || ''} ${isFadingOut ? 'typewriter-fade-out' : 'typewriter-fade-in'}`}>
      {displayedText}
      <span className={`typewriter-cursor ${finishedTypingWord && sequenceIndex === sequence.length - 1 ? 'is-finished' : ''}`}>|</span>
    </p>
  )
}
