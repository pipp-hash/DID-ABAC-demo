import fs from "fs";
import { createWeb3, getAccounts, getRegistryContract, findIoTRecord } from "../../lib/registry.mjs";

(async () => {
  const web3 = createWeb3();
  const vc = JSON.parse(fs.readFileSync("demo/output/vc_user_signed.json", "utf8"));

  console.log("\n=======================================================");
  console.log("🟦 手順9: 特権ユーザーAによる両データへのアクセス確認（事前付与済み）");
  console.log("=======================================================\n");

  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);
  const userA = accounts[2];   

  const subjectDidA = vc.subject;
  const subjectDidB = "did:example:userB_data";
  const cidA = vc.claim.cid;
  const cidB = "QmNewDataB_SensorPayload7777777777777777777";

  console.log(`[⚙️ 状況確認] ユーザーA (UserA): ${userA} ➔ 手順3時点で特権（A・B）付与済み\n`);

  // --- 検証1 ---
  console.log("🔵 【検証1】 ユーザーAが データA（要求属性: Attribute_A）にアクセス...");
  const resultA = await findIoTRecord(registry, accounts, subjectDidA, cidA, userA);
  if (resultA) { console.log(`  ✅ 【ABAC判定】: アクセス許可！ ➔ CID: ${resultA.record.cid}\n`); }

  // --- 検証2 ---
  console.log("🔵 【検証2】 ユーザーAが 新データB（要求属性: Attribute_B）にアクセス...");
  const resultB = await findIoTRecord(registry, accounts, subjectDidB, cidB, userA);
  if (resultB) { console.log(`  ✅ 【ABAC判定】: アクセス許可！ ➔ CID: ${resultB.record.cid}\n`); }

  console.log("=======================================================");
})();
