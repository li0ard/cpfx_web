import { PFX, SafeContents } from "@peculiar/asn1-pfx";
import { AsnParser, OctetString } from "@peculiar/asn1-schema";
import { KeyBag, PBEParameters } from "./schema";
import { decodeExport, decodeTransport, ks2pem, parseBlob, prepareTransportKey } from "./utils";

export const proceedPFX = (file: Uint8Array, passw: string): string => {
    let pfx = AsnParser.parse(file, PFX)
    if (pfx.version != 3) throw new Error("can only decode v3 PFX PDU");
    if (pfx.authSafe.contentType !== "1.2.840.113549.1.7.1") throw new Error("only password-protected PFX is implemented");

    let data = new Uint8Array(AsnParser.parse(pfx.authSafe.content, OctetString).buffer)
    let bags = AsnParser.parse(data, SafeContents).filter(i => i.bagId == "1.2.840.113549.1.7.1")
    if(bags.length === 0) throw new Error("no private key");

    let bag = AsnParser.parse(AsnParser.parse(bags[0].bagValue, OctetString).buffer, KeyBag).bagValue.value
    if(bag.encryptionAlgorithm.algorithm !== "1.2.840.113549.1.12.1.80") throw new Error("not gost pbe");
    let parameters = AsnParser.parse(bag.encryptionAlgorithm.parameters as ArrayBuffer, PBEParameters)

    let key = prepareTransportKey(passw, parameters.salt, parameters.rounds)
    try {
        let result = parseBlob(decodeTransport(key, parameters.salt, new Uint8Array(bag.encryptedData.buffer)))
        if(result.oids.algorithm !== "1.2.643.7.1.1.1.1" && result.oids.algorithm !== "1.2.643.7.1.1.1.2") {
            console.error("only GOST 34.10-2012 supported")
            return "";
        }
        let Ks = decodeExport(key, result.exportEncoding.ukm, result.exportEncoding.enc)
        return ks2pem(Ks, result.oids)
    } catch (e) {
        console.error("Blob decoding error. Perhaps just incorrect password")
        return ""
    }
}