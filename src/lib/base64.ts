const CHARS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "+",
    "/",
    "=",
] as const;

export function bytesToBase64(input: Uint8Array): string {
    const inpLen = input.length;
    const inpRem = inpLen % 3;
    const padLen = inpRem > 0 ? 3 - inpRem : 0;
    const outLen = (inpLen + padLen) * 4 / 3;
    const output = new Array<string>(outLen);
  
    let j = 0; // Output index
    const len = inpLen - inpRem;
    for (let i = 2; i < len; i += 3) {
        const num24b = (input[i - 2] << 16) | (input[i - 1] << 8) | input[i];
        output[j++] = CHARS[(num24b >> 18) & 0x3f];
        output[j++] = CHARS[(num24b >> 12) & 0x3f];
        output[j++] = CHARS[(num24b >> 6) & 0x3f];
        output[j++] = CHARS[num24b & 0x3f];
    }
  
    if (padLen === 2) {
        const num24b = input[len] << 16;
        output[j++] = CHARS[(num24b >> 18) & 0x3f];
        output[j++] = CHARS[(num24b >> 12) & 0x3f];
        output[j++] = "=";
        output[j++] = "=";
    } else if (padLen === 1) {
        const num24b = (input[len] << 16) | (input[len + 1] << 8);
        output[j++] = CHARS[(num24b >> 18) & 0x3f];
        output[j++] = CHARS[(num24b >> 12) & 0x3f];
        output[j++] = CHARS[(num24b >> 6) & 0x3f];
        output[j++] = "=";
    }

    return output.join("");
}