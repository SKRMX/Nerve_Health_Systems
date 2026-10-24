import { LegalLayout } from "@/components/layout/LegalLayout";

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies" lastUpdated="15 de Abril, 2026">
      <section>
        <h2>¿Qué son las Cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo para recordar información sobre usted, como sus preferencias de inicio de sesión o idioma.
        </p>
      </section>

      <section>
        <h2>Tipos de Cookies que Utilizamos</h2>
        <p>
          En <strong>NERVE Health Systems</strong>, minimizamos el uso de rastreadores para proteger su privacidad. Utilizamos principalmente:
        </p>
        <ul>
          <li><strong>Cookies Esenciales:</strong> Son necesarias para que el sitio funcione. Esto incluye la cookie de sesión de Supabase que le permite mantenerse dentro de su cuenta mientras navega por el dashboard.</li>
          <li><strong>Cookies de Seguridad:</strong> Utilizadas para prevenir fraudes, proteger su cuenta e integridad de los datos clínicos.</li>
          <li><strong>Cookies de Rendimiento:</strong> Podemos utilizar herramientas analíticas ligeras que no identifican al usuario pero nos ayudan a saber si el sitio está cargando rápido o si hay errores técnicos.</li>
        </ul>
      </section>

      <section>
        <h2>Cómo Gestionar las Cookies</h2>
        <p>
          Usted puede restringir o bloquear las cookies a través de la configuración de su navegador. Sin embargo, tenga en cuenta que si bloquea las cookies esenciales, 
          <strong>no podrá iniciar sesión ni utilizar la mayoría de las funcionalidades de NERVE</strong>.
        </p>
      </section>
    </LegalLayout>
  );
}
