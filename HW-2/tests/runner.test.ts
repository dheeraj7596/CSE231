import { run } from '../runner';
import { expect } from 'chai';
import 'mocha';

const importObject = {
  imports: {
    // we typically define print to mean logging to the console. To make testing
    // the compiler easier, we define print so it logs to a string object.
    //  We can then examine output to see what would have been printed in the
    //  console.
    print: (arg : any) => {
      if (arg < 2**32) {
        importObject.output += BigInt(arg);
        importObject.output += "\n";
        return BigInt(arg);
      }
      else if (BigInt(arg) >= 2**32 && BigInt(arg) < 2**33) {
        arg = BigInt(arg) & BigInt(1);
        if (arg == 1) {
          importObject.output += "True";
          importObject.output += "\n";
          return "True";
        }
        else if (arg == 0) {
          importObject.output += "False";
          importObject.output += "\n";
          return "False";
        }
        else {
          throw Error("Something other than True/False appeared.")
        }
      }
    },
    abs: (arg: any) => {
      const out = Math.abs(Number(arg));
      importObject.output += out;
      return BigInt(out);
    },
    max: (arg1: any, arg2: any) => {
      const out = Math.max(Number(arg1), Number(arg2));
      importObject.output += out;
      return BigInt(out);
    },
    min: (arg1: any, arg2: any) => {
      const out = Math.min(Number(arg1), Number(arg2));
      importObject.output += out;
      return BigInt(out);
    },
    pow: (arg1: any, arg2: any) => {
      const out = Math.pow(Number(arg1), Number(arg2));
      importObject.output += out;
      return BigInt(out);
    },
  },

  output: ""
};

// Clear the output before every test
beforeEach(function () {
  importObject.output = "";
});

var localEnv = {
  globals : new Map(),
  offset: 0,
  types : new Map(),
}
  
// We write end-to-end tests here to make sure the compiler works as expected.
// You should write enough end-to-end tests until you are confident the compiler
// runs as expected. 
describe('run(source, config) function', () => {
  const config = { importObject: importObject, env: localEnv };
  
  // We can test the behavior of the compiler in several ways:
  // 1- we can test the return value of a program
  // Note: since run is an async function, we use await to retrieve the 
  // asynchronous return value. 
  it('returns the right number', async () => {
    const [result, env] = await run("987", config);
    expect(result).to.equal(BigInt(987));
  });

  // 2- we can test the behavior of the compiler by also looking at the log 
  // resulting from running the program
  it('prints something right', async() => {
    var [result, env] = await run("print(1337)", config);
    expect(config.importObject.output).to.equal("1337\n");
  });

  // Note: it is often helpful to write tests for a functionality before you
  // implement it. You will make this test pass!
  it('adds two numbers', async() => {
    const [result, env] = await run("2 + 3", config);
    expect(result).to.equal(BigInt(5));
  });

  it('subtracts two numbers', async() => {
    const [result, env] = await run("5 - 3", config);
    expect(result).to.equal(BigInt(2));
  });

  it('multiplies two numbers', async() => {
    const [result, env] = await run("5 * 3", config);
    expect(result).to.equal(BigInt(15));
  });

  it('absolute value of a positive number', async() => {
    const [result, env] = await run("abs(5)", config);
    expect(result).to.equal(BigInt(5));
  });

  it('absolute value of a negative number', async() => {
    const [result, env] = await run("abs(-5)", config);
    expect(result).to.equal(BigInt(5));
  });

  it('max value', async() => {
    const [result, env] = await run("max(5, 9)", config);
    expect(result).to.equal(BigInt(9));
  });

  it('min value', async() => {
    const [result, env] = await run("min(5, 9)", config);
    expect(result).to.equal(BigInt(5));
  });

  it('power', async() => {
    const [result, env] = await run("pow(2, 3)", config);
    expect(result).to.equal(BigInt(8));
  });

  it('if-elif-else if test', async() => {
    const [result, env] = await run(`i:int = 3
    j:int = 5
    if i == 3:
        j = j + 1
    elif i == 2:
        j = j + 2
    else:
        j = j + 4
    print(j)`, config);
    expect(config.importObject.output).to.equal("6\n");
  });

  it('if-elif-else elif test', async() => {
    const [result, env] = await run(`i:int = 2
    j:int = 5
    if i == 3:
        j = j + 1
    elif i == 2:
        j = j + 2
    else:
        j = j + 4
    print(j)`, config);
    expect(config.importObject.output).to.equal("7\n");
  });

  it('if-elif-else else test', async() => {
    const [result, env] = await run(`i:int = 7
    j:int = 5
    if i == 3:
        j = j + 1
    elif i == 2:
        j = j + 2
    else:
        j = j + 4
    print(j)`, config);
    expect(config.importObject.output).to.equal("9\n");
  });

  // TODO: add additional tests here to ensure the compiler runs as expected
});