import { Gost341194 } from "@li0ard/gost341194"
import { bytesToHex, hexToBytes } from "@li0ard/gost3413/dist/utils"
import { decryptCFB, decryptECB, sboxes } from "@li0ard/magma"
import { PrivateKeyInfo } from "@peculiar/asn1-pkcs8"
import { AsnParser, AsnSerializer, OctetString } from "@peculiar/asn1-schema"
import { ExportKeyBlob, PrivateKeyOids, type ExportOids, type ParsedBlob } from "./schema"
import { kdf_gostr3411_2012_256 } from "@li0ard/streebog"
import { AlgorithmIdentifier } from "@peculiar/asn1-x509"
import { bytesToBase64 } from "./base64"

const utf16le = (str: string) => {
    const buffer = new Uint8Array(str.length * 2);
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        buffer[i * 2] = code & 0xFF;
        buffer[i * 2 + 1] = (code >> 8) & 0xFF;
    }
    return buffer;
}

export const prepareTransportKey = (pass: string, salt: Uint8Array, rounds: number): Uint8Array => {
    let key: Uint8Array = utf16le(pass)
    for(let i = 1; i < rounds + 1; i++) {
        let hasher = new Gost341194()
        hasher.update(hexToBytes(bytesToHex(key) + bytesToHex(salt) + i.toString(16).padStart(4, "0")))
        key = hasher.digest()
    }

    return key
}

export const decodeTransport = (key: Uint8Array, salt: Uint8Array, encrypted: Uint8Array): Uint8Array => {
    return decryptCFB(key, encrypted, salt.slice(0, 8), true, sboxes.ID_GOST_28147_89_CRYPTO_PRO_A_PARAM_SET)
}

export const parseBlob = (blob: Uint8Array): ParsedBlob => {
    let parsed = AsnParser.parse(blob, PrivateKeyInfo)
    let cryptoproBlob = new Uint8Array(AsnParser.parse(blob, PrivateKeyInfo).privateKey.buffer)
    let parsedBlob = AsnParser.parse(cryptoproBlob.slice(16), ExportKeyBlob)

    return {
        exportEncoding: {
            ukm: parsedBlob.value.ukm,
            enc: parsedBlob.value.cek.enc,
            mac: parsedBlob.value.cek.mac,
        },
        oids: {
            algorithm: parsed.privateKeyAlgorithm.algorithm,
            curve: parsedBlob.value.parameters.privateKeyParameters.oids.curve,
            digest: parsedBlob.value.parameters.privateKeyParameters.oids.digest,
        }
    }
}

export const decodeExport = (key: Uint8Array, ukm: Uint8Array, enc: Uint8Array): Uint8Array => {
    return decryptECB(kdf_gostr3411_2012_256(key, hexToBytes("26BDB878"), ukm), enc, true, sboxes.ID_GOST_28147_89_CRYPTO_PRO_A_PARAM_SET)
}

const pem = (data: Uint8Array, header: string) => {
    let str = `-----BEGIN ${header.toUpperCase()}-----\n${bytesToBase64(data).replace(/(.{64})/g, "$1\n")}\n-----END ${header.toUpperCase()}-----`
    return str
}

export const ks2pem = (ks: Uint8Array, oids: ExportOids) => {
    let encodedOids = new PrivateKeyOids()
    encodedOids.curve = oids.curve
    encodedOids.digest = oids.digest
    
    let algorithm = new AlgorithmIdentifier()
    algorithm.algorithm = oids.algorithm
    algorithm.parameters = AsnSerializer.serialize(encodedOids)

    let a = new OctetString()
    a.buffer = ks.buffer as any
    
    let privateKey = new PrivateKeyInfo()
    privateKey.privateKeyAlgorithm = algorithm
    privateKey.privateKey = a

    return pem(new Uint8Array(AsnSerializer.serialize(privateKey)), "PRIVATE KEY")
}