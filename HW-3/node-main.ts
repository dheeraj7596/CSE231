import {compile} from './compiler';
import {parse} from './parser';

const input = 
`
class Rat(object):
    n : int = 0
    d : int = 0
    def new(self : Rat, n : int, d : int) -> Rat:
        self.n = n
        self.d = d
        return self
    def mul(self : Rat, other : Rat) -> Rat:
        return Rat().new(self.n * other.n, self.d * other.d)
r1 : Rat = None
r2 : Rat = None
r1 = Rat().new(4, 5)
r2 = Rat().new(2, 3)
r1.mul(r2).mul(r2)
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