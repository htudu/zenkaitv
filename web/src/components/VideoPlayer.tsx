import Hls from 'hls.js'
import { useEffect, useRef } from 'react'

type VideoPlayerProps = {
  src: string
  streamType?: string
}

export function VideoPlayer({ src, streamType }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    const tryAutoplay = () => {
      void videoElement.play().catch(() => {
        // Browsers may block autoplay until the user interacts with the page.
      })
    }

    const resolvedStreamType = streamType ?? ''

    if (resolvedStreamType.startsWith('progressive-')) {
      videoElement.src = src
      videoElement.load()
      tryAutoplay()
      return
    }

    if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = src
      videoElement.load()
      tryAutoplay()
      return
    }

    if (!Hls.isSupported()) {
      return
    }

    const hls = new Hls()
    hls.loadSource(src)
    hls.attachMedia(videoElement)
    hls.on(Hls.Events.MANIFEST_PARSED, tryAutoplay)

    return () => {
      hls.destroy()
    }
  }, [src, streamType])

  return <video autoPlay className="video-preview" controls playsInline preload="metadata" ref={videoRef} />
}
