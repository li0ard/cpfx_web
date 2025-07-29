import { AsnParser } from "@peculiar/asn1-schema"
import { Container } from "./schemas/main.scheme"
import { ContainerMask, ContainerPrimary } from "./schemas/other.scheme"
import { ks2pem } from "@/lib/crypto";
import type { Result } from "@/cpfx";

export const proceedCryptoProContainer = (
    headerKey: Uint8Array,
    masksKey: Uint8Array,
    primaryKey: Uint8Array,
    passw: string
): Result => {
    try {
        let container = AsnParser.parse(headerKey, Container);
        let masks = AsnParser.parse(masksKey, ContainerMask);
        let primary = AsnParser.parse(primaryKey, ContainerPrimary);

        if(!container.verifyPassword(passw)) console.warn("Неудачная проверка пароля. Экспорт будет произведён, но точность не гарантируется");
        let key = container.getPrivateKey(passw, primary.value, masks);

        return { ok: true, pem: ks2pem(key, container.getAlgorithm()) }
    } catch(e) {
        console.error(e)
        return { ok: false, pem: "" }
    }
}

/*let path = "256"
let password = "qawsqaws"

let container = AsnParser.parse(
    await Bun.file(`/home/li0ard/ckey_js/containers/${path}_qawsqaws/header.key`).bytes(),
    Container
)
let masks = AsnParser.parse(
    await Bun.file(`/home/li0ard/ckey_js/containers/${path}_qawsqaws/masks.key`).bytes(),
    ContainerMask
)

let primary = AsnParser.parse(
    await Bun.file(`/home/li0ard/ckey_js/containers/${path}_qawsqaws/primary.key`).bytes(),
    ContainerPrimary
)

if(!container.verifyPassword(password)) console.warn("Неудачная проверка пароля. Экспорт будет произведён, но точность не гарантируется");

console.log(container.getPrivateKey(
    password,
    primary.value,
    masks
).toHex())
console.log(container.getAlgorithm())*/
