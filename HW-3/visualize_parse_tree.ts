import {TreeCursor} from "lezer-tree";

const python = require('lezer-python');

const input = `class c(object):
a:int = 0
b:int = 1
def __init__(self:c):
    pass
def func(self:c, vadi: int):
    self.c = self.c + vadi;
def local(self:c, vadi: int):
    l:int = 0
    j:int = 0
    l = l + j;
    j = l + j;

obj:c = None;
p:int = 0
obj = c();
p = obj.a;
obj.func();`
const tree = python.parser.parse(input);
const cursor = tree.cursor();

function vizTree(cursor: TreeCursor, s: string, depth: number) {
    console.log (Array(depth * 2 + 1).join(" ") + `> [${cursor.node.type.name}]: '${s.substring(cursor.from, cursor.to)}'`)
    if (!cursor.firstChild()) {
        return;
    }
    do {
        vizTree(cursor, s, depth * 2 + 1);
    } while (cursor.nextSibling());

    cursor.parent();
}

vizTree(cursor, input, 0);