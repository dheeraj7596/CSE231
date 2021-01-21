import {compile} from './compiler';
import {parse} from './parser';

const input = "abs(-5)";
const parsed = parse(input);
var returnType = "";
var returnExpr = "";
const lastExpr = parsed[parsed.length - 1]
if(lastExpr.tag === "expr") {
returnType = "(result i32)";
returnExpr = "(local.get $$last)"
}
const compiled = compile(input);
const wasmSource = `(module
(func $print (import "imports" "print") (param i32) (result i32))
(func $abs (import "imports" "abs") (param i32) (result i32))
(func (export "exported_func") ${returnType}
    ${compiled.wasmSource}
    ${returnExpr}
)
)`;
console.log("Final generated:", wasmSource)