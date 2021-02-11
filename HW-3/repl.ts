import {run} from "./runner";
import {emptyEnv, GlobalEnv} from "./compiler";
import { Value } from "./ast";

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
      classDef: new Map()
    };
  }
  async run(source : string) : Promise<any> {
    // To make it Promise<Value> we need to finish annotation first.
    this.importObject.updateNameMap(this.currentEnv); // is this the right place for updating the object's env?
    const [result, newEnv] = await run(source, {importObject: this.importObject, env: this.currentEnv});
    this.currentEnv = newEnv;
    return result;
  }
}