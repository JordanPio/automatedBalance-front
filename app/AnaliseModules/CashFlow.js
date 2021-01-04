import React, { useEffect, useState, useContext } from "react";
import { Line } from "react-chartjs-2";
import Axios from "axios";
import StateContext from "../StateContext";

function CashFlow() {
  const [cashflow, setCashflow] = useState([]);
  const appState = useContext(StateContext);
  let currentDate = appState.currentDate;
  let lastDate = appState.lastDate;


  // Setup Cashflow Details for Graph
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

  const chartCash = {
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
        //get Balance Data

        const jsonCashRec = await Axios.get("http://localhost:5000/cashflowReceber", {
          params: {
            currentDate: currentDate,
            lastDate: lastDate
          }
        });
        const jsonCashPag = await Axios.get("http://localhost:5000/cashflowPagar", {
          params: {
            currentDate: currentDate,
            lastDate: lastDate
          }
        });

        let cashflow = [...jsonCashRec.data];
        let cashPag = [...jsonCashPag.data];

        for (let i = 0; i < cashflow.length; i++) {
          // console.log(cashflow[i].weekly);
          for (let j = 0; j < cashPag.length; j++) {
            // console.log(cashPag[j]);
            if (cashflow[i].weekly === cashPag[j].weekly) {
              cashflow[i]["pagar"] = cashPag[j].sum;
            }
          }
        }
        setCashflow(cashflow);

        // console.log(cashflow);
      } catch (error) {
        console.error(error.message);
      }
    };
    getData();
  }, [currentDate, lastDate]);

  return (
    <>
      <h5 className=" text-center mt-5">Analise Fluxo de Caixa </h5>
      <Line data={chartCash} />
    </>
  );
}

export default CashFlow;
