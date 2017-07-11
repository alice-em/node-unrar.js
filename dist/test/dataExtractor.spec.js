"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var fs = require("fs");
var unrar = require("../index");
function getExtractor(fileName, password) {
    var buf = fs.readFileSync("./testFiles/" + fileName);
    var arrBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    return unrar.createExtractorFromData(arrBuf, password);
}
describe("Data Test", function () {
    it("Archive Comment", function () {
        var extractor = getExtractor("WithComment.rar");
        var _a = extractor.getFileList(), state = _a[0], list = _a[1];
        assert.deepStrictEqual(state, {
            state: "SUCCESS",
        });
        assert.deepStrictEqual(list, {
            arcHeader: {
                comment: "Test Comments for rar files.\r\n\r\n测试一下中文注释。\r\n日本語のコメントもテストしていまし。",
                flags: {
                    authInfo: false,
                    headerEncrypted: false,
                    lock: false,
                    recoveryRecord: false,
                    solid: false,
                    volume: false,
                },
            }, fileHeaders: [
                {
                    crc: 0,
                    flags: {
                        directory: false,
                        encrypted: false,
                        solid: false,
                    },
                    method: "Storing",
                    name: "1File.txt",
                    packSize: 0,
                    time: "2017-04-03T10:41:42.000",
                    unpSize: 0,
                    unpVer: "2.9",
                },
                {
                    crc: 0,
                    flags: {
                        directory: false,
                        encrypted: false,
                        solid: false,
                    },
                    method: "Storing",
                    name: "2中文.txt",
                    packSize: 0,
                    time: "2017-04-03T10:41:52.000",
                    unpSize: 0,
                    unpVer: "2.9",
                },
            ],
        });
    });
    it("Header encryption", function () {
        var extractor = getExtractor("HeaderEnc1234.rar");
        var _a = extractor.getFileList(), state = _a[0], list = _a[1];
        assert.equal(state.state, "FAIL");
        assert.equal(state.reason, "ERAR_MISSING_PASSWORD");
        assert.equal(list, null);
    });
    it("File encrypted with different passwords", function () {
        var extractor = getExtractor("FileEncByName.rar");
        var _a = extractor.getFileList(), state = _a[0], list = _a[1];
        assert.deepStrictEqual(state, {
            state: "SUCCESS",
        });
        assert.deepStrictEqual(list, {
            arcHeader: {
                comment: "",
                flags: {
                    authInfo: false,
                    headerEncrypted: false,
                    lock: false,
                    recoveryRecord: false,
                    solid: false,
                    volume: false,
                },
            }, fileHeaders: [
                {
                    crc: 1468669977,
                    flags: {
                        directory: false,
                        encrypted: false,
                        solid: false,
                    },
                    method: "Storing",
                    name: "1File.txt",
                    packSize: 5,
                    time: "2017-04-03T20:08:44.000",
                    unpSize: 5,
                    unpVer: "2.9",
                }, {
                    name: "2中文.txt",
                    flags: {
                        encrypted: true,
                        solid: false,
                        directory: false,
                    },
                    packSize: 32,
                    unpSize: 15,
                    crc: 2631402331,
                    time: "2017-04-03T20:09:18.000",
                    unpVer: "2.9",
                    method: "Normal",
                }, {
                    name: "3Sec.txt",
                    flags: {
                        encrypted: true,
                        solid: false,
                        directory: false,
                    },
                    packSize: 16,
                    unpSize: 5,
                    crc: 762090570,
                    time: "2017-04-03T19:58:42.000",
                    unpVer: "2.9",
                    method: "Normal",
                },
            ],
        });
    });
    it("Header encryption with password", function () {
        var extractor = getExtractor("HeaderEnc1234.rar", "1234");
        var _a = extractor.getFileList(), state = _a[0], list = _a[1];
        assert.deepStrictEqual(state, {
            state: "SUCCESS",
        });
        assert.deepStrictEqual(list, {
            arcHeader: {
                comment: "Hello, world",
                flags: {
                    authInfo: false,
                    headerEncrypted: true,
                    lock: false,
                    recoveryRecord: false,
                    solid: false,
                    volume: false,
                },
            }, fileHeaders: [
                {
                    crc: 2631402331,
                    flags: {
                        directory: false,
                        encrypted: true,
                        solid: false,
                    },
                    method: "Normal",
                    name: "2中文.txt",
                    packSize: 32,
                    time: "2017-04-03T20:09:18.000",
                    unpSize: 15,
                    unpVer: "2.9",
                },
                {
                    crc: 1468669977,
                    flags: {
                        directory: false,
                        encrypted: true,
                        solid: false,
                    },
                    method: "Normal",
                    name: "1File.txt",
                    packSize: 32,
                    time: "2017-04-03T20:08:44.000",
                    unpSize: 5,
                    unpVer: "2.9",
                },
            ],
        });
    });
    it("Extract Header encryption file", function () {
        var extractor = getExtractor("HeaderEnc1234.rar", "1234");
        var _a = extractor.extractAll(), state = _a[0], list = _a[1];
        assert.deepStrictEqual(state, {
            state: "SUCCESS",
        });
        assert.notDeepEqual(list, null);
        assert.deepStrictEqual(list.files[0].fileHeader, {
            name: "2中文.txt",
            flags: {
                encrypted: true,
                solid: false,
                directory: false,
            },
            packSize: 32,
            unpSize: 15,
            crc: 2631402331,
            time: "2017-04-03T20:09:18.000",
            unpVer: "2.9",
            method: "Normal",
        });
        assert.deepStrictEqual(list.files[1].fileHeader, {
            name: "1File.txt",
            flags: {
                encrypted: true,
                solid: false,
                directory: false,
            },
            packSize: 32,
            unpSize: 5,
            crc: 1468669977,
            time: "2017-04-03T20:08:44.000",
            unpVer: "2.9",
            method: "Normal",
        });
        assert.deepStrictEqual(list.files[0].extract[0], { state: "SUCCESS" });
        assert.equal(new Buffer(list.files[0].extract[1].subarray(0, 3)).toString("hex"), "efbbbf");
        assert.equal(new Buffer(list.files[0].extract[1].subarray(3)).toString("utf-8"), "中文中文");
        assert.equal(new Buffer(list.files[1].extract[1]).toString("utf-8"), "1File");
    });
    it("Extract File encrypted with different passwords (no password)", function () {
        var extractor = getExtractor("FileEncByName.rar");
        var _a = extractor.extractAll(), state = _a[0], list = _a[1];
        assert.deepStrictEqual(state, { state: "SUCCESS" });
        assert.deepStrictEqual(list.files[0].extract[0], { state: "SUCCESS" });
        assert.deepStrictEqual(new Buffer(list.files[0].extract[1]).toString("utf8"), "1File");
        assert.deepStrictEqual(list.files[1].extract[1], null);
        assert.deepStrictEqual(list.files[1].extract[0], {
            msg: "Password for encrypted file or header is not specified",
            reason: "ERAR_MISSING_PASSWORD",
            state: "FAIL",
        });
        assert.deepStrictEqual(list.files[2].extract[1], null);
        assert.deepStrictEqual(list.files[2].extract[0], {
            msg: "Password for encrypted file or header is not specified",
            reason: "ERAR_MISSING_PASSWORD",
            state: "FAIL",
        });
    });
    it("Extract File encrypted with different passwords (one password)", function () {
        var extractor = getExtractor("FileEncByName.rar", "3Sec");
        var _a = extractor.extractAll(), state = _a[0], list = _a[1];
        assert.deepStrictEqual(state, { state: "SUCCESS" });
        assert.deepStrictEqual(list.files[0].extract[0], { state: "SUCCESS" });
        assert.deepStrictEqual(new Buffer(list.files[0].extract[1]).toString("utf8"), "1File");
        assert.deepStrictEqual(list.files[1].extract[1], null);
        assert.deepStrictEqual(list.files[1].extract[0], {
            state: "FAIL",
            reason: "ERAR_BAD_DATA",
            msg: "Archive header or data are damaged",
        });
        assert.deepStrictEqual(list.files[2].extract[0], { state: "SUCCESS" });
        assert.deepStrictEqual(new Buffer(list.files[2].extract[1]).toString("utf8"), "3Secc");
    });
    it("Extract File encrypted with different passwords (multiple passwords)", function () {
        var extractor = getExtractor("FileEncByName.rar", "1234");
        var _a = extractor.extractFiles(["2中文.txt", "1File.txt"], "2中文"), state = _a[0], list = _a[1];
        assert.deepStrictEqual(state, { state: "SUCCESS" });
        assert.deepStrictEqual(list.files.length, 2);
        assert.deepStrictEqual(list.files[0].extract[0], { state: "SUCCESS" });
        assert.equal(new Buffer(list.files[0].extract[1].subarray(0, 3)).toString("hex"), "efbbbf");
        assert.equal(new Buffer(list.files[0].extract[1].subarray(3)).toString("utf-8"), "中文中文");
        assert.deepStrictEqual(list.files[1].extract[0], { state: "SUCCESS" });
        assert.equal(new Buffer(list.files[1].extract[1]).toString("utf-8"), "1File");
        _b = extractor.extractFiles(["3Sec.txt", "haha.txt"], "3Sec"), state = _b[0], list = _b[1];
        assert.deepStrictEqual(list.files[0].extract[0], { state: "SUCCESS" });
        assert.equal(new Buffer(list.files[0].extract[1]).toString("utf-8"), "3Secc");
        assert.deepStrictEqual(list.files[1], null);
        var _b;
    });
    it("Extract File with folders", function () {
        var extractor = getExtractor("FolderTest.rar");
        var _a = extractor.extractAll(), state = _a[0], list = _a[1];
        assert.deepStrictEqual(state, { state: "SUCCESS" });
        assert.deepStrictEqual(list.files[0].fileHeader.name, "Folder1/Folder Space/long.txt");
        assert.deepStrictEqual(list.files[1].fileHeader.name, "Folder1/Folder 中文/2中文.txt");
        assert.deepStrictEqual(list.files[2].fileHeader.name, "Folder1/Folder Space");
        assert.deepStrictEqual(list.files[3].fileHeader.name, "Folder1/Folder 中文");
        assert.deepStrictEqual(list.files[4].fileHeader.name, "Folder1");
        var long = "", i = 0;
        while (long.length < 1024 * 1024) {
            long += "1" + "0".repeat(i++);
        }
        assert.equal(new Buffer(list.files[0].extract[1]).toString("utf-8"), long);
        assert.equal(new Buffer(list.files[1].extract[1].subarray(3)).toString("utf-8"), "中文中文");
    });
});
