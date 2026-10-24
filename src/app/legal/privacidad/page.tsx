import { LegalLayout } from "@/components/layout/LegalLayout";

export default function PrivacidadPage() {
  return (
    <LegalLayout title="Aviso de Privacidad" lastUpdated="15 de Abril, 2026">
      <section>
        <h2>1. Identidad y Domicilio del Responsable</h2>
        <p>
          En cumplimiento con la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong>, NERVE Health Systems, con domicilio comercial y operativo ubicado en Jose Maria Morelos y Pavon #1306, Colonia Independencia, Coatzacoalcos, Veracruz, C.P. 96556, México, informa que es el responsable del tratamiento de los datos personales que usted nos proporcione.
        </p>
      </section>

      <section>
        <h2>2. Datos Personales que Recabamos</h2>
        <p>
          Para la prestación de nuestros servicios, recabamos las siguientes categorías de datos:
        </p>
        <ul>
          <li><strong>Del Usuario (Médico/Personal):</strong> Nombre, correo electrónico, especialidad, cédula profesional, datos bancarios (CLABE, RFC, Banco) para depósitos y datos de contacto.</li>
          <li><strong>De los Pacientes (Controlados por el Usuario):</strong> El Software actúa únicamente como encargado del tratamiento. El Usuario es el Responsable Primario de los datos de salud de sus pacientes. No accedemos a estos datos salvo por requerimiento técnico explícito o mandato legal.</li>
        </ul>
      </section>

      <section>
        <h2>3. Finalidades del Tratamiento</h2>
        <p>
          Sus datos personales son utilizados para:
        </p>
        <ul>
          <li>Proveer la funcionalidad del software de gestión clínica.</li>
          <li>Procesar suscripciones y pagos mediante Stripe.</li>
          <li>Enviar notificaciones críticas sobre la seguridad o el servicio.</li>
          <li>Cumplir con obligaciones legales ante autoridades sanitarias y fiscales.</li>
        </ul>
      </section>

      <section>
        <h2>4. Seguridad y Transferencia de Datos</h2>
        <p>
          Toda la información reside en servidores con cifrado de grado industrial proporcionados por nuestra infraestructura base (Supabase/PostgreSQL). Los datos bancarios y de cobros se transmiten cifrados y de forma directa a <strong>Stripe Inc.</strong> bajo estándares internacionales de seguridad PCI-DSS. 
          <strong>No vendemos ni transferimos sus datos a terceros con fines comerciales.</strong>
        </p>
      </section>

      <section>
        <h2>5. Derechos ARCO</h2>
        <p>
          Usted tiene derecho a conocer qué datos tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (<strong>Acceso</strong>). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (<strong>Rectificación</strong>); que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada conforme a los principios, deberes y obligaciones previstos en la normativa (<strong>Cancelación</strong>); así como oponerse al uso de sus datos personales para fines específicos (<strong>Oposición</strong>).
        </p>
        <p>
          Para el ejercicio de cualquiera de los derechos ARCO, usted deberá enviar la solicitud respectiva a través de nuestro correo electrónico de contacto oficial: <strong>soporte@nervehealthsystems.com</strong>.
        </p>
      </section>
    </LegalLayout>
  );
}
