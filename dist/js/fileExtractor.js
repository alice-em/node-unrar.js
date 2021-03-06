"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var mkdirp = require('mkdirp');
var extractor_1 = require("./extractor");
var unrar = require("./unrar");
var FileExtractor = (function (_super) {
    __extends(FileExtractor, _super);
    function FileExtractor(filepath, targetPath, password) {
        var _this = _super.call(this, password) || this;
        _this._filePath = filepath;
        _this.fileMap = {};
        _this._target = targetPath;
        return _this;
    }
    FileExtractor.prototype.open = function (filename) {
        var fd = fs.openSync(filename, "r");
        this.fileMap[fd] = {
            size: fs.fstatSync(fd).size,
            pos: 0,
            name: filename,
        };
        return fd;
    };
    FileExtractor.prototype.create = function (filename) {
        var fullpath = path.join(this._target, filename);
        var dir = path.parse(fullpath).dir;
        dir
            .split("/")
            .reduce(function (PATH, folder) {
            PATH += folder + "/";
            if (!fs.existsSync(PATH)) {
		mkdirp.sync(PATH);
                //fs.mkdirSync(PATH);
            }
            return PATH;
        }, "");
        var fd = fs.openSync(fullpath, "w");
        this.fileMap[fd] = {
            size: 0,
            pos: 0,
            name: filename,
        };
        return fd;
    };
    FileExtractor.prototype.closeFile = function (fd) {
        delete this.fileMap[fd];
        fs.closeSync(fd);
        return null;
    };
    FileExtractor.prototype.read = function (fd, buf, size) {
        var file = this.fileMap[fd];
        var buffer = new Buffer(size);
        var readed = fs.readSync(fd, buffer, 0, size, file.pos);
        unrar.HEAPU8.set(buffer, buf);
        file.pos += readed;
        return readed;
    };
    FileExtractor.prototype.write = function (fd, buf, size) {
        var file = this.fileMap[fd];
        var writeNum = fs.writeSync(fd, new Buffer(unrar.HEAPU8.subarray(buf, buf + size)), 0, size);
        file.pos += writeNum;
        file.size += writeNum;
        return writeNum === size;
    };
    FileExtractor.prototype.tell = function (fd) {
        return this.fileMap[fd].pos;
    };
    FileExtractor.prototype.seek = function (fd, pos, method) {
        var file = this.fileMap[fd];
        var newPos = file.pos;
        if (method === "SET") {
            newPos = 0;
        }
        else if (method === "END") {
            newPos = file.size;
        }
        newPos += pos;
        if (newPos < 0 || newPos > file.size) {
            return false;
        }
        file.pos = newPos;
        return true;
    };
    return FileExtractor;
}(extractor_1.Extractor));
exports.FileExtractor = FileExtractor;
