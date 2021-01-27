import { Stmt, Expr, Type } from "./ast";
import { emptyEnv, GlobalEnv } from "./compiler";

function typeEnvLookup(env : GlobalEnv, name : string) : Type {
  if(!env.types.has(name)) { console.log("Could not find types for " + name + " in types", env); throw new Error("Could not find types for name " + name); }
  return env.types.get(name);
}

function tcExpr(expr : Expr, env : GlobalEnv) : Type {
    switch(expr.tag) {
      case "literal":
        return expr.type;
      case "uniop":
        var argType = tcExpr(expr.value, env);
        if (expr.name == "not" && argType != "bool") {
          throw("Cannot apply operator `not` on type `" + argType + "`");
        }
        else if (expr.name == "-" && argType != "int") {
          throw("Cannot apply operator `-` on type `" + argType + "`");
        }
        return argType;
      case "id":
        return typeEnvLookup(env, expr.name);
      case "binop":
        var arg1Type = tcExpr(expr.arg1, env);
        var arg2Type = tcExpr(expr.arg2, env);
        if (expr.name == "+") {
          if (arg1Type != "int" || arg2Type != "int"){
            throw("Cannot apply operator `+` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "-") {
          if (arg1Type != "int" || arg2Type != "int"){
            throw("Cannot apply operator `-` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "*") {
          if (arg1Type != "int" || arg2Type != "int"){
            throw("Cannot apply operator `*` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "//") {
          if (arg1Type != "int" || arg2Type != "int"){
            throw("Cannot apply operator `//` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "%") {
          if (arg1Type != "int" || arg2Type != "int"){
            throw("Cannot apply operator `%` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "<=") {
          if (arg1Type != "int" || arg2Type != "int"){
            throw("Cannot apply operator `<=` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return "bool";
        }
        else if (expr.name == ">=") {
          if (arg1Type != "int" || arg2Type != "int"){
            throw("Cannot apply operator `>=` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return "bool";
        }
        else if (expr.name == "<") {
          if (arg1Type != "int" || arg2Type != "int"){
            throw("Cannot apply operator `<` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return "bool";
        }
        else if (expr.name == ">") {
          if (arg1Type != "int" || arg2Type != "int"){
            throw("Cannot apply operator `>` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return "bool";
        }
        else if (expr.name == "==") {
          if (arg1Type != arg2Type){
            throw("Cannot apply operator `==` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return "bool";
        }
        else if (expr.name == "!=") {
          if (arg1Type != arg2Type){
            throw("Cannot apply operator `!=` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return "bool";
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
          if (argtype != expectedArgType) {
            throw Error("Expected type `" + expectedArgType + "`; got type `" + argtype + "` in parameter " + index);
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
      if (declType != exprType) {
        throw("Expected type `" + declType + "`; got type `" + exprType + "`");
      }
      break
    case "expr":
      var type = tcExpr(stmt.expr, env);
      break
    case "init":
      var exprType = tcExpr(stmt.value, env);
      var declType = stmt.type;
      if (declType != exprType) {
        throw("Expected type `" + declType + "`; got type `" + exprType + "`");
      }
      break
    case "if":
      var ifexprType = tcExpr(stmt.ifcond, env);
      if (ifexprType != "bool") {
        throw("Condition expression cannot be of type `" + ifexprType + "`");
      }
      stmt.ifthn.forEach(element => {
        typeCheckStmt(element, env);
      });
      if (stmt.elifcond != null) {
        var elifexprType = tcExpr(stmt.elifcond, env);
        if (elifexprType != "bool") {
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
      if (whileexprType != "bool") {
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
      // if (returnTypeInCode != returnType) {
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