import fs from "fs";
import { createWeb3, getAccounts, getRegistryContract, registerIoTRecord } from "../../lib/registry.mjs";

(async () => {
  console.log("\n=======================================================");
  console.log("📝 手順6: IoTデータAの登録 (要求属性: Attribute_A)");
  console.log("=======================================================\n");

  const web3 = createWeb3();
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);
  
  // 企業(accounts[0])がデータ登録者としてポリシーを設定
  const company = accounts[0]; 

  // 手順7で企業が発行したVC（vc_device_auth.json）からスマートに自動引用
  console.log("[1] 企業が発行したデータA用の VC を読み込み中...");
  const vcA = JSON.parse(fs.readFileSync("demo/output/vc_device_auth.json", "utf8"));
  
  const subjectDidA = vcA.subject; // "did:example:userA_data"
  const cidA = vcA.claim.cid;      // IPFSのCID
  const requiredAttribute = "Attribute_A"; 

  console.log(`   ▶ 抽出した DID : ${subjectDidA}`);
  console.log(`   ▶ 抽出した CID : ${cidA}\n`);

  console.log("➡️  データAのポリシーをブロックチェーンに書き込み中...");
  await registerIoTRecord(registry, company, subjectDidA, cidA, requiredAttribute);

  console.log("\n✅ 【データA登録完了】");
  console.log(`  → ブロックチェーン上に [${requiredAttribute}] でロックされたデータAが追加されました。\n`);
  console.log("=======================================================");
})();
