import React, { useEffect, useState } from "react";
import styles from "./AgreementListPage.module.css";
import { useNavigate } from "react-router-dom";

export default function AgreementListPage() {

  const navigate = useNavigate();
  const [agreements, setAgreements] = useState<{
    path: string;
    name: string;
    status: "Completed" | "Awaiting action from you" | "Awaiting action from others" | "Terminated" | "Partially terminated"
  }[]>([]);

  const value = `; ${document.cookie}`;
  const parts = value.split(`; accessToken=`);
  const accessToken = parts.length === 2 ? parts.pop()?.split(';').shift() ?? "" : "";

  useEffect(() => {

    (async () => {

      if (!agreements[0]) {

        if (!accessToken) navigate(`/authenticate?redirect-path=/agreements`, {replace: true});

        const agreementsResponse = await fetch(`${process.env.REACT_APP_AGREEMENT_CENTER_API}/agreements`, {
          headers: {
            "content-type": "application/json",
            "access-token": accessToken
          }
        });

        if (agreementsResponse.status === 200) {

          const agreements = await agreementsResponse.json();
          setAgreements(agreements);

        } else if (agreementsResponse.status === 401) {

          navigate(`/authenticate?redirect-path=/agreements`, {replace: true})

        }

      }

    })();

  }, []);

  return (
    <main>
      <section id="content">
        <p>Here are all of the agreements that you have been requested to sign. If you're expecting to see an agreement here but it isn't here, contact the producer.</p>
        <table cellPadding={0} cellSpacing={0}>
          <thead>
            <tr>
              <th align="left">Agreement name</th>
              <th align="left">Status</th>
            </tr>
          </thead>
          <tbody>
            {
              agreements.map((agreement) => (
                <tr key={agreement.path} className={styles.agreement} onClick={() => navigate(`/agreements/${agreement.path}${agreement.status === "Awaiting action from you" ? "?status=sign" : ""}`)}>
                  <td>{agreement.name}</td>
                  <td>{agreement.status}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </section>
    </main>
  );

}