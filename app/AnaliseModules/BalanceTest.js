import React, { useEffect, useState, useContext } from "react";
import { Line } from "react-chartjs-2";
import Axios from "axios";
import { parse } from "../../scraper/scrape_modules/node_modules/date-fns";
import { useImmer } from "use-immer";
import StateContext from "../StateContext";
import DispatchContext from "../DispatchContext";
import { Link } from "react-router-dom";

const dtConvert = require("../../scraper/scrape_modules/node_modules/date-fns");

function BalanceTest() {
  // states
  const appDispatch = useContext(DispatchContext);
  const appState = useContext(StateContext);

  // const [datas, setDatas] = useState([]);
  // const [dadosPivot, setDadosPivot] = useState([]);
  const [state, setState] = useImmer({
    datas: [],
    dadosPivot: [],
    sendCount: 0,
    isSaving: false
  });

  // --------Functions

  // generate IDs
  const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  function submitHandler(e) {
    e.preventDefault();
    setState(draft => {
      draft.sendCount++;
    });
  }

  let chartNumb = [];
  let chartDados = [];

  state.dadosPivot
    .filter(items => {
      if (items.conta === "CAPITAL SOCIAL") {
        return items;
      } else {
        return null;
      }
    })
    .map(items =>
      state.datas.map(datas => {
        if (datas.select === true) {
          chartNumb.push(items[datas.data].f1);
          return items;
        } else {
          return null;
        }
      })
    );

  for (let i = chartNumb.length - 1; i >= 0; i--) {
    if (chartNumb[i - 1]) {
      let calc = chartNumb[i] - chartNumb[i - 1];
      chartDados.unshift(calc.toFixed(2));
    } else {
      let calc = 59155.27;
      chartDados.unshift(calc.toFixed(2));
    }
  }

  let chartLab = [];

  state.datas.map(items => {
    if (items.select === true) {
      chartLab.push(`${new Date(items.data).getDate()}/${new Date(items.data).getMonth() + 1}/${new Date(items.data).getFullYear()}`);
      return `${new Date(items.data).getDate()}/${new Date(items.data).getMonth() + 1}/${new Date(items.data).getFullYear()}`;
    } else {
      return null;
    }
  });

  // graphs
  const chartData = {
    labels: chartLab,
    datasets: [
      {
        label: "Crecimento em Patrimonio Liquido",
        data: chartDados,
        borderColor: "#3e95cd",
        fill: false
      }
    ]
  };

  // create new balance

  async function createBal() {
    // if (datas.length >= 0) {
    //   console.log(datas.pop().data); // use this
    // }
    let lastDate = await state.datas.slice(-1)[0].data;
    let secondLastDate = await state.datas.slice(-2)[0].data;
    let currentDate = "2020-12-14";
    // let currentDate = await dtConvert.format(new Date(), "yyyy-MM-dd"); // correct
    let currentDateScrape = await dtConvert.format(new Date(), "dd-MM-yyyy");
    let lastDateScrape = await dtConvert.format(parse(lastDate, "yyyy-MM-dd", new Date()), "dd-MM-yyyy");
    // check if secondLastDate = currentDate so we dont need to run the script and just dispatch the thing
    // console.log(currentDate);
    // if (lastDate === currentDate) {
    //   console.log('i am here')
    // }

    // // uncomment this section to update without run the script

    await appDispatch({ type: "lastDate", value: lastDate });
    await appDispatch({ type: "currentDate", value: currentDate });
    setState(draft => {
      draft.isSaving = false;
    });
    // await appDispatch({ type: "currentDateScrape", value: currentDateScrape }); // you dont really need these two since scrape is just called here
    // await appDispatch({ type: "lastDateScrape", value: lastDateScrape }); // same as above

    // // //

    // scrape data
    // const res = await Axios.post("http://localhost:5000/scrapeAll", { lastDate, currentDate, lastDateScrape, currentDateScrape }, { timeout: 0 })
    //   .then(resp => {
    //     console.log(resp.data);
    //     setState(draft => {
    //       draft.isSaving = false;
    //     });
    //     if (resp.data) {
    //       console.log("Start Updating dates");
    //       appDispatch({ type: "lastDate", value: lastDate });
    //       appDispatch({ type: "currentDate", value: currentDate });
    //       //       appDispatch({ type: "currentDateScrape", value: currentDateScrape });
    //       //       appDispatch({ type: "lastDateScrape", value: lastDateScrape });
    //     }
    //     // if resp.data = something we update state - this will automatically-re render the component
    //   })
    //   .catch(err => {
    //     console.log(err.data);
    //   });
    // // end of section

    const getBalance = await Axios.get("http://localhost:5000/edit", {
      params: {
        date: lastDate
      }
    });
    const balanceData = await [...getBalance.data];
    // console.log(balanceData)

    let dataBal = [];
    balanceData.forEach(items => {
      let createBalData = {};

      // console.log(items);
      if (items.tipo === "Ativo Permanente" || items.conta === "Junior Investimento na Empresa" || items.conta === "Junior Participacao Lucro a receber (REF Periodo 2016 a 2017)" || items.conta === "Paulo Participacao Lucro" || items.conta === "Projeto 2019 Expansao Empresa (Fluxo Caixa)" || items.conta.includes("Gastos com Cart") || items.conta === "Produto fora Garantia que empresa Arcou" || items.conta === "Alugueis" || items.conta === "Salarios á Pagar") {
        createBalData["tipo"] = items.tipo;
        createBalData["conta"] = items.conta;
        createBalData["total"] = items.total;
        createBalData["data"] = currentDate;
      }
      if (Object.keys(createBalData).length > 0) {
        dataBal.push(createBalData);
        // appDispatch({ type: "balanco", value: { tipo: createBalData.tipo, conta: createBalData.conta, total: createBalData.total } }); // unnecessary to pass this as Dispatch
      }
    });

    // let data1 = await appState.NewBalanceData;
    const sendData = await Axios.post("http://localhost:5000/insertBalance", { dataBal }, { timeout: 0 })
      // const sendData = await Axios.post("http://localhost:5000/insertBalance", { data1, dataBal }, { timeout: 0 }) // correct
      .then(resp => {
        if (resp.data) {
          console.log(resp.data);
        }
        // if resp.data = something we update state - this will automatically-re render the component
      })
      .catch(err => {
        console.log(err.data);
      });

    // console.log(lastDateScrape);

    // access server with post

    // send the data in State to database - this will be done in the useEffect down below now

    // console.log(dataBal, "Balanco"); // create an array
    // appDispatch({type: 'balanco', value: dataBal})
    // Scrape new data
    // if Scrape succesfull then create new queries based on it otherwise queries keep the second last value
    // scrape shold try few times
    // scrape should display error message where the issue is
    // the button should display an icon generating new balance
  }

  useEffect(() => {
    if (state.sendCount) {
      setState(draft => {
        draft.isSaving = true;
      });
      createBal();
    }
  }, [state.sendCount]);

  // // // Maybe UseEffect not necessary anymore
  // useEffect(() => {
  //   const insertBalDat = async () => {
  //     try {
  //       let lastDate = await state.datas.slice(-1)[0].data;
  //       let currentDate = await dtConvert.format(new Date(), "yyyy-MM-dd");
  //       if (lastDate !== currentDate) {
  //         // get some data for the new balance using query from edit
  //         const getBalance = await Axios.get("http://localhost:5000/edit", {
  //           params: {
  //             date: lastDate
  //           }
  //         });
  //         const balanceData = await [...getBalance.data];
  //         // console.log(balanceData)

  //         let dataBal = [];
  //         balanceData.forEach(items => {
  //           let createBalData = {};

  //           // console.log(items);
  //           if (items.tipo === "Ativo Permanente") {
  //             createBalData["conta"] = items.conta;
  //             createBalData["total"] = items.total;
  //             createBalData["tipo"] = items.tipo;
  //           } else if (items.conta === "Junior Investimento na Empresa") {
  //             createBalData["conta"] = items.conta;
  //             createBalData["total"] = items.total;
  //             createBalData["tipo"] = items.tipo;
  //           } else if (items.conta === "Junior Participacao Lucro a receber (REF Periodo 2016 a 2017)") {
  //             createBalData["conta"] = items.conta;
  //             createBalData["total"] = items.total;
  //             createBalData["tipo"] = items.tipo;
  //           } else if (items.conta === "Paulo Participacao Lucro") {
  //             createBalData["conta"] = items.conta;
  //             createBalData["total"] = items.total;
  //             createBalData["tipo"] = items.tipo;
  //           } else if (items.conta === "Projeto 2019 Expansao Empresa (Fluxo Caixa)") {
  //             createBalData["conta"] = items.conta;
  //             createBalData["total"] = items.total;
  //             createBalData["tipo"] = items.tipo;
  //           } else if (items.conta.includes("Gastos com Cart")) {
  //             createBalData["conta"] = items.conta;
  //             createBalData["total"] = items.total;
  //             createBalData["tipo"] = items.tipo;
  //           } else if (items.conta === "Produto fora Garantia que empresa Arcou") {
  //             createBalData["conta"] = items.conta;
  //             createBalData["total"] = items.total;
  //             createBalData["tipo"] = items.tipo;
  //           } else if (items.conta === "Alugueis") {
  //             createBalData["conta"] = items.conta;
  //             createBalData["total"] = items.total;
  //             createBalData["tipo"] = items.tipo;
  //           } else if (items.conta === "Salarios á Pagar") {
  //             createBalData["conta"] = items.conta;
  //             createBalData["total"] = items.total;
  //             createBalData["tipo"] = items.tipo;
  //           }
  //           if (Object.keys(createBalData).length > 0) {
  //             dataBal.push(createBalData);
  //             // appDispatch({ type: "balanco", value: { tipo: createBalData.tipo, conta: createBalData.conta, total: createBalData.total } }); // unnecessary to pass this as Dispatch
  //           }
  //         });

  //         let data1 = await appState.NewBalanceData;
  //         const sendData = await Axios.post("http://localhost:5000/insertBalance", { data1 }, { timeout: 0 })
  //           // const sendData = await Axios.post("http://localhost:5000/insertBalance", { data1, dataBal }, { timeout: 0 }) // correct
  //           .then(resp => {
  //             console.log("data back");
  //             if (sendData.data) {
  //               console.log("Inserted new balance to Database");
  //             }
  //             // if resp.data = something we update state - this will automatically-re render the component
  //           })
  //           .catch(err => {
  //             console.log(err.data);
  //           });
  //       }
  //     } catch (error) {
  //       console.error(error.message);
  //     }
  //   };
  //   insertBalDat();
  // }, [appState.NewBalanceData]);
  // // // end of use Effect

  useEffect(() => {
    const getData = async () => {
      try {
        //get Balance Data
        const response = await fetch("http://localhost:5000/balance");
        const jsonData = await response.json();
        // console.log(jsonData, "raw data")
        // set contas

        let newSet = [];
        let datas = [];
        let valor = [];

        for (let i = 0; i < jsonData.length; i++) {
          datas = Object.keys(jsonData[i].json_object_agg);
          valor = Object.values(jsonData[i].json_object_agg);
          // console.log(valor)
          let outro = {};
          outro["conta"] = jsonData[i].conta;
          outro["tipo"] = jsonData[i].tipo;

          for (let j = 0; j < datas.length; j++) {
            let nome = datas[j];
            let dadinho = valor[j];

            outro[nome] = dadinho;
            // console.log(outro, "inside loop")
          }
          // outside the loop execute this for when the dataset outro is ready
          newSet.push(outro);
        }
        // console.log(newSet) // check details
        // SET Unique Dates

        const uniqDates = datas.map(items => {
          return { id: uid(), data: items, select: true };
        });

        // setDadosPivot(newSet);
        // setDatas(uniqDates);

        setState(draft => {
          draft.datas = uniqDates;
          draft.dadosPivot = newSet;
        });
      } catch (error) {
        console.error(error.message);
      }
    };
    getData();
  }, []);

  return (
    <>
      <h1 className="text-center mt-5">Balance Sheet</h1>
      <div className="container mt-5">
        <div className="row justify-content-center">
          <button type="button" className="btn btn-outline-primary col-md-auto" onClick={submitHandler} disabled={state.isSaving}>
            Criar novo Balanco
          </button>
          <div className="dropdown col-md-auto">
            <button className="btn btn-primary dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Dates
            </button>
            <div className="dropdown-menu" aria-labelledby="dropdownMenu2">
              {state.datas.map(d => (
                <div className="dropdown-item" key={d.id}>
                  <input
                    type="checkbox"
                    checked={d.select}
                    onChange={event => {
                      let checked = event.target.checked;
                      setState(draft => {
                        draft.datas.map(items => {
                          if (d.id === items.id) {
                            items.select = checked;
                          }
                          return items;
                        });
                      });
                    }}
                    // handleChange={handleChange(datas.id)}
                  />
                  {`${new Date(d.data).getDate()}/${new Date(d.data).getMonth() + 1}/${new Date(d.data).getFullYear()}`}
                </div>
              ))}
            </div>
          </div>

          {/* {datas.map(d => (
            <div className="col-md-auto" key={d.id}>
              <input
                type="checkbox"
                checked={d.select}
                onChange={event => {
                  let checked = event.target.checked;
                  setDatas(
                    datas.map(items => {
                      if (d.id === items.id) {
                        items.select = checked;
                      }
                      return items;
                    })
                  );
                }}
                // handleChange={handleChange(datas.id)}
              />
              {`${new Date(d.data).getDate()}/${new Date(d.data).getMonth() + 1}/${new Date(d.data).getFullYear()}`}
            </div>
          ))} */}
        </div>
      </div>

      <div className="row mt-3">
        <div className="col table-responsive ">
          <div>
            <h3 className="mt-4">Ativo Circulante {console.count()}</h3>
            <table className="table table-striped table-sm mt-4 ">
              <thead>
                <tr>
                  <th>Periodo</th>

                  {state.datas.map(
                    datas =>
                      datas.select === true ? (
                        <th key={datas.data}>
                          <Link to={"/edit/" + datas.data}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</Link>
                        </th>
                      ) : null
                    // <th>{`${datas.}`}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Ativo Circulante Total" ? (
                    <tr className="font-weight-bold table-info" key={uid()}>
                      <td>{items.conta}</td>
                      {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                      {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                      {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
                    </tr>
                  ) : items.tipo === "Ativo Circulante" ? (
                    <tr key={uid()}>
                      <td>{items.conta}</td>
                      {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                      {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                      {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
            <h3 className="mt-5">Realizavel Longo Prazo</h3>

            <table className="table table-striped table-sm mt-4"></table>

            <h3 className="mt-4">Ativo Circulante</h3>
            <table className="table table-striped table-sm mt-4 ">
              <thead>
                <tr>
                  <th>Periodo</th>

                  {state.datas.map(
                    datas => (datas.select === true ? <th key={uid()}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</th> : null)
                    // <th>{`${datas.}`}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Ativo Permanente Total" ? (
                    <tr className="font-weight-bold table-info" key={uid()}>
                      <td>{items.conta}</td>
                      {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                      {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                      {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
                    </tr>
                  ) : items.tipo === "Ativo Permanente" ? (
                    <tr key={uid()}>
                      <td>{items.conta}</td>
                      {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                      {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                      {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col table-responsive">
          {" "}
          <div className="table-responsive">
            <h3 className="mt-4">Passivo Circulante</h3>
            <table className="table table-striped table-sm mt-4 ">
              <thead>
                <tr>
                  <th>Periodo</th>

                  {state.datas.map(
                    datas => (datas.select === true ? <th key={uid()}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</th> : null)
                    // <th>{`${datas.}`}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Passivo Circulante Total" ? (
                    <tr className="font-weight-bold table-info" key={uid()}>
                      <td>{items.conta}</td>
                      {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                      {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                      {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
                    </tr>
                  ) : items.tipo === "Passivo Circulante" ? (
                    <tr key={uid()}>
                      <td>{items.conta}</td>
                      {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                      {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                      {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>

            <h3 className="mt-4">Exigivel Longo Prazo</h3>
            <table className="table table-striped table-sm mt-4 ">
              <thead>
                <tr>
                  <th>Periodo</th>

                  {state.datas.map(
                    datas => (datas.select === true ? <th key={uid()}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</th> : null)
                    // <th>{`${datas.}`}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Passivo Exigivel a Longo Prazo" ? (
                    <tr key={uid()}>
                      <td>{items.conta}</td>
                      {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                      {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                      {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
                    </tr>
                  ) : items.tipo === "Passivo Exigivel a Longo Prazo Total" ? (
                    <tr className="font-weight-bold table-info" key={uid()}>
                      <td>{items.conta}</td>
                      {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                      {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                      {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
            <h3 className="mt-4">Patrimonio Liquido</h3>
            <table className="table table-striped table-sm mt-4 ">
              <thead>
                <tr>
                  <th>Periodo</th>

                  {state.datas.map(
                    datas => (datas.select === true ? <th key={uid()}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</th> : null)
                    // <th>{`${datas.}`}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Patrimonio Liquido" ? (
                    <tr key={uid()}>
                      <td>{items.conta}</td>
                      {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                      {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                      {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
                    </tr>
                  ) : items.tipo === "Patrimonio Liquido Total" ? (
                    <tr className="font-weight-bold table-info" key={uid()}>
                      <td>{items.conta}</td>
                      {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                      {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                      {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <h3 className="mt-5">Analise</h3>
      <table className="table table-striped table-sm mt-4 ">
        <thead>
          <tr>
            <th>Periodo</th>

            {state.datas.map(
              datas => (datas.select === true ? <th key={uid()}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</th> : null)
              // <th>{`${datas.}`}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {state.dadosPivot.map((items, index) =>
            items.tipo === "Analise" && items.conta !== "CRESCIMENTO EM PATRIMONIO LIQUIDO" && items.conta !== "Meses de um Periodo ao Outro" ? (
              <tr key={uid()}>
                <td>{items.conta}</td>
                {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                {state.datas.map(datas => (datas.select === true ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : null))}
                {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
              </tr>
            ) : items.conta === "CRESCIMENTO EM PATRIMONIO LIQUIDO" ? (
              <tr className="font-weight-bold table-info" key={uid()}>
                <td>{items.conta}</td>
                {/* {dadosBalanco.data ==='2017-11-19T13:00:00.000Z' ? <td> {dadosBalanco.total}</td> : ''} */}
                {chartDados.map(dados => (
                  <td key={uid()}>R${dados}</td>
                ))}
                {/* {datas.map(datas => dadosBalanco.map(dadosBalanco => (dadosBalanco.data === datas.data && dadosBalanco.conta === contas && datas.select === true ? <td> {dadosBalanco.total}</td> : "")))} */}
              </tr>
            ) : null
          )}
        </tbody>
      </table>
      <div className="container">
        <div className="row">
          <div className="col">
            <Line data={chartData} />
          </div>

          <div className="col"></div>
        </div>
      </div>
    </>
  );
}

export default BalanceTest;
