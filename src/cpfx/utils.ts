import { gost341194 } from "@li0ard/gost341194"
import { concatBytes, hexToBytes } from "@noble/hashes/utils"
import { decryptCFB, sboxes, unwrap } from "@li0ard/magma"
import { PrivateKeyInfo } from "@peculiar/asn1-pkcs8"
import { AsnParser } from "@peculiar/asn1-schema"
import { ExportKeyBlob, type ParsedBlob } from "./schema"
import { kdf_gostr3411_2012_256 } from "@li0ard/streebog"

const utf16le = (str: string) => {
    const buffer = new Uint8Array(str.length * 2);
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        buffer[i * 2] = code & 0xFF;
        buffer[i * 2 + 1] = (code >> 8) & 0xFF;
    }
    return buffer;
}

/**
 * Подготовка ключа для снятия транспортной кодировки
 * ```
 * K0 = utf16(PASS)
 * 
 * ∀i ∊ {1,2,...,r}: K_i = GOST341194(K_i-1 || salt || i)
 * ```
 * @param pass Пароль от PFX
 * @param salt Вектор инициализации (Прописан в PFX)
 * @param rounds Количество итераций хэширования (Прописано в PFX)
 */
export const prepareTransportKey = (pass: string, salt: Uint8Array, rounds: number): Uint8Array => {
    let key: Uint8Array = utf16le(pass)
    for(let i = 1; i < rounds + 1; i++) {
        //key = gost341194(hexToBytes(bytesToHex(key) + bytesToHex(salt) + i.toString(16).padStart(4, "0")));
        key = gost341194(concatBytes(key, salt, new Uint8Array([(i >> 8) & 0xFF, i & 0xFF])))
    }

    return key
}

/**
 * Снятие транспортной кодировки
 * @param key Ранее сгененрированный ключ
 * @param salt Вектор инициализации (Прописан в PFX)
 * @param encrypted Зашифрованный ключевой блоб
 */
export const decodeTransport = (key: Uint8Array, salt: Uint8Array, encrypted: Uint8Array): Uint8Array => {
    return decryptCFB(key, encrypted, salt.slice(0, 8), true, sboxes.ID_GOST_28147_89_CRYPTO_PRO_A_PARAM_SET)
}

/**
 * Парсинг экспортного представления ключа
 * 
 * Примечание:
 * MAC экспортного представления расчитывается следующим образом:
 * ```
 * M = MAC(KEKe, ExportKeyBlobValue)
 * ```
 * @param blob Ключевой блоб
 * @returns 
 */
export const parseBlob = (blob: Uint8Array): ParsedBlob => {
    let parsed = AsnParser.parse(blob, PrivateKeyInfo)
    let cryptoproBlob = new Uint8Array(parsed.privateKey.buffer)
    let parsedBlob = AsnParser.parse(cryptoproBlob.slice(16), ExportKeyBlob)

    return {
        exportEncoding: concatBytes(parsedBlob.value.ukm, parsedBlob.value.cek.enc, parsedBlob.value.cek.mac),
        oids: {
            algorithm: parsed.privateKeyAlgorithm.algorithm,
            curve: parsedBlob.value.parameters.privateKeyParameters.oids.curve,
            digest: parsedBlob.value.parameters.privateKeyParameters.oids.digest,
        }
    }
}

/**
 * Снятие экспортной кодировки
 * ```
 * label = 0x26BDB878
 * 
 * KEKe = KDF_GOSTR3411_2012_256(K, label, UKM)
 * Ks = unwrap(KEKe, (UKM || CEK_ENC || CEK_MAC))
 * ```
 * @param key Ранее сгененрированный ключ
 * @param ukm `UKM` из блоба
 * @param data Данные для unwrap алгоритма (`UKM || CEK_ENC || CEK_MAC`)
 */
export const decodeExport = (key: Uint8Array, data: Uint8Array): Uint8Array => {
    return unwrap(kdf_gostr3411_2012_256(key, hexToBytes("26BDB878"), data.slice(0, 8)), data)
}