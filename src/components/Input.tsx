import React, { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;
type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function Input({children, type, helperText, ...props}: {children: string, helperText?: string, type: InputProps["type"]} & InputProps): any;
function Input({children, type, helperText, ...props}: {children: string, helperText?: string, type: "textarea"} & TextAreaProps): any;
function Input({children, type, helperText, ...props}: {children: string, helperText?: string, type: InputProps["type"] | "textarea"} & (InputProps | TextAreaProps)) {

  return (
    <section className={`input${props.disabled ? " disabled" : ""}`}>
      <section>
        <section>
          <span />
          <span className={"inputContainer"}>
            <label>{children}</label>
          </span>
          <span />
        </section>
        {type == "textarea" ? <textarea {...props as TextAreaProps} /> : <input type={type} {...props as InputProps} />}
      </section>
      {helperText ? <p className="helperText">{helperText}</p> : null}
    </section>
  )

}

export default Input;