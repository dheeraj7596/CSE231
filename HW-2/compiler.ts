import { Stmt, Expr, Type } from "./ast";
import { parse } from "./parser";
import { typeCheck } from "./typechecker";

// https://learnxinyminutes.com/docs/wasm/

// Numbers are offsets into global memory
export type GlobalEnv = {
  globals: Map<string, number>;
  offset: number;
  types: Map<string, Type>;
}

export const emptyEnv = { globals: new Map(), offset: 0 };

export function augmentEnv(env: GlobalEnv, stmts: Array<Stmt>) : GlobalEnv {
  const newEnv = new Map(env.globals);
  const newTypes = new Map(env.types);
  var newOffset = env.offset;
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
    }
  })
  return {
    globals: newEnv,
    offset: newOffset,
    types: newTypes
  }
}

type LocalEnv = Map<string, boolean>;

type CompileResult = {
  wasmSource: string,
  newEnv: GlobalEnv
};

export function compile(source: string, env: GlobalEnv) : CompileResult {
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

function envLookup(env : GlobalEnv, name : string) : number {
  if(!env.globals.has(name)) { console.log("Could not find " + name + " in ", env); throw new Error("Could not find name " + name); }
  return (env.globals.get(name) * 8); // 4-byte values
}

function codeGen(stmt: Stmt, env: GlobalEnv) : Array<string> {
  switch(stmt.tag) {
    case "define":
      const locationToStore = [`(i32.const ${envLookup(env, stmt.name)}) ;; ${stmt.name}`];
      var valStmts = codeGenExpr(stmt.value, env);
      return locationToStore.concat(valStmts).concat([`(i64.store)`]);
    case "expr":
      return codeGenExpr(stmt.expr, env);
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
      const initLocationToStore = [`(i32.const ${envLookup(env, stmt.name)}) ;; ${stmt.name}`];
      var valStmts = codeGenExpr(stmt.value, env);
      return initLocationToStore.concat(valStmts).concat([`(i64.store)`]);
    case "if":
      var ifStmts : Array<string> = [];
      const resultFlag = stmt.ifthn[stmt.ifthn.length - 1].tag === "expr"
      ifStmts = ifStmts.concat(codeGenExpr(stmt.ifcond, env));
      ifStmts = ifStmts.concat([`(i32.wrap_i64)`]);
      if (resultFlag) {
        ifStmts = ifStmts.concat([`(if (result i64)`]);
      }
      else {
        ifStmts = ifStmts.concat([`(if`]);
      }
      ifStmts = ifStmts.concat([`(then`]);
      stmt.ifthn.forEach(element => {
        ifStmts = ifStmts.concat(codeGen(element, env));
      });
      ifStmts = ifStmts.concat([`)`]) // closing if-then
      if (stmt.elifcond != null) {
        ifStmts = ifStmts.concat([`(else`]);
        ifStmts = ifStmts.concat(codeGenExpr(stmt.elifcond, env));
        ifStmts = ifStmts.concat([`(i32.wrap_i64)`]);
        if (resultFlag) {
          ifStmts = ifStmts.concat([`(if (result i64)`]);
        }
        else {
          ifStmts = ifStmts.concat([`(if`]);
        }
        ifStmts = ifStmts.concat([`(then`]);
        stmt.elifthn.forEach(element => {
          ifStmts = ifStmts.concat(codeGen(element, env));
        });
        ifStmts = ifStmts.concat([`)`]) // closing elif-then

        if (stmt.else.length > 0) {
          ifStmts = ifStmts.concat([`(else`]);
          stmt.else.forEach(element => {
            ifStmts = ifStmts.concat(codeGen(element, env));
          });
          ifStmts = ifStmts.concat([`)`]) // closing ) corresponding to else
        }
        ifStmts = ifStmts.concat([`)`]) // closing elif-condition
        ifStmts = ifStmts.concat([`)`]) // closing elif-else
      } 
      else if (stmt.else.length > 0) {
        ifStmts = ifStmts.concat([`(else`]);
        stmt.else.forEach(element => {
          ifStmts = ifStmts.concat(codeGen(element, env));
        });
        ifStmts = ifStmts.concat([`)`]) // closing ) corresponding to else
      }
      ifStmts = ifStmts.concat([`)`]) // closing if
      return ifStmts;
  }
}

function codeGenExpr(expr : Expr, env: GlobalEnv) : Array<string> {
  switch(expr.tag) {
    case "builtin1":
      const argStmts = codeGenExpr(expr.arg, env);
      return argStmts.concat([`(call $${expr.name})`]);
    case "builtin2":
      var builtin2ArgStmts = codeGenExpr(expr.arg1, env);
      builtin2ArgStmts = builtin2ArgStmts.concat(codeGenExpr(expr.arg2, env));
      return builtin2ArgStmts.concat([`(call $${expr.name})`]);
    case "literal":
      return ["(i64.const " + expr.value + ")"];
    case "id":
      return [`(i32.const ${envLookup(env, expr.name)})`, `i64.load `];
    case "binop":
      var binOpArgStmts = codeGenExpr(expr.arg1, env);
      binOpArgStmts = binOpArgStmts.concat(codeGenExpr(expr.arg2, env));
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
        unOpStmts = unOpStmts.concat(codeGenExpr(expr.value, env));
        unOpStmts = unOpStmts.concat([`(i64.mul)`]);
      }
      else if (expr.name == "not") {
        var unOpStmts = [`(i64.const 4294967297)`];
        unOpStmts = unOpStmts.concat(codeGenExpr(expr.value, env));
        unOpStmts = unOpStmts.concat([`(i64.xor)`]);
        unOpStmts = unOpStmts.concat([`(i64.const 4294967296)`]);
        unOpStmts = unOpStmts.concat([`(i64.add)`]);
      }
      return unOpStmts;
  }
}
