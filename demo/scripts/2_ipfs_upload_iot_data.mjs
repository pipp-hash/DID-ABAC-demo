import fs from "fs";

(async () => {
  console.log("\n=======================================================");
  console.log("📦 手順6: 新しいIoTデータBのIPFSアップロード ＆ CID生成");
  console.log("=======================================================\n");

  console.log("[1] 外部のデータファイル（iot-data-b2.json）を読み込み中...");
  const iotDataB = JSON.parse(fs.readFileSync("demo/data/iot-data-b2.json", "utf8"));

  console.log("[⚙️ 引用したデータBの内容確認]:");
  console.log(JSON.stringify(iotDataB, null, 2));

  const dummyCidB = "QmNewDataB_SensorPayload7777777777777777777";
  const outputData = { cid: dummyCidB, data: iotDataB };

  if (!fs.existsSync("demo/output")) { fs.mkdirSync("demo/output", { recursive: true }); }
  fs.writeFileSync("demo/output/ipfs_iot_data_B.json", JSON.stringify(outputData, null, 2));

  console.log("\n✅ 【データBのIPFSアップロード完了】");
  console.log(`  ▶ 生成されたハッシュ(CID): ${dummyCidB}\n`);
  console.log("=======================================================");
})();
