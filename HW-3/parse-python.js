const python = require('lezer-python');

const input = 
`
def contains(y:int, x:int, z:int) -> bool:
    global y
    i:int = 0
    j: int = 4
    return False

y:int = 0
contains(y, x, z)
    `;

const tree = python.parser.parse(input);

const cursor = tree.cursor();

do {
//  console.log(cursor.node);
  console.log(cursor.node.type.name, cursor.type.name);
  console.log(input.substring(cursor.node.from, cursor.node.to));
} while(cursor.next());

