import {BasicREPL} from './repl';
import {emptyEnv, GlobalEnv} from './compiler';
import {run} from './runner';


function webStart() {
  document.addEventListener("DOMContentLoaded", function() {
    var importObject = {
      imports: {
        imported_func: (arg : any) => {
          console.log("Logging from WASM: ", arg);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          elt.innerText = arg;
        },
        print_global_func: (pos: number, value: number) => {
          var name = importObject.nameMap[pos];
          var msg = name + " = " + value;
          renderResult(msg);
        },
        print: (arg : any) => {
          console.log("Logging from WASM: ", arg);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          if (arg < 2**32) { // This is a number
            elt.innerText = arg;
            return BigInt(arg);
          }
          else if (BigInt(arg) >= 2**32 && BigInt(arg) < (2**32 + 2)) {
            // Bools are added with 2^32.
            arg = BigInt(arg) & BigInt(1);
            if (arg == 1) {
              elt.innerText = "True";
            }
            else if (arg == 0) {
              elt.innerText = "False";
            }
            else {
              throw Error("Something other than True/False appeared.")
            }
            return arg;
          }
          else if (BigInt(arg) == BigInt(2**32 + 2)) {
            // This is None
            elt.innerText = "";
            return arg;
          }
          
        },
        abs: (arg : any) => {
          console.log("Logging from WASM: ", arg);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          const out = Math.abs(Number(arg)); 
          elt.innerText = out.toString();
          return BigInt(out);
        },
        max: (arg1 : any, arg2 : any) => {
          console.log("Logging from WASM: ", arg1, arg2);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          const out = Math.max(Number(arg1), Number(arg2)); 
          elt.innerText = out.toString();
          return BigInt(out);
        },
        min: (arg1 : any, arg2 : any) => {
          console.log("Logging from WASM: ", arg1, arg2);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          const out = Math.min(Number(arg1), Number(arg2)); 
          elt.innerText = out.toString();
          return BigInt(out);
        },
        pow: (arg1 : any, arg2 : any) => {
          console.log("Logging from WASM: ", arg1, arg2);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          const out = Math.pow(Number(arg1), Number(arg2)); 
          elt.innerText = out.toString();
          return BigInt(out);
        },
      },
      nameMap: new Array<string>(),
    
      updateNameMap : (env : GlobalEnv) => {
        env.globals.forEach((pos, name) => {
          importObject.nameMap[pos] = name;
        })
      }
    };

    const env = emptyEnv;
    var repl = new BasicREPL(importObject);

    function renderResult(result : any) : void {
      if(result === undefined) { console.log("skip"); return; }
      const elt = document.createElement("pre");
      document.getElementById("output").appendChild(elt);

      if (BigInt(result) >= 2**32 && BigInt(result) < (2**32 + 2)) {
        // Bools are added with 2^32.
        result = BigInt(result) & BigInt(1);
        if (result == 1) {
          result = "True";
        }
        else if (result == 0) {
          result = "False";
        }
        else {
          throw Error("Something other than True/False appeared.")
        }
      }
      else if (BigInt(result) == BigInt(2**32 + 2)) {
        // This is None
        result = "";
      }

      elt.innerText = String(result);
    }

    function renderError(result : any) : void {
      const elt = document.createElement("pre");
      document.getElementById("output").appendChild(elt);
      elt.setAttribute("style", "color: red");
      elt.innerText = String(result);
    }

    function setupRepl() {
      document.getElementById("output").innerHTML = "";
      const replCodeElement = document.getElementById("next-code") as HTMLInputElement;
      replCodeElement.addEventListener("keypress", (e) => {
        if(e.key === "Enter" && !(e.shiftKey)) {
          const output = document.createElement("div");
          const prompt = document.createElement("span");
          prompt.innerText = "»";
          output.appendChild(prompt);
          const elt = document.createElement("input");
          elt.type = "text";
          elt.disabled = true;
          elt.className = "repl-code";
          output.appendChild(elt);
          document.getElementById("output").appendChild(output);
          const source = replCodeElement.value;
          elt.value = source;
          replCodeElement.value = "";
          repl.run(source).then((r) => { renderResult(r); console.log ("run finished") })
              .catch((e) => { renderError(e); console.log("run failed", e) });;
        }
      });
    }

    document.getElementById("run").addEventListener("click", function(e) {
      repl = new BasicREPL(importObject);
      const source = document.getElementById("user-code") as HTMLTextAreaElement;
      setupRepl();
      repl.run(source.value).then((r) => { renderResult(r); console.log ("run finished") })
          .catch((e) => { renderError(e); console.log("run failed", e) });;
    });
  });
}

webStart();
