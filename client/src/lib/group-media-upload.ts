type VoiceUploadResponse = {
  url?: string;
  error?: string;
};

export function uploadGroupVoiceNote(
  audioBlob: Blob,
  groupId: number,
  clientRequestId: string,
  onProgress: (percentage: number) => void
) {
  return new Promise<string>((resolve, reject) => {
    const query = new URLSearchParams({
      groupId: String(groupId),
      requestId: clientRequestId,
    });
    const request = new XMLHttpRequest();
    request.open("POST", `/api/group-media/voice?${query.toString()}`);
    request.responseType = "json";
    request.timeout = 30_000;
    request.withCredentials = true;
    request.setRequestHeader("Content-Type", audioBlob.type || "audio/webm");
    request.setRequestHeader("Accept", "application/json");

    request.upload.onprogress = event => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    request.onerror = () => {
      reject(new Error("The voice-note upload lost its network connection"));
    };
    request.ontimeout = () => {
      reject(new Error("The voice-note upload timed out"));
    };
    request.onload = () => {
      const payload = request.response as VoiceUploadResponse | null;
      if (request.status < 200 || request.status >= 300 || !payload?.url) {
        reject(
          new Error(
            payload?.error ||
              `Voice-note upload failed (${request.status || "offline"})`
          )
        );
        return;
      }
      onProgress(100);
      resolve(payload.url);
    };

    request.send(audioBlob);
  });
}
