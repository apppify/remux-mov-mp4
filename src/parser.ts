import {
  BoxNode,
  InvalidBoxError,
  InvalidInputError,
  ParseError,
} from "./types";

/**
 * Container box types that can contain child boxes
 */
const CONTAINER_BOXES = new Set([
  "moov",
  "trak",
  "mdia",
  "minf",
  "stbl",
  "edts",
  "dinf",
]);

/**
 * Parse the ISO Base Media File Format container (MOV/MP4) into a tree of boxes
 */
export function parseBoxes(buffer: ArrayBuffer): BoxNode[] {
  if (!buffer || !(buffer instanceof ArrayBuffer)) {
    throw new InvalidInputError("Invalid input: expected ArrayBuffer");
  }

  if (buffer.byteLength < 8) {
    throw new ParseError("Invalid file: too small to contain any boxes");
  }

  const dataView = new DataView(buffer);
  const boxes: BoxNode[] = [];
  let cursor = 0;

  try {
    while (cursor < buffer.byteLength) {
      // Need at least 8 bytes for box header
      if (cursor + 8 > buffer.byteLength) {
        break;
      }

      const boxStart = cursor;
      let size = dataView.getUint32(cursor, false); // big-endian
      cursor += 4;

      // Read box type as 4 ASCII chars
      let type = "";
      for (let i = 0; i < 4; i++) {
        type += String.fromCharCode(dataView.getUint8(cursor + i));
      }
      cursor += 4;

      // Handle extended size
      if (size === 1) {
        // 64-bit size
        if (cursor + 8 > buffer.byteLength) {
          throw new InvalidBoxError(`Box ${type} has invalid extended size`);
        }

        // JavaScript can't handle 64-bit integers directly, so we'll use a workaround
        // This assumes the high 32 bits are 0, which is reasonable for our use case
        const highBits = dataView.getUint32(cursor, false);
        const lowBits = dataView.getUint32(cursor + 4, false);

        if (highBits > 0) {
          throw new ParseError(`Box ${type} is too large (size > 4GB)`);
        }

        size = lowBits;
        cursor += 8;
      } else if (size === 0) {
        // Box extends to end of file
        size = buffer.byteLength - boxStart;
      }

      // Boundary checks
      if (size < 8) {
        throw new InvalidBoxError(
          `Box ${type} has invalid size ${size} (less than header size)`
        );
      }

      const payloadStart = cursor;
      const payloadEnd = boxStart + size;

      if (payloadEnd > buffer.byteLength) {
        throw new InvalidBoxError(`Box ${type} extends beyond file boundary`);
      }

      const box: BoxNode = {
        type,
        size,
        start: boxStart,
        end: payloadEnd,
      };

      // Process box contents based on type
      if (CONTAINER_BOXES.has(type)) {
        // Container box - parse children recursively
        const childBuffer = buffer.slice(payloadStart, payloadEnd);
        box.children = parseBoxes(childBuffer);

        // Adjust child offsets to be relative to the original buffer
        for (const child of box.children) {
          child.start += payloadStart;
          child.end += payloadStart;
        }
      } else {
        // Leaf box - store raw data
        box.data = new Uint8Array(buffer.slice(payloadStart, payloadEnd));
      }

      boxes.push(box);
      cursor = payloadEnd;
    }

    return boxes;
  } catch (error) {
    if (error instanceof InvalidBoxError || error instanceof ParseError) {
      throw error;
    }
    throw new ParseError(
      `Error parsing box structure: ${(error as Error).message}`
    );
  }
}
