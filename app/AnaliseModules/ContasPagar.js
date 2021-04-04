import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import Axios from "axios";

function ContasPagar({ prevBalanceDate, currentBalanceDate, newBalanceDate }) {
  const [pagarTabela, setPagarTabela] = useState([]);
  const [detalhesPgtos, setDetalhesPgtos] = useState([]);

  const genRandomId = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  let apagarLabels = [];
  let apagarData = [];

  pagarTabela.map(arrays => {
    apagarLabels.push(arrays.conta);
    apagarData.push(arrays.total);
    return 0;
  });

  const pieChartPagar = {
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
    if (prevBalanceDate || currentBalanceDate) getContasApagarData();
  }, [currentBalanceDate, newBalanceDate]);

  async function getContasApagarData() {
    try {
      const resPagar = await Axios.get("http://localhost:5000/pagarTabela", {
        params: {
          newDate: newBalanceDate,
          currentDate: currentBalanceDate
        }
      });
      const jsonPagarTab = await [...resPagar.data];
      setPagarTabela(jsonPagarTab);

      let fornecedores = {};
      jsonPagarTab.forEach(items => {
        if (items.conta === "Mercadoria para Revenda") {
          fornecedores["conta"] = items.conta;
          fornecedores["total"] = items.total;
          fornecedores["tipo"] = "Passivo Circulante";
        }
      });

      const responsePagar = await Axios.get("http://localhost:5000/totalPagar", {
        params: {
          newDate: newBalanceDate,
          currentDate: currentBalanceDate
        }
      });
      const jsonDataPagar = await [...responsePagar.data];

      let DetalhesApagar = {};
      DetalhesApagar["contasPagar"] = jsonDataPagar[0].total;

      if (newBalanceDate.length > 0) await updateDbContasApagar(fornecedores.total);

      setDetalhesPgtos(DetalhesApagar);
    } catch (error) {
      console.error(error.message);
    }
  }

  async function updateDbContasApagar(totalFornecedores) {
    const fornecedoresPagar = await Axios.post("http://localhost:5000/insertBalance", { data: { tipo: "Passivo Circulante", conta: "Fornecedores", total: totalFornecedores, date: newBalanceDate } }, { timeout: 0 })
      .then(resp => {
        if (resp.data) {
          console.log("Sucessfull updated Stock into DB when creating new balance");
        }
      })
      .catch(err => {
        console.log(err.data, "when inserting Fornecedores Total apagar into DB");
      });
  }

  return (
    <>
      <div>
        <div>
          <h3 className="text-center mt-2">
            Total Contas a Pagar = R${detalhesPgtos.contasPagar} em {newBalanceDate ? `${new Date(newBalanceDate).getDate()}/${new Date(newBalanceDate).getMonth() + 1}/${new Date(newBalanceDate).getFullYear()}` : `${new Date(currentBalanceDate).getDate()}/${new Date(currentBalanceDate).getMonth() + 1}/${new Date(currentBalanceDate).getFullYear()}`}
          </h3>
        </div>
        <div className="d-inline-flex col">
          <div className="col table-responsive mt-2">
          <h4 className="text-center mt-2">Maiores contas a pagar</h4>
            <table className="table table-striped table-sm mt-5">
              <thead>
                <tr>
                  <th> Conta</th>
                  <th> Total</th>
                </tr>
              </thead>
              <tbody>
                {pagarTabela.map(items => (
                  <tr key={genRandomId()}>
                    <td>{items.conta}</td>
                    <td>R${items.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="col table-responsive mt-2">
          <h4 className="text-center mt-2"></h4>
          <h4 className="text-center mt-5"></h4>
            <Pie data={pieChartPagar} />
          </div>
        </div>
      </div>
    </>
  );
}

export default ContasPagar;
