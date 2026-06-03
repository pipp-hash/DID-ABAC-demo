import { createWeb3, getAccounts, getRegistryContract, findIoTRecord } from "../../lib/registry.mjs";
import fs from "fs";

(async () => {
  console.log("\n=========================================");
  console.log("🔒 ユーザーB (属性なし) のアクセス試行");
  console.log("=========================================\n");

  const web3 = createWeb3();
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);

  const userB = accounts[3]; // 属性を持たない一般ユーザーB
  console.log("[1] 閲覧要求者(UserB) のアドレス:", userB);

  // 既存のVCからDIDとCIDを読み込む
  const vc = JSON.parse(fs.readFileSync("demo/output/vc_user_signed.json", "utf8"));
  const subjectDid = vc.subject;
  const cid = vc.claim.cid;

  console.log("[2] アクセス対象のデータ (IPFS CID):", cid);
  console.log("\n[3] ブロックチェーン(ABAC)へデータ閲覧を要求中...\n");

  // UserBのアドレスでアクセスを試みる
  const result = await findIoTRecord(registry, accounts, subjectDid, cid, userB);

  if (!result) {
    console.log("❌ 【ABAC判定】: アクセス拒否 (Access Denied)");
    console.log("  → 理由: ユーザーBは必要な属性 [Attribute_A] を持っていません。");
    console.log("  → ブロックチェーンの門番によって、IPFSのデータアクセスが完全に防御されました。\n");
  } else {
    console.log("⚠️ 警告: 属性がないのにアクセスが許可されてしまいました。");
  }
  console.log("=========================================");
})();
