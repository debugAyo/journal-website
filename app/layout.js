import "./globals.css";
import SessionWrapper from "./SessionWrapper";

export const metadata = {
  title: "Journal Platform",
  description: "Academic Journal Publication System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{<SessionWrapper>{children}</SessionWrapper>}</body>
    </html>
  );
}