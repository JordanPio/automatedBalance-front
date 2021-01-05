import React, { useEffect, useContext } from "react";
import { Line } from "react-chartjs-2";
import Axios from "axios";
import { parse } from "date-fns";
import { useImmer } from "use-immer";
import StateContext from "../StateContext";
import DispatchContext from "../DispatchContext";
import { Link } from "react-router-dom";

const dtConvert = require("date-fns");

function BalanceSheet() {
  // states
  const appDispatch = useContext(DispatchContext);
  const appState = useContext(StateContext);

  // const [datas, setDatas] = useState([]);
  // const [dadosPivot, setDadosPivot] = useState([]);
  const [state, setState] = useImmer({
    datas: [],
    dadosPivot: [],
    totais: [],
    analysis: {},
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

  let chartDados = [];

  if (state.analysis.crescPeriodo) {
    console.log(state.analysis.crescPeriodo);

    state.datas.forEach(datas => {
      state.analysis.crescPeriodo[datas.data] !==undefined ? chartDados.push(state.analysis.crescPeriodo[datas.data].toFixed(2)) : null
    });
    // console.log(chartDados);

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
        fill: true
      }
    ]
  };

  // create new balance

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

        // create and initiate objects to calculate Totals
        let totais = [];
        totais["Ativo Circulante"] = {};
        totais["Ativo Permanente"] = {};
        totais["Ativo"] = {};
        totais["Passivo"] = {};
        totais["Passivo Circulante"] = {};
        totais["Passivo Exigivel a Longo Prazo"] = {};
        totais["Patrimonio Liquido"] = {};
        totais["Capital Social"] = {};
        totais["Lucro Exercicio"] = {};

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

            // // Initiate object for calculating totals (Nothing to do here)
            totais["Ativo Circulante"][nome] = 0;
            totais["Ativo Permanente"][nome] = 0;
            totais["Ativo"][nome] = 0;
            totais["Passivo"][nome] = 0;
            totais["Passivo Circulante"][nome] = 0;
            totais["Passivo Exigivel a Longo Prazo"][nome] = 0;
            totais["Patrimonio Liquido"][nome] = 0;
            totais["Capital Social"][nome] = 0;
            totais["Lucro Exercicio"][nome] = 0;
          }
          // outside the loop execute this for when the dataset outro is ready
          newSet.push(outro);
        }
        // console.log(newSet, "Vamos usar esse", datas); // check details

        // Calculated Fields

        newSet.forEach(items => {
          if (items.tipo === "Ativo Circulante") {
            // console.log(items)
            datas.forEach(data => {
              // console.log(items[data].f1)
              totais["Ativo Circulante"][data] = totais["Ativo Circulante"][data] + items[data].f1;
            });
          } else if (items.tipo === "Ativo Permanente") {
            // console.log(items)
            datas.forEach(data => {
              // console.log(items[data].f1)
              totais["Ativo Permanente"][data] = totais["Ativo Permanente"][data] + items[data].f1;
            });
          } else if (items.tipo === "Passivo Circulante") {
            // console.log(items)
            datas.forEach(data => {
              // console.log(items[data], "does it exist", data)
              if (items[data] !== undefined) {
                totais["Passivo Circulante"][data] = totais["Passivo Circulante"][data] + items[data].f1;
              } else {
                totais["Passivo Circulante"][data] = totais["Passivo Circulante"][data] + 0;
              }
            });
          } else if (items.tipo === "Passivo Exigivel a Longo Prazo") {
            // console.log(items)
            datas.forEach(data => {
              // console.log(items[data].f1)
              // console.log(items[data], "does it exist", data)
              if (items[data] !== undefined) {
                // console.log(items[data].f1, "WE are at final");
                totais["Passivo Exigivel a Longo Prazo"][data] = totais["Passivo Exigivel a Longo Prazo"][data] + items[data].f1;
              } else {
                totais["Passivo Exigivel a Longo Prazo"][data] = totais["Passivo Exigivel a Longo Prazo"][data] + 0;
              }
            });
          }
        });

        // // Calculate Capita Social e Patrimonio Liquido
        datas.forEach(data => {
          // console.log(data);
          totais["Ativo"][data] = totais["Ativo Circulante"][data] + totais["Ativo Permanente"][data];
          // totais["Capital Social"][data] = 20000;
          totais["Capital Social"][data] = totais["Ativo"][data] - (totais["Passivo Circulante"][data] + totais["Passivo Exigivel a Longo Prazo"][data]);
          // totais["Lucro Exercicio"][data] = totais["Ativo"][data] - (totais["Passivo Circulante"][data] + totais["Passivo Exigivel a Longo Prazo"][data] + totais["Capital Social"][data]);
          totais["Patrimonio Liquido"][data] = totais["Lucro Exercicio"][data] + totais["Capital Social"][data];
          totais["Passivo"][data] = totais["Patrimonio Liquido"][data] + totais["Passivo Circulante"][data] + totais["Passivo Exigivel a Longo Prazo"][data];
        });

        // console.log(datas, "Datas aqui");

        // SET Unique Dates

        const uniqDates = datas.map(items => {
          return { id: uid(), data: items, select: true };
        });

        // console.log(uniqDates);
        // // Update state to pass to other components - this may not be needed
        let lastDate = uniqDates.slice(-1)[0].data;
        let secondLastDate = uniqDates.slice(-2)[0].data;

        await appDispatch({ type: "secondLastDate", value: secondLastDate });
        await appDispatch({ type: "lastDate", value: lastDate });
        //
        setState(draft => {
          draft.datas = uniqDates;
          draft.dadosPivot = newSet;
          draft.totais = totais;
        });
      } catch (error) {
        console.error(error.message);
      }
    };
    getData();
  }, [appState.currentDate]);

  useEffect(() => {
    if (state.sendCount) {
      setState(draft => {
        draft.isSaving = true;
      });
      createBal();
    }
  }, [state.sendCount]);

  useEffect(() => {
    // // Calculated Data
    let analysis = {};
    if (state.totais.Ativo) {
      // console.log(state.totais, "totais")

      let datas = [];
      state.datas.forEach((dt, i, ar) => {
        if (dt.select === true) {
          return datas.push(dt);
        } else {
          return null;
        }
      });
      // console.log(datas);

      // Initiate Objects
      let circulante = {};
      let crescPeriodo = {};
      let liquidezGeral = {};
      let mesPeriodo = {};
      let lucroMensal = {};
      for (let i = datas.length - 1; i >= 0; i--) {
        // console.log(datas[i]);
        if (datas[i].select === true && datas[i - 1] !== undefined) {
          circulante[datas[i].data] = state.totais["Ativo Circulante"][datas[i].data] - state.totais["Passivo Circulante"][datas[i].data];

          // // Diferenca entre AtivoCirc - Passivo Circulante por periodo
          // // te da uma ideia de como esta as financas da empresa
          crescPeriodo[datas[i].data] = state.totais["Ativo"][datas[i].data] - state.totais["Passivo Circulante"][datas[i].data] - (state.totais["Ativo"][datas[i - 1].data] - state.totais["Passivo Circulante"][datas[i - 1].data]);

          // // (TOTAL Ativo - Passivo circulante) - periodo anterior
          // // isso da uma ideia de quanto cresce seu patrimonio pois a retirada dos socios nao conta (lancado no exigivel a longo prazo)
          liquidezGeral[datas[i].data] = state.totais["Ativo"][datas[i].data] - state.totais["Passivo Circulante"][datas[i].data];

          // // qtde meses que passou entre periodo
          const d1Y = new Date(datas[i].data).getFullYear();
          const d2Y = new Date(datas[i - 1].data).getFullYear();
          const d1M = new Date(datas[i].data).getMonth();
          const d2M = new Date(datas[i - 1].data).getMonth();

          mesPeriodo[datas[i].data] = d1M + 12 * d1Y - (d2M + 12 * d2Y);
          lucroMensal[datas[i].data] = crescPeriodo[datas[i].data] / mesPeriodo[datas[i].data];

          // console.log(liquidezGeral, crescPeriodo);
          // console.log(crescAtivo, "Periodo = ");
        } else if (datas[i].select === true) {
          circulante[datas[i].data] = state.totais["Ativo Circulante"][datas[i].data] - state.totais["Passivo Circulante"][datas[i].data];
          crescPeriodo[datas[i].data] = 0;
          liquidezGeral[datas[i].data] = state.totais["Ativo"][datas[i].data] - state.totais["Passivo Circulante"][datas[i].data];

          mesPeriodo[datas[i].data] = 0;
          lucroMensal[datas[i].data] = 0;
        }
      }
      analysis.circulante = circulante;
      analysis.crescPeriodo = crescPeriodo;
      analysis.liquidezGeral = liquidezGeral;
      analysis.mesPeriodo = mesPeriodo;
      analysis.lucroMensal = lucroMensal;
      // console.log(analysis, "I am here");
      // console.log("this reloads");
      setState(draft => {
        draft.analysis = analysis;
      });
    }
  }, [state.datas]);

  async function createBal() {
    try {
      let lastDate = await state.datas.slice(-1)[0].data;
      // let secondLastDate = await state.datas.slice(-2)[0].data;
      let currentDate = "2020-12-14";
      // let currentDate = await dtConvert.format(new Date(), "yyyy-MM-dd"); // correct
      let currentDateScrape = await dtConvert.format(new Date(), "dd-MM-yyyy");
      let lastDateScrape = await dtConvert.format(parse(lastDate, "yyyy-MM-dd", new Date()), "dd-MM-yyyy");
      // check if secondLastDate = currentDate so we dont need to run the script and just dispatch the thing
      // console.log(currentDate);
      // if (lastDate === currentDate) {
      //   console.log('i am here')
      // }

      // // //

      // // // Scrape Data from markup system
      // const res = await Axios.post("http://localhost:5000/scrapeAll", { lastDate, currentDate, lastDateScrape, currentDateScrape }, { timeout: 0 })
      //   .then(resp => {
      //     console.log(resp.data);
      //   })
      //   .catch(err => {
      //     console.log(err.data);
      //   });

      // //  Get some of the old Data to add to the newBalance as they stay the same (Ativo Performanente, Alugueis e etc)

      const getBalance = await Axios.get("http://localhost:5000/edit", {
        params: {
          date: lastDate
        }
      });
      const balanceData = await [...getBalance.data];
      console.log(balanceData); // check if data is coming correct

      let dataBal = [];
      balanceData.forEach(items => {
        let createBalData = {};

        // console.log(items); // check what is inside the data
        if (
          items.tipo === "Ativo Permanente" || //
          items.conta === "Junior Investimento na Empresa" ||
          items.conta === "Junior Participacao Lucro a receber (REF Periodo 2016 a 2017)" ||
          items.conta === "Paulo Participacao Lucro" ||
          items.conta === "Projeto 2019 Expansao Empresa (Fluxo Caixa)" ||
          items.conta.includes("Gastos com Cart") ||
          items.conta === "Produto fora Garantia que empresa Arcou" ||
          items.conta === "Aluguéis" ||
          items.conta === "Salarios á Pagar"
        ) {
          createBalData["tipo"] = items.tipo;
          createBalData["conta"] = items.conta;
          createBalData["total"] = items.total;
          createBalData["data"] = currentDate;
        } else if (
          items.conta === "Cheque que nao tinha sido lancado no sistema" || //
          items.conta === "Comissões" ||
          items.conta === "Cheques" ||
          items.conta === "Bancos (Clique no Link)" ||
          items.conta === "Cartoes em outros bancos(HIPERCARD)" ||
          items.conta === "Caixa (Dinheiro Gaveta, a depositar, Caixa dia)" ||
          items.conta === "Devolucoes B2W" ||
          items.conta === "Conta Mercado Pago e Paypal ou B2W" ||
          items.conta === "RMA a Enviar + RMA A RECEBER( Enviado e em Credito)" ||
          items.conta === "Cartoes a Receber (VISA, MASTERCARD) https://portal.stone.com.br/" ||
          items.conta === "Dinheiro que ainda não entraram (Meio Termo, em transito para cair na conta)"
        ) {
          createBalData["tipo"] = items.tipo;
          createBalData["conta"] = items.conta;
          createBalData["total"] = 0.123;
          createBalData["data"] = currentDate;
        }
        if (Object.keys(createBalData).length > 0) {
          dataBal.push(createBalData);
        }
      });

      // Insert data into Balance database
      const sendData = await Axios.post("http://localhost:5000/insertBalance", { dataBal }, { timeout: 0 })
        .then(resp => {
          if (sendData.data) {
            console.log(sendData.data);
          }
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
      // // uncomment this section to update without run the script

      // Update Dates at Global to update other components
      console.log("Start Updating other Components");
      // await appDispatch({ type: "secondLastDate", value: appState.lastDate });
      await appDispatch({ type: "lastDate", value: lastDate });
      await appDispatch({ type: "currentDate", value: currentDate });

      // Update State to Re-Enable Button
      setState(draft => {
        draft.isSaving = false;
      });
    } catch (error) {
      console.error(error.message);
    }
  }

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
                  />
                  {`${new Date(d.data).getDate()}/${new Date(d.data).getMonth() + 1}/${new Date(d.data).getFullYear()}`}
                </div>
              ))}
            </div>
          </div>
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

                  {state.datas.map(datas =>
                    datas.select === true ? (
                      <th key={datas.data}>
                        <Link to={"/edit/" + datas.data}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</Link>
                      </th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Total Ativo Circulante */}
                <tr className="font-weight-bold table-info" key={uid()}>
                  <td>Total do Ativo Circulante</td>
                  {state.totais["Ativo Circulante"] ? state.datas.map(datas => (datas.select === true ? <td key={uid()}>R${state.totais["Ativo Circulante"][datas.data].toLocaleString()}</td> : null)) : null}
                </tr>
                {/* Data */}
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Ativo Circulante" ? (
                    <tr key={uid()}>
                      <td>{items.conta}</td>
                      {state.datas.map(datas => (datas.select === true ? items[datas.data] !== undefined ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : <td key={uid()}>R$0</td> : null))}
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
            <h3 className="mt-5">Realizavel Longo Prazo</h3>

            <table className="table table-striped table-sm mt-4"></table>

            <h3 className="mt-4">Ativo Permanente</h3>
            <table className="table table-striped table-sm mt-4 ">
              <thead>
                <tr>
                  <th>Periodo</th>

                  {state.datas.map(datas => (datas.select === true ? <th key={uid()}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</th> : null))}
                </tr>
              </thead>
              <tbody>
                <tr className="font-weight-bold table-info" key={uid()}>
                  <td>Total do Ativo Permanente</td>
                  {state.totais["Ativo Permanente"] ? state.datas.map(datas => (datas.select === true ? <td key={uid()}>R${state.totais["Ativo Permanente"][datas.data].toLocaleString()}</td> : null)) : null}
                </tr>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Ativo Permanente" ? (
                    <tr key={uid()}>
                      <td>{items.conta}</td>

                      {state.datas.map(datas => (datas.select === true ? items[datas.data] !== undefined ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : <td key={uid()}>R$0</td> : null))}
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

                  {state.datas.map(datas => (datas.select === true ? <th key={uid()}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</th> : null))}
                </tr>
              </thead>
              <tbody>
                <tr className="font-weight-bold table-info" key={uid()}>
                  <td>Total do Passivo Circulante</td>
                  {state.totais["Passivo Circulante"] ? state.datas.map(datas => (datas.select === true ? <td key={uid()}>R${state.totais["Passivo Circulante"][datas.data].toLocaleString()}</td> : null)) : null}
                </tr>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Passivo Circulante" ? (
                    <tr key={uid()}>
                      <td>{items.conta}</td>

                      {state.datas.map(datas => (datas.select === true ? items[datas.data] !== undefined ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : <td key={uid()}>R$0</td> : null))}
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

                  {state.datas.map(datas => (datas.select === true ? <th key={uid()}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</th> : null))}
                </tr>
              </thead>
              <tbody>
                <tr className="font-weight-bold table-info" key={uid()}>
                  <td>Total do Exigivel Longo Prazo</td>
                  {state.totais["Passivo Exigivel a Longo Prazo"] ? state.datas.map(datas => (datas.select === true ? <td key={uid()}>R${state.totais["Passivo Exigivel a Longo Prazo"][datas.data].toLocaleString()}</td> : null)) : null}
                </tr>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Passivo Exigivel a Longo Prazo" ? (
                    <tr key={uid()}>
                      <td>{items.conta}</td>

                      {state.datas.map(datas => (datas.select === true ? items[datas.data] !== undefined ? <td key={items[datas.data].f2}>R${items[datas.data].f1.toLocaleString()}</td> : <td key={uid()}>R$0</td> : null))}
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

                  {state.datas.map(datas => (datas.select === true ? <th key={uid()}>{`${new Date(datas.data).getDate()}/${new Date(datas.data).getMonth() + 1}/${new Date(datas.data).getFullYear()}`}</th> : null))}
                </tr>
              </thead>
              <tbody>
                <tr className="font-weight-bold table-info" key={uid()}>
                  <td>Total do Patrimonio Liquido</td>
                  {state.totais["Patrimonio Liquido"] ? state.datas.map(datas => (datas.select === true ? <td key={uid()}>R${state.totais["Patrimonio Liquido"][datas.data].toLocaleString()}</td> : null)) : null}
                </tr>
                <tr key={uid()}>
                  <td>Capital Social</td>
                  {state.totais["Capital Social"] ? state.datas.map(datas => (datas.select === true ? <td key={uid()}>R${state.totais["Capital Social"][datas.data].toLocaleString()}</td> : null)) : null}
                </tr>
                <tr key={uid()}>
                  <td>Lucro Exercicio</td>
                  {state.totais["Lucro Exercicio"] ? state.datas.map(datas => (datas.select === true ? <td key={uid()}>R${state.totais["Lucro Exercicio"][datas.data].toLocaleString()}</td> : null)) : null}
                </tr>
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
          <tr key={uid()}>
            <td>Total do Ativo</td>
            {state.totais.Ativo ? state.datas.map(datas => (datas.select === true ? <td key={uid()}>R${state.totais.Ativo[datas.data].toLocaleString()}</td> : null)) : null}
          </tr>

          {state.analysis.circulante ? (
            <tr key={uid()}>
              <td>Liquidez Geral</td>
              {state.datas.map(datas => (datas.select === true && state.analysis.liquidezGeral[datas.data] !== undefined ? <td key={uid()}>R${state.analysis.liquidezGeral[datas.data].toLocaleString()}</td> : null))}
            </tr>
          ) : null}
          {state.analysis.circulante ? (
            <tr key={uid()}>
              <td>Liquidez Seca</td>
              {state.datas.map(datas => (datas.select === true && state.analysis.circulante[datas.data] !== undefined ? <td key={uid()}>R${state.analysis.circulante[datas.data].toLocaleString()}</td> : null))}
            </tr>
          ) : null}
          {state.analysis.circulante ? (
            <tr key={uid()}>
              <td>Crescimento Periodo</td>
              {state.datas.map(datas => (datas.select === true && state.analysis.crescPeriodo[datas.data] !== undefined ? <td key={uid()}>R${state.analysis.crescPeriodo[datas.data].toLocaleString()}</td> : null))}
            </tr>
          ) : null}
          {state.analysis.circulante ? (
            <tr key={uid()}>
              <td>Periodo</td>
              {state.datas.map(datas => (datas.select === true && state.analysis.mesPeriodo[datas.data] !== undefined ? <td key={uid()}>{state.analysis.mesPeriodo[datas.data].toLocaleString()} Meses</td> : null))}
            </tr>
          ) : null}
          {state.analysis.circulante ? (
            <tr key={uid()}>
              <td>Lucro Mensal</td>
              {state.datas.map(datas => (datas.select === true && state.analysis.lucroMensal[datas.data] !== undefined ? <td key={uid()}>R${state.analysis.lucroMensal[datas.data].toLocaleString()}</td> : null))}
            </tr>
          ) : null}
        </tbody>
      </table>

      {/* // GRAPH STARTS HERE */}

      {/* <div className="container"> */}
        <div className="row">
          <div className="col">
            <Line data={chartData} />
          </div>

          <div className="col">
          </div>
        </div>
      {/* </div> */}
    </>
  );
}

export default BalanceSheet;
