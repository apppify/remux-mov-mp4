/**
 * Represents a box/atom in an ISO Base Media File Format container
 */
export interface BoxNode {
  /** Four-character box type identifier (e.g., 'ftyp', 'moov', 'mdat') */
  type: string;

  /** Size of the box in bytes, including header */
  size: number;

  /** Byte offset where this box starts in the original buffer */
  start: number;

  /** Byte offset where this box ends in the original buffer */
  end: number;

  /** Child boxes for container boxes like 'moov', 'trak', etc. */
  children?: BoxNode[];

  /** Raw data for leaf boxes */
  data?: Uint8Array;
}

/**
 * Custom error types
 */
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

export class InvalidBoxError extends ParseError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBoxError";
  }
}

export class UnsupportedCodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedCodecError";
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}
