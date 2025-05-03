import { BoxNode } from "./types";

/**
 * Serialize a single box to a Uint8Array
 */
export function serializeBox(box: BoxNode): Uint8Array {
  // Calculate the total size of the box
  const headerSize = 8; // 4 bytes size + 4 bytes type
  const dataSize = box.data ? box.data.byteLength : 0;
  const childrenSize = box.children
    ? box.children.reduce(
        (total, child) => total + serializeBox(child).byteLength,
        0
      )
    : 0;

  const totalSize = headerSize + dataSize + childrenSize;

  // Create a buffer for the serialized box
  const buffer = new Uint8Array(totalSize);
  const dataView = new DataView(buffer.buffer);

  // Write size (4 bytes, big-endian)
  dataView.setUint32(0, totalSize, false);

  // Write type (4 ASCII chars)
  for (let i = 0; i < 4; i++) {
    dataView.setUint8(4 + i, box.type.charCodeAt(i));
  }

  let offset = headerSize;

  // Write data if present
  if (box.data) {
    buffer.set(box.data, offset);
    offset += box.data.byteLength;
  }

  // Write children if present
  if (box.children) {
    for (const child of box.children) {
      const childData = serializeBox(child);
      buffer.set(childData, offset);
      offset += childData.byteLength;
    }
  }

  return buffer;
}

/**
 * Serialize boxes to a complete MP4 file
 */
export function serialize(boxes: BoxNode[]): Uint8Array {
  // Calculate total size
  const totalSize = boxes.reduce(
    (sum, box) => sum + serializeBox(box).byteLength,
    0
  );

  // Create buffer for the complete file
  const buffer = new Uint8Array(totalSize);

  // Write boxes to the buffer
  let offset = 0;
  for (const box of boxes) {
    const boxData = serializeBox(box);
    buffer.set(boxData, offset);
    offset += boxData.byteLength;
  }

  return buffer;
}
