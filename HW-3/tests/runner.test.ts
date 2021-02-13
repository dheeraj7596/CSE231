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
      else if (BigInt(arg) >= 2**32 && BigInt(arg) < (2**32 + 2)) {
        var ans = BigInt(arg) & BigInt(1);
        if (ans == BigInt(1)) {
          importObject.output += "True";
          importObject.output += "\n";
          return BigInt(arg);
        }
        else if (ans == BigInt(0)) {
          importObject.output += "False";
          importObject.output += "\n";
          return BigInt(arg);
        }
        else {
          throw Error("Something other than True/False appeared.")
        }
      }
      else if (BigInt(arg) == BigInt(2**32 + 2)) {
        // This is None
        importObject.output += "";
        return arg;
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
  functypes: new Map(), 
  funcDef: new Map(), 
  funcStr: "",  
  localVars: new Set()
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
    expect(result).to.equal(BigInt(1337));
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
    expect(result).to.equal(BigInt(6));
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
    expect(result).to.equal(BigInt(7));
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
    expect(result).to.equal(BigInt(9));
  });

  it('CLS: returns the right number', async () => {
    const [result, env] = await run("987", config);
    expect(result).to.equal(BigInt(987));
  });

  // 2- we can test the behavior of the compiler by also looking at the log 
  // resulting from running the program
  it('CLS: prints something right', async() => {
    var [result, env] = await run(
    `
    class Rat(object):
      n : int = 5
      d : int = 10
    
    r: Rat = None
    r = Rat()
    print(r.n)
    `, config);
    expect(result).to.equal(BigInt(5));
  });

  // Note: it is often helpful to write tests for a functionality before you
  // implement it. You will make this test pass!
  it('CLS: adds two numbers', async() => {
    const [result, env] = await run(
    `
    class Rat(object):
      n : int = 5
      d : int = 10
    
    r: Rat = None
    r = Rat()
    r.n + r.d
    `, config);
    expect(result).to.equal(BigInt(15));
  });

  it('CLS: subtracts two numbers', async() => {
    const [result, env] = await run(
    `
    class Rat(object):
      n : int = 5
      d : int = 10
      e: int = 15
    
    r: Rat = None
    r = Rat()
    r.d - r.n + r.e
    `, config);
    expect(result).to.equal(BigInt(20));
  });

  it('CLS: multiplies two numbers', async() => {
    const [result, env] = await run(
    `
    class Rat(object):
      n : int = 5
      d : int = 10
      e: int = 15
    
    r: Rat = None
    r = Rat()
    r.n * r.e
    `, config);
    expect(result).to.equal(BigInt(75));
  });

  it('CLS: absolute value of a positive number', async() => {
    const [result, env] = await run(
    `
    class Rat(object):
      n : int = 5
      d : int = 10
      e: int = 15
    
    r: Rat = None
    r = Rat()
    abs(r.n)
    `, config);
    expect(result).to.equal(BigInt(5));
  });

  it('CLS: absolute value of a negative number', async() => {
    const [result, env] = await run(
    `
    class Rat(object):
      n : int = 5
      d : int = 10
      e: int = 15
    
    r: Rat = None
    r = Rat()
    r.n = -5
    abs(r.n)
    `, config);
    expect(result).to.equal(BigInt(5));
  });

  it('CLS: max value', async() => {
    const [result, env] = await run(
    `
    class Rat(object):
      n : int = 5
      d : int = 10
      e: int = 15
    
    r: Rat = None
    r = Rat()
    max(r.n, r.d)
    `, config);
    expect(result).to.equal(BigInt(10));
  });

  it('CLS: min value', async() => {
    const [result, env] = await run(
    `
    class Rat(object):
      n : int = 5
      d : int = 10
      e: int = 15
    
    r: Rat = None
    r = Rat()
    min(r.d, r.e)
    `, config);
    expect(result).to.equal(BigInt(10));
  });

  it('CLS: power', async() => {
    const [result, env] = await run(
    `
    class Rat(object):
      n : int = 2
      d : int = 3
      e: int = 15
    
    r: Rat = None
    r = Rat()
    
    pow(r.n, r.d)`, config);
    expect(result).to.equal(BigInt(8));
  });

  it('CLS: if-else if test', async() => {
    const [result, env] = await run(`
    class Rat(object):
      i : int = 3
      j : int = 5

    r: Rat = None
    r = Rat()
    
    if r.i == 3:
        r.j = r.j + 1
    else:
        r.j = r.j + 4
    print(r.j)`, config);
    expect(result).to.equal(BigInt(6));
  });

  it('CLS: if-elif-else else test', async() => {
    const [result, env] = await run(`
    class Rat(object):
      i : int = 4
      j : int = 5

    r: Rat = None
    r = Rat()
    
    if r.i == 3:
        r.j = r.j + 1
    else:
        r.j = r.j + 4
    print(r.j)`, config);
    expect(result).to.equal(BigInt(9));
  });

  it('CLS: function', async() => {
    const [result, env] = await run(`
    class Rat(object):
      n : int = 0
      d : int = 0
      def new(self : Rat, n : int, d : int) -> Rat:
          self.n = n
          self.d = d
          return self
      def mul(self : Rat, other : Rat) -> Rat:
          obj: Rat = None
          obj = Rat().new(9, 10)
          return Rat().new(self.n * other.n * obj.n, self.d * other.d * obj.d)
    r1 : Rat = None
    r2 : Rat = None
    r1 = Rat().new(4, 5)
    r2 = Rat().new(2, 3)
    r1.mul(r2).mul(r2).n`, config);
    expect(result).to.equal(BigInt(1296));
  });

  it('CLS: function-global', async() => {
    const [result, env] = await run(`
    class Rat(object):
      n : int = 0
      d : int = 0
      def new(self : Rat, n : int, d : int) -> Rat:
          self.n = n
          self.d = d
          return self
      def mul(self : Rat, other : Rat) -> Rat:
          obj: Rat = None
          obj = Rat().new(9, 10)
          return Rat().new(self.n * other.n * obj.n, self.d * other.d * obj.d)
      def func(self: Rat, y:int) -> int:
          return self.n + y + a
    a: int = 10
    r1 : Rat = None
    r2 : Rat = None
    r1 = Rat().new(4, 5)
    r2 = Rat().new(2, 3)
    r1.func(5)
    `, config);
    expect(result).to.equal(BigInt(19));
  });

  it('CLS: function-function', async() => {
    const [result, env] = await run(`
    class Rat(object):
      n : int = 0
      d : int = 0
      def new(self : Rat, n : int, d : int) -> Rat:
          self.n = n
          self.d = d
          return self
      def mul(self : Rat, other : Rat) -> Rat:
          obj: Rat = None
          obj = Rat().new(9, 10)
          return Rat().new(self.n * other.n * obj.n, self.d * other.d * obj.d)
      def isEven(self : Rat, n:int) -> bool:
          if n %2 == 0:
              return True
          else:
              return False
      def isOdd(self : Rat, n:int) -> bool:
          if self.isEven(n):
              return False
          else:
              return True

    r1 : Rat = None
    r2 : Rat = None
    r1 = Rat().new(4, 5)
    r2 = Rat().new(2, 3)
    print(r1.isOdd(r1.n))
    `, config);
    expect(result).to.equal(BigInt(4294967296));
  });

  it('CLS: recursive-function', async() => {
    const [result, env] = await run(`
    class Rat(object):
      n : int = 0
      d : int = 0
      def new(self : Rat, n : int, d : int) -> Rat:
          self.n = n
          self.d = d
          return self
      def mul(self : Rat, other : Rat) -> Rat:
          obj: Rat = None
          obj = Rat().new(9, 10)
          return Rat().new(self.n * other.n * obj.n, self.d * other.d * obj.d)
      def Fibonacci(self : Rat) -> int: 
          arg1: Rat = None
          arg2: Rat = None
          arg1 = Rat().new(self.n-1, self.d)
          arg2 = Rat().new(self.n-2, self.d)
          if self.n==0: 
              return 0
          elif self.n==1: 
              return 1
          else: 
              return arg1.Fibonacci()+arg2.Fibonacci()

    r1 : Rat = None
    r2 : Rat = None
    r1 = Rat().new(4, 5)
    r2 = Rat().new(9, 3)
    r2.Fibonacci()
    `, config);
    expect(result).to.equal(BigInt(34));
  });

  it('CLS: mutually-recursive-function', async() => {
    const [result, env] = await run(`
    class Rat(object):
      n : int = 0
      d : int = 0
      def new(self : Rat, n : int, d : int) -> Rat:
          self.n = n
          self.d = d
          return self
      def mul(self : Rat, other : Rat) -> Rat:
          obj: Rat = None
          obj = Rat().new(9, 10)
          return Rat().new(self.n * other.n * obj.n, self.d * other.d * obj.d)
      def isEven(self:Rat, n:int) -> bool:
          if n %2 == 0:
              return True
          else:
              return self.isOdd(n-1)
      def isOdd(self:Rat, n:int) -> bool:
        if n%2 == 0:
            return False
        else:
            return self.isEven(n-1)
            

    r1 : Rat = None
    r2 : Rat = None
    r1 = Rat().new(4, 5)
    r2 = Rat().new(9, 3)
    print(r1.isOdd(r2.n))
    `, config);
    expect(result).to.equal(BigInt(4294967297));
  });
  // TODO: add additional tests here to ensure the compiler runs as expected
});