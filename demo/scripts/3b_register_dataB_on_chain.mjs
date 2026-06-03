import fs from "fs";
import { createWeb3, getAccounts, getRegistryContract, registerIoTRecord } from "../../lib/registry.mjs";

(async () => {
  console.log("\n=======================================================");
  console.log("📝 手順8: 新しいIoTデータBの登録 (要求属性: Attribute_B)");
  console.log("=======================================================\n");

  const web3 = createWeb3();
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);
  const userA = accounts[2]; 

  // ✨ データAと完全に同一形式！企業の発行したVCファイルからスマートに自動引用します
  console.log("[1] 企業が発行したデータB用の VC を読み込み中...");
  const vcB = JSON.parse(fs.readFileSync("demo/output/vc_device_auth_B.json", "utf8"));
  
  const subjectDidB = vcB.subject; // VCから自動引用 ("did:example:userB_data")
  const cidB = vcB.claim.cid;      // VCから自動引用 ("QmNewDataB_...")
  const requiredAttribute = "Attribute_B"; 

  console.log(`   ▶ 抽出した DID : ${subjectDidB}`);
  console.log(`   ▶ 抽出した CID : ${cidB}\n`);

  console.log("➡️  データBのポリシーをブロックチェーンに書き込み中...");
  await registerIoTRecord(registry, userA, subjectDidB, cidB, requiredAttribute);

  console.log("\n✅ 【データB登録完了】");
  console.log(`  → ブロックチェーン上に [${requiredAttribute}] でロックされたデータBが追加されました。\n`);
  console.log("=======================================================");
})();
