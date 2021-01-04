import React, { useEffect, useState, useContext } from "react";
import { Polar } from "react-chartjs-2";
import Axios from "axios";
import StateContext from "../StateContext";

function ContasReceber() {
  const [receberTabela, setReceberTabela] = useState([]);
  const [receberAtrasadas, setReceberAtrasadas] = useState([]);
  const [detalhes, setDetalhes] = useState([]);
  const appState = useContext(StateContext);
  let currentDate = appState.currentDate;
  let lastDate = appState.lastDate;

  // generate IDs
  const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const atrasadasChart = {
    labels: ["Em Dia", "Atrasadas"],
    datasets: [
      {
        label: "Atrasadas",
        backgroundColor: ["#FF6384", "#4BC0C0", "#FFCE56", "#E7E9ED", "#36A2EB"],
        borderColor: "rgba(0,0,0,1)",
        borderWidth: 2,
        data: [detalhes.PercentEmDia, detalhes.percentAtrasadas]
      }
    ]
  };

  useEffect(() => {
    const getData = async () => {
      try {
        // Get Receber Details
        const responseTabela = await Axios.get("http://localhost:5000/receberTabela", {
          params: {
            currentDate: currentDate,
            lastDate: lastDate
          }
        });
        const jsonDataReceber = await [...responseTabela.data];
        setReceberTabela(jsonDataReceber);
        // console.log(jsonDataReceber, "check the reduce");
        const totalReceber = jsonDataReceber.reduce((a, b) => ({ total: a.total + b.total }));

        const resRecAt = await Axios.get("http://localhost:5000/receberAtrasadas", {
          params: {
            currentDate: currentDate,
            lastDate: lastDate
          }
        });
        const jsonRecAt = await [...resRecAt.data];
        setReceberAtrasadas(jsonRecAt);

        let totAtrasadas = {};

        let detalhesReceber = {};

        if (jsonRecAt.length > 0) {
          totAtrasadas = jsonRecAt.reduce((a, b) => ({ total: a.total + b.total }));
        } else {
          totAtrasadas["total"] = 0;
        }
        // console.log(totAtrasadas, "JSONREC aqui"); // check

        detalhesReceber["contasReceber"] = Math.round(totalReceber.total * 100) / 100;
        detalhesReceber["receberAtrasadas"] = totAtrasadas.total.toFixed(2);
        detalhesReceber["PercentEmDia"] = (((totalReceber.total - totAtrasadas.total) / totalReceber.total) * 100).toFixed(2);
        detalhesReceber["percentAtrasadas"] = ((totAtrasadas.total / totalReceber.total) * 100).toFixed(2);
        setDetalhes(detalhesReceber);

        if (currentDate.length > 0) {
          // console.log('I am here receber')
          const receberInsert = await Axios.post("http://localhost:5000/insertBalance", { data: { tipo: "Ativo Circulante", conta: "Contas a Receber Clientes (Boletos+ cheques ((Excluir cartoes a Receber)))", total: detalhesReceber.contasReceber, date: currentDate } }, { timeout: 0 })
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

        // console.log(cashflow);
      } catch (error) {
        console.error(error.message);
      }
    };
    getData();
  }, [currentDate, lastDate, appState.updateAll]);

  return (
    <>
      <h3 className="mt-4">Contas a Receber = R${detalhes.contasReceber}</h3>
      <div className="row mt-4">
        <div className="col table-responsive mt-2">
          <h6 className="text-center mt-2">Maiores contas a receber</h6>

          <table className="table table-striped table-sm mt-1">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Total</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {receberTabela.map((items, index) => {
                if (items.percentage >= 0.04) {
                  return (
                    <tr key={uid()}>
                      <td>{items.cliente}</td>
                      <td>R${items.total}</td>
                      <td>{(items.percentage * 100).toFixed(2)}%</td>
                    </tr>
                  );
                } else {
                  return null;
                }
              })}
            </tbody>
          </table>
          <h6 className="text-center mt-2">% Em dia vs Atrasadas</h6>
          <div className="mt-4"></div>
          <Polar data={atrasadasChart} />
        </div>
        <div className="col table-responsive mt-2">
          <div>
            <h6 className="text-center mt-2">Atrasadas</h6>

            <table className="table table-striped table-sm mt-1 ">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {receberAtrasadas.map((items, index) => {
                  return (
                    <tr key={uid()}>
                      <td>{items.cliente}</td>
                      <td>R${items.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default ContasReceber;
