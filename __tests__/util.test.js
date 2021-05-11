// get the functions in here import them

// const { } = require(' ./place where ur function is')

// es6 export is not supported natively by jest

// test('should output name and age', () => {
//     const text = yourImportedFunction('Max', 29)
//     expect(text).toBe('Max (29 years old)')
//     // you can run 2 tests in one to avoid false positives
//     const text2 = yourImportedFunction('Anna', 28)
//     expect(text2).toBe('Anna (28 years old)')
// });

// test('should output data-less text', () => {
//     const text = generateText('', null)
//     expect(text).toBe(' ( null years old)')
// })

// import the file - check if this is correct
// const balanceSheet = require('./app/AnaliseModules/BalanceSheet')

// how to make this work with react? it seems I need more packages to build this workflow

//things to test

// analise details on balanceSheet

// DRE queries such as devolucoes, tarifas, totais from VendasDados

// test('Taxas B2W, Frete e Magazine Luiza pra periodo 18-03-2021 a 18-04-2021', () => {

// })

// test('renders without crashing', () => {
// const div = document.createElement("div")
// ReactDOM.render(<VendasDados></VendasDados>, div)
// })

// test('check totals of despesas', () => {
//   getVendasData.processDespesasData.getContasPagas()

//   expect(finState).toEqual([]);
// });

// it("test the function", async() => {
//   const test = await getVendasData.processDespesasData()
//   expect(test).toBe(4)
// })

// describe('Addition', () => {
//   it('test the function', async () => {
//     const hello = await getVendasData.processDespesasData.getContasPagas()
//     expect(hello).toBe(4)
//   })
// });

import React from "react";
// import "@testing-library/jest-dom/extend-expect";
import "@testing-library/jest-dom"; // had to reinstall this to work
import "@testing-library/jest-dom/extend-expect";
import "jest-canvas-mock"; // fix the canva issue or use npm install canvas-prebuilt
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
// import "@testing-library/react"
// import ReactDOM from "react-dom"
// import BalanceSheet from "../app/AnaliseModules/BalanceSheet"
import VendasDados from "../app/AnaliseModules/VendasDados";
import { getVendasData } from "../app/AnaliseModules/VendasDados";

// describe("Addition", () => {
//   it("knows that 2 and 2 make 4", () => {
//     expect(2 + 2).toBe(4);
//   });
// });

test("Check if react render the object", () => {
  render(<VendasDados />);
  const componentElement = screen.getByTestId("isLive");
  // expect(componentElement).toBe(true);
  expect(componentElement).toBeInTheDocument();
  expect(componentElement).toHaveTextContent("Vendas Total:"); // very if test content is there
});

test("Check if react render the object", () => {
  const test = render(<VendasDados />);
  const componentElement = getVendasData;
  console.log(test);
  // expect(componentElement).toBe(true);
  // .expect(componentElement)
  // .toBeInTheDocument();
  // expect(componentElement).toHaveTextContent("Vendas Total:"); // very if test content is there
});

// it("test the function", async() => {
//   const test = await getVendasData.processDespesasData()
//   expect(test).toBe(4)
// })
