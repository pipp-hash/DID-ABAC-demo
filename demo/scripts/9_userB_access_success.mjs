import { createWeb3, getAccounts, getRegistryContract, findIoTRecord } from "../../lib/registry.mjs";
import fs from "fs";

(async () => {
  console.log("\n=========================================");
  console.log("🔓 属性を手に入れたユーザーBの再アクセス");
  console.log("=========================================\n");

  const web3 = createWeb3();
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);

  const userB = accounts[3]; // 属性を手に入れたユーザーB
  console.log("[1] 閲覧要求者(UserB) のアドレス:", userB);

  // 既存のVCからDIDとCIDを読み込む
  const vc = JSON.parse(fs.readFileSync("demo/output/vc_user_signed.json", "utf8"));
  const subjectDid = vc.subject;
  const cid = vc.claim.cid;

  console.log("\n[2] ブロックチェーン(ABAC)へデータ閲覧を再要求中...\n");

  // 再度UserBのアドレスでアクセスを試みる
  const result = await findIoTRecord(registry, accounts, subjectDid, cid, userB);

  if (result) {
    console.log("✅ 【ABAC判定】: アクセス許可！ (Access Granted)");
    console.log("  → 理由: 後から付与された属性がブロックチェーン上で正しく検証されました。");
    console.log(`  → [成功] 取得した IPFS CID: ${result.record.cid}\n`);
  } else {
    console.log("❌ 失敗: 属性があるにもかかわらず拒否されました。設定を確認してください。");
  }
  console.log("=========================================");
})();
