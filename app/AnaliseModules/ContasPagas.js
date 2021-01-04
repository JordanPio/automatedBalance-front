import React, { useEffect, useContext } from "react";
import { Line, Bar } from "react-chartjs-2";
import palette from "google-palette";
import { useImmer } from "use-immer";
import Axios from "axios";
import StateContext from "../StateContext";

function ContasPagas() {
  // Old Style
  // const [pgsDescricao, setPgsDescricao] = useState([]);
  // const [pgsContas, setPgsContas] = useState([]);
  // const [datas, setDatas] = useState([]);

  // // Using immerReducer
  // const initialState = {
  //   pgsDescricao: [],
  //   pgsContas: [],
  //   pgsDatas: []
  // };

  // function ourReducer(draft, action) {
  //   switch (action.type) {
  //     case "pgsDescricao":
  //       draft.pgsDescricao = action.value;
  //       return;
  //     case "pgsContas":
  //       draft.pgsContas = action.value;
  //       return;
  //       case "pgsDatas":
  //         draft.pgsDatas = action.value
  //         return;
  //   }
  // }

  // Example using dispatch
  // const [state, dispatch] = useImmerReducer(ourReducer, initialState);

  // // setting state

  const [state, setState] = useImmer({
    pgsDescricao: [],
    pgsContas: [],
    pgsDatas: []
  });
  const appState = useContext(StateContext);
  let lastDate = appState.lastDate;
  let secondLastDate = appState.secondLastDate;
  let currentDate = appState.currentDate;
  // console.log(appState.secondLastDate);

  // generate IDs
  const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // format numbers
  const formNumb = function (params) {
    if (typeof params === "number") {
      return params.toLocaleString(navigator.language, { maximumFractionDigits: 2 });
    } else {
      return 0;
    }
  };

  // charts

  // prepare data label
  let datasLab = state.pgsDatas.map(items => {
    return `${new Date(items).getDate()}/${new Date(items).getMonth() + 1}/${new Date(items).getFullYear()}`;
  });

  // prepare values
  let contasTot = [];

  state.pgsContas.forEach(items => {
    let outro = {};
    outro["conta"] = items.conta;
    outro["values"] = [];
    state.pgsDatas.forEach(data => {
      if (items[data]) {
        outro.values.push(items[data]);
      } else {
        outro.values.push(0);
      }
    });
    contasTot.push(outro);
  });

  // console.log(contasTot, 'contasTot')

  let seq = palette(["mpn65", "qualitative"], 22);
  // console.log(seq);

  // console.log(contasTot);
  // console.log(datasLab)

  const chartConta = {
    labels: datasLab,
    datasets: contasTot.map((items, index) => {
      return {
        label: items.conta,
        data: items.values,
        backgroundColor: `#${seq[index]}`,
        borderColor: `#${seq[index]}`,
        fill: true
      };
    })
  };

  const options = {
    scales: {
      xAxes: [
        {
          stacked: true
        }
      ],
      yAxes: [
        {
          stacked: true
        }
      ]
    }
  };

  let barContas = {
    labels: datasLab,
    datasets: contasTot.map((items, index) => {
      return {
        label: items.conta,
        data: items.values,
        backgroundColor: `#${seq[index]}`,
        fill: true
      };
    })
  };

  useEffect(() => {
    async function getData() {
      try {
        const jsonContas = await Axios.get("http://localhost:5000/pagasByContas", {
          params: {
            lastDate: lastDate,
            secondLastDate: secondLastDate,
            currentDate: currentDate
          }
        });
        // console.log(jsonContas.data);

        const jsonDescri = await Axios.get("http://localhost:5000/pagasByDescricao", {
          params: {
            lastDate: lastDate,
            secondLastDate: secondLastDate,
            currentDate: currentDate
          }
        });
        // const jsonDescri = await resDescri.json();
        // console.log(jsonDescri.data);

        // ##Rearrange jsonContas Object
        let pgs = [];

        for (let i = 0; i < jsonContas.data.length; i++) {
          let datas = [];
          let valor = [];
          datas = Object.keys(jsonContas.data[i].json_object_agg);
          valor = Object.values(jsonContas.data[i].json_object_agg);

          let outro = {};
          outro["conta"] = jsonContas.data[i].conta;

          for (let j = 0; j < datas.length; j++) {
            let nome = datas[j];
            let dadinho = valor[j];

            outro[nome] = dadinho;
          }
          // outside the loop execute this for when the dataset outro is ready
          pgs.push(outro);
        }
        // console.log(pgs);
        // set State pgs
        // setPgsContas(pgs);

        // ##Rearrange jsonContas Object
        let pgsDetalhes = [];

        for (let i = 0; i < jsonDescri.data.length; i++) {
          let datas = [];
          let valor = [];
          datas = Object.keys(jsonDescri.data[i].json_object_agg);
          valor = Object.values(jsonDescri.data[i].json_object_agg);

          let outro = {};
          outro["conta"] = jsonDescri.data[i].conta;
          outro["descricao"] = jsonDescri.data[i].descricao;

          for (let j = 0; j < datas.length; j++) {
            let nome = datas[j];
            let dadinho = valor[j];

            outro[nome] = dadinho;
          }
          // outside the loop execute this for when the dataset outro is ready
          pgsDetalhes.push(outro);
        }
        // console.log(pgsDetalhes);

        // set State Descricao
        // setPgsDescricao(pgsDetalhes);

        let datas = [];

        pgsDetalhes.forEach(element => {
          // console.log(Object.keys(element))
          Object.keys(element).forEach(e => {
            // console.log(e)
            if (e !== "conta" && e !== "descricao" && datas.includes(e) === false) {
              datas.push(e);
            }
          });
        });

        // set State datas in order
        datas = datas.sort();

        // console.log(datas);
        // Old Style Set datas
        // setDatas(datas);

        setState(draft => {
          draft.pgsContas = pgs;
          draft.pgsDescricao = pgsDetalhes;
          draft.pgsDatas = datas;
        });

        // // Dispatch Example
        // dispatch({type: "pgsContas", value: pgs})
        // dispatch({type: "pgsDescricao", value: pgsDetalhes})
        // dispatch({type: "pgsDatas", value: datas})
      } catch (error) {
        console.error(error.message);
      }
    }
    getData();
  }, [lastDate, currentDate]);

  return (
    <>
      <div className="container mt-4">
        <div className="col">
          <h6 className="mt-4 text-center"> Despesas Mes {appState.lastDate}</h6>

          <Bar data={barContas} options={options} />
        </div>
        <div className="col">
          <h6 className="mt-4 text-center"> Despesas Mes</h6>

          <Line data={chartConta} />
        </div>
        <div className="row">
          <div className="col">
            <h4 className="mt-4 text-center"> Analise Despesas </h4>
            <table className="table table-sm table-bordered table-hover mt-4">
              <thead>
                <tr>
                  <th>Contas</th>
                  {state.pgsDatas.map(items => (
                    <th key={uid()}>{`${new Date(items).getDate()}/${new Date(items).getMonth() + 1}/${new Date(items).getFullYear()}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.pgsContas.map(e => (
                  <tr key={uid()} className="table-plain">
                    <td className="text-nowrap font-weight-bold" data-toggle="collapse" data-target={`.${e.conta.slice(0, 3)}`} aria-expanded="true" aria-controls={e.conta}>
                      {e.conta}

                      {state.pgsDescricao.map(det => {
                        if (det.conta === e.conta) {
                          return (
                            <div key={uid()} id={det.descricao} className={`${e.conta.slice(0, 3)} collapse font-weight-light text-dark text-lowercase`} aria-labelledby={e.conta}>
                              {det.descricao}
                            </div>
                          );
                        } else {
                          return null;
                        }
                      })}
                    </td>
                    {state.pgsDatas.map(data =>
                      e[data] ? (
                        <td key={uid()} data-toggle="collapse" data-target={`.${e.conta.slice(0, 3)}`} aria-expanded="false" aria-controls={e.conta}>
                          R${formNumb(e[data])}
                          {state.pgsDescricao.map(detalhe => {
                            if (detalhe.conta === e.conta) {
                              if (detalhe[data] > 0) {
                                return (
                                  <div key={uid()} id={detalhe.descricao} className={`${e.conta.slice(0, 3)} collapse`} aria-labelledby={`${e.conta}`}>
                                    R${formNumb(detalhe[data])}
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={uid()} id={detalhe.descricao} className={`${e.conta.slice(0, 3)} collapse`} aria-labelledby={`${e.conta}`}>
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
                        <td key={uid()}></td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default ContasPagas;
