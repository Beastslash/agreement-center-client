import React from "react";
import { Routes, Route } from "react-router-dom";
import "./global.css";
import CallbackPage from "./components/CallbackPage";
import AgreementPage from "./components/AgreementPage/AgreementPage";
import ProgressHeader from "./components/ProgressHeader/ProgressHeader";
import HomePage from "./components/HomePage";
import AuthenticationSection from "./components/AuthenticationPage/AuthenticationPage";

export default function App() {

  return (
    <>
      <ProgressHeader currentStep={0} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/authenticate" element={<AuthenticationSection />} />
        <Route path="/agreements" element={<CallbackPage />} />
        <Route path="/agreements/:projectName/:agreementName" element={<AgreementPage />} />
      </Routes>
    </>
  );

}