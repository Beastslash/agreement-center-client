import React, { useState, useEffect, ReactElement } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Katex from "katex";

enum InputType {Text, Date}

export default function AgreementPage() {

  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();
  const { projectName, agreementName } = useParams();
  const [agreementContent, setAgreementContent] = useState<{
    text: string;
    permissions: {
      viewerIDs: number[];
      reviewerIDs: number[];
      editorIDs: number[];
    };
    inputs: {
      type: InputType;
      label: string;
      ownerID: number;
      isAutofilled?: boolean;
    }[];
    githubUserID: number;
  } | null>(null);
  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [inputValues, setInputValues] = useState<any[]>([]);
  const [markdownComponent, setMarkdownComponent] = useState<ReactElement[] | null>(null);

  const agreementPath = `${projectName}/${agreementName}`;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; githubAccessToken=`);
  const githubAccessToken = parts.length === 2 ? parts.pop()?.split(';').shift() : undefined;

  useEffect(() => {

    // Verify that the user is signed in and redirect them if they are unauthenticated.
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
      setAgreementContent({
        text: agreementContentStringJSON.text,
        inputs: JSON.parse(agreementContentStringJSON.inputs),
        permissions: JSON.parse(agreementContentStringJSON.permissions),
        githubUserID: agreementContentStringJSON.githubUserID
      });

    })();

  }, []);

  useEffect(() => {

    if (agreementContent) {

      const regex = /(\n|^)\$(?<math>(.+))\$|(\n|^)(?<tableRow>(\| *.+ *\|)+)|(\n|^)?<!-- *(?<inputIndex>\d+) *-->|(\n|^)#### *(?<h4>.+)|(\n|^)### *(?<h3>.+)|(\n|^)## *(?<h2>.+)|(\n|^)# *(?<h1>.+)|(\n|^)(?<p>.+)/gm;
      const components = [];
      let key = 0;
      let tableHead: ReactElement | null = null;
      let tableRows: ReactElement[] = [];
      let alignment: "left" | "right" | "center" | undefined = undefined;
      let canSubmit = true;
      for (const {groups: match} of [...agreementContent.text.matchAll(regex)]) {

        if (!match) continue;

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
          
          components.push(<section key={key} dangerouslySetInnerHTML={{__html: Katex.renderToString(match.math, {output: "mathml"}) }} />);
          
        } else if (match.inputIndex) {

          const inputIndex = parseInt(match.inputIndex, 10);
          const inputInfo = agreementContent.inputs[inputIndex];

          const isOwner = inputInfo.ownerID === agreementContent.githubUserID;
          const isDate = inputInfo.type === 1;
          if (isDate && !inputValues[inputIndex] && isOwner) {

            const date = new Date();
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const dateString = `${months[date.getUTCMonth()]} ${date.getUTCDate() + 1}, ${date.getUTCFullYear()}`;
            setInputValues((currentInputValues) => {

              const newInputValues = [...currentInputValues];
              newInputValues[inputIndex] = dateString;
              return newInputValues;

            });

          }

          const isDisabled = isDate || !isOwner;

          if (isOwner && !inputValues[inputIndex]) {

            canSubmit = false;

          }

          components.push(
            <section key={key} className={`input${isDisabled ? " disabled" : ""}`}>
              <label>{inputInfo.label}</label>
              <input type="text" disabled={isDisabled} required={isOwner} value={inputValues[inputIndex] ?? ""} onChange={(event) => setInputValues((currentInputValues) => {

                const newInputValues = [...currentInputValues];
                newInputValues[inputIndex] = event.target.value;
                return newInputValues;

              })} />
            </section>
          );

        } else if (match.tableRow) {

          const columnRegex = /\| (?<column>[^|]+) (\|$)?/gm;
          const columns = [...match.tableRow.matchAll(columnRegex)].map((match, index) => React.createElement(tableHead ? "td" : "th", {key: index}, match.groups?.column));
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

      setCanSubmit(canSubmit);
      setMarkdownComponent(components);
      setIsReady(true);

    }

  }, [agreementContent, inputValues]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  useEffect(() => {

    if (isSubmitting && githubAccessToken) {

      (async () => {

        try {

          const ownedPairs: any = {};
          for (let i = 0; inputValues.length > i; i++) {

            if (inputValues[i]) {

              ownedPairs[i] = inputValues[i];

            }

          }

          const response = await fetch(`https://localhost:3001/agreements/inputs?agreement_path=${agreementPath}`, {
            headers: {
              "Content-Type": "application/json",
              "github-user-access-token": githubAccessToken
            },
            body: JSON.stringify(ownedPairs),
            method: "PUT"
          });

          if (!response.ok) {

            throw new Error((await response.json()).message);

          }

          alert("Successfully accepted and submitted contract.");

        } catch (error) {

          alert(error);

        };
        setIsSubmitting(false);

      })();

    }

  }, [isSubmitting]);

  return (
    <main>
      {
        isReady ? (
          <>
            {markdownComponent}
            <section>
              <button disabled={isSubmitting || !canSubmit} onClick={() => canSubmit ? setIsSubmitting(true) : undefined}>Accept and submit</button>
              <button className="secondary" disabled={isSubmitting}>Decline terms</button>
            </section>
          </>
        ) : (
          <p>Getting agreement...</p>
        )
      }
    </main>
  );

}