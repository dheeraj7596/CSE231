import { stat } from "fs";
import { Statement } from "typescript";
import { Stmt, Expr, Type } from "./ast";
import { emptyEnv, GlobalEnv } from "./compiler";

function typeEnvLookup(env : GlobalEnv, name : string) : Type {
  if(!env.types.has(name)) { console.log("Could not find types for " + name + " in types", env); throw new Error("Could not find types for name " + name); }
  return env.types.get(name);
}

function copyEnv(env : GlobalEnv) : GlobalEnv {
  const newEnv = new Map(env.globals);
  var newOffset = env.offset;
  const newTypes = new Map(env.types);
  const newfuncTypes = new Map(env.functypes);
  const newfuncDef = new Map(env.funcDef);
  const newfuncStr = env.funcStr;
  const newclassVarNameTypes = new Map(env.classVarNameTypes);
  const newclassVarNameIndex = new Map(env.classVarNameIndex);
  const newclassindexVarName = new Map(env.classIndexVarName);
  const newclassFuncDefs = new Map(env.classFuncDefs);
  const newclassDef = new Map(env.classDef);

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
    classIndexVarName: newclassindexVarName,
    classFuncDefs: newclassFuncDefs,
    classDef: newclassDef,
    typedAst: env.typedAst
  }
}

function equalTypes(u : Type, t : Type) {
  if(u.tag === "number" && t.tag === "number") { return true; }
  else if(u.tag === "bool" && t.tag === "bool") { return true; }
  else if(u.tag === "class" && t.tag === "class") { return u.name === t.name; }
  else if(u.tag === "class" && t.tag === "none") { return true; }
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
            throw Error("Cannot apply operator `not` on type `" + argType.a.tag + "`");
          }
          else {
            var t : Type = {tag: "bool"};
            return {tag: "uniop", value: argType, name: expr.name, a: t}
          }
        }
        else if (expr.name == "-") {
          if (argType.a.tag != "number") {
            throw Error("Cannot apply operator `-` on type `" + argType.a.tag + "`");
          }
          else {
            var t : Type = {tag: "number"};
            return {tag: "uniop", value: argType, name: expr.name, a: t}
          }
        }
        throw Error("Uniop other than not and - appeared");
      case "id":
        var t : Type = typeEnvLookup(env, expr.name);
        return { tag: "id", name: expr.name, a: t };
      case "builtin1":
        var t : Type = {tag: "number"};
        var argType = tcExpr(expr.arg, env);
        return {tag: "builtin1", name: expr.name, arg: argType, a: t};
      case "binop":
        var arg1Type = tcExpr(expr.arg1, env);
        var arg2Type = tcExpr(expr.arg2, env);
        if (expr.name == "+") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw Error("Cannot apply operator `+` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:arg1Type.a};
        }
        else if (expr.name == "-") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw Error("Cannot apply operator `-` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:arg1Type.a};
        }
        else if (expr.name == "*") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw Error("Cannot apply operator `*` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:arg1Type.a};
        }
        else if (expr.name == "//") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw Error("Cannot apply operator `//` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:arg1Type.a};
        }
        else if (expr.name == "%") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw Error("Cannot apply operator `%` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:arg1Type.a};
        }
        else if (expr.name == "<=") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw Error("Cannot apply operator `<=` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:t};
        }
        else if (expr.name == ">=") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw Error("Cannot apply operator `>=` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:t};
        }
        else if (expr.name == "<") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw Error("Cannot apply operator `<` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:t};
        }
        else if (expr.name == ">") {
          if (arg1Type.a.tag != "number" || arg2Type.a.tag != "number"){
            throw Error("Cannot apply operator `>` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:t};
        }
        else if (expr.name == "==") {
          if ((arg1Type.a.tag == "number" || arg1Type.a.tag == "bool") && (arg2Type.a.tag == "number" || arg2Type.a.tag == "bool")) {
            if (!equalTypes(arg1Type.a, arg2Type.a)){
              throw Error("Cannot apply operator `==` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
            }
          }
          else {
            throw Error("Cannot apply operator `==` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:t};
        }
        else if (expr.name == "!=") {
          if ((arg1Type.a.tag == "number" || arg1Type.a.tag == "bool") && (arg2Type.a.tag == "number" || arg2Type.a.tag == "bool")) {
            if (!equalTypes(arg1Type.a, arg2Type.a)){
              throw Error("Cannot apply operator `!=` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
            }
          }
          else {
            throw Error("Cannot apply operator `!=` on types `" + arg1Type.a.tag + "` and `" + arg2Type.a.tag + "`");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:t};
        }
        else if (expr.name == "is") {
          if ((arg1Type.a.tag != "class" && arg1Type.a.tag != "none") || (arg2Type.a.tag != "class" && arg2Type.a.tag != "none")) {
            throw Error("Cannot apply operator `is` on types other than class or None");
          }
          var t : Type = {tag: "bool"};
          return {tag: "binop", name: expr.name, arg1: arg1Type, arg2: arg2Type, a:t};
        }
        break;
      case "builtin2":
        var t : Type = {tag: "number"};
        var arg1Type = tcExpr(expr.arg1, env);
        var arg2Type = tcExpr(expr.arg2, env);
        return {tag: "builtin2", name: expr.name, arg1: arg1Type, arg2: arg2Type, a: t};
      case "construct":
        if (!env.classDef.has(expr.name) || !env.classFuncDefs.has(expr.name) || !env.classVarNameIndex.has(expr.name) || !env.classIndexVarName.has(expr.name) || !env.classVarNameTypes.has(expr.name)) {
          throw Error("The Class " + expr.name + " is not found while calling constructor");
        }
        return { tag: "construct", name: expr.name, a: { tag: "class", name: expr.name }};
      case "lookup":
        let typedObjExpr = tcExpr(expr.obj, env);
        let objType = typedObjExpr.a;
        if(objType.tag === "class") {
          const className = objType.name;
          console.log("Class name is ", className);
          if (!env.classVarNameTypes.has(className) || !env.classFuncDefs.has(className)) {
            throw Error("Class `" + className + "` not found in classVarNameTypes or classFuncDefs");
          }
          let varNameTypes = env.classVarNameTypes.get(className);
          let funcDefs = env.classFuncDefs.get(className);
          if (varNameTypes.has(expr.name) && funcDefs.has(expr.name)) {
            throw Error("A field and method with same name `" + expr.name + "` cannot exist in a class `" + className + "`");
          }

          if (!varNameTypes.has(expr.name) && !funcDefs.has(expr.name)) {
            throw Error("There is no Field or method named `" + expr.name + "` in class `" + className + "`");
          }
          
          if (varNameTypes.has(expr.name)) {
            let fieldType = varNameTypes.get(expr.name);
            return {
              tag: "lookup",
              obj: typedObjExpr,
              name: expr.name,
              a: fieldType        // useful for compiling o.x.y.z
            }
          }

          if (funcDefs.has(expr.name)) {
            const funcDefStmt = funcDefs.get(expr.name)
            if (funcDefStmt.tag != "funcdef") {
              throw Error("Non-function found in classFuncDefs map. Found " + funcDefStmt.tag);
            }
            const funcReturnType = funcDefStmt.return;
            return {
              tag: "lookup",
              obj: typedObjExpr,
              name: expr.name,
              a: objType        // For function it returns the inner object type
            }
          }
        }
        else {
          throw new Error("Got non-object in field lookup.")
        }
        break;
      case "call":
        console.log("The type of the object ", expr.obj);
        let typedObjExprForCall = tcExpr(expr.obj, env);
        let objTypeForCall = typedObjExprForCall.a;
        if(objTypeForCall.tag === "class") {
          const className = objTypeForCall.name;
          if (!env.classFuncDefs.has(className)) {
            throw Error("Class `" + className + "` not found in classFuncDefs");
          }
          
          let funcDefs = env.classFuncDefs.get(className);

          // Checking whether the function exists in class
          if (!funcDefs.has(expr.name)) {
            throw Error("Method `" + expr.name + "` not found in class `" + className + "`");
          }
          const funcDefStmt = funcDefs.get(expr.name)
          if (funcDefStmt.tag != "funcdef") {
            throw Error("Function not found in funcdef map. Found " + funcDefStmt.tag);
          }

          // Checking whether number of parameters in function is same as number of arguments passed
          if (funcDefStmt.parameters.length != (expr.arguments.length + 1)) {
            throw Error("Expected " + (funcDefStmt.parameters.length - 1) + " arguments; got " + expr.arguments.length);
          }

          // Checking whether each parameter type matches with each argument type.
          const typedArgs : Array<Expr<Type>> = []
          for (let index = 0; index < expr.arguments.length; index++) {
            const argExpr = expr.arguments[index];
            const typedargExpr = tcExpr(argExpr, env);
            const expectedArgType = funcDefStmt.parameters[index + 1].type;
            if (!equalTypes(typedargExpr.a, expectedArgType)) {
              throw Error("Expected type `" + expectedArgType.tag + "`; got type `" + typedargExpr.a.tag + "` in parameter " + index);
            }
            typedArgs.push(typedargExpr);
          }
          const funcReturnType = funcDefStmt.return;
          return {
            tag: "call", 
            obj: typedObjExprForCall,
            name: expr.name, 
            arguments: typedArgs, 
            a:funcReturnType
          };
        } 
        else {
          throw new Error("Got non-object in call expression.")
        }
    }
  }

function typeCheckStmt(stmt: Stmt<any>, env: GlobalEnv) : Stmt<Type> {
  switch(stmt.tag) {
    case "class":
      // Type-checking variable declarations
      const typedDecls : Array<Stmt<Type>> = []
      stmt.decls.forEach(element => {
        typedDecls.push(typeCheckStmt(element, env));
      });
      // Type-checking function declarations
      const typedFuncDefs : Array<Stmt<Type>> = []
      var funcNames = new Set<string>();
      stmt.funcdefs.forEach(element => {
        if (element.tag != "funcdef") {
          throw Error("Non-function inside funcdefs of a class");
        }
        if (funcNames.has(element.name)) {
          throw Error("Duplicate declaration of identifier in same scope: " + element.name); 
        }
        if (element.parameters.length < 1 || element.parameters[0].type.tag != "class" || (element.parameters[0].type.tag == "class" && element.parameters[0].type.name != stmt.name)){
          throw Error("First parameter of the following method must be of the enclosing class: " + element.name);
        }
        funcNames.add(element.name);
        typedFuncDefs.push(typeCheckStmt(element, env));
      });
      if ( stmt.decls.length != env.classIndexVarName.get(stmt.name).size || stmt.decls.length != env.classVarNameIndex.get(stmt.name).size || stmt.decls.length != env.classVarNameTypes.get(stmt.name).size ) {
        throw Error("The size of decls and class specific maps in env is not same.");
      }
      return { 
        tag: "class", 
        name: stmt.name, 
        decls: typedDecls, 
        funcdefs: typedFuncDefs,
        a: {tag: "none"}
      }
    case "define":
      var exprType = tcExpr(stmt.value, env);
      var declType = typeEnvLookup(env, stmt.name);
      if (!equalTypes(declType, exprType.a)) {
        throw Error("Expected type `" + declType.tag + "`; got type `" + exprType.a.tag + "`");
      }
      return {
        tag: "define",
        name: stmt.name,
        value: exprType,
        a: {tag: "none"}
      };
    case "clsdefine":
      var declExprType = tcExpr(stmt.name, env);
      var exprType = tcExpr(stmt.value, env);
      if (!equalTypes(declExprType.a, exprType.a)) {
        throw Error("Expected type `" + declExprType.a.tag + "`; got type `" + exprType.a.tag + "`");
      }
      return {
        tag: "clsdefine",
        name: declExprType,
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
      if (stmt.value.tag != "literal") {
        throw Error("Error a variable must be initialized to a literal.")
      }
      var exprType = tcExpr(stmt.value, env);
      var declType = stmt.type;
      if (!equalLiteralInitTypes(declType, exprType.a)) {
        throw Error("Expected type `" + declType.tag + "`; got type `" + exprType.tag + "`");
      }
      if (declType.tag == "class" && !env.classDef.has(declType.name)) {
        throw Error("Invalid type annotation; there is no class named: " + declType.name);
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
        throw Error("Condition expression cannot be of type `" + ifexprType.a.tag + "`");
      }
      var ifthnTypedStmts : Array<Stmt<Type>> = []
      var elifthnTypedStmts : Array<Stmt<Type>> = []
      var elseTypedStmts : Array<Stmt<Type>> = []
      stmt.ifthn.forEach(element => {
        ifthnTypedStmts.push(typeCheckStmt(element, env));
      });
      if (stmt.elifcond != null) {
        var elifexprType = tcExpr(stmt.elifcond, env);
        if (elifexprType.a.tag != "bool") {
          throw Error("Condition expression cannot be of type `" + elifexprType.a.tag + "`");
        }
        stmt.elifthn.forEach(element => {
          elifthnTypedStmts.push(typeCheckStmt(element, env));
        });
      }
      stmt.else.forEach(element => {
        elseTypedStmts.push(typeCheckStmt(element, env));
      });

      // const ifLastReturnType = stmt.ifthn[stmt.ifthn.length - 1].tag;
      // var elifLastReturnType = ifLastReturnType;
      // if (stmt.elifthn.length) {
      //   elifLastReturnType = stmt.elifthn[stmt.elifthn.length - 1].tag
      // }
      // var elseLastReturnType = ifLastReturnType;
      // if (stmt.else.length) {
      //   elseLastReturnType = stmt.else[stmt.else.length - 1].tag;
      // }
      
      // if (ifLastReturnType != elifLastReturnType || ifLastReturnType != elseLastReturnType) {
      //   throw Error("If-Elif-Else body should return same types");
      // }
      
      return {
        tag: "if",
        ifcond: ifexprType, 
        ifthn: ifthnTypedStmts, 
        elifcond: elifexprType, 
        elifthn: elifthnTypedStmts, 
        else: elseTypedStmts,
        a: {tag: "none"},
      }
    case "while":
      var whileexprType = tcExpr(stmt.cond, env);
      if (whileexprType.a.tag != "bool") {
         throw Error("Condition expression cannot be of type `" + whileexprType.a.tag + "`");
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
      var params = new Set<string>();
      if (returnType.tag == "class" && !env.classDef.has(returnType.name)) {
        throw Error("Invalid type annotation; there is no class named: " + returnType.name);
      }
      stmt.parameters.forEach(element => {
        params.add(element.name);
        if (element.type.tag == "none") {
          throw Error("Function parameter can't be of type none");
        }
        else if (element.type.tag == "class" && !env.classDef.has(element.type.name)) {
          throw Error("Invalid type annotation; there is no class named: " + element.type.name);
        }
        localEnv.set(element.name, element.type);
      });
      stmt.decls.forEach(element => {
        if (element.tag == "init") {
          if (params.has(element.name)) {
            throw Error("Duplicate declaration of identifier in same scope: " + element.name);
          }
          params.add(element.name);
          localEnv.set(element.name, element.type);
        }
      });
      
      // wrapping localEnv into GlobalEnv object
      const copiedGlobalEnv = copyEnv(env);
      copiedGlobalEnv.types = localEnv;

      // checking declarations
      const typedVarDeclsInFunction : Array<Stmt<Type>> = []
      stmt.decls.forEach(element => {
        typedVarDeclsInFunction.push(typeCheckStmt(element, copiedGlobalEnv));
      });

      // checking body statements
      const typedBody : Array<Stmt<Type>> = []
      stmt.body.forEach(element => {
        typedBody.push(typeCheckStmt(element, copiedGlobalEnv));
      });

      // checking returntype mentioned is same as returntype in the code.
      tcReturnType(typedBody, returnType);

      env.functypes.set(funcName, localEnv);
      return { 
        tag: "funcdef", 
        name: stmt.name, 
        decls: typedVarDeclsInFunction, 
        parameters: stmt.parameters, 
        body: typedBody, 
        return: stmt.return,
        a: {tag: "none"}
      }
    case "return":
      var typedExpr = tcExpr(stmt.value, env);
      return {
        tag: "return", 
        value: typedExpr,
        a: typedExpr.a
      }
    case "pass":
      return {
        tag: "pass", 
        a: {tag: "none"}
      }
  }
}

function tcReturnTypeHelperFunction(a : Type, b : Type): Type {
  if (a != null && !equalTypes(a, b)) {
    throw Error("Multiple return statements with different return types " + a.tag + " " + b.tag);
  }
  return b;
}

function tcReturnType(typedBody: Array<Stmt<Type>>, returnType:Type) : void {
  var returnTypeInCode : Type = null;

  typedBody.forEach(statement => {
    if (statement.tag == "return") {
      returnTypeInCode = tcReturnTypeHelperFunction(returnTypeInCode, statement.a);
    }
    else if (statement.tag == "if") {
      var hasReturn = false;
      statement.ifthn.forEach(element => {
        if (element.tag == "return") {
          hasReturn = true;
          returnTypeInCode = tcReturnTypeHelperFunction(returnTypeInCode, element.a);
        }
      });

      statement.else.forEach(element => {
        if (element.tag == "return") {
          if (!hasReturn) {
            throw Error("All if-else blocks should have a return statement");
          }
          hasReturn = true;
          returnTypeInCode = tcReturnTypeHelperFunction(returnTypeInCode, element.a);
        }
      });
    }
  });
  
  if (returnTypeInCode == null) {
    returnTypeInCode = {tag: "none"};
  }

  if (!equalTypes(returnType, returnTypeInCode)) {
    throw Error("Expected type `" + returnType.tag + "`; got type `" + returnTypeInCode.tag + "`");
  } 
}

function checkWhetherInitFirst(stmts: Array<Stmt<any>>) : void {
  var initStmts : Array<Stmt<any>> = [];
  var noninitStmts : Array<Stmt<any>> = [];

  stmts.forEach(element => {
    if (element.tag == "class" || element.tag == "init") {
      if (noninitStmts.length > 0) {
        throw Error("Variable declarations should be before any operations");
      }
      initStmts.push(element);
    }
    else {
      noninitStmts.push(element);
    }
  });
}

function checkDuplicateGlobalVars(stmts: Array<Stmt<any>>) : void {
  var variables = new Set<string>();

  stmts.forEach(element => {
    if (element.tag == "class" || element.tag == "init") {
      if (variables.has(element.name)) {
        throw Error("Duplicate declaration of identifier in same scope: " + element.name);
      }
      variables.add(element.name);
    }
  });
}

export function typeCheck(stmts: Array<Stmt<any>>, env: GlobalEnv) : Array<Stmt<Type>> {
  checkWhetherInitFirst(stmts);
  checkDuplicateGlobalVars(stmts);
  const newstmts : Array<Stmt<Type>> = [];
  stmts.forEach(stmt => {
    newstmts.push(typeCheckStmt(stmt, env));
  });
  return newstmts;
}