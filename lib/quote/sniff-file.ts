/** Magic-byte sniffing for quote attachments — do not trust File.type alone. */

function startsWith(bytes: Uint8Array, sig: number[]) {
  if (bytes.length < sig.length) return false;
  return sig.every((b, i) => bytes[i] === b);
}

function asciiAt(bytes: Uint8Array, offset: number, text: string) {
  if (bytes.length < offset + text.length) return false;
  for (let i = 0; i < text.length; i++) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

export type SniffedKind =
  | "pdf"
  | "jpg"
  | "png"
  | "webp"
  | "heic"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "txt"
  | "unknown";

export function sniffFileBytes(bytes: Uint8Array): SniffedKind {
  if (asciiAt(bytes, 0, "%PDF")) return "pdf";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }
  if (
    asciiAt(bytes, 0, "RIFF") &&
    bytes.length >= 12 &&
    asciiAt(bytes, 8, "WEBP")
  ) {
    return "webp";
  }
  // HEIC/HEIF (ftyp....heic/heif/mif1)
  if (asciiAt(bytes, 4, "ftyp")) {
    const brand = String.fromCharCode(
      bytes[8] ?? 0,
      bytes[9] ?? 0,
      bytes[10] ?? 0,
      bytes[11] ?? 0,
    ).toLowerCase();
    if (
      brand === "heic" ||
      brand === "heif" ||
      brand === "mif1" ||
      brand === "msf1"
    ) {
      return "heic";
    }
  }
  // OLE Compound File (legacy .doc / .xls)
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return "doc";
  }
  // ZIP container (docx/xlsx) — reject plain zip by requiring OOXML markers later
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    const asText = Buffer.from(bytes.subarray(0, Math.min(bytes.length, 2000))).toString(
      "latin1",
    );
    if (asText.includes("word/")) return "docx";
    if (asText.includes("xl/")) return "xlsx";
    return "unknown"; // bare zip / other archive
  }
  // Plain text: reject if NUL bytes in first 512
  const sample = bytes.subarray(0, Math.min(bytes.length, 512));
  if (sample.every((b) => b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b < 0x7f) || b >= 0x80)) {
    return "txt";
  }
  return "unknown";
}

/** Map sniffed kind to allowed quote file type ids. */
export function sniffedMatchesAllowed(
  kind: SniffedKind,
  allowedIds: readonly string[],
): boolean {
  const map: Record<SniffedKind, string[]> = {
    pdf: ["pdf"],
    jpg: ["jpg"],
    png: ["png"],
    webp: ["webp"],
    heic: ["heic"],
    doc: ["doc"],
    docx: ["doc"],
    xls: ["xls"],
    xlsx: ["xls"],
    txt: ["txt"],
    unknown: [],
  };
  return map[kind].some((id) => allowedIds.includes(id));
}
