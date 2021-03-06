import {run} from './runner';


function webStart() {
  document.addEventListener("DOMContentLoaded", function() {
    var importObject = {
      imports: {
        print: (arg : any) => {
          console.log("Logging from WASM: ", arg);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          elt.innerText = arg;
          return arg;
        },
        abs: (arg : any) => {
          console.log("Logging from WASM: ", arg);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          const out = Math.abs(arg); 
          elt.innerText = out.toString();
          return out;
        },
        max: (arg1 : any, arg2 : any) => {
          console.log("Logging from WASM: ", arg1, arg2);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          const out = Math.max(arg1, arg2); 
          elt.innerText = out.toString();
          return out;
        },
        min: (arg1 : any, arg2 : any) => {
          console.log("Logging from WASM: ", arg1, arg2);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          const out = Math.min(arg1, arg2); 
          elt.innerText = out.toString();
          return out;
        },
        pow: (arg1 : any, arg2 : any) => {
          console.log("Logging from WASM: ", arg1, arg2);
          const elt = document.createElement("pre");
          document.getElementById("output").appendChild(elt);
          const out = Math.pow(arg1, arg2); 
          elt.innerText = out.toString();
          return out;
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
