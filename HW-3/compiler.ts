import { Stmt, Expr, Type } from "./ast";
import { parse } from "./parser";
import { typeCheck } from "./typechecker";

// https://learnxinyminutes.com/docs/wasm/

// Numbers are offsets into global memory
export type GlobalEnv = {
  globals: Map<string, number>;
  offset: number;
  types: Map<string, Type>;
  functypes: Map<string, Map<string, Type>>;
  funcDef: Map<string, Stmt<Type>>;
  funcStr: string;
  localVars: Set<any>;
  classVarNameTypes: Map<string, Map<string, Type>>; // Mapping between class name and a mapping from variable name to its type
  classVarNameIndex: Map<string, Map<string, number>>; // Mapping between class name and a mapping from variable name to its index
  classIndexVarName: Map<string, Map<number, string>>; // Mapping between class name and a mapping from an index to its variable name
  classFuncDefs: Map<string, Map<string, Stmt<Type>>>; // Mapping between class name and a map that is between function names to function ast
  classDef: Map<string, Stmt<Type>>; // Mapping between class name and its ast.
}

export const emptyEnv = { 
  globals: new Map(), 
  offset: 0, 
  types: new Map(), 
  functypes: new Map(), 
  funcDef: new Map(), 
  funcStr: "",  
  localVars: new Set(),
  classVarNameTypes: new Map(),
  classVarNameIndex: new Map(),
  classFuncDefs: new Map(),
  classDef: new Map()
};

export function augmentEnv(env: GlobalEnv, stmts: Array<Stmt<any>>) : GlobalEnv {
  const newEnv = new Map(env.globals);
  const newTypes = new Map(env.types);
  var newOffset = env.offset;
  const newfuncTypes = new Map(env.functypes);
  const newfuncDef = new Map(env.funcDef);
  const newclassVarNameTypes = new Map(env.classVarNameTypes);
  const newclassVarNameIndex = new Map(env.classVarNameIndex);
  const newclassIndexVarName = new Map(env.classIndexVarName);
  const newclassFuncDefs = new Map(env.classFuncDefs);
  const newclassDef = new Map(env.classDef);
  const newfuncStr = env.funcStr;
  newEnv.set("scratchVar", newOffset);
  newTypes.set("scratchVar", {tag: "number"});
  newOffset += 1
  stmts.forEach((s) => {
    switch(s.tag) {
      case "define":
        if (!newEnv.has(s.name)) {
          newEnv.set(s.name, newOffset);
          newOffset += 1;
        }
        break;
      case "init":
        newTypes.set(s.name, s.type);
        newEnv.set(s.name, newOffset);
        newOffset += 1;
        break;
      case "funcdef":
        newfuncDef.set(s.name, s);
        break;
      case "class":
        newclassDef.set(s.name, s);
        const varNameIndex = new Map<string, number>();
        const indexVarName = new Map<number, string>();
        const varNameType = new Map<string, Type>();
        for (let index = 0; index < s.decls.length; index++) {
          const element = s.decls[index];
          if (element.tag != "init") {
            throw Error("Non-init statement inside class decls");
          }
          varNameIndex.set(element.name, index);
          indexVarName.set(index, element.name);
          varNameType.set(element.name, element.type);
        }
        newclassVarNameIndex.set(s.name, varNameIndex);
        newclassIndexVarName.set(s.name, indexVarName);
        newclassVarNameTypes.set(s.name, varNameType);
        
        const funcDefs = new Map<string, Stmt<Type>>();
        s.funcdefs.forEach(element => {
          if (element.tag != "funcdef") {
            throw Error("Non-function statement inside class funcdefs");
          }
          funcDefs.set(element.name, element);
        });
        newclassFuncDefs.set(s.name, funcDefs);
        break;
    }
  })
  return {
    globals: newEnv,
    offset: newOffset,
    types: newTypes,
    functypes: newfuncTypes,
    funcDef: newfuncDef,
    funcStr: newfuncStr,
    localVars: new Set(),
    classVarNameTypes: newclassVarNameTypes,
    classVarNameIndex: newclassVarNameIndex,
    classIndexVarName: newclassIndexVarName,
    classFuncDefs: newclassFuncDefs,
    classDef: newclassDef
  }
}

type LocalEnv = Map<string, boolean>;

type CompileResult = {
  wasmSource: string,
  newEnv: GlobalEnv
};

function updateEnvWithTypedAst(env: GlobalEnv, stmts: Array<Stmt<any>>) : GlobalEnv {
  const newEnv = new Map(env.globals);
  const newTypes = new Map(env.types);
  var newOffset = env.offset;
  const newfuncTypes = new Map(env.functypes);
  const newfuncDef = new Map(env.funcDef);
  const newclassVarNameTypes = new Map(env.classVarNameTypes);
  const newclassVarNameIndex = new Map(env.classVarNameIndex);
  const newclassIndexVarName = new Map(env.classIndexVarName);
  const newclassFuncDefs = new Map(env.classFuncDefs);
  const newclassDef = new Map(env.classDef);
  const newfuncStr = env.funcStr;

  stmts.forEach(s => {
    switch(s.tag) {
      case "funcdef":
        newfuncDef.set(s.name, s);
        break;
      case "class":
        newclassDef.set(s.name, s);
        const funcDefs = new Map<string, Stmt<Type>>();
        s.funcdefs.forEach(element => {
          if (element.tag != "funcdef") {
            throw Error("Non-function statement inside class funcdefs");
          }
          funcDefs.set(element.name, element);
        });
        newclassFuncDefs.set(s.name, funcDefs);
        break;
    }
  });
  return {
    globals: newEnv,
    offset: newOffset,
    types: newTypes,
    functypes: newfuncTypes,
    funcDef: newfuncDef,
    funcStr: newfuncStr,
    localVars: new Set(),
    classVarNameTypes: newclassVarNameTypes,
    classVarNameIndex: newclassVarNameIndex,
    classIndexVarName: newclassIndexVarName,
    classFuncDefs: newclassFuncDefs,
    classDef: newclassDef
  }
}


export function compile(source: string, env: GlobalEnv) : CompileResult {
  const ast = parse(source);
  var withDefines = augmentEnv(env, ast);
  withDefines.globals.forEach((value: number, key: string) => {
    console.log("withDefines globals ", key, value);
  });
  const typedAst = typeCheck(ast, withDefines);
  withDefines = updateEnvWithTypedAst(withDefines, typedAst);
  withDefines.globals.forEach((value: number, key: string) => {
    console.log("withDefines globals after typecheck ", key, value);
  });

  const funs : Array<string> = [];
  typedAst.forEach((stmt) => {
    if(stmt.tag === "funcdef") { funs.push(codeGenFunc(stmt, withDefines).join("\n")); }
  });
  
  const allFuncs = funs.join("\n\n");
  withDefines.funcStr = withDefines.funcStr + "\n" + allFuncs;

  const commandGroups: Array<Array<string>> = []

  typedAst.forEach(stmt => {
    if (stmt.tag != "funcdef") {
      commandGroups.push(codeGen(stmt, withDefines, false));
    }
  });
  
  const commands = [].concat.apply([], commandGroups);
  console.log("Generated: ", commands.join("\n"));
  return {
    wasmSource: commands.join("\n"),
    newEnv: withDefines
  };
}

export function oldcompile(source: string, env: GlobalEnv) : CompileResult {
  const ast = parse(source);
  const withDefines = augmentEnv(env, ast);
  typeCheck(ast, withDefines);
  const commandGroups = ast.map((stmt) => codeGen(stmt, withDefines));
  const commands = [].concat.apply([], commandGroups);
  console.log("Generated: ", commands.join("\n"));
  return {
    wasmSource: commands.join("\n"),
    newEnv: withDefines
  };
}

export function envLookup(env : GlobalEnv, name : string) : number {
  if(!env.globals.has(name)) { console.log("Could not find " + name + " in ", env); throw new Error("Could not find name " + name); }
  return (env.globals.get(name) * 8); // 8-byte values
}

function codeGenFunc(stmt: Stmt<Type>, env: GlobalEnv) : Array<string> {
  console.log("size of global map", env.globals.size);
  if (stmt.tag != "funcdef") {
    throw Error("Non-function in codeGenFunc " + stmt.tag);
  }
   
  var returnStmt = "";
  if (stmt.return.tag != "none") {
    returnStmt = "(result i64)";
  }

  var params = stmt.parameters.map(p => `(param $${p.name} i64)`).join(" ");
  
  const definedVars = new Set();
  stmt.decls.forEach(element => {
    if (element.tag == "init") { //always True
      definedVars.add(element.name); 
    }
  });
  const localScratchVar : string = `(local $localScratchVar i64)`;
  const localDefines = [localScratchVar];
  definedVars.forEach(v => {
    localDefines.push(`(local $${v} i64)`);
  })
  
  env.localVars = definedVars;
  stmt.parameters.forEach(element => {
    env.localVars.add(element.name);
  });
  
  console.log("size of global map", env.globals.size);
  env.globals.forEach((value: number, key: string) => {
    console.log("globals before going into func ", key, value);
  });
  
  const declCommandGroups = stmt.decls.map((temp) => codeGen(temp, env, true));
  const commandGroups = declCommandGroups.concat(stmt.body.map((temp) => codeGen(temp, env, true)));
  const commands = localDefines.concat([].concat.apply([], commandGroups));
  if (stmt.return.tag != "none" && stmt.body[stmt.body.length - 1].tag == "if") {
    commands.push(`(unreachable)`);
  }
  var stmtsBody = commands.join("\n");
  return [`(func $${stmt.name} ${params} ${returnStmt} ${stmtsBody})`];
}

function isFunctionVar(varName: string, env: GlobalEnv) : boolean {
  return env.localVars.has(varName);
}

function codeGen(stmt: Stmt<Type>, env: GlobalEnv, isFunc: boolean = false) : Array<string> {
  switch(stmt.tag) {
    case "class":
      return [`;; ${stmt.name}`];
    case "define":
      if (isFunc && isFunctionVar(stmt.name, env)) {
        var valStmts = codeGenExpr(stmt.value, env, isFunc);
        return valStmts.concat([`(local.set $${stmt.name})`]);
      } 
      else {
        const locationToStore = [`(i32.const ${envLookup(env, stmt.name)}) ;; ${stmt.name}`];
        var valStmts = codeGenExpr(stmt.value, env, isFunc);
        return locationToStore.concat(valStmts).concat([`(i64.store)`]);
      }
    case "clsdefine":
      var nameStmts = codeGenExpr(stmt.name, env, isFunc);
      var addrNameStmts = nameStmts.slice(0, nameStmts.length - 1);
      var valStmts = codeGenExpr(stmt.value, env, isFunc);
      return addrNameStmts.concat(valStmts).concat([`(i64.store)`]);
    case "expr":
      if (isFunc) {
        var exprStmts = codeGenExpr(stmt.expr, env, isFunc);
        if (stmt.expr.tag == "call") {
          const dummy = env.funcDef.get(stmt.expr.name)
          if (dummy.tag != "funcdef") { // Always condition true
            throw Error("Function is not inside call method.");
          }  
          if (dummy.return.tag == "none") {
            return exprStmts;
          }
        }
        return exprStmts.concat([`(local.set $localScratchVar)`]);
      }
      else {
        var exprStmts = codeGenExpr(stmt.expr, env, isFunc);
        if (stmt.expr.tag == "call") {
          const dummy = env.funcDef.get(stmt.expr.name)
          if (dummy.tag != "funcdef") { // Always condition true
            throw Error();
          }  
          if (dummy.return.tag == "none") {
            return exprStmts;
          }
        }
        const scratchLocationToStore = [`(i32.const ${envLookup(env, "scratchVar")}) ;; $scratchVar`];
        return scratchLocationToStore.concat(exprStmts).concat([`(i64.store)`]);
      }
    case "globals":
      var globalStmts : Array<string> = [];
      env.globals.forEach((pos, name) => {
        globalStmts.push(
          `(i64.const ${pos})`,
          `(i64.const ${envLookup(env, name)})`,
          `(i64.load)`,
          `(call $printglobal)`
        );
      });
      return globalStmts;  
    case "init":
      if (isFunc && isFunctionVar(stmt.name, env)) {
        var valStmts = codeGenExpr(stmt.value, env, isFunc);
        return valStmts.concat([`(local.set $${stmt.name})`])
      }
      else {
        const initLocationToStore = [`(i32.const ${envLookup(env, stmt.name)}) ;; ${stmt.name}`];
        var valStmts = codeGenExpr(stmt.value, env, isFunc);
        return initLocationToStore.concat(valStmts).concat([`(i64.store)`]);
      }
    case "if":
      var ifStmts : Array<string> = [];
      const resultFlag = stmt.ifthn[stmt.ifthn.length - 1].tag === "expr";
      ifStmts = ifStmts.concat(codeGenExpr(stmt.ifcond, env, isFunc));
      ifStmts = ifStmts.concat([`(i32.wrap_i64)`]);
      if (resultFlag) {
        // ifStmts = ifStmts.concat([`(if (result i64)`]);
        ifStmts = ifStmts.concat([`(if`]);
      }
      else {
        ifStmts = ifStmts.concat([`(if`]);
      }
      ifStmts = ifStmts.concat([`(then`]);
      stmt.ifthn.forEach(element => {
        ifStmts = ifStmts.concat(codeGen(element, env, isFunc));
      });
      ifStmts = ifStmts.concat([`)`]) // closing if-then
      if (stmt.elifcond != null) {
        ifStmts = ifStmts.concat([`(else`]);
        ifStmts = ifStmts.concat(codeGenExpr(stmt.elifcond, env, isFunc));
        ifStmts = ifStmts.concat([`(i32.wrap_i64)`]);
        if (resultFlag) {
          // ifStmts = ifStmts.concat([`(if (result i64)`]);
          ifStmts = ifStmts.concat([`(if`]);
        }
        else {
          ifStmts = ifStmts.concat([`(if`]);
        }
        ifStmts = ifStmts.concat([`(then`]);
        stmt.elifthn.forEach(element => {
          ifStmts = ifStmts.concat(codeGen(element, env, isFunc));
        });
        ifStmts = ifStmts.concat([`)`]) // closing elif-then

        if (stmt.else.length > 0) {
          ifStmts = ifStmts.concat([`(else`]);
          stmt.else.forEach(element => {
            ifStmts = ifStmts.concat(codeGen(element, env, isFunc));
          });
          ifStmts = ifStmts.concat([`)`]) // closing ) corresponding to else
        }
        ifStmts = ifStmts.concat([`)`]) // closing elif-condition
        ifStmts = ifStmts.concat([`)`]) // closing elif-else
      } 
      else if (stmt.else.length > 0) {
        ifStmts = ifStmts.concat([`(else`]);
        stmt.else.forEach(element => {
          ifStmts = ifStmts.concat(codeGen(element, env, isFunc));
        });
        ifStmts = ifStmts.concat([`)`]) // closing ) corresponding to else
      }
      ifStmts = ifStmts.concat([`)`]) // closing if
      return ifStmts;
    case "while":
      var whileStmts : Array<string> = []; 
      whileStmts = whileStmts.concat([`(block`]);
      whileStmts = whileStmts.concat([`(loop`]);
      // starting if while condition
      whileStmts = whileStmts.concat(codeGenExpr(stmt.cond, env, isFunc));
      whileStmts = whileStmts.concat([`(i32.wrap_i64)`]);
      whileStmts = whileStmts.concat([`(if`]);
      whileStmts = whileStmts.concat([`(then`]);
      stmt.body.forEach(element => {
        whileStmts = whileStmts.concat(codeGen(element, env, isFunc));
      });
      whileStmts = whileStmts.concat([`)`]) // closing if-then
      whileStmts = whileStmts.concat([`)`]) // closing if

      whileStmts = whileStmts.concat([`(br_if 0`]) // starting while condition
      whileStmts = whileStmts.concat(codeGenExpr(stmt.cond, env, isFunc));
      whileStmts = whileStmts.concat([`(i32.wrap_i64)`]);
      whileStmts = whileStmts.concat([`)`]) // closing br_if
      whileStmts = whileStmts.concat([`(br 1)`]) // breaking
      whileStmts = whileStmts.concat([`)`]) // closing loop
      whileStmts = whileStmts.concat([`)`]) // closing block
      return whileStmts;
    case "return":
      var valStmts = codeGenExpr(stmt.value, env, isFunc);
      valStmts.push("(return)");
      return valStmts;
  }
}

function codeGenExpr(expr : Expr<Type>, env: GlobalEnv, isFunc: boolean = false) : Array<string> {
  switch(expr.tag) {
    case "builtin1":
      const argStmts = codeGenExpr(expr.arg, env, isFunc);
      return argStmts.concat([`(call $${expr.name})`]);
    case "builtin2":
      var builtin2ArgStmts = codeGenExpr(expr.arg1, env, isFunc);
      builtin2ArgStmts = builtin2ArgStmts.concat(codeGenExpr(expr.arg2, env, isFunc));
      return builtin2ArgStmts.concat([`(call $${expr.name})`]);
    case "literal":
      return ["(i64.const " + expr.value + ")"];
    case "id":
      if (isFunc && isFunctionVar(expr.name, env)) {
        return [`(local.get $${expr.name})`]
      }
      else {
        console.log("I am here for ", expr.name, env)
        return [`(i32.const ${envLookup(env, expr.name)})`, `(i64.load)`];
      }
    case "lookup":
      console.log("Looking up ", expr, env);
      let objstmts = codeGenExpr(expr.obj, env, isFunc);
      let objtype = expr.obj.a;
      if(objtype.tag !== "class") { // I don't think this error can happen
        throw new Error("Report this as a bug to the compiler developer, this shouldn't happen " + objtype.tag);
      }
      let className = objtype.name;
      let offset = env.classVarNameIndex.get(className).get(expr.name);
      return [
        ...objstmts,
        `(i64.add (i64.const ${offset * 8}))`,
        `(i32.wrap_i64)`,
        `(i64.load)`
      ];
    case "construct":
      var classNameForConstructor = expr.name;
      var typedAstForClass = env.classDef.get(classNameForConstructor);
      if (typedAstForClass.tag != "class") {
        throw Error("Tag for an ast for a class inside classDef is not class and is " + typedAstForClass.tag);
      }

      var stmts : Array<string> = []
      var numDecls = typedAstForClass.decls.length;
      for (let index = 0; index < numDecls; index++) {
        if (index == 0) {
          stmts = stmts.concat([`(i64.load (i32.const 0))`]);  // Load the dynamic heap head offset
          stmts = stmts.concat([`(i32.wrap_i64)`]);  // Since store address is i32, converting i64 to i32.
        }
        var declStmt = typedAstForClass.decls[index];
        if (declStmt.tag != "init") {
          throw Error("Tag for a decl statement is not init");
        }  

        if (declStmt.name != env.classIndexVarName.get(classNameForConstructor).get(index)) {
          throw Error("The order in declstatements array in classdef is not same as the order we inserted");
        }
        var valStmts = codeGenExpr(declStmt.value, env, isFunc);
        stmts = stmts.concat(valStmts);  // The value of declared field
        stmts = stmts.concat([`(i64.store)`]);  // Put the field value on the heap

        if (index != (numDecls - 1)) {
          stmts = stmts.concat([`(i64.load (i32.const 0))`]); // Load the dynamic heap head offset
          stmts = stmts.concat([`(i64.add (i64.const ${(index + 1) * 8}))`]); // Refer to the next word
          stmts = stmts.concat([`(i32.wrap_i64)`]); // Since store address is i32, converting i64 to i32.
        }
      }

      if (numDecls > 0) {
        stmts = stmts.concat([`(i32.const 0)`]); // Address for our upcoming store instruction
        stmts = stmts.concat([`(i64.load (i32.const 0))`]); // Load the dynamic heap head offset
        stmts = stmts.concat([`(i64.add (i64.const ${numDecls * 8}))`]); // Move heap head beyond the two words we just created for fields
        stmts = stmts.concat([`(i64.store)`]); // Save the new heap offset
        stmts = stmts.concat([`(i64.load (i32.const 0))`]); // Reload the heap head ptr
        stmts = stmts.concat([`(i64.sub (i64.const ${numDecls * 8}))`]); // Subtract 8 to get address for the object
      }
      return stmts;
    case "binop":
      var binOpArgStmts = codeGenExpr(expr.arg1, env, isFunc);
      binOpArgStmts = binOpArgStmts.concat(codeGenExpr(expr.arg2, env, isFunc));
      if (expr.name == "+") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.add)`]);
      } 
      else if(expr.name == "-") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.sub)`]);
      } 
      else if(expr.name == "*") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.mul)`]);
      }
      else if(expr.name == "//") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.div_s)`]);
      }
      else if(expr.name == "%") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.rem_u)`]);
      }
      else if(expr.name == "==") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.eq)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.extend_i32_u)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.const 4294967296)`])
        binOpArgStmts = binOpArgStmts.concat([`(i64.add)`])
      }
      else if(expr.name == "!=") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.ne)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.extend_i32_u)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.const 4294967296)`])
        binOpArgStmts = binOpArgStmts.concat([`(i64.add)`])
      }
      else if(expr.name == "<=") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.le_s)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.extend_i32_u)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.const 4294967296)`])
        binOpArgStmts = binOpArgStmts.concat([`(i64.add)`])
      }
      else if(expr.name == ">=") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.ge_s)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.extend_i32_u)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.const 4294967296)`])
        binOpArgStmts = binOpArgStmts.concat([`(i64.add)`])
      }
      else if(expr.name == "<") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.lt_s)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.extend_i32_u)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.const 4294967296)`])
        binOpArgStmts = binOpArgStmts.concat([`(i64.add)`])
      }
      else if(expr.name == ">") {
        binOpArgStmts = binOpArgStmts.concat([`(i64.gt_s)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.extend_i32_u)`]);
        binOpArgStmts = binOpArgStmts.concat([`(i64.const 4294967296)`])
        binOpArgStmts = binOpArgStmts.concat([`(i64.add)`])
      }
      return binOpArgStmts;
    case "uniop":
      if (expr.name == "-") {
        var unOpStmts = [`(i64.const -1)`];
        unOpStmts = unOpStmts.concat(codeGenExpr(expr.value, env, isFunc));
        unOpStmts = unOpStmts.concat([`(i64.mul)`]);
      }
      else if (expr.name == "not") {
        var unOpStmts = [`(i64.const 4294967297)`];
        unOpStmts = unOpStmts.concat(codeGenExpr(expr.value, env, isFunc));
        unOpStmts = unOpStmts.concat([`(i64.xor)`]);
        unOpStmts = unOpStmts.concat([`(i64.const 4294967296)`]);
        unOpStmts = unOpStmts.concat([`(i64.add)`]);
      }
      return unOpStmts;
    case "call":
      var valStmts : Array<string> = []
      expr.arguments.forEach(element => {
        valStmts = valStmts.concat(codeGenExpr(element, env, isFunc));
      });
      valStmts.push(`(call $${expr.name})`);
      return valStmts;
  }
}
