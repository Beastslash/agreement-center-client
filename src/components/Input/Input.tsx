import React, { InputHTMLAttributes, TextareaHTMLAttributes, useState } from "react";
import styles from "./Input.module.css"

type InputProps = InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function Input({children, type, helperText, ...props}: {children: string, helperText?: string, type: InputProps["type"]} & InputProps): any;
function Input({children, type, helperText, ...props}: {children: string, helperText?: string, type: "textarea"} & TextAreaProps): any;
function Input({children, type, helperText, ...props}: {children: string, helperText?: string, type: InputProps["type"] | "textarea"} & (InputProps | TextAreaProps)) {

  const [isFocused, setIsFocused] = useState<boolean>(false);

  return (
    <section className={`${styles.input}${props.disabled ? ` ${styles.disabled}` : ""}${isFocused ? ` ${styles.focused}` : ""}`}>
      <section>
        <section>
          <span className={styles.leftBorder} />
          <span className={styles.labelContainer}>
            <label>{children}</label>
          </span>
          <span className={styles.rightBorder} />
        </section>
        {type == "textarea" ? <textarea {...props as TextAreaProps} /> : <input type={type} {...props as InputProps} onFocus={(event) => {

          setIsFocused(true);
          if (props.onFocus) props.onFocus(event as any);

        }} onBlur={(event) => {

          setIsFocused(false);
          if (props.onBlur) props.onBlur(event as any);

        }} />}
      </section>
      {helperText ? <p className={styles.helperText}>{helperText}</p> : null}
    </section>
  )

}

export default Input;