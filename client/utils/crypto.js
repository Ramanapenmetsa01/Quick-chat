// derive key from password
import nacl from "tweetnacl";
import * as util from "tweetnacl-util";


async function deriveKey(password, salt) {
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: Uint8Array.from(atob(salt), c => c.charCodeAt(0)),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );
}

// encrypt private key
export async function encryptPrivateKey(privateKey, password) {

    const encoder = new TextEncoder();

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(password, btoa(String.fromCharCode(...salt)));

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(privateKey)
    );

    return {
        encryptedPrivateKey: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        salt: btoa(String.fromCharCode(...salt)),
        iv: btoa(String.fromCharCode(...iv))
    };
}

// decrypt private key
export async function decryptPrivateKey(encryptedPrivateKey, password, salt, iv) {

    const decoder = new TextDecoder();

    // convert base64 → Uint8Array
    const encryptedBytes = Uint8Array.from(atob(encryptedPrivateKey), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    // derive key using same password and salt
    const key = await deriveKey(password, salt);

    // decrypt
    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivBytes
        },
        key,
        encryptedBytes
    );

    // convert to string
    return decoder.decode(decrypted);
}


export function encryptMessage(message, receiverPublicKeyBase64, senderPrivateKeyBase64) {

    const receiverPublicKey = util.decodeBase64(receiverPublicKeyBase64);
    const senderPrivateKey = util.decodeBase64(senderPrivateKeyBase64);

    const nonce = nacl.randomBytes(24);

    const encrypted = nacl.box(
        util.decodeUTF8(message),
        nonce,
        receiverPublicKey,
        senderPrivateKey
    );

    return {
        encryptedMessage: util.encodeBase64(encrypted),
        nonce: util.encodeBase64(nonce)
    };
}

export function decryptMessage(encryptedMessageBase64, nonceBase64, senderPublicKeyBase64, receiverPrivateKeyBase64) {

    const encryptedMessage = util.decodeBase64(encryptedMessageBase64);
    const nonce = util.decodeBase64(nonceBase64);
    const senderPublicKey = util.decodeBase64(senderPublicKeyBase64);
    const receiverPrivateKey = util.decodeBase64(receiverPrivateKeyBase64);

    const decrypted = nacl.box.open(
        encryptedMessage,
        nonce,
        senderPublicKey,
        receiverPrivateKey
    );

    if (!decrypted) return null;

    return util.encodeUTF8(decrypted);
}
