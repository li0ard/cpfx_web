import { mac_legacy, sboxes } from "@li0ard/magma"
import { derive } from "./cpkdf"

/** Вычисление MAC контейнера */
export const computeContainerMAC = (data: Uint8Array): Uint8Array => {
    return mac_legacy(new Uint8Array(32), data, new Uint8Array(8), sboxes.ID_TC26_GOST_28147_PARAM_Z).slice(0, 4);
}

export const computePasswordMAC = (password: Uint8Array, salt: Uint8Array): Uint8Array => {
    let key = derive(password, salt);
    let data = new Uint8Array(16);

    return mac_legacy(key, data, new Uint8Array(8), sboxes.ID_TC26_GOST_28147_PARAM_Z).slice(0, 4);
}

/** Вычисление MAC маски и соли */
export const computeMaskMAC = (mask: Uint8Array, salt: Uint8Array): Uint8Array => {
    let key = mask.length == 32 ? mask : mask.slice(32);
    return mac_legacy(key, salt, new Uint8Array(8), sboxes.ID_TC26_GOST_28147_PARAM_Z).slice(0, 4)
}