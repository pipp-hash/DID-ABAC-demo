import { createWeb3, getAccounts, getRegistryContract, assignAttribute } from "../../lib/registry.mjs";

(async () => {
  console.log("\n=======================================================");
  console.log("🔑 手順11: 条件を達成したユーザーBへの属性B発行");
  console.log("=======================================================\n");

  const web3 = createWeb3();
  const registry = await getRegistryContract(web3);
  const accounts = await getAccounts(web3);

  const company = accounts[0]; 
  const userB = accounts[3]; 
  const attribute = "Attribute_B"; 

  console.log(`[1] 属性発行元 (Company) : ${company}`);
  console.log(`[2] 動的付与対象 (UserB)   : ${userB}\n`);
  
  console.log(`➡️  ユーザーBが条件を達成したため、属性 [${attribute}] の書き込みを送信中...\n`);

  await assignAttribute(registry, company, userB, attribute);

  console.log(`  ✅ ユーザーB ➔ [${attribute}] 動的付与完了！`);
  console.log("=======================================================");
})();
