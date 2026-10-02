import { collection, doc, setDoc, getDocs, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// In-memory cache for resolved audio blob URLs so we only fetch chunks once per session
const audioBlobCache = new Map<string, string>();

/**
 * Extracts YouTube 11-character video ID from any format:
 * - https://youtu.be/VVH2neygsE0?si=...
 * - https://www.youtube.com/watch?v=VVH2neygsE0
 * - https://music.youtube.com/watch?v=VVH2neygsE0
 * - https://www.youtube.com/embed/VVH2neygsE0
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

/**
 * Upload an audio file to Firestore by splitting into 450KB chunks.
 * This guarantees the audio is permanently saved and synchronized across ALL devices and visitors.
 */
export async function uploadAudioFileToFirestore(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<{ audioId: string; url: string }> {
  // Enforce sensible size limit (up to 8 MB)
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Kích thước tệp âm thanh quá lớn (> 8MB). Vui lòng chọn tệp nhỏ hơn hoặc nén lại trước khi tải lên.');
  }

  // Read file as base64 Data URL
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Không thể đọc tệp âm thanh'));
    reader.readAsDataURL(file);
  });

  const audioId = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  // 450,000 chars per chunk (~450KB, well within Firestore 1MB document limit)
  const CHUNK_SIZE = 450000;
  const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);

  // 1. Save metadata
  await setDoc(doc(db, 'audio_tracks', audioId), {
    id: audioId,
    name: file.name,
    size: file.size,
    type: file.type || 'audio/mpeg',
    totalChunks,
    createdAt: new Date().toISOString()
  });

  // 2. Save each chunk
  for (let i = 0; i < totalChunks; i++) {
    const chunkData = base64Data.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await setDoc(doc(db, 'audio_tracks', audioId, 'chunks', `chunk_${i}`), {
      chunkIndex: i,
      data: chunkData
    });
    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }
  }

  // Pre-cache in current session
  const blob = dataUrlToBlob(base64Data);
  const blobUrl = URL.createObjectURL(blob);
  audioBlobCache.set(audioId, blobUrl);

  return {
    audioId,
    url: `firestore://${audioId}`
  };
}

/**
 * Resolves a track URL. If it's a 'firestore://' URL, downloads chunks from Firestore
 * and creates a playable in-memory Blob URL for the browser.
 */
export async function resolveAudioUrl(url: string): Promise<string> {
  if (!url) return '';

  if (url.startsWith('synth://') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('firestore://')) {
    const audioId = url.replace('firestore://', '');

    // Return from cache if already resolved
    if (audioBlobCache.has(audioId)) {
      return audioBlobCache.get(audioId)!;
    }

    try {
      // Fetch metadata
      const metaDoc = await getDoc(doc(db, 'audio_tracks', audioId));
      if (!metaDoc.exists()) {
        throw new Error('Tệp âm thanh không tồn tại trên máy chủ');
      }

      // Fetch all chunks
      const chunksQuery = query(
        collection(db, 'audio_tracks', audioId, 'chunks'),
        orderBy('chunkIndex', 'asc')
      );
      const chunksSnap = await getDocs(chunksQuery);

      if (chunksSnap.empty) {
        throw new Error('Dữ liệu âm thanh trống');
      }

      let completeBase64 = '';
      chunksSnap.forEach(snap => {
        const data = snap.data();
        if (data.data) {
          completeBase64 += data.data;
        }
      });

      const blob = dataUrlToBlob(completeBase64);
      const blobUrl = URL.createObjectURL(blob);
      audioBlobCache.set(audioId, blobUrl);
      return blobUrl;
    } catch (err) {
      console.error('Failed to load audio from Firestore:', err);
      // Fallback to pleasant fairy synth melody if audio failed to load
      return 'synth://fairy-garden';
    }
  }

  // If it's a stale blob: URL from another session, fallback to synth
  if (url.startsWith('blob:')) {
    return url;
  }

  return url;
}

/**
 * Helper to convert Base64 data URI to standard Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'audio/mpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
