import React from 'react';

export const metadata = {
  title: 'Sistema Agromecánica',
  description: 'Gestión de Stock y Pedidos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
