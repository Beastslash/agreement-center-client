import React from "react";
import { Routes, Route } from "react-router-dom";
import "./global.css";
import AuthenticationRequestPage from "./components/AuthenticationRequestPage";
import CallbackPage from "./components/CallbackPage";
import AgreementPage from "./components/AgreementPage";

export default function App() {

  return (
    <>
      <Routes>
        <Route path="/accounts/authenticate" element={<AuthenticationRequestPage />} />
        <Route path="/accounts/callback" element={<CallbackPage />} />
        <Route path="/:projectName/:agreementName" element={<AgreementPage />} />
      </Routes>
    </>
  );

}