import React, { useState, useEffect, ReactElement } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Katex from "katex";
import Input from "./Input";
import { generateKey as generateGPGKeyPair, readPrivateKey, decryptKey as decryptGPGKey, sign as signMessage, createMessage as createUnencryptedMessage, readSignature } from "openpgp";

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
            <Input key={key} className={`input${isDisabled ? " disabled" : ""}`} type="text" disabled={isDisabled} required={isOwner} value={inputValues[inputIndex] ?? ""} onChange={(event) => setInputValues((currentInputValues) => {

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
      setIsReady(true);

    }

  }, [agreementContent, inputValues]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGettingEmailAddresses, setIsGettingEmailAddresses] = useState<boolean>(false);
  const [emailAddresses, setEmailAddresses] = useState<{email: string; verified: boolean; primary: boolean; visibility: "public" | "private"}[]>([]);
  const [selectedEmailAddressIndex, setSelectedEmailAddressIndex] = useState<number>(0);
  const [gpgPublicKey, setGPGPublicKey] = useState<string>("");
  const [gpgPrivateKey, setGPGPrivateKey] = useState<string>("");
  useEffect(() => {

    if (!githubAccessToken) {

      navigate(`/accounts/authenticate?redirect=/${agreementPath}`, {replace: true});
      return;

    }

    const abortController = new AbortController();

    (async () => {

      try {

        const response = await fetch(`https://localhost:3001/authentication/email-addresses`, {
          signal: abortController.signal,
          headers: {
            "Content-Type": "application/json",
            "github-user-access-token": githubAccessToken
          }
        });

        const jsonResponse = await response.json();

        if (!response.ok) {

          throw new Error(jsonResponse.message);

        }

        setIsReady(true);
        setEmailAddresses(jsonResponse);
        setSelectedEmailAddressIndex(jsonResponse.findIndex((emailData: any) => emailData.primary));
        setIsGettingEmailAddresses(false);

      } catch (error) {

        if (!(error instanceof Error) || error.name !== "AbortError") console.error(error);

      } 

    })();

    return () => abortController.abort();

  }, []);

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

          const unsignedCommitResponse = await fetch(`https://localhost:3001/agreements/inputs?agreement_path=${agreementPath}`, {
            headers: {
              "Content-Type": "application/json",
              "github-user-access-token": githubAccessToken
            },
            body: JSON.stringify(ownedPairs),
            method: "PUT"
          });

          const body = await unsignedCommitResponse.json();

          if (!unsignedCommitResponse.ok) throw new Error(body.message);

          const decryptedPrivateKey = await decryptGPGKey({
            privateKey: await readPrivateKey({armoredKey: gpgPrivateKey}),
            passphrase: process.env.GPG_PASSPHRASE
          });
      
          const armoredSignature = await signMessage({
            message: await createUnencryptedMessage({text: body.commitMessage as string}),
            signingKeys: decryptedPrivateKey,
            detached: true
          }) as string;

          const signedCommitResponse = await fetch(`https://localhost:3001/agreements/inputs?agreement_path=${agreementPath}&code=${body.code}`, {
            headers: {
              "Content-Type": "application/json",
              "github-user-access-token": githubAccessToken,
              "armored-signature": armoredSignature,
              "email-address": emailAddresses[selectedEmailAddressIndex].email
            },
            body: JSON.stringify(ownedPairs),
            method: "PUT"
          });

          alert("Successfully accepted and submitted contract.");

        } catch (error) {

          console.error(error);
          alert(error);

        }

        setIsSubmitting(false);

      })();

    }

  }, [isSubmitting, selectedEmailAddressIndex]);

  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);
  useEffect(() => {

    // Verify that the user is signed in and redirect them if they are unauthenticated.
    if (!githubAccessToken) {

      navigate(`/accounts/authenticate?redirect=/${agreementPath}`, {replace: true});
      return;

    }

    if (isVerifyingCode && selectedEmailAddressIndex) {

      (async () => {

        try {

          // Get the agreement content string and parse it as Markdown.
          const agreementContentStringResponse = await fetch(`https://localhost:3001/agreements?agreement_path=${agreementPath}&email_address=${emailAddresses[selectedEmailAddressIndex].email}&verification_code=${verificationCode}`, {
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

        } catch (error) {

          console.error(error);
          alert(error);

        }

      })();

    }

  }, [isVerifyingCode, selectedEmailAddressIndex, emailAddresses, verificationCode]);

  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  useEffect(() => {

    // Verify that the user is signed in and redirect them if they are unauthenticated.
    if (isSendingCode) {

      (async () => {

        try {

          // Get the agreement content string and parse it as Markdown.
          const agreementContentStringResponse = await fetch(`https://localhost:3001/authentication/verification-code?email_address=${emailAddresses[selectedEmailAddressIndex].email}`, {
            headers: {
              "Content-Type": "application/json"
            },
            method: "POST"
          });

          const agreementContentStringJSON = await agreementContentStringResponse.json();
          setAgreementContent({
            text: agreementContentStringJSON.text,
            inputs: JSON.parse(agreementContentStringJSON.inputs),
            permissions: JSON.parse(agreementContentStringJSON.permissions),
            githubUserID: agreementContentStringJSON.githubUserID
          });

        } catch (error) {

          console.error(error);
          alert(error);

        }

      })();

    }

  }, [isSendingCode, selectedEmailAddressIndex, emailAddresses, verificationCode]);

  return (
    <main>
      {
        isReady ? (
          <>
            <form>
              <p>We've pulled your email addresses from GitHub. Please select one for us authenticate you by sending you a code.</p>
                <section>
                  <label htmlFor="emailAddress">Email address</label>
                  <select id="emailAddress" onChange={(event) => setSelectedEmailAddressIndex(parseInt(event.target.value, 10))} value={`${selectedEmailAddressIndex}`}>
                    {emailAddresses.map((emailAddress, index) => <option value={index}>{emailAddress.email}</option>)}
                  </select>
                </section>
              <button disabled={isSendingCode || isVerifyingCode} onClick={() => setIsSendingCode(true)}>Send code</button>
              <p>Please enter the code that we sent to <b>{emailAddresses[selectedEmailAddressIndex].email}</b>. If you don't see an email from agreements@beastslash.com in your inbox, check your spam and trash. If you still don't see it, feel free to send another code.</p>
              <Input type="text" disabled={isVerifyingCode} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)}>
                Verification code
              </Input>
              <section>
                <button disabled={isVerifyingCode || !verificationCode} onClick={() => setIsVerifyingCode(true)}>Confirm code</button>
                <button className="secondary">Send another code or change email address</button>
              </section>
            </form>
            {markdownComponent}
            <section>
              <button disabled={isSubmitting || !canSubmit} onClick={() => canSubmit ? setIsGettingEmailAddresses(true) : undefined}>I have read, understand, and agree to this agreement</button>
              <button className="secondary" disabled={isSubmitting}>Decline terms</button>
            </section>
            <form onSubmit={(event) => {
              event.preventDefault();
              setIsSubmitting(true);
            }}>
              <section>
                <h2>Privacy disclosure</h2>
                <p>One last thing — after you sign and submit this agreement, we will attach some of your account, network, and device information to your submission, including:</p>
                <ul>
                  <li>your IP address,</li>
                  <li>your Internet service provider information,</li>
                  <li>your user agent and browser information,</li>
                  <li>your GitHub user ID,</li>
                  <li>the ID of the user access token used to sign this agreement,</li>
                  <li>the timestamp of your authorization for Agreement Center to use your GitHub account,</li>
                  <li>the timestamp of you opening this agreement,</li>
                  <li>the timestamp of you signing this agreement,</li>
                  <li>and your email address.</li>
                </ul>
                <p>This information will be encrypted and only used for security and authentication purposes. Agreements, along with this information, are stored at Beastslash's discretion.</p>
                <button type="submit" disabled={isSubmitting || !canSubmit}>Sign and submit</button>
              </section>
            </form>
            <section>
              <h1>You're all set</h1>
              <p>You've signed the <b>Everyone Destroys the World constractor agreement</b>. We've sent a copy of the agreement to your email address, but you can also access the agreement here on the Agreement Center while you still have access to the app.</p>
            </section>
          </>
        ) : (
          <p>Getting agreement...</p>
        )
      }
    </main>
  );

}