import thunkMiddleware from "redux-thunk";

import { applyMiddleware, compose, createStore } from "redux";
import { createHashHistory } from "history";
import { routerMiddleware } from "connected-react-router";

import createRootReducer from "../ducks";
import initialState from "./initial-state";

const enhancers = [];
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const history = createHashHistory({
  hashType: 'slash',
  getUserConfirmation: (message, callback) => callback(window.confirm(message))
});

export default createStore(
  createRootReducer(history), // root reducer with router state
  initialState,
  composeEnhancers(applyMiddleware(routerMiddleware(history), thunkMiddleware), ...enhancers),
);
