import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route } from "react-router-dom";

// import "./App.css";
import DispatchContext from "./DispatchContext";
import StateContext from "./StateContext";
import { useImmerReducer } from "use-immer";
import EditBalance from "./AnaliseModules/EditBalance";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BalanceSheet from "./AnaliseModules/BalanceSheet";

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
      // case "lastDate":
      //   draft.lastDate = action.value;
      //   return;
      // case "secondLastDate":
      //   draft.secondLastDate = action.value;
      //   return;
      case "updatePrevDates":
        draft.secondLastDate = action.valSecondLastDate;
        draft.lastDate = action.valLastDate;
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
