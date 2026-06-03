import fs from "fs";
import { createWeb3, getAccounts, getRegistryContract, registerIoTRecord } from "../../lib/registry.mjs";

(async () => {
  console.log("\n=======================================================");
  console.log("📝 手順3: IoTデータAのオンチェーンポリシー登録");
  console.log("=======================================================\n");

  const web3 = createWeb3();
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);
  
  // 企業(accounts[0])がデータ登録者としてポリシーを設定
  const company = accounts[0]; 

  // 手送りのテキストではなく、手順2の出力（ipfs_iot_data.json）からスマートに自動引用
  console.log("[1] 企業が発行したデータA用の情報を読み込み中...");
  const ipfsDataA = JSON.parse(fs.readFileSync("demo/output/ipfs_iot_data.json", "utf8"));
  
  const subjectDidA = "did:example:userA_data";
  const cidA = ipfsDataA.cid; // ファイルから自動引用
  const requiredAttribute = "Attribute_A"; 

  console.log(`   ▶ 抽出した DID : ${subjectDidA}`);
  console.log(`   ▶ 抽出した CID : ${cidA}\n`);

  console.log("➡️  データAのポリシーをブロックチェーンに書き込み中...");
  await registerIoTRecord(registry, company, subjectDidA, cidA, requiredAttribute);

  console.log("\n✅ 【データA登録完了】");
  console.log(`  → ブロックチェーン上に [${requiredAttribute}] でロックされたデータAが追加されました。\n`);
  console.log("=======================================================");
})();
