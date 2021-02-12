const python = require('lezer-python');

const input = 
`
class Rat(object):
    n : int = 0
    d : int = 0
    def new(self : Rat, r1: Rat, n : int, d : int) -> Rat:
        return self
r1 : Rat = None
j:int = 0
r1 = Rat()
r1.n = 7
j = 9
r1.mul(r2).mul(r2).n = 7
    `;
  

const tree = python.parser.parse(input);

const cursor = tree.cursor();

do {
//  console.log(cursor.node);
  console.log(cursor.node.type.name, cursor.type.name);
  console.log(input.substring(cursor.node.from, cursor.node.to));
} while(cursor.next());

