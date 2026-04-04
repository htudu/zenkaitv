import Hls from 'hls.js'
import { useEffect, useRef } from 'react'

type VideoPlayerProps = {
  src: string
  streamType: string
}

export function VideoPlayer({ src, streamType }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    if (streamType === 'progressive-mp4') {
      videoElement.src = src
      return
    }

    if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = src
      return
    }

    if (!Hls.isSupported()) {
      return
    }

    const hls = new Hls()
    hls.loadSource(src)
    hls.attachMedia(videoElement)

    return () => {
      hls.destroy()
    }
  }, [src, streamType])

  return <video className="video-preview" controls preload="metadata" ref={videoRef} />
}
