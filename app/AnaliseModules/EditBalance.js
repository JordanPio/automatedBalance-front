import React, { useEffect } from "react";
import Page from "../components/Page";
import Axios from "axios";
// import { parse } from "date-fns";
import { useImmer } from "use-immer";
import { useParams, withRouter } from "react-router-dom";

// import StateContext from "../StateContext";
// import DispatchContext from "../DispatchContext";
// import { Link } from "react-router-dom";

// const dtConvert = require("date-fns");

function EditBalance(props) {
  const [state, setState] = useImmer({
    newSet: {},
    sendCount: 0,
    isSaving: false,
    dados: [],
    changes: {},
    date: useParams().id
  });

  // generate IDs
  // const uid = function () {
  //   return Date.now().toString(36) + Math.random().toString(36).substr(2);
  // };

  function submitHandler(e) {
    e.preventDefault();
    setState(draft => {
      draft.sendCount++;
    });
  }

  async function deleteHandler() {
    const areYouSure = window.confirm("Do you really want to delete this balance?");
    if (areYouSure) {
      try {
        const response = await Axios.delete("http://localhost:5000/delBalance", {
          headers: {
            Authorization: true
          },
          data: {
            date: state.date
          }
        });
        if (response.data === "Success") {
          // 1. display a flash msg
          // appDispatch({ type: "flashMessage", value: "Balance was succesfully deleted" });
          // 2. redirect back to the current user profile
          // appDispatch({ type: "updateComp", value: 1 }); // not really working

          // if ( state.date === appState.currentDate || state.date === appState.lastDate) {
          // appDispatch({ type: "currentDate", value: [] });
          // appDispatch({ type: "currentDate", value: [] });

          // }

          // appDispatch({ type: "currentDate", value: '2020-07-29' });
          // appDispatch({ type: "lastDate", value: '2020-07-29' });
          // props.history.goBack()

          props.history.push(`/`);
          window.location.reload(); // works like a charm but its reloading the page SOLUTION 1
        }
      } catch (error) {
        console.log("There was a problem");
      }
    }
  }

  useEffect(() => {
    const getData = async () => {
      try {
        //get Balance Data
        const response = await Axios.get("http://localhost:5000/edit", {
          params: {
            date: state.date
          }
        });
        const jsonData = await [...response.data];

        // console.log(jsonData);

        let newObj = {};
        let newSet = [];
        for (let i = 0; i < jsonData.length; i++) {
          // console.log(jsonData[i])
          newObj[jsonData[i].id] = jsonData[i];
          newObj[jsonData[i].id]["index"] = i;
          newSet.push(jsonData[i]);
          // newSet.push(jsonData[i])
        }
        // set contas
        // console.log(newSet);

        setState(draft => {
          draft.dados = newSet;
          draft.newSet = newObj;
        });
        // console.log(newSet);
      } catch (error) {
        console.error(error.message);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    if (state.sendCount) {
      setState(draft => {
        draft.isSaving = true;
      });
      // const ourRequest = Axios.CancelToken.source();
      // console.log(state.changes);
      async function updateBalance() {
        try {
          const response = await Axios.post("http://localhost:5000/updateBalance", { data: state.changes });
          setState(draft => {
            draft.isSaving = false;
          });
          // appDispatch({ type: "flashMessage", value: "Post was updated." });
          console.log(response.data);
          // props.history.goBack();
          props.history.push(`/`);
          // window.location.reload(); // works like a charm but its reloading the page SOLUTION 1
        } catch (error) {
          console.log("There was an error");
        }
      }
      updateBalance();
      // return () => {
      //   ourRequest.cancel();
      // };
    }
  }, [state.sendCount]);

  return (
    <Page title="Edit Balance">
      <h3 className="text-center p-5">Atualizar Balanco</h3>
      {/* <div className="container"> */}
      <form onSubmit={submitHandler} className="text-center">
        <div className="form-group">
          <h5 className="form-inline mx-3">Contas Ativo</h5>
          {state.dados.map((items, itemsIndex) => {
            if (items.tipo.includes("Ativo")) {
              return (
                <div key={items.id} className="form-inline">
                  <label className="mx-3">{items.conta} R$:</label>
                  <input
                    name="Total"
                    className="form-control mb-2"
                    key={itemsIndex}
                    id={items.id}
                    value={items.total}
                    index={items.index}
                    onChange={e => {
                      let inputValue = e.target.value;
                      let itemId = parseInt(e.target.id, 10);
                      if (state.dados[itemsIndex].total !== inputValue) {
                        setState(draft => {
                          draft.dados[itemsIndex].total = inputValue;
                        });
                        // console.log(state.dados[itemsIndex].id, inputValue)
                        setState(draft => {
                          draft.changes[itemId] = parseFloat(inputValue);
                        });
                      }
                    }}
                  />
                </div>
              );
            } else {
              return null;
            }
          })}
          {/* // Contas Passivo */}
          <h5 className="form-inline mx-3 mt-3">Contas Passivo</h5>
          {state.dados.map((items, itemsIndex) => {
            if (items.tipo.includes("Passivo")) {
              return (
                <div key={items.id} className="form-inline">
                  <label className="mx-3">{items.conta} R$:</label>
                  <input
                    name="Total"
                    className="form-control mb-2"
                    key={itemsIndex}
                    id={items.id}
                    value={items.total}
                    index={items.index}
                    onChange={e => {
                      let inputValue = e.target.value;
                      let itemId = parseInt(e.target.id, 10);
                      if (state.dados[itemsIndex].total !== inputValue) {
                        setState(draft => {
                          draft.dados[itemsIndex].total = inputValue;
                        });
                        // console.log(state.dados[itemsIndex].id, inputValue)
                        setState(draft => {
                          draft.changes[itemId] = parseFloat(inputValue);
                        });
                      }
                    }}
                  />
                </div>
              );
            } else {
              return null;
            }
          })}

          {/* // Contas Patrimonio */}
          <h5 className="form-inline mx-3 mt-3">Contas Patrimonio</h5>
          {state.dados.map((items, itemsIndex) => {
            if (items.tipo.includes("Patrimonio")) {
              return (
                <div key={items.id} className="form-inline">
                  <label className="mx-3">{items.conta} R$:</label>
                  <input
                    name="Total"
                    className="form-control mb-2"
                    key={itemsIndex}
                    id={items.id}
                    value={items.total}
                    index={items.index}
                    onChange={e => {
                      let inputValue = e.target.value;
                      let itemId = parseInt(e.target.id, 10);
                      if (state.dados[itemsIndex].total !== inputValue) {
                        setState(draft => {
                          draft.dados[itemsIndex].total = inputValue;
                        });
                        // console.log(state.dados[itemsIndex].id, inputValue)
                        setState(draft => {
                          draft.changes[itemId] = parseFloat(inputValue);
                        });
                      }
                    }}
                  />
                </div>
              );
            } else {
              return null;
            }
          })}

          {/* // Contas Analise */}
          <h5 className="form-inline mx-3 mt-3">Contas Analise</h5>
          {state.dados.map((items, itemsIndex) => {
            if (items.tipo.includes("Analise")) {
              return (
                <div key={items.id} className="form-inline">
                  <label className="mx-3">{items.conta} R$:</label>
                  <input
                    name="Total"
                    className="form-control mb-2"
                    key={itemsIndex}
                    id={items.id}
                    value={items.total}
                    index={items.index}
                    onChange={e => {
                      let inputValue = e.target.value;
                      let itemId = parseInt(e.target.id, 10);
                      if (state.dados[itemsIndex].total !== inputValue) {
                        setState(draft => {
                          draft.dados[itemsIndex].total = inputValue;
                        });
                        // console.log(state.dados[itemsIndex].id, inputValue)
                        setState(draft => {
                          draft.changes[itemId] = parseFloat(inputValue);
                        });
                      }
                    }}
                  />
                </div>
              );
            } else {
              return null;
            }
          })}
        </div>

        <br />
        <button className="btn btn-primary mb-2" disabled={state.isSaving}>
          Save Updates
        </button>
      </form>
      <button className="btn btn-danger mb-2 text-center" onClick={deleteHandler}>
        Delete
      </button>
      {/* </div> */}
    </Page>
  );
}

export default withRouter(EditBalance);
