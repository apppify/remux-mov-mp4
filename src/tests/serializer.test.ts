import { describe, it, expect } from "vitest";
import { serializeBox, serialize } from "../serializer";
import { BoxNode } from "../types";

describe("serializeBox", () => {
  it("should serialize a simple box with data", () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);

    const box: BoxNode = {
      type: "test",
      size: 12, // 8 (header) + 4 (data)
      start: 0,
      end: 12,
      data,
    };

    const result = serializeBox(box);

    expect(result.byteLength).toBe(12);

    // Check header
    const view = new DataView(result.buffer);
    expect(view.getUint32(0, false)).toBe(12); // Size
    expect(String.fromCharCode(result[4])).toBe("t");
    expect(String.fromCharCode(result[5])).toBe("e");
    expect(String.fromCharCode(result[6])).toBe("s");
    expect(String.fromCharCode(result[7])).toBe("t");

    // Check data
    expect(result[8]).toBe(0x01);
    expect(result[9]).toBe(0x02);
    expect(result[10]).toBe(0x03);
    expect(result[11]).toBe(0x04);
  });

  it("should serialize a container box with children", () => {
    const childData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);

    const childBox: BoxNode = {
      type: "chld",
      size: 12, // 8 (header) + 4 (data)
      start: 8,
      end: 20,
      data: childData,
    };

    const parentBox: BoxNode = {
      type: "prnt",
      size: 20, // 8 (header) + 12 (child)
      start: 0,
      end: 20,
      children: [childBox],
    };

    const result = serializeBox(parentBox);

    expect(result.byteLength).toBe(20);

    // Check parent header
    const view = new DataView(result.buffer);
    expect(view.getUint32(0, false)).toBe(20); // Size
    expect(String.fromCharCode(result[4])).toBe("p");
    expect(String.fromCharCode(result[5])).toBe("r");
    expect(String.fromCharCode(result[6])).toBe("n");
    expect(String.fromCharCode(result[7])).toBe("t");

    // Check child header
    expect(view.getUint32(8, false)).toBe(12); // Size
    expect(String.fromCharCode(result[12])).toBe("c");
    expect(String.fromCharCode(result[13])).toBe("h");
    expect(String.fromCharCode(result[14])).toBe("l");
    expect(String.fromCharCode(result[15])).toBe("d");

    // Check child data
    expect(result[16]).toBe(0x01);
    expect(result[17]).toBe(0x02);
    expect(result[18]).toBe(0x03);
    expect(result[19]).toBe(0x04);
  });
});

describe("serialize", () => {
  it("should concatenate multiple boxes", () => {
    const box1: BoxNode = {
      type: "box1",
      size: 12, // 8 (header) + 4 (data)
      start: 0,
      end: 12,
      data: new Uint8Array([0x01, 0x02, 0x03, 0x04]),
    };

    const box2: BoxNode = {
      type: "box2",
      size: 12, // 8 (header) + 4 (data)
      start: 12,
      end: 24,
      data: new Uint8Array([0x05, 0x06, 0x07, 0x08]),
    };

    const result = serialize([box1, box2]);

    expect(result.byteLength).toBe(24);

    // Check first box header
    const view = new DataView(result.buffer);
    expect(view.getUint32(0, false)).toBe(12); // Size
    expect(String.fromCharCode(result[4])).toBe("b");
    expect(String.fromCharCode(result[5])).toBe("o");
    expect(String.fromCharCode(result[6])).toBe("x");
    expect(String.fromCharCode(result[7])).toBe("1");

    // Check first box data
    expect(result[8]).toBe(0x01);
    expect(result[9]).toBe(0x02);
    expect(result[10]).toBe(0x03);
    expect(result[11]).toBe(0x04);

    // Check second box header
    expect(view.getUint32(12, false)).toBe(12); // Size
    expect(String.fromCharCode(result[16])).toBe("b");
    expect(String.fromCharCode(result[17])).toBe("o");
    expect(String.fromCharCode(result[18])).toBe("x");
    expect(String.fromCharCode(result[19])).toBe("2");

    // Check second box data
    expect(result[20]).toBe(0x05);
    expect(result[21]).toBe(0x06);
    expect(result[22]).toBe(0x07);
    expect(result[23]).toBe(0x08);
  });
});
