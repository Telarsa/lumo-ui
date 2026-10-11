/** Read Unicode cmap coverage from the untransformed cmap table in WOFF2.
 * Built-in Brotli keeps font inspection out of the runtime dependency tree. */
import assert from "node:assert/strict";
import { brotliDecompressSync } from "node:zlib";

const tags = "cmap head hhea hmtx maxp name OS/2 post cvt_ fpgm glyf loca prep CFF_ VORG EBDT EBLC gasp hdmx kern LTSH PCLT VDMX vhea vmtx BASE GDEF GPOS GSUB EBSC JSTF MATH CBDT CBLC COLR CPAL SVG_ sbix acnt avar bdat bloc bsln cvar fdsc feat fmtx fvar gvar hsty just lcar mort morx opbd prop trak Zapf Silf Glat Gloc Feat Sill".split(" ");

export function cmap(data) {
  assert.equal(data.toString("ascii", 0, 4), "wOF2", "Expected WOFF2 font");
  let cursor = 48;
  const base128 = () => {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const byte = data[cursor++];
      assert(byte !== undefined && !(i === 0 && byte === 0x80), "Invalid Base128 length");
      value = value * 128 + (byte & 0x7f);
      if (!(byte & 0x80)) return value;
    }
    throw new Error("Invalid Base128 length");
  };
  let offset = 0;
  let coverage;
  for (let i = 0; i < data.readUInt16BE(12); i++) {
    const flag = data[cursor++];
    let tag = tags[flag & 63];
    if ((flag & 63) === 63) { tag = data.toString("ascii", cursor, cursor + 4); cursor += 4; }
    const originalLength = base128();
    const version = flag >>> 6;
    const transformed = ["glyf", "loca"].includes(tag) ? version !== 3 : version !== 0;
    const length = transformed ? base128() : originalLength;
    if (tag === "cmap") { assert(!transformed, "cmap must be untransformed"); coverage = { offset, length }; }
    offset += length;
  }
  assert(coverage, "Font has no cmap");
  const stream = brotliDecompressSync(data.subarray(cursor, cursor + data.readUInt32BE(20)));
  const table = stream.subarray(coverage.offset, coverage.offset + coverage.length);
  const points = new Set();
  for (let i = 0; i < table.readUInt16BE(2); i++) {
    const record = 4 + i * 8;
    const platform = table.readUInt16BE(record);
    const encoding = table.readUInt16BE(record + 2);
    if (!(platform === 0 || (platform === 3 && [1, 10].includes(encoding)))) continue;
    const start = table.readUInt32BE(record + 4);
    const format = table.readUInt16BE(start);
    if (format === 12) {
      for (let group = 0; group < table.readUInt32BE(start + 12); group++) {
        const row = start + 16 + group * 12;
        const first = table.readUInt32BE(row), last = table.readUInt32BE(row + 4), glyph = table.readUInt32BE(row + 8);
        for (let cp = first; cp <= last; cp++) if (glyph + cp - first) points.add(cp);
      }
    } else if (format === 4) {
      const count = table.readUInt16BE(start + 6) / 2;
      const ends = start + 14, starts = ends + count * 2 + 2, deltas = starts + count * 2, ranges = deltas + count * 2;
      for (let segment = 0; segment < count; segment++) {
        const first = table.readUInt16BE(starts + segment * 2), last = table.readUInt16BE(ends + segment * 2);
        const delta = table.readInt16BE(deltas + segment * 2), range = table.readUInt16BE(ranges + segment * 2);
        for (let cp = first; cp <= last && cp !== 0xffff; cp++) {
          let glyph = range ? table.readUInt16BE(ranges + segment * 2 + range + (cp - first) * 2) : (cp + delta) & 0xffff;
          if (range && glyph) glyph = (glyph + delta) & 0xffff;
          if (glyph) points.add(cp);
        }
      }
    }
  }
  assert(points.size, "Font has no supported Unicode cmap");
  return points;
}

export function unicodeRange(points) {
  const sorted = [...points].sort((a, b) => a - b);
  const ranges = [];
  for (let i = 0; i < sorted.length; i++) {
    const first = sorted[i];
    let last = first;
    while (sorted[i + 1] === last + 1) last = sorted[++i];
    const hex = (cp) => cp.toString(16).toUpperCase().padStart(4, "0");
    ranges.push(`U+${hex(first)}${last === first ? "" : `-${hex(last)}`}`);
  }
  return ranges.join(", ");
}
