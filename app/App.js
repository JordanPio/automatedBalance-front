import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route } from "react-router-dom";

// import "./App.css";
import ContasPagas from "./AnaliseModules/ContasPagas";
import DispatchContext from "./DispatchContext";
import StateContext from "./StateContext";
import { useImmerReducer } from "use-immer";

import CashFlow from "./AnaliseModules/CashFlow";
import ContasPagar from "./AnaliseModules/ContasPagar";
import ContasReceber from "./AnaliseModules/ContasReceber";
// import DRE from "./AnaliseModules/DRE";
import VendasDados from "./AnaliseModules/VendasDados";
// import BalanceTest from "./BalanceTest";
// import BalanceTest2 from "./BalanceTest2";
// import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
// import { CSSTransition } from "react-transition-group";
// import ReactDOM from "react-dom";
import EditBalance from "./AnaliseModules/EditBalance";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BalanceSheet from "./AnaliseModules/BalanceSheet";
// import Axios from "axios";

// need to use with webpack
// import Axios from "axios";
// Axios.defaults.baseURL = process.env.BACKENDURL || "https://backendformyapp.herokuapp.com";

function App() {
  const initialState = {
    loggedIn: Boolean(localStorage.getItem("complexappToken")),
    flashMessages: [],
    user: {
      token: localStorage.getItem("complexappToken"),
      username: localStorage.getItem("complexappUsername"),
      avatar: localStorage.getItem("complexappAvatar")
    },
    lastDate: "2020-08-27",
    secondLastDate: "2020-07-29",
    currentDate: [],
    lastDateScrape: [],
    currentDateScrape: [],
    NewBalanceData: [],
    updateComponent: {
      vendasDados: 0,
      contasPagar: 0
    }
  };

  function ourReducer(draft, action) {
    switch (action.type) {
      case "login":
        draft.loggedIn = true;
        draft.user = action.data;
        return;
      case "logout":
        draft.loggedIn = false;
        return;
      case "flashMessage":
        draft.flashMessages.push(action.value);
        return;
      case "lastDate":
        draft.lastDate = action.value;
        return;
      case "secondLastDate":
        draft.secondLastDate = action.value;
        return;
      case "currentDate":
        draft.currentDate = action.value;
        return;
      case "lastDateScrape":
        draft.lastDateScrape = action.value;
        return;
      case "currentDateScrape":
        draft.currentDateScrape = action.value;
        return;
      case "balanco":
        draft.NewBalanceData.push(action.value);
        return;
      case "trackVendasDados":
        draft.updateComponent.vendasDados = action.value;
        return;
      case "trackContasPagar":
        draft.updateComponent.contasPagar = action.value;
        return;
    }
  }

  const [state, dispatch] = useImmerReducer(ourReducer, initialState);

  // useEffect(()=> {}, [state.updateAll]);// not working and delete STATE later
  return (
    <Fragment>
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>
          <BrowserRouter>
            <div className="mx-auto px-5">
              <Header />
              <Switch>
                <Route path="/" exact>
                  <BalanceSheet />
                  <VendasDados />
                  <CashFlow />

                  <ContasPagar />
                  <ContasReceber />
                  <ContasPagas />
                  {/* <BalanceTest /> */}
                  {/* <BalanceTest2 /> */}
                  {/* <DRE /> */}
                </Route>
                <Route path="/edit/:id" exact>
                  <EditBalance />
                </Route>
              </Switch>
              <Footer />
            </div>
            {/* <Route path="/edit/:id" component={EditBalance} /> */}
          </BrowserRouter>
        </DispatchContext.Provider>
      </StateContext.Provider>
    </Fragment>
  );
}

// export default App;

ReactDOM.render(<App />, document.querySelector("#app"));

if (module.hot) {
  module.hot.accept();
}
