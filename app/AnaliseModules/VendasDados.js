import React, { useEffect, useState, useContext } from "react";
import { Doughnut } from "react-chartjs-2";
import Axios from "axios";
import StateContext from "../StateContext";
import DispatchContext from "../DispatchContext";

function VendasDados(props) {
  const [detalhes, setDetalhes] = useState([]);
  const [pagasTabela, setPagasTabela] = useState([]);
  const appState = useContext(StateContext);
  const appDispatch = useContext(DispatchContext);
  // const datesBalanco = props.state;

  // let lastDate = appState.lastDate; // important dont delete old style
  // let secondLastDate = appState.secondLastDate; // important dont delete old style
  let currentDate = appState.currentDate; // important dont delete old style
  // console.log("dates", lastDate, currentDate, secondLastDate);

  let lastDate = 0;
  let secondLastDate = 0;

  // // //
  let datesBalance = [];

  if (props.state.length > 0) {
    // console.log(props.state, "aim here");
    props.state.forEach(items => {
      // console.log(items);
      if (items.select === true) {
        datesBalance.push(items);
      }
    });
    // console.log(datesBalance, "all dates");
    lastDate = datesBalance.slice(-1)[0].data;
    secondLastDate = datesBalance.slice(-2)[0].data; //
    // console.log(lastDate, currentDate, secondLastDate, "these are my dates");
  }

  // generate IDs
  const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const vendasChart = {
    labels: ["Fisica", "Online"],
    datasets: [
      {
        data: [detalhes.percentFisica, detalhes.percentOnline],
        backgroundColor: ["#FF6384", "#36A2EB"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB"]
      }
    ],
    text: "23%"
  };

  const lucroChart = {
    labels: ["Loja Fisica", "B2W", "Magazine Luiza", "MercadoPago"],
    datasets: [
      {
        data: [detalhes.lucroLojaFisica, detalhes.lucroB2W, detalhes.lucroMagazineLuiza, detalhes.lucroMercadoPago],
        backgroundColor: ["#8e5ea2", "#3e95cd", "#3cba9f", "#FF6384"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#e8c3b9", "#FF6384"]
      }
    ],
    text: "23%"
  };

  const formNumb = function (params) {
    if (typeof params === "number") {
      return params.toLocaleString(navigator.language, { maximumFractionDigits: 2 });
    } else {
      return 0;
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const responseEstoque = await Axios.get("http://localhost:5000/totalEstoque", {
          params: {
            lastDate: lastDate,
            secondLastDate: secondLastDate,
            currentDate: currentDate
          }
        });
        const jsonDataEstoque = [...responseEstoque.data];
        // console.log(jsonDataEstoque, "ESTOQUE DATA") // check

        // // Get Vendas Details
        const responseVendas = await Axios.get("http://localhost:5000/totalVendas", {
          params: {
            lastDate: lastDate,
            secondLastDate: secondLastDate,
            currentDate: currentDate
          }
        });
        const jsonVendas = [...responseVendas.data];
        // console.log(jsonVendas, "Total Vendas ");

        const responseOnline = await Axios.get("http://localhost:5000/vendasOnline", {
          params: {
            lastDate: lastDate,
            secondLastDate: secondLastDate,
            currentDate: currentDate
          }
        });
        let jsonOnline = [...responseOnline.data];
        // console.log(jsonOnline, "Vendas online ");

        let totalOnline = 0;
        if (jsonOnline.length <= 0) {
          jsonOnline = [];
          totalOnline = 0;
        } else {
          totalOnline = jsonOnline.reduce((a, b) => ({ totalvendas: a.totalvendas + b.totalvendas }));
        }

        // console.log(jsonOnline, totalOnline, "2 datasets aqui"); // check
        const responseDRE = await Axios.get("http://localhost:5000/vendasdre", {
          params: {
            lastDate: lastDate,
            secondLastDate: secondLastDate,
            currentDate: currentDate
          }
        });
        const jsonDRE = [...responseDRE.data];
        // console.log(jsonDRE, "venda Totais usually comes empty"); // check usually comes empty

        let vd = {};

        //GET Devolucoes & Remove B2W
        const resdevo = await Axios.get("http://localhost:5000/devolucoes", {
          params: {
            lastDate: lastDate,
            secondLastDate: secondLastDate,
            currentDate: currentDate
          }
        });
        const jsonDevo = [...resdevo.data];
        // setPagasTabela(jsonPagasT);
        // console.log(jsonDevo, "Devolucoes"); // check
        let devoTotal = []
        let devoB2W = []
        if (jsonDevo.length > 0) {
          devoTotal = jsonDevo.filter(({ descricao }) => !descricao.includes("B2W")).reduce((a, b) => ({ total: a.total + b.total }));
          devoB2W = jsonDevo.filter(({ descricao }) => descricao.includes("B2W"));
        } else {
          devoTotal["total"] = 0
          devoB2W = 0
        }

          // console.log(devoTotal.total, "total")
       

        devoB2W.length > 0 ? (vd["devoB2W"] = devoB2W[0].total) : (vd["devoB2W"] = 0);

        vd["devoTotal"] = devoTotal.total;

        Object.keys(totalOnline).length > 0 ? (vd["vendasOnline"] = totalOnline.totalvendas) : (vd["vendasOnline"] = 0);
        vd["vendastotal"] = jsonVendas[0].totalvendas;
        vd["vendasBruta"] = jsonVendas[0].totalvendas - vd.devoTotal - vd.devoB2W;
        vd["vendasLojaFisica"] = jsonVendas[0].totalvendas - vd.vendasOnline;
        vd["percentFisica"] = ((vd["vendasLojaFisica"] / vd["vendastotal"]) * 100).toFixed(2);
        vd["percentOnline"] = ((vd.vendasOnline / vd["vendastotal"]) * 100).toFixed(2);
        vd["imposto"] = vd.vendasBruta * 0.05;

        // console.log(jsonDataEstoque, "TROUBLEE"); // check

        // Definir estoque
        if (jsonDataEstoque.length > 0) {
          vd["estoque"] = jsonDataEstoque[0].custototal;
        } else {
          vd["estoque"] = 0;
        }

        // custom detalhes
        // console.log(jsonOnline, "Online empty?")
        if (jsonOnline.length > 0) {
          jsonOnline.forEach(items => {
            if (items.cliente === "B2W") {
              vd["B2W"] = items.totalvendas - vd.devoB2W;
              vd["taxasB2W"] = vd.B2W * 0.1225;
              vd["freteB2W"] = items.totalvendas * 0.13;
            }
            if (items.cliente === "MAGAZINE LUIZA") {
              vd["magazineLuiza"] = items.totalvendas;
              vd["taxasMagazineLuiza"] = vd.magazineLuiza * 0.12;
            }
            if (items.cliente === "Mercado Livre") {
              vd["mercadoPago"] = items.totalvendas;
              vd["taxasMercadoPago"] = vd.mercadoPago * 0.05;
            }
          });

          if (!vd.mercadoPago) {
            vd["mercadoPago"] = 0;
            vd["taxasMercadoPago"] = vd.mercadoPago * 0.05;
          }
        } else {
          vd["B2W"] = 0;
          vd["taxasB2W"] = 0;
          vd["freteB2W"] = 0;
          vd["magazineLuiza"] = 0;
          vd["taxasMagazineLuiza"] = 0;
          vd["mercadoPago"] = 0;
          vd["taxasMercadoPago"] = 0;
          vd["mercadoPago"] = 0;
          vd["taxasMercadoPago"] = 0;
        }

        // console.log(jsonOnline)
        // console.log(jsonVendas[0].totalvendas, jsonDRE[0].totalvendido, "VALORES VENDAS AQUI"); // check
        if (jsonVendas[0].totalvendas === jsonDRE[0].totalvendido) {
          vd["totalCMV"] = jsonDRE[0].totalcusto;
          vd["totaLucroBruto"] = jsonDRE[0].totallucro;
        } else if (jsonVendas[0].totalvendas / jsonDRE[0].totalvendido >= 0.98 && jsonVendas[0].totalvendas / jsonDRE[0].totalvendido < 1.02) {
          vd["totalCMV"] = jsonDRE[0].totalcusto;
          vd["totaLucroBruto"] = jsonDRE[0].totallucro;
          console.log("Valores total de Vendas batem mais estao com uma discrepancia de ate 2% em vendasDados", "Query Vendas Periodo = ", jsonVendas[0].totalvendas, "Query Vendas Totais = ", jsonDRE[0].totalvendido);
        } else {
          vd["totalCMV"] = jsonDRE[0].totalcusto;
          vd["totaLucroBruto"] = jsonDRE[0].totallucro;
          console.log("Valores total de Vendas nao batem em vendasDados", "Query Vendas Periodo = ", jsonVendas[0].totalvendas, "Query Vendas Totais = ", jsonDRE[0].totalvendido);
        }

        // contas pagas

        const responsepagasT = await Axios.get("http://localhost:5000/pagasTabela", {
          params: {
            lastDate: lastDate,
            secondLastDate: secondLastDate,
            currentDate: currentDate
          }
        });
        const jsonPagasT = [...responsepagasT.data];
        setPagasTabela(jsonPagasT);
        // console.log("total pagas", jsonPagasT);

        const totalPagas = jsonPagasT.reduce((a, b) => ({ total: a.total + b.total }));
        vd["totalPagas"] = totalPagas.total;
        vd["lucroBruto"] = vd.vendastotal - (vd.totalCMV + vd.imposto + vd.taxasB2W + vd.taxasMagazineLuiza + vd.taxasMercadoPago + vd.freteB2W);
        vd["lucroLiquido"] = vd.lucroBruto - vd.totalPagas; // devolucoes e incluso nos pagas pois nao foi descontado acima e precisa em outra tabela
        vd["lucroSobFaturamento"] = ((vd.lucroLiquido / vd.vendasBruta) * 100).toFixed(2);
        // No calculo aqui usamos uma % sobre o faturamente pra calcular o lucro Bruto (faturamento - CMV) baseado no marketup de 40% revertido
        vd["lucroB2W"] = Math.round(((vd.B2W - vd.freteB2W) * 0.311583 - vd.taxasB2W - vd.B2W * 0.05) * 100) / 100;
        vd["lucroMagazineLuiza"] = Math.round((vd.magazineLuiza * 0.311583 - vd.taxasMagazineLuiza - vd.magazineLuiza * 0.05) * 100) / 100;
        vd["lucroMercadoPago"] = Math.round((vd.mercadoPago * 0.311583 - vd.taxasMercadoPago - vd.mercadoPago * 0.05) * 100) / 100;
        vd["lucroLojaFisica"] = Math.round((vd.lucroBruto - (vd.lucroB2W + vd.lucroMagazineLuiza + vd.lucroMercadoPago)) * 100) / 100;
        vd["lucroSobFaturamentoB2W"] = ((vd.lucroB2W / (vd.B2W - vd.freteB2W)) * 100).toFixed(2);
        vd["lucroSobFaturamentoMagazine"] = ((vd.lucroMagazineLuiza / vd.magazineLuiza) * 100).toFixed(2);
        vd["lucroSobFaturamentoFisica"] = ((vd.lucroLojaFisica / vd.vendasLojaFisica) * 100).toFixed(2);

        // console.log(vd.lucroBruto);
        // console.log(vd);
        // console.log(currentDate, "I am here again");

        if (currentDate.length > 0) {
          // console.log("Test to send only updated Estoque Data");

          // appDispatch({ type: "balanco", value: { tipo: "Ativo Circulante", conta: "Estoques", total: "Test" } }); // ao inves de fazer o balanco adicionar dados pra db ?
          // // Send data straight to database when update details
          const estoqueData = await Axios.post("http://localhost:5000/insertBalance", { data: { tipo: "Ativo Circulante", conta: "Estoques", total: vd.estoque, date: currentDate } }, { timeout: 0 })
            // const sendData = await Axios.post("http://localhost:5000/insertBalance", { data1, dataBal }, { timeout: 0 }) // correct
            .then(resp => {
              if (resp) {
                console.log(resp.data, "response");
              }
              // if resp.data = something we update state - this will automatically-re render the component
            })
            .catch(err => {
              console.log(err, "Adding new Estoque data");
            });
          await appDispatch({ type: "trackVendasDados", value: 1 });
          // await console.log(appState.updateComponent, "Check through Estoque");
        }

        setDetalhes(vd);
      } catch (error) {
        console.error(error.message);
      }
    }

    props.state.length > 0 ? fetchData() : null;
  }, [props.state, currentDate]);

  return (
    <>
      {/* <div className="container mt-4"> */}
      <div className="row">
        <div className="col table-responsive">
          <h3 className="mt-4">Dados</h3>
          <h6 className="mt-4">Vendas Total: R${formNumb(detalhes.vendastotal)}</h6>
          <h6 className="mt-4">Loja Fisica: R${formNumb(detalhes.vendasLojaFisica)}</h6>
          <h6 className="mt-4">Loja Online: R${formNumb(detalhes.vendasOnline)}</h6>
          <h6 className="mt-4">Estoque Atual: R${formNumb(detalhes.estoque)}</h6>
          <h6 className="mt-4">Lucro Liquido Sob Faturamento: {detalhes.lucroSobFaturamento}%</h6>
          <h6 className="mt-4">Lucro Bruto Sob Faturamento B2W: {detalhes.lucroSobFaturamentoB2W}%</h6>
          <h6 className="mt-4">Lucro Bruto Sob Faturamento Magazine: {detalhes.lucroSobFaturamentoMagazine}%</h6>
          <h6 className="mt-4">Lucro Bruto Sob Faturamento Fisica: {detalhes.lucroSobFaturamentoFisica}%</h6>
        </div>
        <div className="col">
          <h6 className="mt-4 text-center">% Vendas</h6>

          <Doughnut data={vendasChart} />
        </div>
        <div className="col">
          <h6 className="mt-4 text-center"> Lucro</h6>

          <Doughnut data={lucroChart} />
        </div>
      </div>
      {/* </div> */}
      {/* Have to do a bit manual to ensure its always the same */}
      {/* <div className="container"> */}
      <div className="row mt-1">
        <div className="col table-responsive mt-2">
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
                <td>R${formNumb(detalhes.vendastotal)}</td>
              </tr>
              <tr>
                <td>(-) Devolucoes</td>
                <td>R${formNumb(detalhes.devoTotal + detalhes.devoB2W)}</td>
              </tr>
              <tr>
                <td>
                  <h6>(=) Receita Bruta de Vendas </h6>
                </td>
                <td>R${formNumb(detalhes.vendasBruta)}</td>
              </tr>
              <tr>
                <td>(-) Total CMV</td>
                <td>R${formNumb(detalhes.totalCMV)}</td>
              </tr>
              <tr>
                <td>(-) Impostos NF</td>
                <td>R${formNumb(detalhes.imposto)}</td>
              </tr>
              <tr>
                <td>(-) Taxas B2W</td>
                <td>R${formNumb(detalhes.taxasB2W)}</td>
              </tr>
              <tr>
                <td>(-) Taxas Magazine Luiza</td>
                <td>R${formNumb(detalhes.taxasMagazineLuiza)}</td>
              </tr>
              <tr>
                <td>(-) Taxas Mercado Pago</td>
                <td>R${formNumb(detalhes.taxasMercadoPago)}</td>
              </tr>
              <tr>
                <td>(-) Frete B2W</td>
                <td>R${formNumb(detalhes.freteB2W)}</td>
              </tr>
              <tr>
                <td>
                  <h6>(=) Total Lucro Bruto</h6>
                </td>
                <td>R${formNumb(detalhes.lucroBruto)}</td>
              </tr>
              <tr>
                <td>
                  <h6>(=) Despesas Operacionais</h6>
                </td>
                <td>R${formNumb(detalhes.totalPagas)}</td>
              </tr>
              <tr>
                <td>
                  <h6>(=) Total Lucro Liquido</h6>
                </td>
                <td>R${formNumb(detalhes.lucroLiquido)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col table-responsive mt-2">
          <h6 className="mt-4 mb-2">Despesas Operacionais </h6>

          <table className="table table-striped table-sm table-hover mt-4">
            <thead>
              <tr>
                <th>Conta</th>
                <th>Total</th>
                <th>% Total</th>
              </tr>
            </thead>
            <tbody>
              {pagasTabela.map(items => (
                <tr key={uid()}>
                  <td>{items.conta}</td>
                  <td>R${formNumb(items.total)}</td>
                  <td>{formNumb(items.percenttotal * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* </div> */}
    </>
  );
}

export default VendasDados;
