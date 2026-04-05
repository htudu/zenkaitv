import { useCallback, useEffect, useState } from 'react'
import { ApiRequestError, createPlaybackGrant, getCatalog } from '../lib/api'
import type { Movie, PlaybackGrant } from '../types'

type UsePlaybackCatalogOptions = {
  authToken: string
  onSessionExpired: () => void
}

export function usePlaybackCatalog({ authToken, onSessionExpired }: UsePlaybackCatalogOptions) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedGrant, setSelectedGrant] = useState<PlaybackGrant | null>(null)
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null)
  const [playbackLoading, setPlaybackLoading] = useState(false)

  useEffect(() => {
    if (movies.length === 0) {
      setSelectedMovieId(null)
      setSelectedGrant(null)
      return
    }

    const selectedMovieStillExists = selectedMovieId
      ? movies.some((movie) => movie.id === selectedMovieId)
      : false

    if (!selectedMovieStillExists) {
      setSelectedMovieId(movies[0].id)
    }
  }, [movies, selectedMovieId])

  useEffect(() => {
    if (!authToken || !selectedMovieId) {
      return
    }

    let isCancelled = false
    const movieId = selectedMovieId

    async function requestPlaybackGrantForMovie() {
      setPlaybackLoading(true)

      try {
        const grant = await createPlaybackGrant(authToken, movieId)
        if (!isCancelled) {
          setSelectedGrant(grant)
        }
      } finally {
        if (!isCancelled) {
          setPlaybackLoading(false)
        }
      }
    }

    void requestPlaybackGrantForMovie()

    return () => {
      isCancelled = true
    }
  }, [authToken, selectedMovieId])

  const refreshLibrary = useCallback(async (token: string) => {
    try {
      setMovies(await getCatalog(token))
    } catch (loadError) {
      if (loadError instanceof ApiRequestError && loadError.status === 401) {
        onSessionExpired()
        throw new Error('Your session expired. Log in again.')
      }

      throw loadError
    }
  }, [onSessionExpired])

  const resetLibrary = useCallback(() => {
    setMovies([])
    setSelectedMovieId(null)
    setSelectedGrant(null)
  }, [])

  return {
    movies,
    playbackLoading,
    refreshLibrary,
    resetLibrary,
    selectedGrant,
    selectedMovieId,
    setSelectedMovieId,
  }
}
