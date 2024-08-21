import React from "react";
import styles from "./AgreementListPage.module.css";
import { useNavigate } from "react-router-dom";

export default function AgreementListPage() {

  const navigate = useNavigate();

  return (
    <main>
      <p>Here are all of the agreements that you have been requested to sign. If you're expecting to see an agreement here but it isn't here, contact the producer.</p>
      <table cellPadding={0} cellSpacing={0}>
        <thead>
          <tr>
            <th align="left">Agreement name</th>
            <th align="left">Administrator</th>
            <th align="left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.agreement} onClick={() => navigate("/agreements/everyone-destroys-the-world/inky-the-blue-")}>
            <td>Everyone Destroys the World contractor agreement for InkyTheBlue</td>
            <td>Christian Toney</td>
            <td>Completed</td>
          </tr>
        </tbody>
      </table>
    </main>
  );

}