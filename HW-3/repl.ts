import {run, typecheckDynamic} from "./runner";
import {emptyEnv, GlobalEnv} from "./compiler";
import { Type, Value } from "./ast";

interface REPL {
  run(source : string) : Promise<any>;
}

export class BasicREPL {
  currentEnv: GlobalEnv
  importObject: any
  memory: any
  constructor(importObject : any) {
    this.importObject = importObject;
    if(!importObject.js) {
      const memory = new WebAssembly.Memory({initial:2000, maximum:2000});
      const view = new Int32Array(memory.buffer);
      view[0] = 8;
      this.importObject.js = { memory: memory };
    }
    this.currentEnv = {
      globals: new Map(),
      offset: 1,
      types: new Map(),
      functypes: new Map(),
      funcDef: new Map(),
      funcStr: "",
      localVars: new Set(),
      classVarNameTypes: new Map(),
      classVarNameIndex: new Map(),
      classIndexVarName: new Map(),
      classFuncDefs: new Map(),
      classDef: new Map(),
      typedAst: new Array()
    };
  }

  async tc(source : string) : Promise<Type> {
    const newEnv = await typecheckDynamic(source, {importObject: this.importObject, env: this.currentEnv});
    this.currentEnv = newEnv;
    var lastStmt = newEnv.typedAst[newEnv.typedAst.length - 1];
    return lastStmt.a;
  } 

  async run(source : string) : Promise<Value> {
    const [result, newEnv] = await run(source, {importObject: this.importObject, env: this.currentEnv});
    this.currentEnv = newEnv;
    var lastStmt = newEnv.typedAst[newEnv.typedAst.length - 1];
    if (lastStmt.a.tag == "none") {
      console.log("I am in none", result);
      return { tag: "none" };
    }
    else if (lastStmt.a.tag == "bool") {
      console.log("I am in bool", result);
      var ans = BigInt(result) & BigInt(1);
      if (ans == BigInt(1)) {
        return { tag: "bool", value: true };
      }
      else if (ans == BigInt(0)) {
        return { tag: "bool", value: false };
      }
    }
    else if (lastStmt.a.tag == "number") {
      console.log("I am in number ", result);

      if (result == -141071616) {
        // This is None
        return { tag: "none" };
      }
      else if (result < 2**32) { // This is a number
        return { tag: "num", value: Number(result) };
      }
      else if (BigInt(result) >= 2**32 && BigInt(result) < (2**32 + 2)) {
        // Bools are added with 2^32.
        var ans = BigInt(result) & BigInt(1);
        if (ans == BigInt(1)) {
          return { tag: "bool", value: true };
        }
        else if (ans == BigInt(0)) {
          return { tag: "bool", value: false };
        }
      }
      else {
        throw Error("A number out of range has appeared.");
      }
    }
    else if (lastStmt.a.tag == "class") {
      console.log("I am in class", result);
      return { tag: "object", name: lastStmt.a.name, address: Number(result)};
    }
  }
}