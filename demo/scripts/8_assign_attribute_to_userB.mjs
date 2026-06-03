import { createWeb3, getAccounts, getRegistryContract, assignAttribute } from "../../lib/registry.mjs";

(async () => {
  console.log("\n=========================================");
  console.log("🔑 ユーザーBへの属性 [Attribute_A] 動的付与");
  console.log("=========================================\n");

  const web3 = createWeb3();
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);

  const company = accounts[0]; // 属性を発行できる権限を持つ企業
  const userB = accounts[3];   // 属性を付与されるユーザーB

  const attribute = "Attribute_A";

  console.log(`[1] 属性発行元 (Company) : ${company}`);
  console.log(`[2] 属性付与対象 (UserB)   : ${userB}\n`);
  console.log(`[3] ブロックチェーンへ属性 [${attribute}] の書き込みを送信中...\n`);

  // ブロックチェーン上のuserBのステータスを更新
  await assignAttribute(registry, company, userB, attribute);

  console.log("✅ 【属性付与完了】");
  console.log(`  → ユーザーBはブロックチェーン上で正式に [${attribute}] を保有しました。\n`);
  console.log("=========================================");
})();
