import { BoxNode, UnsupportedCodecError } from "./types";

/**
 * Create a new 'ftyp' box with MP4 brands
 */
export function filterAndRewriteFTYP(nodes: BoxNode[]): BoxNode {
  // Look for existing ftyp box
  const existingFtyp = nodes.find((node) => node.type === "ftyp");

  // Create a new 'ftyp' box with MP4 compatibility brands
  const data = new Uint8Array(20);
  const dataView = new DataView(data.buffer);

  // Write 'mp42' as major brand (common MP4 brand)
  dataView.setUint8(0, 0x6d); // 'm'
  dataView.setUint8(1, 0x70); // 'p'
  dataView.setUint8(2, 0x34); // '4'
  dataView.setUint8(3, 0x32); // '2'

  // Write version as 0
  dataView.setUint32(4, 0, false);

  // Compatible brands: 'mp42', 'isom', 'avc1'
  dataView.setUint8(8, 0x6d); // 'm'
  dataView.setUint8(9, 0x70); // 'p'
  dataView.setUint8(10, 0x34); // '4'
  dataView.setUint8(11, 0x32); // '2'

  dataView.setUint8(12, 0x69); // 'i'
  dataView.setUint8(13, 0x73); // 's'
  dataView.setUint8(14, 0x6f); // 'o'
  dataView.setUint8(15, 0x6d); // 'm'

  dataView.setUint8(16, 0x61); // 'a'
  dataView.setUint8(17, 0x76); // 'v'
  dataView.setUint8(18, 0x63); // 'c'
  dataView.setUint8(19, 0x31); // '1'

  return {
    type: "ftyp",
    size: 8 + data.byteLength, // header (8) + payload
    start: 0, // Will be adjusted during serialization
    end: 8 + data.byteLength, // Will be adjusted during serialization
    data,
  };
}

/**
 * Find 'stsd' box within 'moov' hierarchy and check for supported codecs
 */
function validateCodecs(moovBox: BoxNode): void {
  // Find stsd boxes recursively
  const findStsdBoxes = (node: BoxNode): BoxNode[] => {
    if (node.type === "stsd") {
      return [node];
    }

    if (node.children) {
      return node.children.flatMap(findStsdBoxes);
    }

    return [];
  };

  const stsdBoxes = findStsdBoxes(moovBox);

  for (const stsd of stsdBoxes) {
    if (!stsd.data) continue;

    // stsd data format:
    // - 4 bytes version/flags
    // - 4 bytes entry count
    // - codec entries, each starting with size and fourcc

    const dataView = new DataView(stsd.data.buffer);
    const entryCount = dataView.getUint32(4, false);

    let offset = 8; // Start after version/flags and entry count

    for (let i = 0; i < entryCount; i++) {
      if (offset + 8 > stsd.data.byteLength) break;

      const entrySize = dataView.getUint32(offset, false);

      if (entrySize < 8 || offset + entrySize > stsd.data.byteLength) {
        break;
      }

      // Read codec type
      let codecType = "";
      for (let j = 0; j < 4; j++) {
        codecType += String.fromCharCode(stsd.data[offset + 4 + j]);
      }

      // For now, we only support H.264 video (avc1) and AAC audio (mp4a)
      const supportedVideoCodecs = ["avc1"];
      const supportedAudioCodecs = ["mp4a"];

      // Determine if this is video or audio by looking at parent 'hdlr' box
      // Simplified for now - just check if the codec is in our supported list
      if (
        !supportedVideoCodecs.includes(codecType) &&
        !supportedAudioCodecs.includes(codecType)
      ) {
        throw new UnsupportedCodecError(`Unsupported codec: ${codecType}`);
      }

      offset += entrySize;
    }
  }
}

/**
 * Rebuild 'moov' box for MP4 compatibility
 */
export function rebuildMOOV(nodes: BoxNode[]): BoxNode {
  // Find the 'moov' box
  const moovBox = nodes.find((node) => node.type === "moov");

  if (!moovBox) {
    throw new Error("No 'moov' box found in the source file");
  }

  // Validate that the file contains supported codecs
  validateCodecs(moovBox);

  // Deep clone the moov box and its children
  const cloneMoovBox = (node: BoxNode): BoxNode => {
    const clone: BoxNode = {
      type: node.type,
      size: node.size,
      start: node.start,
      end: node.end,
    };

    if (node.data) {
      clone.data = new Uint8Array(node.data);
    }

    if (node.children) {
      clone.children = node.children.map(cloneMoovBox);
    }

    return clone;
  };

  // Clone the moov box structure
  const newMoovBox = cloneMoovBox(moovBox);

  // For a real implementation, we would need to:
  // 1. Fix chunk offsets in 'stco'/'co64' boxes to account for new 'ftyp' size
  // 2. Update any QuickTime-specific atoms to MP4 equivalents
  // 3. Ensure timescales and durations are properly set

  // For now, we'll just return the cloned box
  return newMoovBox;
}

/**
 * Collect 'mdat' box data
 */
export function collectMDAT(nodes: BoxNode[]): BoxNode {
  // Find all 'mdat' boxes
  const mdatBoxes = nodes.filter((node) => node.type === "mdat");

  if (mdatBoxes.length === 0) {
    throw new Error("No 'mdat' box found in the source file");
  }

  // For simplicity, we'll just use the first 'mdat' box
  // In a complete implementation, we might need to handle multiple 'mdat' boxes
  const mdatBox = mdatBoxes[0];

  // Create a new mdat box with the same data
  return {
    type: "mdat",
    size: mdatBox.size,
    start: 0, // Will be adjusted during serialization
    end: mdatBox.size,
    data: mdatBox.data,
  };
}
