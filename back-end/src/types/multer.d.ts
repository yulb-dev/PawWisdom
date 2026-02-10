/**
 * Custom Multer type definitions
 * Temporary workaround until @types/multer can be installed
 */

declare namespace Express {
  namespace Multer {
    interface File {
      /** Name of the form field associated with this file. */
      fieldname: string;
      /** Name of the file on the user's computer. */
      originalname: string;
      /** Encoding type of the file. */
      encoding: string;
      /** Mime type of the file. */
      mimetype: string;
      /** Size of the file in bytes. */
      size: number;
      /** Destination folder. (DiskStorage) */
      destination?: string;
      /** Name of the file within the destination. (DiskStorage) */
      filename?: string;
      /** Location of the uploaded file. (DiskStorage) */
      path?: string;
      /** A Buffer of the entire file. (MemoryStorage) */
      buffer?: Buffer;
      /** A stream of the uploaded file. (Custom storage engines only) */
      stream?: NodeJS.ReadableStream;
    }
  }
}
