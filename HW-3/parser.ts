import {parser} from "lezer-python";
import {TreeCursor} from "lezer-tree";
import {Expr, Stmt, Parameter} from "./ast";

export function traverseExpr(c : TreeCursor, s : string) : Expr {
  switch(c.type.name) {
    case "Number":
      return {
        tag: "literal",
        value: Number(s.substring(c.from, c.to)),
        type: {tag: "number"}
      }
    case "Boolean":
      const boolVal = s.substring(c.from, c.to);
      if (boolVal == "True") {
        return{
          tag: "literal",
          value: Number(1) + 2**32, // Making the 33rd bit 1 for bool.
          type: {tag: "bool"}
        }
      } else if (boolVal == "False") {
        return{
          tag: "literal",
          value: Number(0) + 2**32, // Making the 33rd bit 1 for bool.
          type: {tag: "bool"}
        }
      } else {
        throw new Error('Boolean value which is not True/False observed.');
      }
      
    case "VariableName":
      return {
        tag: "id",
        name: s.substring(c.from, c.to)
      }
    case "CallExpression":
      c.firstChild();
      const callName = s.substring(c.from, c.to);
      if (callName == "abs" || callName == "print") {
        c.nextSibling(); // go to arglist
        c.firstChild(); // go into arglist
        c.nextSibling(); // find single argument in arglist
        const arg = traverseExpr(c, s);
        c.parent(); // pop arglist
        c.parent(); // pop CallExpression
        return {
          tag: "builtin1",
          name: callName,
          arg: arg
        };
      }
      else if (callName == "max" || callName == "min" || callName == "pow"){
        c.nextSibling(); // go to arglist
        c.firstChild(); // go into arglist
        c.nextSibling(); // find first argument in arglist
        const arg1 = traverseExpr(c, s);
        c.nextSibling();
        c.nextSibling(); // find second argument in arglist
        const arg2 = traverseExpr(c, s);
        c.parent(); // pop arglist
        c.parent(); // pop CallExpression
        return {
          tag: "builtin2",
          name: callName,
          arg1: arg1,
          arg2: arg2
        };
      }
      else {
        c.nextSibling(); // go to arglist
        c.firstChild(); // go into arglist, handling (
        c.nextSibling(); // find first argument in arglist
        const args: Expr[] = [];
        while (c.node.name != ")") {
          const arg = traverseExpr(c, s);
          c.nextSibling(); // comma or )
          if (c.node.name == ",") {
            c.nextSibling();
          }
          console.log("Pushed argument " + arg.tag);
          args.push(arg);
        }
        c.parent(); // pop arglist
        c.parent(); // pop CallExpression

        return {
          tag: "call",
          name: callName,
          arguments: args,
        };
      }
    case "BinaryExpression":
      c.firstChild();
      const arg1 = traverseExpr(c, s); // get first argument
      c.nextSibling(); // go to the operation
      const binop = s.substring(c.from, c.to);
      c.nextSibling();
      const arg2 = traverseExpr(c, s); // get second argument
      c.parent(); // pop BinaryExpression
      return {
        tag: "binop",
        name: binop,
        arg1: arg1,
        arg2: arg2
      };
    case "UnaryExpression":
      c.firstChild();
      const op = s.substring(c.from, c.to);
      c.nextSibling(); // go to the expression
      const arg0 = traverseExpr(c, s); // get the only argument
      c.parent(); // pop UnaryExpression
      return {
        tag: "uniop", 
        value: arg0, 
        name: op
      }; 
    default:
      throw new Error("Could not parse expr at " + c.from + " " + c.to + ": " + s.substring(c.from, c.to));
  }
}

export function traverseStmt(c : TreeCursor, s : string) : Stmt {
  switch(c.node.type.name) {
    case "AssignStatement":
      c.firstChild(); // go to name
      const name = s.substring(c.from, c.to);
      c.nextSibling(); // go to equals or TypeDef
      const equalsOrType = s.substring(c.from, c.to);
      console.log("Type is here", equalsOrType);
      if (equalsOrType == "=") {
        c.nextSibling(); // go to value
        const value = traverseExpr(c, s);
        c.parent();
        return {
          tag: "define",
          name: name,
          value: value
        }
      } else {
        c.firstChild();
        c.nextSibling();
        const type = s.substring(c.from, c.to);
        c.parent();
        c.nextSibling();
        c.nextSibling()
        const value = traverseExpr(c, s);
        c.parent();
        if (type == "bool") {
          return {
            tag: "init",
            name: name,
            type: {tag: "bool"},
            value: value
          }
        }  
        else if (type == "int") {
          return {
            tag: "init",
            name: name,
            type: {tag: "number"},
            value: value
          }
        }
        else {
          throw Error("Type other than bool and int appeared.")
        }
      }
    case "ExpressionStatement":
      c.firstChild();
      const expr = traverseExpr(c, s);
      c.parent(); // pop going into stmt
      return { tag: "expr", expr: expr }
    case "IfStatement":
      var ifexpr = null;
      const ifBodyStmts = [];
      var elifexpr = null;
      const elifBodyStmts = [];
      const elseBodyStmts = [];
      var elifFlag = false;
      var elseFlag = false;

      c.firstChild(); // if
      c.nextSibling(); // if condition expression
      ifexpr = traverseExpr(c, s);
      c.nextSibling(); // if body
      c.firstChild(); // colon
      c.nextSibling(); // starting statement
      do {
        ifBodyStmts.push(traverseStmt(c, s));
      } while(c.nextSibling())
      c.parent(); // Getting back to body
      if (c.nextSibling()) {
        if (c.type.name == "elif") {
          elifFlag = true
          c.nextSibling(); // elif condition expression
          elifexpr = traverseExpr(c, s);
          c.nextSibling(); // elif body
          c.firstChild(); // colon
          c.nextSibling(); // starting statement
          do {
            elifBodyStmts.push(traverseStmt(c, s));
          } while(c.nextSibling())
          c.parent(); // Getting back to body
        }  
        else if (c.type.name == "else") {
          elseFlag = true;
          c.nextSibling(); // else body
          c.firstChild(); // colon
          c.nextSibling(); // starting statement
          do {
            elseBodyStmts.push(traverseStmt(c, s));
          } while(c.nextSibling())
          c.parent(); // Getting back to body
        }  
      }
      if (c.nextSibling()) {
        if (c.type.name == "else") {
          c.nextSibling(); // else body
          c.firstChild(); // colon
          c.nextSibling(); // starting statement
          do {
            elseBodyStmts.push(traverseStmt(c, s));
          } while(c.nextSibling())
          c.parent(); // Getting back to body
        }  
      }
      c.parent();

      console.log("ifexpr", ifexpr)
      console.log("ifBodyStmts")
      ifBodyStmts.forEach(element => {
        console.log(element)
      });
      console.log("elifexpr", elifexpr)
      console.log("elifBodyStmts")
      elifBodyStmts.forEach(element => {
        console.log(element)
      });
      console.log("elseBodyStmts")
      elseBodyStmts.forEach(element => {
        console.log(element)
      });

      if (ifBodyStmts.length == 0) {
        throw("If Body cannot be empty");
      } else if (elifFlag && elifBodyStmts.length == 0) {
        throw("Elif Body cannot be empty");
      } else if (elseFlag && elseBodyStmts.length == 0) {
        throw("Else Body cannot be empty");
      }

      return {
        tag: "if",
        ifcond: ifexpr,
        ifthn: ifBodyStmts,
        elifcond: elifexpr,
        elifthn: elifBodyStmts,
        else: elseBodyStmts
      }
    case "WhileStatement":
      c.firstChild(); // while
      c.nextSibling(); // while condition expression
      const whileexpr = traverseExpr(c, s);
      const whileBodyStmts = []
      c.nextSibling(); // while body
      c.firstChild(); // colon
      c.nextSibling(); // starting statement
      do {
        whileBodyStmts.push(traverseStmt(c, s));
      } while(c.nextSibling())
      c.parent(); // Getting back to body
      c.parent();

      if (whileBodyStmts.length == 0) {
        throw("While Body cannot be empty");
      }
      
      return {
        tag: "while",
        cond: whileexpr, 
        body: whileBodyStmts
      }
    case "FunctionDefinition":
      c.firstChild();  // Focus on def
      c.nextSibling(); // Focus on name of function
      const funcName = s.substring(c.from, c.to);
      c.nextSibling(); // Focus on ParamList
      var parameters = traverseParameters(c, s);
      c.nextSibling(); // Focus on returntype or Body
      var returntype = "none";
      if(c.type.name == "TypeDef") {
        c.firstChild();
        returntype = s.substring(c.from, c.to);
        c.parent();
        c.nextSibling(); // Focus on Body
      } 

      if (returntype != "int" && returntype != "bool" && returntype != "none") {
        throw Error(`Unknown function return type ` + returntype);
      }
      
      c.firstChild();  // Focus on :
      c.nextSibling(); // starting statement
      
      const decls: Stmt[] = []
      const funcBodyStmts: Stmt[] = []
      const allBodyStmts = []
      do {
        console.log("Traversing statement " + s.substring(c.from, c.to));
        allBodyStmts.push(traverseStmt(c, s));
      } while(c.nextSibling())

      allBodyStmts.forEach(element => {
        if (element.tag == "init") {
          if (funcBodyStmts.length > 0){
            throw Error("Declaration of variables after function body is not allowed.")
          }

          decls.push(element);
        }
        else {
          funcBodyStmts.push(element);
        }
      });

      c.parent();      // Pop to Body
      c.parent();      // Pop to FunctionDefinition
      if (returntype == "none") {
        return {
          tag: "funcdef",
          name: funcName,
          decls: decls,
          parameters: parameters,
          body: funcBodyStmts,
          return: {tag: "none"}
        }
      } else if (returntype == "int") {
        return {
          tag: "funcdef",
          name: funcName,
          decls: decls,
          parameters: parameters,
          body: funcBodyStmts,
          return: {tag: "number"}
        }
      } else if (returntype == "bool") {
        return {
          tag: "funcdef",
          name: funcName,
          decls: decls,
          parameters: parameters,
          body: funcBodyStmts,
          return: {tag: "bool"}
        }
      }
      throw Error("Reached a place that shouldn't actually reach in Parser for FunctionDef");
    case "ReturnStatement":
      c.firstChild();  // Focus return keyword
      c.nextSibling(); // Focus expression
      var value = traverseExpr(c, s);
      c.parent();
      return { tag: "return", value: value };
    default:
      throw new Error("Could not parse stmt at " + c.node.from + " " + c.node.to + ": " + s.substring(c.from, c.to));
  }
}


export function traverseParameters(c : TreeCursor, s : string) : Array<Parameter> {
  c.firstChild();  // Focuses on open paren
  c.nextSibling(); // Focuses on a VariableName
  const params: Parameter[] = [];
  while (c.type.name != ")") {
    let name = s.substring(c.from, c.to);
    c.nextSibling(); // Focus on TypeDef
    c.firstChild(); // Colon
    c.nextSibling(); // variable type
    let type = s.substring(c.from, c.to);
    if (type != "int" && type != "bool") {
      throw Error(`Function parameter of unknown type ` + type);
    }
    console.log("Added parameter: ", {
      name: name,
      type: type
    })
    if (type == "int") {
      params.push({
        name: name,
        type: {tag: "number"}
      })  
    }
    else if (type == "bool") {
      params.push({
        name: name,
        type: {tag: "bool"}
      })
    }
    c.parent();
    c.nextSibling();
    if (c.type.name == ",") {
      c.nextSibling();
    }
  }
  c.parent();      // Pop to ParamList
  return params;
}


export function traverse(c : TreeCursor, s : string) : Array<Stmt> {
  switch(c.node.type.name) {
    case "Script":
      const stmts = [];
      c.firstChild();
      do {
        stmts.push(traverseStmt(c, s));
      } while(c.nextSibling())
      console.log("traversed " + stmts.length + " statements ", stmts, "stopped at " , c.node);
      return stmts;
    default:
      throw new Error("Could not parse program at " + c.node.from + " " + c.node.to);
  }
}
export function parse(source : string) : Array<Stmt> {
  const t = parser.parse(source);
  return traverse(t.cursor(), source);
}
