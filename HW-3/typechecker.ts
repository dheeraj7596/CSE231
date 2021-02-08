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

function equalLiteralInitTypes(u : Type, t : Type) {
  if(u.tag === "number" && t.tag === "number") { return true; }
  else if(u.tag === "bool" && t.tag === "bool") { return true; }
  else if(u.tag === "class" && t.tag === "none") { return true; }
  else { return false; }
}

function tcExpr(expr : Expr<any>, env : GlobalEnv) : Expr<Type> {
    switch(expr.tag) {
      case "literal":
        return { tag: "literal", value: expr.value, type: expr.type, a: expr.type };
      case "uniop":
        var argType = tcExpr(expr.value, env);
        if (expr.name == "not") {
          if (argType.a.tag != "bool") {
            throw("Cannot apply operator `not` on type `" + argType.a.tag + "`");
          }
          else {
            var t : Type = {tag: "bool"};
            return {tag: "uniop", value: expr.value, name: expr.name, a: t}
          }
        }
        else if (expr.name == "-") {
          if (argType.a.tag != "number") {
            throw("Cannot apply operator `-` on type `" + argType.a.tag + "`");
          }
          else {
            var t : Type = {tag: "number"};
            return {tag: "uniop", value: expr.value, name: expr.name, a: t}
          }
        }
        throw Error("Uniop other than not and - appeared");
      case "id":
        var t : Type = typeEnvLookup(env, expr.name);
        return { tag: "id", name: expr.name, a: t };
      case "builtin1":
        var t : Type = {tag: "number"};
        return {tag: "builtin1", name: expr.name, arg: expr.arg, a: t};
      case "binop":
        var arg1Type = tcExpr(expr.arg1, env);
        var arg2Type = tcExpr(expr.arg2, env);
        if (expr.name == "+") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw("Cannot apply operator `+` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:arg1Type.a};
        }
        else if (expr.name == "-") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw("Cannot apply operator `-` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:arg1Type.a};
        }
        else if (expr.name == "*") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw("Cannot apply operator `*` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:arg1Type.a};
        }
        else if (expr.name == "//") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw("Cannot apply operator `//` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:arg1Type.a};
        }
        else if (expr.name == "%") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw("Cannot apply operator `%` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:arg1Type.a};
        }
        else if (expr.name == "<=") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw("Cannot apply operator `<=` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:t};
        }
        else if (expr.name == ">=") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw("Cannot apply operator `>=` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:t};
        }
        else if (expr.name == "<") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw("Cannot apply operator `<` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:t};
        }
        else if (expr.name == ">") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw("Cannot apply operator `>` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:t};
        }
        else if (expr.name == "==") {
          if ((arg1Type.a.tag == "number" || arg1Type.a.tag == "bool") && (arg2Type.a.tag == "number" || arg2Type.a.tag == "bool")) {
            if (!equalTypes(arg1Type.a, arg2Type.a)){
              throw("Cannot apply operator `==` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
            }
          }
          else {
            throw("Cannot apply operator `==` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:t};
        }
        else if (expr.name == "!=") {
          if ((arg1Type.a.tag == "number" || arg1Type.a.tag == "bool") && (arg2Type.a.tag == "number" || arg2Type.a.tag == "bool")) {
            if (!equalTypes(arg1Type.a, arg2Type.a)){
              throw("Cannot apply operator `!=` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
            }
          }
          else {
            throw("Cannot apply operator `!=` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a:t};
        }
        break;
      case "builtin2":
        var t : Type = {tag: "number"};
        return {tag: "builtin2", name: expr.name, arg1: expr.arg1, arg2: expr.arg2, a: t};
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
          if (!equalTypes(argtype.a, expectedArgType)) {
            throw Error("Expected type `" + expectedArgType.tag + "`; got type `" + argtype.a.tag + "` in parameter " + index);
          }
        }
        return {tag: "call", name: expr.name, arguments: expr.arguments, a:funcReturnType};
    }
  }

function typeCheckStmt(stmt: Stmt<any>, env: GlobalEnv) : Stmt<Type> {
  switch(stmt.tag) {
    case "define":
      var exprType = tcExpr(stmt.value, env);
      var declType = typeEnvLookup(env, stmt.name);
      if (!equalTypes(declType, exprType.a)) {
        throw("Expected type `" + declType.tag + "`; got type `" + exprType.tag + "`");
      }
      return {
        tag: "define",
        name: stmt.name,
        value: exprType,
        a: {tag: "none"}
      };
    case "expr":
      var type = tcExpr(stmt.expr, env);
      return {
        tag: "expr",
        expr: type,
        a: type.a
      }
    case "init":
      var exprType = tcExpr(stmt.value, env);
      var declType = stmt.type;
      if (!equalLiteralInitTypes(declType, exprType.a)) {
        throw("Expected type `" + declType.tag + "`; got type `" + exprType.tag + "`");
      }
      return {
        tag: "init",
        name: stmt.name,
        type: stmt.type,
        value: exprType,
        a: {tag: "none"},
      }
    case "if":
      var ifexprType = tcExpr(stmt.ifcond, env);
      if (ifexprType.a.tag != "bool") {
        throw("Condition expression cannot be of type `" + ifexprType.a.tag + "`");
      }
      stmt.ifthn.forEach(element => {
        typeCheckStmt(element, env);
      });
      if (stmt.elifcond != null) {
        var elifexprType = tcExpr(stmt.elifcond, env);
        if (elifexprType.a.tag != "bool") {
          throw("Condition expression cannot be of type `" + elifexprType.a.tag + "`");
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
      
      return {
        tag: "if",
        ifcond: stmt.ifcond, 
        ifthn: stmt.ifthn, 
        elifcond: stmt.elifcond, 
        elifthn: stmt.elifthn, 
        else: stmt.else,
        a: {tag: "none"},
      }
    case "while":
      var whileexprType = tcExpr(stmt.cond, env);
      if (whileexprType.a.tag != "bool") {
        throw("Condition expression cannot be of type `" + whileexprType.a.tag + "`");
      }
      stmt.body.forEach(element => {
        typeCheckStmt(element, env);
      });
      return {
        tag: "while",
        cond: stmt.cond, 
        body: stmt.body,
        a: {tag: "none"}
      }
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
      return { 
        tag: "funcdef", 
        name: stmt.name, 
        decls: stmt.decls, 
        parameters: stmt.parameters, 
        body: stmt.body , 
        return: stmt.return,
        a: {tag: "none"}
      }
  }
}

function isDecl(s : Stmt<any>) {
  // Add class check here
  return s.tag === "init";
}

export function typeCheck(stmts: Array<Stmt<any>>, env: GlobalEnv) : Array<Stmt<Type>> {
  const newstmts : Array<Stmt<Type>> = [];
  // let index = 0;

  // while(isDecl(stmts[index])) {
  //   let s = stmts[index];
  //   if(s.tag === "init") {
      
  //   }
  //   // Add class handling here
  // }
  stmts.forEach(stmt => {
    newstmts.push(typeCheckStmt(stmt, env));
  });
  return newstmts;
}