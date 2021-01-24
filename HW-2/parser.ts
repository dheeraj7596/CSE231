import {parser} from "lezer-python";
import {TreeCursor} from "lezer-tree";
import {Expr, Stmt} from "./ast";

export function traverseExpr(c : TreeCursor, s : string) : Expr {
  switch(c.type.name) {
    case "Number":
      return {
        tag: "literal",
        value: Number(s.substring(c.from, c.to)),
        type: "int"
      }
    case "Boolean":
      const boolVal = s.substring(c.from, c.to);
      if (boolVal == "True") {
        return{
          tag: "literal",
          value: Number(1) + 2**32, // Making the 33rd bit 1 for bool.
          type: "bool"
        }
      } else if (boolVal == "False") {
        return{
          tag: "literal",
          value: Number(0) + 2**32, // Making the 33rd bit 1 for bool.
          type: "bool"
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
      else {
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
        if (type == "bool" || type == "int") {
          return {
            tag: "init",
            name: name,
            type: type,
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
    default:
      throw new Error("Could not parse stmt at " + c.node.from + " " + c.node.to + ": " + s.substring(c.from, c.to));
  }
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
