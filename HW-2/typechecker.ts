import { Stmt, Expr, Type } from "./ast";

function tcExpr(expr : Expr) : Type {
    switch(expr.tag) {
      case "literal":
        return expr.type;
      case "binop":
        var arg1Type = tcExpr(expr.arg1);
        var arg2Type = tcExpr(expr.arg2);
        if (expr.name == "+") {
          if (arg1Type != "int" || arg2Type != "int"){
            throw("Cannot apply operator `+` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
        else if (expr.name == "+") {
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
        else if (expr.name == "==") {
          if (arg1Type != arg2Type){
            throw("Cannot apply operator `==` on types `" + arg1Type + "` and `" + arg2Type + "`");
          }
          return arg1Type;
        }
    }
  }