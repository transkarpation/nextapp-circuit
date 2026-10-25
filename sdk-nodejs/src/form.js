'use strict'

const { EthoraConfigError } = require('./errors')

/**
 * Build a multipart `FormData` from plain fields and a list of files.
 *
 * Each file may be:
 *  - `{ data, filename, contentType }` where `data` is a Buffer/Uint8Array/Blob/string
 *  - a Blob/File directly (Node 18+ has global Blob)
 *
 * @param {object} [fields] - scalar fields; objects/arrays are JSON-stringified
 * @param {Array} [files] - files appended under the `files` field
 * @param {string} [fileField='files']
 * @returns {FormData}
 */
function buildForm(fields = {}, files = [], fileField = 'files') {
  if (typeof FormData !== 'function' || typeof Blob !== 'function') {
    throw new EthoraConfigError(
      'global FormData/Blob unavailable; use Node >= 18 for multipart uploads'
    )
  }
  const form = new FormData()

  for (const [key, value] of Object.entries(fields || {})) {
    if (value == null) continue
    if (typeof value === 'object') {
      form.append(key, JSON.stringify(value))
    } else {
      form.append(key, String(value))
    }
  }

  for (const file of files || []) {
    if (file instanceof Blob) {
      form.append(fileField, file)
      continue
    }
    const { data, filename, contentType } = file || {}
    if (data == null) throw new EthoraConfigError('file entry is missing `data`')
    const blob =
      data instanceof Blob
        ? data
        : new Blob([data], contentType ? { type: contentType } : undefined)
    form.append(fileField, blob, filename || 'file')
  }

  return form
}

module.exports = { buildForm }
