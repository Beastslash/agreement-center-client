import React, { useState, useEffect, ReactElement } from "react";
import styles from "./ProgressHeader.module.css";
import { useLocation, useSearchParams } from "react-router-dom";

export default function ProgressHeader() {

  const steps = ["Authenticate", "Choose agreement", "Review and sign", "Submit"];
  const [stepComponents, setStepComponents] = useState<ReactElement[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  useEffect(() => {

    const { pathname } = location;

    if (/^\/authenticate\/?$/g.test(pathname)) {

      setCurrentStep(0);

    } else if (/^\/agreements\/?$/g.test(pathname)) {

      setCurrentStep(1);

    } else if (/^\/agreements\/\S+\/\S+$/g.test(pathname)) {

      setCurrentStep(status ? {submit: 3, submitted: 4, sign: 2}[status] ?? 4 : 4);

    }

  }, [location, status]);

  useEffect(() => {

    const newStepComponents = [];
    for (let i = 0; steps.length > i; i++) {

      const isStepComplete = currentStep > i;

      newStepComponents[i] = (
        <li key={i} className={`${styles.item}${currentStep === i ? ` ${styles.selected}` : ""}${isStepComplete ? ` ${styles.completed}` : ""}`}>
          <span className={`${styles.numberCircle}${isStepComplete ? " material-symbols-outlined" : ""}`}>
            {isStepComplete ? "check" : i + 1}
          </span>
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