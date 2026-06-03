import fs from "fs";
import { createWeb3, getAccounts, getRegistryContract, findDIDDocument, findIoTRecord, assignAttribute } from "../../lib/registry.mjs";

(async () => {
  const web3 = createWeb3();

  // --- VCの読み込み ---
  const vc = JSON.parse(fs.readFileSync("demo/output/vc_user_signed.json", "utf8"));

  console.log("\n=====================================");
  console.log("Step6: Verifiable Credential(VC)の検証 (ABAC動的付与実証対応)");
  console.log("=======================================\n");

  // --- DID Registry 接続 ---
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);

  // 役割アカウントの設定
  const company = accounts[0];  // 属性を発行できる信頼された機関 (Issuer)
  const userA = accounts[2];    // 最初から属性をもらうユーザーA
  const userB = accounts[3];    // 後から条件付きで属性をもらうユーザーB

  const issuerDid = vc.issuer;
  const subjectDid = vc.subject;
  const cid = vc.claim.cid;

  // 事前チェック (DID Documentの存在確認)
  const issuerResult = await findDIDDocument(registry, accounts, issuerDid);
  const subjectResult = await findDIDDocument(registry, accounts, subjectDid);
  if (!issuerResult || !subjectResult) {
    console.log("❌ DIDの事前検証に失敗しました。");
    return;
  }

  const requiredAttribute = "Attribute_A"; // 要求される属性

  // ============================================================
  // [ABAC実証フェーズ]
  // ============================================================
  console.log("[4] 属性ベースアクセス制御(ABAC)の動的制御の実証を開始...");

  // ------------------------------------------------------------
  // ① 初期状態の権限付与（UserAのみに属性を付与）
  // ------------------------------------------------------------
  console.log(`\n   🔑 [ABAC Provision 1] ユーザーAに属性 [${requiredAttribute}] を付与します...`);
  await assignAttribute(registry, company, userA, requiredAttribute);
  console.log(`   → ユーザーAへの初期属性付与が完了しました。(※UserBはこの時点では属性なし)`);

  // ------------------------------------------------------------
  // ② UserA と UserB の同時アクセス試行
  // ------------------------------------------------------------
  console.log("\n   🔒 [Test 1] ユーザーA と ユーザーB が同時にデータアクセスをリクエスト...");
  
  // UserAのアクセス
  let iotResultA = await findIoTRecord(registry, accounts, subjectDid, cid, userA);
  if (iotResultA) {
    console.log("   ✅ UserA ➔ アクセス許可！ (正しい属性を保有しているため)");
  }

  // UserBのアクセス（この時点では弾かれる）
  let iotResultB = await findIoTRecord(registry, accounts, subjectDid, cid, userB);
  if (!iotResultB) {
    console.log("   ❌ UserB ➔ アクセス拒否！ (必要な属性を持っていません) [期待通りの防御]");
  }

  // ------------------------------------------------------------
  // ③ 条件達成による UserB への動的な属性付与（追加リクエスト）
  // ------------------------------------------------------------
  console.log(`\n   🔔 [Condition Met] ユーザーBがアクセス条件を達成したため、後から属性 [${requiredAttribute}] を付与します...`);
  
  // ブロックチェーンにUserBの属性を書き込む
  await assignAttribute(registry, company, userB, requiredAttribute);
  console.log(`   🔑 [ABAC Provision 2] ユーザーBへ属性 [${requiredAttribute}] の動的付与が完了しました。`);

  // ------------------------------------------------------------
  // ④ 属性付与後の UserB の再アクセス試行
  // ------------------------------------------------------------
  console.log("\n   🔓 [Test 2] ユーザーB がデータアクセスを再リクエスト中...");
  
  // 再度UserBのアドレスからアクセスを試みる
  iotResultB = await findIoTRecord(registry, accounts, subjectDid, cid, userB);

  if (iotResultB) {
    console.log("   ✅ UserB ➔ アクセス許可！ 後から付与された属性がブロックチェーン上で正しく認識されました。");
    console.log("   ▶ [Success] UserB が取得した IPFS CID:", iotResultB.record.cid);
  } else {
    console.log("   ❌ UserB ➔ 再度拒否されました。設定を確認してください。");
  }

  console.log("\n===============================");
  console.log("Step6 完了: 属性を持たない状態からの『動的な属性付与・アクセス成功』まで実証を完了しました");
  console.log("===============================\n");
})();
