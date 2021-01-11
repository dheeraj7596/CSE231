const python = require('lezer-python');

const input = "min(5, 9)";

const tree = python.parser.parse(input);

const cursor = tree.cursor();

do {
//  console.log(cursor.node);
  console.log(cursor.node.type.name);
  console.log(input.substring(cursor.node.from, cursor.node.to));
} while(cursor.next());

