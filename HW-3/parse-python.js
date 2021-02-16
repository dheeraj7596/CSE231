const python = require('lezer-python');

const input = 
`
class Employee:
   empCount:int = 0

   def __init__(self:Employee):
      self.empCount = self.empCount + 1
   
   def displayCount(self:Employee):
     print(self.empCount)

    `;
  

const tree = python.parser.parse(input);

const cursor = tree.cursor();

do {
//  console.log(cursor.node);
  console.log(cursor.node.type.name, cursor.type.name);
  console.log(input.substring(cursor.node.from, cursor.node.to));
} while(cursor.next());

