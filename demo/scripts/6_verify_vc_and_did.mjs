import fs from "fs";
import { createWeb3, getAccounts, getRegistryContract, findDIDDocument, findIoTRecord, assignAttribute } from "../../lib/registry.mjs";

(async () => {
  const web3 = createWeb3();

  // --- VCの読み込み ---
  const vc = JSON.parse(fs.readFileSync("demo/output/vc_user_signed.json", "utf8"));

  console.log("\n=====================================");
  console.log("Step6: Verifiable Credential(VC)の検証 (ABAC認可対応)");
  console.log("=======================================\n");

  // VC の内容を表示
  console.log("[1] 検証対象の VC:");
  console.log(JSON.stringify(vc, null, 2), "\n");

  // --- DID Registry 接続 ---
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);

  // 役割アカウントの設定 (テスト・デモ用)
  const company = accounts[0];  // 属性を発行できる信頼された機関 (Issuer)
  const userA = accounts[2];    // 今回アクセスを試みるユーザーA (閲覧要求者)

  const issuerDid = vc.issuer;
  const subjectDid = vc.subject;
  const cid = vc.claim.cid;

  // ============================================================
  // 1. Issuer DID の存在確認 + 内容一致チェック
  // ============================================================
  console.log("[2] Issuer の DID Document を検索...");
  
  const issuerResult = await findDIDDocument(registry, accounts, issuerDid);

  if (!issuerResult) {
    console.log("❌ Issuer DID がブロックチェーン上に存在しません:", issuerDid);
    return;
  }

  console.log("   ▶ 所有者アドレス:", issuerResult.owner);
  console.log("   ▶ DID Document:", issuerResult.document, "\n");

  // ============================================================
  // 2. Subject DID の存在+一致チェック
  // ============================================================
  console.log("[3] Subject(UserA) の DID Document を検索...");
  
  const subjectResult = await findDIDDocument(registry, accounts, subjectDid);

  if (!subjectResult) {
    console.log("❌ Subject DID がブロックチェーン上に存在しません:", subjectDid);
    return;
  }

  console.log("   ▶ 所有者アドレス:", subjectResult.owner);
  console.log("   ▶ DID Document:", subjectResult.document, "\n");

  // ============================================================
  // 3. IoT データ CID の存在+一致チェック (★ABAC検証の連動)
  // ============================================================
  console.log("[4] IoTデータの記録を検索 & 属性ベースアクセス制御(ABAC)を適用...");
  
  // --- 【ABACテスト 1】 属性を持っていない状態でデータアクセスを試みる ---
  console.log("\n   🔒 [Test 1] UserA (属性なし) がデータアクセスをリクエスト中...");
  
  // 第5引数にアクセス要求者である userA を渡してコントラクトで検証させます
  let iotResult = await findIoTRecord(registry, accounts, subjectDid, cid, userA);

  if (!iotResult) {
    console.log("   ❌ ABAC判定: アクセス拒否 (必要な属性を持っていません) [期待通りの挙動]");
  }

  // --- デモ用の属性付与処理 ---
  const requiredAttribute = "Attribute_A"; // Step3で設定した要求属性
  console.log(`\n   🔑 [ABAC Provision] ユーザーAにブロックチェーン上で属性 [${requiredAttribute}] を付与します...`);
  await assignAttribute(registry, company, userA, requiredAttribute);
  console.log(`   → 属性 [${requiredAttribute}] の付与が完了しました。`);

  // --- 【ABACテスト 2】 属性を持った状態で再度データアクセスを試みる ---
  console.log("\n   🔓 [Test 2] UserA (属性あり) が再アクセスをリクエスト中...");
  iotResult = await findIoTRecord(registry, accounts, subjectDid, cid, userA);

  if (!iotResult) {
    console.log("   ❌ IoTデータ (DID, CID) がブロックチェーンに存在しないか、再度拒否されました。");
    return;
  }

  console.log("   ✅ ABAC判定: アクセス許可！ ブロックチェーンでの属性確認に成功しました。");
  console.log("   ▶ 閲覧を許可された DID:", iotResult.record.did);
  console.log("   ▶ 取得した IPFS CID  :", iotResult.record.cid, "\n");

  // ============================================================
  // 4. Issuer の署名検証 (既存のまま)
  // ============================================================
  console.log("[5] Issuer の署名を検証中...");

  const issuerRecovered = web3.eth.accounts.recover(vc.proof.hash, vc.proof.signature);

  console.log("   ▶ recover結果:", issuerRecovered);
  console.log("   ▶ 登録Issuerアドレス     :", issuerResult.owner);

  if (issuerRecovered.toLowerCase() === issuerResult.owner.toLowerCase()) {
    console.log("   ✅ Issuer の署名は正しい\n");
  } else {
    console.log("   ❌ Issuer の署名が不正です\n");
  }

  // ============================================================
  // 5. UserA の署名検証 (既存のまま)
  // ============================================================
  console.log("[6] UserA の署名を検証中...");

  const userRecovered = web3.eth.accounts.recover(vc.userProof.hash, vc.userProof.signature);

  console.log("   ▶ recover結果:", userRecovered);
  console.log("   ▶ UserAアドレス", subjectResult.owner);

  if (userRecovered.toLowerCase() === subjectResult.owner.toLowerCase()) {
    console.log("   ✅ UserA の署名は正しい\n");
  } else {
    console.log("   ❌ UserA の署名が不正です\n");
  }

  console.log("===============================");
  console.log("Step6 完了: VC検証およびABAC処理が正常に終了しました");
  console.log("===============================\n");
})();
