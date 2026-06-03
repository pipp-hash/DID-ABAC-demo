import fs from "fs";
import { createWeb3, getAccounts } from "../../lib/registry.mjs";
import { signWithPrivateKey } from "../../lib/crypto.mjs";

(async () => {
  console.log("\n==========================================");
  console.log("🏢 手順7b: 企業によるデータB用の VC 発行");
  console.log("==========================================\n");

  const web3 = createWeb3();
  const accounts = await getAccounts(web3);
  const company = accounts[0]; // 発行体(企業)

  // 手順6で生成したIPFSデータBの出力をロード
  const ipfsDataB = JSON.parse(fs.readFileSync("demo/output/ipfs_iot_data_B.json", "utf8"));

  const vcB = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "IoTDeviceCredential"],
    "issuer": "did:example:company",
    "subject": "did:example:userB_data",
    "claim": {
      "deviceId": ipfsDataB.data.deviceId,
      "cid": ipfsDataB.cid // 手順6の出力をスマートに自動引用
    }
  };

  console.log("[1] データB用の VC を作成中...");
  const { signature, messageHash } = await signWithPrivateKey(company, vcB);

  vcB.proof = {
    type: "EcdsaSecp256k1",
    created: new Date().toISOString(),
    verificationMethod: "did:example:company#key-1",
    hash: messageHash,
    signature: signature
  };

  fs.writeFileSync("demo/output/vc_device_auth_B.json", JSON.stringify(vcB, null, 2));
  console.log("\n✅ 【データB用の企業署名付きVCが発行されました】");
  console.log("==========================================");
})();
