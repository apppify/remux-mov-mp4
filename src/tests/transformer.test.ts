import { describe, it, expect } from "vitest";
import { filterAndRewriteFTYP, rebuildMOOV, collectMDAT } from "../transformer";
import { BoxNode, UnsupportedCodecError } from "../types";

describe("filterAndRewriteFTYP", () => {
  it("should create a new ftyp box with MP4 brands", () => {
    const nodes: BoxNode[] = [
      {
        type: "ftyp",
        size: 24,
        start: 0,
        end: 24,
        data: new Uint8Array(16), // Dummy data
      },
    ];

    const newFtyp = filterAndRewriteFTYP(nodes);

    expect(newFtyp.type).toBe("ftyp");
    expect(newFtyp.size).toBe(28); // 8 (header) + 20 (data)
    expect(newFtyp.data).toBeDefined();
    expect(newFtyp.data?.byteLength).toBe(20);

    // Check major brand is 'mp42'
    const dataView = new DataView(newFtyp.data!.buffer);
    expect(
      String.fromCharCode(
        newFtyp.data![0],
        newFtyp.data![1],
        newFtyp.data![2],
        newFtyp.data![3]
      )
    ).toBe("mp42");
  });
});

describe("rebuildMOOV", () => {
  it("should throw error when moov box is missing", () => {
    const nodes: BoxNode[] = [
      {
        type: "ftyp",
        size: 24,
        start: 0,
        end: 24,
        data: new Uint8Array(16),
      },
    ];

    expect(() => rebuildMOOV(nodes)).toThrow("No 'moov' box found");
  });

  it("should validate codecs and throw on unsupported codec", () => {
    // Create a moov box with an unsupported codec
    const stsdData = new Uint8Array(24);
    const stsdView = new DataView(stsdData.buffer);

    // Version + flags (4 bytes)
    stsdView.setUint32(0, 0, false);

    // Entry count (1)
    stsdView.setUint32(4, 1, false);

    // Entry size (16 bytes)
    stsdView.setUint32(8, 16, false);

    // Entry type 'xyz1' (unsupported codec)
    stsdView.setUint8(12, 0x78); // 'x'
    stsdView.setUint8(13, 0x79); // 'y'
    stsdView.setUint8(14, 0x7a); // 'z'
    stsdView.setUint8(15, 0x31); // '1'

    const nodes: BoxNode[] = [
      {
        type: "moov",
        size: 32,
        start: 0,
        end: 32,
        children: [
          {
            type: "stsd",
            size: 32,
            start: 0,
            end: 32,
            data: stsdData,
          },
        ],
      },
    ];

    expect(() => rebuildMOOV(nodes)).toThrow(UnsupportedCodecError);
  });

  it("should clone the moov box structure", () => {
    // Create a moov box with a supported codec
    const stsdData = new Uint8Array(24);
    const stsdView = new DataView(stsdData.buffer);

    // Version + flags (4 bytes)
    stsdView.setUint32(0, 0, false);

    // Entry count (1)
    stsdView.setUint32(4, 1, false);

    // Entry size (16 bytes)
    stsdView.setUint32(8, 16, false);

    // Entry type 'avc1' (supported codec)
    stsdView.setUint8(12, 0x61); // 'a'
    stsdView.setUint8(13, 0x76); // 'v'
    stsdView.setUint8(14, 0x63); // 'c'
    stsdView.setUint8(15, 0x31); // '1'

    const nodes: BoxNode[] = [
      {
        type: "moov",
        size: 32,
        start: 0,
        end: 32,
        children: [
          {
            type: "stsd",
            size: 32,
            start: 0,
            end: 32,
            data: stsdData,
          },
        ],
      },
    ];

    const newMoov = rebuildMOOV(nodes);

    expect(newMoov.type).toBe("moov");
    expect(newMoov.size).toBe(32);
    expect(newMoov.children).toBeDefined();
    expect(newMoov.children).toHaveLength(1);
    expect(newMoov.children?.[0].type).toBe("stsd");
  });
});

describe("collectMDAT", () => {
  it("should throw error when mdat box is missing", () => {
    const nodes: BoxNode[] = [
      {
        type: "ftyp",
        size: 24,
        start: 0,
        end: 24,
        data: new Uint8Array(16),
      },
    ];

    expect(() => collectMDAT(nodes)).toThrow("No 'mdat' box found");
  });

  it("should collect mdat box data", () => {
    const mdatData = new Uint8Array(16).fill(0xff);

    const nodes: BoxNode[] = [
      {
        type: "mdat",
        size: 24, // 8 (header) + 16 (data)
        start: 0,
        end: 24,
        data: mdatData,
      },
    ];

    const newMdat = collectMDAT(nodes);

    expect(newMdat.type).toBe("mdat");
    expect(newMdat.size).toBe(24);
    expect(newMdat.data).toBeDefined();
    expect(newMdat.data).toEqual(mdatData);
  });
});
