// lib/registry.mjs
import Web3 from "web3";
import DIDRegistryArticact from "../build/contracts/DIDRegistry.json" assert { type: "json" };

// --- Web3インスタンス生成 ---
export function createWeb3() {
    return new Web3("http://127.0.0.1:8545");
}

// --- アカウント一覧取得 ---
export async function getAccounts(web3) {
    return await web3.eth.getAccounts();
}

export async function getRegistryContract(web3) {
    const networkId = (await web3.eth.net.getId()).toString();
    const deployed = DIDRegistryArticact.networks[networkId];

    return new web3.eth.Contract(DIDRegistryArticact.abi, deployed.address);
}

// --- DID DocumentをDID文字列から検索 ---
export async function findDIDDocument(registry, accounts, did) {
    for(const acc of accounts) {
        const count = await registry.methods.getDIDCount(acc).call();
        for(let i = 0; i < count; i++) {
            const doc = await registry.methods.getDIDDocument(acc, i).call();
            if(doc.did === did) {
                return {
                    owner: acc,
                    document: doc
                };
            }
        }
    }
    return null;
}

// --- IoTデータ(DID + CiD)を検索 ---
// ★ABAC連動：コントラクトの getIoTData を叩く際、呼び出し元（from）の属性が足りないとエラー（revert）になります
export async function findIoTRecord(registry, accounts, did, cid, from) {
    for(const acc of accounts) {
        const count = await registry.methods.getIoTDataCount(acc).call();
        for(let i = 0; i < count; i++) {
            try {
                // 引数に閲覧要求者（from）の指定ができるように send/call オプションを設定
                const rec = await registry.methods.getIoTData(acc, i).call({ from });
                if(rec.did === did && rec.cid === cid) {
                    return {
                        owner: acc,
                        record: rec
                    };
                }
            } catch (error) {
                // 属性を持たないアカウント（from）からのアクセスの場合は require で弾かれてここに入ります
                console.log(`[ABAC Guard] Account ${from} is restricted from viewing index ${i} owned by ${acc}.`);
            }
        }
    }
    return null;
}

// --- DIDのみ一致するIoTデータを検索 ---
// ★ABAC連動：こちらも同様に呼び出し元（from）を明示して検証が走るように対応
export async function findIoTByDID(registry, accounts, did, from) {
    for(const acc of accounts) {
        const count = await registry.methods.getIoTDataCount(acc).call();
        for(let i = 0; i < count; i++) {
            try {
                const rec = await registry.methods.getIoTData(acc, i).call({ from });
                if(rec.did === did) {
                    return {
                        owner: acc,
                        record: rec
                    };
                }
            } catch (error) {
                // 属性エラーで弾かれた場合のハンドリング
                console.log(`[ABAC Guard] Account ${from} is restricted from viewing DID: ${did}.`);
            }
        }
    }
    return null;
}

// --- ★変更：IoTデータ登録 ---
// 引数の最後に「requiredAttribute（要求する属性文字列）」を追加しました
export async function registerIoTData(registry, from, did, cid, requiredAttribute = "") {
    return await registry.methods
        .registerIoTData(did, cid, requiredAttribute)
        .send({ from, gas: 300000 });
}

// --- ★追加：ユーザーへの属性付与 ---
// デモ実行や検証プログラムから、特定のアカウントに属性（"A" など）を覚えさせるための関数です
export async function assignAttribute(registry, from, userAddress, attribute) {
    return await registry.methods
        .assignAttribute(userAddress, attribute)
        .send({ from, gas: 300000 });
}

// --- DID Documentを登録 ---
export async function registerIoTDocument(registry, from, did, didDoc) {
    return await registry.methods
        .registerDIDDocument(did, JSON.stringify(didDoc))
        .send({ from, gas: 300000 });
}
