import { bytesToBase64 } from "@/lib/base64"
import { PrivateKeyOids, type ExportOids } from "@/cpfx/schema"
import { PrivateKeyInfo } from "@peculiar/asn1-pkcs8"
import { AsnSerializer, OctetString } from "@peculiar/asn1-schema"
import { AlgorithmIdentifier } from "@peculiar/asn1-x509"

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