import {run} from './runner';


function webStart() {
  document.addEventListener("DOMContentLoaded", function() {
    var importObject = {
      imports: {
        print: (arg : any) => {
          console.log("Logging from WASM: ", arg);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          if (arg < 2**32) { // This is a number
            elt.innerText = arg;
            return BigInt(arg);
          }
          else if (BigInt(arg) >= 2**32 && BigInt(arg) < 2**33) {
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
    };

    function renderResult(result : any) : void {
      if(result === undefined) { console.log("skip"); return; }
      const elt = document.createElement("pre");
      document.getElementById("output").appendChild(elt);
      elt.innerText = String(result);
    }

    function renderError(result : any) : void {
      const elt = document.createElement("pre");
      document.getElementById("output").appendChild(elt);
      elt.setAttribute("style", "color: red");
      elt.innerText = String(result);
    }

    document.getElementById("run").addEventListener("click", function(e) {
      const source = document.getElementById("user-code") as HTMLTextAreaElement;
      const output = document.getElementById("output").innerHTML = "";
      run(source.value, {importObject}).then((r) => { renderResult(r); console.log ("run finished") })
          .catch((e) => { renderError(e); console.log("run failed", e) });;
    });
  });
}

webStart();
