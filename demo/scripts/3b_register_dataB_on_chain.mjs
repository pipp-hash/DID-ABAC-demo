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

  // IPFSの出力ファイルからCIDを引用
  const ipfsDataB = JSON.parse(fs.readFileSync("demo/output/ipfs_iot_data_B.json", "utf8"));
  const cidB = ipfsDataB.cid;
  const requiredAttribute = "Attribute_B"; 

  console.log("➡️  データBのポリシーをブロックチェーンに書き込み中...");
  await registerIoTRecord(registry, userA, "did:example:userB_data", cidB, requiredAttribute);

  console.log("\n✅ 【データB登録完了】");
  console.log(`  → ブロックチェーン上に [${requiredAttribute}] でロックされたデータBが追加されました。\n`);
  console.log("=======================================================");
})();
