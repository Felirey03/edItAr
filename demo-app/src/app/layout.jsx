import './globals.css';

export const metadata = {
  title: 'edItAr Demo App',
  description: 'Next.js application integrated with edItAr Local Editor',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Inject the edItAr browser client script during development */}
        <script src="http://localhost:8080/editar-client.js" async />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
