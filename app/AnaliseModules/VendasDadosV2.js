import React, { useEffect, useState, useContext } from "react";
import { Doughnut } from "react-chartjs-2";
import Axios from "axios";

function VendasDados({ prevBalanceDate, currentBalanceDate, newBalanceDate, setNewBalDataUpdate }) {
  const [balanceData, setBalanceData] = useState([]);
  const [tabelaPagas, setTabelaPagas] = useState([]);

  const genRandomId = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const pieChartVendas = {
    labels: ["Fisica", "Online"],
    datasets: [
      {
        data: [balanceData.percentFisica, balanceData.percentOnline],
        backgroundColor: ["#FF6384", "#36A2EB"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB"]
      }
    ],
    text: "23%"
  };

  const pieChartLucro = {
    labels: ["Loja Fisica", "B2W", "Magazine Luiza", "MercadoPago"],
    datasets: [
      {
        data: [balanceData.lucroLojaFisica, balanceData.lucroB2W, balanceData.lucroMagazineLuiza, balanceData.lucroMercadoPago],
        backgroundColor: ["#8e5ea2", "#3e95cd", "#3cba9f", "#FF6384"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#e8c3b9", "#FF6384"]
      }
    ],
    text: "23%"
  };

  const formatNumber = function (params) {
    if (typeof params === "number") {
      return params.toLocaleString(navigator.language, { maximumFractionDigits: 2 });
    } else {
      return 0;
    }
  };

  useEffect(() => {
    if (prevBalanceDate || currentBalanceDate) getVendasData();
  }, [currentBalanceDate, newBalanceDate]);

  async function getVendasData() {
    let dreData = {};

    await (async function processDespesasData() {
      try {
        const { data: getContasPagas } = await Axios.get("http://localhost:5000/pagasTest", {
          params: {
            currentBalanceDate: currentBalanceDate,
            prevBalanceDate: prevBalanceDate,
            newBalanceDate: newBalanceDate
          }
        });
        setTabelaPagas(getContasPagas);


        function getTotalFiltered(dataset, accountType, accountDescription) {

          function findAccount(value) {
            return value[accountType].includes(accountDescription)
          }

          
          if (dataset.filter(findAccount).length > 0) {
            return dataset.filter(findAccount).reduce((a, b) => ({total: a.total + b.total})).total
          } else {
            return 0
          }
        }


        // console.log(getTotalFiltered(getContasPagas, 'custom', 'Devolucao B2W'))
        dreData["taxasB2W"] = getTotalFiltered(getContasPagas, 'custom', 'Taxas B2W')
        dreData["freteB2W"] = getTotalFiltered(getContasPagas, 'custom', 'Frete B2W')
        dreData["devoB2W"] = getTotalFiltered(getContasPagas, 'custom', 'Devolucao B2W')
        dreData["taxasMagazineLuiza"] = getTotalFiltered(getContasPagas, 'custom', 'Taxas Magazine')
        dreData["taxasMercadoPago"] = getTotalFiltered(getContasPagas, 'custom', 'Taxas Mercado')
        dreData["imposto"] = getTotalFiltered(getContasPagas, 'conta', 'Impostos')

        function getDevolucoes() {
          return getContasPagas.filter(({ conta }) => (conta.includes("Devo")) || conta.includes("Dif")).reduce((a, b) => ({ total: a.total + b.total })).total > 0
          ?
          getContasPagas.filter(({ conta }) => (conta.includes("Devo")) || conta.includes("Dif")).reduce((a, b) => ({ total: a.total + b.total })).total
          :
          0

        }

        dreData["devoTotal"] = getDevolucoes() - dreData.devoB2W
        // console.log(dreData.devoTotal)

        
        dreData["totalPagas"] = getContasPagas.reduce((a, b) => ({ total: a.total + b.total })).total - dreData.devoTotal - dreData.devoB2W - dreData.taxasB2W - dreData.freteB2W - dreData.taxasMagazineLuiza - dreData.taxasMercadoPago - dreData.imposto
        // dreData["totalPagas"] =  dreData["totalPagas"] - dreData.devoTotal - dreData.devoB2W - dreData.taxasB2W - dreData.freteB2W - dreData.taxasMagazineLuiza - dreData.taxasMercadoPago - dreData.imposto
 
        // console.log(typeof(dreData.totalPagas))
        // console.log(typeof(dreData.devoB2W))
        // console.log(dreData.devoTotal - dreData.devoB2W)
        // console.log(dreData["totalPagas"] - dreData.devoTotal - dreData.devoB2W - dreData.taxasB2W - dreData.freteB2W - dreData.taxasMagazineLuiza - dreData.taxasMercadoPago - dreData.imposto)
        // console.log(dreData.totalPagas, dreData.devoTotal, dreData.devoB2W, dreData.taxasB2W, dreData.freteB2W, dreData.taxasMagazineLuiza, dreData.taxasMercadoPago, dreData.imposto)

      } catch (error) {
        console.error("Error processing Despesas Data in VendasDados Component");
      }
    })();

    // await (async function processDevoData() {
    //   try {
    //     const { data: getDevolucoes } = await Axios.get("http://localhost:5000/devolucoes", {
    //       params: {
    //         currentBalanceDate: currentBalanceDate,
    //         prevBalanceDate: prevBalanceDate,
    //         newBalanceDate: newBalanceDate
    //       }
    //     });

    //     let devoTotal = [];
    //     let devoB2W = [];
    //     if (getDevolucoes.length > 0) {
    //       devoTotal = getDevolucoes.filter(({ descricao }) => !descricao.includes("B2W")).reduce((a, b) => ({ total: a.total + b.total }));
    //       devoB2W = getDevolucoes.filter(({ descricao }) => descricao.includes("B2W"));
    //     } else {
    //       devoTotal["total"] = 0;
    //       devoB2W = 0;
    //     }

    //     devoB2W.length > 0 ? (balanceProcessedData["devoB2W"] = devoB2W[0].total) : (balanceProcessedData["devoB2W"] = 0);

    //     balanceProcessedData["devoTotal"] = devoTotal.total;
    //     console.log('devo total outra linha ', devoTotal.total, 'Devo B2B', devoB2W[0].total)
    //   } catch (error) {
    //     console.error("Error processing Devolucao Data in VendasDados Module");
    //   }
    // })();

    await (async function processVendasData() {
      try {
        const { data: getVendasOnline } = await Axios.get("http://localhost:5000/vendasOnline", {
          params: {
            currentBalanceDate: currentBalanceDate,
            prevBalanceDate: prevBalanceDate,
            newBalanceDate: newBalanceDate
          }
        });

        let totalVendasOnline = 0;
        if (getVendasOnline.length <= 0) {
          getVendasOnline = [];
          totalVendasOnline = 0;
        } else {
          totalVendasOnline = getVendasOnline.reduce((a, b) => ({ totalvendas: a.totalvendas + b.totalvendas }));
        }
        Object.keys(totalVendasOnline).length > 0 ? (dreData["vendasOnline"] = totalVendasOnline.totalvendas) : (dreData["vendasOnline"] = 0);

        const { data: getTotalVendas } = await Axios.get("http://localhost:5000/totalVendas", {
          params: {
            currentBalanceDate: currentBalanceDate,
            prevBalanceDate: prevBalanceDate,
            newBalanceDate: newBalanceDate
          }
        });

        dreData["vendastotal"] = getTotalVendas[0].totalvendas;
        dreData["vendasBruta"] = getTotalVendas[0].totalvendas - dreData.devoTotal - dreData.devoB2W;
        dreData["vendasLojaFisica"] = getTotalVendas[0].totalvendas - dreData.vendasOnline;
        dreData["percentFisica"] = ((dreData["vendasLojaFisica"] / dreData["vendastotal"]) * 100).toFixed(2);
        dreData["percentOnline"] = ((dreData.vendasOnline / dreData["vendastotal"]) * 100).toFixed(2);
        // balanceProcessedData["imposto"] = balanceProcessedData.vendasBruta * 0.05;

        if (getVendasOnline.length > 0) {
          getVendasOnline.forEach(items => {
            if (items.cliente === "B2W") {
              dreData["B2W"] = items.totalvendas - dreData.devoB2W;
              // balanceProcessedData["taxasB2W"] = balanceProcessedData.B2W * 0.1225;
              // balanceProcessedData["freteB2W"] = items.totalvendas * 0.13;
            }
            if (items.cliente === "MAGAZINE LUIZA") {
              dreData["magazineLuiza"] = items.totalvendas;
              // balanceProcessedData["taxasMagazineLuiza"] = balanceProcessedData.magazineLuiza * 0.12;
            }
            if (items.cliente === "Mercado Livre") {
              dreData["mercadoPago"] = items.totalvendas;
              // balanceProcessedData["taxasMercadoPago"] = balanceProcessedData.mercadoPago * 0.05;
            }
          });
        } else {
          dreData["B2W"] = 0;
          // balanceProcessedData["taxasB2W"] = 0;
          // balanceProcessedData["freteB2W"] = 0;
          dreData["magazineLuiza"] = 0;
          // balanceProcessedData["taxasMagazineLuiza"] = 0;
          dreData["mercadoPago"] = 0;
          // balanceProcessedData["taxasMercadoPago"] = 0;
  
        }

        const { data: getVendasDRE } = await Axios.get("http://localhost:5000/vendasdre", {
          params: {
            currentBalanceDate: currentBalanceDate,
            prevBalanceDate: prevBalanceDate,
            newBalanceDate: newBalanceDate
          }
        });

        dreData["totalCMV"] = getVendasDRE[0].totalcusto;
        dreData["totaLucroBruto"] = getVendasDRE[0].totallucro;

        if (getTotalVendas[0].totalvendas === getVendasDRE[0].totalvendido) console.log("Valores total de Vendas Batem corretamente!!!", "Query Vendas Periodo = ", getTotalVendas[0].totalvendas, "Query Vendas Totais = ", getVendasDRE[0].totalvendido);
        else if (getTotalVendas[0].totalvendas / getVendasDRE[0].totalvendido >= 0.98 && getTotalVendas[0].totalvendas / getVendasDRE[0].totalvendido < 1.02) console.log("Valores total de Vendas batem mais estao com uma discrepancia de ate 2% em vendasDados", "Query Vendas Periodo = ", getTotalVendas[0].totalvendas, "Query Vendas Totais = ", getVendasDRE[0].totalvendido);
        else console.log("Valores total de Vendas nao batem em vendasDados", "Query Vendas Periodo = ", getTotalVendas[0].totalvendas, "Query Vendas Totais = ", getVendasDRE[0].totalvendido);
      } catch (error) {
        console.error("Error processing VendasData in VendasDados Module");
      }
    })();

    (
      await function createDadosSection() {
        dreData["lucroBruto"] = dreData.vendastotal - (dreData.totalCMV + dreData.imposto + dreData.taxasB2W + dreData.taxasMagazineLuiza + dreData.taxasMercadoPago + dreData.freteB2W);
        dreData["lucroLiquido"] = dreData.lucroBruto - dreData.totalPagas; // devolucoes e incluso nos pagas pois nao foi descontado acima e precisa em outra tabela
        dreData["lucroSobFaturamento"] = ((dreData.lucroLiquido / dreData.vendasBruta) * 100).toFixed(2);
        // OBS Nos calculos abaixo usamos uma % sobre o faturamente pra calcular o CMV e conssequentement o lucroBruto (faturamento - CMV) baseado no marketup de 31%
        dreData["lucroB2W"] = Math.round(((dreData.B2W - dreData.freteB2W) * 0.311583 - dreData.taxasB2W - dreData.B2W * 0.05) * 100) / 100;
        dreData["lucroMagazineLuiza"] = Math.round((dreData.magazineLuiza * 0.311583 - dreData.taxasMagazineLuiza - dreData.magazineLuiza * 0.05) * 100) / 100;
        dreData["lucroMercadoPago"] = Math.round((dreData.mercadoPago * 0.311583 - dreData.taxasMercadoPago - dreData.mercadoPago * 0.05) * 100) / 100;
        dreData["lucroLojaFisica"] = Math.round((dreData.lucroBruto - (dreData.lucroB2W + dreData.lucroMagazineLuiza + dreData.lucroMercadoPago)) * 100) / 100;
        dreData["lucroSobFaturamentoB2W"] = ((dreData.lucroB2W / (dreData.B2W - dreData.freteB2W)) * 100).toFixed(2);
        dreData["lucroSobFaturamentoMagazine"] = ((dreData.lucroMagazineLuiza / dreData.magazineLuiza) * 100).toFixed(2);
        dreData["lucroSobFaturamentoFisica"] = ((dreData.lucroLojaFisica / dreData.vendasLojaFisica) * 100).toFixed(2);
      }
    )();

    await (async function processEstoqueData() {
      try {
        const { data: getCurrentEstoque } = await Axios.get("http://localhost:5000/totalEstoque", {
          params: {
            currentBalanceDate: currentBalanceDate,
            newBalanceDate: newBalanceDate
          }
        });

        if (getCurrentEstoque.length > 0) dreData["estoque"] = getCurrentEstoque[0].custototal;
        else dreData["estoque"] = 0;
      } catch (error) {
        console.log("Error processing EstoqueData in VendasDados Module");
      }
    })();

  
    if (newBalanceDate.length > 0) updateDbEstoque(dreData.estoque, newBalanceDate);

    setBalanceData(dreData);
  }

  async function updateDbEstoque(totalEstoque, currentDate) {
    const estoqueData = await Axios.post("http://localhost:5000/insertBalance", { data: { tipo: "Ativo Circulante", conta: "Estoques", total: totalEstoque, date: currentDate } }, { timeout: 0 })
      .then(resp => {
        if (resp) {
          console.log("Sucessfull updated Estoque into DB when creating new balance");}
          setNewBalDataUpdate()  
      })
      .catch(err => {
        console.log(err, "Error Adding new Estoque data into DB");
      });
    // await appDispatch({ type: "trackVendasDados", value: 1 });// still needs this in the last Refactor version? ? - maybe the solution is here
  }

  return (
    <>
      {/* <div className="d-inline-flex col"> */}
      <div className="col-lg-2">
        <h3 className="mt-4">Dados</h3>
        <h6 className="mt-4">Vendas Total: R${formatNumber(balanceData.vendastotal)}</h6>
        <h6 className="mt-4">Loja Fisica: R${formatNumber(balanceData.vendasLojaFisica)}</h6>
        <h6 className="mt-4">Loja Online: R${formatNumber(balanceData.vendasOnline)}</h6>
        <h6 className="mt-4">Estoque Atual: R${formatNumber(balanceData.estoque)}</h6>
        <h6 className="mt-4">Lucro Liquido Sob Faturamento: {balanceData.lucroSobFaturamento}%</h6>
        <h6 className="mt-4">Lucro Bruto Sob Faturamento B2W: {balanceData.lucroSobFaturamentoB2W}%</h6>
        <h6 className="mt-4">Lucro Bruto Sob Faturamento Magazine: {balanceData.lucroSobFaturamentoMagazine}%</h6>
        <h6 className="mt-4">Lucro Bruto Sob Faturamento Fisica: {balanceData.lucroSobFaturamentoFisica}%</h6>
      </div>
      <div className="col-lg-3">
        <h6 className="mt-4 text-center">% Vendas</h6>

        <Doughnut data={pieChartVendas} />
        <h6 className="mt-4 text-center"> Lucro</h6>

        <Doughnut data={pieChartLucro} />
      </div>

      <div className="col-lg-3">
        <h3 className="mt-2">DRE V2 </h3>

        <table className="table table-striped table-sm table-hover mt-4">
          <thead>
            <tr>
              <th>Lancamento</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>(=) Receita Total de Vendas</td>
              <td>R${formatNumber(balanceData.vendastotal)}</td>
            </tr>
            <tr>
              <td>(-) Devolucoes</td>
              <td>R${formatNumber(balanceData.devoTotal + balanceData.devoB2W)}</td>
            </tr>
            <tr>
              <td>
                <h6>(=) Receita Bruta de Vendas </h6>
              </td>
              <td>R${formatNumber(balanceData.vendasBruta)}</td>
            </tr>
            <tr>
              <td>(-) Total CMV</td>
              <td>R${formatNumber(balanceData.totalCMV)}</td>
            </tr>
            <tr>
              <td>(-) Impostos NF</td>
              <td>R${formatNumber(balanceData.imposto)}</td>
            </tr>
            <tr>
              <td>(-) Taxas B2W</td>
              <td>R${formatNumber(balanceData.taxasB2W)}</td>
            </tr>
            <tr>
              <td>(-) Taxas Magazine Luiza</td>
              <td>R${formatNumber(balanceData.taxasMagazineLuiza)}</td>
            </tr>
            <tr>
              <td>(-) Taxas Mercado Pago</td>
              <td>R${formatNumber(balanceData.taxasMercadoPago)}</td>
            </tr>
            <tr>
              <td>(-) Frete B2W</td>
              <td>R${formatNumber(balanceData.freteB2W)}</td>
            </tr>
            <tr>
              <td>
                <h6>(=) Total Lucro Bruto</h6>
              </td>
              <td>R${formatNumber(balanceData.lucroBruto)}</td>
            </tr>
            <tr>
              <td>
                <h6>(=) Despesas Operacionais</h6>
              </td>
              <td>R${formatNumber(balanceData.totalPagas)}</td>
            </tr>
            <tr>
              <td>
                <h6>(=) Total Lucro Liquido</h6>
              </td>
              <td>R${formatNumber(balanceData.lucroLiquido)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="col-lg-4">
        <h3 className="mt-2 mb-2">Despesas Operacionais </h3>

        <table className="table table-striped table-sm table-hover mt-4">
          <thead>
            <tr>
              <th>Conta</th>
              <th>Descricao</th>
              <th>Total</th>
              <th>% Total</th>
            </tr>
          </thead>
          <tbody>
            {tabelaPagas.map(items => (
              items.percenttotal > 0.01 ?

              <tr key={genRandomId()}>
                <td>{items.conta}</td>
                <td>{items.descricao}</td>
                <td>R${formatNumber(items.total)}</td>
                <td>{formatNumber(items.percenttotal * 100)}%</td>
              </tr>
              :
              null

            ))}
          </tbody>
        </table>
      </div>
      {/* </div> */}
    </>
  );
}

export default VendasDados;
