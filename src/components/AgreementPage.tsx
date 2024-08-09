import React, { useState, useEffect, ReactElement } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Katex from "katex";

export default function AgreementPage() {

  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  const { projectName, agreementName } = useParams();
  const [markdownComponent, setMarkdownComponent] = useState<ReactElement[] | null>(null); 

  useEffect(() => {

    // Verify that the user is signed in and redirect them if they are unauthenticated.
    const value = `; ${document.cookie}`;
    const parts = value.split(`; githubAccessToken=`);
    const githubAccessToken = parts.length === 2 ? parts.pop()?.split(';').shift() : undefined;
    const agreementPath = `${projectName}/${agreementName}`;
    if (!githubAccessToken) {

      navigate(`/authenticate?redirect=/${agreementPath}`, {replace: true});
      return;

    }

    (async () => {

      // Get the agreement content string and parse it as Markdown.
      const agreementContentStringResponse = await fetch(`https://localhost:3001/agreements?agreement_path=${agreementPath}`, {
        headers: {
          "Content-Type": "application/json",
          "github-user-access-token": githubAccessToken
        }
      });

      const agreementContentStringJSON = await agreementContentStringResponse.json();
      const agreementContentString = agreementContentStringJSON.text;
      const regex = /(\n|^)\$(?<math>(.+))\$|(\n|^)(?<tableRow>(\| *.+ *\|)+)|(\n|^)?<!-- *(?<inputIndex>\d+) *-->|(\n|^)#### *(?<h4>.+)|(\n|^)### *(?<h3>.+)|(\n|^)## *(?<h2>.+)|(\n|^)# *(?<h1>.+)|(\n|^)(?<p>.+)/gm;
      const components = [];
      let key = 0;
      let tableHead: ReactElement | null = null;
      let tableRows: ReactElement[] = [];
      let alignment: "left" | "right" | "center" | undefined = undefined;
      for (const {groups: match} of [...agreementContentString.matchAll(regex)]) {

        if (!match.tableRow && tableHead) {

          components.push(
            <table key={`t${key}`} cellPadding={0} cellSpacing={0}>
              <thead>
                {tableHead}
              </thead>
              <tbody>
                {tableRows}
              </tbody>
            </table>
          );

          tableHead = null;
          tableRows = [];

        }

        if (match.h1) {

          components.push(<h1 key={key}>{match.h1}</h1>)

        } else if (match.h2) {

          components.push(<h2 key={key}>{match.h2}</h2>)

        } else if (match.h3) {

          components.push(<h3 key={key}>{match.h3}</h3>)

        } else if (match.h4) {

          components.push(<h4 key={key}>{match.h4}</h4>);

        } else if (match.p) {

          components.push(<p key={key}>{match.p}</p>);

        } else if (match.math) {
          
          components.push(<section dangerouslySetInnerHTML={{__html: Katex.renderToString(match.math, {output: "mathml"}) }} />);
          
        } else if (match.inputIndex) {

          const inputIndex = parseInt(match.inputIndex, 10);
          const inputInfo = JSON.parse(agreementContentStringJSON.inputs)[inputIndex - 1];

          const isOwner = inputInfo.ownerID === agreementContentStringJSON.githubUserID;
          const date = new Date();
          const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const dateString = `${months[date.getUTCMonth()]} ${date.getUTCDate() + 1}, ${date.getUTCFullYear()}`;
          const isDate = inputInfo.type === 1;
          const isDisabled = isDate || !isOwner;

          components.push(
            <section key={key} className={`input${isDisabled ? " disabled" : ""}`}>
              <label>{inputInfo.label}</label>
              <input type="text" disabled={isDisabled} required={isOwner} value={isDate && isOwner ? dateString : undefined} />
            </section>
          );

        } else if (match.tableRow) {

          const columnRegex = /\| (?<column>[^|]+) (\|$)?/gm;
          const columns = [...match.tableRow.matchAll(columnRegex)].map((match, index) => React.createElement(tableHead ? "td" : "th", {key: index}, match.groups.column));
          const row = React.createElement("tr", {key, align: alignment ?? "left"}, columns);

          if (!tableHead) {

            tableHead = row;

          } else if (alignment) {

            tableRows.push(row);

          } else {

            alignment = "left";

          }

        }

        key++;

      }

      setMarkdownComponent(components);
      setIsReady(true);

    })();

  }, []);

  return (
    <main>
      {
        isReady ? (
          <>
            {markdownComponent}
            <section>
              <button disabled>Accept and submit</button>
              <button>Decline terms</button>
            </section>
          </>
        ) : (
          <p>Getting agreement...</p>
        )
      }
    </main>
  );

}