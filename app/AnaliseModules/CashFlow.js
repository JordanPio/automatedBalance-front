import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import Axios from "axios";

function CashFlow({ prevBalanceDate, currentBalanceDate }) {
  const [cashflow, setCashflow] = useState([]);

  let cashflowLabels = [];
  let cashflowReceberTotals = [];
  let cashflowPagarTotals = [];

  cashflow.map(arrays => {
    cashflowLabels.push(`${new Date(arrays.weekly).getDate()}/${new Date(arrays.weekly).getMonth() + 1}/${new Date(arrays.weekly).getFullYear()}`);
    cashflowReceberTotals.push(arrays.receber);
    if (arrays.pagar) {
      cashflowPagarTotals.push(arrays.pagar);
    } else {
      cashflowPagarTotals.push(0);
    }
    return `${new Date(arrays.weekly).getDate()}/${new Date(arrays.weekly).getMonth() + 1}/${new Date(arrays.weekly).getFullYear()}`;
  });

  const lineChartCashflow = {
    labels: cashflowLabels,
    datasets: [
      {
        label: "Receber",
        data: cashflowReceberTotals,
        borderColor: "#3e95cd",
        fill: true
      },
      {
        label: "Pagar",
        data: cashflowPagarTotals,
        borderColor: "#c45850",
        fill: true
      }
    ]
  };

  useEffect(() => {
    const getData = async () => {
      try {
        const jsonCashRec = await Axios.get("http://localhost:5000/cashflowReceber", {
          params: {
            currentBalanceDate: currentBalanceDate,
            prevBalanceDate: prevBalanceDate
          }
        });
        const jsonCashPag = await Axios.get("http://localhost:5000/cashflowPagar", {
          params: {
            currentBalanceDate: currentBalanceDate,
            prevBalanceDate: prevBalanceDate
          }
        });

        let cashflow = [...jsonCashRec.data];
        let cashPag = [...jsonCashPag.data];

        for (let i = 0; i < cashflow.length; i++) {
          for (let j = 0; j < cashPag.length; j++) {
            if (cashflow[i].weekly === cashPag[j].weekly) {
              cashflow[i]["pagar"] = cashPag[j].sum;
            }
          }
        }
        setCashflow(cashflow);
      } catch (error) {
        console.error(error.message, "in cashflow component");
      }
    };

    if (prevBalanceDate || currentBalanceDate) {
      getData();
    }
  }, [prevBalanceDate, currentBalanceDate]);

  return (
    <>
      <h5 className=" text-center mt-5">Analise Fluxo de Caixa em {`${new Date(currentBalanceDate).getDate()}/${new Date(currentBalanceDate).getMonth() + 1}/${new Date(currentBalanceDate).getFullYear()}`}</h5>
      <Line data={lineChartCashflow} />
    </>
  );
}

export default CashFlow;
