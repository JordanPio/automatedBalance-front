import React, { useEffect } from "react";
import Axios from "axios";
import { useImmer } from "use-immer";
import { useParams, withRouter } from "react-router-dom";

function EditBalance(props) {
  const [state, setState] = useImmer({
    sendCount: 0,
    isSaving: false,
    balanceData: [],
    changes: {},
    date: useParams().id,
  });

  function submitHandler(e) {
    e.preventDefault();
    setState((draft) => {
      draft.sendCount++;
    });
  }

  async function deleteHandler() {
    const areYouSure = window.confirm(
      "Do you really want to delete this balance?"
    );
    if (areYouSure) {
      try {
        const response = await Axios.delete(
          "http://localhost:5000/delBalance",
          {
            headers: {
              Authorization: true,
            },
            data: {
              date: state.date,
            },
          }
        );
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
        const { data: balanceData } = await Axios.get(
          "http://localhost:5000/edit",
          {
            params: {
              date: state.date,
            },
          }
        );

        let tempObj = {};
        let refactBalanceData = [];
        for (let i = 0; i < balanceData.length; i++) {
          tempObj[balanceData[i].id] = balanceData[i];
          tempObj[balanceData[i].id]["index"] = i;
          refactBalanceData.push(balanceData[i]);
        }

        setState((draft) => {
          draft.balanceData = refactBalanceData;
        });
      } catch (error) {
        console.error(error.message);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    if (state.sendCount) {
      setState((draft) => {
        draft.isSaving = true;
      });
      async function updateBalance() {
        try {
          const response = await Axios.post(
            "http://localhost:5000/updateBalance",
            { data: state.changes }
          );
          setState((draft) => {
            draft.isSaving = false;
          });
          // appDispatch({ type: "flashMessage", value: "Post was updated." });
          console.log(response.data);
          props.history.push(`/`);
        } catch (error) {
          console.log("There was an error");
        }
      }
      updateBalance();
    }
  }, [state.sendCount]);

  return (
    <div title="Edit Balance" className="mx-auto">
      <h3 className="text-center p-5">
        Atualizar Balanco{" "}
        {`${new Date(state.date).getDate()}/${
          new Date(state.date).getMonth() + 1
        }/${new Date(state.date).getFullYear()}`}
      </h3>

      {/* <div className="container"> */}
      <form onSubmit={submitHandler} className="text-center">
        <div className="form-group ">
          <div className="row">
            <div className="col">
              <h4 className="form-inline mx-3 font-weight-bold">
                Ativo Circulante
              </h4>
              {state.balanceData.map((items, itemsIndex) => {
                if (items.tipo === "Ativo Circulante") {
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
                        onChange={(e) => {
                          let inputValue = e.target.value;
                          let itemId = parseInt(e.target.id, 10);
                          if (
                            state.balanceData[itemsIndex].total !== inputValue
                          ) {
                            setState((draft) => {
                              draft.balanceData[itemsIndex].total = inputValue;
                            });
                            // console.log(state.dados[itemsIndex].id, inputValue)
                            setState((draft) => {
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

              {/* Ativo Permanente */}
              <h4 className="form-inline mx-3 font-weight-bold">
                Ativo Permanente
              </h4>
              {state.balanceData.map((items, itemsIndex) => {
                if (items.tipo === "Ativo Permanente") {
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
                        onChange={(e) => {
                          let inputValue = e.target.value;
                          let itemId = parseInt(e.target.id, 10);
                          if (
                            state.balanceData[itemsIndex].total !== inputValue
                          ) {
                            setState((draft) => {
                              draft.balanceData[itemsIndex].total = inputValue;
                            });
                            // console.log(state.dados[itemsIndex].id, inputValue)
                            setState((draft) => {
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

            {/* // Contas Passivo */}
            <div className="col">
              <h4 className="form-inline mx-3 mt-3 font-weight-bold">
                Contas Passivo
              </h4>
              {state.balanceData.map((items, itemsIndex) => {
                if (items.tipo.includes("Passivo Circulante")) {
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
                        onChange={(e) => {
                          let inputValue = e.target.value;
                          let itemId = parseInt(e.target.id, 10);
                          if (
                            state.balanceData[itemsIndex].total !== inputValue
                          ) {
                            setState((draft) => {
                              draft.balanceData[itemsIndex].total = inputValue;
                            });
                            // console.log(state.dados[itemsIndex].id, inputValue)
                            setState((draft) => {
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

              {/* Exigivel Longo Prazo */}
              <h4 className="form-inline mx-3 mt-3 font-weight-bold">
                Exigivel Longo Prazo
              </h4>
              {state.balanceData.map((items, itemsIndex) => {
                if (items.tipo.includes("Passivo Exigivel")) {
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
                        onChange={(e) => {
                          let inputValue = e.target.value;
                          let itemId = parseInt(e.target.id, 10);
                          if (
                            state.balanceData[itemsIndex].total !== inputValue
                          ) {
                            setState((draft) => {
                              draft.balanceData[itemsIndex].total = inputValue;
                            });
                            // console.log(state.dados[itemsIndex].id, inputValue)
                            setState((draft) => {
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
              <h4 className="form-inline mx-3 mt-3 font-weight-bold">
                Contas Patrimonio
              </h4>
              {state.balanceData.map((items, itemsIndex) => {
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
                        onChange={(e) => {
                          let inputValue = e.target.value;
                          let itemId = parseInt(e.target.id, 10);
                          if (
                            state.balanceData[itemsIndex].total !== inputValue
                          ) {
                            setState((draft) => {
                              draft.balanceData[itemsIndex].total = inputValue;
                            });
                            // console.log(state.dados[itemsIndex].id, inputValue)
                            setState((draft) => {
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
              <h3 className="form-inline mx-3 mt-3 font-weight-bold">
                Lucro / Prejuizo
              </h3>
              {state.balanceData.map((items, itemsIndex) => {
                if (items.tipo.includes("Profit")) {
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
                        onChange={(e) => {
                          let inputValue = e.target.value;
                          let itemId = parseInt(e.target.id, 10);
                          if (
                            state.balanceData[itemsIndex].total !== inputValue
                          ) {
                            setState((draft) => {
                              draft.balanceData[itemsIndex].total = inputValue;
                            });
                            // console.log(state.dados[itemsIndex].id, inputValue)
                            setState((draft) => {
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
          </div>
        </div>

        <br />

        <button className="btn btn-primary mb-4" disabled={state.isSaving}>
          Save Updates
        </button>
        <button
          className="btn btn-danger ml-4 mb-4 text-center"
          onClick={deleteHandler}
        >
          Delete
        </button>
      </form>

      {/* </div> */}
    </div>
  );
}

export default withRouter(EditBalance);
