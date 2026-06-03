import Web3 from "web3";
import fs from "fs";
import DIDRegistryArtifact from "../build/contracts/DIDRegistry.json" assert { type: "json" };

// 連動モジュールのインポート（パスは環境に合わせて調整してください）
import { connectIPFS, uploadFile } from "./lib/ipfs.mjs";
import { registerIoTData, findIoTRecord, assignAttribute } from "./lib/registry.mjs";
import { signWithPrivateKey } from "./lib/crypto.mjs";
import { makeMetricsFilename, appendCsvLine, measureMs } from "./lib/metrics.mjs";

(async () => {
    // 1. Web3インスタンス作成
    const web3 = new Web3("http://127.0.0.1:8545");

    // 2. アカウント一覧取得
    const accounts = await web3.eth.getAccounts();
    console.log("Accounts from Ganache:", accounts);

    // デモ用のアカウント役割分担
    const iotDevice = accounts[0];  // IoT機器（データ登録者）
    const userA = accounts[1];      // 閲覧者A（0x2c85...の代わり）

    // 3. ネットワークID取得
    const rawNetworkId = await web3.eth.net.getId();
    const networkId = rawNetworkId.toString();
    console.log("Network ID:", networkId);

    // 4. DID Registryのデプロイ情報取得
    const deployed = DIDRegistryArtifact.networks[networkId];
    if(!deployed) {
        console.error("DIDRegistry is not deployed on network:", networkId);
        return;
    }
    console.log("DIDRegistry address:", deployed.address);

    const registryContract = new web3.eth.Contract(DIDRegistryArtifact.abi, deployed.address);

    // ==========================================
    // ★ ここからABACの実証・計測シナリオを追加
    // ==========================================
    console.log("\n--- ABAC Demonstration Scenario Start ---");

    // 評価実験用のCSVファイル作成
    const metricsPath = makeMetricsFilename("abac_perf_metrics");
    appendCsvLine(metricsPath, ["Timestamp", "Operation", "User", "HasAttribute", "Status", "DurationMs"]);

    // ダミーのIoTデータファイルを作成（実証用）
    const dummyFilePath = "./dummy_iot_data.txt";
    fs.writeFileSync(dummyFilePath, "Temperature: 22.5C, Humidity: 45%");

    try {
        // --- STEP 1: IPFSへのデータアップロード ---
        const ipfs = connectIPFS();
        console.log("[IPFS] Uploading file...");
        const cid = await uploadFile(ipfs, dummyFilePath);
        console.log(`[IPFS] File uploaded. CID: ${cid}`);

        // --- STEP 2: メッセージへのデジタル署名 (crypto.mjsの連動) ---
        const did = "did:example:userA";
        const messageObj = { did, cid, description: "IoT Sensor Data" };
        const { signature } = await signWithPrivateKey(iotDevice, messageObj);
        console.log("[Crypto] Digital signature generated successfully.");

        // --- STEP 3: ABAC（要求属性 A）をセットしてブロックチェーンへ登録 ---
        const requiredAttribute = "Attribute_A"; 
        console.log(`[Blockchain] Registering IoT data with restriction: Require [${requiredAttribute}]`);
        
        await registerIoTData(registryContract, iotDevice, did, cid, requiredAttribute);
        console.log("[Blockchain] IoT data successfully registered.");

        // --- STEP 4: 【属性なし】でのアクセス試行とパフォーマンス計測 ---
        console.log("\n[Scenario] UserA (No Attribute) attempts to access the data...");
        
        const testCase1 = await measureMs(async () => {
            // accounts一覧を全走査してデータを検索（内部でコントラクトのgetIoTDataを叩く）
            return await findIoTRecord(registryContract, accounts, did, cid, userA);
        });

        // 属性がないため、findIoTRecordの中で[ABAC Guard]が作動し、結果はnull（拒否）になる
        if (testCase1.result === null) {
            console.log("❌ [ABAC Result] Access Denied! (Expected behavior)");
            appendCsvLine(metricsPath, [Date.now(), "ReadIoTData", "userA", "false", "DENIED", testCase1.durationMs]);
        }

        // --- STEP 5: 閲覧者（userA）へブロックチェーン上で属性を付与 ---
        console.log(`\n[Scenario] Assigning [${requiredAttribute}] to UserA...`);
        await assignAttribute(registryContract, iotDevice, userA, requiredAttribute);
        console.log(`[Blockchain] Attribute [${requiredAttribute}] has been assigned to UserA.`);

        // --- STEP 6: 【属性あり】での再アクセス試行とパフォーマンス計測 ---
        console.log("\n[Scenario] UserA (With Attribute) attempts to access the data again...");
        
        const testCase2 = await measureMs(async () => {
            return await findIoTRecord(registryContract, accounts, did, cid, userA);
        });

        // 属性が付与されたので、今度はrequireを通過してデータ（CID）が取得できる
        if (testCase2.result !== null) {
            console.log("✅ [ABAC Result] Access Granted!");
            console.log(`[Success] Retrieved CID: ${testCase2.result.record.cid}`);
            appendCsvLine(metricsPath, [Date.now(), "ReadIoTData", "userA", "true", "GRANTED", testCase2.durationMs]);
        }

        console.log(`\n[Metrics] Performance log saved to: ${metricsPath}`);

    } catch (error) {
        console.error("Scenario Error:", error);
    } finally {
        // テスト用のダミーファイルを削除
        if (fs.existsSync(dummyFilePath)) {
            fs.unlinkSync(dummyFilePath);
        }
        console.log("--- ABAC Demonstration Scenario End ---");
    }
})();
