import React from "react";
import ReactDOM from "react-dom/client";
import { unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import { createBrowserHistory } from "history";
import { AppRoutes } from "./app/routes";
import "./styles/globals.css";

const history = createBrowserHistory();
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
  <HistoryRouter history={history} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </HistoryRouter>
  </React.StrictMode>
);
