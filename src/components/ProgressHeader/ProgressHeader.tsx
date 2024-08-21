import React, { useState, useEffect, ReactElement } from "react";
import styles from "./ProgressHeader.module.css";
import { useLocation, useSearchParams } from "react-router-dom";

export default function ProgressHeader() {

  const steps = ["Authenticate", "Choose agreement", "Review and sign", "Submit"];
  const [stepComponents, setStepComponents] = useState<ReactElement[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

  useEffect(() => {

    const { pathname } = location;
    console.log(pathname)
    if (/^\/authentication$/g.test(pathname)) {

      setCurrentStep(0);

    } else if (/^\/agreements$/g.test(pathname)) {

      setCurrentStep(1);

    } else if (/^\/agreements\/\S+\/\S+$/g.test(pathname)) {

      setCurrentStep(mode === "submit" ? 3 : 2);

    }

  }, [location, mode]);

  useEffect(() => {

    const newStepComponents = [];
    for (let i = 0; steps.length > i; i++) {

      newStepComponents[i] = (
        <li key={i} className={`${styles.item} ${currentStep === i ? styles.selected : ""}`}>
          <span className={styles.numberCircle}>{i + 1}</span>
          <label>{steps[i]}</label>
        </li>
      )

    }
    setStepComponents(newStepComponents);

  }, [currentStep]);

  return (
    <ul id={styles.progressHeader}>
      {stepComponents}
    </ul>
  );

}