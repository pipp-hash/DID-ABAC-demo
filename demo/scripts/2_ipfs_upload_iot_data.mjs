const DIDRegistry = artifacts.require("DIDRegistry");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(DIDRegistry);
  const registry = await DIDRegistry.deployed();

  console.log("\n=======================================================");
  console.log("🚀 Truffle Migration: コントラクトデプロイ ＆ 初期特権設定");
  console.log("=======================================================\n");

  const company = accounts[0]; 
  const userA = accounts[2];   

  console.log(`  ▶ 特権ユーザーA (UserA) の初期設定を開始: ${userA}`);

  // デプロイ直後に、ユーザーAへ最初から2つの属性を自動付与
  await registry.assignAttribute(userA, "Attribute_A", { from: company });
  await registry.assignAttribute(userA, "Attribute_B", { from: company });

  console.log("\n  ✅ 【初期特権セットアップ完了】");
  console.log("    → ユーザーAは最初からマルチ属性(A・B)を持つ特権状態として起動しました。");
  console.log("=======================================================\n");
};
