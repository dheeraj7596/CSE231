import {compile} from './compiler';
import {parse} from './parser';

const input = 
`
i:int = 9
j:int = 8
i = (i + j) + (k + l)

    `;
const parsed = parse(input);
console.log("Parsed", parsed);
console.log("Parsed in Json", JSON.stringify(parsed));
// var returnType = "";
// var returnExpr = "";
// const lastExpr = parsed[parsed.length - 1]
// if(lastExpr.tag === "expr") {
// returnType = "(result i64)";
// returnExpr = "(local.get $$last)"
// }
// var localEnv = {
//     globals : new Map(),
//     offset: 0,
//     types : new Map(),
//   }
// const compiled = compile(input, localEnv);
// const wasmSource = `(module
// (func $print (import "imports" "print") (param i64) (result i64))
// (func $abs (import "imports" "abs") (param i64) (result i64))
// (func (export "exported_func") ${returnType}
//     ${compiled.wasmSource}
//     ${returnExpr}
// )
// )`;
// console.log("Final generated:", wasmSource)