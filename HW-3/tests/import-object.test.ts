import { Type } from "../ast";
import { NUM, BOOL, NONE } from "../utils";

function stringify(typ: Type, arg: any): string {
  switch (typ.tag) {
    case "number":
        if (arg < 2**32) { // This is a number
            return (arg as number).toString();
        }
        else if (BigInt(arg) >= 2**32 && BigInt(arg) < (2**32 + 2)) {
            // Bools are added with 2^32.
            var ans = BigInt(arg) & BigInt(1);
            if (ans == BigInt(1)) {
                return "True";
            }
            else if (ans == BigInt(0)) {
                return "False";
            }
        }
        else if (BigInt(arg) == BigInt(2**32 + 2)) {
            // This is None
            return "";
        }
        else {
            throw Error("A number out of range has appeared.");
        }
    case "bool":
        return (arg as boolean) ? "True" : "False";    
    case "none":
      return "None";
    case "class":
      return typ.name;
  }
}

function print(typ: Type, arg: any): any {
  importObject.output += stringify(typ, arg);
  importObject.output += "\n";
  return arg;
}



export const importObject = {
  imports: {
    // we typically define print to mean logging to the console. To make testing
    // the compiler easier, we define print so it logs to a string object.
    //  We can then examine output to see what would have been printed in the
    //  console.
    print: (arg: any) => print(NUM, arg),
    print_num: (arg: number) => print(NUM, arg),
    print_bool: (arg: number) => print(BOOL, arg),
    print_none: (arg: number) => print(NONE, arg),
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    pow: Math.pow,
  },

  output: "",
};