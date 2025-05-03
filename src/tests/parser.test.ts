import { describe, it, expect } from "vitest";
import { parseBoxes } from "../parser";
import { InvalidInputError, ParseError } from "../types";

describe("parseBoxes", () => {
  it("should reject non-ArrayBuffer inputs", () => {
    // @ts-expect-error - Testing invalid input
    expect(() => parseBoxes("not a buffer")).toThrow(InvalidInputError);
    // @ts-expect-error - Testing invalid input
    expect(() => parseBoxes(null)).toThrow(InvalidInputError);
    // @ts-expect-error - Testing invalid input
    expect(() => parseBoxes(undefined)).toThrow(InvalidInputError);
  });

  it("should reject buffers that are too small", () => {
    const tinyBuffer = new ArrayBuffer(4);
    expect(() => parseBoxes(tinyBuffer)).toThrow(ParseError);
  });

  it("should parse a simple box structure", () => {
    // Create a simple 'ftyp' box
    const buffer = new ArrayBuffer(24);
    const view = new DataView(buffer);

    // Box size (24 bytes)
    view.setUint32(0, 24, false);

    // Box type 'ftyp'
    view.setUint8(4, 0x66); // 'f'
    view.setUint8(5, 0x74); // 't'
    view.setUint8(6, 0x79); // 'y'
    view.setUint8(7, 0x70); // 'p'

    // Major brand 'qt  '
    view.setUint8(8, 0x71); // 'q'
    view.setUint8(9, 0x74); // 't'
    view.setUint8(10, 0x20); // ' '
    view.setUint8(11, 0x20); // ' '

    // Minor version (0)
    view.setUint32(12, 0, false);

    // Compatible brand 'qt  '
    view.setUint8(16, 0x71); // 'q'
    view.setUint8(17, 0x74); // 't'
    view.setUint8(18, 0x20); // ' '
    view.setUint8(19, 0x20); // ' '

    // Compatible brand 'moov'
    view.setUint8(20, 0x6d); // 'm'
    view.setUint8(21, 0x6f); // 'o'
    view.setUint8(22, 0x6f); // 'o'
    view.setUint8(23, 0x76); // 'v'

    const boxes = parseBoxes(buffer);

    expect(boxes).toHaveLength(1);
    expect(boxes[0].type).toBe("ftyp");
    expect(boxes[0].size).toBe(24);
    expect(boxes[0].data).toBeDefined();
    expect(boxes[0].data?.byteLength).toBe(16); // 24 - 8 (header)
  });

  it("should handle container boxes correctly", () => {
    // Create a simple container structure: 'moov' with one 'mvhd' child
    const buffer = new ArrayBuffer(32);
    const view = new DataView(buffer);

    // 'moov' box size (32 bytes total)
    view.setUint32(0, 32, false);

    // 'moov' box type
    view.setUint8(4, 0x6d); // 'm'
    view.setUint8(5, 0x6f); // 'o'
    view.setUint8(6, 0x6f); // 'o'
    view.setUint8(7, 0x76); // 'v'

    // 'mvhd' box inside 'moov' (24 bytes)
    view.setUint32(8, 24, false);

    // 'mvhd' box type
    view.setUint8(12, 0x6d); // 'm'
    view.setUint8(13, 0x76); // 'v'
    view.setUint8(14, 0x68); // 'h'
    view.setUint8(15, 0x64); // 'd'

    // 'mvhd' data (16 bytes of zeros)

    const boxes = parseBoxes(buffer);

    expect(boxes).toHaveLength(1);
    expect(boxes[0].type).toBe("moov");
    expect(boxes[0].size).toBe(32);
    expect(boxes[0].children).toBeDefined();
    expect(boxes[0].children).toHaveLength(1);
    expect(boxes[0].children?.[0].type).toBe("mvhd");
    expect(boxes[0].children?.[0].size).toBe(24);
    expect(boxes[0].children?.[0].data).toBeDefined();
    expect(boxes[0].children?.[0].data?.byteLength).toBe(16); // 24 - 8 (header)
  });
});
