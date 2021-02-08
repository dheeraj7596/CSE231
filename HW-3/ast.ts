// export type Type = "bool" | "int" | "none"

export type Type =
  | {tag: "number"}
  | {tag: "bool"}
  | {tag: "none"}
  | {tag: "class", name: string}

  
export type Value =
    { tag: "none" }
  | { tag: "bool", value: boolean }
  | { tag: "num", value: number }
  | { tag: "object", name: string, address: number}


export type Parameter<A> =
    { a?: A, name: string, type: Type }


export type Stmt<A> =
  | { a?: A, tag: "define", name: string, value: Expr<A> }
  | { a?: A, tag: "expr", expr: Expr<A> }
  | { a?: A, tag: "globals" }
  | { a?: A, tag: "init", name: string, type: Type, value: Expr<A>}
  | { a?: A, tag: "if", ifcond: Expr<A>, ifthn: Array<Stmt<A>>, elifcond: Expr<A>, elifthn: Array<Stmt<A>>, else: Array<Stmt<A>>}
  | { a?: A, tag: "while", cond: Expr<A>, body: Array<Stmt<A>>}
  | { a?: A, tag: "funcdef", name: string, decls: Array<Stmt<A>>, parameters: Array<Parameter<A>>, body: Array<Stmt<A>> , return: Type }
  | { a?: A, tag: "return", value: Expr<A> }


export type Expr<A> =
    { a?: A, tag: "literal", value: number, type: Type }
  | { a?: A, tag: "uniop", value: Expr<A>, name: string} 
  | { a?: A, tag: "id", name: string }
  | { a?: A, tag: "builtin1", name: string, arg: Expr<A> }
  | { a?: A, tag: "binop", name: string, arg1: Expr<A>, arg2: Expr<A>}
  | { a?: A, tag: "builtin2", name: string, arg1: Expr<A>, arg2: Expr<A>}
  | { a?: A, tag: "call", name: string, arguments: Array<Expr<A>> }
  
