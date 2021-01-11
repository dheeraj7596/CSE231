1. Three examples of Python programs that have different behavior than my compiler are:
(a) max(-1, -3)
(b) min(-1, -3)
(c) pow(4, -3)
This is because my compiler currently assumes i32 as parameters for these functions and assumes values to be positive. 
Since the negative inputs are parsed differently into UnaryExpression, I need to extend the functionality to negative inputs as well by parsing UnaryExpression properly. 
Currently, my compiler handles negative numbers for absolute value function because I did a hack by parsing it but considering only the value and ignoring the sign, which is enough to compute correct absolute value.

2. It took me 5-6 hours to finish the assignment. The binary operation part and the absolute value took longer time compared to others. It is because I got accustomed to code with the binary operation part and figured out implementing built-in functions during the absolute function part.

3. Nothing, all has been well fortunately.

4. The readings mentioned in the course website. I didn't use anything else other than these.

5. None

