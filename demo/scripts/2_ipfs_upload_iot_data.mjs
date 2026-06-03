import fs from "fs";
import { connectIPFS, uploadFile } from "../../lib/ipfs_client.mjs";

(async () => {
  console.log("\n==========================================");
  console.log("🟦 手順4: IoTデータAをIPFSへアップロード");
  console.log("==========================================\n");

  // --- IPFS 接続 ---
  console.log("[1] ローカル IPFS ノードへ接続しています...");
  const ipfs = connectIPFS();
  console.log("   → 接続成功\n");

  // --- アップロードするファイル読み込み ---
  const filePath = "demo/data/iot-data.json";
  const content = fs.readFileSync(filePath);

  console.log("[2] IoTデータファイルを読み込みました");
  console.log(` 対象ファイル： ${filePath}\n`);

  // --- IPFS アップロード ---
  console.log("[3] IPFS へデータをアップロード中...\n");

  const cid = await uploadFile(ipfs, filePath);

  // --- ✨【重要】データBと出力形式を完全に統一する修正 ---
  // テキストファイルではなく、CIDと中身のデータをセットにしたJSON形式で保存します
  const outputData = {
    cid: cid,
    data: JSON.parse(content.toString())
  };

  if (!fs.existsSync("demo/output")) { 
    fs.mkdirSync("demo/output", { recursive: true }); 
  }
  
  // 後続のプログラム（手順7のVC発行スクリプトなど）が「ipfs_iot_data.json」を読み込めるようにします
  fs.writeFileSync("demo/output/ipfs_iot_data.json", JSON.stringify(outputData, null, 2));

  console.log("[4] アップロード完了！");
  console.log(` →取得したIPFS CID: ${cid}\n`);

  console.log("==========================================");
  console.log("🎉 IPFS アップロード処理 完了");
  console.log("==========================================\n");
})();
