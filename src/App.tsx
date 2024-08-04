import React from "react";
import { Routes, Route } from "react-router-dom";
import "./global.css";
import AuthenticationRequestPage from "./components/AuthenticationRequestPage";

export default function App() {

  return (
    <>
      <Routes>
        <Route path="/authenticate" element={<AuthenticationRequestPage />} />
        <Route path="/callback" element={<></>} />
      </Routes>
    </>
  );

}