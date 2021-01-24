import * as mocha from 'mocha';
import {expect} from 'chai';
import { parser } from 'lezer-python';
import { traverseExpr, traverseStmt, traverse, parse } from '../parser';

// We write tests for each function in parser.ts here. Each function gets its 
// own describe statement. Each it statement represents a single test. You
// should write enough unit tests for each function until you are confident
// the parser works as expected. 
describe('traverseExpr(c, s) function', () => {
  it('parses a number in the beginning', () => {
    const source = "987";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({tag: "literal", value: 987, type: "int"});
  })

  it('parses addition', () => {
    const source = "2+3";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({"arg1": {"tag": "literal", "value": 2, type: "int"}, "arg2": {"tag": "literal", "value": 3, type: "int"}, "name": "+", "tag": "binop"});
  })
  // TODO: add additional tests here to ensure traverseExpr works as expected
});

describe('traverseStmt(c, s) function', () => {
  // TODO: add tests here to ensure traverseStmt works as expected
});

describe('traverse(c, s) function', () => {
  // TODO: add tests here to ensure traverse works as expected
});

describe('parse(source) function', () => {
  it('parse a number', () => {
    const parsed = parse("987");
    expect(parsed).to.deep.equal([{tag: "expr", expr: {tag: "literal", value: 987, type: "int"}}]);
  });  

  // TODO: add additional tests here to ensure parse works as expected
});

describe('parse(source) function', () => {
  it('parse a Bool', () => {
    const parsed = parse("True");
    expect(parsed).to.deep.equal([{tag: "expr", expr: {tag: "literal", value: 1 + 2**32, type: "bool"}}]);
  });  

  // TODO: add additional tests here to ensure parse works as expected
});

describe('parse(source) function', () => {
  it('parse init', () => {
    const parsed = parse("i:bool = True");
    expect(parsed).to.deep.equal([{tag: "init", name: "i", type: "bool", value: {tag: "literal", value: 1 + 2**32, type: "bool"}, }]);
  });  

  // TODO: add additional tests here to ensure parse works as expected
});