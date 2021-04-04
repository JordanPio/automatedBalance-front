import React, { useEffect, useState, useContext } from "react";
import { Doughnut } from "react-chartjs-2";
import Axios from "axios";

function VendasDados({ prevBalanceDate, currentBalanceDate, newBalanceDate }) {
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
    let balanceProcessedData = {};

    await (async function processDespesasData() {
      try {
        const { data: getContasPagas } = await Axios.get("http://localhost:5000/pagasTabela", {
          params: {
            currentBalanceDate: currentBalanceDate,
            prevBalanceDate: prevBalanceDate,
            newBalanceDate: newBalanceDate
          }
        });
        setTabelaPagas(getContasPagas);

        const totalPagas = getContasPagas.reduce((a, b) => ({ total: a.total + b.total }));
        balanceProcessedData["totalPagas"] = totalPagas.total;
      } catch (error) {
        console.error("Error processing Despesas Data in VendasDados Component");
      }
    })();

    await (async function processDevoData() {
      try {
        const { data: getDevolucoes } = await Axios.get("http://localhost:5000/devolucoes", {
          params: {
            currentBalanceDate: currentBalanceDate,
            prevBalanceDate: prevBalanceDate,
            newBalanceDate: newBalanceDate
          }
        });

        let devoTotal = [];
        let devoB2W = [];
        if (getDevolucoes.length > 0) {
          devoTotal = getDevolucoes.filter(({ descricao }) => !descricao.includes("B2W")).reduce((a, b) => ({ total: a.total + b.total }));
          devoB2W = getDevolucoes.filter(({ descricao }) => descricao.includes("B2W"));
        } else {
          devoTotal["total"] = 0;
          devoB2W = 0;
        }

        devoB2W.length > 0 ? (balanceProcessedData["devoB2W"] = devoB2W[0].total) : (balanceProcessedData["devoB2W"] = 0);

        balanceProcessedData["devoTotal"] = devoTotal.total;
      } catch (error) {
        console.error("Error processing Devolucao Data in VendasDados Module");
      }
    })();

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
        Object.keys(totalVendasOnline).length > 0 ? (balanceProcessedData["vendasOnline"] = totalVendasOnline.totalvendas) : (balanceProcessedData["vendasOnline"] = 0);

        const { data: getTotalVendas } = await Axios.get("http://localhost:5000/totalVendas", {
          params: {
            currentBalanceDate: currentBalanceDate,
            prevBalanceDate: prevBalanceDate,
            newBalanceDate: newBalanceDate
          }
        });

        balanceProcessedData["vendastotal"] = getTotalVendas[0].totalvendas;
        balanceProcessedData["vendasBruta"] = getTotalVendas[0].totalvendas - balanceProcessedData.devoTotal - balanceProcessedData.devoB2W;
        balanceProcessedData["vendasLojaFisica"] = getTotalVendas[0].totalvendas - balanceProcessedData.vendasOnline;
        balanceProcessedData["percentFisica"] = ((balanceProcessedData["vendasLojaFisica"] / balanceProcessedData["vendastotal"]) * 100).toFixed(2);
        balanceProcessedData["percentOnline"] = ((balanceProcessedData.vendasOnline / balanceProcessedData["vendastotal"]) * 100).toFixed(2);
        balanceProcessedData["imposto"] = balanceProcessedData.vendasBruta * 0.05;

        if (getVendasOnline.length > 0) {
          getVendasOnline.forEach(items => {
            if (items.cliente === "B2W") {
              balanceProcessedData["B2W"] = items.totalvendas - balanceProcessedData.devoB2W;
              balanceProcessedData["taxasB2W"] = balanceProcessedData.B2W * 0.1225;
              balanceProcessedData["freteB2W"] = items.totalvendas * 0.13;
            }
            if (items.cliente === "MAGAZINE LUIZA") {
              balanceProcessedData["magazineLuiza"] = items.totalvendas;
              balanceProcessedData["taxasMagazineLuiza"] = balanceProcessedData.magazineLuiza * 0.12;
            }
            if (items.cliente === "Mercado Livre") {
              balanceProcessedData["mercadoPago"] = items.totalvendas;
              balanceProcessedData["taxasMercadoPago"] = balanceProcessedData.mercadoPago * 0.05;
            }
          });
        } else {
          balanceProcessedData["B2W"] = 0;
          balanceProcessedData["taxasB2W"] = 0;
          balanceProcessedData["freteB2W"] = 0;
          balanceProcessedData["magazineLuiza"] = 0;
          balanceProcessedData["taxasMagazineLuiza"] = 0;
          balanceProcessedData["mercadoPago"] = 0;
          balanceProcessedData["taxasMercadoPago"] = 0;
          balanceProcessedData["mercadoPago"] = 0;
          balanceProcessedData["taxasMercadoPago"] = 0;
        }

        const { data: getVendasDRE } = await Axios.get("http://localhost:5000/vendasdre", {
          params: {
            currentBalanceDate: currentBalanceDate,
            prevBalanceDate: prevBalanceDate,
            newBalanceDate: newBalanceDate
          }
        });

        balanceProcessedData["totalCMV"] = getVendasDRE[0].totalcusto;
        balanceProcessedData["totaLucroBruto"] = getVendasDRE[0].totallucro;

        if (getTotalVendas[0].totalvendas === getVendasDRE[0].totalvendido) console.log("Valores total de Vendas Batem corretamente!!!", "Query Vendas Periodo = ", getTotalVendas[0].totalvendas, "Query Vendas Totais = ", getVendasDRE[0].totalvendido);
        else if (getTotalVendas[0].totalvendas / getVendasDRE[0].totalvendido >= 0.98 && getTotalVendas[0].totalvendas / getVendasDRE[0].totalvendido < 1.02) console.log("Valores total de Vendas batem mais estao com uma discrepancia de ate 2% em vendasDados", "Query Vendas Periodo = ", getTotalVendas[0].totalvendas, "Query Vendas Totais = ", getVendasDRE[0].totalvendido);
        else console.log("Valores total de Vendas nao batem em vendasDados", "Query Vendas Periodo = ", getTotalVendas[0].totalvendas, "Query Vendas Totais = ", getVendasDRE[0].totalvendido);
      } catch (error) {
        console.error("Error processing VendasData in VendasDados Module");
      }
    })();

    (
      await function createDadosSection() {
        balanceProcessedData["lucroBruto"] = balanceProcessedData.vendastotal - (balanceProcessedData.totalCMV + balanceProcessedData.imposto + balanceProcessedData.taxasB2W + balanceProcessedData.taxasMagazineLuiza + balanceProcessedData.taxasMercadoPago + balanceProcessedData.freteB2W);
        balanceProcessedData["lucroLiquido"] = balanceProcessedData.lucroBruto - balanceProcessedData.totalPagas; // devolucoes e incluso nos pagas pois nao foi descontado acima e precisa em outra tabela
        balanceProcessedData["lucroSobFaturamento"] = ((balanceProcessedData.lucroLiquido / balanceProcessedData.vendasBruta) * 100).toFixed(2);
        // OBS Nos calculos abaixo usamos uma % sobre o faturamente pra calcular o CMV e conssequentement o lucroBruto (faturamento - CMV) baseado no marketup de 31%
        balanceProcessedData["lucroB2W"] = Math.round(((balanceProcessedData.B2W - balanceProcessedData.freteB2W) * 0.311583 - balanceProcessedData.taxasB2W - balanceProcessedData.B2W * 0.05) * 100) / 100;
        balanceProcessedData["lucroMagazineLuiza"] = Math.round((balanceProcessedData.magazineLuiza * 0.311583 - balanceProcessedData.taxasMagazineLuiza - balanceProcessedData.magazineLuiza * 0.05) * 100) / 100;
        balanceProcessedData["lucroMercadoPago"] = Math.round((balanceProcessedData.mercadoPago * 0.311583 - balanceProcessedData.taxasMercadoPago - balanceProcessedData.mercadoPago * 0.05) * 100) / 100;
        balanceProcessedData["lucroLojaFisica"] = Math.round((balanceProcessedData.lucroBruto - (balanceProcessedData.lucroB2W + balanceProcessedData.lucroMagazineLuiza + balanceProcessedData.lucroMercadoPago)) * 100) / 100;
        balanceProcessedData["lucroSobFaturamentoB2W"] = ((balanceProcessedData.lucroB2W / (balanceProcessedData.B2W - balanceProcessedData.freteB2W)) * 100).toFixed(2);
        balanceProcessedData["lucroSobFaturamentoMagazine"] = ((balanceProcessedData.lucroMagazineLuiza / balanceProcessedData.magazineLuiza) * 100).toFixed(2);
        balanceProcessedData["lucroSobFaturamentoFisica"] = ((balanceProcessedData.lucroLojaFisica / balanceProcessedData.vendasLojaFisica) * 100).toFixed(2);
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

        if (getCurrentEstoque.length > 0) balanceProcessedData["estoque"] = getCurrentEstoque[0].custototal;
        else balanceProcessedData["estoque"] = 0;
      } catch (error) {
        console.log("Error processing EstoqueData in VendasDados Module");
      }
    })();

    if (newBalanceDate.length > 0) updateDbEstoque(balanceProcessedData.estoque, newBalanceDate);

    setBalanceData(balanceProcessedData);
  }

  async function updateDbEstoque(totalEstoque, currentDate) {
    const estoqueData = await Axios.post("http://localhost:5000/insertBalance", { data: { tipo: "Ativo Circulante", conta: "Estoques", total: totalEstoque, date: currentDate } }, { timeout: 0 })
      .then(resp => {
        if (resp) console.log("System finished adding new data to DB based on previous balance");
      })
      .catch(err => {
        console.log(err, "Error Adding new Estoque data into DB");
      });
    // await appDispatch({ type: "trackVendasDados", value: 1 });// still needs this in the last Refactor version? ?
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
        <h3 className="mt-2">DRE </h3>

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
              <th>Total</th>
              <th>% Total</th>
            </tr>
          </thead>
          <tbody>
            {tabelaPagas.map(items => (
              <tr key={genRandomId()}>
                <td>{items.conta}</td>
                <td>R${formatNumber(items.total)}</td>
                <td>{formatNumber(items.percenttotal * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* </div> */}
    </>
  );
}

export default VendasDados;
