import React, { useEffect } from "react";
import { Bar } from "react-chartjs-2";
import Axios from "axios";
import { parse } from "date-fns";
import { useImmer } from "use-immer";
import { Link } from "react-router-dom";
import VendasDados from "./VendasDadosV2";
import VendasDados1 from "./VendasDados";
import CashFlow from "./CashFlow";
import ContasPagar from "./ContasPagar";
import ContasReceber from "./ContasReceber";
import ContasPagas from "./ContasPagas";

const dtConvert = require("date-fns");

function BalanceSheet() {
  const [state, setState] = useImmer({
    dates: [],
    currentBalanceDate: "",
    prevBalanceDate: "",
    newBalanceDate: "",
    dadosPivot: [],
    totais: [],
    analysis: {},
    analysisOrig: {},
    sendCount: 0,
    newBalDataUpdateCount: 0,
    isSaving: false,
  });

  const genRandomId = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  function createNewBalHandlerBt(e) {
    e.preventDefault();
    setState((draft) => {
      draft.sendCount++;
    });
  }

  let chartColours = [
    "#90EE90",
    "#B0C4DE",
    "#FFD700",
    "#FFC0CB",
    "#FFF0F5",
    "#E6E6FA",
    "#F0F8FF",
    "#FFE4E1",
    "#FFFACD",
    "#F8F8FF",
    "#DCDCDC",
    "#FFF8DC",
  ];

  let crescPatLiqData = [];

  let chartPatLiqLabels = [];

  // // console.log("can you see this", state.analysis.lucroMensal.length);
  if (state.analysis.lucroMensal) {
    state.dates.forEach((items) => {
      if (
        items.select === true &&
        state.analysis.crescPeriodo[items.data] !== undefined
      ) {
        chartPatLiqLabels.push(
          `${new Date(items.data).getDate()}/${
            new Date(items.data).getMonth() + 1
          }/${new Date(items.data).getFullYear()}`
        );
        // console.log(state.analysis);
        crescPatLiqData.push(state.analysis.lucroMensal[items.data].toFixed(2));
      }
    });
  }

  const chartCrescPatLiq = {
    labels: chartPatLiqLabels,
    datasets: [
      {
        label: "Periodo",
        data: crescPatLiqData,
        backgroundColor: chartColours,
      },
    ],
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (state.totais.Ativo) analysisTableData();
  }, [state.dates]);

  useEffect(() => {
    if (state.newBalDataUpdateCount === 3) {
      getData();
    }
  }, [state.newBalDataUpdateCount]);

  useEffect(() => {
    if (state.sendCount) {
      setState((draft) => {
        draft.isSaving = true;
      });
      createNewBalance();
    }
  }, [state.sendCount]);

  async function getData() {
    try {
      const { data: balanceData } = await Axios.get(
        "http://localhost:5000/balance"
      );

      await setState((draft) => {
        draft.dates = balanceData.dates;
        draft.dadosPivot = balanceData.dadosPivot;
        draft.totais = balanceData.totais;
        draft.analysisOrig = balanceData.analysisPerPeriod;
        draft.currentBalanceDate = balanceData.currentBalanceDate;
        draft.prevBalanceDate = balanceData.prevBalanceDate;
      });
    } catch (error) {
      console.error(error.message);
    }
  }

  async function createNewBalance() {
    try {
      let lastDate = await state.dates.slice(-1)[0].data;
      let newBalanceDate = await dtConvert.format(new Date(), "yyyy-MM-dd");

      // this will be used for the databaseRequest
      let currentDateScrape = await dtConvert.format(new Date(), "dd-MM-yyyy");
      let lastDateScrape = await dtConvert.format(
        parse(lastDate, "yyyy-MM-dd", new Date()),
        "dd-MM-yyyy"
      );

      let daysAhead = await new Date(lastDate);
      await daysAhead.setDate(daysAhead.getDate() + 20);
      // convert variable date back to string! we are comparing string to string as this is used in database
      daysAhead = await dtConvert.format(daysAhead, "yyyy-MM-dd", new Date());

      if (lastDate !== newBalanceDate && newBalanceDate >= daysAhead) {
        const scrapeData = await Axios.post(
          "http://localhost:5000/scrapeAll",
          {
            lastDate,
            currentDate: newBalanceDate,
            lastDateScrape,
            currentDateScrape,
          },
          { timeout: 0 }
        )
          .then((resp) => {
            console.log(resp.data);
          })
          .catch((err) => {
            console.log(err.data);
          });

        //  Get some of the old Data to add to the newBalance as they stay the same (Ativo Performanente, Alugueis e etc)

        await updateDbEntriesForNewNBalance(lastDate, newBalanceDate);

        // await updateDbContasApagar();

        await console.log("Start Updating Components");
        // New Balance nao pode ser o trigger pra reload o balance component - tem que ser outro. Ai talvez eu use o redux
        // if updatedCount = certain number than run the content of the useEffect otherwise no

        await setState((draft) => {
          draft.isSaving = false;
          draft.newBalanceDate = newBalanceDate;
        });
      } else {
        console.log(
          "E muito cedo para rodar outro Balanco, data corrente menor que 30 dias"
        );
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  async function updateDbEntriesForNewNBalance(lastDate, newBalanceDate) {
    const getPrevEntries = await Axios.get("http://localhost:5000/edit", {
      params: {
        date: lastDate,
      },
    });
    const prevEntries = await [...getPrevEntries.data];

    let dataBal = [];
    await prevEntries.forEach((items) => {
      let createBalData = {};

      if (
        items.tipo === "Ativo Permanente" || //
        items.conta === "Junior Investimento na Empresa" ||
        items.conta ===
          "Junior Participacao Lucro a receber (REF Periodo 2016 a 2017)" ||
        items.conta === "Paulo Participacao Lucro" ||
        items.conta === "Projeto 2019 Expansao Empresa (Fluxo Caixa)" ||
        items.conta.includes("Gastos com Cart") ||
        items.conta === "Produto fora Garantia que empresa Arcou" ||
        items.conta === "Alugueis" ||
        items.conta === "Salarios Pagar" ||
        items.conta === "Stock Reserva de Lucro" ||
        items.conta === "Capital Social"
      ) {
        createBalData["tipo"] = items.tipo;
        createBalData["conta"] = items.conta;
        createBalData["total"] = items.total;
        createBalData["data"] = newBalanceDate;
      } else if (
        items.conta === "Cheque que nao tinha sido lancado no sistema" || //
        items.conta === "Comissoes" ||
        items.conta === "Cheques" ||
        items.conta === "Bancos Dinheiro" ||
        items.conta === "Cartoes em outros bancos(HIPERCARD)" ||
        items.conta === "Caixa Gaveta" ||
        items.conta === "Devolucoes B2W" ||
        items.conta === "Conta Mercado Pago e Paypal" ||
        items.conta === "RMA a Enviar e RECEBER" ||
        items.conta === "Cartoes a Receber VISA MASTERCARD" ||
        items.conta === "Lucro Prejuizo do Exercicio" ||
        items.conta === "Retirada Socios" ||
        items.conta === "Aumento Reserva de Lucro" ||
        items.conta === "Aumento Capital Social" ||
        items.conta === "Depreciacoes" ||
        items.conta === "Reducao Reserva Lucro" ||
        items.conta === "Reducao Capital Social" ||
        items.conta === "Dinheiro (Depositos nao compensados)"
      ) {
        createBalData["tipo"] = items.tipo;
        createBalData["conta"] = items.conta;
        createBalData["total"] = 0.01;
        createBalData["data"] = newBalanceDate;
      }
      if (Object.keys(createBalData).length > 0) {
        dataBal.push(createBalData);
      }
    });

    const insertNewBalanceDt = await Axios.post(
      "http://localhost:5000/insertBalance",
      { dataBal },
      { timeout: 0 }
    )
      .then((resp) => {
        if (resp.data) {
          console.log(
            "System finished adding new data to DB based on previous balance"
          );
        }
      })
      .catch((err) => {
        console.log(err, "error");
      });
  }

  function analysisTableData() {
    // // // Calculated Data
    // // console.log(state.totais, "totais")
    // let analysisPerPeriod = {};
    let selectedDates = [];
    // let tempAnalysis = state.analysis;
    state.dates.forEach((dt, i, ar) => {
      if (dt.select === false) {
        return selectedDates.push(dt);
      } else {
        return null;
      }
    });

    // console.log(selectedDates);
    // console.log(state.analysis);

    // const updatedAnalysis = Object.key(state.analysis.circulante)

    // Object.keys(state.analysis.circulante).map((dates) => {
    //   console.log(dates);
    // });

    let tempDate = state.dates;
    let tempAnalysis = JSON.parse(JSON.stringify(state.analysisOrig));

    // console.log(tempAnalysis, "Deep coPY");
    // tempAnalysis.circulante["2021-04-18"] = 0;

    for (let i = 0; i < tempDate.length; i++) {
      // console.log(data);

      if (
        (tempDate[i].select === false && !tempDate[i - 1]) ||
        (tempDate[i].select === false && !tempDate[i + 1])
      ) {
        continue;
      } else if (tempDate[i].select === false && tempDate[i + 1]) {
        let currentDate = tempDate[i].data;
        let nextDate = tempDate[i + 1].data;

        tempAnalysis.mesPeriodo[nextDate] =
          tempAnalysis.mesPeriodo[nextDate] +
          tempAnalysis.mesPeriodo[currentDate];

        tempAnalysis.crescPeriodo[nextDate] =
          tempAnalysis.crescPeriodo[nextDate] +
          tempAnalysis.crescPeriodo[currentDate];

        tempAnalysis.lucroMensal[nextDate] =
          tempAnalysis.crescPeriodo[nextDate] /
          tempAnalysis.mesPeriodo[currentDate];

        // console.log(tempAnalysis.lucroMensal[nextDate]);
      } else if (tempDate[i].select === false && tempDate[i - 1]) {
        let currentDate = tempDate[i].data;
        let prevDate = tempDate[i - 1].data;

        tempAnalysis.mesPeriodo[prevDate] =
          tempAnalysis.mesPeriodo[prevDate] +
          tempAnalysis.mesPeriodo[currentDate];

        tempAnalysis.crescPeriodo[prevDate] =
          tempAnalysis.crescPeriodo[prevDate] +
          tempAnalysis.crescPeriodo[currentDate];

        tempAnalysis.lucroMensal[prevDate] =
          tempAnalysis.crescPeriodo[prevDate] /
          tempAnalysis.mesPeriodo[currentDate];
      }
    }
    setState((draft) => {
      draft.analysis = tempAnalysis;
    });
    // // Initiate Objects
    // let circulante = {};
    // let crescPeriodo = {};
    // let liquidezGeral = {};
    // let mesPeriodo = {};
    // let lucroMensal = {};
    // for (let i = datas.length - 1; i >= 0; i--) {
    //   if (datas[i].select === true && datas[i - 1] !== undefined) {
    //     circulante[datas[i].data] =
    //       state.totais["Ativo Circulante"][datas[i].data] /
    //       state.totais["Passivo Circulante"][datas[i].data];
    //     crescPeriodo[datas[i].data] =
    //       state.totais["Lucro Exercicio"][datas[i].data];
    //     liquidezGeral[datas[i].data] =
    //       state.totais["Ativo"][datas[i].data] /
    //       state.totais["Passivo Circulante"][datas[i].data];
    //     // // qtde meses que passou entre periodo
    //     (function calcProfitPeriod() {
    //       const d1Y = new Date(datas[i].data).getFullYear();
    //       const d2Y = new Date(datas[i - 1].data).getFullYear();
    //       const d1M = new Date(datas[i].data).getMonth();
    //       const d2M = new Date(datas[i - 1].data).getMonth();
    //       mesPeriodo[datas[i].data] = d1M + 12 * d1Y - (d2M + 12 * d2Y);
    //       lucroMensal[datas[i].data] =
    //         crescPeriodo[datas[i].data] / mesPeriodo[datas[i].data];
    //     })();
    //     // Cover edge case for first balance (As we dont have the data anymore)
    //   } else if (datas[i].select === true) {
    //     circulante[datas[i].data] =
    //       state.totais["Ativo Circulante"][datas[i].data] /
    //       state.totais["Passivo Circulante"][datas[i].data];
    //     crescPeriodo[datas[i].data] =
    //       state.totais["Lucro Exercicio"][datas[i].data];
    //     liquidezGeral[datas[i].data] =
    //       state.totais["Ativo"][datas[i].data] /
    //       state.totais["Passivo Circulante"][datas[i].data];
    //     mesPeriodo[datas[i].data] = 22;
    //     lucroMensal[datas[i].data] =
    //       crescPeriodo[datas[i].data] / mesPeriodo[datas[i].data];
    //   }
    // }
    // analysisPerPeriod.circulante = circulante;
    // analysisPerPeriod.crescPeriodo = crescPeriodo;
    // analysisPerPeriod.liquidezGeral = liquidezGeral;
    // analysisPerPeriod.mesPeriodo = mesPeriodo;
    // analysisPerPeriod.lucroMensal = lucroMensal;
    // setState((draft) => {
    //   draft.analysis = analysisPerPeriod;
    // });
    // console.log(analysisPerPeriod);
  }

  function onChangeCheckBox(e) {
    let objCheckbox = e.target.checked;
    let objId = e.target.id;

    let tempDatesSelected = [];
    let dateToChange;

    state.dates.forEach((dt, i) => {
      if (dt.id === objId) {
        dateToChange = { ...dt };
        dateToChange.select = objCheckbox;
        dateToChange.position = i;

        if (dateToChange.select === true) {
          tempDatesSelected.push(dateToChange);
        }
      } else if (dt.id !== objId && dt.select === true) {
        tempDatesSelected.push(dt);
      }
    });

    let updatedCurrentDate = tempDatesSelected.pop();
    let updatedPrevtDate = tempDatesSelected.pop();

    setState((draft) => {
      draft.dates[dateToChange.position].select = dateToChange.select;
      draft.currentBalanceDate = updatedCurrentDate;
      draft.prevBalanceDate = updatedPrevtDate;
    });
  }

  function setNewBalDataUpdate() {
    setState((draft) => {
      draft.newBalDataUpdateCount++;
    });
  }

  return (
    <div>
      <div className="row bg-light sticky-top">
        <div className="col">
          <h1 className="mt-2">Balance Sheet</h1>
        </div>
        <div className="col justify-content-center form-inline mt-2">
          <button
            type="button"
            className="btn btn-outline-primary nowrap mr-sm-2"
            onClick={createNewBalHandlerBt}
            disabled={state.isSaving}
          >
            Criar novo Balanco
          </button>
          <div className="dropdown">
            <button
              className="btn btn-primary dropdown-toggle"
              type="button"
              id="dropdownMenu2"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Dates
            </button>
            <div className="dropdown-menu" aria-labelledby="dropdownMenu2">
              {state.dates.map((d) => (
                <div className="dropdown-item" key={d.id}>
                  <input
                    type="checkbox"
                    checked={d.select}
                    id={d.id}
                    onChange={(e) => {
                      onChangeCheckBox(e);
                    }}
                  />
                  {`${new Date(d.data).getDate()}/${
                    new Date(d.data).getMonth() + 1
                  }/${new Date(d.data).getFullYear()}`}
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

                  {state.dates.map((datas) =>
                    datas.select === true ? (
                      <th key={datas.data}>
                        <Link to={"/edit/" + datas.data}>{`${new Date(
                          datas.data
                        ).getDate()}/${
                          new Date(datas.data).getMonth() + 1
                        }/${new Date(datas.data).getFullYear()}`}</Link>
                      </th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Total Ativo Circulante */}
                <tr className="font-weight-bold table-info" key={genRandomId()}>
                  <td>Total do Ativo Circulante</td>
                  {state.totais["Ativo Circulante"]
                    ? state.dates.map((datas) =>
                        datas.select === true ? (
                          <td key={genRandomId()}>
                            R$
                            {state.totais["Ativo Circulante"][
                              datas.data
                            ].toLocaleString()}
                          </td>
                        ) : null
                      )
                    : null}
                </tr>
                {/* Data */}
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Ativo Circulante" ? (
                    <tr key={genRandomId()}>
                      <td>{items.conta}</td>
                      {state.dates.map((datas) =>
                        datas.select === true ? (
                          items[datas.data] !== undefined ? (
                            <td key={items[datas.data].f2}>
                              R${items[datas.data].f1.toLocaleString()}
                            </td>
                          ) : (
                            <td key={genRandomId()}>R$0</td>
                          )
                        ) : null
                      )}
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

                  {state.dates.map((datas) =>
                    datas.select === true ? (
                      <th key={genRandomId()}>{`${new Date(
                        datas.data
                      ).getDate()}/${
                        new Date(datas.data).getMonth() + 1
                      }/${new Date(datas.data).getFullYear()}`}</th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className="font-weight-bold table-info" key={genRandomId()}>
                  <td>Total do Ativo Permanente</td>
                  {state.totais["Ativo Permanente"]
                    ? state.dates.map((datas) =>
                        datas.select === true ? (
                          <td key={genRandomId()}>
                            R$
                            {state.totais["Ativo Permanente"][
                              datas.data
                            ].toLocaleString()}
                          </td>
                        ) : null
                      )
                    : null}
                </tr>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Ativo Permanente" ? (
                    <tr key={genRandomId()}>
                      <td>{items.conta}</td>

                      {state.dates.map((datas) =>
                        datas.select === true ? (
                          items[datas.data] !== undefined ? (
                            <td key={items[datas.data].f2}>
                              R${items[datas.data].f1.toLocaleString()}
                            </td>
                          ) : (
                            <td key={genRandomId()}>R$0</td>
                          )
                        ) : null
                      )}
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

                  {state.dates.map((datas) =>
                    datas.select === true ? (
                      <th key={genRandomId()}>{`${new Date(
                        datas.data
                      ).getDate()}/${
                        new Date(datas.data).getMonth() + 1
                      }/${new Date(datas.data).getFullYear()}`}</th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className="font-weight-bold table-info" key={genRandomId()}>
                  <td>Total do Passivo Circulante</td>
                  {state.totais["Passivo Circulante"]
                    ? state.dates.map((datas) =>
                        datas.select === true ? (
                          <td key={genRandomId()}>
                            R$
                            {state.totais["Passivo Circulante"][
                              datas.data
                            ].toLocaleString()}
                          </td>
                        ) : null
                      )
                    : null}
                </tr>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Passivo Circulante" ? (
                    <tr key={genRandomId()}>
                      <td>{items.conta}</td>

                      {state.dates.map((datas) =>
                        datas.select === true ? (
                          items[datas.data] !== undefined ? (
                            <td key={items[datas.data].f2}>
                              R${items[datas.data].f1.toLocaleString()}
                            </td>
                          ) : (
                            <td key={genRandomId()}>R$0</td>
                          )
                        ) : null
                      )}
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

                  {state.dates.map((datas) =>
                    datas.select === true ? (
                      <th key={genRandomId()}>{`${new Date(
                        datas.data
                      ).getDate()}/${
                        new Date(datas.data).getMonth() + 1
                      }/${new Date(datas.data).getFullYear()}`}</th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className="font-weight-bold table-info" key={genRandomId()}>
                  <td>Total do Exigivel Longo Prazo</td>
                  {state.totais["Passivo Exigivel a Longo Prazo"]
                    ? state.dates.map((datas) =>
                        datas.select === true ? (
                          <td key={genRandomId()}>
                            R$
                            {state.totais["Passivo Exigivel a Longo Prazo"][
                              datas.data
                            ].toLocaleString()}
                          </td>
                        ) : null
                      )
                    : null}
                </tr>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Passivo Exigivel a Longo Prazo" ? (
                    <tr key={genRandomId()}>
                      <td>{items.conta}</td>

                      {state.dates.map((datas) =>
                        datas.select === true ? (
                          items[datas.data] !== undefined ? (
                            <td key={items[datas.data].f2}>
                              R${items[datas.data].f1.toLocaleString()}
                            </td>
                          ) : (
                            <td key={genRandomId()}>R$0</td>
                          )
                        ) : null
                      )}
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

                  {state.dates.map((datas) =>
                    datas.select === true ? (
                      <th key={genRandomId()}>{`${new Date(
                        datas.data
                      ).getDate()}/${
                        new Date(datas.data).getMonth() + 1
                      }/${new Date(datas.data).getFullYear()}`}</th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className="font-weight-bold table-info" key={genRandomId()}>
                  <td>Total do Patrimonio Liquido</td>
                  {state.totais["Patrimonio Liquido"]
                    ? state.dates.map((datas) =>
                        datas.select === true ? (
                          <td key={genRandomId()}>
                            R$
                            {state.totais["Patrimonio Liquido"][
                              datas.data
                            ].toLocaleString()}
                          </td>
                        ) : null
                      )
                    : null}
                </tr>
                {state.dadosPivot.map((items, index) =>
                  items.tipo === "Patrimonio Liquido" ? (
                    <tr key={genRandomId()}>
                      <td>{items.conta}</td>

                      {state.dates.map((datas) =>
                        datas.select === true ? (
                          items[datas.data] !== undefined ? (
                            <td key={items[datas.data].f2}>
                              R${items[datas.data].f1.toLocaleString()}
                            </td>
                          ) : (
                            <td key={genRandomId()}>R$0</td>
                          )
                        ) : null
                      )}
                    </tr>
                  ) : items.tipo === "Profit Loss" ? (
                    <tr key={genRandomId()}>
                      <td>{items.conta}</td>

                      {state.dates.map((datas) =>
                        datas.select === true ? (
                          items[datas.data] !== undefined ? (
                            <td key={items[datas.data].f2}>
                              R${items[datas.data].f1.toLocaleString()}
                            </td>
                          ) : (
                            <td key={genRandomId()}>R$0</td>
                          )
                        ) : null
                      )}
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* // GRAPH STARTS HERE */}

      <div className="d-flex row mt-5">
        {/* <div className="col"> */}
        <div className="col-lg-6">
          <h4 className=" text-center mt-5">Analise Fechamento Periodo</h4>
          <table className="table table-striped table-sm mt-3">
            <thead>
              <tr>
                <th>Periodo</th>

                {state.dates.map(
                  (datas) =>
                    datas.select === true ? (
                      <th key={genRandomId()}>{`${new Date(
                        datas.data
                      ).getDate()}/${
                        new Date(datas.data).getMonth() + 1
                      }/${new Date(datas.data).getFullYear()}`}</th>
                    ) : null
                  // <th>{`${datas.}`}</th>
                )}
              </tr>
            </thead>

            <tbody>
              <tr key={genRandomId()}>
                <td>Total do Ativo</td>
                {state.totais.Ativo
                  ? state.dates.map((datas) =>
                      datas.select === true ? (
                        <td key={genRandomId()}>
                          R${state.totais.Ativo[datas.data].toLocaleString()}
                        </td>
                      ) : null
                    )
                  : null}
              </tr>

              {state.analysis.circulante ? (
                <tr key={genRandomId()}>
                  <td>Indice Liquidez Geral</td>
                  {state.dates.map((datas) =>
                    datas.select === true &&
                    state.analysis.liquidezGeral[datas.data] !== undefined ? (
                      <td key={genRandomId()}>
                        {state.analysis.liquidezGeral[datas.data].toFixed(2)}
                      </td>
                    ) : null
                  )}
                </tr>
              ) : null}
              {state.analysis.circulante ? (
                <tr key={genRandomId()}>
                  <td>Indice Liquidez Seca</td>
                  {state.dates.map((datas) =>
                    datas.select === true &&
                    state.analysis.circulante[datas.data] !== undefined ? (
                      <td key={genRandomId()}>
                        {state.analysis.circulante[datas.data].toFixed(2)}
                      </td>
                    ) : null
                  )}
                </tr>
              ) : null}
              {state.analysis.circulante ? (
                <tr key={genRandomId()}>
                  <td>Lucro Periodo</td>
                  {state.dates.map((datas) =>
                    datas.select === true &&
                    state.analysis.crescPeriodo[datas.data] !== undefined ? (
                      <td key={genRandomId()}>
                        R$
                        {state.analysis.crescPeriodo[
                          datas.data
                        ].toLocaleString()}
                      </td>
                    ) : null
                  )}
                </tr>
              ) : null}
              {state.analysis.circulante ? (
                <tr key={genRandomId()}>
                  <td>Periodo</td>
                  {state.dates.map((datas) =>
                    datas.select === true &&
                    state.analysis.mesPeriodo[datas.data] !== undefined ? (
                      <td key={genRandomId()}>
                        {state.analysis.mesPeriodo[datas.data].toLocaleString()}{" "}
                        Meses
                      </td>
                    ) : null
                  )}
                </tr>
              ) : null}
              {state.analysis.circulante ? (
                <tr key={genRandomId()}>
                  <td>Lucro Mensal</td>
                  {state.dates.map((datas) =>
                    datas.select === true &&
                    state.analysis.lucroMensal[datas.data] !== undefined ? (
                      <td key={genRandomId()}>
                        R$
                        {state.analysis.lucroMensal[
                          datas.data
                        ].toLocaleString()}
                      </td>
                    ) : null
                  )}
                </tr>
              ) : null}
              {state.totais.DifAtivPassiv ? (
                <tr key={genRandomId()}>
                  <td>Ativo - Passivo</td>
                  {state.dates.map((datas) =>
                    datas.select === true &&
                    state.totais.DifAtivPassiv[datas.data] !== undefined ? (
                      <td key={genRandomId()}>
                        R$
                        {state.totais.DifAtivPassiv[
                          datas.data
                        ].toLocaleString()}
                      </td>
                    ) : null
                  )}
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="col-lg-3">
          <h5 className=" text-center mt-5">Lucro Mensal Periodo</h5>
          <Bar data={chartCrescPatLiq} />
        </div>
        <div className="col-lg-3">
          <CashFlow
            prevBalanceDate={state.prevBalanceDate.data}
            currentBalanceDate={state.currentBalanceDate.data}
            newBalanceDate={state.newBalanceDate}
          />
        </div>
        {/* </div> */}
      </div>
      <div className="d-flex row mt-5">
        <div className="d-inline-flex col">
          <VendasDados
            prevBalanceDate={state.prevBalanceDate.data}
            currentBalanceDate={state.currentBalanceDate.data}
            newBalanceDate={state.newBalanceDate}
            setNewBalDataUpdate={() => setNewBalDataUpdate()}
          />
        </div>
      </div>
      <div className="d-flex row mt-5">
        <div className="d-inline-flex col">
          <VendasDados1
            prevBalanceDate={state.prevBalanceDate.data}
            currentBalanceDate={state.currentBalanceDate.data}
            newBalanceDate={state.newBalanceDate}
            setNewBalDataUpdate={() => setNewBalDataUpdate()}
          />
        </div>
      </div>
      <div className="d-flex row mt-5">
        <div className="col">
          <ContasReceber
            prevBalanceDate={state.prevBalanceDate.data}
            currentBalanceDate={state.currentBalanceDate.data}
            newBalanceDate={state.newBalanceDate}
            setNewBalDataUpdate={() => setNewBalDataUpdate()}
          />
        </div>
        <div className="col">
          <ContasPagar
            prevBalanceDate={state.prevBalanceDate.data}
            currentBalanceDate={state.currentBalanceDate.data}
            newBalanceDate={state.newBalanceDate}
            setNewBalDataUpdate={() => setNewBalDataUpdate()}
          />
        </div>
      </div>
      <div className="d-flex row mt-5">
        <ContasPagas
          prevBalanceDate={state.prevBalanceDate.data}
          currentBalanceDate={state.currentBalanceDate.data}
          newBalanceDate={state.newBalanceDate}
        />
      </div>
    </div>
  );
}

export default BalanceSheet;
