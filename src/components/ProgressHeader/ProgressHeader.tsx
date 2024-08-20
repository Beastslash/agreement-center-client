import React, { useState, useEffect, ReactElement } from "react";
import styles from "./ProgressHeader.module.css";

export default function ProgressHeader({currentStep}: {currentStep: number}) {

  const steps = ["Authenticate", "Choose agreement", "Review and sign", "Submit"];
  const [stepComponents, setStepComponents] = useState<ReactElement[]>([]); 

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