import React, { useEffect, useState, useContext } from "react";
import { Polar } from "react-chartjs-2";
import Axios from "axios";
// import StateContext from "../StateContext";

function ContasReceber({ prevBalanceDate, currentBalanceDate, newBalanceDate }) {
  const [receberTabela, setReceberTabela] = useState([]);
  const [receberAtrasadas, setReceberAtrasadas] = useState([]);
  const [detalhes, setDetalhes] = useState([]);
  // const appState = useContext(StateContext);

  // generate IDs
  const generateRandomId = function () {
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
    if (prevBalanceDate || currentBalanceDate) getContasReceberData();
  }, [currentBalanceDate]);

  async function getContasReceberData() {
    try {
      // Get Receber Details
      const responseTabela = await Axios.get("http://localhost:5000/receberTabela", {
        params: {
          newDate: newBalanceDate,
          currentDate: currentBalanceDate
        }
      });
      const jsonDataReceber = await [...responseTabela.data];
      const totalReceber = jsonDataReceber.reduce((a, b) => ({ total: a.total + b.total }));

      const resRecAt = await Axios.get("http://localhost:5000/receberAtrasadas", {
        params: {
          newDate: newBalanceDate,
          currentDate: currentBalanceDate
        }
      });
      const jsonRecAt = await [...resRecAt.data];

      let totAtrasadas = {};
      let detalhesReceber = {};

      if (jsonRecAt.length > 0) {
        totAtrasadas = jsonRecAt.reduce((a, b) => ({ total: a.total + b.total }));
      } else {
        totAtrasadas["total"] = 0;
      }

      detalhesReceber["contasReceber"] = Math.round(totalReceber.total * 100) / 100;
      detalhesReceber["receberAtrasadas"] = totAtrasadas.total.toFixed(2);
      detalhesReceber["PercentEmDia"] = (((totalReceber.total - totAtrasadas.total) / totalReceber.total) * 100).toFixed(2);
      detalhesReceber["percentAtrasadas"] = ((totAtrasadas.total / totalReceber.total) * 100).toFixed(2);

      if (newBalanceDate.length > 0) await updateDbContasReceber(detalhesReceber.contasReceber);

      setReceberTabela(jsonDataReceber);
      setReceberAtrasadas(jsonRecAt);
      setDetalhes(detalhesReceber);
    } catch (error) {
      console.error(error.message);
    }
  }

  async function updateDbContasReceber(currentTotalReceber) {
    const receberInsert = await Axios.post("http://localhost:5000/insertBalance", { data: { tipo: "Ativo Circulante", conta: "Contas a Receber Clientes (Boletos+ cheques ((Excluir cartoes a Receber)))", total: currentTotalReceber, date: newBalanceDate } }, { timeout: 0 })
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

  return (
    <>
      <div>
        <div>
          <h3 className="text-center mt-2">
            Total Contas a Receber em {newBalanceDate ? `${new Date(newBalanceDate).getDate()}/${new Date(newBalanceDate).getMonth() + 1}/${new Date(newBalanceDate).getFullYear()}` : `${new Date(currentBalanceDate).getDate()}/${new Date(currentBalanceDate).getMonth() + 1}/${new Date(currentBalanceDate).getFullYear()}`} R${detalhes.contasReceber}
          </h3>
        </div>
        <div className="d-inline-flex col">
          <div className="col table-responsive mt-2">
            <h4 className="text-center mt-2">Maiores contas a receber</h4>

            <table className="table table-striped table-sm mt-5">
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
                      <tr key={generateRandomId()}>
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

            <h4 className="text-center mt-5">% Em dia vs Atrasadas</h4>
            <div className="mt-5"></div>
            <Polar data={atrasadasChart} />
          </div>
          <div className="col table-responsive mt-2">
            <div>
              <h3 className="text-center mt-2">Atrasadas</h3>

              <table className="table table-striped table-sm mt-5 ">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receberAtrasadas.map((items, index) => {
                    return (
                      <tr key={generateRandomId()}>
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
      </div>
    </>
  );
}

export default ContasReceber;
