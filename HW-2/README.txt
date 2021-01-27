Example codes:

TODOS:
1. Recursive return check
2. renderResult returning 1/0 for True, False

2.  Example of a program that uses
        At least one global variable
        At least one function with a parameter
        At least one variable defined inside a function

    def func(y:int, x:int, z:int) -> int:
        i:int = 1
        i = i + a
        return i

    a:int = 9
    y:int = 0
    x:int = 1
    z:int = 2

    func(y, x, z)

def func(n:int) -> int:  
    return n + 2

3. Python program that goes into an infinite loop
    
    i: int = 1
    while i > 0:
        i = i + 1

4.  (a.) A function defined in the main program and later called from the interactive prompt
        def isEven(n:int) -> bool:
            if n %2 == 0:
                return True
            else:
                return False

    (b.) A function defined at the interactive prompt, whose body contains a call to a function
        TODO

    (c.) A program that has a type error because of a mismatch of booleans and integers on one of the arithmetic operations
        i:int = 0
        j:bool = True
        k:int = 5
        k = i + j

    (d.) A program that has a type error in a conditional position
        i:int = 0
        j:bool = True
        if i == j:
            print(45)

    (e.) A program that calls a function from within a loop
        def isEven(n:int) -> bool:
            if n %2 == 0:
                return True
            else:
                return False

        i: int = 0
        while i < 10:
            print(isEven(i))
            i = i + 1

    (f.) Printing an integer and a boolean
        print(5 == 2)
        print(5 == 5)
        print(98)

    (g.) A recursive function.
        def Fibonacci(n:int) -> int: 
            if n==0: 
                return 0
            elif n==1: 
                return 1
            else: 
                return Fibonacci(n-1)+Fibonacci(n-2)
    
    (h.) Two mutually-recursive functions.

        def isEven(n:int) -> bool:
            if n %2 == 0:
                return True
            else:
                return isOdd(n-1)


        def isOdd(n:int) -> bool:
            if n%2 == 0:
                return False
            else:
                return isEven(n-1)