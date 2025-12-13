import React from "react";

type Props = {
  error?: string;
  loading: boolean;
  buttonText: string;
  loadingText?: string;
  alt: React.ReactNode;
};

export default function AuthFooter({
  error,
  loading,
  buttonText,
  loadingText,
  alt,
}: Props) {
  return (
    <>
      {error && <div className="auth-error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? loadingText ?? `${buttonText}...` : buttonText}
      </button>

      <p className="auth-alt">{alt}</p>
    </>
  );
}
