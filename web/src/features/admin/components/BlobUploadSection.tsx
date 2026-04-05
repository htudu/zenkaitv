type BlobUploadSectionProps = {
  blobFile: File | null
  blobPath: string
  blobUploadMessage: string | null
  loading: boolean
  overwriteBlob: boolean
  onBlobFileChange: (file: File | null) => void
  onBlobPathChange: (value: string) => void
  onOverwriteBlobChange: (value: boolean) => void
  onUploadBlobFile: (event: React.FormEvent<HTMLFormElement>) => void
}

export function BlobUploadSection({
  blobFile,
  blobPath,
  blobUploadMessage,
  loading,
  overwriteBlob,
  onBlobFileChange,
  onBlobPathChange,
  onOverwriteBlobChange,
  onUploadBlobFile,
}: BlobUploadSectionProps) {
  return (
    <form className="admin-panel upload-form" onSubmit={onUploadBlobFile}>
      <div className="section-header compact-header admin-panel-header">
        <h2>Blob upload</h2>
        <span>Direct file placement</span>
      </div>
      <label htmlFor="blob-path">Production blob path</label>
      <input
        id="blob-path"
        value={blobPath}
        onChange={(event) => onBlobPathChange(event.target.value)}
        placeholder="movie.mp4"
      />
      <label htmlFor="blob-file">File</label>
      <input
        id="blob-file"
        type="file"
        onChange={(event) => onBlobFileChange(event.target.files?.[0] ?? null)}
      />
      <label className="checkbox-row" htmlFor="overwrite-blob">
        <input
          id="overwrite-blob"
          type="checkbox"
          checked={overwriteBlob}
          onChange={(event) => onOverwriteBlobChange(event.target.checked)}
        />
        <span>Overwrite existing blob</span>
      </label>
      <button type="submit" disabled={loading || !blobFile}>
        Upload to blob
      </button>
      {blobUploadMessage ? <p className="helper-copy">{blobUploadMessage}</p> : null}
    </form>
  )
}
