// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DIDRegistry {
    struct DIDDoc {
        string did;
        string doc;
    }

    struct IoTRecord {
        string did;
        string cid;
        string requiredAttribute; // ★ABAC追加：このデータに必要な属性（例: "A"）
    }

    mapping(address => DIDDoc[]) public didDocuments;
    mapping(address => IoTRecord[]) public iotData;

    // ★ABAC追加：ユーザー（アドレス）が何の属性を持っているかを記録するマップ
    mapping(address => mapping(string => bool)) public userAttributes;

    event DIDRegistered(address indexed owner, string did);
    event IoTDataRegistered(address indexed owner, string did, string cid);

    // --- DID Document登録 ---
    function registerDIDDocument(string memory did, string memory didDocumentJson) public {
        didDocuments[msg.sender].push(DIDDoc(did, didDocumentJson));
        emit DIDRegistered(msg.sender, did);
    }

    // --- IoTデータ(CID)登録 ---
    // ★ABAC変更：第3引数に「requiredAttribute」を追加しました
    function registerIoTData(string memory did, string memory cid, string memory requiredAttribute) public {
        iotData[msg.sender].push(IoTRecord(did, cid, requiredAttribute));
        emit IoTDataRegistered(msg.sender, did, cid);
    }

    // ★ABAC追加：検証用の属性付与関数（動きを確認するために、誰でも自分に属性を付与できるようにしています）
    function assignAttribute(address user, string memory attribute) public {
        userAttributes[user][attribute] = true;
    }

    // --- IoTデータ取得 ---
    // ★ABAC変更：関数を呼び出した人（msg.sender）の属性チェックを追加しました
    function getIoTData(address owner, uint256 index) public view returns(string memory did, string memory cid) {
        IoTRecord storage r = iotData[owner][index];
        
        // ★ABAC追加：データに要求属性が設定されている場合、msg.senderがそれを持っているか検証
        if (bytes(r.requiredAttribute).length > 0) {
            require(userAttributes[msg.sender][r.requiredAttribute] == true, "ABAC: Access Denied");
        }

        return (r.did, r.cid);
    }

    // DID Document件数取得
    function getDIDDocument(address owner, uint256 index) public view returns(string memory did, string memory doc) {
        DIDDoc storage d = didDocuments[owner][index];
        return (d.did, d.doc);
    }

    // DID Documentの件数取得
    function getDIDCount(address owner) public view returns(uint256) {
        return didDocuments[owner].length;
    }

    // IoTデータの件数取得
    function getIoTDataCount(address owner) public view returns(uint256) {
        return iotData[owner].length;
    }
}
