// Firebase Storage upload utilities for Zentrix Chat

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";
import { v4 as uuidv4 } from "uuid";

export type UploadProgressCallback = (progress: number) => void;

export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  const fileRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

export const uploadChatImage = async (
  chatId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  const ext = file.name.split(".").pop();
  const path = `chats/${chatId}/images/${uuidv4()}.${ext}`;
  return uploadFile(file, path, onProgress);
};

export const uploadChatFile = async (
  chatId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  const path = `chats/${chatId}/files/${uuidv4()}_${file.name}`;
  return uploadFile(file, path, onProgress);
};

export const uploadVoiceNote = async (
  chatId: string,
  blob: Blob,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  const path = `chats/${chatId}/voice/${uuidv4()}.webm`;
  const file = new File([blob], "voice.webm", { type: "audio/webm" });
  return uploadFile(file, path, onProgress);
};

export const uploadAvatar = async (
  uid: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  const ext = file.name.split(".").pop();
  const path = `avatars/${uid}.${ext}`;
  return uploadFile(file, path, onProgress);
};

export const deleteStorageFile = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // Ignore errors if file doesn't exist
  }
};
