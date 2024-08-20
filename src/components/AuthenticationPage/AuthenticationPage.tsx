import React, { useEffect, useState } from "react";
import Input from "../Input/Input";

export default function AuthenticationSection() {

  const [shouldSendCode, setShouldSendCode] = useState<boolean>(false);
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [isCodeInputAvailable, setIsCodeInputAvailable] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {

    (async () => {

      if (shouldSendCode) {

        setIsCodeInputAvailable(true);

      }

    })();

  }, [shouldSendCode]);

  useEffect(() => {

    (async () => {

      if (isVerifying) {

        

      }

    })();

  }, [isVerifying]);

  return (
    <main>
      <form onSubmit={(event) => {
        event.preventDefault();
      }}>
        <p>Please enter an authorized email address. After we authenticate you, you can see the agreements that you have signed, along with any outstanding requests for your signature.</p>
        <Input type="email" required value={emailAddress} onChange={({target: {value}}) => setEmailAddress(value)} onKeyDown={(event) => {

          if (event.key === "Enter") setShouldSendCode(true);

        }}>
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
              <Input type="text" helperText="The verification code you provided was incorrect." required value={verificationCode} onChange={({target: {value}}) => setVerificationCode(value)}>
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