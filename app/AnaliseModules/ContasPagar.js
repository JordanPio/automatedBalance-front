import React, { useEffect, useState, useContext } from "react";
import { Pie } from "react-chartjs-2";
import Axios from "axios";
import StateContext from "../StateContext";
// import DispatchContext from "../../DispatchContext";

function ContasPagar() {
  const [pagarTabela, setPagarTabela] = useState([]);
  const [detalhes, setDetalhes] = useState([]);
  const appState = useContext(StateContext);
  // const appDispatch = useContext(DispatchContext);

  // let currentDate = appState.currentDate;
  // let lastDate = appState.lastDate;
  // console.log(currentDate, lastDate, "ContasPagar")
  // generate IDs
  const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Setup apagar Chart

  let apagarLabels = [];
  let apagarData = [];

  pagarTabela.map(arrays => {
    apagarLabels.push(arrays.conta);
    apagarData.push(arrays.total);
    return 0;
  });

  const pagarChart = {
    labels: apagarLabels,
    datasets: [
      {
        label: "Contas",
        backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56", "#00A6B4", "#6800B4", "#2FDE00", "#E7E9ED", "#4BC0C0"],
        hoverBackgroundColor: ["#501800", "#4B5000", "#175000", "#003350", "#35014F"],
        data: apagarData
      }
    ]
  };

  useEffect(() => {
    const getData = async () => {
      try {
        //Get apagar details
        // console.log("this is running", appState.currentDate, "current", appState.lastDate, "last Date");

        const resPagar = await Axios.get("http://localhost:5000/pagarTabela", {
          params: {
            currentDate: appState.currentDate,
            lastDate: appState.lastDate
          }
        });
        const jsonPagarTab = await [...resPagar.data];
        // console.log(jsonPagarTab, "Your data");
        setPagarTabela(jsonPagarTab);

        let fornecedores = {};
        jsonPagarTab.forEach(items => {
          if (items.conta === "Mercadoria para Revenda") {
            fornecedores["conta"] = items.conta;
            fornecedores["total"] = items.total;
            fornecedores["tipo"] = "Passivo Circulante";
          }
        });
        // load into dispatch to save new balance info
        if (appState.currentDate.length > 0) {
          // console.log('I am here contas pagar', fornecedores)
          // appDispatch({ type: "balanco", value: { tipo: fornecedores.tipo, conta: fornecedores.conta, total: fornecedores.total } }); // old way
          const fornecedoresPagar = await Axios.post("http://localhost:5000/insertBalance", { data: { tipo: "Passivo Circulante", conta: "Fornecedores", total: fornecedores.total, date: appState.currentDate } }, { timeout: 0 })
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
        }

        // console.log(fornecedores);

        const responsePagar = await Axios.get("http://localhost:5000/totalPagar", {
          params: {
            currentDate: appState.currentDate,
            lastDate: appState.lastDate
          }
        });
        const jsonDataPagar = await [...responsePagar.data];

        let DetalhesApagar = {};
        DetalhesApagar["contasPagar"] = jsonDataPagar[0].total;

        setDetalhes(DetalhesApagar);

        // console.log(cashflow);
      } catch (error) {
        console.error(error.message);
      }
    };
    getData();
  }, [appState.currentDate, appState.lastDate]);

  return (
    <>
      <h3 className="mt-4">Contas a Pagar Total = R${detalhes.contasPagar}</h3>

      <div className="row mt-4">
        <div className="col table-responsive ">
          <div>
            <table className="table table-striped table-sm mt-4 ">
              <thead>
                <tr>
                  <th> Conta</th>
                  <th> Total</th>
                </tr>
              </thead>
              <tbody>
                {pagarTabela.map(items => (
                  <tr key={uid()}>
                    <td>{items.conta}</td>
                    <td>R${items.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col table-responsive mt-5">
          <Pie data={pagarChart} />
        </div>
      </div>
    </>
  );
}

export default ContasPagar;
