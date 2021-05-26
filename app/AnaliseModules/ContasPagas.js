import React, { useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import palette from "google-palette";
import { useImmer } from "use-immer";
import Axios from "axios";

function ContasPagas({ prevBalanceDate, currentBalanceDate, newBalanceDate }) {
  const [state, setState] = useImmer({
    detailsPgs: [],
    totalContasPgs: [],
    datesPgs: [],
  });

  const genRandomId = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const formatNumbers = function (params) {
    if (typeof params === "number") {
      return params.toLocaleString(navigator.language, {
        maximumFractionDigits: 2,
      });
    } else {
      return 0;
    }
  };

  let pgsChartLabel = state.datesPgs.map((items) => {
    return `${new Date(items).getMonth() + 1}/${new Date(items).getFullYear()}`;
  });

  let pgsChartValues = [];

  state.totalContasPgs.forEach((items) => {
    let outro = {};
    outro["conta"] = items.conta;
    outro["values"] = [];
    state.datesPgs.forEach((data) => {
      if (items[data]) {
        outro.values.push(items[data]);
      } else {
        outro.values.push(0);
      }
    });
    pgsChartValues.push(outro);
  });

  let chartColour = palette(["mpn65", "qualitative"], 22);

  const lineChartPgs = {
    labels: pgsChartLabel,
    datasets: pgsChartValues.map((items, index) => {
      return {
        label: items.conta,
        data: items.values,
        backgroundColor: `#${chartColour[index]}`,
        borderColor: `#${chartColour[index]}`,
        fill: true,
      };
    }),
  };

  const options = {
    scales: {
      xAxes: [
        {
          stacked: true,
        },
      ],
      yAxes: [
        {
          stacked: true,
        },
      ],
    },
  };

  let barChartPgs = {
    labels: pgsChartLabel,
    datasets: pgsChartValues.map((items, index) => {
      return {
        label: items.conta,
        data: items.values,
        backgroundColor: `#${chartColour[index]}`,
        fill: true,
      };
    }),
  };

  useEffect(() => {
    if (prevBalanceDate || currentBalanceDate) getContasPagasData();
  }, [currentBalanceDate, newBalanceDate]);

  async function getContasPagasData() {
    try {
      const {
        data: { billsByAccount },
        data: { billsByDescription },
      } = await Axios.get("http://localhost:5000/pagasDetails", {
        params: {
          currentBalanceDate: currentBalanceDate,
          prevBalanceDate: prevBalanceDate,
          newBalanceDate: newBalanceDate,
        },
      });

      let totalContasPgs = [];

      (function formatPagasByContas() {
        for (let i = 0; i < billsByAccount.length; i++) {
          let datas = [];
          let valor = [];
          datas = Object.keys(billsByAccount[i].json_object_agg);
          valor = Object.values(billsByAccount[i].json_object_agg);

          let pagasTemp = {};
          pagasTemp["conta"] = billsByAccount[i].conta;

          for (let j = 0; j < datas.length; j++) {
            let dtLabels = datas[j];
            let values = valor[j];

            pagasTemp[dtLabels] = values;
          }
          totalContasPgs.push(pagasTemp);
        }
      })();

      let detailsPgs = [];

      (function formatContasObject() {
        for (let i = 0; i < billsByDescription.length; i++) {
          let datas = [];
          let valor = [];
          datas = Object.keys(billsByDescription[i].json_object_agg);
          valor = Object.values(billsByDescription[i].json_object_agg);

          let pagasDetalhesTemp = {};
          pagasDetalhesTemp["conta"] = billsByDescription[i].conta;
          pagasDetalhesTemp["descricao"] = billsByDescription[i].descricao;

          for (let j = 0; j < datas.length; j++) {
            let dateDetails = datas[j];
            let valueDetails = valor[j];

            pagasDetalhesTemp[dateDetails] = valueDetails;
          }
          detailsPgs.push(pagasDetalhesTemp);
        }
      })();

      let datesPgs = [];

      detailsPgs.forEach((element) => {
        Object.keys(element).forEach((e) => {
          if (
            e !== "conta" &&
            e !== "descricao" &&
            datesPgs.includes(e) === false
          ) {
            datesPgs.push(e);
          }
        });
      });

      datesPgs = datesPgs.sort();

      setState((draft) => {
        draft.totalContasPgs = totalContasPgs;
        draft.detailsPgs = detailsPgs;
        draft.datesPgs = datesPgs;
      });
    } catch (error) {
      console.error(error.message);
    }
  }

  return (
    <>
      {/* <div className="col"> */}
      <div className="col-lg-7">
        <h3 className="text-center mt-2">
          {" "}
          Analise Despesas em{" "}
          {newBalanceDate
            ? `${new Date(newBalanceDate).getDate()}/${
                new Date(newBalanceDate).getMonth() + 1
              }/${new Date(newBalanceDate).getFullYear()}`
            : `${new Date(currentBalanceDate).getDate()}/${
                new Date(currentBalanceDate).getMonth() + 1
              }/${new Date(currentBalanceDate).getFullYear()}`}
        </h3>

        <table className="table table-sm table-bordered table-hover mt-5">
          <thead>
            <tr>
              <th>Contas</th>
              {state.datesPgs.map((items) => (
                <th key={genRandomId()}>{`${new Date(items).getDate()}/${
                  new Date(items).getMonth() + 1
                }/${new Date(items).getFullYear()}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.totalContasPgs.map((e) => (
              <tr key={genRandomId()} className="table-plain">
                <td
                  className="text-nowrap font-weight-bold"
                  data-toggle="collapse"
                  data-target={`.${e.conta.slice(0, 4)}`}
                  aria-expanded="true"
                  aria-controls={e.conta}
                >
                  {e.conta}

                  {state.detailsPgs.map((det) => {
                    if (det.conta === e.conta) {
                      return (
                        <div
                          key={genRandomId()}
                          id={det.descricao}
                          className={`${e.conta.slice(
                            0,
                            4
                          )} collapse font-weight-light text-dark text-lowercase`}
                          aria-labelledby={e.conta}
                        >
                          {det.descricao}
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })}
                </td>
                {state.datesPgs.map((data) =>
                  e[data] ? (
                    <td
                      key={genRandomId()}
                      data-toggle="collapse"
                      data-target={`.${e.conta.slice(0, 4)}`}
                      aria-expanded="false"
                      aria-controls={e.conta}
                    >
                      R${formatNumbers(e[data])}
                      {state.detailsPgs.map((detalhe) => {
                        if (detalhe.conta === e.conta) {
                          if (detalhe[data] > 0) {
                            return (
                              <div
                                key={genRandomId()}
                                id={detalhe.descricao}
                                className={`${e.conta.slice(0, 4)} collapse`}
                                aria-labelledby={`${e.conta}`}
                              >
                                R${formatNumbers(detalhe[data])}
                              </div>
                            );
                          } else {
                            return (
                              <div
                                key={genRandomId()}
                                id={detalhe.descricao}
                                className={`${e.conta.slice(0, 4)} collapse`}
                                aria-labelledby={`${e.conta}`}
                              >
                                R$0
                              </div>
                            );
                          }
                        } else {
                          return null;
                        }
                      })}
                    </td>
                  ) : (
                    <td key={genRandomId()}></td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="col-lg-5">
        <h3 className="mt-4 text-center"> Despesas Mes </h3>

        <Bar data={barChartPgs} options={options} />
        <h3 className="mt-4 text-center"> Despesas Mes</h3>

        <Line data={lineChartPgs} />
      </div>
      {/* </div> */}
    </>
  );
}

export default ContasPagas;
