import { describe, it, expect, vi, beforeEach } from "vitest";
import { remuxMovToMp4 } from "../index";
import { InvalidInputError } from "../types";
import * as parser from "../parser";
import * as transformer from "../transformer";
import * as serializer from "../serializer";

// Mock dependencies
vi.mock("../parser", () => ({
  parseBoxes: vi.fn(),
}));

vi.mock("../transformer", () => ({
  filterAndRewriteFTYP: vi.fn(),
  rebuildMOOV: vi.fn(),
  collectMDAT: vi.fn(),
}));

vi.mock("../serializer", () => ({
  serialize: vi.fn(),
}));

describe("remuxMovToMp4", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(parser.parseBoxes).mockReturnValue([]);

    vi.mocked(transformer.filterAndRewriteFTYP).mockReturnValue({
      type: "ftyp",
      size: 28,
      start: 0,
      end: 28,
      data: new Uint8Array(20),
    });

    vi.mocked(transformer.rebuildMOOV).mockReturnValue({
      type: "moov",
      size: 100,
      start: 28,
      end: 128,
      children: [],
    });

    vi.mocked(transformer.collectMDAT).mockReturnValue({
      type: "mdat",
      size: 200,
      start: 128,
      end: 328,
      data: new Uint8Array(192),
    });

    vi.mocked(serializer.serialize).mockReturnValue(new Uint8Array(328));
  });

  it("should reject invalid inputs", async () => {
    // @ts-expect-error - Testing invalid input
    await expect(remuxMovToMp4(null)).rejects.toThrow(InvalidInputError);
    // @ts-expect-error - Testing invalid input
    await expect(remuxMovToMp4("not a buffer")).rejects.toThrow(
      InvalidInputError
    );
    await expect(remuxMovToMp4(new ArrayBuffer(4))).rejects.toThrow(
      InvalidInputError
    );
  });

  it("should process a valid MOV file", async () => {
    const buffer = new ArrayBuffer(1024);
    const result = await remuxMovToMp4(buffer);

    // Check that all modules were called with correct parameters
    expect(parser.parseBoxes).toHaveBeenCalledWith(buffer);
    expect(transformer.filterAndRewriteFTYP).toHaveBeenCalledWith([]);
    expect(transformer.rebuildMOOV).toHaveBeenCalledWith([]);
    expect(transformer.collectMDAT).toHaveBeenCalledWith([]);

    // Check that serialize was called with the transformed boxes
    expect(serializer.serialize).toHaveBeenCalledWith([
      {
        type: "ftyp",
        size: 28,
        start: 0,
        end: 28,
        data: expect.any(Uint8Array),
      },
      {
        type: "moov",
        size: 100,
        start: 28,
        end: 128,
        children: [],
      },
      {
        type: "mdat",
        size: 200,
        start: 128,
        end: 328,
        data: expect.any(Uint8Array),
      },
    ]);

    // Check the final result
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBe(328);
  });

  it("should handle errors from dependencies", async () => {
    vi.mocked(parser.parseBoxes).mockImplementation(() => {
      throw new Error("Parse error");
    });

    const buffer = new ArrayBuffer(1024);
    await expect(remuxMovToMp4(buffer)).rejects.toThrow("Parse error");
  });
});
