import "./globals.css";

export const metadata = {
  title: "Invoice2Spreadsheet",
  description: "Extract invoice data into editable spreadsheets."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
