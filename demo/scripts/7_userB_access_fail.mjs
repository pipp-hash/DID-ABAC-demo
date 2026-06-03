import fs from "fs";
import { createWeb3, getAccounts, getRegistryContract, findIoTRecord } from "../../lib/registry.mjs";

(async () => {
  console.log("\n=======================================================");
  console.log("🔒 手順10: 何の属性も持たないユーザーBによるアクセス試行（完全防御）");
  console.log("=======================================================\n");

  const web3 = createWeb3();
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);
  const userB = accounts[3]; 
  
  const vcA = JSON.parse(fs.readFileSync("demo/output/vc_user_signed.json", "utf8"));
  const vcB = JSON.parse(fs.readFileSync("demo/output/vc_device_auth_B.json", "utf8"));
  
  // ✨ すべてのデータをVCからの自動引用形式に統一
  const cidA = vcA.claim.cid;
  const cidB = vcB.claim.cid;

  console.log(`[⚙️ 状況確認] ユーザーB (UserB): ${userB} ➔ 現在、保有属性は【なし】\n`);

  // --- テスト1 ---
  console.log("🔴 【テスト1】 ユーザーBが データA（要求属性: Attribute_A）にアクセス...");
  const resultA = await findIoTRecord(registry, accounts, vcA.subject, cidA, userB);
  if (!resultA) { console.log("  ❌ 【ABAC判定】: アクセス拒否 (Access Denied)\n"); }

  // --- テスト2 ---
  console.log("🔴 【テスト2】 ユーザーBが データB（要求属性: Attribute_B）にアクセス...");
  const resultB = await findIoTRecord(registry, accounts, vcB.subject, cidB, userB);
  if (!resultB) { console.log("  ❌ 【ABAC判定】: アクセス拒否 (Access Denied)\n"); }

  console.log("=======================================================");
})();
