import "./Button.css";

export default function Button({
  children, variant = "primary", size = "md", loading = false, icon, ...rest
}) {
  return (
    <button className={`btn btn--${variant} btn--${size}`} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="btn__spinner" /> : icon}
      {children}
    </button>
  );
}
