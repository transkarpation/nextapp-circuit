import { EthoraConfigError } from './errors';

/** A file to upload in a multipart request. */
export interface UploadFile {
  data: Buffer | Uint8Array | Blob | string;
  filename?: string;
  contentType?: string;
}

/**
 * Build a multipart `FormData` from plain fields and a list of files.
 *
 * Each file may be `{ data, filename, contentType }` or a `Blob`/`File`.
 * Object/array fields are JSON-stringified; `null`/`undefined` are skipped.
 */
export function buildForm(
  fields: Record<string, unknown> = {},
  files: Array<UploadFile | Blob> = [],
  fileField = 'files'
): FormData {
  if (typeof FormData !== 'function' || typeof Blob !== 'function') {
    throw new EthoraConfigError(
      'global FormData/Blob unavailable; use Node >= 18 for multipart uploads'
    );
  }
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }

  for (const file of files) {
    if (file instanceof Blob) {
      form.append(fileField, file);
      continue;
    }
    const { data, filename, contentType } = file ?? ({} as UploadFile);
    if (data == null) throw new EthoraConfigError('file entry is missing `data`');
    const blob =
      data instanceof Blob
        ? data
        : new Blob(
            [data] as ConstructorParameters<typeof Blob>[0],
            contentType ? { type: contentType } : undefined
          );
    form.append(fileField, blob, filename || 'file');
  }

  return form;
}
