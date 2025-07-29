import { AsnArray, AsnConvert, AsnProp, AsnPropTypes, AsnSerializer, AsnType, AsnTypeTypes, BitString, type IAsnConverter } from "@peculiar/asn1-schema";
import { Certificate } from "@peculiar/asn1-x509";
import { OctetString } from "asn1js"
import { computeContainerMAC, computePasswordMAC } from "../utils/mac";
import { oid2curves } from "../utils/curves";
import { decryptECB, sboxes } from "@li0ard/magma";
import { derive } from "../utils/cpkdf";
import { bytesToNumberLE, equalBytes, numberToBytesBE } from "@noble/curves/utils";
import { Field } from "@noble/curves/abstract/modular";
import { getPublicKey } from "@li0ard/gostcurves";
import type { ContainerMask } from "./other.scheme";
import type { ExportOids } from "@/cpfx/schema";

const CertificateEncapsulate: IAsnConverter<Certificate, OctetString> = {
    fromASN: (value: OctetString): Certificate => AsnConvert.parse(value.valueBlock.valueHexView, Certificate),
    toASN: (value: Certificate): OctetString => new OctetString({ valueHex: AsnConvert.serialize(value) })
}

export class GostPrivateKeyOIDs {
    @AsnProp({ type: AsnPropTypes.ObjectIdentifier })
    curve: string = "";

    @AsnProp({ type: AsnPropTypes.ObjectIdentifier })
    digest: string = "";
}

export class AlgorithmIdentifier {
    @AsnProp({ type: AsnPropTypes.ObjectIdentifier })
    algorithmIdentifier: string = ""

    @AsnProp({ type: GostPrivateKeyOIDs })
    oids: GostPrivateKeyOIDs = new GostPrivateKeyOIDs()
}

export class PrivateKeyParameters {
    @AsnProp({ type: BitString })
    attributes: BitString = new BitString()

    @AsnProp({ type: AlgorithmIdentifier, context: 0, implicit: true })
    algorithm: AlgorithmIdentifier = new AlgorithmIdentifier()
}

export class CertificateLink {
    @AsnProp({ type: AsnPropTypes.IA5String })
    path: string = "";

    @AsnProp({ type: AsnPropTypes.OctetString })
    hmac: Uint8Array = new Uint8Array()
}

export class Extension {
    @AsnProp({ type: AsnPropTypes.ObjectIdentifier })
    identifier: string = ""

    @AsnProp({ type: AsnPropTypes.OctetString })
    value: Uint8Array = new Uint8Array()
}

@AsnType({ type: AsnTypeTypes.Sequence, itemType: Extension })
export class Extensions extends AsnArray<Extension> {
    constructor(items?: Extension[]) {
        super(items);
        Object.setPrototypeOf(this, Extensions.prototype);
    }
  }

export class ContainerContent {
    @AsnProp({ type: AsnPropTypes.ObjectIdentifier, context: 0, optional: true })
    algorithmIdentifier: string = ""

    @AsnProp({ type: AsnPropTypes.IA5String, optional: true })
    containerName?: string;

    @AsnProp({ type: BitString })
    attributes: BitString = new BitString()

    @AsnProp({ type: PrivateKeyParameters })
    primaryKeyParameters: PrivateKeyParameters = new PrivateKeyParameters()

    @AsnProp({ type: AsnPropTypes.OctetString, context: 2, implicit: true, optional: true })
    hmacPassword?: Uint8Array

    @AsnProp({ type: AsnPropTypes.Any, context: 3, optional: true })
    secondaryEncryptedKey?: Uint8Array;

    @AsnProp({ type: PrivateKeyParameters, context: 4, implicit: true, optional: true })
    secondaryKeyParameters?: PrivateKeyParameters;

    @AsnProp({ type: AsnPropTypes.OctetString, context: 5,  implicit: true, optional: true, converter: CertificateEncapsulate })
    primaryCertificate?: Certificate;

    @AsnProp({ type: AsnPropTypes.OctetString, context: 6, implicit: true, optional: true, converter: CertificateEncapsulate })
    secondaryCertificate?: Certificate;

    @AsnProp({ type: AsnPropTypes.IA5String, context: 7, implicit: true, optional: true })
    encryptionContainerName?: string;

    @AsnProp({ type: CertificateLink, context: 8, implicit: true, optional: true })
    primaryCertificateLink?: CertificateLink;

    @AsnProp({ type: CertificateLink, context: 9, implicit: true, optional: true })
    secondaryCertificateLink?: CertificateLink;

    @AsnProp({ type: AsnPropTypes.OctetString, context: 10, implicit: true, optional: true })
    primaryFP?: Uint8Array;

    @AsnProp({ type: AsnPropTypes.OctetString, context: 11, implicit: true, optional: true })
    secondaryFP?: Uint8Array;

    @AsnProp({ type: AsnPropTypes.ObjectIdentifier, optional: true })
    passwordPolicy?: string;

    @AsnProp({ type: AsnPropTypes.Integer, optional: true })
    containerSecurityLevel?: number;

    @AsnProp({ type: Extensions, context: 12, implicit: true, optional: true })
    extensions?: Extensions;

    @AsnProp({ type: AsnPropTypes.IA5String, context: 13, implicit: true, optional: true })
    secondaryContainerName?: Uint8Array;
}

/** Содержимое `header.key` */
export class Container {
    /** Содержимое контейнера */
    @AsnProp({ type: ContainerContent })
    public content: ContainerContent = new ContainerContent();

    /** MAC контейнера */
    @AsnProp({ type: AsnPropTypes.OctetString })
    public mac: Uint8Array = new Uint8Array();

    /** Проверка валидности MAC контейнера */
    public isValidMAC(): boolean {
        return equalBytes(computeContainerMAC(new Uint8Array(AsnSerializer.serialize(this.content))), this.mac)
    }

    public verifyPassword(passw: string) {
        return equalBytes(computePasswordMAC(new TextEncoder().encode(passw), this.content.primaryFP as Uint8Array), this.content.hmacPassword as Uint8Array)
    }

    /** Экспорт приватного ключа из контейнера */
    public getPrivateKey(passw: string, primary: Uint8Array, masks: ContainerMask): Uint8Array {
        if(!masks.isValidMAC()) console.warn("Неудачная проверка MAC маски и соли");
        let curve = oid2curves[this.content.primaryKeyParameters.algorithm.oids.curve];

        let pk = bytesToNumberLE(decryptECB(derive(new TextEncoder().encode(passw), masks.salt), primary, true, sboxes.ID_TC26_GOST_28147_PARAM_Z));
        let m = bytesToNumberLE(masks.mask);
        let raw = numberToBytesBE(Field(curve.n).div(pk, m), curve.length);
        if(!equalBytes(getPublicKey(curve, raw).slice(curve.length - 7, curve.length + 1).reverse(), this.content.primaryFP as Uint8Array)) throw new Error("Public key validation error");

        return raw.slice().reverse();
    }

    /** Получение OID алгоритмов приватного ключа */
    public getAlgorithm(): ExportOids {
        return {
            algorithm: (this.content.primaryKeyParameters.algorithm.algorithmIdentifier == "1.2.643.7.1.1.6.2" ? "1.2.643.7.1.1.1.2" : "1.2.643.7.1.1.1.1"),
            curve: this.content.primaryKeyParameters.algorithm.oids.curve,
            digest: this.content.primaryKeyParameters.algorithm.oids.digest,
        }
    }
}