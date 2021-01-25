export type Type = "bool" | "int" | "none"

export type Stmt =
  | { tag: "define", name: string, value: Expr }
  | { tag: "expr", expr: Expr }
  | { tag: "globals" }
  | {tag: "init", name: string, type: Type, value: Expr}
  | {tag: "if", ifcond: Expr, ifthn: Array<Stmt>, elifcond: Expr, elifthn: Array<Stmt>, else: Array<Stmt>}
  | {tag: "while", cond: Expr, body: Array<Stmt>}


export type Expr =
    { tag: "literal", value: number, type: Type }
  | {tag: "uniop", value: Expr, name: string} 
  | { tag: "id", name: string }
  | { tag: "builtin1", name: string, arg: Expr }
  | { tag: "binop", name: string, arg1: Expr, arg2: Expr}
  | { tag: "builtin2", name: string, arg1: Expr, arg2: Expr}
  
