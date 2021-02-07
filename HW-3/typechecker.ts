import { Stmt, Expr, Type } from "./ast";
import { emptyEnv, GlobalEnv } from "./compiler";

function typeEnvLookup(env : GlobalEnv, name : string) : Type {
  if(!env.types.has(name)) { console.log("Could not find types for " + name + " in types", env); throw new Error("Could not find types for name " + name); }
  return env.types.get(name);
}

function equalTypes(u : Type, t : Type) {
  if(u.tag === "number" && t.tag === "number") { return true; }
  else if(u.tag === "bool" && t.tag === "bool") { return true; }
  else if(u.tag === "class" && t.tag === "class") { return u.name === t.name; }
  else if(u.tag === "none" && t.tag === "none") { return true; }
  else { return false; }
}

function tcExpr(expr : Expr, env : GlobalEnv) : Type {
    switch(expr.tag) {
      case "literal":
        return expr.type;
      case "uniop":
        var argType = tcExpr(expr.value, env);
        if (expr.name == "not" && argType.tag != "bool") {
          throw("Cannot apply operator `not` on type `" + argType + "`");
        }
        else if (expr.name == "-" && argType.tag != "number") {
          throw("Cannot apply operator `-` on type `" + argType + "`");
        }
        return argType;
      case "id":
        return typeEnvLookup(env, expr.name);
      case "binop":
        var arg1Type = tcExpr(expr.arg1, env);
        var arg2Type = tcExpr(expr.arg2, env);
        if (expr.name == "+") {
          if (arg1Type.tag != "number" || arg2Type.tag != "number"){
            throw("Cannot apply operator `+` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "-") {
          if (arg1Type.tag != "number" || arg2Type.tag != "number"){
            throw("Cannot apply operator `-` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "*") {
          if (arg1Type.tag != "number" || arg2Type.tag != "number"){
            throw("Cannot apply operator `*` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "//") {
          if (arg1Type.tag != "number" || arg2Type.tag != "number"){
            throw("Cannot apply operator `//` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "%") {
          if (arg1Type.tag != "number" || arg2Type.tag != "number"){
            throw("Cannot apply operator `%` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "<=") {
          if (arg1Type.tag != "number" || arg2Type.tag != "number"){
            throw("Cannot apply operator `<=` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return {tag: "bool"};
        }
        else if (expr.name == ">=") {
          if (arg1Type.tag != "number" || arg2Type.tag != "number"){
            throw("Cannot apply operator `>=` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return {tag: "bool"};
        }
        else if (expr.name == "<") {
          if (arg1Type.tag != "number" || arg2Type.tag != "number"){
            throw("Cannot apply operator `<` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return {tag: "bool"};
        }
        else if (expr.name == ">") {
          if (arg1Type.tag != "number" || arg2Type.tag != "number"){
            throw("Cannot apply operator `>` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return {tag: "bool"};
        }
        else if (expr.name == "==") {
          if (!equalTypes(arg1Type, arg2Type)){
            throw("Cannot apply operator `==` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return {tag: "bool"};
        }
        else if (expr.name == "!=") {
          if (!equalTypes(arg1Type, arg2Type)){
            throw("Cannot apply operator `!=` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return {tag: "bool"};
        }
        break;
      case "call":
        const funcDefStmt = env.funcDef.get(expr.name)
        if (funcDefStmt.tag != "funcdef") {
          throw Error("Function not found in funcdef map. Found " + funcDefStmt.tag);
        }
        if (funcDefStmt.parameters.length != expr.arguments.length) {
          throw Error("Expected " + funcDefStmt.parameters.length + " arguments; got " + expr.arguments.length);
        }
        const funcReturnType = funcDefStmt.return;
        for (let index = 0; index < expr.arguments.length; index++) {
          const argExpr = expr.arguments[index];
          const argtype = tcExpr(argExpr, env);
          const expectedArgType = funcDefStmt.parameters[index].type;
          if (!equalTypes(argtype, expectedArgType)) {
            throw Error("Expected type `" + expectedArgType.tag + "`; got type `" + argtype.tag + "` in parameter " + index);
          }
        }
        return funcReturnType;
    }
  }

function typeCheckStmt(stmt: Stmt, env: GlobalEnv) : void {
  switch(stmt.tag) {
    case "define":
      var exprType = tcExpr(stmt.value, env);
      var declType = typeEnvLookup(env, stmt.name);
      if (!equalTypes(declType, exprType)) {
        throw("Expected type `" + declType.tag + "`; got type `" + exprType.tag + "`");
      }
      break
    case "expr":
      var type = tcExpr(stmt.expr, env);
      break
    case "init":
      var exprType = tcExpr(stmt.value, env);
      var declType = stmt.type;
      if (!equalTypes(declType, exprType)) {
        throw("Expected type `" + declType.tag + "`; got type `" + exprType.tag + "`");
      }
      break
    case "if":
      var ifexprType = tcExpr(stmt.ifcond, env);
      if (ifexprType.tag != "bool") {
        throw("Condition expression cannot be of type `" + ifexprType + "`");
      }
      stmt.ifthn.forEach(element => {
        typeCheckStmt(element, env);
      });
      if (stmt.elifcond != null) {
        var elifexprType = tcExpr(stmt.elifcond, env);
        if (elifexprType.tag != "bool") {
          throw("Condition expression cannot be of type `" + elifexprType + "`");
        }
        stmt.elifthn.forEach(element => {
          typeCheckStmt(element, env);
        });
      }
      stmt.else.forEach(element => {
        typeCheckStmt(element, env);
      });

      const ifLastReturnType = stmt.ifthn[stmt.ifthn.length - 1].tag;
      var elifLastReturnType = ifLastReturnType;
      if (stmt.elifthn.length) {
        elifLastReturnType = stmt.elifthn[stmt.elifthn.length - 1].tag
      }
      var elseLastReturnType = ifLastReturnType;
      if (stmt.else.length) {
        elseLastReturnType = stmt.else[stmt.else.length - 1].tag;
      }
      
      if (ifLastReturnType != elifLastReturnType || ifLastReturnType != elseLastReturnType) {
        throw("If-Elif-Else body should return same types");
      }
      
      break;
    case "while":
      var whileexprType = tcExpr(stmt.cond, env);
      if (whileexprType.tag != "bool") {
        throw("Condition expression cannot be of type `" + whileexprType + "`");
      }
      stmt.body.forEach(element => {
        typeCheckStmt(element, env);
      });
      break;
    case "funcdef":
      const returnType = stmt.return;
      const funcName = stmt.name;
      var localEnv = new Map(env.types);
      stmt.decls.forEach(element => {
        if (element.tag == "init") {
          localEnv.set(element.name, element.type);
        }
      });
      stmt.parameters.forEach(element => {
        localEnv.set(element.name, element.type);
      });

      // wrapping localEnv into GlobalEnv object
      const wrappedLocalEnv = emptyEnv;
      wrappedLocalEnv.types = localEnv;
      wrappedLocalEnv.functypes = env.functypes;
      wrappedLocalEnv.funcDef = env.funcDef;

      // checking declarations
      stmt.decls.forEach(element => {
        typeCheckStmt(element, wrappedLocalEnv);
      });

      // checking body statements
      
      // var returnTypeInCode = "none";
      // stmt.body.forEach(element => {
      //   if (element.tag == "return") {
      //     returnTypeInCode = tcExpr(element.value, wrappedLocalEnv);
      //   }
      //   typeCheckStmt(element, wrappedLocalEnv);
      // });

      // // checking returntype mentioned is same as returntype in the code.
      // if (!equalTypes(returnTypeInCode, returnType)) {
      //   throw("Expected type `" + returnType + "`; got type `" + returnTypeInCode + "`");
      // }

      // setting the type map into functypes
      env.functypes.set(funcName, localEnv);
      break;
  }
}

export function typeCheck(stmts: Array<Stmt>, env: GlobalEnv) : void {
  stmts.forEach(stmt => {
    typeCheckStmt(stmt, env);
  });  
}