import { parseBoxes } from "./parser";
import { filterAndRewriteFTYP, rebuildMOOV, collectMDAT } from "./transformer";
import { serialize } from "./serializer";
import { InvalidInputError } from "./types";

/**
 * Remux a QuickTime (.mov) file to an MP4 (.mp4) container without re-encoding
 *
 * @param buffer ArrayBuffer containing the .mov file data
 * @returns Uint8Array containing the remuxed .mp4 file data
 */
export async function remuxMovToMp4(buffer: ArrayBuffer): Promise<Uint8Array> {
  if (!buffer || !(buffer instanceof ArrayBuffer)) {
    throw new InvalidInputError("Invalid input: expected ArrayBuffer");
  }

  if (buffer.byteLength < 8) {
    throw new InvalidInputError("Invalid input: file too small");
  }

  // 1. Parse the source file structure
  const nodes = parseBoxes(buffer);

  // 2. Create a new 'ftyp' box with MP4 brands
  const ftyp = filterAndRewriteFTYP(nodes);

  // 3. Rebuild the 'moov' box for MP4 compatibility
  const moov = rebuildMOOV(nodes);

  // 4. Collect media data from 'mdat' box
  const mdat = collectMDAT(nodes);

  // 5. Serialize the new MP4 file
  return serialize([ftyp, moov, mdat]);
}

// Export types
export type { BoxNode } from "./types";
export {
  ParseError,
  InvalidBoxError,
  UnsupportedCodecError,
  InvalidInputError,
} from "./types";
