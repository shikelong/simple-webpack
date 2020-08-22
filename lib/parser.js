const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const {transformFromAst} = require('@babel/core')
const path = require('path')

module.exports = {
  getAst: (path) => {
    const content = fs.readFileSync(path, "utf-8");
    const ast = parser.parse(content, {
      sourceType: 'module'
    });
    return ast;
  },
  getDependecies: (ast, filename) => {
    const dependecies = {}

    traverse(ast, {
      //提取ast中的 Import 声明
      ImportDeclaration({node}){
        const dirname = path.dirname(filename)
        dependecies[node.source.value] = "./" + path.join(dirname, node.source.value)
      }
    })

    return dependecies;
  },
  getCode: (ast) => {
    const {code} = transformFromAst(ast, null, {
      presets:  ["@babel/preset-env"]
    })
    return code;
  }
}