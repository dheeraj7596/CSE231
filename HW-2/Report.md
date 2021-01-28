# Programming Assignment-2

## 1. Description of the representation of values (integers, booleans, and None) 

**Integers**: 
I represent integers and booleans as i64. I consider integers the way they are because they always can be represented by 32 bits. 

**Booleans**: 
I represent booleans as i64 too. I need to distinguish between booleans and integers for typechecking and printing i.e. I have to print "True" for a bool True. I distinguish booleans from integers by making the 33rd bit from right as 1 for booleans. I represent True as 2^32 + 1 and False as 2^32. Therefore, during printing or any type checking I decide that it's a boolean based on its 33rd bit as mentioned below.


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

**None**:
My current implementation doesn't require a "none" literal. However, I have a separate type called "none" that is used as the return type by the functions that don't return anything. So, the possible types are {int, bool, none}.

## 2. Give an example of a program that uses At least one global variable, At least one function with a parameter, At least one variable defined inside a function.

Python code is:

    
    def func(y:int) -> int:
        i:int = 1
        i = i + a + y
        return i

    a:int = 9
    y:int = 2

Generated Wasm code:




    (module
        (func $print (import "imports" "print") (param i64) (result i64))
        (import "js" "memory" (memory 1))
        (func $abs (import "imports" "abs") (param i64) (result i64))
        (func $max (import "imports" "max") (param i64) (param i64) (result i64))
        (func $min (import "imports" "min") (param i64) (param i64) (result i64))
        (func $pow (import "imports" "pow") (param i64) (param i64) (result i64))
        
        (func $func (param $y i64) (result i64) 
            (local $localScratchVar i64)
            (local $i i64)
            (i64.const 1)
            (local.set $i)
            (local.get $i)
            (i32.const 8)
            (i64.load)
            (i64.add)
            (local.get $y)
            (i64.add)
            (local.set $i)
            (local.get $i)
            (return)
        )
        (func (export "exported_func") (result i64)
            (i32.const 8) ;; a
            (i64.const 9)
            (i64.store)
            (i32.const 16) ;; y
            (i64.const 2)
            (i64.store)
            (i32.const 0) ;; $scratchVar
            (i32.const 16)
            (i64.load)
            (call $func)
            (i64.store)
            (i32.const 0)
            (i64.load)
        )
    )


In my implementation, I store all the global variables inside the memory and my function variables are stored on stack using `local.set`. Therefore, when the function is executed, all the function variables will also be deleted from the stack. In the above program, `a` is a global variable and is accessed inside the function `func`, `y` is a function parameter and `i` is a variable defined inside the function.
We can observe from the first 3 lines in `exported_func` that `a` is stored in the memory and is loaded from memory in `$func` at line-6 in the function. The function parameter and variable declared inside the function are not needed once the function is executed. Therefore, I save them on function stack using `local.set`. On the second line of `$func` I declare the function variable `i` and I access the function parameter `y` at line 9 using `local.get`. 



 ![Running screenshot of above program](figs/q2.png)


 ## 3. Write a Python program that goes into an infinite loop. What happens when you run it on the web page using your compiler?

 My pc's fan starts running, the webpage hangs and my browser crashes after a while. 

![Running screenshot of above program](figs/q3.png)

## 4. Scenarios

**A function defined in the main program and later called from the interactive prompt**

![Running screenshot of above program](figs/q4_1.png)

**A function defined at the interactive prompt, whose body contains a call to a function from the main program, called at a later interactive prompt**
![Running screenshot of above program](figs/q4_21.png)

![Running screenshot of above program](figs/q4_22.png)

**A program that has a type error because of a mismatch of booleans and integers on one of the arithmetic operations**
![Running screenshot of above program](figs/q4_3.png)

**A program that has a type error in a conditional position**
![Running screenshot of above program](figs/q4_4.png)

**A program that calls a function from within a loop**
![Running screenshot of above program](figs/q4_5.png)

**Printing an integer and a boolean**
![Running screenshot of above program](figs/q4_6.png)

**A recursive function.**
![Running screenshot of above program](figs/q4_7.png)

**Two mutually-recursive functions.**

Adapted from: http://www.idc-online.com/technical_references/pdfs/information_technology/Mutual_Recursion_in_Python.pdf
![Running screenshot of above program](figs/q4_8.png)

**Collaborators:** I disucssed with Amanda, Edwin, Hema while doing this assignment. 