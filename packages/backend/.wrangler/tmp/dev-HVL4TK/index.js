var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-M107dm/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-M107dm/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// ../../node_modules/pbf/index.js
var SHIFT_LEFT_32 = (1 << 16) * (1 << 16);
var SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32;
var TEXT_DECODER_MIN_LENGTH = 12;
var utf8TextDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder("utf-8");
var PBF_VARINT = 0;
var PBF_FIXED64 = 1;
var PBF_BYTES = 2;
var PBF_FIXED32 = 5;
var Pbf = class {
  /**
   * @param {Uint8Array | ArrayBuffer} [buf]
   */
  constructor(buf = new Uint8Array(16)) {
    this.buf = ArrayBuffer.isView(buf) ? buf : new Uint8Array(buf);
    this.dataView = new DataView(this.buf.buffer);
    this.pos = 0;
    this.type = 0;
    this.length = this.buf.length;
  }
  // === READING =================================================================
  /**
   * @template T
   * @param {(tag: number, result: T, pbf: Pbf) => void} readField
   * @param {T} result
   * @param {number} [end]
   */
  readFields(readField, result, end = this.length) {
    while (this.pos < end) {
      const val = this.readVarint(), tag = val >> 3, startPos = this.pos;
      this.type = val & 7;
      readField(tag, result, this);
      if (this.pos === startPos)
        this.skip(val);
    }
    return result;
  }
  /**
   * @template T
   * @param {(tag: number, result: T, pbf: Pbf) => void} readField
   * @param {T} result
   */
  readMessage(readField, result) {
    return this.readFields(readField, result, this.readVarint() + this.pos);
  }
  readFixed32() {
    const val = this.dataView.getUint32(this.pos, true);
    this.pos += 4;
    return val;
  }
  readSFixed32() {
    const val = this.dataView.getInt32(this.pos, true);
    this.pos += 4;
    return val;
  }
  // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)
  readFixed64() {
    const val = this.dataView.getUint32(this.pos, true) + this.dataView.getUint32(this.pos + 4, true) * SHIFT_LEFT_32;
    this.pos += 8;
    return val;
  }
  readSFixed64() {
    const val = this.dataView.getUint32(this.pos, true) + this.dataView.getInt32(this.pos + 4, true) * SHIFT_LEFT_32;
    this.pos += 8;
    return val;
  }
  readFloat() {
    const val = this.dataView.getFloat32(this.pos, true);
    this.pos += 4;
    return val;
  }
  readDouble() {
    const val = this.dataView.getFloat64(this.pos, true);
    this.pos += 8;
    return val;
  }
  /**
   * @param {boolean} [isSigned]
   */
  readVarint(isSigned) {
    const buf = this.buf;
    let val, b;
    b = buf[this.pos++];
    val = b & 127;
    if (b < 128)
      return val;
    b = buf[this.pos++];
    val |= (b & 127) << 7;
    if (b < 128)
      return val;
    b = buf[this.pos++];
    val |= (b & 127) << 14;
    if (b < 128)
      return val;
    b = buf[this.pos++];
    val |= (b & 127) << 21;
    if (b < 128)
      return val;
    b = buf[this.pos];
    val |= (b & 15) << 28;
    return readVarintRemainder(val, isSigned, this);
  }
  readVarint64() {
    return this.readVarint(true);
  }
  readSVarint() {
    const num = this.readVarint();
    return num % 2 === 1 ? (num + 1) / -2 : num / 2;
  }
  readBoolean() {
    return Boolean(this.readVarint());
  }
  readString() {
    const end = this.readVarint() + this.pos;
    const pos = this.pos;
    this.pos = end;
    if (end - pos >= TEXT_DECODER_MIN_LENGTH && utf8TextDecoder) {
      return utf8TextDecoder.decode(this.buf.subarray(pos, end));
    }
    return readUtf8(this.buf, pos, end);
  }
  readBytes() {
    const end = this.readVarint() + this.pos, buffer = this.buf.subarray(this.pos, end);
    this.pos = end;
    return buffer;
  }
  // verbose for performance reasons; doesn't affect gzipped size
  /**
   * @param {number[]} [arr]
   * @param {boolean} [isSigned]
   */
  readPackedVarint(arr = [], isSigned) {
    const end = this.readPackedEnd();
    while (this.pos < end)
      arr.push(this.readVarint(isSigned));
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedSVarint(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end)
      arr.push(this.readSVarint());
    return arr;
  }
  /** @param {boolean[]} [arr] */
  readPackedBoolean(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end)
      arr.push(this.readBoolean());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedFloat(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end)
      arr.push(this.readFloat());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedDouble(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end)
      arr.push(this.readDouble());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedFixed32(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end)
      arr.push(this.readFixed32());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedSFixed32(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end)
      arr.push(this.readSFixed32());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedFixed64(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end)
      arr.push(this.readFixed64());
    return arr;
  }
  /** @param {number[]} [arr] */
  readPackedSFixed64(arr = []) {
    const end = this.readPackedEnd();
    while (this.pos < end)
      arr.push(this.readSFixed64());
    return arr;
  }
  readPackedEnd() {
    return this.type === PBF_BYTES ? this.readVarint() + this.pos : this.pos + 1;
  }
  /** @param {number} val */
  skip(val) {
    const type = val & 7;
    if (type === PBF_VARINT)
      while (this.buf[this.pos++] > 127) {
      }
    else if (type === PBF_BYTES)
      this.pos = this.readVarint() + this.pos;
    else if (type === PBF_FIXED32)
      this.pos += 4;
    else if (type === PBF_FIXED64)
      this.pos += 8;
    else
      throw new Error(`Unimplemented type: ${type}`);
  }
  // === WRITING =================================================================
  /**
   * @param {number} tag
   * @param {number} type
   */
  writeTag(tag, type) {
    this.writeVarint(tag << 3 | type);
  }
  /** @param {number} min */
  realloc(min) {
    let length = this.length || 16;
    while (length < this.pos + min)
      length *= 2;
    if (length !== this.length) {
      const buf = new Uint8Array(length);
      buf.set(this.buf);
      this.buf = buf;
      this.dataView = new DataView(buf.buffer);
      this.length = length;
    }
  }
  finish() {
    this.length = this.pos;
    this.pos = 0;
    return this.buf.subarray(0, this.length);
  }
  /** @param {number} val */
  writeFixed32(val) {
    this.realloc(4);
    this.dataView.setInt32(this.pos, val, true);
    this.pos += 4;
  }
  /** @param {number} val */
  writeSFixed32(val) {
    this.realloc(4);
    this.dataView.setInt32(this.pos, val, true);
    this.pos += 4;
  }
  /** @param {number} val */
  writeFixed64(val) {
    this.realloc(8);
    this.dataView.setInt32(this.pos, val & -1, true);
    this.dataView.setInt32(this.pos + 4, Math.floor(val * SHIFT_RIGHT_32), true);
    this.pos += 8;
  }
  /** @param {number} val */
  writeSFixed64(val) {
    this.realloc(8);
    this.dataView.setInt32(this.pos, val & -1, true);
    this.dataView.setInt32(this.pos + 4, Math.floor(val * SHIFT_RIGHT_32), true);
    this.pos += 8;
  }
  /** @param {number} val */
  writeVarint(val) {
    val = +val || 0;
    if (val > 268435455 || val < 0) {
      writeBigVarint(val, this);
      return;
    }
    this.realloc(4);
    this.buf[this.pos++] = val & 127 | (val > 127 ? 128 : 0);
    if (val <= 127)
      return;
    this.buf[this.pos++] = (val >>>= 7) & 127 | (val > 127 ? 128 : 0);
    if (val <= 127)
      return;
    this.buf[this.pos++] = (val >>>= 7) & 127 | (val > 127 ? 128 : 0);
    if (val <= 127)
      return;
    this.buf[this.pos++] = val >>> 7 & 127;
  }
  /** @param {number} val */
  writeSVarint(val) {
    this.writeVarint(val < 0 ? -val * 2 - 1 : val * 2);
  }
  /** @param {boolean} val */
  writeBoolean(val) {
    this.writeVarint(+val);
  }
  /** @param {string} str */
  writeString(str) {
    str = String(str);
    this.realloc(str.length * 4);
    this.pos++;
    const startPos = this.pos;
    this.pos = writeUtf8(this.buf, str, this.pos);
    const len = this.pos - startPos;
    if (len >= 128)
      makeRoomForExtraLength(startPos, len, this);
    this.pos = startPos - 1;
    this.writeVarint(len);
    this.pos += len;
  }
  /** @param {number} val */
  writeFloat(val) {
    this.realloc(4);
    this.dataView.setFloat32(this.pos, val, true);
    this.pos += 4;
  }
  /** @param {number} val */
  writeDouble(val) {
    this.realloc(8);
    this.dataView.setFloat64(this.pos, val, true);
    this.pos += 8;
  }
  /** @param {Uint8Array} buffer */
  writeBytes(buffer) {
    const len = buffer.length;
    this.writeVarint(len);
    this.realloc(len);
    for (let i = 0; i < len; i++)
      this.buf[this.pos++] = buffer[i];
  }
  /**
   * @template T
   * @param {(obj: T, pbf: Pbf) => void} fn
   * @param {T} obj
   */
  writeRawMessage(fn, obj) {
    this.pos++;
    const startPos = this.pos;
    fn(obj, this);
    const len = this.pos - startPos;
    if (len >= 128)
      makeRoomForExtraLength(startPos, len, this);
    this.pos = startPos - 1;
    this.writeVarint(len);
    this.pos += len;
  }
  /**
   * @template T
   * @param {number} tag
   * @param {(obj: T, pbf: Pbf) => void} fn
   * @param {T} obj
   */
  writeMessage(tag, fn, obj) {
    this.writeTag(tag, PBF_BYTES);
    this.writeRawMessage(fn, obj);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedVarint(tag, arr) {
    if (arr.length)
      this.writeMessage(tag, writePackedVarint, arr);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedSVarint(tag, arr) {
    if (arr.length)
      this.writeMessage(tag, writePackedSVarint, arr);
  }
  /**
   * @param {number} tag
   * @param {boolean[]} arr
   */
  writePackedBoolean(tag, arr) {
    if (arr.length)
      this.writeMessage(tag, writePackedBoolean, arr);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedFloat(tag, arr) {
    if (arr.length)
      this.writeMessage(tag, writePackedFloat, arr);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedDouble(tag, arr) {
    if (arr.length)
      this.writeMessage(tag, writePackedDouble, arr);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedFixed32(tag, arr) {
    if (arr.length)
      this.writeMessage(tag, writePackedFixed32, arr);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedSFixed32(tag, arr) {
    if (arr.length)
      this.writeMessage(tag, writePackedSFixed32, arr);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedFixed64(tag, arr) {
    if (arr.length)
      this.writeMessage(tag, writePackedFixed64, arr);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedSFixed64(tag, arr) {
    if (arr.length)
      this.writeMessage(tag, writePackedSFixed64, arr);
  }
  /**
   * @param {number} tag
   * @param {Uint8Array} buffer
   */
  writeBytesField(tag, buffer) {
    this.writeTag(tag, PBF_BYTES);
    this.writeBytes(buffer);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeFixed32Field(tag, val) {
    this.writeTag(tag, PBF_FIXED32);
    this.writeFixed32(val);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeSFixed32Field(tag, val) {
    this.writeTag(tag, PBF_FIXED32);
    this.writeSFixed32(val);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeFixed64Field(tag, val) {
    this.writeTag(tag, PBF_FIXED64);
    this.writeFixed64(val);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeSFixed64Field(tag, val) {
    this.writeTag(tag, PBF_FIXED64);
    this.writeSFixed64(val);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeVarintField(tag, val) {
    this.writeTag(tag, PBF_VARINT);
    this.writeVarint(val);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeSVarintField(tag, val) {
    this.writeTag(tag, PBF_VARINT);
    this.writeSVarint(val);
  }
  /**
   * @param {number} tag
   * @param {string} str
   */
  writeStringField(tag, str) {
    this.writeTag(tag, PBF_BYTES);
    this.writeString(str);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeFloatField(tag, val) {
    this.writeTag(tag, PBF_FIXED32);
    this.writeFloat(val);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeDoubleField(tag, val) {
    this.writeTag(tag, PBF_FIXED64);
    this.writeDouble(val);
  }
  /**
   * @param {number} tag
   * @param {boolean} val
   */
  writeBooleanField(tag, val) {
    this.writeVarintField(tag, +val);
  }
};
__name(Pbf, "Pbf");
function readVarintRemainder(l, s, p) {
  const buf = p.buf;
  let h, b;
  b = buf[p.pos++];
  h = (b & 112) >> 4;
  if (b < 128)
    return toNum(l, h, s);
  b = buf[p.pos++];
  h |= (b & 127) << 3;
  if (b < 128)
    return toNum(l, h, s);
  b = buf[p.pos++];
  h |= (b & 127) << 10;
  if (b < 128)
    return toNum(l, h, s);
  b = buf[p.pos++];
  h |= (b & 127) << 17;
  if (b < 128)
    return toNum(l, h, s);
  b = buf[p.pos++];
  h |= (b & 127) << 24;
  if (b < 128)
    return toNum(l, h, s);
  b = buf[p.pos++];
  h |= (b & 1) << 31;
  if (b < 128)
    return toNum(l, h, s);
  throw new Error("Expected varint not more than 10 bytes");
}
__name(readVarintRemainder, "readVarintRemainder");
function toNum(low, high, isSigned) {
  return isSigned ? high * 4294967296 + (low >>> 0) : (high >>> 0) * 4294967296 + (low >>> 0);
}
__name(toNum, "toNum");
function writeBigVarint(val, pbf) {
  let low, high;
  if (val >= 0) {
    low = val % 4294967296 | 0;
    high = val / 4294967296 | 0;
  } else {
    low = ~(-val % 4294967296);
    high = ~(-val / 4294967296);
    if (low ^ 4294967295) {
      low = low + 1 | 0;
    } else {
      low = 0;
      high = high + 1 | 0;
    }
  }
  if (val >= 18446744073709552e3 || val < -18446744073709552e3) {
    throw new Error("Given varint doesn't fit into 10 bytes");
  }
  pbf.realloc(10);
  writeBigVarintLow(low, high, pbf);
  writeBigVarintHigh(high, pbf);
}
__name(writeBigVarint, "writeBigVarint");
function writeBigVarintLow(low, high, pbf) {
  pbf.buf[pbf.pos++] = low & 127 | 128;
  low >>>= 7;
  pbf.buf[pbf.pos++] = low & 127 | 128;
  low >>>= 7;
  pbf.buf[pbf.pos++] = low & 127 | 128;
  low >>>= 7;
  pbf.buf[pbf.pos++] = low & 127 | 128;
  low >>>= 7;
  pbf.buf[pbf.pos] = low & 127;
}
__name(writeBigVarintLow, "writeBigVarintLow");
function writeBigVarintHigh(high, pbf) {
  const lsb = (high & 7) << 4;
  pbf.buf[pbf.pos++] |= lsb | ((high >>>= 3) ? 128 : 0);
  if (!high)
    return;
  pbf.buf[pbf.pos++] = high & 127 | ((high >>>= 7) ? 128 : 0);
  if (!high)
    return;
  pbf.buf[pbf.pos++] = high & 127 | ((high >>>= 7) ? 128 : 0);
  if (!high)
    return;
  pbf.buf[pbf.pos++] = high & 127 | ((high >>>= 7) ? 128 : 0);
  if (!high)
    return;
  pbf.buf[pbf.pos++] = high & 127 | ((high >>>= 7) ? 128 : 0);
  if (!high)
    return;
  pbf.buf[pbf.pos++] = high & 127;
}
__name(writeBigVarintHigh, "writeBigVarintHigh");
function makeRoomForExtraLength(startPos, len, pbf) {
  const extraLen = len <= 16383 ? 1 : len <= 2097151 ? 2 : len <= 268435455 ? 3 : Math.floor(Math.log(len) / (Math.LN2 * 7));
  pbf.realloc(extraLen);
  for (let i = pbf.pos - 1; i >= startPos; i--)
    pbf.buf[i + extraLen] = pbf.buf[i];
}
__name(makeRoomForExtraLength, "makeRoomForExtraLength");
function writePackedVarint(arr, pbf) {
  for (let i = 0; i < arr.length; i++)
    pbf.writeVarint(arr[i]);
}
__name(writePackedVarint, "writePackedVarint");
function writePackedSVarint(arr, pbf) {
  for (let i = 0; i < arr.length; i++)
    pbf.writeSVarint(arr[i]);
}
__name(writePackedSVarint, "writePackedSVarint");
function writePackedFloat(arr, pbf) {
  for (let i = 0; i < arr.length; i++)
    pbf.writeFloat(arr[i]);
}
__name(writePackedFloat, "writePackedFloat");
function writePackedDouble(arr, pbf) {
  for (let i = 0; i < arr.length; i++)
    pbf.writeDouble(arr[i]);
}
__name(writePackedDouble, "writePackedDouble");
function writePackedBoolean(arr, pbf) {
  for (let i = 0; i < arr.length; i++)
    pbf.writeBoolean(arr[i]);
}
__name(writePackedBoolean, "writePackedBoolean");
function writePackedFixed32(arr, pbf) {
  for (let i = 0; i < arr.length; i++)
    pbf.writeFixed32(arr[i]);
}
__name(writePackedFixed32, "writePackedFixed32");
function writePackedSFixed32(arr, pbf) {
  for (let i = 0; i < arr.length; i++)
    pbf.writeSFixed32(arr[i]);
}
__name(writePackedSFixed32, "writePackedSFixed32");
function writePackedFixed64(arr, pbf) {
  for (let i = 0; i < arr.length; i++)
    pbf.writeFixed64(arr[i]);
}
__name(writePackedFixed64, "writePackedFixed64");
function writePackedSFixed64(arr, pbf) {
  for (let i = 0; i < arr.length; i++)
    pbf.writeSFixed64(arr[i]);
}
__name(writePackedSFixed64, "writePackedSFixed64");
function readUtf8(buf, pos, end) {
  let str = "";
  let i = pos;
  while (i < end) {
    const b0 = buf[i];
    let c = null;
    let bytesPerSequence = b0 > 239 ? 4 : b0 > 223 ? 3 : b0 > 191 ? 2 : 1;
    if (i + bytesPerSequence > end)
      break;
    let b1, b2, b3;
    if (bytesPerSequence === 1) {
      if (b0 < 128) {
        c = b0;
      }
    } else if (bytesPerSequence === 2) {
      b1 = buf[i + 1];
      if ((b1 & 192) === 128) {
        c = (b0 & 31) << 6 | b1 & 63;
        if (c <= 127) {
          c = null;
        }
      }
    } else if (bytesPerSequence === 3) {
      b1 = buf[i + 1];
      b2 = buf[i + 2];
      if ((b1 & 192) === 128 && (b2 & 192) === 128) {
        c = (b0 & 15) << 12 | (b1 & 63) << 6 | b2 & 63;
        if (c <= 2047 || c >= 55296 && c <= 57343) {
          c = null;
        }
      }
    } else if (bytesPerSequence === 4) {
      b1 = buf[i + 1];
      b2 = buf[i + 2];
      b3 = buf[i + 3];
      if ((b1 & 192) === 128 && (b2 & 192) === 128 && (b3 & 192) === 128) {
        c = (b0 & 15) << 18 | (b1 & 63) << 12 | (b2 & 63) << 6 | b3 & 63;
        if (c <= 65535 || c >= 1114112) {
          c = null;
        }
      }
    }
    if (c === null) {
      c = 65533;
      bytesPerSequence = 1;
    } else if (c > 65535) {
      c -= 65536;
      str += String.fromCharCode(c >>> 10 & 1023 | 55296);
      c = 56320 | c & 1023;
    }
    str += String.fromCharCode(c);
    i += bytesPerSequence;
  }
  return str;
}
__name(readUtf8, "readUtf8");
function writeUtf8(buf, str, pos) {
  for (let i = 0, c, lead; i < str.length; i++) {
    c = str.charCodeAt(i);
    if (c > 55295 && c < 57344) {
      if (lead) {
        if (c < 56320) {
          buf[pos++] = 239;
          buf[pos++] = 191;
          buf[pos++] = 189;
          lead = c;
          continue;
        } else {
          c = lead - 55296 << 10 | c - 56320 | 65536;
          lead = null;
        }
      } else {
        if (c > 56319 || i + 1 === str.length) {
          buf[pos++] = 239;
          buf[pos++] = 191;
          buf[pos++] = 189;
        } else {
          lead = c;
        }
        continue;
      }
    } else if (lead) {
      buf[pos++] = 239;
      buf[pos++] = 191;
      buf[pos++] = 189;
      lead = null;
    }
    if (c < 128) {
      buf[pos++] = c;
    } else {
      if (c < 2048) {
        buf[pos++] = c >> 6 | 192;
      } else {
        if (c < 65536) {
          buf[pos++] = c >> 12 | 224;
        } else {
          buf[pos++] = c >> 18 | 240;
          buf[pos++] = c >> 12 & 63 | 128;
        }
        buf[pos++] = c >> 6 & 63 | 128;
      }
      buf[pos++] = c & 63 | 128;
    }
  }
  return pos;
}
__name(writeUtf8, "writeUtf8");

// ../schema/src/index.ts
function writeCurrentWeather(obj, pbf) {
  if (obj.code)
    pbf.writeVarintField(1, obj.code);
  if (obj.temp)
    pbf.writeSVarintField(2, obj.temp);
  if (obj.humidity)
    pbf.writeVarintField(3, obj.humidity);
  if (obj.precip)
    pbf.writeVarintField(4, obj.precip);
  if (obj.windSpeed)
    pbf.writeVarintField(5, obj.windSpeed);
}
__name(writeCurrentWeather, "writeCurrentWeather");
function writeTomorrowForecast(obj, pbf) {
  if (obj.code)
    pbf.writeVarintField(1, obj.code);
  if (obj.temp)
    pbf.writeSVarintField(2, obj.temp);
  if (obj.tempMax)
    pbf.writeSVarintField(3, obj.tempMax);
  if (obj.tempMin)
    pbf.writeSVarintField(4, obj.tempMin);
  if (obj.pop)
    pbf.writeVarintField(5, obj.pop);
  if (obj.precip)
    pbf.writeVarintField(6, obj.precip);
  if (obj.windSpeed)
    pbf.writeVarintField(7, obj.windSpeed);
}
__name(writeTomorrowForecast, "writeTomorrowForecast");
function writeHourlyForecast(obj, pbf) {
  if (obj.startTime)
    pbf.writeVarintField(1, obj.startTime);
  if (obj.codes && obj.codes.length)
    pbf.writePackedVarint(2, obj.codes);
  if (obj.temps && obj.temps.length)
    pbf.writePackedSVarint(3, obj.temps);
  if (obj.humidities && obj.humidities.length)
    pbf.writePackedVarint(4, obj.humidities);
  if (obj.pops && obj.pops.length)
    pbf.writePackedVarint(5, obj.pops);
  if (obj.precips && obj.precips.length)
    pbf.writePackedVarint(6, obj.precips);
  if (obj.windSpeeds && obj.windSpeeds.length)
    pbf.writePackedVarint(7, obj.windSpeeds);
}
__name(writeHourlyForecast, "writeHourlyForecast");
function writeWeatherData(obj, pbf) {
  if (obj.updatedAt)
    pbf.writeVarintField(1, obj.updatedAt);
  if (obj.current)
    pbf.writeMessage(2, writeCurrentWeather, obj.current);
  if (obj.tomorrow)
    pbf.writeMessage(3, writeTomorrowForecast, obj.tomorrow);
  if (obj.hourly)
    pbf.writeMessage(4, writeHourlyForecast, obj.hourly);
}
__name(writeWeatherData, "writeWeatherData");
function writeNews(obj, pbf) {
  if (obj.id)
    pbf.writeVarintField(1, obj.id);
  if (obj.createdAt)
    pbf.writeVarintField(2, obj.createdAt);
  if (obj.title)
    pbf.writeStringField(3, obj.title);
  if (obj.category)
    pbf.writeVarintField(4, obj.category);
}
__name(writeNews, "writeNews");
function writeEventData(obj, pbf) {
  if (obj.id)
    pbf.writeVarintField(1, obj.id);
  if (obj.title)
    pbf.writeStringField(2, obj.title);
  if (obj.startTime)
    pbf.writeVarintField(3, obj.startTime);
  if (obj.endTime)
    pbf.writeVarintField(4, obj.endTime);
  if (obj.location)
    pbf.writeStringField(5, obj.location);
  if (obj.description)
    pbf.writeStringField(6, obj.description);
}
__name(writeEventData, "writeEventData");
function writeSyncData(obj, pbf) {
  if (obj.timestamp)
    pbf.writeVarintField(1, obj.timestamp);
  if (obj.weather)
    pbf.writeMessage(2, writeWeatherData, obj.weather);
  if (obj.news && obj.news.length) {
    for (let i = 0; i < obj.news.length; i++) {
      pbf.writeMessage(3, writeNews, obj.news[i]);
    }
  }
  if (obj.events && obj.events.length) {
    for (let i = 0; i < obj.events.length; i++) {
      pbf.writeMessage(4, writeEventData, obj.events[i]);
    }
  }
}
__name(writeSyncData, "writeSyncData");
function serializeSyncData(data) {
  const pbf = new Pbf();
  writeSyncData(data, pbf);
  return pbf.finish();
}
__name(serializeSyncData, "serializeSyncData");

// src/index.ts
import mockDataRaw from "./e08501a440d55dfe95a600fbdc72261660632168-mockData.jsonc";
function parseJsonc(jsoncString) {
  const jsonString = jsoncString.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
  const cleanJsonString = jsonString.replace(/,\s*([\]}])/g, "$1");
  return JSON.parse(cleanJsonString);
}
__name(parseJsonc, "parseJsonc");
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (url.pathname === "/api/v1/sync.bin") {
      try {
        const syncData = parseJsonc(mockDataRaw);
        const weatherAt = parseInt(url.searchParams.get("weather_at") || "0", 10);
        const lastNewsId = parseInt(url.searchParams.get("last_news_id") || "0", 10);
        const lastEventId = parseInt(url.searchParams.get("last_event_id") || "0", 10);
        if (syncData.weather && syncData.weather.updatedAt <= weatherAt) {
          syncData.weather = null;
        }
        if (syncData.news && syncData.news.length > 0) {
          syncData.news = syncData.news.filter((n) => n.id > lastNewsId);
        }
        if (syncData.events && syncData.events.length > 0) {
          syncData.events = syncData.events.filter((e) => e.id > lastEventId);
        }
        const binary = serializeSyncData(syncData);
        return new Response(binary, {
          headers: {
            "content-type": "application/octet-stream",
            "Content-Length": String(binary.length),
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (error) {
        return new Response(`Error parsing sync data: ${error.message}`, {
          status: 500,
          headers: {
            "content-type": "text/plain",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }
    return new Response("19NSJ API Proxy Edge Workers Active", {
      headers: { "content-type": "text/plain" }
    });
  }
};

// ../../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-M107dm/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-M107dm/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
