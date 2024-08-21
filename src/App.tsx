import React from "react";
import { Routes, Route } from "react-router-dom";
import "./global.css";
import AgreementPage from "./components/AgreementPage/AgreementPage";
import ProgressHeader from "./components/ProgressHeader/ProgressHeader";
import HomePage from "./components/HomePage";
import AuthenticationSection from "./components/AuthenticationPage/AuthenticationPage";
import AgreementListPage from "./components/AgreementListPage/AgreementListPage";

export default function App() {

  return (
    <>
      <ProgressHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/authenticate" element={<AuthenticationSection />} />
        <Route path="/agreements" element={<AgreementListPage />} />
        <Route path="/agreements/:projectName/:agreementName" element={<AgreementPage />} />
      </Routes>
    </>
  );

}