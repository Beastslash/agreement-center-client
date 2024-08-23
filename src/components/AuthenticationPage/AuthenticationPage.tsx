import React, { useEffect, useState } from "react";
import Input from "../Input/Input";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthenticationSection() {

  const [shouldSendCode, setShouldSendCode] = useState<boolean>(false);
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [isCodeInputAvailable, setIsCodeInputAvailable] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [verificationCodeRequestErrorMessage, setVerificationCodeRequestErrorMessage] = useState<string | undefined>(undefined);
  useEffect(() => {

    (async () => {

      if (shouldSendCode) {

        try {

          const response = await fetch(`${process.env.REACT_APP_AGREEMENT_CENTER_API}/authentication/verification-code`, {
            method: "POST",
            headers: {
              "email-address": emailAddress,
              "content-type": "application/json"
            }
          });

          const responseJSON = await response.json();

          if (!response.ok) throw new Error(responseJSON.message);

          setIsCodeInputAvailable(true);

        } catch (error) {

          if (error instanceof Error) {

            setVerificationCodeRequestErrorMessage(error.message);

          }
          setShouldSendCode(false);

        }

      }

    })();

  }, [shouldSendCode]);

  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect-path") ?? "/agreements";
  const navigate = useNavigate();
  const [helperTextError, setHelperTextError] = useState<string | undefined>(undefined);

  useEffect(() => {

    (async () => {

      if (isVerifying) {

        try {

          const response = await fetch(`${process.env.REACT_APP_AGREEMENT_CENTER_API}/authentication/access-token`, {
            method: "POST",
            headers: {
              "email-address": emailAddress,
              "verification-code": verificationCode,
              "content-type": "application/json"
            }
          });

          if (response.status === 201) {

            const { accessToken } = await response.json();
            const accessTokenExpireTime = new Date();
            accessTokenExpireTime.setSeconds(accessTokenExpireTime.getSeconds() + 60000);

            document.cookie = `accessToken=${accessToken}; SameSite=Strict; Secure; Path=/`;
  
            const broadcastChannel = new BroadcastChannel("AccessTokenChange");
            broadcastChannel.postMessage(true);
  
            navigate(redirectPath, {replace: true});

          } else if (response.status === 400) {

            throw new Error("The code that you provided was incorrect.");

          } else if (!response.ok) {

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {

              const { message } = await response.json();
              throw new Error(message);

            }

            throw new Error("An unknown error occurred. Try again later.");

          }
          

        } catch (error) {

          if (error instanceof Error) {

            setHelperTextError(error.message);

          }
          setIsVerifying(false);

        }

      }

    })();

  }, [isVerifying]);

  return (
    <main>
      <form id="content" onSubmit={(event) => {
        event.preventDefault();
        setIsVerifying(true);
      }}>
        <p>Please enter an authorized email address. After we authenticate you, you can see the agreements that you have signed, along with any outstanding requests for your signature.</p>
        <Input type="email" helperText={verificationCodeRequestErrorMessage} required value={emailAddress} onChange={({target: {value}}) => setEmailAddress(value)} onKeyDown={(event) => {

          if (event.key === "Enter") {
          
            event.preventDefault();
            setShouldSendCode(true);

          }

        }} disabled={shouldSendCode}>
          Authorized email address
        </Input>
        <section>
          <button type="button" disabled={shouldSendCode} onClick={() => setShouldSendCode(true)}>
            Send code
          </button>
        </section>
        {
          isCodeInputAvailable ? (
            <>
              <p>If <b>{emailAddress}</b> is an authorized email address, a code from Beastslash Agreement Center should be in its inbox, spam, or trash folders. Enter that code below.</p>
              <Input type="text" helperText={helperTextError} required value={verificationCode} onChange={({target: {value}}) => setVerificationCode(value)}>
                Verification code
              </Input>
              <section>
                <button type="submit">Confirm verification code</button>
              </section>
            </>
          ) : null
        }
      </form>
    </main>
  )

}