import type { R2ObjectInfo, ListFilesResponse } from '../types';

export async function listFiles(
  bucket: R2Bucket,
  prefix: string,
  delimiter: string = '/'
): Promise<ListFilesResponse> {
  const opts: R2ListOptions = {
    prefix: prefix || undefined,
    delimiter,
  };

  const objects = await bucket.list(opts);

  const files: R2ObjectInfo[] = [];

  // 文件夹
  for (const folder of objects.delimitedPrefixes) {
    files.push({
      key: folder,
      size: 0,
      lastModified: '',
      isFolder: true,
    });
  }

  // 文件
  for (const obj of objects.objects) {
    if (obj.key.endsWith('/')) continue;
    files.push({
      key: obj.key,
      size: obj.size,
      lastModified: obj.uploaded.toISOString(),
      isFolder: false,
      etag: obj.etag,
    });
  }

  return {
    files,
    prefix: prefix || '',
    truncated: objects.truncated,
  };
}

export async function getFile(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

export async function uploadFile(
  bucket: R2Bucket,
  key: string,
  body: ArrayBuffer | ReadableStream,
  contentType?: string
): Promise<void> {
  await bucket.put(key, body, {
    httpMetadata: contentType ? { contentType } : undefined,
  });
}

export async function deleteFile(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

export async function deleteFolder(bucket: R2Bucket, prefix: string): Promise<void> {
  let cursor: string | undefined;
  do {
    const list = await bucket.list({ prefix, cursor });
    for (const obj of list.objects) {
      await bucket.delete(obj.key);
    }
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
}

export async function createFolder(bucket: R2Bucket, prefix: string): Promise<void> {
  const folderKey = prefix.endsWith('/') ? prefix : `${prefix}/`;
  await bucket.put(folderKey + '.keep', new Uint8Array(0));
}