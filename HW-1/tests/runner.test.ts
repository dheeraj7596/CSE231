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
      importObject.output += arg;
      importObject.output += "\n";
      return arg;
    },
    abs: (arg: any) => {
      const out = Math.abs(arg);
      importObject.output += out;
      return out;
    },
    max: (arg1: any, arg2: any) => {
      const out = Math.max(arg1, arg2);
      importObject.output += out;
      return out;
    },
    min: (arg1: any, arg2: any) => {
      const out = Math.min(arg1, arg2);
      importObject.output += out;
      return out;
    },
    pow: (arg1: any, arg2: any) => {
      const out = Math.pow(arg1, arg2);
      importObject.output += out;
      return out;
    },
  },

  output: ""
};

// Clear the output before every test
beforeEach(function () {
  importObject.output = "";
});
  
// We write end-to-end tests here to make sure the compiler works as expected.
// You should write enough end-to-end tests until you are confident the compiler
// runs as expected. 
describe('run(source, config) function', () => {
  const config = { importObject };
  
  // We can test the behavior of the compiler in several ways:
  // 1- we can test the return value of a program
  // Note: since run is an async function, we use await to retrieve the 
  // asynchronous return value. 
  it('returns the right number', async () => {
    const result = await run("987", config);
    expect(result).to.equal(987);
  });

  // 2- we can test the behavior of the compiler by also looking at the log 
  // resulting from running the program
  it('prints something right', async() => {
    var result = await run("print(1337)", config);
    expect(config.importObject.output).to.equal("1337\n");
  });

  // 3- we can also combine both type of assertions, or feel free to use any 
  // other assertions provided by chai.
  it('prints two numbers but returns last one', async () => {
    var result = await run("print(987)", config);
    expect(result).to.equal(987);
    result = await run("print(123)", config);
    expect(result).to.equal(123);
    
    expect(config.importObject.output).to.equal("987\n123\n");
  });

  // Note: it is often helpful to write tests for a functionality before you
  // implement it. You will make this test pass!
  it('adds two numbers', async() => {
    const result = await run("2 + 3", config);
    expect(result).to.equal(5);
  });

  it('subtracts two numbers', async() => {
    const result = await run("5 - 3", config);
    expect(result).to.equal(2);
  });

  it('multiplies two numbers', async() => {
    const result = await run("5 * 3", config);
    expect(result).to.equal(15);
  });

  it('absolute value of a positive number', async() => {
    const result = await run("abs(5)", config);
    expect(result).to.equal(5);
  });

  it('absolute value of a negative number', async() => {
    const result = await run("abs(-5)", config);
    expect(result).to.equal(5);
  });

  it('max value', async() => {
    const result = await run("max(5, 9)", config);
    expect(result).to.equal(9);
  });

  it('min value', async() => {
    const result = await run("min(5, 9)", config);
    expect(result).to.equal(5);
  });

  it('power', async() => {
    const result = await run("pow(2, 3)", config);
    expect(result).to.equal(8);
  });

  // TODO: add additional tests here to ensure the compiler runs as expected
});