"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extractorCurrent_1 = require("./extractorCurrent");
var unrar = require("./unrar");
var ERROR_CODE = {
    0: "ERAR_SUCCESS",
    10: "ERAR_END_ARCHIVE",
    11: "ERAR_NO_MEMORY",
    12: "ERAR_BAD_DATA",
    13: "ERAR_BAD_ARCHIVE",
    14: "ERAR_UNKNOWN_FORMAT",
    15: "ERAR_EOPEN",
    16: "ERAR_ECREATE",
    17: "ERAR_ECLOSE",
    18: "ERAR_EREAD",
    19: "ERAR_EWRITE",
    20: "ERAR_SMALL_BUF",
    21: "ERAR_UNKNOWN",
    22: "ERAR_MISSING_PASSWORD",
    23: "ERAR_EREFERENCE",
    24: "ERAR_BAD_PASSWORD",
};
var ERROR_MSG = {
    0: "Success",
    11: "Not enough memory",
    12: "Archive header or data are damaged",
    13: "File is not RAR archive",
    14: "Unknown archive format",
    15: "File open error",
    16: "File create error",
    17: "File close error",
    18: "File read error",
    19: "File write error",
    20: "Buffer for archive comment is too small, comment truncated",
    21: "Unknown error",
    22: "Password for encrypted file or header is not specified",
    23: "Cannot open file source for reference record",
    24: "Wrong password is specified",
};
var Extractor = (function () {
    function Extractor(password) {
        if (password === void 0) { password = ""; }
        this._password = password;
        this._archive = null;
    }
    Extractor.prototype.getFileList = function () {
        var ret;
        var _a = this.openArc(true), state = _a[0], arcHeader = _a[1];
        if (state.state !== "SUCCESS") {
            ret = [state, null];
        }
        else {
            var fileState = void 0, arcFile = void 0;
            var fileHeaders = [];
            while (true) {
                _b = this.processNextFile(function () { return true; }), fileState = _b[0], arcFile = _b[1];
                if (fileState.state !== "SUCCESS") {
                    break;
                }
                fileHeaders.push(arcFile.fileHeader);
            }
            if (fileState.reason !== "ERAR_END_ARCHIVE") {
                ret = [fileState, null];
            }
            else {
                ret = [{
                        state: "SUCCESS",
                    }, {
                        arcHeader: arcHeader,
                        fileHeaders: fileHeaders,
                    }];
            }
        }
        this.closeArc();
        return ret;
        var _b;
    };
    Extractor.prototype.extractAll = function () {
        var ret;
        var _a = this.openArc(false), state = _a[0], arcHeader = _a[1];
        if (state.state !== "SUCCESS") {
            ret = [state, null];
        }
        else {
            var fileState = void 0, arcFile = void 0;
            var files = [];
            while (true) {
                _b = this.processNextFile(function () { return false; }), fileState = _b[0], arcFile = _b[1];
                if (fileState.state !== "SUCCESS") {
                    break;
                }
                files.push(arcFile);
            }
            if (fileState.reason !== "ERAR_END_ARCHIVE") {
                ret = [fileState, null];
            }
            else {
                ret = [{
                        state: "SUCCESS",
                    }, {
                        arcHeader: arcHeader,
                        files: files,
                    }];
            }
        }
        this.closeArc();
        return ret;
        var _b;
    };
    Extractor.prototype.extractFiles = function (files, password) {
        var ret;
        var _a = this.openArc(false, password), state = _a[0], arcHeader = _a[1];
        var fileMap = {};
        for (var i = 0; i < files.length; ++i) {
            fileMap[files[i]] = i;
        }
        if (state.state !== "SUCCESS") {
            ret = [state, null];
        }
        else {
            var fileState = void 0, arcFile = void 0;
            var arcFiles = Array(files.length).fill(null);
            var count = 0;
            var _loop_1 = function () {
                var skip = false, index = null;
                _a = this_1.processNextFile(function (filename) {
                    if (filename in fileMap) {
                        index = fileMap[filename];
                        return false;
                    }
                    else {
                        skip = true;
                        return true;
                    }
                }), fileState = _a[0], arcFile = _a[1];
                if (fileState.state !== "SUCCESS") {
                    return "break";
                }
                if (!skip) {
                    arcFiles[index] = arcFile;
                    count++;
                    if (count === files.length) {
                        fileState.reason = "ERAR_END_ARCHIVE";
                        return "break";
                    }
                }
                var _a;
            };
            var this_1 = this;
            while (true) {
                var state_1 = _loop_1();
                if (state_1 === "break")
                    break;
            }
            if (fileState.reason !== "ERAR_END_ARCHIVE") {
                ret = [fileState, null];
            }
            else {
                ret = [{
                        state: "SUCCESS",
                    }, {
                        arcHeader: arcHeader,
                        files: arcFiles,
                    }];
            }
        }
        this.closeArc();
        return ret;
    };
    Extractor.prototype.fileCreated = function (filename) {
        return;
    };
    Extractor.prototype.close = function (fd) {
        this._lastFileContent = this.closeFile(fd);
        return;
    };
    Extractor.prototype.openArc = function (listOnly, password) {
        extractorCurrent_1.Ext.current = this;
        this._archive = new unrar.RarArchive();
        var header = this._archive.open(this._filePath, password ? password : this._password, listOnly);
        var ret;
        if (header.state.errCode !== 0) {
            ret = [this.getFailInfo(header.state.errCode, header.state.errType), null];
        }
        else {
            ret = [{
                    state: "SUCCESS",
                }, {
                    comment: header.comment,
                    flags: {
                        /* tslint:disable: no-bitwise */
                        volume: (header.flags & 0x0001) !== 0,
                        lock: (header.flags & 0x0004) !== 0,
                        solid: (header.flags & 0x0008) !== 0,
                        authInfo: (header.flags & 0x0020) !== 0,
                        recoveryRecord: (header.flags & 0x0040) !== 0,
                        headerEncrypted: (header.flags & 0x0080) !== 0,
                    },
                }];
        }
        // archive.delete();
        extractorCurrent_1.Ext.current = null;
        return ret;
    };
    Extractor.prototype.processNextFile = function (callback) {
        function getDateString(dosTime) {
            var bitLen = [5, 6, 5, 5, 4, 7];
            var parts = [];
            for (var _i = 0, bitLen_1 = bitLen; _i < bitLen_1.length; _i++) {
                var len = bitLen_1[_i];
                // tslint:disable-next-line: no-bitwise
                parts.push(dosTime & ((1 << len) - 1));
                // tslint:disable-next-line: no-bitwise
                dosTime >>= len;
            }
            parts = parts.reverse();
            var pad = function (num) { return num < 10 ? "0" + num : "" + num; };
            return 1980 + parts[0] + "-" + pad(parts[1]) + "-" + pad(parts[2]) +
                ("T" + pad(parts[3]) + ":" + pad(parts[4]) + ":" + pad(parts[5] * 2) + ".000");
        }
        function getMethod(method) {
            var methodMap = {
                0x30: "Storing",
                0x31: "Fastest",
                0x32: "Fast",
                0x33: "Normal",
                0x34: "Good",
                0x35: "Best",
            };
            return methodMap[method] || "Unknown";
        }
        extractorCurrent_1.Ext.current = this;
        var ret;
        var arcFileHeader = this._archive.getFileHeader();
        var extractInfo = [{ state: "SUCCESS" }, null];
        if (arcFileHeader.state.errCode === 0) {
            var skip = callback(arcFileHeader.name);
            this._lastFileContent = null;
            var fileState = this._archive.readFile(skip);
            if (fileState.errCode !== 0 && !skip) {
                extractInfo[0] = this.getFailInfo(fileState.errCode, fileState.errType);
                if (fileState.errCode === 22) {
                    fileState = this._archive.readFile(true);
                }
                else {
                    fileState.errCode = 0;
                }
            }
            if (fileState.errCode === 0) {
                extractInfo[1] = this._lastFileContent;
            }
            else {
                arcFileHeader.state.errCode = fileState.errCode;
                arcFileHeader.state.errType = fileState.errType;
            }
            this._lastFileContent = null;
        }
        if (arcFileHeader.state.errCode !== 0) {
            ret = [this.getFailInfo(arcFileHeader.state.errCode, arcFileHeader.state.errType), null];
        }
        else {
            ret = [{
                    state: "SUCCESS",
                }, {
                    fileHeader: {
                        name: arcFileHeader.name,
                        flags: {
                            /* tslint:disable: no-bitwise */
                            encrypted: (arcFileHeader.flags & 0x04) !== 0,
                            solid: (arcFileHeader.flags & 0x10) !== 0,
                            directory: (arcFileHeader.flags & 0x20) !== 0,
                        },
                        packSize: arcFileHeader.packSize,
                        unpSize: arcFileHeader.unpSize,
                        // hostOS: arcFileHeader.hostOS
                        crc: arcFileHeader.crc,
                        time: getDateString(arcFileHeader.time),
                        unpVer: Math.floor(arcFileHeader.unpVer / 10) + "." + (arcFileHeader.unpVer % 10),
                        method: getMethod(arcFileHeader.method),
                    },
                    extract: extractInfo,
                }];
        }
        extractorCurrent_1.Ext.current = null;
        return ret;
    };
    Extractor.prototype.closeArc = function () {
        extractorCurrent_1.Ext.current = this;
        this._archive.delete();
        extractorCurrent_1.Ext.current = null;
        this._archive = null;
    };
    Extractor.prototype.getFailInfo = function (errCode, errType) {
        return {
            state: "FAIL",
            reason: ERROR_CODE[errCode],
            msg: ERROR_MSG[errCode],
        };
    };
    Extractor._current = null;
    return Extractor;
}());
exports.Extractor = Extractor;
