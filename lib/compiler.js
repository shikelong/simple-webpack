const fs = require("fs");
const {getAst, getCode, getDependecies} = require("./parser");
const path = require('path');

module.exports = class Compiler {
  constructor(options){
    const {entry, output} = options;
    this.entry = entry;
    this.output = output;
    //the module cache
    this.modules = [];
  }
  //entry
  run(){
    const info = this.build(this.entry);
    this.modules.push(info);

    for(let i = 0; i < this.modules.length; i++){
      const item = this.modules[i];
      const {dependecies} = item;
      if (dependecies){
        for(let j in dependecies){
          this.modules.push(this.build(dependecies[j]))
        }
      }
    }

    const obj = {};
    this.modules.forEach((item) => {
      obj[item.filename] = {
        dependecies: item.dependecies,
        code: item.code
      }
    });

    this.file(obj);
  }
  //transform files and it's dependencies
  build(filename){
    let ast = getAst(filename);
    let dependecies = getDependecies(ast, filename);
    let code = getCode(ast);
    return {
      filename,
      dependecies,
      code
    }
  }
  //output transform result to files
  file(code){
    const filePath = path.join(this.output.path, this.output.filename);
    code = JSON.stringify(code, null, 2);
    const bundle = `(function(graph){
      function require(module){
        function localRequire(relativePath){
          return require(graph[module].dependecies[relativePath])
        }

        var exports = {};
        (function(require, exports, code){
          eval(code)
        })(localRequire, exports, graph[module].code);
        return exports;
      }
      require('${this.entry}');
    })(${code})`;

    fs.writeFileSync(filePath, bundle, "utf-8")
  }
}