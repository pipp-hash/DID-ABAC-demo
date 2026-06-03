import fs from "fs";
import { createWeb3, getAccounts, getRegistryContract, findIoTRecord } from "../../lib/registry.mjs";

(async () => {
  console.log("\n=======================================================");
  console.log("🔓 手順12: 属性Bを獲得したユーザーBの検証（アクセス権の分離）");
  console.log("=======================================================\n");

  const web3 = createWeb3();
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);
  const userB = accounts[3]; 
  
  const vcA = JSON.parse(fs.readFileSync("demo/output/vc_user_signed.json", "utf8"));
  const vcB = JSON.parse(fs.readFileSync("demo/output/vc_device_auth_B.json", "utf8"));
  
  // ✨ すべてのデータをVCからの自動引用形式に完全に統一
  const cidA = vcA.claim.cid;
  const cidB = vcB.claim.cid;

  console.log(`[⚙️ 状況確認] ユーザーB (UserB): ${userB} ➔ 現在、[Attribute_B] のみを保有\n`);

  // --- テスト1（弾かれる） ---
  console.log("🔴 【再検証1】 属性Bを持つユーザーBが、データA（要求属性: Attribute_A）にアクセス...");
  const resultA = await findIoTRecord(registry, accounts, vcA.subject, cidA, userB);
  if (!resultA) { console.log("  ❌ 【ABAC判定】: アクセス拒否！ (属性Aがないため堅牢にガード)\n"); }

  // --- テスト2（成功する） ---
  console.log("🔵 【再検証2】 属性Bを持つユーザーBが、データB（要求属性: Attribute_B）にアクセス...");
  const resultB = await findIoTRecord(registry, accounts, vcB.subject, cidB, userB);
  if (resultB) { console.log(`  ✅ 【ABAC判定】: アクセス許可！ ➔ 取得したデータBの CID: ${resultB.record.cid}\n`); }

  console.log("=======================================================");
})();
