const python = require('lezer-python');

const input = 
`
i:int = 9
j:int = 8
i = (i + j)

    `;
  

const tree = python.parser.parse(input);

const cursor = tree.cursor();

do {
//  console.log(cursor.node);
  console.log(cursor.node.type.name, cursor.type.name);
  console.log(input.substring(cursor.node.from, cursor.node.to));
} while(cursor.next());

