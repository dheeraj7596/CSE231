// This is a mashup of tutorials from:
//
// - https://github.com/AssemblyScript/wabt.js/
// - https://developer.mozilla.org/en-US/docs/WebAssembly/Using_the_JavaScript_API

import wabt from 'wabt';
import { Stmt } from './ast';
import * as compiler from './compiler';
import {parse} from './parser';

// NOTE(joe): This is a hack to get the CLI Repl to run. WABT registers a global
// uncaught exn handler, and this is not allowed when running the REPL
// (https://nodejs.org/api/repl.html#repl_global_uncaught_exceptions). No reason
// is given for this in the docs page, and I haven't spent time on the domain
// module to figure out what's going on here. It doesn't seem critical for WABT
// to have this support, so we patch it away.
if(typeof process !== "undefined") {
  const oldProcessOn = process.on;
  process.on = (...args : any) : any => {
    if(args[0] === "uncaughtException") { return; }
    else { return oldProcessOn.apply(process, args); }
  };
}

function isVoidCallLast(stmt: Stmt, env: compiler.GlobalEnv) : boolean {
  if (stmt.tag == "expr" && stmt.expr.tag == "call") {
    const dummy = env.funcDef.get(stmt.expr.name)
    if (dummy.tag != "funcdef") { // Always condition true
      throw Error("Function is not inside call method.");
    }  
    if (dummy.return == "none") {
      return true;
    } 
    else {
      return false;
    }
  }
}

export async function run(source : string, config: any) : Promise<[any, compiler.GlobalEnv]> {
  const wabtInterface = await wabt();
  const parsed = parse(source);
  var returnType = "";
  var returnExpr1 = "";
  var returnExpr2 = "";
  const lastExpr = parsed[parsed.length - 1]
  const compiled = compiler.compile(source, config.env);
  if(lastExpr.tag === "expr" && !(isVoidCallLast(lastExpr, compiled.newEnv))) {
    returnType = "(result i64)";
    returnExpr1 = `(i32.const ${compiler.envLookup(compiled.newEnv, "scratchVar")})`;
    returnExpr2 = `(i64.load)`;
  } 
  // else if(lastExpr.tag === "if" && lastExpr.ifthn[lastExpr.ifthn.length - 1].tag === "expr") {
  //   returnType = "(result i64)";
  //   returnExpr1 = `(i32.const ${compiler.envLookup(compiled.newEnv, "scratchVar")})`;
  //   returnExpr2 = `(i64.load)`;
  // }
  const importObject = config.importObject;
  if(!importObject.js) {
    const memory = new WebAssembly.Memory({initial:10, maximum:100});
    importObject.js = { memory: memory };
  }
  const wasmSource = `(module
    (func $print (import "imports" "print") (param i64) (result i64))
    (import "js" "memory" (memory 1))
    (func $abs (import "imports" "abs") (param i64) (result i64))
    (func $max (import "imports" "max") (param i64) (param i64) (result i64))
    (func $min (import "imports" "min") (param i64) (param i64) (result i64))
    (func $pow (import "imports" "pow") (param i64) (param i64) (result i64))
    ${compiled.newEnv.funcStr}
    (func (export "exported_func") ${returnType}
      ${compiled.wasmSource}
      ${returnExpr1}
      ${returnExpr2}
    )
  )`;
  console.log("Generated whole code: ", wasmSource);
  const myModule = wabtInterface.parseWat("test.wat", wasmSource);
  var asBinary = myModule.toBinary({});
  var wasmModule = await WebAssembly.instantiate(asBinary.buffer, importObject);
  const result = (wasmModule.instance.exports.exported_func as any)();
  return [result, compiled.newEnv];
}
