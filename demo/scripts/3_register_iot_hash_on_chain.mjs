import fs from "fs";
import { createWeb3, getAccounts, getRegistryContract, registerIoTData } from "../../lib/registry.mjs";
import { register } from "module";

(async () => {
  console.log("\n==========================================");
  console.log("🟦 Step3: IoTデータ(CID) をブロックチェーンへ登録 (ABACポリシー付)");
  console.log("==========================================\n");

  const web3 = createWeb3();
  const accounts = await getAccounts(web3);
  const registry = await getRegistryContract(web3);

  const userA = accounts[0];
  console.log("[1] UserA の Ethereum アドレス:", userA, "\n");

  // --- CID 読み込み ---
  const cid = fs.readFileSync("demo/output/ipfs_cid.txt", "utf8").trim();

  console.log("[2] IPFS から取得した CID:");
  console.log(`    → ${cid}\n`);

  // --- DID 読み込み ---
  const didJson = fs.readFileSync("demo/output/userA_did.json", "utf8");
  const didA = JSON.parse(didJson).id;

  console.log("[3] UserA の DID:");
  console.log(`    → ${didA}\n`);

  // ★ABAC追加：このデータにアクセスするために必要な属性（ポリシー）を定義
  const requiredAttribute = "Attribute_A"; 
  console.log(`[ABAC Policy] 設定する要求属性: [${requiredAttribute}]\n`);

  console.log("[4] ブロックチェーンへ登録処理を送信中...\n");

  // --- ★変更：CID と一緒に要求属性（requiredAttribute）をチェーンへ登録 ---
  // 先ほどライブラリ側で第5引数として追加した requiredAttribute をここに渡します
  await registerIoTData(registry, userA, didA, cid, requiredAttribute);

  console.log("[5] 登録完了！");
  console.log(`    → IoTデータ (DID, CID) とアクセス条件 [${requiredAttribute}] をブロックチェーンに保存しました。\n`);

  console.log("==========================================");
  console.log("🎉 Step3 完了: IoT データ登録成功");
  console.log("==========================================\n");
})();
