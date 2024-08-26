import React, { useState, useEffect, ReactElement } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Katex from "katex";
import Input from "../Input/Input";
import styles from "./AgreementPage.module.css"

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
      ownerID: string;
      isAutofilled?: boolean;
      value: any;
    }[];
  } | null>(null);
  const [emailAddress, setEmailAddress] = useState<string | null>(null);
  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [inputValues, setInputValues] = useState<any[]>([]);
  const [markdownComponent, setMarkdownComponent] = useState<ReactElement[] | null>(null);
  const [ownedInputIndices, setOwnedInputIndices] = useState<number[]>([]);

  const agreementPath = `${projectName}/${agreementName}`;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; accessToken=`);
  const accessToken = parts.length === 2 ? parts.pop()?.split(';').shift() : undefined;

  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  useEffect(() => {

    if (agreementContent) {

      const regex = /(\n|^)\$(?<math>(.+))\$|(\n|^)(?<tableRow>(\| *.+ *\|)+)|(\n|^)?<!-- *(?<inputIndex>\d+) *-->|(\n|^)#### *(?<h4>.+)|(\n|^)### *(?<h3>.+)|(\n|^)## *(?<h2>.+)|(\n|^)# *(?<h1>.+)|(\n|^)(?<p>.+)/gm;
      const components = [];
      let key = 0;
      let tableHead: ReactElement | null = null;
      let tableRows: ReactElement[] = [];
      let alignment: "left" | "right" | "center" | undefined = undefined;
      let canSubmit = true;
      const ownedInputIndices = [];
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
          const isOwner = inputInfo.ownerID === emailAddress;
          const isDate = inputInfo.type === 1;
          const inputValue = inputInfo.value;
          if (inputValue) {

            setInputValues((currentInputValues) => {

              const newInputValues = [...currentInputValues];
              newInputValues[inputIndex] = inputValue;
              return newInputValues;

            });
          
          } else if (isDate && !inputValues[inputIndex] && inputInfo.isAutofilled && isOwner && status === "sign") {

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

          if (isOwner) {

            ownedInputIndices.push(inputIndex);

            if (!inputValues[inputIndex]) {

              canSubmit = false;

            }

          }

          components.push(
            <Input key={key} className={`input${isDisabled ? " disabled" : ""}`} type="text" disabled={status !== "sign" || isDisabled} required={isOwner} value={inputValues[inputIndex] ?? ""} onChange={(event) => setInputValues((currentInputValues) => {

              const newInputValues = [...currentInputValues];
              newInputValues[inputIndex] = event.target.value;
              return newInputValues;

            })}>
              {inputInfo.label}
            </Input>
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
      setOwnedInputIndices(ownedInputIndices);
      setIsReady(true);

    }

  }, [agreementContent, inputValues, emailAddress, status]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  useEffect(() => {

    if (isSubmitting && accessToken) {

      (async () => {

        try {

          // Only include owned values to avoid server permission errors.
          const ownedPairs: any = {};
          for (let i = 0; inputValues.length > i; i++) {

            if (ownedInputIndices.includes(i)) {

              ownedPairs[i] = inputValues[i];

            }

          }

          // Sign the document then show the response.
          const signatureResponse = await fetch(`${process.env.REACT_APP_AGREEMENT_CENTER_API}/agreements/${agreementPath}/sign`, {
            headers: {
              "Content-Type": "application/json",
              "access-token": accessToken
            },
            body: JSON.stringify(ownedPairs),
            method: "PUT"
          });

          const signatureResponseJSON = await signatureResponse.json();

          if (!signatureResponse.ok) throw new Error(signatureResponseJSON.message);

          navigate(`${location.pathname}?status=completed`, {replace: true});

        } catch (error) {

          console.error(error);
          alert(error);

        }

        setIsSubmitting(false);

      })();

    }

  }, [isSubmitting]);

  const [error, setError] = useState<string | null>(null);
  const [shouldGetAgreementContent, setShouldGetAgreementContent] = useState<boolean>(false);
  useEffect(() => {

    // Verify that the user is signed in and redirect them if they are unauthenticated.
    if (!accessToken) {

      navigate(`/accounts/authenticate?redirect-path=/agreements/${agreementPath}`, {replace: true});
      return;

    }

    if (status === "completed") {

      setIsReady(true);
      
    } else if (shouldGetAgreementContent && !agreementContent) {

      (async () => {

        try {

          // Get the agreement content string and parse it as Markdown.
          const agreementContentStringResponse = await fetch(`${process.env.REACT_APP_AGREEMENT_CENTER_API}/agreements/${agreementPath}${status === "sign" ? "?mode=sign" : ""}`, {
            headers: {
              "Content-Type": "application/json",
              "access-token": accessToken
            }
          });

          const agreementContentStringJSON = await agreementContentStringResponse.json();
          
          if (!agreementContentStringResponse.ok) {
           
            if (agreementContentStringResponse.status === 404) {

              navigate("/agreements", {replace: true});

            } else if (agreementContentStringResponse.status === 401) {

              navigate(`/authenticate?redirect-path=/agreements/${agreementPath}${status === "sign" ? "?status=sign" : ""}`)
              
            }

            throw new Error(agreementContentStringJSON.message)
            
          };
          
          console.log(agreementContentStringResponse.headers)
          const emailAddress = agreementContentStringResponse.headers.get("email-address");
          setEmailAddress(emailAddress);

          setAgreementContent({
            text: agreementContentStringJSON.text,
            inputs: agreementContentStringJSON.inputs,
            permissions: agreementContentStringJSON.permissions
          });

        } catch (error) {
          
          if (error instanceof Error) {

            setError(error.message);

          }

          console.error(error);

        }

        setShouldGetAgreementContent(false);

      })();

    }

  }, [shouldGetAgreementContent]);

  useEffect(() => {

    if (status === "submit" && !canSubmit) {

      navigate(`${location.pathname}?status=sign`, {replace: true});

    }

  }, [status, canSubmit]);

  useEffect(() => {

    setShouldGetAgreementContent(!status || status === "sign");

  }, [status])

  return (
    <main id={styles.page}>
      <section id="content">
        {
          isReady ? (
            status === "completed" ? (
              <section>
                <h1>You're all set</h1>
                <p>You've signed <b>{location.pathname.slice(location.pathname.lastIndexOf("/") + 1)}</b>. You can download or print a copy of the agreement for your reference, but you can also <Link to={location.pathname} onClick={() => setIsReady(false)}>access the agreement here on the Agreement Center</Link> while you still have access to the app.</p>
              </section>
            ) : (
              status === "submit" ? (
                <form onSubmit={(event) => {
                  event.preventDefault();
                  setIsSubmitting(true);
                }}>
                  <section>
                    <h2>Privacy disclosure</h2>
                    <p>One last thing: by submitting this agreement, you understand and agree that some of your account, network, and device information may be attached to your submission, including:</p>
                    <ul>
                      <li>your IP address,</li>
                      <li>the timestamp of you opening this agreement,</li>
                      <li>the timestamp of you signing this agreement,</li>
                      <li>and your email address.</li>
                    </ul>
                    <p>This information will only be collected once and it can only be used for security and authentication purposes. Agreements, along with this information, are stored at Beastslash's discretion.</p>
                    <section>
                      <button type="submit" disabled={!canSubmit || isSubmitting} onClick={() => setIsSubmitting(true)}>Submit agreement</button>
                      <button type="button" className="secondary" onClick={() => navigate(`${location.pathname}?status=sign`)}>Review agreement again</button>
                    </section>
                  </section>
                </form>
              ) : (
                <>
                  {markdownComponent}
                  {
                    status === "sign" ? (
                      <section>
                        <button disabled={!canSubmit} onClick={() => navigate(`${location.pathname}?status=submit`)}>I have read, understand, and agree to this agreement</button>
                        <button className="secondary" disabled={isSubmitting}>Decline terms</button>
                      </section>
                    ) : null
                  }
                </>
              )
            )
          ) : (
            error ? (
              <section id={styles.error}>
                <p>A problem happened when getting the agreement:</p>
                <code>
                  {error}
                </code>
              </section>
            ) : <p>Getting agreement...</p>
          )
        }
      </section>
    </main>
  );

}