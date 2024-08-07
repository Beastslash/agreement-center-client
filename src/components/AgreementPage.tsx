import React, { useState, useEffect, ReactElement } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Markdown from "react-markdown";

export default function AgreementPage() {

  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  const { projectName, agreementName } = useParams();
  const [markdownComponent, setMarkdownComponent] = useState<ReactElement | null>(null); 

  useEffect(() => {

    // Verify that the user is signed in and redirect them if they are unauthenticated.
    const value = `; ${document.cookie}`;
    const parts = value.split(`; githubAccessToken=`);
    let githubAccessToken = parts.length === 2 ? parts.pop()?.split(';').shift() : undefined;
    if (!githubAccessToken) {

      navigate(`/authenticate?redirect=/${projectName}/${agreementName}`, {replace: true});
      return;

    }

    (async () => {

      // Get the agreement content string and parse it as Markdown.
      const agreementContentStringResponse = await fetch(`https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-0f624311-d913-4063-8a8d-060f357dc58b/agreements/getAgreement?agreement_path=${projectName}/${agreementName}`, {
        headers: {
          "Content-Type": "application/json",
          "github-user-access-token": githubAccessToken
        }
      });

      const agreementContentStringJSON = await agreementContentStringResponse.json();
      const agreementContentString = agreementContentStringJSON.content;
      setMarkdownComponent(
        <Markdown>{agreementContentString}</Markdown>
      );
      setIsReady(true);

    })();
    

  }, []);

  return (
    <main>
      {
        isReady ? (
          markdownComponent
        ) : (
          <p>Getting agreement...</p>
        )
      }
    </main>
  );

}